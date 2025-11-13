import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function NotificationButton() {
  const { permission, supported, requestPermission, sendNotification } = useNotifications();
  const { toast } = useToast();

  if (!supported) {
    return null;
  }

  const handleClick = () => {
    if (permission === 'default') {
      requestPermission();
      return;
    }

    if (permission === 'denied') {
      toast({
        title: 'Activa las notificaciones',
        description: 'Abre la configuración del navegador y habilita las alertas para esta aplicación.',
        variant: 'destructive',
      });
      return;
    }

    sendNotification('Notificación de prueba', {
      body: 'Este dispositivo recibirá alertas críticas de mantenimiento.',
      icon: '/favicon.ico',
      tag: 'alito-test',
    });
    toast({
      title: 'Notificación enviada',
      description: 'Verifica que el dispositivo haya mostrado la alerta',
    });
  };

  const icon =
    permission === 'granted' ? (
      <BellRing className="h-4 w-4 text-primary" />
    ) : (
      <BellOff className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="relative h-9 w-9 p-0"
      aria-label="Notificaciones"
      title={
        permission === 'granted'
          ? 'Notificaciones activas en este dispositivo'
          : 'Activa las notificaciones de escritorio'
      }
    >
      {permission === 'granted' && (
        <Badge className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-success p-0" aria-hidden />
      )}
      {icon}
    </Button>
  );
}
