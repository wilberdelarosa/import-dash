import { useMemo } from 'react';
import { usePlanes } from './usePlanes';
import type { PlanConIntervalos, IntervaloConKits } from '@/types/maintenance-plans';
import { useCicloMantenimiento, KitRecomendado } from './useCicloMantenimiento';
import { calcularEstadoCiclo, INTERVALOS_ESTANDAR } from '@/lib/maintenanceCycleLogic';

interface SugerenciaMantenimiento {
  intervaloSugerido: IntervaloConKits | null;
  planEncontrado: PlanConIntervalos | null;
  razon: string;
}

/**
 * Interfaz extendida que incluye información del ciclo de mantenimiento
 */
export interface SugerenciaMantenimientoExtendida extends SugerenciaMantenimiento {
  cicloActual: number;
  horasParaProximo: number;
  estadoAlerta: 'normal' | 'proximo' | 'urgente' | 'vencido';
  kitRecomendado: KitRecomendado | null;
  porcentajeCiclo: number;
}

/**
 * Hook para determinar el próximo mantenimiento sugerido basado en:
 * - Marca, modelo y categoría del equipo
 * - Horas/km actuales del equipo
 * - Último mantenimiento realizado
 * 
 * MEJORADO: Ahora usa la lógica de ciclo que simula la ruta desde 0 horas
 */
export function useSugerenciaMantenimiento(
  marca: string | null | undefined,
  modelo: string | null | undefined,
  categoria: string | null | undefined,
  horasActuales: number,
  horasUltimoMantenimiento: number
): SugerenciaMantenimiento {
  const { planes } = usePlanes();
  
  // Usar la nueva lógica de ciclo de mantenimiento
  const cicloInfo = useCicloMantenimiento({
    marca,
    modelo,
    categoria,
    horasActuales,
    horasAlerta: 50,
  });

  const sugerencia = useMemo(() => {
    // Si no hay datos suficientes, no podemos hacer sugerencia
    if (!marca || !modelo || !categoria) {
      return {
        intervaloSugerido: null,
        planEncontrado: null,
        razon: 'Faltan datos del equipo (marca, modelo o categoría)',
      };
    }

    // Buscar plan en base de datos que coincida con marca, modelo y categoría
    const planEncontrado = planes.find((plan) => {
      const marcaCoincide = plan.marca.toLowerCase() === marca.toLowerCase() ||
        plan.marca.toLowerCase().includes(marca.toLowerCase().replace(/\s/g, ''));
      const modeloCoincide = plan.modelo?.toLowerCase().includes(modelo.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        modelo.toLowerCase().includes(plan.modelo?.toLowerCase().replace(/[^a-z0-9]/g, '') || '');
      const categoriaCoincide = plan.categoria.toLowerCase() === categoria.toLowerCase();
      
      return marcaCoincide && (modeloCoincide || categoriaCoincide) && plan.activo;
    });

    // Si encontramos plan en BD, usar sus intervalos
    if (planEncontrado && planEncontrado.intervalos.length > 0) {
      const intervalosOrdenados = [...planEncontrado.intervalos].sort(
        (a, b) => a.horas_intervalo - b.horas_intervalo
      );

      // Usar la lógica de ciclo mejorada
      const estadoCiclo = calcularEstadoCiclo(
        horasActuales,
        intervalosOrdenados.map(int => ({
          codigo: int.codigo,
          nombre: int.nombre,
          horasIntervalo: int.horas_intervalo,
          descripcion: int.descripcion || undefined,
        }))
      );

      // Encontrar el intervalo correspondiente al próximo del ciclo
      const intervaloSugerido = intervalosOrdenados.find(
        int => int.codigo === estadoCiclo.intervaloProximo?.codigo
      ) || intervalosOrdenados[0];

      return {
        intervaloSugerido,
        planEncontrado,
        razon: cicloInfo.descripcionEstado,
      };
    }

    // Si no hay plan en BD pero tenemos datos estáticos (Caterpillar/Volvo)
    if (cicloInfo.planEncontrado && cicloInfo.intervaloProximo) {
      return {
        intervaloSugerido: null, // No tenemos IntervaloConKits de BD
        planEncontrado: null,
        razon: `${cicloInfo.descripcionEstado} (datos estáticos ${cicloInfo.fuenteDatos})`,
      };
    }

    // Plan genérico usando intervalos estándar
    const estadoCicloGenerico = calcularEstadoCiclo(horasActuales, INTERVALOS_ESTANDAR);
    
    return {
      intervaloSugerido: null,
      planEncontrado: null,
      razon: `No se encontró plan específico para ${marca} ${modelo}. ` +
        `Usando ciclo estándar: ${estadoCicloGenerico.intervaloProximo?.codigo || 'PM1'} ` +
        `en ${Math.max(0, estadoCicloGenerico.horasParaProximo).toFixed(0)}h`,
    };
  }, [planes, marca, modelo, categoria, horasActuales, cicloInfo]);

  return sugerencia;
}

/**
 * Hook extendido que incluye toda la información del ciclo
 */
export function useSugerenciaMantenimientoExtendida(
  marca: string | null | undefined,
  modelo: string | null | undefined,
  categoria: string | null | undefined,
  horasActuales: number,
  horasUltimoMantenimiento: number
): SugerenciaMantenimientoExtendida {
  const sugerenciaBase = useSugerenciaMantenimiento(
    marca, modelo, categoria, horasActuales, horasUltimoMantenimiento
  );
  
  const cicloInfo = useCicloMantenimiento({
    marca,
    modelo,
    categoria,
    horasActuales,
    horasAlerta: 50,
  });

  return {
    ...sugerenciaBase,
    cicloActual: cicloInfo.cicloActual,
    horasParaProximo: cicloInfo.horasParaProximo,
    estadoAlerta: cicloInfo.estadoAlerta,
    kitRecomendado: cicloInfo.kitRecomendado,
    porcentajeCiclo: cicloInfo.porcentajeCiclo,
  };
}

/**
 * Variante simplificada que solo busca por horasActuales sin considerar último mantenimiento.
 * MEJORADO: Ahora usa la lógica de ciclo que simula la ruta desde 0 horas.
 */
export function useSugerenciaMantenimientoSimple(
  marca: string | null | undefined,
  modelo: string | null | undefined,
  categoria: string | null | undefined,
  horasActuales: number
): SugerenciaMantenimiento {
  // Simplemente usar la función principal con horasUltimoMantenimiento = 0
  return useSugerenciaMantenimiento(marca, modelo, categoria, horasActuales, 0);
}
