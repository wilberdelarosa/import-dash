/**
 * Dashboard del Supervisor - Mobile First
 * Vista general del estado de la flota y equipos
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useAuth } from '@/context/AuthContext';
import { useAdminSubmissions } from '@/hooks/useMechanicSubmissions';
import {
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  Activity,
  FileText,
  ChevronRight,
  Bell,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function SupervisorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useSupabaseDataContext();
  const { submissions, loading: loadingSubmissions } = useAdminSubmissions();
  
  const equipos = data.equipos;
  const mantenimientos = data.mantenimientosProgramados;

  // Estadísticas de equipos
  const equiposStats = useMemo(() => {
    const activos = equipos.filter(e => e.activo).length;
    const inactivos = equipos.filter(e => !e.activo).length;
    return { activos, inactivos, total: equipos.length };
  }, [equipos]);

  // Estadísticas de mantenimiento
  const mantStats = useMemo(() => {
    const vencidos = mantenimientos.filter(m => m.activo && m.horasKmRestante < 0).length;
    const proximos = mantenimientos.filter(m => m.activo && m.horasKmRestante >= 0 && m.horasKmRestante <= 50).length;
    const alDia = mantenimientos.filter(m => m.activo && m.horasKmRestante > 50).length;
    return { vencidos, proximos, alDia };
  }, [mantenimientos]);

  // Submissions pendientes
  const pendingSubmissions = useMemo(() => {
    return submissions.filter(s => s.status === 'pending').slice(0, 5);
  }, [submissions]);

  // Equipos críticos (vencidos + próximos)
  const equiposCriticos = useMemo(() => {
    return mantenimientos
      .filter(m => m.activo && m.horasKmRestante <= 50)
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
      .slice(0, 5);
  }, [mantenimientos]);

  return (
    <MobileLayout title="Supervisor" showBottomNav={true}>
      <div className="space-y-3 pb-20">
        {/* Header con saludo */}
        <MobileCard variant="glass" className="p-3 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Panel de Supervisión</p>
                <h2 className="text-sm font-semibold">
                  {user?.email?.split('@')[0] || 'Supervisor'}
                </h2>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white text-[10px]">
              Solo lectura
            </Badge>
          </div>
        </MobileCard>

        {/* KPIs principales */}
        <div className="grid grid-cols-3 gap-2">
          <MobileCard className="p-2.5 text-center border-primary/20">
            <Truck className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{equiposStats.activos}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Activos</p>
          </MobileCard>
          <MobileCard className="p-2.5 text-center border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-destructive">{mantStats.vencidos}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Vencidos</p>
          </MobileCard>
          <MobileCard className="p-2.5 text-center border-amber-500/20 bg-amber-500/5">
            <Clock className="h-4 w-4 mx-auto text-amber-600 mb-1" />
            <p className="text-lg font-bold text-amber-600">{mantStats.proximos}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Próximos</p>
          </MobileCard>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1"
            onClick={() => navigate('/mantenimiento')}
          >
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-xs">Mantenimientos</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1"
            onClick={() => navigate('/equipos')}
          >
            <Truck className="h-5 w-5 text-primary" />
            <span className="text-xs">Equipos</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1"
            onClick={() => navigate('/historial')}
          >
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-xs">Historial</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1"
            onClick={() => navigate('/notificaciones')}
          >
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-xs">Alertas</span>
          </Button>
        </div>

        {/* Equipos críticos */}
        <MobileCard className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Equipos Críticos
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate('/mantenimiento')}
            >
              Ver todos
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {equiposCriticos.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                Todos los equipos están al día
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {equiposCriticos.map((mant, index) => (
                <div
                  key={mant.id}
                  className={cn(
                    "p-2 rounded-lg border transition-all animate-in slide-in-from-left-2",
                    mant.horasKmRestante < 0 
                      ? "bg-destructive/5 border-destructive/20" 
                      : "bg-amber-500/5 border-amber-500/20"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{mant.nombreEquipo}</p>
                        <p className="text-[10px] text-muted-foreground">{mant.ficha}</p>
                      </div>
                    </div>
                    <Badge 
                      className={cn(
                        "text-[10px] shrink-0",
                        mant.horasKmRestante < 0 
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {mant.horasKmRestante < 0 
                        ? `Vencido ${Math.abs(mant.horasKmRestante)}h`
                        : `${mant.horasKmRestante}h restantes`
                      }
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MobileCard>

        {/* Submissions pendientes para revisar */}
        <MobileCard className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Reportes de Mecánicos
            </h3>
            {pendingSubmissions.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                {pendingSubmissions.length} pendientes
              </Badge>
            )}
          </div>

          {loadingSubmissions ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Cargando...
            </p>
          ) : pendingSubmissions.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay reportes pendientes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSubmissions.map((sub, index) => (
                <div
                  key={sub.id}
                  className="p-2 rounded-lg border bg-amber-500/5 border-amber-500/20 animate-in slide-in-from-left-2"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sub.equipo?.ficha} - {sub.equipo?.nombre}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {sub.descripcion_trabajo || sub.tipo_mantenimiento}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(sub.created_at), "d MMM", { locale: es })}
                      </p>
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MobileCard>

        {/* Resumen del día */}
        <MobileCard className="p-3 border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Resumen General</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Equipos totales</p>
              <p className="font-semibold">{equiposStats.total}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Disponibilidad</p>
              <p className="font-semibold text-green-600">
                {equiposStats.total > 0 
                  ? Math.round((equiposStats.activos / equiposStats.total) * 100)
                  : 0}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Al día</p>
              <p className="font-semibold text-green-600">{mantStats.alDia}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Requieren atención</p>
              <p className="font-semibold text-amber-600">{mantStats.vencidos + mantStats.proximos}</p>
            </div>
          </div>
        </MobileCard>
      </div>
    </MobileLayout>
  );
}

export default SupervisorDashboard;
