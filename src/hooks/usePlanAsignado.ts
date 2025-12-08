/**
 * Hook para obtener el plan asignado a un equipo
 * 
 * Este hook centraliza la lógica de obtención del plan correcto para un equipo,
 * considerando:
 * 1. Overrides manuales (prioridad máxima)
 * 2. Planes sugeridos por coincidencia marca/modelo/categoría
 * 3. Plan genérico si no hay coincidencia
 * 
 * Sincroniza el estado entre PlanificadorInteligente y EquipoDetalleUnificado
 */
import { useMemo } from 'react';
import { usePlanes } from './usePlanes';
import { useOverridesPlanes } from './useOverridesPlanes';
import type { PlanConIntervalos, IntervaloConKits } from '@/types/maintenance-plans';

interface EquipoInfo {
  ficha: string;
  marca?: string | null;
  modelo?: string | null;
  categoria?: string | null;
}

interface PlanAsignadoResult {
  /** Plan activo para el equipo */
  planAsignado: PlanConIntervalos | null;
  /** Si el plan viene de un override manual */
  esOverride: boolean;
  /** Motivo del override si existe */
  motivoOverride: string | null;
  /** Score de coincidencia (0-100) */
  scoreCoincidencia: number;
  /** Razón por la que se seleccionó este plan */
  razonSeleccion: string;
  /** Intervalos del plan ordenados */
  intervalos: IntervaloConKits[];
  /** Todos los planes que podrían aplicar */
  planesAlternativos: Array<{
    plan: PlanConIntervalos;
    score: number;
    razon: string;
  }>;
  /** Estado de carga */
  loading: boolean;
}

/**
 * Calcula el score de similitud entre un plan y un equipo
 */
function calcularScorePlan(
  plan: { marca?: string | null; modelo?: string | null; categoria?: string | null },
  equipo: { marca?: string | null; modelo?: string | null; categoria?: string | null }
): { score: number; razones: string[] } {
  let score = 0;
  const razones: string[] = [];

  // Normalizar strings para comparación
  const normalize = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const planMarca = normalize(plan.marca);
  const planModelo = normalize(plan.modelo);
  const planCategoria = normalize(plan.categoria);
  const equipoMarca = normalize(equipo.marca);
  const equipoModelo = normalize(equipo.modelo);
  const equipoCategoria = normalize(equipo.categoria);

  // Modelo exacto o parcial +50% / +30%
  if (planModelo && equipoModelo) {
    if (planModelo === equipoModelo) {
      score += 50;
      razones.push('Modelo exacto');
    } else if (planModelo.includes(equipoModelo) || equipoModelo.includes(planModelo)) {
      score += 30;
      razones.push('Modelo similar');
    }
  }

  // Marca exacta +30%
  if (planMarca && equipoMarca) {
    if (planMarca === equipoMarca || planMarca.includes(equipoMarca) || equipoMarca.includes(planMarca)) {
      score += 30;
      razones.push('Marca coincide');
    }
  }

  // Categoría exacta +20%
  if (planCategoria && equipoCategoria) {
    if (planCategoria === equipoCategoria || planCategoria.includes(equipoCategoria)) {
      score += 20;
      razones.push('Categoría coincide');
    }
  }

  return { score, razones };
}

/**
 * Hook principal para obtener el plan asignado a un equipo
 */
export function usePlanAsignado(equipo: EquipoInfo | null | undefined): PlanAsignadoResult {
  const { planes, loading: loadingPlanes } = usePlanes();
  const { overrides, equiposConOverride, loading: loadingOverrides } = useOverridesPlanes();

  const resultado = useMemo<Omit<PlanAsignadoResult, 'loading'>>(() => {
    // Resultado vacío si no hay equipo
    if (!equipo || !equipo.ficha) {
      return {
        planAsignado: null,
        esOverride: false,
        motivoOverride: null,
        scoreCoincidencia: 0,
        razonSeleccion: 'Sin equipo seleccionado',
        intervalos: [],
        planesAlternativos: [],
      };
    }

    // 1. Verificar si hay override para este equipo
    const override = overrides.find(
      (o) => o.ficha_equipo === equipo.ficha && o.activo
    );

    if (override) {
      const planForzado = planes.find((p) => p.id === override.plan_forzado_id);
      if (planForzado) {
        return {
          planAsignado: planForzado,
          esOverride: true,
          motivoOverride: override.motivo,
          scoreCoincidencia: 100, // Override siempre es 100%
          razonSeleccion: `Plan asignado manualmente: ${override.motivo || 'Sin motivo especificado'}`,
          intervalos: planForzado.intervalos || [],
          planesAlternativos: [],
        };
      }
    }

    // 2. Calcular scores para todos los planes
    const planesConScore = planes
      .filter((p) => p.activo)
      .map((plan) => {
        const { score, razones } = calcularScorePlan(plan, equipo);
        return {
          plan,
          score,
          razon: razones.length > 0 ? razones.join(' • ') : 'Sin coincidencia específica',
        };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    // 3. Seleccionar el mejor plan
    const mejorPlan = planesConScore[0];

    if (mejorPlan) {
      return {
        planAsignado: mejorPlan.plan,
        esOverride: false,
        motivoOverride: null,
        scoreCoincidencia: mejorPlan.score,
        razonSeleccion: `Sugerencia automática: ${mejorPlan.razon}`,
        intervalos: mejorPlan.plan.intervalos || [],
        planesAlternativos: planesConScore.slice(1, 5), // Top 5 alternativas
      };
    }

    // 4. No hay plan que coincida
    return {
      planAsignado: null,
      esOverride: false,
      motivoOverride: null,
      scoreCoincidencia: 0,
      razonSeleccion: `No hay plan para ${equipo.marca || 'marca desconocida'} ${equipo.modelo || ''}`,
      intervalos: [],
      planesAlternativos: [],
    };
  }, [equipo, planes, overrides]);

  return {
    ...resultado,
    loading: loadingPlanes || loadingOverrides,
  };
}

/**
 * Hook para obtener el intervalo/PM actual sugerido basado en horas
 */
export function useIntervaloActual(
  planAsignado: PlanConIntervalos | null,
  horasActuales: number,
  horasUltimoMantenimiento: number
): {
  intervaloSugerido: IntervaloConKits | null;
  codigoPM: string | null;
  horasParaProximo: number;
  horasTranscurridas: number;
  porcentajeCompletado: number;
} {
  return useMemo(() => {
    if (!planAsignado || !planAsignado.intervalos || planAsignado.intervalos.length === 0) {
      return {
        intervaloSugerido: null,
        codigoPM: null,
        horasParaProximo: 0,
        horasTranscurridas: 0,
        porcentajeCompletado: 0,
      };
    }

    const horasTranscurridas = horasActuales - horasUltimoMantenimiento;
    const intervalosOrdenados = [...planAsignado.intervalos].sort(
      (a, b) => a.horas_intervalo - b.horas_intervalo
    );

    // Encontrar el ciclo completo (mayor intervalo)
    const cicloCompleto = intervalosOrdenados[intervalosOrdenados.length - 1].horas_intervalo;
    
    // Posición dentro del ciclo actual
    const posicionEnCiclo = horasTranscurridas % cicloCompleto;

    // Encontrar el próximo intervalo
    let intervaloSugerido: IntervaloConKits | null = null;
    let horasParaProximo = 0;

    for (const intervalo of intervalosOrdenados) {
      if (posicionEnCiclo < intervalo.horas_intervalo) {
        intervaloSugerido = intervalo;
        horasParaProximo = intervalo.horas_intervalo - posicionEnCiclo;
        break;
      }
    }

    // Si no encontramos, significa que estamos al final del ciclo
    if (!intervaloSugerido) {
      intervaloSugerido = intervalosOrdenados[0];
      horasParaProximo = cicloCompleto - posicionEnCiclo + intervaloSugerido.horas_intervalo;
    }

    const porcentajeCompletado = intervaloSugerido
      ? ((intervaloSugerido.horas_intervalo - horasParaProximo) / intervaloSugerido.horas_intervalo) * 100
      : 0;

    return {
      intervaloSugerido,
      codigoPM: intervaloSugerido?.codigo || null,
      horasParaProximo,
      horasTranscurridas,
      porcentajeCompletado: Math.min(100, Math.max(0, porcentajeCompletado)),
    };
  }, [planAsignado, horasActuales, horasUltimoMantenimiento]);
}
