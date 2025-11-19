/**
 * Dashboard móvil optimizado
 * 
 * Características:
 * - Cards compactos con métricas esenciales
 * - Gráficos responsivos touch-friendly
 * - Pull-to-refresh
 * - Navegación rápida por swipe
 */

import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard, MobileListCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  Package,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface DashboardMobileProps {
  equiposActivos: number;
  mantenimientosVencidos: number;
  mantenimientosProgramados: number;
  inventarioBajo: number;
}

export function DashboardMobile({
  equiposActivos,
  mantenimientosVencidos,
  mantenimientosProgramados,
  inventarioBajo,
}: DashboardMobileProps) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Métricas principales
  const metrics = [
    {
      label: 'Equipos activos',
      value: equiposActivos,
      icon: Truck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Mant. vencidos',
      value: mantenimientosVencidos,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      urgent: mantenimientosVencidos > 0,
    },
    {
      label: 'Programados',
      value: mantenimientosProgramados,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Stock bajo',
      value: inventarioBajo,
      icon: Package,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  // Accesos rápidos
  const quickActions = [
    { label: 'Nuevo mantenimiento', path: '/control-mantenimiento', icon: Wrench },
    { label: 'Ver equipos', path: '/equipos', icon: Truck },
    { label: 'Inventario', path: '/inventario', icon: Package },
    { label: 'Planificador', path: '/planificador', icon: Clock },
  ];

  return (
    <MobileLayout
      title="Dashboard"
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <TrendingUp className={cn(
            "h-5 w-5 transition-transform",
            refreshing && "animate-spin"
          )} />
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Alert si hay mantenimientos vencidos */}
        {mantenimientosVencidos > 0 && (
          <div className="rounded-lg border-l-4 border-l-red-500 bg-red-500/10 p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {mantenimientosVencidos} mantenimientos vencidos
                </p>
                <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
                  Requieren atención inmediata
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas principales - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={cn(
                "rounded-lg border bg-card p-3 transition-all active:scale-95",
                metric.urgent && "border-l-4 border-l-red-500"
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn(
                  "rounded-lg p-2",
                  metric.bgColor
                )}>
                  <metric.icon className={cn("h-5 w-5", metric.color)} />
                </div>
                {metric.trend && (
                  <div className="flex items-center gap-0.5 text-xs">
                    {metric.trendUp ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn(
                      "font-medium",
                      metric.trendUp ? "text-green-500" : "text-red-500"
                    )}>
                      {metric.trend}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-2xl font-bold">{metric.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Accesos rápidos */}
        <MobileCard title="Accesos rápidos" variant="compact">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto flex-col gap-2 py-3"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </MobileCard>

        {/* Lista de equipos críticos (ejemplo) */}
        <MobileCard title="Equipos críticos" description="Requieren atención">
          <div className="space-y-2">
            <MobileListCard
              title="AC-003 GRUA BLANCA JAC"
              subtitle="913 hrs vencido"
              meta="Último mant: 15/Oct/2024"
              icon={<AlertTriangle className="h-5 w-5" />}
              badge={<Badge variant="destructive" className="text-[0.65rem]">Urgente</Badge>}
              onClick={() => navigate('/control-mantenimiento')}
            />
            <MobileListCard
              title="AC-044 CAMION SINOTRUCK"
              subtitle="901 hrs vencido"
              meta="Último mant: 20/Oct/2024"
              icon={<AlertTriangle className="h-5 w-5" />}
              badge={<Badge variant="destructive" className="text-[0.65rem]">Urgente</Badge>}
              onClick={() => navigate('/control-mantenimiento')}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full gap-2"
            onClick={() => navigate('/control-mantenimiento')}
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Button>
        </MobileCard>

        {/* Estado del sistema */}
        <MobileCard variant="compact">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Estado del sistema</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium text-green-600 dark:text-green-400">
                Operativo
              </span>
            </div>
          </div>
        </MobileCard>
      </div>
    </MobileLayout>
  );
}
