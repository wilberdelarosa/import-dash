/**
 * Datos completos de mantenimiento para equipos Caterpillar
 * Incluye kits de mantenimiento y planes para cada modelo
 */

export interface CaterpillarFilter {
  partNumber: string;
  description: string;
  system: 'Motor' | 'Combustible' | 'Hidráulico' | 'Aire' | 'Transmisión';
  quantity: number;
}

export interface CaterpillarPMKit {
  code: string;
  name: string;
  hours: number;
  filters: CaterpillarFilter[];
  description?: string;
}

export interface CaterpillarModelData {
  model: string;
  category: 'Minicargador' | 'Retroexcavadora' | 'Excavadora' | 'Miniexcavadora' | 'Compactador';
  pmKits: CaterpillarPMKit[];
}

export const CATERPILLAR_MAINTENANCE_DATA: CaterpillarModelData[] = [
  // ==================== MINICARGADORES ====================
  {
    model: '216B3LRC',
    category: 'Minicargador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        description: 'Intervalo inicial - Cambio del filtro de aceite del motor',
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        description: 'Servicio a 500 h - Filtro de aceite más filtros de combustible',
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        description: 'Mantenimiento mayor - Todos los filtros principales',
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '102-2828', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        description: 'Mantenimiento mayor - Sustitución completa de todos los filtros',
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '102-2828', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '123-2368', description: 'Filtro de aire secundario (elemento de seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: '236DLRC',
    category: 'Minicargador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '326-1644', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '326-1644', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '123-2368', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: '236D3LRC',
    category: 'Minicargador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '326-1644', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '326-1644', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '123-2368', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: '232D3LRC',
    category: 'Minicargador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '326-1644', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '220-1523', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '326-1644', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '123-2367', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '123-2368', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },

  // ==================== RETROEXCAVADORAS ====================
  {
    model: '416F2STLRC',
    category: 'Retroexcavadora',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '119-4740', description: 'Filtro de aceite de transmisión', system: 'Transmisión', quantity: 1 },
          { partNumber: '362-1163', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 2 },
          { partNumber: '346-6687', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        description: 'Servicio intermedio - Cambio de aceite de motor y filtros de combustible',
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        description: 'Mantenimiento mayor - Recambio de todos los filtros',
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '119-4740', description: 'Filtro de aceite de transmisión', system: 'Transmisión', quantity: 1 },
          { partNumber: '362-1163', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 2 },
          { partNumber: '346-6687', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '346-6688', description: 'Filtro de aire secundario (seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: '416-07LRC',
    category: 'Retroexcavadora',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '119-4740', description: 'Filtro de aceite de transmisión', system: 'Transmisión', quantity: 1 },
          { partNumber: '362-1163', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 2 },
          { partNumber: '346-6687', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '119-4740', description: 'Filtro de aceite de transmisión', system: 'Transmisión', quantity: 1 },
          { partNumber: '362-1163', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 2 },
          { partNumber: '346-6687', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '346-6688', description: 'Filtro de aire secundario (seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },

  // ==================== EXCAVADORAS ====================
  {
    model: '320-07',
    category: 'Excavadora',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro de aceite hidráulico (principal)', system: 'Hidráulico', quantity: 1 },
          { partNumber: '322-3156', description: 'Filtro de retorno hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible (separador)', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible (inyección)', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro de aceite hidráulico (principal)', system: 'Hidráulico', quantity: 1 },
          { partNumber: '322-3156', description: 'Filtro de retorno hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '457-8207', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: '333-07',
    category: 'Excavadora',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro hidráulico principal', system: 'Hidráulico', quantity: 1 },
          { partNumber: '322-3156', description: 'Filtro de retorno hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro hidráulico principal', system: 'Hidráulico', quantity: 1 },
          { partNumber: '322-3156', description: 'Filtro de retorno hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario', system: 'Aire', quantity: 1 },
          { partNumber: '457-8207', description: 'Filtro de aire secundario', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: '326-07',
    category: 'Excavadora',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro hidráulico principal', system: 'Hidráulico', quantity: 1 },
          { partNumber: '322-3156', description: 'Filtro de retorno hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '479-4131', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro hidráulico principal', system: 'Hidráulico', quantity: 1 },
          { partNumber: '322-3156', description: 'Filtro de retorno hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario', system: 'Aire', quantity: 1 },
          { partNumber: '457-8207', description: 'Filtro de aire secundario', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },

  // ==================== MINIEXCAVADORAS ====================
  {
    model: '313-05GC',
    category: 'Miniexcavadora',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '523-4987', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '523-4987', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '509-5694', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '523-4987', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '509-5694', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '523-4987', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '509-5694', description: 'Filtro primario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '360-8960', description: 'Filtro secundario de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '419-0249', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '457-8206', description: 'Filtro de aire primario', system: 'Aire', quantity: 1 },
          { partNumber: '457-8207', description: 'Filtro de aire secundario', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: '305-07CR',
    category: 'Miniexcavadora',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro de combustible (separador de agua)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '362-1163', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '172-7803', description: 'Filtro de aire (elemento de admisión)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '7W-2326', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '363-6572', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '362-1163', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '172-7803', description: 'Filtro de aire (elemento de admisión)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },

  // ==================== COMPACTADORES ====================
  {
    model: 'CB2.7LRC',
    category: 'Compactador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible (separador)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '146-7474', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: 'CB2.7-03GC',
    category: 'Compactador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible (separador)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '146-7474', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: 'CS10GCLRC',
    category: 'Compactador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible (separador)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '146-7474', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
  {
    model: 'CS11GCLRC',
    category: 'Compactador',
    pmKits: [
      {
        code: 'PM1-250H',
        name: 'PM1 - 250 Horas',
        hours: 250,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
        ],
      },
      {
        code: 'PM2-500H',
        name: 'PM2 - 500 Horas',
        hours: 500,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible (separador)', system: 'Combustible', quantity: 1 },
        ],
      },
      {
        code: 'PM3-1000H',
        name: 'PM3 - 1000 Horas',
        hours: 1000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
        ],
      },
      {
        code: 'PM4-2000H',
        name: 'PM4 - 2000 Horas',
        hours: 2000,
        filters: [
          { partNumber: '322-3155', description: 'Filtro de aceite de motor', system: 'Motor', quantity: 1 },
          { partNumber: '067-6987', description: 'Filtro de combustible', system: 'Combustible', quantity: 1 },
          { partNumber: '363-5746', description: 'Filtro de aceite hidráulico', system: 'Hidráulico', quantity: 1 },
          { partNumber: '146-7473', description: 'Filtro de aire primario (elemento exterior)', system: 'Aire', quantity: 1 },
          { partNumber: '146-7474', description: 'Filtro de aire secundario (elemento seguridad)', system: 'Aire', quantity: 1 },
        ],
      },
    ],
  },
];

/**
 * Obtiene todos los modelos únicos
 */
export function getAllModels(): string[] {
  return CATERPILLAR_MAINTENANCE_DATA.map(d => d.model);
}

/**
 * Obtiene los datos de un modelo específico
 */
export function getModelData(model: string): CaterpillarModelData | undefined {
  return CATERPILLAR_MAINTENANCE_DATA.find(d => d.model === model);
}

/**
 * Obtiene todas las categorías únicas
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(CATERPILLAR_MAINTENANCE_DATA.map(d => d.category)));
}
