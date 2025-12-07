/**
 * Script para configurar roles y ejecutar setup inicial
 * Ejecutar con: npx tsx scripts/setup-roles.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ocsptehtkawcpcgckqeh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3B0ZWh0a2F3Y3BjZ2NrcWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDk4NzAsImV4cCI6MjA3NjAyNTg3MH0.Ltef7RkRnoelwv-yD-qlw7jZGt_yWT70F8MwcbfufbQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupRoles() {
  console.log('🔧 Configurando roles en Supabase...\n');

  // Verificar si existe la tabla roles y tiene datos
  const { data: existingRoles, error: checkError } = await supabase
    .from('roles')
    .select('*');

  if (checkError) {
    console.log('⚠️ La tabla roles no existe o no es accesible');
    console.log('   Error:', checkError.message);
    console.log('\n📌 Necesitas ejecutar la migración SQL en Supabase Dashboard:');
    console.log('   1. Ve a SQL Editor en tu proyecto Supabase');
    console.log('   2. Ejecuta el archivo: supabase/migrations/20251205175513_*.sql');
    return;
  }

  if (existingRoles && existingRoles.length > 0) {
    console.log('✅ Roles ya configurados:');
    existingRoles.forEach(r => console.log(`   • ${r.name}`));
    return;
  }

  // Intentar crear roles básicos
  console.log('Intentando crear roles...');
  
  const rolesToCreate = [
    { name: 'admin', description: 'Administrador con acceso completo' },
    { name: 'supervisor', description: 'Supervisor - acceso de solo lectura a dashboards y reportes' },
    { name: 'mechanic', description: 'Mecánico - puede reportar mantenimientos' },
    { name: 'user', description: 'Usuario básico' },
  ];

  for (const role of rolesToCreate) {
    const { error } = await supabase
      .from('roles')
      .insert(role);
    
    if (error) {
      console.log(`❌ Error creando rol ${role.name}:`, error.message);
    } else {
      console.log(`✅ Rol ${role.name} creado`);
    }
  }
}

async function checkMigrations() {
  console.log('\n📋 Verificando estado de migraciones...\n');

  // Verificar tablas críticas
  const criticalTables = [
    { name: 'maintenance_submissions', required: true },
    { name: 'submission_attachments', required: true },
    { name: 'roles', required: true },
    { name: 'user_roles', required: true },
  ];

  for (const table of criticalTables) {
    const { error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (error && error.message.includes('not find')) {
      console.log(`❌ ${table.name}: NO EXISTE - Necesita migración`);
    } else if (error) {
      console.log(`⚠️ ${table.name}: ${error.message}`);
    } else {
      console.log(`✅ ${table.name}: OK`);
    }
  }

  // Verificar funciones RPC
  console.log('\n🔧 Verificando funciones RPC...\n');

  const rpcs = [
    'approve_and_integrate_submission',
    'reject_submission',
    'has_role',
  ];

  for (const rpc of rpcs) {
    try {
      // Intentar llamar con parámetros inválidos solo para ver si existe
      const { error } = await supabase.rpc(rpc, {});
      
      if (error && error.message.includes('does not exist')) {
        console.log(`❌ ${rpc}: NO EXISTE`);
      } else {
        console.log(`✅ ${rpc}: Existe`);
      }
    } catch (e) {
      console.log(`⚠️ ${rpc}: No verificable`);
    }
  }
}

async function showSQLToRun() {
  console.log('\n' + '═'.repeat(60));
  console.log('📌 SQL A EJECUTAR EN SUPABASE DASHBOARD');
  console.log('═'.repeat(60));
  console.log(`
Si la tabla 'roles' no existe, ejecuta esto en SQL Editor:

-- Crear tabla de roles si no existe
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar roles por defecto
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Administrador con acceso completo'),
  ('supervisor', 'Supervisor - acceso de solo lectura a dashboards y reportes'),
  ('mechanic', 'Mecánico - puede reportar mantenimientos'),
  ('user', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;

-- Crear tabla user_roles si no existe  
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura
CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user_roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Función has_role
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND r.name = role_name
  );
END;
$$;
`);
}

async function main() {
  await setupRoles();
  await checkMigrations();
  await showSQLToRun();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📦 ACCIÓN REQUERIDA PARA STORAGE:');
  console.log('═'.repeat(60));
  console.log(`
1. Ve a Supabase Dashboard > Storage
2. Clic en "New bucket"
3. Nombre: submissions
4. Dejarlo como PRIVADO
5. Configurar políticas RLS según docs/DEPLOY_ROLES_MECANICO_SUPERVISOR.md
`);
}

main().catch(console.error);
