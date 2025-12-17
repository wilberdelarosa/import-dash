import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Wrench,
  Package,
  Volume2,
  VolumeX,
  RefreshCw,
  Settings,
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUnifiedNotifications, UnifiedNotification } from '@/hooks/useUnifiedNotifications';
import { cleanDecimalsInText } from '@/lib/mobileFormatters';

export function UnifiedNotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const {
    notifications,
    unreadCount,
    loading,
    pushPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPushPermission,
    generateMaintenanceNotifications,
    generateStockNotifications,
    refresh,
    toggleSound,
    isSoundEnabled
  } = useUnifiedNotifications();

  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    toggleSound(enabled);
  };

  const handleNotificationClick = (notif: UnifiedNotification) => {
    if (!notif.leida) {
      markAsRead(notif.id);
    }
    if (notif.accionUrl) {
      navigate(notif.accionUrl);
      setIsOpen(false);
    }
  };

  const getIcon = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const getNotificationStyle = (notif: UnifiedNotification) => {
    if (notif.leida) {
      return 'bg-transparent hover:bg-muted/50';
    }

    switch (notif.nivel) {
      case 'critical':
        return 'bg-destructive/5 hover:bg-destructive/10 border-l-destructive';
      case 'warning':
        return 'bg-amber-500/5 hover:bg-amber-500/10 border-l-amber-500';
      default:
        return 'bg-primary/5 hover:bg-primary/10 border-l-primary';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notif.leida;
    if (activeTab === 'maintenance') return notif.tipo.includes('mantenimiento');
    if (activeTab === 'stock') return notif.tipo.includes('stock');
    return true;
  });

  const unreadFilterCount = notifications.filter(n => !n.leida).length;
  const maintenanceCount = notifications.filter(n => n.tipo.includes('mantenimiento')).length;
  const stockCount = notifications.filter(n => n.tipo.includes('stock')).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl hover:bg-accent transition-all duration-200"
        >
          <Bell className={cn(
            "h-5 w-5 transition-colors",
            unreadCount > 0 ? "text-amber-500" : "text-muted-foreground"
          )} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1.5 animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={refresh}
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={markAllAsRead}
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Push notification banner */}
        {pushPermission !== 'granted' && (
          <div className="flex items-center justify-between gap-3 p-3 bg-primary/5 border-b text-sm">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Activa alertas en tu dispositivo</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={requestPushPermission}
            >
              Activar
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-2 pt-2 border-b">
            <TabsList className="w-full h-9 bg-muted/50">
              <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-background">
                Todas
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 text-xs data-[state=active]:bg-background">
                No leídas
                {unreadFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {unreadFilterCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex-1 text-xs data-[state=active]:bg-background">
                Mant.
                {maintenanceCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {maintenanceCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex-1 text-xs data-[state=active]:bg-background">
                Stock
                {stockCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {stockCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[350px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">
                    {activeTab === 'unread'
                      ? 'No tienes notificaciones sin leer'
                      : 'No hay notificaciones'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all duration-150 border-l-2 group",
                        getNotificationStyle(notif),
                        !notif.leida && "border-l-2"
                      )}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex gap-3">
                        {getIcon(notif.nivel)}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm leading-tight",
                              !notif.leida ? "font-semibold" : "font-medium text-muted-foreground"
                            )}>
                              {notif.titulo}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notif.leida && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif.id);
                                  }}
                                  title="Marcar como leída"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                title="Eliminar"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {cleanDecimalsInText(notif.mensaje)}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                                locale: es
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              {notif.fichaEquipo && (
                                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                                  {notif.fichaEquipo}
                                </Badge>
                              )}
                              {notif.accionUrl && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Actions */}
        <div className="p-3 space-y-3 bg-muted/20">
          {/* Sound toggle */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span>Sonido de notificación</span>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
              className="scale-90"
            />
          </div>

          {/* Generate buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={generateMaintenanceNotifications}
            >
              <Wrench className="h-3.5 w-3.5" />
              Mant.
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={generateStockNotifications}
            >
              <Package className="h-3.5 w-3.5" />
              Stock
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
