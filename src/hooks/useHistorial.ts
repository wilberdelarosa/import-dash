import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  HistorialEvento,
  FiltrosHistorial,
  TipoEventoBase,
  TipoEventoDetallado,
} from '@/types/historial';

const END_OF_DAY_HOURS = 23;
const END_OF_DAY_MINUTES = 59;
const END_OF_DAY_SECONDS = 59;
const END_OF_DAY_MS = 999;

const TIPO_EVENTO_LABELS: Record<TipoEventoBase, string> = {
  crear: 'Creación',
  actualizar: 'Actualización',
  eliminar: 'Eliminación',
  mantenimiento_realizado: 'Mantenimiento realizado',
  stock_movido: 'Movimiento de stock',
  lectura_actualizada: 'Lectura actualizada',
  sistema: 'Sistema',
};

const DETALLE_TIPO_EVENTO: Partial<
  Record<TipoEventoDetallado, { categoria: TipoEventoBase; etiqueta: string }>
> = {
  equipo_creado: { categoria: 'crear', etiqueta: 'Equipo creado' },
  equipo_actualizado: { categoria: 'actualizar', etiqueta: 'Equipo actualizado' },
  equipo_eliminado: { categoria: 'eliminar', etiqueta: 'Equipo eliminado' },
  inventario_creado: { categoria: 'crear', etiqueta: 'Inventario creado' },
  inventario_actualizado: { categoria: 'actualizar', etiqueta: 'Inventario actualizado' },
  inventario_eliminado: { categoria: 'eliminar', etiqueta: 'Inventario eliminado' },
  mantenimiento_creado: { categoria: 'crear', etiqueta: 'Mantenimiento creado' },
  mantenimiento_actualizado: { categoria: 'actualizar', etiqueta: 'Mantenimiento actualizado' },
  mantenimiento_eliminado: { categoria: 'eliminar', etiqueta: 'Mantenimiento eliminado' },
  importacion_sincronizada: {
    categoria: 'sistema',
    etiqueta: 'Importación sincronizada',
  },
};

const capitalizeWords = (value: string) =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const isTipoEventoBase = (tipo: string): tipo is TipoEventoBase =>
  Object.prototype.hasOwnProperty.call(TIPO_EVENTO_LABELS, tipo);

const normalizarTipoEvento = (
  tipo: string,
): { categoria: TipoEventoBase; etiquetaCategoria: string; etiquetaSubtipo: string | null } => {
  if (isTipoEventoBase(tipo)) {
    return {
      categoria: tipo,
      etiquetaCategoria: TIPO_EVENTO_LABELS[tipo],
      etiquetaSubtipo: null,
    };
  }

  const detalle = DETALLE_TIPO_EVENTO[tipo as TipoEventoDetallado];
  if (detalle) {
    return {
      categoria: detalle.categoria,
      etiquetaCategoria: TIPO_EVENTO_LABELS[detalle.categoria],
      etiquetaSubtipo: detalle.etiqueta,
    };
  }

  return {
    categoria: 'sistema',
    etiquetaCategoria: TIPO_EVENTO_LABELS.sistema,
    etiquetaSubtipo: capitalizeWords(tipo),
  };
};

const toSafeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function useHistorial() {
  const [eventos, setEventos] = useState<HistorialEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosHistorial>({
    busqueda: '',
    tipoEvento: [],
    modulo: [],
    nivelImportancia: [],
    fichaEquipo: null,
    fechaDesde: null,
    fechaHasta: null,
  });

  const applyFilters = useCallback(
    (items: HistorialEvento[]) => {
      const buscar = filtros.busqueda.trim().toLowerCase();
      const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
      const fechaHasta = filtros.fechaHasta ? new Date(filtros.fechaHasta) : null;

      if (fechaDesde) {
        fechaDesde.setHours(0, 0, 0, 0);
      }

      if (fechaHasta) {
        fechaHasta.setHours(END_OF_DAY_HOURS, END_OF_DAY_MINUTES, END_OF_DAY_SECONDS, END_OF_DAY_MS);
      }

      return items.filter((evento) => {
        if (filtros.tipoEvento.length > 0 && !filtros.tipoEvento.includes(evento.categoriaEvento)) {
          return false;
        }

        if (filtros.modulo.length > 0 && !filtros.modulo.includes(evento.modulo)) {
          return false;
        }

        if (
          filtros.nivelImportancia.length > 0 &&
          !filtros.nivelImportancia.includes(evento.nivelImportancia)
        ) {
          return false;
        }

        if (filtros.fichaEquipo) {
          if (!evento.fichaEquipo) {
            return false;
          }

          if (evento.fichaEquipo.toLowerCase() !== filtros.fichaEquipo.toLowerCase()) {
            return false;
          }
        }

        const createdAtDate = toSafeDate(evento.createdAt);
        if (fechaDesde && createdAtDate && createdAtDate < fechaDesde) {
          return false;
        }

        if (fechaHasta && createdAtDate && createdAtDate > fechaHasta) {
          return false;
        }

        if (!buscar) {
          return true;
        }

        const hayCoincidencia = [
          evento.descripcion,
          evento.fichaEquipo,
          evento.nombreEquipo,
          evento.usuarioResponsable,
          evento.etiquetaCategoria,
          evento.etiquetaSubtipo,
          evento.tipoEvento,
        ]
          .filter(Boolean)
          .some((valor) => valor?.toLowerCase().includes(buscar));

        return hayCoincidencia;
      });
    },
    [filtros]
  );

  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('historial_eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros.tipoEvento.length > 0) {
        query = query.in('tipo_evento', filtros.tipoEvento);
      }

      if (filtros.modulo.length > 0) {
        query = query.in('modulo', filtros.modulo);
      }

      if (filtros.nivelImportancia.length > 0) {
        query = query.in('nivel_importancia', filtros.nivelImportancia);
      }

      if (filtros.fichaEquipo) {
        query = query.eq('ficha_equipo', filtros.fichaEquipo);
      }

      if (filtros.fechaDesde) {
        query = query.gte('created_at', filtros.fechaDesde.toISOString());
      }

      if (filtros.fechaHasta) {
        const fechaHastaEnd = new Date(filtros.fechaHasta);
        fechaHastaEnd.setHours(END_OF_DAY_HOURS, END_OF_DAY_MINUTES, END_OF_DAY_SECONDS, END_OF_DAY_MS);
        query = query.lte('created_at', fechaHastaEnd.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const eventosFormateados = (data || []).map((e) => {
        const tipoOriginal = (e.tipo_evento ?? 'sistema') as HistorialEvento['tipoEvento'];
        const { categoria, etiquetaCategoria, etiquetaSubtipo } = normalizarTipoEvento(e.tipo_evento ?? 'sistema');

        return {
          id: Number(e.id),
          tipoEvento: tipoOriginal,
          categoriaEvento: categoria,
          etiquetaCategoria,
          etiquetaSubtipo,
          modulo: e.modulo as HistorialEvento['modulo'],
          fichaEquipo: e.ficha_equipo,
          nombreEquipo: e.nombre_equipo,
          usuarioResponsable: e.usuario_responsable,
          descripcion: e.descripcion,
          datosAntes: e.datos_antes,
          datosDespues: e.datos_despues,
          nivelImportancia: e.nivel_importancia as HistorialEvento['nivelImportancia'],
          metadata: e.metadata,
          createdAt: e.created_at,
        } satisfies HistorialEvento;
      });

      const eventosFiltrados = applyFilters(eventosFormateados);
      setEventos(eventosFiltrados);
    } catch (error) {
      console.error('Error loading eventos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos del historial",
        variant: "destructive"
      });
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [applyFilters, filtros]);

  const loadEventosRef = useRef<() => Promise<void>>();

  useEffect(() => {
    loadEventosRef.current = loadEventos;
  }, [loadEventos]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  useEffect(() => {
    const channel = supabase
      .channel('historial-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'historial_eventos'
      }, () => {
        loadEventosRef.current?.();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const registrarEvento = async (evento: Omit<HistorialEvento, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('historial_eventos')
        .insert({
          tipo_evento: evento.tipoEvento,
          modulo: evento.modulo,
          ficha_equipo: evento.fichaEquipo,
          nombre_equipo: evento.nombreEquipo,
          usuario_responsable: evento.usuarioResponsable,
          descripcion: evento.descripcion,
          datos_antes: evento.datosAntes,
          datos_despues: evento.datosDespues,
          nivel_importancia: evento.nivelImportancia,
          metadata: evento.metadata,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error registering event:', error);
    }
  };

  const limpiarHistorial = async () => {
    try {
      const { error } = await supabase
        .from('historial_eventos')
        .delete()
        .neq('id', 0);

      if (error) throw error;

      toast({
        title: "✅ Historial limpiado",
        description: "Todos los eventos fueron eliminados",
      });
      
      await loadEventos();
    } catch (error) {
      console.error('Error clearing historial:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo limpiar el historial",
        variant: "destructive"
      });
    }
  };

  return {
    eventos,
    loading,
    filtros,
    setFiltros,
    loadEventos,
    registrarEvento,
    limpiarHistorial,
  };
}
