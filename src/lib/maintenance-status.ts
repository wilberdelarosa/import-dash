/**
 * Lógica única de estado/restante de mantenimiento, espejo de la regla
 * aplicada en la BD por el trigger `normalizar_calculo_mantenimiento`:
 *
 *   proximo   = ultimo + frecuencia
 *   restante  = proximo - actuales
 *
 * Esta fuente de verdad evita que cada pantalla recalcule el umbral o el
 * restante con su propia lógica (y posiblemente de forma inconsistente).
 */

export type EstadoMantenimiento = 'vencido' | 'proximo' | 'ok';

export interface MantenimientoLike {
  horasKmActuales?: number | null;
  horasKmUltimoMantenimiento?: number | null;
  frecuencia?: number | null;
  proximoMantenimiento?: number | null;
  horasKmRestante?: number | null;
}

const DEFAULT_ALERTA_PREVENTIVA = 50;

const toNumber = (value: number | null | undefined, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Calcula el "próximo" mantenimiento replicando la regla de la BD.
 * Usa el valor ya persistido en `proximoMantenimiento` si existe;
 * si no, lo recalcula como fallback: ultimo + frecuencia.
 */
export function getProximo(m: MantenimientoLike): number {
  if (m.proximoMantenimiento !== undefined && m.proximoMantenimiento !== null) {
    return toNumber(m.proximoMantenimiento);
  }
  return toNumber(m.horasKmUltimoMantenimiento) + toNumber(m.frecuencia);
}

/**
 * Obtiene el restante del registro (campo de la BD) y, si no está
 * disponible, lo recalcula con la misma regla del trigger:
 * restante = proximo - actuales.
 */
export function getRestante(m: MantenimientoLike): number {
  if (m.horasKmRestante !== undefined && m.horasKmRestante !== null) {
    return toNumber(m.horasKmRestante);
  }
  return getProximo(m) - toNumber(m.horasKmActuales);
}

/**
 * Restante recortado a 0 como mínimo, útil para mostrar en UI cuando no
 * se quiere exhibir un número negativo (se usa `horasVencidas` para eso).
 */
export function displayRestante(m: MantenimientoLike): number {
  return Math.max(0, getRestante(m));
}

/**
 * Horas/km vencidas (positivo cuando el restante es negativo).
 */
export function horasVencidas(m: MantenimientoLike): number {
  return Math.max(0, -getRestante(m));
}

/**
 * Determina el estado del mantenimiento según el restante y el umbral
 * configurado en `configuraciones_sistema.alerta_preventiva`
 * (por defecto 50 si no hay configuración disponible).
 */
export function getEstado(
  m: MantenimientoLike,
  thresholds?: { alertaPreventiva?: number | null },
): EstadoMantenimiento {
  const restante = getRestante(m);
  const alertaPreventiva = toNumber(thresholds?.alertaPreventiva, DEFAULT_ALERTA_PREVENTIVA);

  if (restante <= 0) return 'vencido';
  if (restante <= alertaPreventiva) return 'proximo';
  return 'ok';
}

export const MAINTENANCE_DEFAULT_ALERTA_PREVENTIVA = DEFAULT_ALERTA_PREVENTIVA;
