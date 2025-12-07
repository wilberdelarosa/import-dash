#!/usr/bin/env tsx
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCRIPT MAESTRO DE ADMINISTRACIÓN DE BASE DE DATOS - Import Dash
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Este script proporciona control total sobre la base de datos de Supabase
 * desde la consola, incluyendo:
 * 
 *   - Verificar estado de la BD
 *   - Asignar roles a usuarios
 *   - Ejecutar migraciones
 *   - Listar usuarios y sus roles
 *   - Crear/actualizar equipos
 * 
 * REQUISITOS EN .env:
 *   VITE_SUPABASE_URL=https://ocsptehtkawcpcgckqeh.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY=eyJ... (anon key)
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...     (service role - REQUERIDO para admin)
 * 
 * USO:
 *   npx tsx scripts/db-admin.ts [comando] [opciones]
 * 
 * COMANDOS:
 *   status          - Ver estado de la BD
 *   list-users      - Listar usuarios y roles
 *   assign-role     - Asignar rol: assign-role email@test.com admin
 *   run-migrations  - Ejecutar migraciones pendientes
 *   help            - Mostrar ayuda
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://ocsptehtkawcpcgckqeh.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3B0ZWh0a2F3Y3BjZ2NrcWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDk4NzAsImV4cCI6MjA3NjAyNTg3MH0.Ltef7RkRnoelwv-yD-qlw7jZGt_yWT70F8MwcbfufbQ';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

type AppRole = 'admin' | 'supervisor' | 'mechanic' | 'user';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bold}${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
};

function getClient(useServiceRole = false): SupabaseClient {
  const key = useServiceRole && SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY : ANON_KEY;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMANDOS
// ═══════════════════════════════════════════════════════════════════════════════

async function checkStatus() {
  log.title('ESTADO DE LA BASE DE DATOS');
  
  const supabase = getClient();
  
  // Verificar conexión
  log.info('Verificando conexión...');
  const { error: connError } = await supabase.from('equipos').select('count', { count: 'exact', head: true });
  if (connError) {
    log.error(`Error de conexión: ${connError.message}`);
    return;
  }
  log.success('Conexión OK');
  
  // Contar registros en tablas principales
  const tables = ['equipos', 'inventarios', 'mantenimientos_programados', 'user_roles', 'maintenance_submissions'];
  
  console.log('\n📊 Conteo de registros:\n');
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`   ${colors.red}✗${colors.reset} ${table}: ${error.message.includes('not find') ? 'NO EXISTE' : error.message}`);
    } else {
      console.log(`   ${colors.green}✓${colors.reset} ${table}: ${count ?? 0} registros`);
    }
  }
  
  // Verificar columna empresa en equipos
  console.log('\n🏢 Verificando columna "empresa" en equipos:\n');
  const { data: equipoSample, error: equipoError } = await supabase.from('equipos').select('*').limit(1);
  if (equipoError) {
    log.error('Error al verificar equipos');
  } else if (equipoSample && equipoSample[0]) {
    const hasEmpresa = 'empresa' in equipoSample[0];
    if (hasEmpresa) {
      log.success(`Columna "empresa" existe (valor actual: ${equipoSample[0].empresa})`);
    } else {
      log.warn('Columna "empresa" NO existe - Ejecuta la migración');
    }
  }
  
  // Verificar roles disponibles en enum
  console.log('\n👥 Verificando sistema de roles:\n');
  const { data: roleData, error: roleError } = await supabase.from('user_roles').select('role').limit(10);
  if (roleError) {
    log.error(`Error verificando roles: ${roleError.message}`);
  } else {
    const uniqueRoles = [...new Set(roleData?.map(r => r.role) || [])];
    log.success(`Roles en uso: ${uniqueRoles.join(', ') || 'ninguno'}`);
  }
  
  // Verificar funciones RPC
  console.log('\n🔧 Verificando funciones RPC:\n');
  
  // has_role - usa parámetros _user_id y _role
  const { error: hasRoleErr } = await supabase.rpc('has_role', { 
    _user_id: '00000000-0000-0000-0000-000000000000', 
    _role: 'user' 
  });
  if (hasRoleErr?.message?.includes('does not exist')) {
    console.log(`   ${colors.red}✗${colors.reset} has_role: NO EXISTE`);
  } else {
    console.log(`   ${colors.green}✓${colors.reset} has_role: OK`);
  }
  
  // approve_and_integrate_submission - usa p_submission_id y p_admin_feedback
  const { error: approveErr } = await supabase.rpc('approve_and_integrate_submission', { 
    p_submission_id: '00000000-0000-0000-0000-000000000000', 
    p_admin_feedback: 'test' 
  });
  if (approveErr?.message?.includes('does not exist') || approveErr?.message?.includes('function')) {
    console.log(`   ${colors.red}✗${colors.reset} approve_and_integrate_submission: NO EXISTE`);
  } else {
    console.log(`   ${colors.green}✓${colors.reset} approve_and_integrate_submission: OK`);
  }
  
  // reject_submission - usa p_submission_id y p_feedback
  const { error: rejectErr } = await supabase.rpc('reject_submission', { 
    p_submission_id: '00000000-0000-0000-0000-000000000000', 
    p_feedback: 'test' 
  });
  if (rejectErr?.message?.includes('does not exist') || rejectErr?.message?.includes('function')) {
    console.log(`   ${colors.red}✗${colors.reset} reject_submission: NO EXISTE`);
  } else {
    console.log(`   ${colors.green}✓${colors.reset} reject_submission: OK`);
  }
}

async function listUsers() {
  log.title('USUARIOS Y ROLES');
  
  if (!SERVICE_ROLE_KEY) {
    log.error('Se requiere SUPABASE_SERVICE_ROLE_KEY para listar usuarios');
    log.info('Configura: $env:SUPABASE_SERVICE_ROLE_KEY="tu-key"');
    return;
  }
  
  const supabase = getClient(true);
  
  // Obtener usuarios con roles usando la función RPC
  const { data: usersWithRoles, error } = await supabase.rpc('get_users_with_emails');
  
  if (error) {
    log.error(`Error: ${error.message}`);
    
    // Fallback: obtener solo de user_roles
    const { data: roles, error: roleError } = await supabase.from('user_roles').select('*');
    if (roleError) {
      log.error(`No se puede obtener información de roles: ${roleError.message}`);
      return;
    }
    
    console.log('\n📋 Roles asignados (sin emails):\n');
    console.log('   user_id                                 | role');
    console.log('   ----------------------------------------|--------');
    roles?.forEach(r => {
      console.log(`   ${r.user_id} | ${r.role}`);
    });
    return;
  }
  
  console.log('\n📋 Usuarios registrados:\n');
  console.log('   Email                              | Rol       | Último acceso');
  console.log('   -----------------------------------|-----------|------------------');
  
  for (const user of usersWithRoles || []) {
    // Obtener rol del usuario
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    const role = roleData?.role || 'sin rol';
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'nunca';
    
    console.log(`   ${user.email?.padEnd(35)} | ${String(role).padEnd(9)} | ${lastSignIn}`);
  }
}

async function assignRole(email: string, role: AppRole) {
  log.title(`ASIGNAR ROL: ${role} → ${email}`);
  
  if (!SERVICE_ROLE_KEY) {
    log.error('Se requiere SUPABASE_SERVICE_ROLE_KEY para asignar roles');
    log.info('Configura: $env:SUPABASE_SERVICE_ROLE_KEY="tu-key"');
    showServiceKeyHelp();
    return;
  }
  
  const validRoles: AppRole[] = ['admin', 'supervisor', 'mechanic', 'user'];
  if (!validRoles.includes(role)) {
    log.error(`Rol inválido: ${role}`);
    log.info(`Roles válidos: ${validRoles.join(', ')}`);
    return;
  }
  
  const supabase = getClient(true);
  
  // Buscar usuario por email
  log.info(`Buscando usuario con email: ${email}`);
  
  const { data: users, error: userError } = await supabase.rpc('get_users_with_emails');
  
  if (userError) {
    log.error(`Error buscando usuario: ${userError.message}`);
    return;
  }
  
  interface UserRecord {
    id: string;
    email: string;
    last_sign_in_at?: string;
  }
  
  const user = (users as UserRecord[] | null)?.find((u) => u.email === email);
  
  if (!user) {
    log.error(`Usuario no encontrado: ${email}`);
    log.info('El usuario debe registrarse primero en la aplicación');
    return;
  }
  
  log.success(`Usuario encontrado: ${user.id}`);
  
  // Verificar si ya tiene un rol
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (existingRole) {
    log.info(`Rol actual: ${existingRole.role}`);
    
    // Actualizar rol
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', user.id);
    
    if (updateError) {
      log.error(`Error actualizando rol: ${updateError.message}`);
      return;
    }
    
    log.success(`Rol actualizado: ${existingRole.role} → ${role}`);
  } else {
    // Insertar nuevo rol
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role });
    
    if (insertError) {
      log.error(`Error asignando rol: ${insertError.message}`);
      return;
    }
    
    log.success(`Rol asignado: ${role}`);
  }
}

async function runMigrations() {
  log.title('EJECUTAR MIGRACIONES');
  
  if (!SERVICE_ROLE_KEY) {
    log.error('Se requiere SUPABASE_SERVICE_ROLE_KEY para ejecutar migraciones');
    showMigrationInstructions();
    return;
  }
  
  log.warn('Las migraciones DDL (ALTER TABLE, CREATE TABLE) no se pueden ejecutar con la API REST');
  log.info('Debes ejecutarlas manualmente en el SQL Editor de Supabase Dashboard');
  
  showMigrationInstructions();
}

function showMigrationInstructions() {
  console.log(`
${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}
${colors.bold}${colors.cyan}   MIGRACIONES PENDIENTES - EJECUTAR EN SUPABASE SQL EDITOR${colors.reset}
${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}

${colors.yellow}1. MIGRACIÓN: Agregar columna "empresa" a equipos${colors.reset}
   Archivo: supabase/migrations/20251207_agregar_empresa_equipos.sql
   
   ${colors.white}SQL:${colors.reset}
   ${colors.cyan}ALTER TABLE equipos ADD COLUMN IF NOT EXISTS empresa TEXT DEFAULT 'ALITO GROUP SRL';
   UPDATE equipos SET empresa = 'ALITO GROUP SRL' WHERE empresa IS NULL;
   ALTER TABLE equipos ALTER COLUMN empresa SET NOT NULL;
   ALTER TABLE equipos ADD CONSTRAINT check_empresa_valida 
     CHECK (empresa IN ('ALITO GROUP SRL', 'ALITO EIRL'));
   CREATE INDEX IF NOT EXISTS idx_equipos_empresa ON equipos(empresa);${colors.reset}

${colors.yellow}2. MIGRACIÓN: Agregar rol "supervisor" al enum${colors.reset}
   (Si no está ya aplicada)
   
   ${colors.cyan}ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';${colors.reset}

${colors.yellow}3. MIGRACIÓN: Agregar rol "mechanic" al enum${colors.reset}
   (Si no está ya aplicada)
   
   ${colors.cyan}ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mechanic';${colors.reset}

${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}
${colors.green}URL del Dashboard: https://supabase.com/dashboard/project/ocsptehtkawcpcgckqeh${colors.reset}
${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}
`);
}

function showServiceKeyHelp() {
  console.log(`
${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}
${colors.bold}${colors.cyan}   CÓMO OBTENER LA SERVICE ROLE KEY${colors.reset}
${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}

1. Ve a: ${colors.cyan}https://supabase.com/dashboard/project/ocsptehtkawcpcgckqeh/settings/api${colors.reset}

2. En la sección "Project API keys", busca "service_role" (secret)

3. Copia la key y configúrala:

   ${colors.yellow}PowerShell:${colors.reset}
   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ...tu-service-role-key..."
   
   ${colors.yellow}Bash:${colors.reset}
   export SUPABASE_SERVICE_ROLE_KEY="eyJ...tu-service-role-key..."
   
   ${colors.yellow}O agrégala al .env:${colors.reset}
   SUPABASE_SERVICE_ROLE_KEY="eyJ...tu-service-role-key..."

4. Vuelve a ejecutar el comando

${colors.red}⚠️  IMPORTANTE: La service_role key tiene acceso TOTAL a la BD. 
   Nunca la expongas en el frontend ni la subas a Git.${colors.reset}

${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}
`);
}

function showHelp() {
  console.log(`
${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}
${colors.bold}${colors.cyan}   DB-ADMIN - Herramienta de Administración de Base de Datos${colors.reset}
${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}

${colors.yellow}USO:${colors.reset}
  npx tsx scripts/db-admin.ts [comando] [opciones]

${colors.yellow}COMANDOS DISPONIBLES:${colors.reset}

  ${colors.green}status${colors.reset}              Ver estado de la BD (tablas, roles, funciones)
  
  ${colors.green}list-users${colors.reset}          Listar todos los usuarios y sus roles
                      Requiere: SUPABASE_SERVICE_ROLE_KEY
  
  ${colors.green}assign-role${colors.reset}         Asignar rol a un usuario
                      Uso: assign-role email@test.com [admin|supervisor|mechanic|user]
                      Requiere: SUPABASE_SERVICE_ROLE_KEY
  
  ${colors.green}run-migrations${colors.reset}      Ver instrucciones para ejecutar migraciones
  
  ${colors.green}help${colors.reset}                Mostrar esta ayuda

${colors.yellow}EJEMPLOS:${colors.reset}

  # Ver estado de la BD
  npx tsx scripts/db-admin.ts status
  
  # Listar usuarios (requiere service key)
  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; npx tsx scripts/db-admin.ts list-users
  
  # Asignar rol admin
  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; npx tsx scripts/db-admin.ts assign-role admin@test.com admin
  
  # Asignar rol mecánico
  npx tsx scripts/db-admin.ts assign-role wilber.alitoeirl@gmail.com mechanic

${colors.yellow}CONFIGURACIÓN REQUERIDA EN .env:${colors.reset}

  ${colors.white}# Requerido para lectura básica:${colors.reset}
  VITE_SUPABASE_URL="https://ocsptehtkawcpcgckqeh.supabase.co"
  VITE_SUPABASE_PUBLISHABLE_KEY="eyJ...anon-key..."
  
  ${colors.white}# Requerido para operaciones admin (asignar roles, listar usuarios):${colors.reset}
  SUPABASE_SERVICE_ROLE_KEY="eyJ...service-role-key..."

${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  console.log(`
${colors.bold}${colors.magenta}╔════════════════════════════════════════════════════════════════╗
║          IMPORT-DASH DATABASE ADMINISTRATOR                    ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
`);

  console.log(`${colors.cyan}Supabase URL:${colors.reset} ${SUPABASE_URL}`);
  console.log(`${colors.cyan}Service Key:${colors.reset} ${SERVICE_ROLE_KEY ? colors.green + '✓ Configurada' : colors.yellow + '✗ No configurada'}${colors.reset}\n`);
  
  switch (command) {
    case 'status':
      await checkStatus();
      break;
      
    case 'list-users':
      await listUsers();
      break;
      
    case 'assign-role': {
      const email = args[1];
      const role = args[2] as AppRole;
      if (!email) {
        log.error('Falta el email del usuario');
        log.info('Uso: assign-role email@test.com [admin|supervisor|mechanic|user]');
        return;
      }
      await assignRole(email, role || 'user');
      break;
    }
      
    case 'run-migrations':
      await runMigrations();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

main().catch(console.error);
