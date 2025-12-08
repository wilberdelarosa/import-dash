import { createClient } from '@supabase/supabase-js';

// Ajusta si necesitas usar SERVICE ROLE KEY en entorno
const SUPABASE_URL = 'https://ocsptehtkawcpcgckqeh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || '';
const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON;

if (!key) {
  console.error('❌ Necesitas definir SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY en el entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, key);

async function main() {
  console.log('🔎 Buscando plan objetivo (EC140DL)...');
  const { data: plan } = await supabase
    .from('planes_mantenimiento')
    .select('id, nombre, modelo')
    .eq('modelo', 'EC140DL')
    .limit(1)
    .single();

  if (!plan) {
    console.error('❌ No se encontró plan EC140DL');
    process.exit(1);
  }

  console.log('➡️  Usaremos plan:', plan.nombre, `(id=${plan.id})`);

  // Crear override de prueba para ficha AC-023
  const payload = {
    ficha_equipo: 'AC-023',
    plan_original_id: null,
    plan_forzado_id: plan.id,
    motivo: 'Prueba sincronización - override de prueba',
    usuario_email: 'tester@local.test'
  };

  const { data, error } = await supabase
    .from('overrides_planes')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando override:', error.message || error);
    process.exit(1);
  }

  console.log('✅ Override creado:', data);

  // Leer vista equipos_con_overrides para verificar
  const { data: view, error: viewErr } = await supabase
    .from('equipos_con_overrides')
    .select('*')
    .eq('ficha_equipo', 'AC-023')
    .limit(10);

  if (viewErr) {
    console.error('⚠️  Error leyendo equipos_con_overrides:', viewErr.message || viewErr);
  } else {
    console.log('ℹ️  equipos_con_overrides para AC-023:', view);
  }

  console.log('\n✅ Test completado.');
}

main().catch((e) => { console.error(e); process.exit(1); });
