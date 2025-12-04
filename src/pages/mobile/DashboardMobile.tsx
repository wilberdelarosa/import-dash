/**
 * Dashboard móvil optimizado
 * 
 * Características:
 * - Cards compactos con métricas esenciales
 * - Acordeón de actividad reciente
 * - Pull-to-refresh
 * - Vista completa de mantenimientos críticos
 * - Navegación rápida
 */

import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Sparkles,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  History,
  RefreshCw,
  Wrench,
  ExternalLink,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ActualizacionHorasKm {
  id: number;
  ficha: string;
  nombreEquipo: string | null;
  horasKm: number;
  incremento: number;
  fecha: string;
  usuarioResponsable: string;
}

interface MantenimientoRealizado {
  id: number;
  ficha: string;
  nombreEquipo: string | null;
  fechaMantenimiento: string;
  horasKmAlMomento: number;
  usuarioResponsable: string;
}

interface MantenimientoProgramado {
  id: number;
  ficha: string;
  nombreEquipo: string | null;
  tipoMantenimiento: string;
  horasKmRestante: number;
  horasKmActuales: number;
  fechaUltimaActualizacion: string | null;
}

interface DashboardMobileProps {
  equiposActivos: number;
  mantenimientosVencidos: number;
  mantenimientosProgramados: number;
  inventarioBajo: number;
  actualizacionesRecientes?: ActualizacionHorasKm[];
  mantenimientosRecientes?: MantenimientoRealizado[];
  mantenimientosVencidosList?: MantenimientoProgramado[];
  mantenimientosProximosList?: MantenimientoProgramado[];
  onVerEquipo?: (ficha: string) => void;
  onRefresh?: () => Promise<void>;
}

export function DashboardMobile({
  equiposActivos,
  mantenimientosVencidos,
  mantenimientosProgramados,
  inventarioBajo,
  actualizacionesRecientes = [],
  mantenimientosRecientes = [],
  mantenimientosVencidosList = [],
  mantenimientosProximosList = [],
  onVerEquipo,
  onRefresh,
}: DashboardMobileProps) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [actividadExpanded, setActividadExpanded] = useState(false);
  const [vencidosSheetOpen, setVencidosSheetOpen] = useState(false);
  const [proximosSheetOpen, setProximosSheetOpen] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Simular carga si no hay callback
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin registro';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const formatRemainingLabel = (remaining: number, unit: string = 'horas') => {
    // Redondear a entero para evitar decimales largos
    const rounded = Math.round(remaining);
    if (rounded < 0) {
      return `${Math.abs(rounded)} ${unit} venc.`;
    }
    return `${rounded} ${unit} rest.`;
  };

  // Métricas principales
  const metrics = [
    {
      label: 'Equipos activos',
      value: equiposActivos,
      icon: Truck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      gradient: 'from-emerald-500/5 to-emerald-500/10',
      trend: '+5%',
      trendUp: true,
      path: '/equipos'
    },
    {
      label: 'Mant. vencidos',
      value: mantenimientosVencidos,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      gradient: 'from-red-500/5 to-red-500/10',
      urgent: mantenimientosVencidos > 0,
      onClick: () => setVencidosSheetOpen(true),
    },
    {
      label: 'Programados',
      value: mantenimientosProgramados,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      gradient: 'from-blue-500/5 to-blue-500/10',
      onClick: () => setProximosSheetOpen(true),
    },
    {
      label: 'Stock bajo',
      value: inventarioBajo,
      icon: Package,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      gradient: 'from-amber-500/5 to-amber-500/10',
      path: '/inventario'
    },
  ];

  return (
    <>
      <MobileLayout
        title="Dashboard"
        headerActions={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-primary/10 active:scale-95 transition-all"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn(
              "h-5 w-5 transition-transform text-primary",
              refreshing && "animate-spin"
            )} />
          </Button>
        }
      >
        <div className="space-y-3 pb-20 px-1">
          {/* Welcome Section - Compact */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 to-primary p-3 text-primary-foreground shadow-lg">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-0.5 opacity-90">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[0.65rem] font-medium uppercase tracking-wider">Resumen Ejecutivo</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight">Hola, Bienvenido</h2>
              <p className="text-[0.7rem] opacity-90">Aquí tienes el estado actual de tu flota.</p>
            </div>
          </div>

          {/* Alert si hay mantenimientos vencidos - Compact */}
          {mantenimientosVencidos > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="relative overflow-hidden rounded-lg border border-red-200 bg-red-50/80 p-2.5 shadow-sm backdrop-blur-sm dark:border-red-900/30 dark:bg-red-900/10">
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-red-100 p-1.5 dark:bg-red-900/30 flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-red-900 dark:text-red-200">
                      Atención Requerida
                    </h3>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                      Tienes <span className="font-bold">{mantenimientosVencidos}</span> mantenimientos vencidos que necesitan revisión inmediata.
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1.5 h-7 px-0 text-xs text-red-700 hover:text-red-800 hover:bg-transparent dark:text-red-300 dark:hover:text-red-200 font-medium"
                      onClick={() => navigate('/control-mantenimiento')}
                    >
                      Ver detalles →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Métricas principales - Grid compacto */}
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric, index) => (
              <div
                key={index}
                onClick={() => metric.onClick ? metric.onClick() : metric.path && navigate(metric.path)}
                className={cn(
                  "group relative overflow-hidden rounded-lg border p-2.5 transition-all active:scale-95 cursor-pointer shadow-sm",
                  "bg-gradient-to-br backdrop-blur-sm",
                  metric.gradient,
                  metric.borderColor,
                  metric.urgent && "ring-1 ring-red-500/20 border-red-500/30"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={cn(
                    "rounded-lg p-2 shadow-sm",
                    "bg-background/60 backdrop-blur-md"
                  )}>
                    <metric.icon className={cn("h-4 w-4", metric.color)} />
                  </div>
                  {metric.trend && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      metric.trendUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700"
                    )}>
                      {metric.trendUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {metric.trend}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-xl font-bold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                  <p className="text-[0.6rem] font-medium text-muted-foreground uppercase tracking-wide truncate">
                    {metric.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Acordeón de Actividad Reciente */}
          {(actualizacionesRecientes.length > 0 || mantenimientosRecientes.length > 0) && (
            <MobileCard variant="glass" className="p-0 overflow-hidden">
              <button
                onClick={() => setActividadExpanded(!actividadExpanded)}
                className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors active:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-xs">Actividad Reciente</span>
                  <Badge variant="secondary" className="text-[0.65rem] h-5">
                    {actualizacionesRecientes.length + mantenimientosRecientes.length}
                  </Badge>
                </div>
                {actividadExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {actividadExpanded && (
                <div className="border-t border-border/50 animate-in slide-in-from-top-2 fade-in">
                  <div className="p-3 space-y-3">
                    {actualizacionesRecientes.length > 0 && (
                      <div>
                        <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Actualizaciones de Horas/Km
                        </h4>
                        <div className="space-y-1.5">
                          {actualizacionesRecientes.slice(0, 5).map((act) => (
                            <div key={act.id} className="rounded-lg border border-border/30 p-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[0.7rem] font-medium truncate">{act.nombreEquipo || `Ficha ${act.ficha}`}</p>
                                  <p className="text-[0.6rem] text-muted-foreground">
                                    {act.horasKm} ({act.incremento >= 0 ? '+' : ''}{act.incremento})
                                  </p>
                                </div>
                                <span className="text-[0.6rem] text-muted-foreground whitespace-nowrap ml-2">
                                  {formatDate(act.fecha)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mantenimientosRecientes.length > 0 && (
                      <>
                        {actualizacionesRecientes.length > 0 && <Separator />}
                        <div>
                          <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                            <Wrench className="h-3 w-3" /> Mantenimientos Realizados
                          </h4>
                          <div className="space-y-1.5">
                            {mantenimientosRecientes.slice(0, 5).map((mant) => (
                              <div key={mant.id} className="rounded-lg border border-border/30 p-2 bg-muted/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[0.7rem] font-medium truncate">{mant.nombreEquipo || `Ficha ${mant.ficha}`}</p>
                                    <p className="text-[0.6rem] text-muted-foreground">
                                      {mant.horasKmAlMomento} horas/km
                                    </p>
                                  </div>
                                  <span className="text-[0.6rem] text-muted-foreground whitespace-nowrap ml-2">
                                    {formatDate(mant.fechaMantenimiento)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 h-8 text-xs"
                      onClick={() => navigate('/historial')}
                    >
                      <History className="h-3 w-3" />
                      Ver historial completo
                    </Button>
                  </div>
                </div>
              )}
            </MobileCard>
          )}

          {/* Mantenimientos Vencidos */}
          {mantenimientosVencidosList.length > 0 && (
            <MobileCard variant="glass" className="p-0 overflow-hidden border-red-500/30">
              <div className="p-2.5 border-b border-border/50 bg-gradient-to-r from-red-500/5 to-transparent">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-red-500/10 p-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-xs text-red-900 dark:text-red-200 block truncate">Mantenimientos Vencidos</span>
                      <p className="text-[0.6rem] text-red-700 dark:text-red-300">Requieren atención inmediata</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-[0.65rem] h-5">{mantenimientosVencidosList.length}</Badge>
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                {mantenimientosVencidosList.slice(0, 5).map((mant) => (
                  <button
                    key={mant.id}
                    onClick={() => onVerEquipo && onVerEquipo(mant.ficha)}
                    className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-2 hover:bg-red-500/10 transition-all active:scale-98 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate text-foreground">{mant.nombreEquipo || 'Equipo sin nombre'}</p>
                        <p className="text-[0.6rem] text-muted-foreground">Ficha {mant.ficha}</p>
                      </div>
                      <Badge variant="destructive" className="text-[0.6rem] h-5 max-w-[90px] truncate">
                        {formatRemainingLabel(mant.horasKmRestante, mant.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas')}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              {mantenimientosVencidosList.length > 5 && (
                <div className="p-2 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 h-8 text-xs border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-500/10"
                    onClick={() => setVencidosSheetOpen(true)}
                  >
                    Ver todos ({mantenimientosVencidosList.length})
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </MobileCard>
          )}

          {/* Mantenimientos Próximos */}
          {mantenimientosProximosList.length > 0 && (
            <MobileCard variant="glass" className="p-0 overflow-hidden border-primary/30">
              <div className="p-2.5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-xs block truncate">Mantenimientos Próximos</span>
                      <p className="text-[0.6rem] text-muted-foreground">Próximas intervenciones</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[0.65rem] h-5">{mantenimientosProximosList.length}</Badge>
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                {mantenimientosProximosList.slice(0, 5).map((mant) => (
                  <button
                    key={mant.id}
                    onClick={() => onVerEquipo && onVerEquipo(mant.ficha)}
                    className="w-full rounded-lg border border-primary/20 bg-primary/5 p-2 hover:bg-primary/10 transition-all active:scale-98 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate text-foreground">{mant.nombreEquipo || 'Equipo sin nombre'}</p>
                        <p className="text-[0.6rem] text-muted-foreground">Ficha {mant.ficha}</p>
                      </div>
                      <Badge variant="outline" className="text-[0.6rem] h-5 border-primary/30 text-primary max-w-[90px] truncate">
                        {formatRemainingLabel(mant.horasKmRestante, mant.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas')}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              {mantenimientosProximosList.length > 5 && (
                <div className="p-2 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => setProximosSheetOpen(true)}
                  >
                    Ver todos ({mantenimientosProximosList.length})
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </MobileCard>
          )}

          {/* Accesos Rápidos */}
          <MobileCard variant="glass" className="p-0 overflow-hidden">
            <div className="p-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-xs">Acceso Rápido</span>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border/50 text-center">
              <button
                onClick={() => navigate('/asistente')}
                className="flex flex-col items-center justify-center gap-1 py-3 hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-[0.6rem] font-medium">Asistente IA</span>
              </button>
              <button
                onClick={() => navigate('/reportes')}
                className="flex flex-col items-center justify-center gap-1 py-3 hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-[0.6rem] font-medium">Reportes</span>
              </button>
              <button
                onClick={() => navigate('/listas-personalizadas')}
                className="flex flex-col items-center justify-center gap-1 py-3 hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-[0.6rem] font-medium">Listas</span>
              </button>
            </div>
          </MobileCard>
        </div>
      </MobileLayout>

      {/* Sheet de Mantenimientos Vencidos */}
      <Sheet open={vencidosSheetOpen} onOpenChange={setVencidosSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
          <SheetHeader className="mt-4">
            <SheetTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Mantenimientos Vencidos ({mantenimientosVencidosList.length})
            </SheetTitle>
            <SheetDescription>
              Equipos con horas/km excedidas que requieren atención inmediata
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(80vh-140px)] pb-4">
            {mantenimientosVencidosList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay mantenimientos vencidos
              </div>
            ) : (
              mantenimientosVencidosList.map((mant) => (
                <MobileCard
                  key={mant.id}
                  variant="compact"
                  className="border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
                  onClick={() => {
                    if (onVerEquipo) {
                      onVerEquipo(mant.ficha);
                      setVencidosSheetOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{mant.nombreEquipo || 'Equipo sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">Ficha {mant.ficha}</p>
                      <p className="text-xs text-muted-foreground mt-1">{mant.tipoMantenimiento}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="destructive" className="text-[0.65rem] max-w-[120px] truncate">
                        {formatRemainingLabel(mant.horasKmRestante, mant.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas')}
                      </Badge>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </MobileCard>
              ))
            )}
          </div>
          <div className="pt-4 border-t">
            <Button
              className="w-full"
              onClick={() => {
                navigate('/control-mantenimiento');
                setVencidosSheetOpen(false);
              }}
            >
              Ver módulo completo
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Mantenimientos Próximos */}
      <Sheet open={proximosSheetOpen} onOpenChange={setProximosSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
          <SheetHeader className="mt-4">
            <SheetTitle className="flex items-center gap-2 text-primary">
              <CalendarClock className="h-5 w-5" />
              Mantenimientos Próximos ({mantenimientosProximosList.length})
            </SheetTitle>
            <SheetDescription>
              Próximas intervenciones programadas
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(80vh-140px)] pb-4">
            {mantenimientosProximosList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay mantenimientos próximos
              </div>
            ) : (
              mantenimientosProximosList.map((mant) => (
                <MobileCard
                  key={mant.id}
                  variant="compact"
                  className="border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => {
                    if (onVerEquipo) {
                      onVerEquipo(mant.ficha);
                      setProximosSheetOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{mant.nombreEquipo || 'Equipo sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">Ficha {mant.ficha}</p>
                      <p className="text-xs text-muted-foreground mt-1">{mant.tipoMantenimiento}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-[0.65rem] border-primary/30 text-primary max-w-[120px] truncate">
                        {formatRemainingLabel(mant.horasKmRestante, mant.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas')}
                      </Badge>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </MobileCard>
              ))
            )}
          </div>
          <div className="pt-4 border-t">
            <Button
              className="w-full"
              onClick={() => {
                navigate('/planificador');
                setProximosSheetOpen(false);
              }}
            >
              Ver módulo completo
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

