/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Bell, 
  CheckCheck, 
  X, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  ExternalLink 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function NotificacionesCentro() {
  const navigate = useNavigate();
  const {
    notificaciones,
    loading,
    noLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    generarNotificacionesMantenimiento,
    generarNotificacionesStock,
  } = useNotificaciones();

  const handleNotificacionClick = (notif: any) => {
    marcarComoLeida(notif.id);
    if (notif.accionUrl) {
      navigate(notif.accionUrl);
    }
  };

  const getIconoNivel = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBgNivel = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return 'bg-destructive/10 hover:bg-destructive/20 border-destructive/20';
      case 'warning':
        return 'bg-amber-50 hover:bg-amber-100 border-amber-200';
      default:
        return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          title="Centro de Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notificaciones</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodasComoLeidas}
              disabled={noLeidas === 0}
              title="Marcar todas como leídas"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Cargando notificaciones...
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 transition-colors cursor-pointer ${
                    !notif.leida ? getBgNivel(notif.nivel) : 'hover:bg-muted'
                  } border-l-4 ${!notif.leida ? 'border-l-primary' : 'border-l-transparent'}`}
                  onClick={() => handleNotificacionClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIconoNivel(notif.nivel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">
                          {notif.titulo}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarNotificacion(notif.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.createdAt), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                        {notif.accionUrl && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        
        <div className="p-2 bg-muted/50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={generarNotificacionesMantenimiento}
            >
              🔧 Generar Mantenimientos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={generarNotificacionesStock}
            >
              📦 Generar Stock
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
