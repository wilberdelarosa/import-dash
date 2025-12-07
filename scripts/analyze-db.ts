/**
 * Script para analizar la base de datos Supabase
 * Ejecutar con: npx tsx scripts/analyze-db.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ocsptehtkawcpcgckqeh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3B0ZWh0a2F3Y3BjZ2NrcWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDk4NzAsImV4cCI6MjA3NjAyNTg3MH0.Ltef7RkRnoelwv-yD-qlw7jZGt_yWT70F8MwcbfufbQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeDatabase() {
  console.log('🔍 Analizando base de datos Supabase...\n');
  console.log('URL:', SUPABASE_URL);
  console.log('Project ID: ocsptehtkawcpcgckqeh\n');

  // 1. Obtener lista de tablas principales
  const tables = [
    'equipos',
    'mantenimientos_programados',
    'mantenimientos_realizados',
    'inventarios',
    'notificaciones',
    'roles',
    'user_roles',
    'maintenance_submissions',
    'submission_attachments',
    'planes_mantenimiento',
    'kits_mantenimiento',
  ];

  console.log('📊 CONTEO DE REGISTROS POR TABLA:\n');
  console.log('─'.repeat(50));

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count ?? 0} registros`);
      }
    } catch (e) {
      console.log(`⚠️ ${table}: No accesible`);
    }
  }

  // 2. Ver equipos activos
  console.log('\n📦 EQUIPOS ACTIVOS:\n');
  console.log('─'.repeat(50));
  
  const { data: equipos, error: equiposError } = await supabase
    .from('equipos')
    .select('id, ficha, nombre, marca, modelo, activo')
    .eq('activo', true)
    .limit(10);

  if (equiposError) {
    console.log('Error:', equiposError.message);
  } else if (equipos) {
    equipos.forEach(eq => {
      console.log(`• [${eq.ficha}] ${eq.nombre} - ${eq.marca} ${eq.modelo}`);
    });
    console.log(`... (mostrando ${equipos.length} de los activos)`);
  }

  // 3. Ver roles disponibles
  console.log('\n👥 ROLES DISPONIBLES:\n');
  console.log('─'.repeat(50));

  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*');

  if (rolesError) {
    console.log('Error:', rolesError.message);
  } else if (roles) {
    roles.forEach(role => {
      console.log(`• ${role.name}: ${role.description || 'Sin descripción'}`);
    });
  }

  // 4. Ver submissions pendientes (mecánico)
  console.log('\n📝 SUBMISSIONS DE MECÁNICOS:\n');
  console.log('─'.repeat(50));

  const { data: submissions, error: subError } = await supabase
    .from('maintenance_submissions')
    .select('id, status, created_at, equipo_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (subError) {
    console.log('Error o tabla no existe:', subError.message);
  } else if (submissions && submissions.length > 0) {
    submissions.forEach(sub => {
      console.log(`• ${sub.id.slice(0,8)}... | Estado: ${sub.status} | Equipo: ${sub.equipo_id}`);
    });
  } else {
    console.log('No hay submissions aún');
  }

  // 5. Ver notificaciones recientes
  console.log('\n🔔 NOTIFICACIONES RECIENTES:\n');
  console.log('─'.repeat(50));

  const { data: notifs, error: notifError } = await supabase
    .from('notificaciones')
    .select('id, tipo, titulo, leida, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifError) {
    console.log('Error:', notifError.message);
  } else if (notifs && notifs.length > 0) {
    notifs.forEach(n => {
      const status = n.leida ? '✓' : '○';
      console.log(`${status} [${n.tipo}] ${n.titulo}`);
    });
  } else {
    console.log('No hay notificaciones');
  }

  // 6. Verificar si el bucket submissions existe
  console.log('\n📦 STORAGE BUCKETS:\n');
  console.log('─'.repeat(50));

  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets();

  if (bucketsError) {
    console.log('Error al listar buckets:', bucketsError.message);
  } else if (buckets) {
    if (buckets.length === 0) {
      console.log('⚠️ No hay buckets creados');
      console.log('   → Necesitas crear el bucket "submissions" para las fotos');
    } else {
      buckets.forEach(b => {
        console.log(`• ${b.name} (${b.public ? 'público' : 'privado'})`);
      });
      
      const hasSubmissions = buckets.some(b => b.name === 'submissions');
      if (!hasSubmissions) {
        console.log('\n⚠️ El bucket "submissions" NO existe');
        console.log('   → Créalo en Supabase Dashboard > Storage');
      }
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Análisis completado');
}

analyzeDatabase().catch(console.error);
