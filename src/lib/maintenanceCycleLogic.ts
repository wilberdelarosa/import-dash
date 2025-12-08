/**
 * Lógica de cálculo del ciclo de mantenimiento
 * 
 * Este módulo implementa el algoritmo para determinar en qué etapa del ciclo
 * de mantenimiento se encuentra un equipo, simulando la ruta desde 0 horas
 * como si todos los mantenimientos se hubieran realizado correctamente.
 * 
 * Ciclo de mantenimiento Caterpillar/Volvo:
 * PM1 (250h) → PM2 (500h) → PM3 (1000h) → PM4 (2000h) → Ciclo se repite
 * 
 * Ejemplo de ciclo completo:
 * 0h    → PM1 a 250h
 * 250h  → PM2 a 500h
 * 500h  → PM1 a 750h (empieza nuevo sub-ciclo)
 * 750h  → PM3 a 1000h
 * 1000h → PM1 a 1250h
 * ...   → PM4 a 2000h
 * 2000h → Se repite el ciclo completo
 */

export interface IntervaloMantenimiento {
  codigo: string;
  nombre: string;
  horasIntervalo: number;
  descripcion?: string;
}

export interface MantenimientoEnCiclo {
  numero: number;           // Número secuencial del mantenimiento en el ciclo
  horasProgramadas: number; // Horas a las que debería hacerse
  intervalo: IntervaloMantenimiento;
  completado: boolean;      // Si ya pasó esas horas
  esProximo: boolean;       // Si es el próximo mantenimiento
}

export interface EstadoCicloMantenimiento {
  horasActuales: number;
  cicloActual: number;              // En qué repetición del ciclo completo está (1, 2, 3...)
  intervaloActual: IntervaloMantenimiento | null;  // El intervalo que corresponde ahora
  intervaloProximo: IntervaloMantenimiento | null; // El próximo intervalo
  horasParaProximo: number;         // Horas restantes para el próximo mantenimiento
  horasDesdeUltimo: number;         // Horas transcurridas desde el último PM
  historialCiclo: MantenimientoEnCiclo[]; // Historial simulado del ciclo
  porcentajeCiclo: number;          // Progreso en el ciclo actual (0-100)
  estadoAlerta: 'normal' | 'proximo' | 'urgente' | 'vencido';
}

// Intervalos estándar (usados por Caterpillar y Volvo)
export const INTERVALOS_ESTANDAR: IntervaloMantenimiento[] = [
  {
    codigo: 'PM1',
    nombre: 'Servicio básico 250h',
    horasIntervalo: 250,
    descripcion: 'Cambio de aceite y filtro de motor, inspección general',
  },
  {
    codigo: 'PM2',
    nombre: 'Servicio extendido 500h',
    horasIntervalo: 500,
    descripcion: 'PM1 + filtros de combustible y aire',
  },
  {
    codigo: 'PM3',
    nombre: 'Servicio mayor 1000h',
    horasIntervalo: 1000,
    descripcion: 'PM2 + filtros hidráulicos',
  },
  {
    codigo: 'PM4',
    nombre: 'Overhaul programado 2000h',
    horasIntervalo: 2000,
    descripcion: 'PM3 + cambio de aceite hidráulico completo',
  },
];

/**
 * Genera la secuencia de mantenimientos que ocurren dentro de un ciclo de 2000 horas.
 * 
 * La secuencia es:
 * 250h  - PM1
 * 500h  - PM2 (incluye PM1)
 * 750h  - PM1
 * 1000h - PM3 (incluye PM1+PM2)
 * 1250h - PM1
 * 1500h - PM2 (incluye PM1)
 * 1750h - PM1
 * 2000h - PM4 (incluye PM1+PM2+PM3)
 */
export function generarSecuenciaCiclo(intervalos: IntervaloMantenimiento[] = INTERVALOS_ESTANDAR): MantenimientoEnCiclo[] {
  const ciclo: MantenimientoEnCiclo[] = [];
  const pm1 = intervalos.find(i => i.codigo === 'PM1') || intervalos[0];
  const pm2 = intervalos.find(i => i.codigo === 'PM2') || intervalos[1];
  const pm3 = intervalos.find(i => i.codigo === 'PM3') || intervalos[2];
  const pm4 = intervalos.find(i => i.codigo === 'PM4') || intervalos[3];
  
  // Secuencia dentro de un ciclo de 2000h
  const secuencia = [
    { horas: 250, intervalo: pm1 },
    { horas: 500, intervalo: pm2 },
    { horas: 750, intervalo: pm1 },
    { horas: 1000, intervalo: pm3 },
    { horas: 1250, intervalo: pm1 },
    { horas: 1500, intervalo: pm2 },
    { horas: 1750, intervalo: pm1 },
    { horas: 2000, intervalo: pm4 },
  ];
  
  secuencia.forEach((item, index) => {
    ciclo.push({
      numero: index + 1,
      horasProgramadas: item.horas,
      intervalo: item.intervalo,
      completado: false,
      esProximo: false,
    });
  });
  
  return ciclo;
}

/**
 * Calcula el estado del ciclo de mantenimiento basándose en las horas actuales.
 * Simula la ruta desde 0 horas como si todos los mantenimientos se hubieran hecho correctamente.
 * 
 * @param horasActuales - Horas/km actuales del equipo
 * @param intervalos - Intervalos de mantenimiento a usar (default: estándar)
 * @param horasAlertaAnticipada - Horas antes del mantenimiento para mostrar alerta (default: 50)
 * @returns Estado completo del ciclo de mantenimiento
 */
export function calcularEstadoCiclo(
  horasActuales: number,
  intervalos: IntervaloMantenimiento[] = INTERVALOS_ESTANDAR,
  horasAlertaAnticipada: number = 50
): EstadoCicloMantenimiento {
  const CICLO_COMPLETO = 2000; // Un ciclo completo es de 2000 horas
  
  // Determinar en qué ciclo completo estamos (1, 2, 3...)
  const cicloActual = Math.floor(horasActuales / CICLO_COMPLETO) + 1;
  
  // Horas dentro del ciclo actual (0-2000)
  const horasEnCicloActual = horasActuales % CICLO_COMPLETO;
  
  // Generar la secuencia del ciclo
  const secuenciaCiclo = generarSecuenciaCiclo(intervalos);
  
  // Ajustar horas programadas para el ciclo actual
  const historialCiclo: MantenimientoEnCiclo[] = secuenciaCiclo.map((item, index) => {
    const horasAbsolutas = (cicloActual - 1) * CICLO_COMPLETO + item.horasProgramadas;
    return {
      ...item,
      horasProgramadas: horasAbsolutas,
      completado: horasActuales >= horasAbsolutas,
      esProximo: false,
    };
  });
  
  // Encontrar el próximo mantenimiento
  let intervaloProximo: IntervaloMantenimiento | null = null;
  let horasParaProximo = 0;
  let proximoIndex = -1;
  
  for (let i = 0; i < historialCiclo.length; i++) {
    if (!historialCiclo[i].completado) {
      historialCiclo[i].esProximo = true;
      intervaloProximo = historialCiclo[i].intervalo;
      horasParaProximo = historialCiclo[i].horasProgramadas - horasActuales;
      proximoIndex = i;
      break;
    }
  }
  
  // Si todos los del ciclo actual están completados, el próximo es PM1 del siguiente ciclo
  if (proximoIndex === -1) {
    const pm1 = intervalos.find(i => i.codigo === 'PM1') || intervalos[0];
    intervaloProximo = pm1;
    horasParaProximo = (cicloActual * CICLO_COMPLETO + 250) - horasActuales;
  }
  
  // Determinar el intervalo actual (el último completado o el que está por vencer)
  let intervaloActual: IntervaloMantenimiento | null = null;
  for (let i = historialCiclo.length - 1; i >= 0; i--) {
    if (historialCiclo[i].completado) {
      intervaloActual = historialCiclo[i].intervalo;
      break;
    }
  }
  
  // Si no hay ninguno completado en el ciclo actual, usar el PM4 del ciclo anterior
  if (!intervaloActual && cicloActual > 1) {
    intervaloActual = intervalos.find(i => i.codigo === 'PM4') || intervalos[intervalos.length - 1];
  }
  
  // Calcular horas desde el último mantenimiento completado
  let horasDesdeUltimo = horasEnCicloActual;
  if (proximoIndex > 0) {
    horasDesdeUltimo = horasActuales - historialCiclo[proximoIndex - 1].horasProgramadas;
  } else if (cicloActual > 1) {
    // Estamos en un nuevo ciclo, calcular desde el PM4 anterior
    horasDesdeUltimo = horasActuales - ((cicloActual - 1) * CICLO_COMPLETO);
  }
  
  // Calcular porcentaje del ciclo actual
  const porcentajeCiclo = Math.min(100, (horasEnCicloActual / CICLO_COMPLETO) * 100);
  
  // Determinar estado de alerta
  let estadoAlerta: 'normal' | 'proximo' | 'urgente' | 'vencido' = 'normal';
  if (horasParaProximo <= 0) {
    estadoAlerta = 'vencido';
  } else if (horasParaProximo <= horasAlertaAnticipada / 2) {
    estadoAlerta = 'urgente';
  } else if (horasParaProximo <= horasAlertaAnticipada) {
    estadoAlerta = 'proximo';
  }
  
  return {
    horasActuales,
    cicloActual,
    intervaloActual,
    intervaloProximo,
    horasParaProximo,
    horasDesdeUltimo,
    historialCiclo,
    porcentajeCiclo,
    estadoAlerta,
  };
}

/**
 * Obtiene una descripción textual del estado del ciclo
 */
export function obtenerDescripcionEstado(estado: EstadoCicloMantenimiento): string {
  const { intervaloProximo, horasParaProximo, estadoAlerta, cicloActual } = estado;
  
  if (!intervaloProximo) {
    return 'No hay intervalo de mantenimiento configurado';
  }
  
  const nombreIntervalo = intervaloProximo.codigo;
  
  switch (estadoAlerta) {
    case 'vencido':
      return `⚠️ ${nombreIntervalo} VENCIDO - Excedido por ${Math.abs(horasParaProximo).toFixed(0)}h`;
    case 'urgente':
      return `🔴 ${nombreIntervalo} URGENTE - Faltan ${horasParaProximo.toFixed(0)}h`;
    case 'proximo':
      return `🟡 ${nombreIntervalo} próximo - Faltan ${horasParaProximo.toFixed(0)}h`;
    default:
      return `🟢 ${nombreIntervalo} en ${horasParaProximo.toFixed(0)}h (Ciclo ${cicloActual})`;
  }
}

/**
 * Calcula qué mantenimientos se realizarían entre dos puntos de horas
 */
export function calcularMantenimientosEnRango(
  horasInicio: number,
  horasFin: number,
  intervalos: IntervaloMantenimiento[] = INTERVALOS_ESTANDAR
): MantenimientoEnCiclo[] {
  const resultados: MantenimientoEnCiclo[] = [];
  const CICLO_COMPLETO = 2000;
  
  // Generar secuencia base
  const secuenciaCiclo = generarSecuenciaCiclo(intervalos);
  
  // Iterar por todos los ciclos que cubren el rango
  const cicloInicio = Math.floor(horasInicio / CICLO_COMPLETO);
  const cicloFin = Math.floor(horasFin / CICLO_COMPLETO) + 1;
  
  for (let ciclo = cicloInicio; ciclo <= cicloFin; ciclo++) {
    secuenciaCiclo.forEach((item, index) => {
      const horasAbsolutas = ciclo * CICLO_COMPLETO + item.horasProgramadas;
      if (horasAbsolutas > horasInicio && horasAbsolutas <= horasFin) {
        resultados.push({
          ...item,
          numero: resultados.length + 1,
          horasProgramadas: horasAbsolutas,
          completado: false,
          esProximo: false,
        });
      }
    });
  }
  
  return resultados;
}

/**
 * Determina si un intervalo incluye las tareas de otros intervalos
 * PM4 incluye PM3, PM2, PM1
 * PM3 incluye PM2, PM1
 * PM2 incluye PM1
 */
export function obtenerIntervalosIncluidos(codigoIntervalo: string): string[] {
  switch (codigoIntervalo) {
    case 'PM4':
      return ['PM1', 'PM2', 'PM3', 'PM4'];
    case 'PM3':
      return ['PM1', 'PM2', 'PM3'];
    case 'PM2':
      return ['PM1', 'PM2'];
    case 'PM1':
      return ['PM1'];
    default:
      return [codigoIntervalo];
  }
}

/**
 * Valida si las horas actuales están dentro de un margen aceptable
 * para considerar un mantenimiento como "a tiempo"
 */
export function validarMantenimientoATiempo(
  horasActuales: number,
  horasProgramadas: number,
  margenTolerancia: number = 50
): { aTiempo: boolean; diferencia: number; mensaje: string } {
  const diferencia = horasActuales - horasProgramadas;
  
  if (diferencia < -margenTolerancia) {
    return {
      aTiempo: false,
      diferencia,
      mensaje: `Adelantado ${Math.abs(diferencia).toFixed(0)}h - Considere esperar`,
    };
  } else if (diferencia > margenTolerancia) {
    return {
      aTiempo: false,
      diferencia,
      mensaje: `Atrasado ${diferencia.toFixed(0)}h - Requiere atención urgente`,
    };
  }
  
  return {
    aTiempo: true,
    diferencia,
    mensaje: 'Dentro del margen aceptable',
  };
}
