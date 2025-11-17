import { useMemo } from 'react';
import { usePlanes } from './usePlanes';
import type { PlanConIntervalos, IntervaloConKits } from '@/types/maintenance-plans';

interface SugerenciaMantenimiento {
  intervaloSugerido: IntervaloConKits | null;
  planEncontrado: PlanConIntervalos | null;
  razon: string;
}

/**
 * Hook para determinar el próximo mantenimiento sugerido basado en:
 * - Marca, modelo y categoría del equipo
 * - Horas/km actuales del equipo
 * - Último mantenimiento realizado
 */
export function useSugerenciaMantenimiento(
  marca: string | null | undefined,
  modelo: string | null | undefined,
  categoria: string | null | undefined,
  horasActuales: number,
  horasUltimoMantenimiento: number
): SugerenciaMantenimiento {
  const { planes } = usePlanes();

  const sugerencia = useMemo(() => {
    // Si no hay datos suficientes, no podemos hacer sugerencia
    if (!marca || !modelo || !categoria) {
      return {
        intervaloSugerido: null,
        planEncontrado: null,
        razon: 'Faltan datos del equipo (marca, modelo o categoría)',
      };
    }

    // Buscar plan que coincida con marca, modelo y categoría
    const planEncontrado = planes.find((plan) => {
      const marcaCoincide = plan.marca.toLowerCase() === marca.toLowerCase();
      const modeloCoincide = plan.modelo?.toLowerCase() === modelo.toLowerCase();
      const categoriaCoincide = plan.categoria.toLowerCase() === categoria.toLowerCase();
      
      return marcaCoincide && modeloCoincide && categoriaCoincide && plan.activo;
    });

    if (!planEncontrado) {
      return {
        intervaloSugerido: null,
        planEncontrado: null,
        razon: `No se encontró plan de mantenimiento para ${marca} ${modelo} (${categoria})`,
      };
    }

    // Calcular horas desde último mantenimiento
    const horasDesdeUltimo = horasActuales - horasUltimoMantenimiento;

    // Obtener intervalos ordenados por horas
    const intervalosOrdenados = [...planEncontrado.intervalos].sort(
      (a, b) => a.horas_intervalo - b.horas_intervalo
    );

    // Encontrar el intervalo apropiado
    // 1. Si han pasado más horas que el intervalo más alto, sugerir el más alto
    const intervaloMaximo = intervalosOrdenados[intervalosOrdenados.length - 1];
    if (horasDesdeUltimo >= intervaloMaximo.horas_intervalo) {
      return {
        intervaloSugerido: intervaloMaximo,
        planEncontrado,
        razon: `Han transcurrido ${horasDesdeUltimo} horas desde el último mantenimiento. Se sugiere ${intervaloMaximo.nombre}`,
      };
    }

    // 2. Encontrar el intervalo inmediatamente superior o igual a las horas transcurridas
    const intervaloSugerido = intervalosOrdenados.find(
      (intervalo) => horasDesdeUltimo <= intervalo.horas_intervalo && horasDesdeUltimo >= intervalo.horas_intervalo - 50
    ) || intervalosOrdenados.find(
      (intervalo) => horasDesdeUltimo < intervalo.horas_intervalo
    );

    if (intervaloSugerido) {
      const horasFaltantes = intervaloSugerido.horas_intervalo - horasDesdeUltimo;
      return {
        intervaloSugerido,
        planEncontrado,
        razon: horasFaltantes <= 0
          ? `El mantenimiento ${intervaloSugerido.nombre} está vencido`
          : `Faltan aproximadamente ${horasFaltantes} horas para ${intervaloSugerido.nombre}`,
      };
    }

    // 3. Si no encontramos intervalo apropiado, sugerir el primero
    const primerIntervalo = intervalosOrdenados[0];
    return {
      intervaloSugerido: primerIntervalo,
      planEncontrado,
      razon: `Equipo recién agregado o sin suficientes horas. Se sugiere ${primerIntervalo.nombre}`,
    };
  }, [planes, marca, modelo, categoria, horasActuales, horasUltimoMantenimiento]);

  return sugerencia;
}

/**
 * Variante simplificada que solo busca por horasActuales sin considerar último mantenimiento
 */
export function useSugerenciaMantenimientoSimple(
  marca: string | null | undefined,
  modelo: string | null | undefined,
  categoria: string | null | undefined,
  horasActuales: number
): SugerenciaMantenimiento {
  const { planes } = usePlanes();

  const sugerencia = useMemo(() => {
    if (!marca || !modelo || !categoria) {
      return {
        intervaloSugerido: null,
        planEncontrado: null,
        razon: 'Faltan datos del equipo',
      };
    }

    const planEncontrado = planes.find((plan) => {
      const marcaCoincide = plan.marca.toLowerCase() === marca.toLowerCase();
      const modeloCoincide = plan.modelo?.toLowerCase() === modelo.toLowerCase();
      const categoriaCoincide = plan.categoria.toLowerCase() === categoria.toLowerCase();
      
      return marcaCoincide && modeloCoincide && categoriaCoincide && plan.activo;
    });

    if (!planEncontrado) {
      return {
        intervaloSugerido: null,
        planEncontrado: null,
        razon: 'No hay plan disponible',
      };
    }

    // Encontrar el intervalo más cercano a las horas actuales
    const intervalosOrdenados = [...planEncontrado.intervalos].sort(
      (a, b) => a.horas_intervalo - b.horas_intervalo
    );

    // Buscar el próximo intervalo basado en ciclo total
    const intervaloActual = intervalosOrdenados.find(
      (int) => horasActuales < int.horas_intervalo
    );

    if (intervaloActual) {
      return {
        intervaloSugerido: intervaloActual,
        planEncontrado,
        razon: `Próximo mantenimiento: ${intervaloActual.nombre}`,
      };
    }

    // Si excede todos los intervalos, calcular el próximo ciclo
    const intervaloMaximo = intervalosOrdenados[intervalosOrdenados.length - 1];
    const ciclosCompletos = Math.floor(horasActuales / intervaloMaximo.horas_intervalo);
    const proximoIntervalo = intervalosOrdenados.find(
      (int) => horasActuales < (ciclosCompletos + 1) * int.horas_intervalo
    ) || intervaloMaximo;

    return {
      intervaloSugerido: proximoIntervalo,
      planEncontrado,
      razon: `Ciclo ${ciclosCompletos + 1}: ${proximoIntervalo.nombre}`,
    };
  }, [planes, marca, modelo, categoria, horasActuales]);

  return sugerencia;
}
