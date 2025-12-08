/**
 * Script para aplicar migración de planes Volvo usando Supabase JS Client
 * Ejecutar con: npx tsx scripts/apply-volvo-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Credenciales de Supabase (del proyecto)
const SUPABASE_URL = 'https://ocsptehtkawcpcgckqeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3B0ZWh0a2F3Y3BjZ2NrcWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDk4NzAsImV4cCI6MjA3NjAyNTg3MH0.Ltef7RkRnoelwv-yD-qlw7jZGt_yWT70F8MwcbfufbQ';

// Service Role Key se debe proporcionar como variable de entorno para operaciones admin
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

async function verificarConexion() {
  console.log('🔌 Verificando conexión a Supabase...');
  
  const { data, error } = await supabase
    .from('planes_mantenimiento')
    .select('count')
    .limit(1);
  
  if (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
  
  console.log('✅ Conexión exitosa a Supabase');
  return true;
}

async function verificarPlanesVolvoExistentes() {
  console.log('\n📋 Verificando planes Volvo existentes...');
  
  const { data, error } = await supabase
    .from('planes_mantenimiento')
    .select('id, nombre, marca, modelo')
    .eq('marca', 'Volvo');
  
  if (error) {
    console.log('⚠️  Error verificando planes:', error.message);
    return [];
  }
  
  if (data && data.length > 0) {
    console.log(`ℹ️  Ya existen ${data.length} planes Volvo:`);
    data.forEach(p => console.log(`   - ${p.nombre} (${p.modelo})`));
  } else {
    console.log('ℹ️  No hay planes Volvo existentes');
  }
  
  return data || [];
}

async function crearPlanesVolvo() {
  console.log('\n🔧 Creando planes de mantenimiento Volvo...');
  
  const planes = [
    {
      nombre: 'Plan Mantenimiento Volvo EC55D',
      descripcion: 'Plan de mantenimiento preventivo para miniretro compacta Volvo EC55D. Motor Volvo D2.6A (55.4 HP). Peso operacional 5.5 ton. Ciclo completo PM1-PM4.',
      marca: 'Volvo',
      modelo: 'EC55D',
      categoria: 'Miniretro',
      activo: true
    },
    {
      nombre: 'Plan Mantenimiento Volvo EC140DL',
      descripcion: 'Plan de mantenimiento preventivo para excavadora mediana Volvo EC140DL/140DL. Motor Volvo D4J (104 HP). Peso operacional 14.5 ton. Ciclo completo PM1-PM4.',
      marca: 'Volvo',
      modelo: 'EC140DL',
      categoria: 'Excavadora',
      activo: true
    },
    {
      nombre: 'Plan Mantenimiento Volvo 140DL',
      descripcion: 'Plan de mantenimiento preventivo para excavadora Volvo 140DL (alias EC140DL). Motor Volvo D4J (104 HP). Peso operacional 14.5 ton. Ciclo completo PM1-PM4.',
      marca: 'Volvo',
      modelo: '140DL',
      categoria: 'Excavadora',
      activo: true
    }
  ];
  
  const planesCreados: Array<{ id: number }> = [];
  
  for (const plan of planes) {
    // Verificar si ya existe
    const { data: existe } = await supabase
      .from('planes_mantenimiento')
      .select('id')
      .eq('marca', plan.marca)
      .eq('modelo', plan.modelo)
      .single();
    
    if (existe) {
      console.log(`   ⏭️  ${plan.modelo} ya existe, omitiendo...`);
      planesCreados.push(existe);
      continue;
    }
    
    const { data, error } = await supabase
      .from('planes_mantenimiento')
      .insert(plan)
      .select()
      .single();
    
    if (error) {
      console.log(`   ❌ Error creando plan ${plan.modelo}:`, error.message);
    } else {
      console.log(`   ✅ Plan ${plan.modelo} creado (ID: ${data.id})`);
      planesCreados.push(data);
    }
  }
  
  return planesCreados;
}

async function crearIntervalos(planId: number, modelo: string) {
  console.log(`\n📊 Creando intervalos para ${modelo}...`);
  
  const intervalos = [
    {
      plan_id: planId,
      codigo: 'PM1',
      nombre: 'Mantenimiento PM1 - 250 horas',
      horas_intervalo: 250,
      descripcion: 'Mantenimiento preventivo básico: cambio de aceite motor y filtros básicos.',
      orden: 1,
      tareas: [
        'Cambiar aceite de motor',
        'Reemplazar filtro de aceite motor',
        'Verificar niveles de refrigerante',
        'Inspeccionar mangueras y conexiones',
        'Lubricar puntos de engrase (13 puntos)',
        'Verificar tensión de orugas',
        'Inspección visual general del equipo'
      ]
    },
    {
      plan_id: planId,
      codigo: 'PM2',
      nombre: 'Mantenimiento PM2 - 500 horas',
      horas_intervalo: 500,
      descripcion: 'Mantenimiento intermedio: incluye PM1 más filtros de combustible e hidráulico.',
      orden: 2,
      tareas: [
        'Realizar todas las tareas de PM1',
        'Cambiar filtro de combustible primario',
        'Cambiar filtro de combustible secundario',
        'Cambiar filtro hidráulico de retorno',
        'Inspeccionar correas de accesorios',
        'Limpiar radiador y enfriador hidráulico'
      ]
    },
    {
      plan_id: planId,
      codigo: 'PM3',
      nombre: 'Mantenimiento PM3 - 1000 horas',
      horas_intervalo: 1000,
      descripcion: 'Mantenimiento mayor: incluye PM2 más filtros de aire y aceite hidráulico.',
      orden: 3,
      tareas: [
        'Realizar todas las tareas de PM2',
        'Cambiar filtro de aire primario',
        'Cambiar filtro de aire secundario',
        'Cambiar aceite hidráulico',
        'Cambiar aceite de mandos finales',
        'Análisis de aceite motor e hidráulico'
      ]
    },
    {
      plan_id: planId,
      codigo: 'PM4',
      nombre: 'Mantenimiento PM4 - 2000 horas',
      horas_intervalo: 2000,
      descripcion: 'Mantenimiento completo: incluye todos los servicios anteriores más cambio de refrigerante.',
      orden: 4,
      tareas: [
        'Realizar todas las tareas de PM3',
        'Cambiar refrigerante del motor',
        'Cambiar aceite de transmisión',
        'Reemplazar correas de accesorios',
        'Cambiar filtro de succión hidráulico',
        'Prueba de rendimiento completa'
      ]
    }
  ];
  
  const intervalosCreados: Array<{ id: number }> = [];
  
  for (const intervalo of intervalos) {
    // Verificar si ya existe
    const { data: existe } = await supabase
      .from('plan_intervalos')
      .select('id')
      .eq('plan_id', planId)
      .eq('codigo', intervalo.codigo)
      .single();
    
    if (existe) {
      console.log(`   ⏭️  ${intervalo.codigo} ya existe`);
      intervalosCreados.push(existe);
      continue;
    }
    
    const { data, error } = await supabase
      .from('plan_intervalos')
      .insert(intervalo)
      .select()
      .single();
    
    if (error) {
      console.log(`   ❌ Error ${intervalo.codigo}:`, error.message);
    } else {
      console.log(`   ✅ ${intervalo.codigo} creado`);
      intervalosCreados.push(data);
    }
  }
  
  return intervalosCreados;
}

async function crearKits(modelo: string, categoria: string) {
  console.log(`\n🧰 Creando kits para ${modelo}...`);
  
  const prefijo = modelo === 'EC55D' ? 'VOE-EC55D' : modelo === 'EC140DL' ? 'VOE-EC140DL' : 'VOE-140DL';
  
  const kits = ['PM1', 'PM2', 'PM3', 'PM4'].map(pm => ({
    codigo: `${prefijo}-${pm}`,
    nombre: `Kit ${pm} Volvo ${modelo}`,
    descripcion: `Kit de servicio ${pm === 'PM1' ? '250' : pm === 'PM2' ? '500' : pm === 'PM3' ? '1000' : '2000'} horas para ${categoria} Volvo ${modelo}.`,
    marca: 'Volvo',
    modelo_aplicable: modelo,
    categoria: categoria,
    activo: true
  }));
  
  const kitsCreados: Array<{ id: number }> = [];
  
  for (const kit of kits) {
    const { data: existe } = await supabase
      .from('kits_mantenimiento')
      .select('id')
      .eq('codigo', kit.codigo)
      .single();
    
    if (existe) {
      console.log(`   ⏭️  ${kit.codigo} ya existe`);
      kitsCreados.push(existe);
      continue;
    }
    
    const { data, error } = await supabase
      .from('kits_mantenimiento')
      .insert(kit)
      .select()
      .single();
    
    if (error) {
      console.log(`   ❌ Error ${kit.codigo}:`, error.message);
    } else {
      console.log(`   ✅ ${kit.codigo} creado`);
      kitsCreados.push(data);
    }
  }
  
  return kitsCreados;
}

async function crearPiezasKit(kitId: number, codigo: string, modelo: string) {
  const esEC55D = modelo === 'EC55D';
  const esPM1 = codigo.includes('PM1');
  const esPM2 = codigo.includes('PM2');
  const esPM3 = codigo.includes('PM3');
  const esPM4 = codigo.includes('PM4');
  
  const piezasBase = [
    {
      kit_id: kitId,
      numero_parte: esEC55D ? 'VOE21707132' : 'VOE21707134',
      descripcion: 'Filtro de aceite motor',
      tipo: 'Filtro',
      cantidad: 1,
      unidad: 'unidad',
      notas: esEC55D ? 'Motor D2.6A' : 'Motor D4J'
    },
    {
      kit_id: kitId,
      numero_parte: 'VOE20998807',
      descripcion: 'Aceite motor VDS-4.5 15W-40',
      tipo: 'Lubricante',
      cantidad: esEC55D ? 8 : 15,
      unidad: 'litros',
      notas: esEC55D ? 'Capacidad 7.5L' : 'Capacidad 14L'
    },
    {
      kit_id: kitId,
      numero_parte: 'VOE14503824',
      descripcion: 'Arandela de drenaje cobre',
      tipo: 'Varios',
      cantidad: esPM4 ? 6 : esPM3 ? 4 : esPM2 ? 2 : 1,
      unidad: 'unidad',
      notas: 'Reemplazar en cada cambio'
    }
  ];
  
  // Piezas adicionales según nivel
  if (esPM2 || esPM3 || esPM4) {
    piezasBase.push(
      {
        kit_id: kitId,
        numero_parte: esEC55D ? 'VOE21380488' : 'VOE21380489',
        descripcion: 'Filtro combustible primario',
        tipo: 'Filtro',
        cantidad: 1,
        unidad: 'unidad',
        notas: 'Separador agua/combustible'
      },
      {
        kit_id: kitId,
        numero_parte: esEC55D ? 'VOE21380475' : 'VOE21380476',
        descripcion: 'Filtro combustible secundario',
        tipo: 'Filtro',
        cantidad: 1,
        unidad: 'unidad',
        notas: 'Filtro fino'
      },
      {
        kit_id: kitId,
        numero_parte: esEC55D ? 'VOE14539482' : 'VOE14539483',
        descripcion: 'Filtro hidráulico retorno',
        tipo: 'Filtro',
        cantidad: 1,
        unidad: 'unidad',
        notas: 'Filtro tanque'
      }
    );
  }
  
  if (esPM3 || esPM4) {
    piezasBase.push(
      {
        kit_id: kitId,
        numero_parte: esEC55D ? 'VOE11110668' : 'VOE11110670',
        descripcion: 'Filtro de aire primario',
        tipo: 'Filtro',
        cantidad: 1,
        unidad: 'unidad',
        notas: 'Elemento exterior'
      },
      {
        kit_id: kitId,
        numero_parte: esEC55D ? 'VOE11110669' : 'VOE11110671',
        descripcion: 'Filtro de aire secundario',
        tipo: 'Filtro',
        cantidad: 1,
        unidad: 'unidad',
        notas: 'Elemento seguridad'
      },
      {
        kit_id: kitId,
        numero_parte: 'VOE15067098',
        descripcion: 'Aceite hidráulico ISO VG 46',
        tipo: 'Lubricante',
        cantidad: esPM4 ? (esEC55D ? 45 : 110) : (esEC55D ? 25 : 60),
        unidad: 'litros',
        notas: esPM4 ? 'Cambio completo' : 'Cambio parcial'
      }
    );
  }
  
  if (esPM4) {
    piezasBase.push(
      {
        kit_id: kitId,
        numero_parte: 'VOE20879727',
        descripcion: 'Refrigerante VCS concentrado',
        tipo: 'Refrigerante',
        cantidad: esEC55D ? 8 : 15,
        unidad: 'litros',
        notas: 'Mezclar 50/50'
      },
      {
        kit_id: kitId,
        numero_parte: esEC55D ? 'VOE21408351' : 'VOE21408352',
        descripcion: 'Correa de accesorios',
        tipo: 'Correa',
        cantidad: 1,
        unidad: 'unidad',
        notas: 'Alternador/ventilador'
      }
    );
  }
  
  let insertadas = 0;
  for (const pieza of piezasBase) {
    const { data: existe } = await supabase
      .from('kit_piezas')
      .select('id')
      .eq('kit_id', kitId)
      .eq('numero_parte', pieza.numero_parte)
      .single();
    
    if (!existe) {
      const { error } = await supabase.from('kit_piezas').insert(pieza);
      if (!error) insertadas++;
    }
  }
  
  return insertadas;
}

async function vincularKitsIntervalos(planId: number, modelo: string) {
  console.log(`\n🔗 Vinculando kits a intervalos para ${modelo}...`);
  
  const prefijo = modelo === 'EC55D' ? 'VOE-EC55D' : modelo === 'EC140DL' ? 'VOE-EC140DL' : 'VOE-140DL';
  
  // Obtener intervalos del plan
  const { data: intervalos } = await supabase
    .from('plan_intervalos')
    .select('id, codigo')
    .eq('plan_id', planId);
  
  if (!intervalos) return 0;
  
  let vinculaciones = 0;
  
  for (const intervalo of intervalos) {
    const codigoKit = `${prefijo}-${intervalo.codigo}`;
    
    // Buscar el kit
    const { data: kit } = await supabase
      .from('kits_mantenimiento')
      .select('id')
      .eq('codigo', codigoKit)
      .single();
    
    if (!kit) continue;
    
    // Verificar si ya está vinculado
    const { data: existe } = await supabase
      .from('plan_intervalo_kits')
      .select('id')
      .eq('plan_intervalo_id', intervalo.id)
      .eq('kit_id', kit.id)
      .single();
    
    if (!existe) {
      const { error } = await supabase
        .from('plan_intervalo_kits')
        .insert({
          plan_intervalo_id: intervalo.id,
          kit_id: kit.id
        });
      
      if (!error) {
        vinculaciones++;
        console.log(`   ✅ ${intervalo.codigo} -> ${codigoKit}`);
      }
    } else {
      console.log(`   ⏭️  ${intervalo.codigo} -> ${codigoKit} (ya existe)`);
    }
  }
  
  return vinculaciones;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MIGRACIÓN PLANES VOLVO - Import-Dash');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Modelos a crear:');
  console.log('  • EC55D (Miniretro) - AC-023, AC-025, AC-037');
  console.log('  • EC140DL/140DL (Excavadora) - AC-034');
  console.log('');
  
  // 1. Verificar conexión
  const conectado = await verificarConexion();
  if (!conectado) {
    console.log('\n❌ No se pudo conectar a Supabase. Verifica las credenciales.');
    process.exit(1);
  }
  
  // 2. Verificar planes existentes
  await verificarPlanesVolvoExistentes();
  
  // 3. Crear planes
  const planes = await crearPlanesVolvo();
  
  // 4. Para cada plan, crear intervalos, kits y piezas
  const modelos = [
    { modelo: 'EC55D', categoria: 'Miniretro' },
    { modelo: 'EC140DL', categoria: 'Excavadora' },
    { modelo: '140DL', categoria: 'Excavadora' }
  ];
  
  for (const { modelo, categoria } of modelos) {
    // Buscar el plan
    const { data: plan } = await supabase
      .from('planes_mantenimiento')
      .select('id')
      .eq('marca', 'Volvo')
      .eq('modelo', modelo)
      .single();
    
    if (!plan) {
      console.log(`\n⚠️  Plan ${modelo} no encontrado, omitiendo...`);
      continue;
    }
    
    // Crear intervalos
    await crearIntervalos(plan.id, modelo);
    
    // Crear kits
    const kits = await crearKits(modelo, categoria);
    
    // Crear piezas para cada kit
    console.log(`\n📦 Creando piezas para kits de ${modelo}...`);
    for (const kit of kits) {
      if (kit && kit.id) {
        const { data: kitInfo } = await supabase
          .from('kits_mantenimiento')
          .select('codigo')
          .eq('id', kit.id)
          .single();
        
        if (kitInfo) {
          const piezas = await crearPiezasKit(kit.id, kitInfo.codigo, modelo);
          console.log(`   ✅ ${kitInfo.codigo}: ${piezas} piezas añadidas`);
        }
      }
    }
    
    // Vincular kits a intervalos
    await vincularKitsIntervalos(plan.id, modelo);
  }
  
  // 5. Resumen final
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ MIGRACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Próximos pasos:');
  console.log('  1. Regenerar tipos: npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts');
  console.log('  2. Reiniciar dev server: npm run dev');
  console.log('  3. Verificar en Planificador > Planes de Mantenimiento');
  console.log('');
}

main().catch(console.error);
