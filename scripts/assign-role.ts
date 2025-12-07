#!/usr/bin/env tsx
/**
 * Script para asignar un rol a un usuario por email usando la Service Role Key de Supabase
 * Uso: SUPABASE_SERVICE_ROLE_KEY='<key>' npx tsx scripts/assign-role.ts user@example.com [role]
 */

const SUPABASE_URL = 'https://ocsptehtkawcpcgckqeh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Debes exportar SUPABASE_SERVICE_ROLE_KEY en el entorno antes de ejecutar este script.');
  process.exit(1);
}

const email = process.argv[2] || 'wilber.alitoeirl@gmail.com';
const roleName = process.argv[3] || 'mechanic';

(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`🔎 Buscando/creando rol '${roleName}'`);
    const upsertRole = await supabase.from('roles').upsert({ name: roleName, description: roleName === 'mechanic' ? 'Mecánico - reporta mantenimientos' : roleName }, { onConflict: 'name' });
    if (upsertRole.error) {
      console.error('ERROR al upsert role:', upsertRole.error.message || upsertRole.error);
      process.exit(1);
    }

    const { data: roleRows, error: roleSelectErr } = await supabase.from('roles').select('id').eq('name', roleName).limit(1);
    if (roleSelectErr || !roleRows || roleRows.length === 0) {
      console.error('ERROR: no se pudo obtener el rol creado:', roleSelectErr || roleRows);
      process.exit(1);
    }
    const roleId = roleRows[0].id;

    console.log(`🔎 Buscando usuario con email '${email}' en auth.users`);
    const { data: users, error: userErr } = await supabase.from('auth.users').select('id,email').eq('email', email).limit(1);
    if (userErr) {
      console.error('ERROR al buscar usuario en auth.users:', userErr.message || userErr);
      process.exit(1);
    }
    if (!users || users.length === 0) {
      console.error(`ERROR: usuario con email '${email}' no encontrado en auth.users. Pide al usuario que se registre o crea el usuario en Auth.`);
      process.exit(1);
    }
    const userId = users[0].id;

    console.log(`➡️ Asignando role_id=${roleId} al user_id=${userId}`);
    const { error: upsertUR } = await supabase.from('user_roles').upsert({ user_id: userId, role_id: roleId }, { onConflict: 'user_id,role_id' });
    if (upsertUR) {
      console.error('ERROR al asignar role:', upsertUR.message || upsertUR);
      process.exit(1);
    }

    console.log('✅ Rol asignado correctamente');
    process.exit(0);
  } catch (err: unknown) {
    console.error('ERROR inesperado:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
