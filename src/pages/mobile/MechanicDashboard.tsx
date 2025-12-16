/**
 * Dashboard del Mecánico - Mobile First
 * Muestra métricas personales y accesos rápidos
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMechanicSubmissions } from '@/hooks/useMechanicSubmissions';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useAuth } from '@/context/AuthContext';
import { EquipoDetalleUnificado } from '@/components/EquipoDetalleUnificado';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Wrench,
  Plus,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSystemConfig } from '@/context/SystemConfigContext';

export function MechanicDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submissions, loading, getStats } = useMechanicSubmissions();
  const { data } = useSupabaseDataContext();
  const { config } = useSystemConfig();
  const mantenimientos = data.mantenimientosProgramados;
  const equipos = data.equipos;

  // Estado para el detalle unificado
  const [selectedFicha, setSelectedFicha] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  const stats = useMemo(() => getStats(), [getStats]);

  // Fichas de equipos activos (no vendidos)
  const fichasEquiposActivos = useMemo(() => {
    return new Set(
      equipos
        .filter(e => e.activo && e.empresa !== 'VENDIDO')
        .map(e => e.ficha)
    );
  }, [equipos]);

  // Equipos con mantenimiento pendiente/vencido (solo equipos activos)
  const equiposPendientes = useMemo(() => {
    return mantenimientos.filter(m => m.activo && m.horasKmRestante <= config.alertaPreventiva && fichasEquiposActivos.has(m.ficha));
  }, [mantenimientos, fichasEquiposActivos, config.alertaPreventiva]);

  const equiposVencidos = useMemo(() => {
    return equiposPendientes
      .filter(m => m.horasKmRestante < 0)
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [equiposPendientes]);

  const equiposProximos = useMemo(() => {
    return equiposPendientes
      .filter(m => m.horasKmRestante >= 0 && m.horasKmRestante <= config.alertaPreventiva)
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [equiposPendientes, config.alertaPreventiva]);

  // Últimos reportes
  const recentSubmissions = useMemo(() => {
    return submissions.slice(0, 3);
  }, [submissions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendiente</Badge>;
      case 'approved':
      case 'integrated':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rechazado</Badge>;
      default:
        return null;
    }
  };

  const handleOpenDetalle = (ficha: string) => {
    setSelectedFicha(ficha);
    setDetalleOpen(true);
  };

  const formatRemaining = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return '0h';

    const abs = Math.abs(numberValue);
    const rounded = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;
    const text = rounded.toLocaleString('es-ES', {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
      maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    });
    return `${text}h`;
  };

  const formatReading = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return '0h';

    const rounded = Math.abs(numberValue) >= 100
      ? Math.round(numberValue)
      : Math.round(numberValue * 10) / 10;

    const text = rounded.toLocaleString('es-ES', {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
      maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    });
    return `${text}h`;
  };

  return (
    <MobileLayout title="Mecánico" showBottomNav={true}>
      <div className="space-y-3 pb-20">
        {/* Saludo */}
        <MobileCard variant="glass" className="p-3 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bienvenido</p>
              <h2 className="text-sm font-semibold">
                {user?.email?.split('@')[0] || 'Mecánico'}
              </h2>
            </div>
          </div>
        </MobileCard>

        {/* Métricas personales */}
        <div className="grid grid-cols-4 gap-1.5">
          <MobileCard className="p-2 text-center border-amber-500/20 bg-amber-500/5">
            <Clock className="h-4 w-4 mx-auto text-amber-600 mb-1" />
            <p className="text-lg font-bold">{stats.pending}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Pendientes</p>
          </MobileCard>
          <MobileCard className="p-2 text-center border-green-500/20 bg-green-500/5">
            <CheckCircle className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold">{stats.approved}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Aprobados</p>
          </MobileCard>
          <MobileCard className="p-2 text-center border-destructive/20 bg-destructive/5">
            <XCircle className="h-4 w-4 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold">{stats.rejected}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Rechazados</p>
          </MobileCard>
          <MobileCard className="p-2 text-center border-primary/20 bg-primary/5">
            <FileText className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{stats.thisMonth}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Este mes</p>
          </MobileCard>
        </div>

        {/* Estado de equipos (Vencidos / Próximos) */}
        <MobileCard className="p-3">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Estado de Equipos
          </h3>
          <Tabs defaultValue="vencidos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="vencidos" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                Vencidos ({equiposVencidos.length})
              </TabsTrigger>
              <TabsTrigger value="proximos" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                Próximos ({equiposProximos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vencidos" className="mt-0 data-[state=active]:block h-list-default overflow-hidden">
              {equiposVencidos.length === 0 ? (
                <div className="text-center py-6 h-full flex flex-col items-center justify-center">
                  <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium text-green-600">¡Excelente!</p>
                  <p className="text-xs text-muted-foreground">Sin mantenimientos vencidos</p>
                </div>
              ) : (
                <div className="space-y-2 h-full overflow-y-auto">
                  {equiposVencidos.map((mant, index) => (
                    <div
                      key={mant.id}
                      onClick={() => handleOpenDetalle(mant.ficha)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all h-[52px]",
                        "border-destructive/30 bg-destructive/5 active:bg-destructive/10",
                        "animate-in slide-in-from-left-2"
                      )}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <Truck className="h-4 w-4 text-destructive shrink-0" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-xs font-medium truncate">{mant.nombreEquipo}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="truncate">{mant.ficha}</span>
                            <span>•</span>
                            <span className="tabular-nums shrink-0">{formatReading(mant.horasKmActuales)}</span>
                          </p>
                        </div>
                      </div>
                      <Badge className="h-5 px-1.5 text-[10px] leading-none font-medium shrink-0 ml-2 tabular-nums bg-destructive/10 text-destructive border-destructive/20">
                        {formatRemaining(mant.horasKmRestante)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="proximos" className="mt-0 h-list-default overflow-hidden">
              {equiposProximos.length === 0 ? (
                <div className="text-center py-6 h-full flex flex-col items-center justify-center">
                  <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium text-green-600">Todo en orden</p>
                  <p className="text-xs text-muted-foreground">Sin mantenimientos próximos</p>
                </div>
              ) : (
                <div className="space-y-2 h-full overflow-y-auto">
                  {equiposProximos.map((mant, index) => (
                    <div
                      key={mant.id}
                      onClick={() => handleOpenDetalle(mant.ficha)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all h-[52px]",
                        "border-amber-500/30 bg-amber-500/5 active:bg-amber-500/10",
                        "animate-in slide-in-from-left-2"
                      )}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <Truck className="h-4 w-4 text-amber-600 shrink-0" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-xs font-medium truncate">{mant.nombreEquipo}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="truncate">{mant.ficha}</span>
                            <span>•</span>
                            <span className="tabular-nums shrink-0">{formatReading(mant.horasKmActuales)}</span>
                          </p>
                        </div>
                      </div>
                      <Badge className="h-5 px-1.5 text-[10px] leading-none font-medium shrink-0 ml-2 tabular-nums bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {formatRemaining(mant.horasKmRestante)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </MobileCard>

        {/* Botón principal - Nuevo Reporte */}
        <Button
          className="w-full h-12 text-sm gap-2 bg-primary hover:bg-primary/90"
          onClick={() => navigate('/mechanic/reportar')}
        >
          <Plus className="h-5 w-5" />
          Nuevo Reporte de Trabajo
        </Button>

        {/* Historial reciente */}
        <MobileCard className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Historial Reciente</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/mechanic/historial')}
            >
              Ver Todo
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">Cargando...</p>
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No hay reportes aún</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {recentSubmissions.map((sub, index) => (
                  <div
                    key={sub.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all",
                      sub.status === 'pending'
                        ? "border-amber-500/30 bg-amber-500/5 active:bg-amber-500/10"
                        : sub.status === 'approved' || sub.status === 'integrated'
                          ? "border-green-500/30 bg-green-500/5 active:bg-green-500/10"
                          : "border-destructive/30 bg-destructive/5 active:bg-destructive/10",
                      "animate-in slide-in-from-left-2"
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                    onClick={() => navigate(`/mechanic/historial/${sub.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sub.equipo?.ficha} - {sub.equipo?.nombre}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(sub.created_at), "d MMM HH:mm", { locale: es })}
                      </p>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>
                ))}
              </div>

              <EquipoDetalleUnificado
                ficha={selectedFicha}
                open={detalleOpen}
                onOpenChange={setDetalleOpen}
              />
            </>
          )}
        </MobileCard>
      </div>
    </MobileLayout>
  );
}

export default MechanicDashboard;
