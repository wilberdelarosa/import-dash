/**
 * Centro de Notificaciones Móvil
 * 
 * Sistema unificado de notificaciones con:
 * - Sincronización en tiempo real
 * - Push notifications nativas
 * - Filtros inteligentes
 * - Acciones optimistas
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUnifiedNotifications, UnifiedNotification } from '@/hooks/useUnifiedNotifications';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Filter,
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
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type FilterType = 'all' | 'unread' | 'mantenimiento' | 'stock';

export function NotificacionesMobile() {
  const navigate = useNavigate();
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

  const [filter, setFilter] = useState<FilterType>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
        filtered = filtered.filter(n => 
          n.tipo.includes('mantenimiento') || n.tipo.includes('maintenance')
        );
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
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNivelStyle = (nivel: string, leida: boolean) => {
    if (leida) return "bg-transparent";
    switch (nivel) {
      case 'critical':
        return "bg-destructive/5 border-l-destructive";
      case 'warning':
        return "bg-amber-500/5 border-l-amber-500";
      default:
        return "bg-primary/5 border-l-primary";
    }
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo.includes('mantenimiento') || tipo.includes('maintenance')) {
      return <Wrench className="h-3 w-3" />;
    }
    if (tipo.includes('stock')) {
      return <Package className="h-3 w-3" />;
    }
    return <Settings className="h-3 w-3" />;
  };

  return (
    <MobileLayout
      title="Notificaciones"
      showBottomNav={true}
      headerActions={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              loading && "animate-spin"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full relative"
            onClick={() => setFilterSheetOpen(true)}
          >
            <Filter className="h-4 w-4" />
            {filter !== 'all' && (
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-3 pb-20 -mx-1">
        {/* Stats compactos */}
        <div className="grid grid-cols-4 gap-1.5 px-1">
          <MobileCard variant="compact" className="p-2 text-center">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Total</p>
          </MobileCard>
          <MobileCard variant="compact" className="p-2 text-center border-primary/30">
            <p className="text-lg font-bold text-primary">{stats.unread}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Nuevas</p>
          </MobileCard>
          <MobileCard variant="compact" className="p-2 text-center border-destructive/30">
            <p className="text-lg font-bold text-destructive">{stats.critical}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Críticas</p>
          </MobileCard>
          <MobileCard variant="compact" className="p-2 text-center border-amber-500/30">
            <p className="text-lg font-bold text-amber-600">{stats.warnings}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Alertas</p>
          </MobileCard>
        </div>

        {/* Quick actions */}
        {stats.unread > 0 && (
          <div className="flex gap-2 px-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas leídas
            </Button>
          </div>
        )}

        {/* Active filter badge */}
        {filter !== 'all' && (
          <div className="flex items-center gap-2 px-1">
            <Badge variant="secondary" className="gap-1 text-xs">
              {filter === 'unread' && 'No leídas'}
              {filter === 'mantenimiento' && 'Mantenimiento'}
              {filter === 'stock' && 'Stock'}
              <button onClick={() => setFilter('all')} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Notification list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary/50" />
            <p className="text-sm text-muted-foreground mt-3">Cargando...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <BellOff className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">Sin notificaciones</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== 'all' ? 'No hay notificaciones con este filtro' : 'Todo está al día'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 px-1">
            {filteredNotifications.map((notif, index) => (
              <MobileCard
                key={notif.id}
                className={cn(
                  "p-3 transition-all border-l-2",
                  getNivelStyle(notif.nivel, notif.leida),
                  !notif.leida && "shadow-sm"
                )}
                style={{ 
                  animationDelay: `${index * 0.02}s`,
                  animation: 'fadeIn 0.3s ease-out forwards'
                }}
              >
                <div className="flex gap-3">
                  {/* Level icon */}
                  <div className={cn(
                    "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
                    notif.nivel === 'critical' && "bg-destructive/10",
                    notif.nivel === 'warning' && "bg-amber-500/10",
                    notif.nivel === 'info' && "bg-blue-500/10",
                  )}>
                    {getNivelIcon(notif.nivel)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "text-sm font-medium line-clamp-1",
                        !notif.leida ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {notif.titulo}
                      </h4>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(notif.createdAt), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.mensaje}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] h-5 px-1.5 gap-1">
                        {getTipoIcon(notif.tipo)}
                        <span>{notif.fichaEquipo || notif.tipo.replace(/_/g, ' ')}</span>
                      </Badge>
                      {notif.accionUrl && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {notif.accionUrl && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-[10px] px-2.5"
                          onClick={() => handleNotificationClick(notif)}
                        >
                          Ver detalle
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 gap-1"
                        onClick={() => markAsRead(notif.id)}
                      >
                        <Check className="h-3 w-3" />
                        {notif.leida ? 'Leída' : 'Marcar leída'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNotification(notif.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-2xl">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-muted" />
          <SheetHeader className="mt-3">
            <SheetTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar notificaciones
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 mt-4 pb-6">
            {[
              { value: 'all', label: 'Todas', count: stats.total },
              { value: 'unread', label: 'No leídas', count: stats.unread },
              { value: 'mantenimiento', label: 'Mantenimiento', count: stats.maintenance, icon: Wrench },
              { value: 'stock', label: 'Stock', count: stats.stock, icon: Package },
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'default' : 'outline'}
                className="h-14 justify-start gap-2 px-3"
                onClick={() => {
                  setFilter(item.value as FilterType);
                  setFilterSheetOpen(false);
                }}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="flex-1 text-left">{item.label}</span>
                <Badge variant={filter === item.value ? "secondary" : "outline"} className="text-xs">
                  {item.count}
                </Badge>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-muted" />
          <SheetHeader className="mt-3">
            <SheetTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración de alertas
            </SheetTitle>
            <SheetDescription className="text-xs">
              Personaliza cómo recibes las notificaciones
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-4 pb-6">
            {/* Push notifications */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BellRing className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Push notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibe alertas en tu dispositivo
                  </p>
                </div>
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

            {/* Sound */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                  {soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Sonido</Label>
                  <p className="text-xs text-muted-foreground">
                    Sonido al recibir notificaciones
                  </p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>

            {/* Generate buttons */}
            <div className="pt-2 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase px-1">
                Generar alertas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-12 gap-2"
                  onClick={generateMaintenanceNotifications}
                >
                  <Wrench className="h-4 w-4" />
                  Mantenimientos
                </Button>
                <Button
                  variant="outline"
                  className="h-12 gap-2"
                  onClick={generateStockNotifications}
                >
                  <Package className="h-4 w-4" />
                  Stock bajo
                </Button>
              </div>
            </div>

            {/* Clear all */}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                className="w-full h-12 text-muted-foreground hover:text-destructive hover:border-destructive gap-2"
                onClick={clearAll}
              >
                <Trash2 className="h-4 w-4" />
                Limpiar todo el historial
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </MobileLayout>
  );
}
