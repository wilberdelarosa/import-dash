import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type NotificationPermission = 'default' | 'granted' | 'denied';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

const NOTIFICATION_STORAGE_KEY = 'app-notifications-history';
const NOTIFICATION_TEST_KEY = 'notifications-test-sent';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { toast } = useToast();

  // Cargar notificaciones guardadas
  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing notifications', e);
      }
    }
  }, []);

  // Guardar notificaciones al cambiar
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Si hay permiso nativo, enviar también push local
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error('Error sending native notification', e);
      }
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestPermission = async () => {
    if (!supported) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta notificaciones push",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);

      if (result === 'granted') {
        toast({
          title: "✅ Notificaciones activadas",
          description: "Recibirás alertas sobre mantenimientos",
        });

        // Enviar prueba si es la primera vez
        const yaEnvioPrueba = localStorage.getItem(NOTIFICATION_TEST_KEY);
        if (!yaEnvioPrueba) {
          addNotification({
            title: 'Notificaciones activadas',
            body: 'Ahora recibirás alertas importantes en este dispositivo.',
            type: 'success'
          });
          localStorage.setItem(NOTIFICATION_TEST_KEY, 'true');
        }
        return true;
      } else {
        toast({
          title: "❌ Notificaciones denegadas",
          description: "No recibirás alertas del sistema",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    permission,
    supported,
    notifications,
    unreadCount,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
}
