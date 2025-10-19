import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { HistorialEvento, FiltrosHistorial } from '@/types/historial';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';

const END_OF_DAY_HOURS = 23;
const END_OF_DAY_MINUTES = 59;
const END_OF_DAY_SECONDS = 59;
const END_OF_DAY_MS = 999;

const ACTUALIZACION_ID_OFFSET = 1_000_000;

const toSafeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function useHistorial() {
  const { data: supabaseData } = useSupabaseDataContext();
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

  const buildFallbackEventos = useCallback((): HistorialEvento[] => {
    const mantenimientos = Array.isArray(supabaseData.mantenimientosRealizados)
      ? supabaseData.mantenimientosRealizados
      : [];

    const actualizaciones = Array.isArray(supabaseData.actualizacionesHorasKm)
      ? supabaseData.actualizacionesHorasKm
      : [];

    const mantenimientoEventos = mantenimientos.map((mantenimiento, index) => {
      const baseId = Number(mantenimiento.id ?? index + 1);
      const id = Number.isFinite(baseId) ? baseId : index + 1;
      const createdAt = toSafeDate(mantenimiento.fechaMantenimiento) ?? new Date();
      const descripcionBase = mantenimiento.observaciones?.trim();
      const descripcion = descripcionBase && descripcionBase.length > 0
        ? descripcionBase
        : `Mantenimiento realizado al equipo ${mantenimiento.nombreEquipo ?? mantenimiento.ficha}`;

      return {
        id,
        tipoEvento: 'mantenimiento_realizado',
        modulo: 'mantenimientos',
        fichaEquipo: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo ?? null,
        usuarioResponsable: mantenimiento.usuarioResponsable ?? 'Sistema',
        descripcion,
        datosAntes: null,
        datosDespues: {
          horasKmAlMomento: mantenimiento.horasKmAlMomento,
          incrementoDesdeUltimo: mantenimiento.incrementoDesdeUltimo,
          filtrosUtilizados: Array.isArray(mantenimiento.filtrosUtilizados)
            ? mantenimiento.filtrosUtilizados
            : [],
        },
        nivelImportancia: 'info',
        metadata: mantenimiento,
        createdAt: createdAt.toISOString(),
      } satisfies HistorialEvento;
    });

    const actualizacionEventos = actualizaciones.map((actualizacion, index) => {
      const baseId = Number(actualizacion.id ?? index + 1);
      const id = (Number.isFinite(baseId) ? baseId : index + 1) + ACTUALIZACION_ID_OFFSET;
      const createdAt = toSafeDate(actualizacion.fecha) ?? new Date();
      const incremento = Number(actualizacion.incremento ?? 0);
      const descripcion = actualizacion.nombreEquipo
        ? `Lectura actualizada para ${actualizacion.nombreEquipo}: ${actualizacion.horasKm}`
        : `Lectura actualizada a ${actualizacion.horasKm}`;

      return {
        id,
        tipoEvento: 'lectura_actualizada',
        modulo: 'mantenimientos',
        fichaEquipo: actualizacion.ficha,
        nombreEquipo: actualizacion.nombreEquipo ?? null,
        usuarioResponsable: actualizacion.usuarioResponsable ?? 'Sistema',
        descripcion,
        datosAntes: null,
        datosDespues: {
          horasKm: actualizacion.horasKm,
          incremento,
        },
        nivelImportancia: incremento < 0 ? 'warning' : 'info',
        metadata: actualizacion,
        createdAt: createdAt.toISOString(),
      } satisfies HistorialEvento;
    });

    const combined = [...mantenimientoEventos, ...actualizacionEventos];
    return combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [supabaseData]);

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
        if (filtros.tipoEvento.length > 0 && !filtros.tipoEvento.includes(evento.tipoEvento)) {
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
        ]
          .filter(Boolean)
          .some((valor) => valor?.toLowerCase().includes(buscar));

        return hayCoincidencia;
      });
    },
    [filtros]
  );

  const loadEventos = useCallback(async () => {
    const eventosFallback = applyFilters(buildFallbackEventos());

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

      const eventosFormateados = (data || []).map(e => ({
        id: Number(e.id),
        tipoEvento: e.tipo_evento as HistorialEvento['tipoEvento'],
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
      }));

      const eventosFiltrados = applyFilters(eventosFormateados);

      if (eventosFiltrados.length > 0 || eventosFallback.length === 0) {
        setEventos(eventosFiltrados);
      } else {
        setEventos(eventosFallback);
      }
    } catch (error) {
      console.error('Error loading eventos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos del historial",
        variant: "destructive"
      });
      setEventos(eventosFallback);
    } finally {
      setLoading(false);
    }
  }, [applyFilters, buildFallbackEventos, filtros]);

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
