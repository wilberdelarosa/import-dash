/**
 * Centro de Notificaciones Móvil para Supervisores
 * 
 * Características:
 * - Visualización de todas las alertas y notificaciones
 * - Filtros por tipo (mantenimiento, stock, sistema)
 * - Marcar como leído/no leído
 * - Eliminar notificaciones
 * - Push notifications nativas
 */

import { useState, useMemo, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FilterType = 'all' | 'unread' | 'mantenimiento' | 'stock' | 'sistema';

export function NotificacionesMobile() {
  const navigate = useNavigate();
  const {
    notificaciones,
    loading,
    marcarComoLeida,
    eliminarNotificacion,
    marcarTodasComoLeidas,
    generarNotificacionesMantenimiento,
  } = useNotificaciones();
  
  // Estado de permisos push
  const [permisoPush, setPermisoPush] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermisoPush(Notification.permission);
    }
  }, []);
  
  const solicitarPermisoPush = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermisoPush(permission);
    }
  };

  const [filter, setFilter] = useState<FilterType>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estadísticas
  const stats = useMemo(() => ({
    total: notificaciones.length,
    noLeidas: notificaciones.filter(n => !n.leida).length,
    criticas: notificaciones.filter(n => n.nivel === 'critical').length,
    advertencias: notificaciones.filter(n => n.nivel === 'warning').length,
  }), [notificaciones]);

  // Filtrado
  const notificacionesFiltradas = useMemo(() => {
    let filtered = notificaciones;

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
      case 'sistema':
        filtered = filtered.filter(n => 
          n.tipo.includes('sistema') || n.tipo.includes('system')
        );
        break;
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notificaciones, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await generarNotificacionesMantenimiento();
    setRefreshing(false);
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

  const getTipoIcon = (tipo: string) => {
    if (tipo.includes('mantenimiento') || tipo.includes('maintenance')) {
      return <Wrench className="h-4 w-4" />;
    }
    if (tipo.includes('stock')) {
      return <Package className="h-4 w-4" />;
    }
    return <Settings className="h-4 w-4" />;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace un momento';
    if (hours < 24) return `Hace ${hours}h`;
    return format(d, "d MMM HH:mm", { locale: es });
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
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              (refreshing || loading) && "animate-spin"
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
          <MobileCard variant="compact" className="p-2 text-center border-primary/20 bg-primary/5">
            <p className="text-lg font-bold text-primary">{stats.noLeidas}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Nuevas</p>
          </MobileCard>
          <MobileCard variant="compact" className="p-2 text-center border-destructive/20 bg-destructive/5">
            <p className="text-lg font-bold text-destructive">{stats.criticas}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Críticas</p>
          </MobileCard>
          <MobileCard variant="compact" className="p-2 text-center border-amber-500/20 bg-amber-500/5">
            <p className="text-lg font-bold text-amber-600">{stats.advertencias}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Alertas</p>
          </MobileCard>
        </div>

        {/* Acciones rápidas */}
        {stats.noLeidas > 0 && (
          <div className="flex gap-2 px-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={marcarTodasComoLeidas}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas leídas
            </Button>
          </div>
        )}

        {/* Filtro activo */}
        {filter !== 'all' && (
          <div className="flex items-center gap-2 px-1">
            <Badge variant="secondary" className="gap-1 text-xs">
              {filter === 'unread' && 'No leídas'}
              {filter === 'mantenimiento' && 'Mantenimiento'}
              {filter === 'stock' && 'Stock'}
              {filter === 'sistema' && 'Sistema'}
              <button onClick={() => setFilter('all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Lista de notificaciones */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
          </div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
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
            {notificacionesFiltradas.map((notif, index) => (
              <MobileCard
                key={notif.id}
                className={cn(
                  "p-2.5 transition-all",
                  !notif.leida && "border-l-2 border-l-primary bg-primary/5",
                  "animate-in slide-in-from-bottom-2 fade-in"
                )}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex gap-2">
                  {/* Icono */}
                  <div className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    notif.nivel === 'critical' && "bg-destructive/10",
                    notif.nivel === 'warning' && "bg-amber-500/10",
                    notif.nivel === 'info' && "bg-blue-500/10",
                  )}>
                    {getNivelIcon(notif.nivel)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className={cn(
                        "text-sm font-medium line-clamp-1",
                        !notif.leida && "text-foreground",
                        notif.leida && "text-muted-foreground"
                      )}>
                        {notif.titulo}
                      </h4>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.mensaje}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1">
                        {getTipoIcon(notif.tipo)}
                        {notif.fichaEquipo || notif.tipo.split('_').join(' ')}
                      </Badge>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 mt-2">
                      {notif.accionUrl && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => navigate(notif.accionUrl!)}
                        >
                          Ver detalle
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => marcarComoLeida(notif.id)}
                      >
                        {notif.leida ? (
                          <>
                            <Bell className="h-3 w-3 mr-1" />
                            No leída
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Leída
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                        onClick={() => eliminarNotificacion(notif.id)}
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

      {/* Sheet de filtros */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-2xl">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-muted" />
          <SheetHeader className="mt-3">
            <SheetTitle className="text-base">Filtrar notificaciones</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 mt-4 pb-4">
            {[
              { value: 'all', label: 'Todas', count: stats.total },
              { value: 'unread', label: 'No leídas', count: stats.noLeidas },
              { value: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
              { value: 'stock', label: 'Stock', icon: Package },
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'default' : 'outline'}
                className="h-12 justify-start gap-2"
                onClick={() => {
                  setFilter(item.value as FilterType);
                  setFilterSheetOpen(false);
                }}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
                {'count' in item && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de configuración */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-muted" />
          <SheetHeader className="mt-3">
            <SheetTitle className="text-base">Configuración de alertas</SheetTitle>
            <SheetDescription className="text-xs">
              Gestiona cómo recibes las notificaciones
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notificaciones push</Label>
                <p className="text-xs text-muted-foreground">
                  Recibe alertas incluso sin la app abierta
                </p>
              </div>
              <Switch
                checked={permisoPush === 'granted'}
                onCheckedChange={() => {
                  if (permisoPush !== 'granted') {
                    solicitarPermisoPush();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Tipos de alertas que recibirás:
              </p>
              <div className="space-y-2">
                {[
                  { icon: Wrench, label: 'Mantenimientos próximos y vencidos' },
                  { icon: Package, label: 'Stock bajo de inventario' },
                  { icon: AlertCircle, label: 'Alertas críticas del sistema' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </MobileLayout>
  );
}
