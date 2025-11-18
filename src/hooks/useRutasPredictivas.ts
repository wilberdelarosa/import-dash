/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { usePlanes } from './usePlanes';
import { usePlanificacion } from './usePlanificacion';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import type { RutaPredictiva, CicloMantenimiento, CrearPlanificacionInput } from '@/types/planificacion';
import type { PlanConIntervalos } from '@/types/maintenance-plans';

/**
 * Hook para generar rutas predictivas de mantenimiento
 * 
 * Calcula los próximos 8 mantenimientos basándose en:
 * - Lectura actual del equipo
 * - Plan de mantenimiento asignado
 * - Intervalos configurados en el plan
 * - Historial de mantenimientos
 */
export function useRutasPredictivas(fichaEquipo: string, planId: number | null) {
  const { planes } = usePlanes();
  const { crearPlanificacion } = usePlanificacion();
  const { data } = useSupabaseDataContext();

  // Obtener equipo
  const equipo = useMemo(
    () => data.equipos.find((e) => e.ficha === fichaEquipo),
    [data.equipos, fichaEquipo]
  );

  // Obtener plan asignado
  const plan = useMemo(() => {
    if (!planId) return null;
    return planes.find((p) => p.id === planId) || null;
  }, [planes, planId]);

  // Obtener lecturas actuales (horometro o odometro)
  const lecturasActuales = useMemo(() => {
    if (!equipo) return 0;
    // Usar actualizaciones_horas_km si existe, sino usar valores por defecto
    return 0; // Por ahora retornar 0, se puede mejorar con data de actualizaciones
  }, [equipo]);

  // Determinar unidad de medida
  const unidadMedida = useMemo(() => {
    if (!equipo) return 'HORAS';
    // Por defecto usar HORAS, se puede mejorar con lógica adicional
    return 'HORAS';
  }, [equipo]);

  /**
   * Generar próximas 8 rutas de mantenimiento
   */
  const generarRutas = useMemo((): RutaPredictiva[] => {
    if (!plan || !equipo || plan.intervalos.length === 0) {
      return [];
    }

    const rutas: RutaPredictiva[] = [];
    let horasAcumuladas = lecturasActuales;
    const intervalosOrdenados = [...plan.intervalos].sort((a, b) => a.orden - b.orden);

    // Generar 8 rutas (2 ciclos completos si hay 4 intervalos)
    for (let i = 0; i < 8; i++) {
      const intervaloIndex = i % intervalosOrdenados.length;
      const intervalo = intervalosOrdenados[intervaloIndex];
      const ciclo = Math.floor(i / intervalosOrdenados.length) + 1;

      // Calcular horas objetivo
      horasAcumuladas += intervalo.horas_intervalo || 0;

      // Obtener primer kit del intervalo (si existe)
      const primerKit = intervalo.kits && intervalo.kits.length > 0 ? intervalo.kits[0].kit : null;

      rutas.push({
        orden: i + 1,
        mp: intervalo.codigo,
        nombre: intervalo.nombre,
        horasObjetivo: horasAcumuladas,
        horasActuales: lecturasActuales,
        horasRestantes: horasAcumuladas - lecturasActuales,
        ciclo,
        intervaloId: intervalo.id,
        kitId: primerKit?.id || null,
        kitNombre: primerKit?.nombre || null,
        tareas: Array.isArray(intervalo.tareas) ? intervalo.tareas : [],
      });
    }

    return rutas;
  }, [plan, equipo, lecturasActuales]);

  /**
   * Agrupar rutas por ciclos
   */
  const ciclos = useMemo((): CicloMantenimiento[] => {
    if (generarRutas.length === 0 || !plan) return [];

    const intervalosPerCiclo = plan.intervalos.length;
    const numCiclos = Math.ceil(generarRutas.length / intervalosPerCiclo);
    const ciclosArray: CicloMantenimiento[] = [];

    for (let c = 1; c <= numCiclos; c++) {
      const rutasDelCiclo = generarRutas.filter((r) => r.ciclo === c);

      if (rutasDelCiclo.length > 0) {
        ciclosArray.push({
          numero: c,
          inicio: rutasDelCiclo[0].horasObjetivo,
          fin: rutasDelCiclo[rutasDelCiclo.length - 1].horasObjetivo,
          intervalos: rutasDelCiclo,
          completo: rutasDelCiclo.length === intervalosPerCiclo,
        });
      }
    }

    return ciclosArray;
  }, [generarRutas, plan]);

  /**
   * Obtener próximo mantenimiento (primera ruta)
   */
  const proximoMantenimiento = useMemo(() => {
    return generarRutas.length > 0 ? generarRutas[0] : null;
  }, [generarRutas]);

  /**
   * Guardar rutas en la base de datos
   */
  const guardarRutas = async (
    rutasAGuardar: RutaPredictiva[] = generarRutas,
    opciones?: {
      tecnicoResponsable?: string;
      horasAlerta?: number;
      esOverride?: boolean;
    }
  ) => {
    if (!equipo || !plan) {
      throw new Error('Equipo o plan no disponibles');
    }

    const promesas = rutasAGuardar.map((ruta) => {
      const input: CrearPlanificacionInput = {
        fichaEquipo: equipo.ficha,
        nombreEquipo: equipo.nombre,
        categoria: equipo.categoria,
        marca: equipo.marca || plan.marca,
        modelo: equipo.modelo || plan.modelo || '',
        lecturasActuales: ruta.horasActuales,
        proximoMP: ruta.mp,
        proximasHoras: ruta.horasObjetivo,
        horasRestantes: ruta.horasRestantes,
        planId: plan.id,
        intervaloId: ruta.intervaloId,
        kitId: ruta.kitId,
        planNombre: plan.nombre,
        kitNombre: ruta.kitNombre || undefined,
        estado: 'pendiente',
        observaciones: `Ciclo ${ruta.ciclo} - ${ruta.nombre}`,
        tecnico_responsable: opciones?.tecnicoResponsable,
        horas_alerta: opciones?.horasAlerta || 50,
        // Campos adicionales para rutas
        ...(ruta.orden && { numero_ruta: ruta.orden }),
        ...(ruta.ciclo && { ciclo_numero: ruta.ciclo }),
        ...(opciones?.esOverride !== undefined && { es_override: opciones.esOverride }),
      };

      return crearPlanificacion(input as any);
    });

    await Promise.all(promesas);
  };

  /**
   * Validar si el plan es válido para generar rutas
   */
  const planValido = useMemo(() => {
    return !!(plan && plan.intervalos && plan.intervalos.length > 0);
  }, [plan]);

  /**
   * Calcular total de horas para completar todas las rutas
   */
  const totalHorasRutas = useMemo(() => {
    if (generarRutas.length === 0) return 0;
    const ultimaRuta = generarRutas[generarRutas.length - 1];
    return ultimaRuta.horasObjetivo - lecturasActuales;
  }, [generarRutas, lecturasActuales]);

  /**
   * Estadísticas de las rutas
   */
  const estadisticas = useMemo(() => {
    return {
      totalRutas: generarRutas.length,
      totalCiclos: ciclos.length,
      horasTotal: totalHorasRutas,
      rutasCriticas: generarRutas.filter((r) => r.horasRestantes < 100).length,
      rutasUrgentes: generarRutas.filter((r) => r.horasRestantes < 50).length,
      proximoMP: proximoMantenimiento?.mp || null,
      horasHastaProximo: proximoMantenimiento?.horasRestantes || 0,
    };
  }, [generarRutas, ciclos, totalHorasRutas, proximoMantenimiento]);

  return {
    // Datos generados
    rutas: generarRutas,
    ciclos,
    proximoMantenimiento,

    // Metadatos
    equipo,
    plan,
    lecturasActuales,
    unidadMedida,
    planValido,

    // Estadísticas
    estadisticas,
    totalHorasRutas,

    // Acciones
    guardarRutas,
  };
}
