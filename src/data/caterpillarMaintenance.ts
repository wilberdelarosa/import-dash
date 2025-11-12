import { CaterpillarEquipmentData, CatIntervalo, CatModelo, ModeloIntervaloPieza, CaterpillarSpecializedMaintenance, CatPieza } from '@/types/caterpillar';

interface StaticModelConfig {
  id: number;
  modelo: string;
  aliases: string[];
  categoria: string;
  motor: string;
  capacidades: {
    aceiteMotor: number;
    hidraulico: number;
    refrigerante: number;
  };
  serie?: {
    desde?: string;
    hasta?: string;
    notas?: string;
  };
  tareas: Record<string, string[]>;
  piezas: Array<{
    intervalo: string;
    numeroParte: string;
    descripcion: string;
    tipo: string;
    cantidad?: number;
    notas?: string;
  }>;
  mantenimientosEspeciales?: CaterpillarSpecializedMaintenance[];
}

const INTERVALOS_BASE: CatIntervalo[] = [
  {
    id: 1,
    codigo: 'PM1',
    nombre: 'Servicio básico 250h',
    horas_intervalo: 250,
    descripcion:
      'Recolección de muestras de fluidos (motor, hidráulico, refrigerante), inspección general de fugas y revisión de correas y mangueras.',
  },
  {
    id: 2,
    codigo: 'PM2',
    nombre: 'Servicio extendido 500h',
    horas_intervalo: 500,
    descripcion:
      'Incluye tareas del PM1 más cambio de aceite y filtro de motor, sustitución de filtros de combustible y filtros de aire.',
  },
  {
    id: 3,
    codigo: 'PM3',
    nombre: 'Servicio mayor 1,000h',
    horas_intervalo: 1000,
    descripcion:
      'Incluye trabajos del PM2 más cambio de filtros hidráulicos y de transmisión. En excavadoras considerar aceite de transmisión final y motor de giro.',
  },
  {
    id: 4,
    codigo: 'PM4',
    nombre: 'Overhaul programado 2,000h',
    horas_intervalo: 2000,
    descripcion:
      'Comprende trabajos del PM3 más sustitución del filtro del secador de A/C, ajuste de válvulas y renovación del respiradero del depósito hidráulico.',
  },
];

const STATIC_MODELS: StaticModelConfig[] = [
  {
    id: 3201,
    modelo: 'Excavadora 320',
    aliases: ['320', 'cat 320', 'excavadora 320', '320 gc'],
    categoria: 'Excavadora',
    motor: 'Cat C6.6',
    capacidades: {
      aceiteMotor: 15,
      hidraulico: 220,
      refrigerante: 25,
    },
    serie: {
      desde: 'HEX00001',
      hasta: 'HEX99999',
      notas: 'Verificar subseries HEX10001+ para filtros actualizados',
    },
    tareas: {
      PM1: [
        'Toma de muestras SOS de aceite de motor, hidráulico y refrigerante.',
        'Inspección visual de fugas, correas y mangueras.',
      ],
      PM2: [
        'Cambio de aceite y filtro de motor (15L aprox.).',
        'Sustitución de filtros de combustible primario y secundario.',
        'Reemplazo del filtro de aire del motor.',
      ],
      PM3: [
        'Cambiar filtros hidráulicos principales y de retorno.',
        'Cambiar filtros de transmisión.',
        'En excavadoras, sustituir aceite de transmisión final y motor de giro.',
      ],
      PM4: [
        'Sustituir filtro del secador de A/C.',
        'Reemplazar juntas de tapa de válvulas y realizar ajuste de válvulas.',
        'Reemplazar respiradero del depósito hidráulico y lubricar puntos estructurales.',
      ],
    },
    piezas: [
      {
        intervalo: 'PM2',
        numeroParte: '322-3155',
        descripcion: 'Filtro de aceite de motor (series HEX00001-HEX10000)',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '525-6206',
        descripcion: 'Filtro en línea / strainer de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '479-4131',
        descripcion: 'Filtro primario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '360-8960',
        descripcion: 'Filtro secundario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '523-4987',
        descripcion: 'Filtro de aceite de motor (series HEX10001+)',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '174-8573',
        descripcion: 'Filtro hidráulico de retorno',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '114-3173',
        descripcion: 'Filtro de transmisión',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM4',
        numeroParte: '191-3340',
        descripcion: 'Filtro secador de aire acondicionado',
        tipo: 'A/C',
      },
    ],
    mantenimientosEspeciales: [
      {
        id: '320-ajuste-valvulas',
        intervaloCodigo: 'PM4',
        descripcion: 'Ajuste completo de válvulas y verificación de tren de válvulas cada 2,000h.',
        referencia: 'Guía de mantenimiento excavadora 320 serie HEX',
        responsableSugerido: 'Técnico senior hidráulico',
      },
      {
        id: '320-calibracion-bomba',
        intervaloCodigo: 'PM3',
        descripcion: 'Calibración de bombas hidráulicas principales y revisión de motor de giro.',
        referencia: 'Manual hidráulico 320, sección 14',
      },
    ],
  },
  {
    id: 4161,
    modelo: 'Retroexcavadora 416F',
    aliases: ['416f', 'retroexcavadora 416', '416'],
    categoria: 'Retroexcavadora',
    motor: 'Cat C4.4',
    capacidades: {
      aceiteMotor: 8,
      hidraulico: 110,
      refrigerante: 20,
    },
    serie: {
      notas: 'Aplicable a series serie F, verificar variaciones según país',
    },
    tareas: {
      PM1: [
        'Muestras SOS y revisión general de fugas.',
        'Verificar desgaste de neumáticos y ajustes de frenos.',
      ],
      PM2: [
        'Cambio de aceite y filtro de motor.',
        'Sustitución de filtros de combustible primario y secundario.',
        'Cambio de filtro de aire del motor y limpieza de prefiltro.',
        'Inspección de filtro de transmisión.',
      ],
      PM3: [
        'Reemplazar filtros hidráulicos y revisar caja de cambios.',
        'Lubricación general de pivotes y estabilizadores.',
      ],
      PM4: [
        'Cambio de filtro del secador de A/C.',
        'Ajuste de válvulas y sustitución de juntas de tapa.',
      ],
    },
    piezas: [
      {
        intervalo: 'PM2',
        numeroParte: '7W-2326',
        descripcion: 'Filtro de aceite de motor',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '363-6572',
        descripcion: 'Filtro primario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '360-8960',
        descripcion: 'Filtro secundario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '346-6687',
        descripcion: 'Filtro de aire primario',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '119-4740',
        descripcion: 'Filtro de transmisión',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '362-1163',
        descripcion: 'Filtro hidráulico',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM4',
        numeroParte: '191-3340',
        descripcion: 'Filtro secador de aire acondicionado',
        tipo: 'A/C',
      },
    ],
    mantenimientosEspeciales: [
      {
        id: '416-ajuste-frenos',
        intervaloCodigo: 'PM3',
        descripcion: 'Ajuste de frenos de servicio y estacionamiento, revisar holguras.',
      },
      {
        id: '416-calibracion-hidraulica',
        intervaloCodigo: 'PM4',
        descripcion: 'Calibrar bombas y válvulas principales del sistema hidráulico.',
        responsableSugerido: 'Especialista hidráulico',
      },
    ],
  },
  {
    id: 3051,
    modelo: 'Mini-retroexcavadora 305E2',
    aliases: ['305', '305e2', 'mini retro 305', 'mini excavadora 305'],
    categoria: 'Miniexcavadora',
    motor: 'Cat C2.4',
    capacidades: {
      aceiteMotor: 5,
      hidraulico: 65,
      refrigerante: 12,
    },
    tareas: {
      PM1: [
        'Toma de muestras SOS y revisión de mangueras compactas.',
        'Inspección de rodajes y tensión de oruga.',
      ],
      PM2: [
        'Cambio de aceite y filtro de motor.',
        'Sustituir filtros de combustible primario y secundario.',
        'Reemplazar filtro de aire y limpiar carcasa.',
      ],
      PM3: [
        'Cambiar filtros hidráulicos y aceite hidráulico.',
        'Revisar reductores finales y añadir aceite según nivel.',
      ],
      PM4: [
        'Reemplazar filtro del secador de A/C y revisar condensador.',
        'Ajuste de válvulas según especificación.',
      ],
    },
    piezas: [
      {
        intervalo: 'PM2',
        numeroParte: '7W-2326',
        descripcion: 'Filtro de aceite de motor compacto',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '363-6572',
        descripcion: 'Filtro primario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '362-1163',
        descripcion: 'Filtro hidráulico',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM4',
        numeroParte: '191-3340',
        descripcion: 'Filtro secador de A/C',
        tipo: 'A/C',
      },
    ],
    mantenimientosEspeciales: [
      {
        id: '305-ajuste-orugas',
        intervaloCodigo: 'PM2',
        descripcion: 'Ajuste de tensión de orugas y lubricación de ruedas guía.',
      },
      {
        id: '305-calibracion-joystick',
        intervaloCodigo: 'PM3',
        descripcion: 'Calibración de joysticks hidráulicos y verificación de bombas piloto.',
      },
    ],
  },
  {
    id: 2161,
    modelo: 'Minicargadores serie 216B/232D',
    aliases: ['216b', '216b3', '232d', '236d', 'minicargador'],
    categoria: 'Minicargador',
    motor: 'Cat 3024C/3024D',
    capacidades: {
      aceiteMotor: 8,
      hidraulico: 60,
      refrigerante: 12,
    },
    tareas: {
      PM1: [
        'Muestras SOS, inspección de fugas en cilindros y líneas hidráulicas.',
        'Limpieza de radiadores y revisión del sistema de riego si aplica.',
      ],
      PM2: [
        'Cambio de aceite y filtro de motor.',
        'Reemplazar filtros de combustible.',
        'Sustituir filtros de aire primario y secundario.',
      ],
      PM3: [
        'Reemplazar filtros hidráulicos y de transmisión.',
        'Revisar cojinetes y ajustar correa de transmisión.',
      ],
      PM4: [
        'Sustituir filtro del secador de A/C.',
        'Inspeccionar bomba hidráulica y realizar pruebas de presión.',
      ],
    },
    piezas: [
      {
        intervalo: 'PM2',
        numeroParte: '220-1523',
        descripcion: 'Filtro de aceite de motor',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '363-6572',
        descripcion: 'Filtro primario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '360-8960',
        descripcion: 'Filtro secundario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '123-2367',
        descripcion: 'Filtro de aire primario',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '123-2368',
        descripcion: 'Filtro de aire secundario',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '102-2828',
        descripcion: 'Filtro hidráulico',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM4',
        numeroParte: '191-3340',
        descripcion: 'Filtro secador de A/C',
        tipo: 'A/C',
      },
    ],
    mantenimientosEspeciales: [
      {
        id: '216-revision-cojinetes',
        intervaloCodigo: 'PM3',
        descripcion: 'Inspección de cojinetes vibratorios y reemplazo según desgaste.',
      },
      {
        id: '216-ajuste-bomba',
        intervaloCodigo: 'PM4',
        descripcion: 'Ajuste y calibración de bomba hidráulica principal.',
      },
    ],
  },
  {
    id: 3331,
    modelo: 'Excavadoras 326/333/313',
    aliases: ['326', '333', '313', 'excavadora 326', 'excavadora 333', 'excavadora 313'],
    categoria: 'Excavadora',
    motor: 'Cat C7.1 / C9.3',
    capacidades: {
      aceiteMotor: 25,
      hidraulico: 260,
      refrigerante: 35,
    },
    tareas: {
      PM1: [
        'Muestras SOS y revisión estructural de pluma y balancín.',
        'Ajuste de tensión de orugas.',
      ],
      PM2: [
        'Cambio de aceite y filtros de motor.',
        'Reemplazo de filtros de combustible.',
        'Limpieza profunda de radiadores y enfriadores.',
      ],
      PM3: [
        'Cambio de filtros hidráulicos y de transmisión.',
        'Reemplazo de aceites finales y motor de giro según serie.',
      ],
      PM4: [
        'Cambio de filtro del secador de A/C.',
        'Ajuste de válvulas y verificación de bombas principales.',
      ],
    },
    piezas: [
      {
        intervalo: 'PM2',
        numeroParte: '322-3155',
        descripcion: 'Filtro de aceite de motor',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '523-4987',
        descripcion: 'Filtro de aceite de motor (series recientes)',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '479-4131',
        descripcion: 'Filtro primario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '360-8960',
        descripcion: 'Filtro secundario de combustible',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '326-1644',
        descripcion: 'Filtro hidráulico principal',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '447-6646',
        descripcion: 'Filtro de transmisión / pilot',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM4',
        numeroParte: '191-3340',
        descripcion: 'Filtro secador de A/C',
        tipo: 'A/C',
      },
    ],
    mantenimientosEspeciales: [
      {
        id: '326-lubricacion-pluma',
        intervaloCodigo: 'PM1',
        descripcion: 'Lubricación de pluma, balancín y revisión de soldaduras estructurales.',
      },
      {
        id: '326-calibracion-sistemas',
        intervaloCodigo: 'PM3',
        descripcion: 'Calibración de sistemas hidráulicos y chequeo de válvulas proporcionales.',
      },
    ],
  },
  {
    id: 2701,
    modelo: 'Rodillos vibratorios CB2.7/CB10',
    aliases: ['cb2.7', 'cb10', 'rodillo', 'compactador 10tl', 'compactador gs11'],
    categoria: 'Compactador',
    motor: 'Cat C1.5 / C3.3',
    capacidades: {
      aceiteMotor: 10,
      hidraulico: 50,
      refrigerante: 10,
    },
    tareas: {
      PM1: [
        'Muestras SOS, limpieza de sistema de riego y boquillas.',
        'Inspección de vibradores y soporte de tambor.',
      ],
      PM2: [
        'Cambio de aceite y filtro de motor.',
        'Sustituir filtros de combustible y de aire.',
      ],
      PM3: [
        'Reemplazo de filtros hidráulicos.',
        'Revisión de cojinetes vibratorios y ajuste de correa de transmisión.',
      ],
      PM4: [
        'Cambio de aceite hidráulico.',
        'Reemplazo del filtro del secador de A/C y revisión de bomba hidráulica.',
      ],
    },
    piezas: [
      {
        intervalo: 'PM2',
        numeroParte: '322-3155',
        descripcion: 'Filtro de aceite de motor (C1.5/C3.3)',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '067-6987',
        descripcion: 'Filtro de combustible CB2.7',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '146-7473',
        descripcion: 'Filtro de aire primario',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM2',
        numeroParte: '146-7474',
        descripcion: 'Filtro de aire secundario',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM3',
        numeroParte: '363-5746',
        descripcion: 'Filtro hidráulico',
        tipo: 'Filtro',
      },
      {
        intervalo: 'PM4',
        numeroParte: '191-3340',
        descripcion: 'Filtro secador de A/C',
        tipo: 'A/C',
      },
    ],
    mantenimientosEspeciales: [
      {
        id: 'cb10-revision-vibradores',
        intervaloCodigo: 'PM3',
        descripcion: 'Calibración de vibradores y verificación de cojinetes.',
      },
      {
        id: 'cb10-calibracion-hidraulica',
        intervaloCodigo: 'PM4',
        descripcion: 'Calibración de bomba hidráulica y pruebas de vibración.',
      },
    ],
  },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

let piezaGlobalCounter = 1;
let relacionGlobalCounter = 1;

const buildModelo = (config: StaticModelConfig): CatModelo => ({
  id: config.id,
  modelo: config.modelo,
  categoria: config.categoria,
  serie_desde: config.serie?.desde ?? null,
  serie_hasta: config.serie?.hasta ?? null,
  motor: config.motor,
  capacidad_aceite_motor: config.capacidades.aceiteMotor,
  capacidad_hidraulico: config.capacidades.hidraulico,
  capacidad_refrigerante: config.capacidades.refrigerante,
  notas: config.serie?.notas ?? null,
});

const buildPiezas = (config: StaticModelConfig, intervalos: CatIntervalo[]): Record<string, ModeloIntervaloPieza[]> => {
  const intervalMap = new Map(intervalos.map((intervalo) => [intervalo.codigo, intervalo]));
  const piezasPorIntervalo: Record<string, ModeloIntervaloPieza[]> = {};

  config.piezas.forEach((piezaConfig) => {
    const intervalo = intervalMap.get(piezaConfig.intervalo);
    if (!intervalo) return;

    const pieza: CatPieza = {
      id: piezaGlobalCounter++,
      numero_parte: piezaConfig.numeroParte,
      descripcion: piezaConfig.descripcion,
      tipo: piezaConfig.tipo,
    };

    const relacion: ModeloIntervaloPieza = {
      id: relacionGlobalCounter++,
      modelo_id: config.id,
      intervalo_id: intervalo.id,
      pieza_id: pieza.id,
      cantidad: piezaConfig.cantidad ?? 1,
      notas: piezaConfig.notas ?? null,
      pieza,
      intervalo,
    } as ModeloIntervaloPieza;

    if (!piezasPorIntervalo[intervalo.codigo]) {
      piezasPorIntervalo[intervalo.codigo] = [];
    }

    piezasPorIntervalo[intervalo.codigo].push(relacion);
  });

  return piezasPorIntervalo;
};

export const getStaticCaterpillarData = (modelo: string): CaterpillarEquipmentData | null => {
  const normalized = normalize(modelo);
  const config = STATIC_MODELS.find((item) => {
    if (normalize(item.modelo) === normalized) return true;
    return item.aliases.some((alias) => normalize(alias) === normalized || normalized.includes(normalize(alias)));
  });

  if (!config) {
    return null;
  }

  const intervalos = INTERVALOS_BASE.map((intervalo) => ({ ...intervalo }));
  const piezasPorIntervalo = buildPiezas(config, intervalos);

  return {
    modelo: buildModelo(config),
    intervalos,
    piezasPorIntervalo,
    tareasPorIntervalo: config.tareas,
    mantenimientosEspeciales: config.mantenimientosEspeciales ?? [],
  };
};

export const getStaticModelAliases = () =>
  STATIC_MODELS.map((model) => ({
    modelo: model.modelo,
    aliases: model.aliases,
  }));
