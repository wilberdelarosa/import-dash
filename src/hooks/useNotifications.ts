import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type NotificationPermission = 'default' | 'granted' | 'denied';

const NOTIFICATION_TEST_KEY = 'notifications-test-sent';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window)) {
      return;
    }

    const syncPermission = () => {
      setPermission(Notification.permission as NotificationPermission);
    };

    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);

    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
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

        if (typeof window !== 'undefined') {
          const yaEnvioPrueba = window.localStorage.getItem(NOTIFICATION_TEST_KEY);
          if (!yaEnvioPrueba) {
            try {
              new Notification('Notificación de prueba', {
                body: 'Ficha DEMO-001: Esta es una notificación de prueba para verificar que todo funciona correctamente.',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
              });
              window.localStorage.setItem(NOTIFICATION_TEST_KEY, 'true');
            } catch (error) {
              console.error('Error sending test notification:', error);
            }
          }
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

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && supported) {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  };

  return {
    permission,
    supported,
    requestPermission,
    sendNotification,
  };
}
