/**
 * Página de Notificaciones - Desktop y Mobile
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { NotificacionesMobile } from '@/pages/mobile/NotificacionesMobile';
import { Layout } from '@/components/Layout';
import { useUnifiedNotifications, UnifiedNotification } from '@/hooks/useUnifiedNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  Wrench,
  Package,
  Settings,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';

type FilterType = 'all' | 'unread' | 'mantenimiento' | 'stock';

function NotificacionesDesktop() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  
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

  // Statistics
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: unreadCount,
    critical: notifications.filter(n => n.nivel === 'critical').length,
    warnings: notifications.filter(n => n.nivel === 'warning').length,
    maintenance: notifications.filter(n => n.tipo.includes('mantenimiento')).length,
    stock: notifications.filter(n => n.tipo.includes('stock')).length,
  }), [notifications, unreadCount]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.leida);
        break;
      case 'mantenimiento':
        filtered = filtered.filter(n => n.tipo.includes('mantenimiento') || n.tipo.includes('maintenance'));
        break;
      case 'stock':
        filtered = filtered.filter(n => n.tipo.includes('stock'));
        break;
    }
    return filtered;
  }, [notifications, filter]);

  const handleNotificationClick = (notif: UnifiedNotification) => {
    if (!notif.leida) {
      markAsRead(notif.id);
    }
    if (notif.accionUrl) {
      navigate(notif.accionUrl);
    }
  };

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNivelStyle = (nivel: string, leida: boolean) => {
    if (leida) return "";
    switch (nivel) {
      case 'critical':
        return "bg-destructive/5 border-l-4 border-l-destructive";
      case 'warning':
        return "bg-amber-500/5 border-l-4 border-l-amber-500";
      default:
        return "bg-primary/5 border-l-4 border-l-primary";
    }
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo.includes('mantenimiento') || tipo.includes('maintenance')) {
      return <Wrench className="h-3.5 w-3.5" />;
    }
    if (tipo.includes('stock')) {
      return <Package className="h-3.5 w-3.5" />;
    }
    return <Settings className="h-3.5 w-3.5" />;
  };

  return (
    <Layout title="Notificaciones">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardDescription>Sin leer</CardDescription>
              <CardTitle className="text-3xl text-primary">{stats.unread}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardDescription>Críticas</CardDescription>
              <CardTitle className="text-3xl text-destructive">{stats.critical}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-amber-500/30">
            <CardHeader className="pb-2">
              <CardDescription>Advertencias</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{stats.warnings}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main notification list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BellRing className="h-5 w-5 text-primary" />
                    <CardTitle>Centro de Notificaciones</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refresh}
                      disabled={loading}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
                      Actualizar
                    </Button>
                    {unreadCount > 0 && (
                      <Button variant="outline" size="sm" onClick={markAllAsRead}>
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Marcar todas
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <div className="px-6 pb-4">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="all">
                      Todas
                      <Badge variant="secondary" className="ml-1.5 text-xs">{stats.total}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                      No leídas
                      {stats.unread > 0 && (
                        <Badge variant="destructive" className="ml-1.5 text-xs">{stats.unread}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="mantenimiento">
                      Mant.
                      <Badge variant="secondary" className="ml-1.5 text-xs">{stats.maintenance}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="stock">
                      Stock
                      <Badge variant="secondary" className="ml-1.5 text-xs">{stats.stock}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Separator />

              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary/50" />
                      <p className="text-sm text-muted-foreground mt-3">Cargando notificaciones...</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <BellOff className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-sm font-medium mt-3">Sin notificaciones</p>
                      <p className="text-xs text-muted-foreground">
                        {filter !== 'all' ? 'No hay notificaciones con este filtro' : 'Todo está al día'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-4 hover:bg-muted/50 cursor-pointer transition-all group",
                            getNivelStyle(notif.nivel, notif.leida)
                          )}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex gap-4">
                            <div className={cn(
                              "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                              notif.nivel === 'critical' && "bg-destructive/10",
                              notif.nivel === 'warning' && "bg-amber-500/10",
                              notif.nivel === 'info' && "bg-blue-500/10",
                            )}>
                              {getNivelIcon(notif.nivel)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className={cn(
                                    "text-sm font-medium",
                                    !notif.leida ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {notif.titulo}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notif.mensaje}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notif.leida && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notif.id);
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notif.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="text-xs gap-1">
                                  {getTipoIcon(notif.tipo)}
                                  {notif.fichaEquipo || notif.tipo.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
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
              </CardContent>

              {notifications.length > 0 && (
                <>
                  <Separator />
                  <div className="p-4 flex justify-center">
                    <Button 
                      variant="ghost" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={clearAll}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar todo el historial
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Settings sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Push notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Notificaciones push</Label>
                    <p className="text-xs text-muted-foreground">
                      Alertas en tu dispositivo
                    </p>
                  </div>
                  <Switch
                    checked={pushPermission === 'granted'}
                    onCheckedChange={() => {
                      if (pushPermission !== 'granted') {
                        requestPushPermission();
                      }
                    }}
                  />
                </div>

                <Separator />

                {/* Sound */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label className="text-sm">Sonido</Label>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={handleSoundToggle}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generar alertas</CardTitle>
                <CardDescription className="text-xs">
                  Escanear el sistema en busca de alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={generateMaintenanceNotifications}
                >
                  <Wrench className="h-4 w-4" />
                  Mantenimientos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={generateStockNotifications}
                >
                  <Package className="h-4 w-4" />
                  Stock bajo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function Notificaciones() {
  const { isMobile } = useDeviceDetection();

  if (isMobile) {
    return <NotificacionesMobile />;
  }

  return <NotificacionesDesktop />;
}
