/**
 * Dashboard del Mecánico - Versión Desktop
 * Usa el Layout estándar con navegación horizontal
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export function MechanicDesktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submissions, loading, getStats } = useMechanicSubmissions();
  const { data } = useSupabaseDataContext();
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
    return mantenimientos
      .filter(m => m.activo && m.horasKmRestante <= 50 && fichasEquiposActivos.has(m.ficha))
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [mantenimientos, fichasEquiposActivos]);

  const equiposVencidos = useMemo(() => {
    return equiposPendientes.filter(m => m.horasKmRestante < 0);
  }, [equiposPendientes]);

  const equiposProximos = useMemo(() => {
    return equiposPendientes.filter(m => m.horasKmRestante >= 0 && m.horasKmRestante <= 50);
  }, [equiposPendientes]);

  // Últimos reportes
  const recentSubmissions = useMemo(() => {
    return submissions.slice(0, 5);
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
    <Layout title="Panel del Mecánico">
      <div className="space-y-6">
        {/* Header con saludo y acción principal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bienvenido</p>
              <h2 className="text-xl font-bold">
                {user?.email?.split('@')[0] || 'Mecánico'}
              </h2>
              <Badge variant="outline" className="mt-1">Rol: Mecánico</Badge>
            </div>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => navigate('/mechanic/reportar')}
          >
            <Plus className="h-5 w-5" />
            Nuevo Reporte de Trabajo
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                  <p className="text-3xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rechazados</p>
                  <p className="text-3xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mes</p>
                  <p className="text-3xl font-bold">{stats.thisMonth}</p>
                </div>
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado de equipos (Vencidos / Próximos) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Estado de Equipos</CardTitle>
                </div>
                <Badge variant="secondary">{equiposPendientes.length}</Badge>
              </div>
              <CardDescription>Vencidos y próximos (solo equipos activos)</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="vencidos" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3">
                  <TabsTrigger value="vencidos" className="text-sm gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Vencidos ({equiposVencidos.length})
                  </TabsTrigger>
                  <TabsTrigger value="proximos" className="text-sm gap-2">
                    <Clock className="h-4 w-4" />
                    Próximos ({equiposProximos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="vencidos"
                  className="mt-0 data-[state=active]:block"
                  style={{ height: '280px', overflow: 'hidden' }}
                >
                  {equiposVencidos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
                      <p className="text-sm font-medium text-green-700">Sin vencidos</p>
                      <p className="text-xs text-muted-foreground">Todo al día</p>
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto space-y-2" style={{ height: '280px' }}>
                      {equiposVencidos.map((mant) => (
                        <div
                          key={mant.id}
                          onClick={() => handleOpenDetalle(mant.ficha)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all h-[52px]",
                            "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <Truck className="h-4 w-4 text-destructive shrink-0" />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{mant.nombreEquipo}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="truncate">{mant.ficha}</span>
                                <span>•</span>
                                <span className="tabular-nums shrink-0">{formatReading(mant.horasKmActuales)}</span>
                              </p>
                            </div>
                          </div>
                          <Badge className="h-6 px-2 text-xs leading-none font-medium shrink-0 ml-2 tabular-nums bg-destructive/10 text-destructive border-destructive/20">
                            {formatRemaining(mant.horasKmRestante)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="proximos"
                  className="mt-0"
                  style={{ height: '280px', overflow: 'hidden' }}
                >
                  {equiposProximos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
                      <p className="text-sm font-medium text-green-700">Sin próximos</p>
                      <p className="text-xs text-muted-foreground">Todo en orden</p>
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto space-y-2" style={{ height: '280px' }}>
                      {equiposProximos.map((mant) => (
                        <div
                          key={mant.id}
                          onClick={() => handleOpenDetalle(mant.ficha)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all h-[52px]",
                            "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <Truck className="h-4 w-4 text-amber-600 shrink-0" />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{mant.nombreEquipo}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="truncate">{mant.ficha}</span>
                                <span>•</span>
                                <span className="tabular-nums shrink-0">{formatReading(mant.horasKmActuales)}</span>
                              </p>
                            </div>
                          </div>
                          <Badge className="h-6 px-2 text-xs leading-none font-medium shrink-0 ml-2 tabular-nums bg-amber-500/10 text-amber-600 border-amber-500/20">
                            {formatRemaining(mant.horasKmRestante)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" onClick={() => navigate('/mechanic/pendientes')} className="gap-2">
                  Ver pendientes
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => navigate('/mechanic/reportar')} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Reportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historial reciente */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Historial Reciente</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/mechanic/historial')}
                >
                  Ver Todo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <CardDescription>Tus últimos reportes de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay reportes aún</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {recentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/mechanic/historial/${sub.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {sub.equipo?.ficha} - {sub.equipo?.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sub.created_at), "d MMMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EquipoDetalleUnificado
        ficha={selectedFicha}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
      />
    </Layout>
  );
}

export default MechanicDesktop;
