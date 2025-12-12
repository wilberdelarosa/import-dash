/**
 * Vista de Submissions para Supervisor - Mobile
 * Solo lectura - puede ver pero no aprobar/rechazar
 */
import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAdminSubmissions, Submission } from '@/hooks/useMechanicSubmissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle,
  XCircle,
  Link2,
  Search,
  FileText,
  Truck,
  Calendar,
  Gauge,
  Package,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function SupervisorSubmissions() {
  const { submissions, loading } = useAdminSubmissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const formatReading = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return '0';

    const abs = Math.abs(numberValue);
    const rounded = abs >= 100 ? Math.round(numberValue) : Math.round(numberValue * 10) / 10;
    return rounded.toLocaleString('es-ES', {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
      maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    });
  };

  const filteredSubmissions = useMemo(() => {
    let result = submissions;

    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        result = result.filter(s => s.status === 'approved' || s.status === 'integrated');
      } else {
        result = result.filter(s => s.status === statusFilter);
      }
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(s =>
        s.equipo?.ficha.toLowerCase().includes(searchLower) ||
        s.equipo?.nombre.toLowerCase().includes(searchLower) ||
        s.descripcion_trabajo?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [submissions, statusFilter, search]);

  const stats = useMemo(() => ({
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved' || s.status === 'integrated').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    total: submissions.length,
  }), [submissions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] gap-1">
            <CheckCircle className="h-3 w-3" />
            Aprobado
          </Badge>
        );
      case 'integrated':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] gap-1">
            <Link2 className="h-3 w-3" />
            Integrado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
            <XCircle className="h-3 w-3" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <MobileLayout title="Reportes" showBottomNav={true}>
      <div className="space-y-3 pb-20">
        {/* Info de solo lectura */}
        <MobileCard variant="glass" className="p-2 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-blue-600">
              Vista de solo lectura - Contacta al administrador para aprobar/rechazar
            </p>
          </div>
        </MobileCard>

        {/* Stats rápidos - Grid responsive */}
        <div className="mobile-stats-grid">
          <MobileCard className="p-2 text-center border-amber-500/20 bg-amber-500/5">
            <p className="fluid-kpi font-bold tabular-nums">{stats.pending}</p>
            <p className="fluid-text-sm text-muted-foreground uppercase">Pendientes</p>
          </MobileCard>
          <MobileCard className="p-2 text-center border-green-500/20 bg-green-500/5">
            <p className="fluid-kpi font-bold tabular-nums">{stats.approved}</p>
            <p className="fluid-text-sm text-muted-foreground uppercase">Aprobados</p>
          </MobileCard>
          <MobileCard className="p-2 text-center border-destructive/20 bg-destructive/5">
            <p className="fluid-kpi font-bold tabular-nums">{stats.rejected}</p>
            <p className="fluid-text-sm text-muted-foreground uppercase">Rechazados</p>
          </MobileCard>
          <MobileCard className="p-2 text-center border-primary/20">
            <p className="fluid-kpi font-bold tabular-nums">{stats.total}</p>
            <p className="fluid-text-sm text-muted-foreground uppercase">Total</p>
          </MobileCard>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobados</SelectItem>
              <SelectItem value="rejected">Rechazados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de submissions */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Cargando reportes...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <MobileCard className="p-6 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No se encontraron reportes
            </p>
          </MobileCard>
        ) : (
          <div 
            className="h-list-expanded overflow-hidden"
            style={{ height: 'clamp(200px, 45svh, 400px)' }}
          >
            <div className="h-full overflow-y-auto space-y-2">
              {filteredSubmissions.map((sub, index) => (
                <MobileCard
                  key={sub.id}
                  className={cn(
                    "h-[88px] p-3 overflow-hidden transition-all cursor-pointer hover:bg-muted/50 animate-in slide-in-from-bottom-2",
                    sub.status === 'pending' && "border-l-2 border-l-amber-500"
                  )}
                  style={{ animationDelay: `${index * 0.03}s` }}
                  onClick={() => setSelectedSubmission(sub)}
                >
                  <div className="flex items-start justify-between gap-2 h-full">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium line-clamp-1">
                            {sub.equipo?.ficha} - {sub.equipo?.nombre}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {sub.descripcion_trabajo || sub.tipo_mantenimiento || 'Sin descripción'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(sub.fecha_mantenimiento), 'dd MMM', { locale: es })}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Gauge className="h-3 w-3" />
                          <span className="tabular-nums">{formatReading(sub.horas_km_actuales)}h</span>
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(sub.status)}
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de detalle - Responsive */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85svh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span>Detalle del Reporte</span>
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Equipo */}
              <div className="p-3 rounded-lg bg-accent/50 border">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm break-words">{selectedSubmission.equipo?.nombre}</p>
                    <p className="text-xs text-muted-foreground break-words">
                      {selectedSubmission.equipo?.ficha} • {selectedSubmission.equipo?.marca} {selectedSubmission.equipo?.modelo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                {getStatusBadge(selectedSubmission.status)}
              </div>

              {/* Detalles - Grid responsive */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedSubmission.fecha_mantenimiento), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horas/KM</p>
                  <p className="text-sm font-medium tabular-nums">{formatReading(selectedSubmission.horas_km_actuales)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium break-words">{selectedSubmission.tipo_mantenimiento || '-'}</p>
                </div>
              </div>

              {/* Descripción */}
              {selectedSubmission.descripcion_trabajo && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm bg-muted/50 p-2 rounded">{selectedSubmission.descripcion_trabajo}</p>
                </div>
              )}

              {/* Observaciones */}
              {selectedSubmission.observaciones && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                  <p className="text-sm bg-muted/50 p-2 rounded">{selectedSubmission.observaciones}</p>
                </div>
              )}

              {/* Partes usadas */}
              {Array.isArray(selectedSubmission.partes_usadas) && selectedSubmission.partes_usadas.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Partes utilizadas
                  </p>
                  <div className="space-y-1">
                    {selectedSubmission.partes_usadas.map((part, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-muted/30 px-2 py-1 rounded">
                        <span className="break-words">{part.nombre}</span>
                        <span className="text-muted-foreground tabular-nums shrink-0 ml-2">x{part.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback si fue rechazado */}
              {selectedSubmission.status === 'rejected' && selectedSubmission.admin_feedback && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive font-medium mb-1">Motivo del rechazo:</p>
                  <p className="text-sm">{selectedSubmission.admin_feedback}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}

export default SupervisorSubmissions;
