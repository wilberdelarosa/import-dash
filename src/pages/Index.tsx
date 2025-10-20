import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { useHistorial } from '@/hooks/useHistorial';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Wrench, 
  Package, 
  Truck,
  Activity,
  Calendar,
  BarChart3,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

export default function Index() {
  const { data } = useSupabaseDataContext();
  const { notificaciones } = useNotificaciones();
  const { eventos } = useHistorial();

  // KPIs calculados dinámicamente
  const kpis = useMemo(() => {
    const equiposActivos = data.equipos.filter(e => e.activo).length;
    const equiposInactivos = data.equipos.filter(e => !e.activo).length;
    
    const mantenimientosVencidos = data.mantenimientosProgramados.filter(
      m => m.activo && m.horasKmRestante < 0
    ).length;
    
    const mantenimientosProximos = data.mantenimientosProgramados.filter(
      m => m.activo && m.horasKmRestante >= 0 && m.horasKmRestante <= 50
    ).length;
    
    const stockBajo = data.inventarios.filter(
      i => i.activo && i.cantidad <= 5
    ).length;
    
    const notificacionesCriticas = notificaciones.filter(
      n => !n.leida && n.nivel === 'critical'
    ).length;
    
    const eventosHoy = eventos.filter(e => {
      const hoy = new Date();
      const fechaEvento = new Date(e.createdAt);
      return fechaEvento.toDateString() === hoy.toDateString();
    }).length;

    // Calcular eficiencia de mantenimiento
    const totalMantenimientos = data.mantenimientosProgramados.filter(m => m.activo).length;
    const mantenimientosAlDia = totalMantenimientos - mantenimientosVencidos;
    const eficienciaMantenimiento = totalMantenimientos > 0 
      ? Math.round((mantenimientosAlDia / totalMantenimientos) * 100)
      : 100;

    return {
      equiposActivos,
      equiposInactivos,
      mantenimientosVencidos,
      mantenimientosProximos,
      stockBajo,
      notificacionesCriticas,
      eventosHoy,
      eficienciaMantenimiento,
      totalEquipos: data.equipos.length,
      totalMantenimientos
    };
  }, [data, notificaciones, eventos]);

  // Agrupar equipos por categoría
  const equiposPorCategoria = useMemo(() => {
    const categorias = new Map<string, number>();
    data.equipos.forEach(equipo => {
      if (equipo.activo) {
        const count = categorias.get(equipo.categoria) || 0;
        categorias.set(equipo.categoria, count + 1);
      }
    });
    return Array.from(categorias.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [data.equipos]);

  return (
    <Layout title="Dashboard - Business Intelligence">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Dashboard de Control</h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de operaciones y KPIs críticos
          </p>
        </div>

        {/* Alertas Críticas */}
        {kpis.notificacionesCriticas > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <div className="flex-1">
                  <p className="font-semibold text-destructive">
                    {kpis.notificacionesCriticas} alertas críticas requieren atención inmediata
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Revisa las notificaciones para ver los detalles
                  </p>
                </div>
                <Button variant="destructive" asChild>
                  <Link to="/equipos">Ver Alertas</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Principales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Equipos Activos</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{kpis.equiposActivos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {kpis.totalEquipos} equipos totales
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600 font-medium">
                  {Math.round((kpis.equiposActivos / kpis.totalEquipos) * 100)}%
                </span>
                <span className="text-muted-foreground">operatividad</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia Mantto.</CardTitle>
              <Activity className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{kpis.eficienciaMantenimiento}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.totalMantenimientos - kpis.mantenimientosVencidos} al día
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {kpis.eficienciaMantenimiento >= 80 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Excelente</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-amber-600" />
                    <span className="text-amber-600 font-medium">Requiere atención</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Manttos. Vencidos</CardTitle>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{kpis.mantenimientosVencidos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requieren atención urgente
              </p>
              <Button variant="link" className="mt-2 h-auto p-0 text-xs" asChild>
                <Link to="/mantenimiento">Ver detalles →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <Package className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{kpis.stockBajo}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Items requieren reposición
              </p>
              <Button variant="link" className="mt-2 h-auto p-0 text-xs" asChild>
                <Link to="/inventario">Gestionar →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Secundarias */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Manttos. Próximos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.mantenimientosProximos}</div>
              <p className="text-xs text-muted-foreground">Dentro de 50 unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Eventos Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.eventosHoy}</div>
              <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Equipos Inactivos</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.equiposInactivos}</div>
              <p className="text-xs text-muted-foreground">Fuera de operación</p>
            </CardContent>
          </Card>
        </div>

        {/* Distribución por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Categorías de Equipos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equiposPorCategoria.length > 0 ? (
                equiposPorCategoria.map(([categoria, cantidad]) => (
                  <div key={categoria} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{categoria}</span>
                      <span className="text-muted-foreground">{cantidad} equipos</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ 
                          width: `${(cantidad / kpis.equiposActivos) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay equipos activos para mostrar
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accesos Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
                <Link to="/equipos">
                  <Truck className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Equipos</div>
                    <div className="text-xs text-muted-foreground">Gestionar flota</div>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
                <Link to="/mantenimiento">
                  <Wrench className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Mantenimiento</div>
                    <div className="text-xs text-muted-foreground">Programar y ejecutar</div>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
                <Link to="/inventario">
                  <Package className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Inventario</div>
                    <div className="text-xs text-muted-foreground">Control de repuestos</div>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
                <Link to="/historial">
                  <Calendar className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Historial</div>
                    <div className="text-xs text-muted-foreground">Trazabilidad completa</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
