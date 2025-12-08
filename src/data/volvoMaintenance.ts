/**
 * Datos completos de mantenimiento para equipos Volvo Construction Equipment
 * Basado en los manuales de operador y mantenimiento de Volvo CE
 * 
 * Modelos cubiertos:
 * - EC55D (Miniexcavadora compacta)
 * - EC140DL (Excavadora mediana)
 * 
 * Intervalos estándar Volvo CE:
 * - PM1: 250 horas - Servicio básico
 * - PM2: 500 horas - Servicio extendido
 * - PM3: 1000 horas - Servicio mayor
 * - PM4: 2000 horas - Overhaul programado
 */

export interface VolvoFilter {
  partNumber: string;
  description: string;
  system: 'Motor' | 'Combustible' | 'Hidráulico' | 'Aire' | 'Transmisión' | 'Refrigerante';
  quantity: number;
  notes?: string;
}

export interface VolvoPMKit {
  code: string;
  name: string;
  hours: number;
  filters: VolvoFilter[];
  tasks: string[];
  description?: string;
}

export interface VolvoModelData {
  model: string;
  aliases: string[];
  category: 'Miniretro' | 'Excavadora' | 'Cargador' | 'Compactador';
  engine: string;
  capacities: {
    engineOil: number;    // Litros
    hydraulic: number;    // Litros
    coolant: number;      // Litros
    fuel: number;         // Litros
  };
  pmKits: VolvoPMKit[];
}

// ==================== DATOS DE MANTENIMIENTO VOLVO ====================

export const VOLVO_MAINTENANCE_DATA: VolvoModelData[] = [
  // ==================== EC55D - MINIEXCAVADORA ====================
  {
    model: 'EC55D',
    aliases: ['ec55d', 'ec55', 'miniretro volvo', 'volvo ec55d', 'volvo ec55'],
    category: 'Miniretro',
    engine: 'Volvo D2.6A (Tier 4 Final)',
    capacities: {
      engineOil: 8.5,
      hydraulic: 65,
      coolant: 8,
      fuel: 68,
    },
    pmKits: [
      {
        code: 'PM1',
        name: 'Servicio básico 250h',
        hours: 250,
        description: 'Servicio de mantenimiento básico - Cambio de aceite y filtro de motor',
        tasks: [
          'Cambio de aceite de motor (8.5L aprox.)',
          'Reemplazo de filtro de aceite de motor',
          'Inspección visual de fugas en motor e hidráulico',
          'Revisión de nivel de refrigerante',
          'Lubricación de puntos de engrase (12 puntos)',
          'Verificación de tensión de oruga',
          'Inspección de mangueras y conexiones',
        ],
        filters: [
          { 
            partNumber: 'VOE11712878', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1,
            notes: 'Compatible con motor D2.6A'
          },
        ],
      },
      {
        code: 'PM2',
        name: 'Servicio extendido 500h',
        hours: 500,
        description: 'Incluye tareas del PM1 más cambio de filtros de combustible y aire',
        tasks: [
          'Todas las tareas del PM1',
          'Cambio de filtro primario de combustible (separador de agua)',
          'Cambio de filtro secundario de combustible',
          'Reemplazo de filtro de aire primario',
          'Limpieza de prefiltro de aire',
          'Verificación de correas del motor',
          'Inspección de radiador y enfriadores',
          'Drenaje de sedimentos del tanque de combustible',
        ],
        filters: [
          { 
            partNumber: 'VOE11712878', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110683', 
            description: 'Filtro primario de combustible (separador)', 
            system: 'Combustible', 
            quantity: 1,
            notes: 'Incluye separador de agua'
          },
          { 
            partNumber: 'VOE11110668', 
            description: 'Filtro secundario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110175', 
            description: 'Filtro de aire primario (elemento exterior)', 
            system: 'Aire', 
            quantity: 1 
          },
        ],
      },
      {
        code: 'PM3',
        name: 'Servicio mayor 1000h',
        hours: 1000,
        description: 'Mantenimiento mayor - Incluye filtros hidráulicos y transmisión',
        tasks: [
          'Todas las tareas del PM2',
          'Cambio de filtro hidráulico de retorno',
          'Cambio de filtro hidráulico piloto',
          'Reemplazo de filtro de aire secundario (seguridad)',
          'Verificación de aceite de reductores finales',
          'Inspección de motor de giro',
          'Calibración de presiones hidráulicas',
          'Revisión de cojinetes de tornamesa',
        ],
        filters: [
          { 
            partNumber: 'VOE11712878', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110683', 
            description: 'Filtro primario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110668', 
            description: 'Filtro secundario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110175', 
            description: 'Filtro de aire primario', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110176', 
            description: 'Filtro de aire secundario (seguridad)', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14524170', 
            description: 'Filtro hidráulico de retorno', 
            system: 'Hidráulico', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14532686', 
            description: 'Filtro hidráulico piloto', 
            system: 'Hidráulico', 
            quantity: 1 
          },
        ],
      },
      {
        code: 'PM4',
        name: 'Overhaul programado 2000h',
        hours: 2000,
        description: 'Mantenimiento completo - Cambio de aceite hidráulico y verificación general',
        tasks: [
          'Todas las tareas del PM3',
          'Cambio completo de aceite hidráulico (65L)',
          'Cambio de aceite de reductores finales',
          'Cambio de aceite del motor de giro',
          'Reemplazo del refrigerante (8L)',
          'Ajuste de válvulas del motor',
          'Calibración completa del sistema hidráulico',
          'Inspección de cilindros hidráulicos',
          'Verificación de estructura de pluma y balancín',
          'Pruebas de rendimiento del equipo',
        ],
        filters: [
          { 
            partNumber: 'VOE11712878', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110683', 
            description: 'Filtro primario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110668', 
            description: 'Filtro secundario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110175', 
            description: 'Filtro de aire primario', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110176', 
            description: 'Filtro de aire secundario', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14524170', 
            description: 'Filtro hidráulico de retorno', 
            system: 'Hidráulico', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14532686', 
            description: 'Filtro hidráulico piloto', 
            system: 'Hidráulico', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14519261', 
            description: 'Respiradero del tanque hidráulico', 
            system: 'Hidráulico', 
            quantity: 1 
          },
        ],
      },
    ],
  },

  // ==================== EC140DL - EXCAVADORA MEDIANA ====================
  {
    model: 'EC140DL',
    aliases: ['ec140dl', 'ec140', '140dl', 'excavadora 140', 'volvo 140', 'volvo ec140'],
    category: 'Excavadora',
    engine: 'Volvo D4J (Tier 4 Final)',
    capacities: {
      engineOil: 16,
      hydraulic: 155,
      coolant: 18,
      fuel: 230,
    },
    pmKits: [
      {
        code: 'PM1',
        name: 'Servicio básico 250h',
        hours: 250,
        description: 'Servicio de mantenimiento básico - Cambio de aceite y filtro de motor',
        tasks: [
          'Cambio de aceite de motor (16L aprox.)',
          'Reemplazo de filtro de aceite de motor',
          'Toma de muestras de aceite para análisis SOS',
          'Inspección visual de fugas en motor e hidráulico',
          'Revisión de nivel de refrigerante',
          'Lubricación de puntos de engrase (18 puntos)',
          'Verificación de tensión de oruga',
          'Inspección de cuchilla y dientes del cucharón',
        ],
        filters: [
          { 
            partNumber: 'VOE21707132', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1,
            notes: 'Compatible con motor D4J'
          },
        ],
      },
      {
        code: 'PM2',
        name: 'Servicio extendido 500h',
        hours: 500,
        description: 'Incluye tareas del PM1 más cambio de filtros de combustible y aire',
        tasks: [
          'Todas las tareas del PM1',
          'Cambio de filtro primario de combustible (separador)',
          'Cambio de filtro secundario de combustible',
          'Reemplazo de filtro de aire primario',
          'Limpieza del prefiltro ciclónico',
          'Verificación y ajuste de correas',
          'Inspección de radiador e intercooler',
          'Drenaje de sedimentos del tanque de combustible',
          'Verificación de operación del A/C',
        ],
        filters: [
          { 
            partNumber: 'VOE21707132', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE21380475', 
            description: 'Filtro primario de combustible (separador)', 
            system: 'Combustible', 
            quantity: 1,
            notes: 'Incluye sensor de agua'
          },
          { 
            partNumber: 'VOE21380488', 
            description: 'Filtro secundario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110022', 
            description: 'Filtro de aire primario (elemento exterior)', 
            system: 'Aire', 
            quantity: 1 
          },
        ],
      },
      {
        code: 'PM3',
        name: 'Servicio mayor 1000h',
        hours: 1000,
        description: 'Mantenimiento mayor - Incluye filtros hidráulicos',
        tasks: [
          'Todas las tareas del PM2',
          'Cambio de filtros hidráulicos principales',
          'Cambio de filtro hidráulico piloto',
          'Reemplazo de filtro de aire secundario',
          'Cambio de aceite de reductores de traslación',
          'Cambio de aceite del motor de giro',
          'Calibración del sistema hidráulico',
          'Inspección de rodamiento de tornamesa',
          'Verificación de pernos de estructura',
        ],
        filters: [
          { 
            partNumber: 'VOE21707132', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE21380475', 
            description: 'Filtro primario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE21380488', 
            description: 'Filtro secundario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110022', 
            description: 'Filtro de aire primario', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110023', 
            description: 'Filtro de aire secundario (seguridad)', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14569658', 
            description: 'Filtro hidráulico principal', 
            system: 'Hidráulico', 
            quantity: 2,
            notes: 'Dos unidades requeridas'
          },
          { 
            partNumber: 'VOE14532687', 
            description: 'Filtro hidráulico piloto', 
            system: 'Hidráulico', 
            quantity: 1 
          },
        ],
      },
      {
        code: 'PM4',
        name: 'Overhaul programado 2000h',
        hours: 2000,
        description: 'Mantenimiento completo - Cambio de aceite hidráulico y revisión general',
        tasks: [
          'Todas las tareas del PM3',
          'Cambio completo de aceite hidráulico (155L)',
          'Limpieza del tanque hidráulico',
          'Reemplazo del refrigerante del motor (18L)',
          'Ajuste de válvulas del motor',
          'Reemplazo del filtro del secador de A/C',
          'Calibración completa de bombas hidráulicas',
          'Inspección de cilindros y sellos',
          'Verificación de soldaduras estructurales',
          'Pruebas de rendimiento y certificación',
        ],
        filters: [
          { 
            partNumber: 'VOE21707132', 
            description: 'Filtro de aceite de motor', 
            system: 'Motor', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE21380475', 
            description: 'Filtro primario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE21380488', 
            description: 'Filtro secundario de combustible', 
            system: 'Combustible', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110022', 
            description: 'Filtro de aire primario', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE11110023', 
            description: 'Filtro de aire secundario', 
            system: 'Aire', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14569658', 
            description: 'Filtro hidráulico principal', 
            system: 'Hidráulico', 
            quantity: 2 
          },
          { 
            partNumber: 'VOE14532687', 
            description: 'Filtro hidráulico piloto', 
            system: 'Hidráulico', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14519262', 
            description: 'Respiradero del tanque hidráulico', 
            system: 'Hidráulico', 
            quantity: 1 
          },
          { 
            partNumber: 'VOE14503269', 
            description: 'Filtro del secador de A/C', 
            system: 'Refrigerante', 
            quantity: 1 
          },
        ],
      },
    ],
  },
];

// ==================== FUNCIONES DE UTILIDAD ====================

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Busca datos de mantenimiento Volvo por modelo
 */
export const getVolvoMaintenanceData = (modelo: string): VolvoModelData | null => {
  const normalized = normalize(modelo);
  return VOLVO_MAINTENANCE_DATA.find((item) => {
    if (normalize(item.model) === normalized) return true;
    return item.aliases.some((alias) => normalize(alias) === normalized || normalized.includes(normalize(alias)));
  }) || null;
};

/**
 * Obtiene todos los alias de modelos Volvo disponibles
 */
export const getVolvoModelAliases = () =>
  VOLVO_MAINTENANCE_DATA.map((model) => ({
    modelo: model.model,
    aliases: model.aliases,
    categoria: model.category,
  }));

/**
 * Intervalos estándar de Volvo CE
 */
export const VOLVO_STANDARD_INTERVALS = [
  { code: 'PM1', name: 'Servicio básico', hours: 250 },
  { code: 'PM2', name: 'Servicio extendido', hours: 500 },
  { code: 'PM3', name: 'Servicio mayor', hours: 1000 },
  { code: 'PM4', name: 'Overhaul programado', hours: 2000 },
];
