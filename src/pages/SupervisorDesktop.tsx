/**
 * Dashboard del Supervisor - Versión Desktop
 * Vista de solo lectura con métricas gerenciales
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useMechanicSubmissions } from '@/hooks/useMechanicSubmissions';
import { useAuth } from '@/context/AuthContext';
import { EquipoDetalleUnificado } from '@/components/EquipoDetalleUnificado';
import {
  Eye,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  FileText,
  Shield,
  Activity,
  ExternalLink,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemConfig } from '@/context/SystemConfigContext';

export function SupervisorDesktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useSupabaseDataContext();
  const { config } = useSystemConfig();
  const { submissions } = useMechanicSubmissions();
  const mantenimientos = data.mantenimientosProgramados;
  const equipos = data.equipos;

  // Estado para el detalle unificado
  const [selectedFicha, setSelectedFicha] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  // Fichas de equipos activos (no vendidos)
  const fichasEquiposActivos = useMemo(() => {
    return new Set(
      equipos
        .filter(e => e.activo && e.empresa !== 'VENDIDO')
        .map(e => e.ficha)
    );
  }, [equipos]);

  // Estadísticas de flota
  const fleetStats = useMemo(() => {
    const total = equipos.length;
    const activos = equipos.filter(e => e.activo && e.empresa !== 'VENDIDO').length;
    const inactivos = total - activos;

    const vencidos = mantenimientos.filter(m => m.activo && m.horasKmRestante < 0 && fichasEquiposActivos.has(m.ficha)).length;
    const proximos = mantenimientos.filter(m => m.activo && m.horasKmRestante >= 0 && m.horasKmRestante <= config.alertaPreventiva && fichasEquiposActivos.has(m.ficha)).length;
    const alDia = mantenimientos.filter(m => m.activo && m.horasKmRestante > config.alertaPreventiva && fichasEquiposActivos.has(m.ficha)).length;

    const saludFlota = total > 0 ? Math.round((alDia / Math.max(vencidos + proximos + alDia, 1)) * 100) : 100;

    return {
      total,
      activos,
      inactivos,
      vencidos,
      proximos,
      alDia,
      saludFlota,
    };
  }, [equipos, mantenimientos, fichasEquiposActivos]);

  // Estadísticas de submissions
  const submissionStats = useMemo(() => {
    const pending = submissions.filter(s => s.status === 'pending').length;
    const approved = submissions.filter(s => ['approved', 'integrated'].includes(s.status)).length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    return { pending, approved, rejected, total: submissions.length };
  }, [submissions]);

  // Lista completa de equipos vencidos (solo equipos activos, no vendidos)
  const equiposVencidos = useMemo(() => {
    return mantenimientos
      .filter(m => m.activo && m.horasKmRestante < 0 && fichasEquiposActivos.has(m.ficha))
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [mantenimientos, fichasEquiposActivos]);

  // Lista completa de equipos próximos (solo equipos activos, no vendidos)
  const equiposProximos = useMemo(() => {
    return mantenimientos
      .filter(m => m.activo && m.horasKmRestante >= 0 && m.horasKmRestante <= config.alertaPreventiva && fichasEquiposActivos.has(m.ficha))
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [mantenimientos, fichasEquiposActivos]);

  // Abrir detalle de equipo
  const handleOpenDetalle = (ficha: string) => {
    setSelectedFicha(ficha);
    setDetalleOpen(true);
  };

  return (
    <Layout title="Panel del Supervisor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Eye className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bienvenido</p>
              <h2 className="text-xl font-bold">
                {user?.email?.split('@')[0] || 'Supervisor'}
              </h2>
              <Badge variant="outline" className="mt-1 border-blue-500/20 text-blue-600">
                <Shield className="h-3 w-3 mr-1" />
                Rol: Supervisor
              </Badge>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <Eye className="h-4 w-4 mr-2" />
            Vista de Solo Lectura
          </Badge>
        </div>

        {/* Salud de la flota */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Salud de la Flota</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={fleetStats.saludFlota} className="flex-1 h-4" />
              <span className="text-2xl font-bold">{fleetStats.saludFlota}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {fleetStats.alDia} equipos al día, {fleetStats.proximos} próximos, {fleetStats.vencidos} vencidos
            </p>
          </CardContent>
        </Card>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Equipos</p>
                  <p className="text-3xl font-bold">{fleetStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fleetStats.activos} activos
                  </p>
                </div>
                <Truck className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                  <p className="text-3xl font-bold text-destructive">{fleetStats.vencidos}</p>
                  <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Próximos</p>
                  <p className="text-3xl font-bold text-amber-600">{fleetStats.proximos}</p>
                  <p className="text-xs text-muted-foreground mt-1">Menos de {config.alertaPreventiva}h</p>
                </div>
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Al Día</p>
                  <p className="text-3xl font-bold text-green-600">{fleetStats.alDia}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sin pendientes</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Vencidos y Próximos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Estado de Equipos
            </CardTitle>
            <CardDescription>Click en un equipo para ver su detalle completo</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="vencidos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="vencidos" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Vencidos ({equiposVencidos.length})
                </TabsTrigger>
                <TabsTrigger value="proximos" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Próximos ({equiposProximos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vencidos" className="mt-0">
                {equiposVencidos.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-3" />
                    <p className="text-lg font-medium text-green-600">¡Excelente!</p>
                    <p className="text-sm text-muted-foreground">No hay equipos con mantenimiento vencido</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {equiposVencidos.map((mant, index) => (
                      <div
                        key={mant.id}
                        onClick={() => handleOpenDetalle(mant.ficha)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                          "border-destructive/30 bg-destructive/5 hover:bg-destructive/10",
                          "animate-in slide-in-from-left-2"
                        )}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <Truck className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <p className="font-semibold">{mant.nombreEquipo}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-mono">{mant.ficha}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                {mant.horasKmActuales?.toLocaleString() || 0}h
                              </span>
                              <span>•</span>
                              <span>{mant.tipoMantenimiento}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive" className="text-sm px-3 py-1">
                            {Math.abs(mant.horasKmRestante)}h vencido
                          </Badge>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="proximos" className="mt-0">
                {equiposProximos.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-3" />
                    <p className="text-lg font-medium text-green-600">Todo en orden</p>
                    <p className="text-sm text-muted-foreground">No hay equipos con mantenimiento próximo</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {equiposProximos.map((mant, index) => (
                      <div
                        key={mant.id}
                        onClick={() => handleOpenDetalle(mant.ficha)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                          "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
                          "animate-in slide-in-from-left-2"
                        )}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Truck className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{mant.nombreEquipo}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-mono">{mant.ficha}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                {mant.horasKmActuales?.toLocaleString() || 0}h
                              </span>
                              <span>•</span>
                              <span>{mant.tipoMantenimiento}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="text-sm px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                            {mant.horasKmRestante}h restantes
                          </Badge>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reportes de mecánicos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Reportes de Mecánicos</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/supervisor/submissions')}
                >
                  Ver Todos
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <CardDescription>Estado de los reportes de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-600">{submissionStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-bold text-green-600">{submissionStats.approved}</p>
                  <p className="text-xs text-muted-foreground">Aprobados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-2xl font-bold text-destructive">{submissionStats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rechazados</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Total: {submissionStats.total} reportes registrados
              </p>
            </CardContent>
          </Card>

          {/* Accesos rápidos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
              <CardDescription>Navega a las diferentes secciones (solo lectura)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/equipos')}>
                  <Truck className="h-6 w-6" />
                  <span>Equipos</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/mantenimiento')}>
                  <TrendingUp className="h-6 w-6" />
                  <span>Mantenimiento</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/historial')}>
                  <Clock className="h-6 w-6" />
                  <span>Historial</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/supervisor/submissions')}>
                  <FileText className="h-6 w-6" />
                  <span>Reportes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Detalle Unificado */}
      <EquipoDetalleUnificado
        ficha={selectedFicha}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
      />
    </Layout>
  );
}

export default SupervisorDesktop;
