/**
 * Dashboard del Mecánico - Mobile First
 * Muestra métricas personales y accesos rápidos
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMechanicSubmissions } from '@/hooks/useMechanicSubmissions';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Wrench,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function MechanicDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submissions, loading, getStats } = useMechanicSubmissions();
  const { data } = useSupabaseDataContext();
  const mantenimientos = data.mantenimientosProgramados;

  const stats = useMemo(() => getStats(), [getStats]);

  // Equipos con mantenimiento pendiente/vencido
  const equiposPendientes = useMemo(() => {
    return mantenimientos.filter(m => m.activo && m.horasKmRestante <= 50);
  }, [mantenimientos]);

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

        {/* Equipos pendientes */}
        <MobileCard className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold">Equipos Pendientes</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {equiposPendientes.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Equipos que necesitan mantenimiento
          </p>
          <Button
            variant="outline"
            className="w-full h-9 text-xs gap-2"
            onClick={() => navigate('/mechanic/pendientes')}
          >
            Ver Lista
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
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
          )}
        </MobileCard>
      </div>
    </MobileLayout>
  );
}

export default MechanicDashboard;
