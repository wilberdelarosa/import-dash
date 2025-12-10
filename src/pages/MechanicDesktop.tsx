/**
 * Dashboard del Mecánico - Versión Desktop
 * Usa el Layout estándar con navegación horizontal
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  const stats = useMemo(() => getStats(), [getStats]);

  // Equipos con mantenimiento pendiente/vencido
  const equiposPendientes = useMemo(() => {
    return mantenimientos
      .filter(m => m.activo && m.horasKmRestante <= 50)
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [mantenimientos]);

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

  const getUrgencyBadge = (horasRestantes: number) => {
    if (horasRestantes < 0) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCIDO
        </Badge>
      );
    }
    if (horasRestantes <= 50) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Próximo
        </Badge>
      );
    }
    return null;
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
          {/* Equipos pendientes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Equipos Pendientes</CardTitle>
                </div>
                <Badge variant="secondary">{equiposPendientes.length}</Badge>
              </div>
              <CardDescription>Equipos que necesitan mantenimiento</CardDescription>
            </CardHeader>
            <CardContent>
              {equiposPendientes.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay equipos pendientes</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {equiposPendientes.slice(0, 5).map((mant) => (
                    <div
                      key={mant.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/mechanic/reportar/${mant.ficha}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{mant.nombreEquipo}</p>
                          <p className="text-xs text-muted-foreground">Ficha: {mant.ficha}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getUrgencyBadge(mant.horasKmRestante)}
                        <span className="text-sm font-medium">
                          {mant.horasKmRestante}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {equiposPendientes.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate('/mechanic/pendientes')}
                >
                  Ver Todos ({equiposPendientes.length})
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
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
    </Layout>
  );
}

export default MechanicDesktop;
