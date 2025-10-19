import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { HistorialEvento, FiltrosHistorial } from '@/types/historial';

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

  const loadEventos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('historial_eventos')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
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
        fechaHastaEnd.setHours(23, 59, 59, 999);
        query = query.lte('created_at', fechaHastaEnd.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const eventosFormateados = (data || []).map(e => ({
        id: Number(e.id),
        tipoEvento: e.tipo_evento as any,
        modulo: e.modulo as any,
        fichaEquipo: e.ficha_equipo,
        nombreEquipo: e.nombre_equipo,
        usuarioResponsable: e.usuario_responsable,
        descripcion: e.descripcion,
        datosAntes: e.datos_antes,
        datosDespues: e.datos_despues,
        nivelImportancia: e.nivel_importancia as any,
        metadata: e.metadata,
        createdAt: e.created_at,
      }));

      // Filtro de búsqueda local
      const eventosFiltrados = filtros.busqueda
        ? eventosFormateados.filter(e =>
            e.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            e.fichaEquipo?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            e.nombreEquipo?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            e.usuarioResponsable.toLowerCase().includes(filtros.busqueda.toLowerCase())
          )
        : eventosFormateados;

      setEventos(eventosFiltrados);
    } catch (error) {
      console.error('Error loading eventos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos del historial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
    
    // Realtime updates
    const channel = supabase
      .channel('historial-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'historial_eventos' 
      }, () => {
        loadEventos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filtros]);

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
