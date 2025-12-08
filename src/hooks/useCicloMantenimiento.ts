/**
 * Hook unificado para calcular el ciclo de mantenimiento de cualquier equipo
 * Soporta Caterpillar, Volvo y otras marcas
 * 
 * Este hook determina automáticamente:
 * 1. El plan de mantenimiento aplicable según marca/modelo
 * 2. En qué punto del ciclo está el equipo (simulando desde 0h)
 * 3. El próximo mantenimiento y las horas restantes
 * 4. El kit de piezas necesario para el próximo servicio
 */

import { useMemo } from 'react';
import { 
  calcularEstadoCiclo, 
  EstadoCicloMantenimiento, 
  IntervaloMantenimiento,
  INTERVALOS_ESTANDAR,
  obtenerDescripcionEstado,
} from '@/lib/maintenanceCycleLogic';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import { getVolvoMaintenanceData, VOLVO_MAINTENANCE_DATA, VolvoPMKit } from '@/data/volvoMaintenance';
import { CATERPILLAR_MAINTENANCE_DATA, CaterpillarPMKit } from '@/data/caterpillarMaintenanceData';

export interface KitRecomendado {
  codigo: string;
  nombre: string;
  piezas: Array<{
    numeroParte: string;
    descripcion: string;
    sistema: string;
    cantidad: number;
    notas?: string;
  }>;
  tareas?: string[];
}

export interface CicloMantenimientoEquipo extends EstadoCicloMantenimiento {
  marca: string;
  modelo: string;
  categoria: string;
  planEncontrado: boolean;
  kitRecomendado: KitRecomendado | null;
  descripcionEstado: string;
  fuenteDatos: 'caterpillar' | 'volvo' | 'generico';
}

interface UseCicloMantenimientoProps {
  marca: string | null | undefined;
  modelo: string | null | undefined;
  categoria: string | null | undefined;
  horasActuales: number;
  horasAlerta?: number;
}

/**
 * Hook principal para calcular el ciclo de mantenimiento de un equipo
 */
export function useCicloMantenimiento({
  marca,
  modelo,
  categoria,
  horasActuales,
  horasAlerta = 50,
}: UseCicloMantenimientoProps): CicloMantenimientoEquipo {
  return useMemo(() => {
    // Valores por defecto si no hay datos
    const defaultResult: CicloMantenimientoEquipo = {
      horasActuales,
      cicloActual: 1,
      intervaloActual: null,
      intervaloProximo: INTERVALOS_ESTANDAR[0],
      horasParaProximo: INTERVALOS_ESTANDAR[0].horasIntervalo - (horasActuales % 2000),
      horasDesdeUltimo: horasActuales % 250,
      historialCiclo: [],
      porcentajeCiclo: (horasActuales % 2000) / 20,
      estadoAlerta: 'normal',
      marca: marca || 'Desconocida',
      modelo: modelo || 'Desconocido',
      categoria: categoria || 'General',
      planEncontrado: false,
      kitRecomendado: null,
      descripcionEstado: 'Sin plan de mantenimiento configurado',
      fuenteDatos: 'generico',
    };

    if (!marca || !modelo) {
      return defaultResult;
    }

    const marcaNorm = marca.trim().toUpperCase();
    const modeloNorm = modelo.trim().toLowerCase();

    // ==================== CATERPILLAR ====================
    if (marcaNorm.includes('CATERPILLAR') || marcaNorm.includes('CAT')) {
      // Buscar en datos estáticos de caterpillarMaintenance.ts
      const catData = getStaticCaterpillarData(modelo);
      
      // Buscar en datos de caterpillarMaintenanceData.ts
      const catModelData = CATERPILLAR_MAINTENANCE_DATA.find(m => 
        modeloNorm.includes(m.model.toLowerCase()) ||
        m.model.toLowerCase().includes(modeloNorm.replace(/[^a-z0-9]/g, ''))
      );

      // Convertir intervalos de Caterpillar al formato estándar
      let intervalosEquipo: IntervaloMantenimiento[] = INTERVALOS_ESTANDAR;
      
      if (catData?.intervalos) {
        intervalosEquipo = catData.intervalos.map(int => ({
          codigo: int.codigo,
          nombre: int.nombre,
          horasIntervalo: int.horas_intervalo,
          descripcion: int.descripcion,
        }));
      }

      // Calcular estado del ciclo
      const estadoCiclo = calcularEstadoCiclo(horasActuales, intervalosEquipo, horasAlerta);
      
      // Obtener kit recomendado
      let kitRecomendado: KitRecomendado | null = null;
      
      if (estadoCiclo.intervaloProximo && catModelData) {
        const pmKit = catModelData.pmKits.find(
          kit => kit.code.startsWith(estadoCiclo.intervaloProximo!.codigo)
        );
        
        if (pmKit) {
          kitRecomendado = {
            codigo: pmKit.code,
            nombre: pmKit.name,
            piezas: pmKit.filters.map(f => ({
              numeroParte: f.partNumber,
              descripcion: f.description,
              sistema: f.system,
              cantidad: f.quantity,
            })),
          };
        }
      }

      // Si encontramos datos en caterpillarMaintenance.ts, agregar tareas
      if (kitRecomendado && catData?.tareasPorIntervalo && estadoCiclo.intervaloProximo) {
        const tareas = catData.tareasPorIntervalo[estadoCiclo.intervaloProximo.codigo];
        if (tareas) {
          kitRecomendado.tareas = tareas;
        }
      }

      return {
        ...estadoCiclo,
        marca: 'CATERPILLAR',
        modelo: modelo,
        categoria: categoria || catModelData?.category || 'Equipo',
        planEncontrado: true,
        kitRecomendado,
        descripcionEstado: obtenerDescripcionEstado(estadoCiclo),
        fuenteDatos: 'caterpillar',
      };
    }

    // ==================== VOLVO ====================
    if (marcaNorm.includes('VOLVO')) {
      const volvoData = getVolvoMaintenanceData(modelo);
      
      if (volvoData) {
        // Convertir intervalos de Volvo al formato estándar
        const intervalosEquipo: IntervaloMantenimiento[] = volvoData.pmKits.map(kit => ({
          codigo: kit.code,
          nombre: kit.name,
          horasIntervalo: kit.hours,
          descripcion: kit.description,
        }));

        // Calcular estado del ciclo
        const estadoCiclo = calcularEstadoCiclo(horasActuales, intervalosEquipo, horasAlerta);
        
        // Obtener kit recomendado
        let kitRecomendado: KitRecomendado | null = null;
        
        if (estadoCiclo.intervaloProximo) {
          const pmKit = volvoData.pmKits.find(
            kit => kit.code === estadoCiclo.intervaloProximo!.codigo
          );
          
          if (pmKit) {
            kitRecomendado = {
              codigo: pmKit.code,
              nombre: pmKit.name,
              piezas: pmKit.filters.map(f => ({
                numeroParte: f.partNumber,
                descripcion: f.description,
                sistema: f.system,
                cantidad: f.quantity,
                notas: f.notes,
              })),
              tareas: pmKit.tasks,
            };
          }
        }

        return {
          ...estadoCiclo,
          marca: 'VOLVO',
          modelo: volvoData.model,
          categoria: volvoData.category,
          planEncontrado: true,
          kitRecomendado,
          descripcionEstado: obtenerDescripcionEstado(estadoCiclo),
          fuenteDatos: 'volvo',
        };
      }
    }

    // ==================== GENÉRICO (otras marcas) ====================
    // Usar intervalos estándar para marcas sin plan específico
    const estadoCiclo = calcularEstadoCiclo(horasActuales, INTERVALOS_ESTANDAR, horasAlerta);
    
    return {
      ...estadoCiclo,
      marca: marca,
      modelo: modelo,
      categoria: categoria || 'General',
      planEncontrado: false,
      kitRecomendado: null,
      descripcionEstado: obtenerDescripcionEstado(estadoCiclo) + ' (Plan genérico)',
      fuenteDatos: 'generico',
    };

  }, [marca, modelo, categoria, horasActuales, horasAlerta]);
}

/**
 * Hook simplificado que solo devuelve el próximo intervalo y las horas restantes
 */
export function useProximoMantenimiento(
  marca: string | null | undefined,
  modelo: string | null | undefined,
  horasActuales: number
): { codigo: string; nombre: string; horasRestantes: number; vencido: boolean } | null {
  const ciclo = useCicloMantenimiento({
    marca,
    modelo,
    categoria: null,
    horasActuales,
  });

  if (!ciclo.intervaloProximo) return null;

  return {
    codigo: ciclo.intervaloProximo.codigo,
    nombre: ciclo.intervaloProximo.nombre,
    horasRestantes: ciclo.horasParaProximo,
    vencido: ciclo.estadoAlerta === 'vencido',
  };
}

/**
 * Obtiene todos los modelos soportados con planes de mantenimiento
 */
export function getModelosSoportados(): Array<{ marca: string; modelo: string; categoria: string }> {
  const modelos: Array<{ marca: string; modelo: string; categoria: string }> = [];

  // Agregar modelos Caterpillar
  CATERPILLAR_MAINTENANCE_DATA.forEach(m => {
    modelos.push({
      marca: 'CATERPILLAR',
      modelo: m.model,
      categoria: m.category,
    });
  });

  // Agregar modelos Volvo
  VOLVO_MAINTENANCE_DATA.forEach(m => {
    modelos.push({
      marca: 'VOLVO',
      modelo: m.model,
      categoria: m.category,
    });
  });

  return modelos;
}
