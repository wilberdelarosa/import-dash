import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSystemConfig } from '@/context/SystemConfigContext';

export interface UnifiedNotification {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  fichaEquipo: string | null;
  nombreEquipo: string | null;
  nivel: 'info' | 'warning' | 'critical';
  leida: boolean;
  accionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationState {
  notifications: UnifiedNotification[];
  unreadCount: number;
  loading: boolean;
  pushPermission: NotificationPermission;
}

const NOTIFICATION_SOUND_ENABLED_KEY = 'notification-sound-enabled';

export function useUnifiedNotifications() {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    pushPermission: 'default'
  });
  
  const { config } = useSystemConfig();
  const configRef = useRef(config);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationIdRef = useRef<number | null>(null);

  // Update config ref
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Initialize audio for notification sound
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Check push permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setState(prev => ({ ...prev, pushPermission: Notification.permission }));
    }
  }, []);

  // Format notification from database
  const formatNotification = useCallback((n: Record<string, unknown>): UnifiedNotification => ({
    id: Number(n.id),
    tipo: String(n.tipo),
    titulo: String(n.titulo),
    mensaje: n.ficha_equipo 
      ? `Ficha ${n.ficha_equipo}: ${n.mensaje}` 
      : String(n.mensaje),
    fichaEquipo: n.ficha_equipo as string | null,
    nombreEquipo: n.nombre_equipo as string | null,
    nivel: n.nivel as 'info' | 'warning' | 'critical',
    leida: Boolean(n.leida),
    accionUrl: n.accion_url as string | null,
    metadata: n.metadata as Record<string, unknown> | null,
    createdAt: String(n.created_at),
  }), []);

  // Load notifications from Supabase
  const loadNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted = (data || []).map(formatNotification);
      const unreadCount = formatted.filter(n => !n.leida).length;

      setState(prev => ({
        ...prev,
        notifications: formatted,
        unreadCount,
        loading: false
      }));

      // Track last notification ID for detecting new ones
      if (formatted.length > 0 && !lastNotificationIdRef.current) {
        lastNotificationIdRef.current = formatted[0].id;
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [formatNotification]);

  // Play notification sound
  const playSound = useCallback(() => {
    const soundEnabled = localStorage.getItem(NOTIFICATION_SOUND_ENABLED_KEY) !== 'false';
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Send device push notification
  const sendPushNotification = useCallback((title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: `notification-${Date.now()}`,
          requireInteraction: false,
          silent: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((payload: Record<string, unknown>) => {
    const newNotif = payload.new as Record<string, unknown>;
    const formatted = formatNotification(newNotif);

    // Prevent duplicate processing
    if (lastNotificationIdRef.current && formatted.id <= lastNotificationIdRef.current) {
      return;
    }
    lastNotificationIdRef.current = formatted.id;

    // Update state optimistically
    setState(prev => ({
      ...prev,
      notifications: [formatted, ...prev.notifications.filter(n => n.id !== formatted.id)],
      unreadCount: prev.unreadCount + 1
    }));

    // Show toast notification
    toast({
      title: formatted.titulo,
      description: formatted.mensaje,
      variant: formatted.nivel === 'critical' ? 'destructive' : 'default',
    });

    // Play sound
    playSound();

    // Send device push notification if enabled
    const currentConfig = configRef.current;
    if (currentConfig.notificarDispositivo && Notification.permission === 'granted') {
      const icon = formatted.nivel === 'critical' ? '🚨' : 
                   formatted.nivel === 'warning' ? '⚠️' : 'ℹ️';
      sendPushNotification(
        `${icon} ${formatted.titulo}`,
        formatted.mensaje
      );
    }

    // Log external notifications if enabled
    if (currentConfig.notificarEmail && currentConfig.correoNotificaciones) {
      logExternalNotification('email', currentConfig.correoNotificaciones, formatted);
    }
    if (currentConfig.notificarWhatsapp && currentConfig.telefonoWhatsapp) {
      logExternalNotification('whatsapp', currentConfig.telefonoWhatsapp, formatted);
    }
  }, [formatNotification, playSound, sendPushNotification]);

  // Log external notification attempt
  const logExternalNotification = async (
    canal: 'email' | 'whatsapp', 
    destinatario: string, 
    notif: UnifiedNotification
  ) => {
    try {
      await supabase.from('notificaciones_salientes').insert({
        notificacion_id: notif.id,
        canal,
        destinatario,
        contenido: `${notif.titulo}: ${notif.mensaje}`
      });
    } catch (error) {
      console.error('Error logging external notification:', error);
    }
  };

  // Initialize and subscribe to realtime
  useEffect(() => {
    const initialize = async () => {
      // Generate automatic notifications first
      try {
        await supabase.rpc('generar_notificaciones_mantenimientos');
      } catch (error) {
        console.error('Error generating maintenance notifications:', error);
      }

      await loadNotifications();
    };

    initialize();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('unified-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones'
      }, (payload) => {
        handleNewNotification(payload);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notificaciones'
      }, () => {
        loadNotifications();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notificaciones'
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, handleNewNotification]);

  // Request push permission
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta notificaciones push",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setState(prev => ({ ...prev, pushPermission: result }));

      if (result === 'granted') {
        toast({
          title: "Notificaciones activadas",
          description: "Recibirás alertas en tu dispositivo",
        });
        
        // Send test notification
        sendPushNotification(
          '✅ Notificaciones Activadas',
          'Ahora recibirás alertas importantes en este dispositivo'
        );
        return true;
      } else {
        toast({
          title: "Notificaciones denegadas",
          description: "No recibirás alertas del sistema",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [sendPushNotification]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: number) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === id ? { ...n, leida: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }));

    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      loadNotifications();
    }
  }, [loadNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, leida: true })),
      unreadCount: 0
    }));

    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('leida', false);

      if (error) throw error;

      toast({
        title: "Listo",
        description: "Todas las notificaciones marcadas como leídas",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id: number) => {
    // Optimistic update
    setState(prev => {
      const notif = prev.notifications.find(n => n.id === id);
      return {
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
        unreadCount: notif && !notif.leida ? prev.unreadCount - 1 : prev.unreadCount
      };
    });

    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0
    }));

    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .neq('id', 0); // Delete all

      if (error) throw error;

      toast({
        title: "Historial limpiado",
        description: "Todas las notificaciones han sido eliminadas",
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Generate maintenance notifications
  const generateMaintenanceNotifications = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('generar_notificaciones_mantenimientos');
      if (error) throw error;

      toast({
        title: "Notificaciones generadas",
        description: "Se han generado alertas de mantenimientos",
      });

      await loadNotifications();
    } catch (error) {
      console.error('Error generating maintenance notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar las notificaciones",
        variant: "destructive"
      });
    }
  }, [loadNotifications]);

  // Generate stock notifications
  const generateStockNotifications = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('generar_notificaciones_stock_bajo');
      if (error) throw error;

      toast({
        title: "Notificaciones generadas",
        description: "Se han generado alertas de stock bajo",
      });

      await loadNotifications();
    } catch (error) {
      console.error('Error generating stock notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar las notificaciones",
        variant: "destructive"
      });
    }
  }, [loadNotifications]);

  // Toggle sound
  const toggleSound = useCallback((enabled: boolean) => {
    localStorage.setItem(NOTIFICATION_SOUND_ENABLED_KEY, String(enabled));
  }, []);

  const isSoundEnabled = useCallback(() => {
    return localStorage.getItem(NOTIFICATION_SOUND_ENABLED_KEY) !== 'false';
  }, []);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPushPermission,
    generateMaintenanceNotifications,
    generateStockNotifications,
    refresh: loadNotifications,
    toggleSound,
    isSoundEnabled
  };
}
