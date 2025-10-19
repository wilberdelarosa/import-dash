import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Notificacion } from '@/types/historial';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [noLeidas, setNoLeidas] = useState(0);

  const loadNotificaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notificacionesFormateadas = (data || []).map(n => ({
        id: Number(n.id),
        tipo: n.tipo as any,
        titulo: n.titulo,
        mensaje: n.mensaje,
        fichaEquipo: n.ficha_equipo,
        nombreEquipo: n.nombre_equipo,
        nivel: n.nivel as any,
        leida: n.leida,
        accionUrl: n.accion_url,
        metadata: n.metadata,
        createdAt: n.created_at,
      }));

      setNotificaciones(notificacionesFormateadas);
      setNoLeidas(notificacionesFormateadas.filter(n => !n.leida).length);
    } catch (error) {
      console.error('Error loading notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificaciones();
    
    // Realtime updates
    const channel = supabase
      .channel('notificaciones-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notificaciones' 
      }, (payload) => {
        console.log('Notificación actualizada:', payload);
        loadNotificaciones();
        
        // Mostrar toast solo para nuevas notificaciones
        if (payload.eventType === 'INSERT') {
          const nuevaNotif = payload.new as any;
          toast({
            title: nuevaNotif.titulo,
            description: nuevaNotif.mensaje,
            variant: nuevaNotif.nivel === 'critical' ? 'destructive' : 'default',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const marcarComoLeida = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id);

      if (error) throw error;
      
      await loadNotificaciones();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('leida', false);

      if (error) throw error;
      
      toast({
        title: "✅ Notificaciones leídas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      });
      
      await loadNotificaciones();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const eliminarNotificacion = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadNotificaciones();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const generarNotificacionesMantenimiento = async () => {
    try {
      const { error } = await supabase.rpc('generar_notificaciones_mantenimientos');
      if (error) throw error;
      
      toast({
        title: "✅ Notificaciones generadas",
        description: "Se generaron las notificaciones de mantenimientos",
      });
      
      await loadNotificaciones();
    } catch (error) {
      console.error('Error generating maintenance notifications:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron generar las notificaciones",
        variant: "destructive"
      });
    }
  };

  const generarNotificacionesStock = async () => {
    try {
      const { error } = await supabase.rpc('generar_notificaciones_stock_bajo');
      if (error) throw error;
      
      toast({
        title: "✅ Notificaciones generadas",
        description: "Se generaron las notificaciones de stock bajo",
      });
      
      await loadNotificaciones();
    } catch (error) {
      console.error('Error generating stock notifications:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron generar las notificaciones",
        variant: "destructive"
      });
    }
  };

  return {
    notificaciones,
    loading,
    noLeidas,
    loadNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    generarNotificacionesMantenimiento,
    generarNotificacionesStock,
  };
}
