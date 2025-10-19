import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';

export function NotificationButton() {
  const { permission, supported, requestPermission } = useNotifications();

  if (!supported) {
    return null;
  }

  const handleClick = () => {
    if (permission === 'default') {
      requestPermission();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="relative w-9 h-9 p-0"
      aria-label="Notificaciones"
    >
      {permission === 'granted' ? (
        <>
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full bg-success" />
        </>
      ) : (
        <BellOff className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}
