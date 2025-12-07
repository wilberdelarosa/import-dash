/**
 * Script para ejecutar migraciones SQL usando la API REST de Supabase
 * Ejecutar con: npx tsx scripts/run-migration.ts
 */

const SUPABASE_URL = 'https://ocsptehtkawcpcgckqeh.supabase.co';
// Use a service role key for administrative actions (create buckets, run admin SQL)
// Provide it via environment variable `SUPABASE_SERVICE_ROLE_KEY` for security.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

import * as fs from 'fs';
import * as path from 'path';

async function executeSQLviaRPC(sql: string, description: string) {
  console.log(`\n🔄 Ejecutando: ${description}...`);
  
  // Preferir service role key for admin actions
  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!keyToUse) {
    console.log('❌ No se proporcionó ninguna clave de Supabase. Exporta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY en el entorno.');
    return false;
  }

  // Usamos la ruta RPC si existe
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': keyToUse,
      'Authorization': `Bearer ${keyToUse}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`⚠️  RPC exec_sql no disponible: ${response.status}`);
    return false;
  }

  console.log(`✅ ${description} - Completado`);
  return true;
}

async function createBucketViaAPI() {
  console.log('\n📦 Creando bucket "submissions"...');
  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!keyToUse) {
    console.log('❌ No se proporcionó ninguna clave para crear buckets. Exporta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY.');
    return false;
  }

  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': keyToUse,
      'Authorization': `Bearer ${keyToUse}`,
    },
    body: JSON.stringify({
      id: 'submissions',
      name: 'submissions',
      public: false,
      file_size_limit: 10485760, // 10MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    }),
  });

  if (response.ok) {
    console.log('✅ Bucket "submissions" creado exitosamente');
    return true;
  } else {
    const error = await response.json().catch(() => ({}));
    if (error.message?.includes('already exists')) {
      console.log('✅ Bucket "submissions" ya existe');
      return true;
    }
    console.log(`❌ Error creando bucket: ${JSON.stringify(error)}`);
    return false;
  }
}

async function listBuckets() {
  console.log('\n📦 Verificando buckets existentes...');
  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!keyToUse) {
    console.log('❌ No se proporcionó ninguna clave para listar buckets. Exporta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY.');
    return [];
  }

  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: {
      'apikey': keyToUse,
      'Authorization': `Bearer ${keyToUse}`,
    },
  });

  if (response.ok) {
    const buckets = await response.json();
    console.log('Buckets encontrados:', buckets.map((b: { name: string }) => b.name).join(', ') || 'Ninguno');
    return buckets;
  }
  return [];
}

async function insertRoles() {
  console.log('\n👥 Insertando roles...');
  const { createClient } = await import('@supabase/supabase-js');
  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!keyToUse) {
    console.log('❌ No se proporcionó ninguna clave para insertar roles. Exporta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY.');
    return;
  }
  const supabase = createClient(SUPABASE_URL, keyToUse);

  const roles = [
    { name: 'admin', description: 'Administrador con acceso completo' },
    { name: 'supervisor', description: 'Supervisor - solo lectura' },
    { name: 'mechanic', description: 'Mecánico - reporta mantenimientos' },
    { name: 'user', description: 'Usuario básico' },
  ];

  for (const role of roles) {
    const { error } = await supabase.from('roles').upsert(role, { onConflict: 'name' });
    if (error) {
      console.log(`   ⚠️ ${role.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${role.name}`);
    }
  }
}

async function checkTables() {
  console.log('\n📋 Verificando tablas...');
  const { createClient } = await import('@supabase/supabase-js');
  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!keyToUse) {
    console.log('❌ No se proporcionó ninguna clave para verificar tablas. Exporta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY.');
    return;
  }
  const supabase = createClient(SUPABASE_URL, keyToUse);

  const tables = [
    'maintenance_submissions',
    'submission_attachments', 
    'roles',
    'user_roles',
    'equipos',
    'mantenimientos_programados',
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: ${count ?? 0} registros`);
    }
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 EJECUTANDO SETUP DE BASE DE DATOS');
  console.log('═'.repeat(60));
  console.log(`URL: ${SUPABASE_URL}`);

  // 1. Verificar tablas
  await checkTables();

  // 2. Intentar crear bucket
  await listBuckets();
  await createBucketViaAPI();

  // 3. Insertar roles
  await insertRoles();

  // 4. Verificar estado final
  console.log('\n' + '═'.repeat(60));
  console.log('📊 ESTADO FINAL');
  console.log('═'.repeat(60));
  await checkTables();
  await listBuckets();

  console.log('\n✅ Setup completado');
}

main().catch(console.error);
