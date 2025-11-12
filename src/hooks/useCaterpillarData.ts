import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CatModelo {
  id: number;
  modelo: string;
  categoria: string;
  serie_desde: string | null;
  serie_hasta: string | null;
  motor: string;
  capacidad_aceite_motor: number;
  capacidad_hidraulico: number;
  capacidad_refrigerante: number;
  notas: string | null;
}

interface CatIntervalo {
  id: number;
  codigo: string;
  nombre: string;
  horas_intervalo: number;
  descripcion: string;
}

interface CatPieza {
  id: number;
  numero_parte: string;
  descripcion: string;
  tipo: string;
}

interface ModeloIntervaloPieza {
  id: number;
  modelo_id: number;
  intervalo_id: number;
  pieza_id: number;
  cantidad: number;
  notas: string | null;
  pieza: CatPieza;
  intervalo: CatIntervalo;
}

export interface CaterpillarEquipmentData {
  modelo: CatModelo | null;
  intervalos: CatIntervalo[];
  piezasPorIntervalo: Record<string, ModeloIntervaloPieza[]>;
}

export function useCaterpillarData(modelo: string, numeroSerie: string) {
  const [data, setData] = useState<CaterpillarEquipmentData>({
    modelo: null,
    intervalos: [],
    piezasPorIntervalo: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaterpillarData = async () => {
      if (!modelo) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Buscar el modelo Caterpillar
        const { data: modelosData, error: modelosError } = await supabase
          .from('cat_modelos')
          .select('*')
          .eq('modelo', modelo)
          .order('id');

        if (modelosError) throw modelosError;

        // Filtrar por rango de serie si está disponible
        let modeloSeleccionado: CatModelo | null = null;
        if (modelosData && modelosData.length > 0) {
          if (numeroSerie && modelosData.length > 1) {
            // Intentar encontrar el modelo que coincida con el rango de serie
            for (const m of modelosData) {
              if (m.serie_desde && numeroSerie >= m.serie_desde) {
                if (!m.serie_hasta || numeroSerie <= m.serie_hasta) {
                  modeloSeleccionado = m as CatModelo;
                  break;
                }
              }
            }
          }
          // Si no se encontró por serie o no hay serie, tomar el primero
          if (!modeloSeleccionado) {
            modeloSeleccionado = modelosData[0] as CatModelo;
          }
        }

        // Obtener todos los intervalos PM
        const { data: intervalosData, error: intervalosError } = await supabase
          .from('cat_intervalos_mantenimiento')
          .select('*')
          .order('horas_intervalo');

        if (intervalosError) throw intervalosError;

        // Si tenemos un modelo, buscar las piezas relacionadas
        const piezasPorIntervalo: Record<string, ModeloIntervaloPieza[]> = {};
        
        if (modeloSeleccionado) {
          const { data: relacionesData, error: relacionesError } = await supabase
            .from('cat_modelo_intervalo_piezas')
            .select(`
              *,
              pieza:pieza_id(id, numero_parte, descripcion, tipo),
              intervalo:intervalo_id(id, codigo, nombre, horas_intervalo, descripcion)
            `)
            .eq('modelo_id', modeloSeleccionado.id);

          if (relacionesError) throw relacionesError;

          // Organizar piezas por código de intervalo
          if (relacionesData) {
            relacionesData.forEach((relacion: any) => {
              const codigoIntervalo = relacion.intervalo?.codigo;
              if (codigoIntervalo) {
                if (!piezasPorIntervalo[codigoIntervalo]) {
                  piezasPorIntervalo[codigoIntervalo] = [];
                }
                piezasPorIntervalo[codigoIntervalo].push(relacion as ModeloIntervaloPieza);
              }
            });
          }
        }

        setData({
          modelo: modeloSeleccionado,
          intervalos: (intervalosData || []) as CatIntervalo[],
          piezasPorIntervalo,
        });
      } catch (error) {
        console.error('Error fetching Caterpillar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCaterpillarData();
  }, [modelo, numeroSerie]);

  return { data, loading };
}
