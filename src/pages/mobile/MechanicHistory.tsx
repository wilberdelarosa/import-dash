/**
 * Historial del Mecánico - Mobile
 * Lista de todos sus reportes con filtros por estado
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMechanicSubmissions } from '@/hooks/useMechanicSubmissions';
import {
  Clock,
  CheckCircle,
  XCircle,
  Link2,
  ChevronRight,
  FileText,
  Filter,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'integrated';

export function MechanicHistory() {
  const navigate = useNavigate();
  const { submissions, loading } = useMechanicSubmissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    if (statusFilter === 'approved') {
      return submissions.filter(s => s.status === 'approved' || s.status === 'integrated');
    }
    return submissions.filter(s => s.status === statusFilter);
  }, [submissions, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
      case 'integrated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">Aprobado</Badge>;
      case 'integrated':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Integrado</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Rechazado</Badge>;
      default:
        return null;
    }
  };

  return (
    <MobileLayout title="Mi Historial" showBottomNav={true}>
      <div className="space-y-3 pb-20">
        {/* Filtro */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobados</SelectItem>
              <SelectItem value="rejected">Rechazados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <MobileCard className="p-6 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all' ? 'No hay reportes aún' : 'No hay reportes con este filtro'}
            </p>
          </MobileCard>
        ) : (
          <div className="space-y-2">
            {filteredSubmissions.map((sub, index) => (
              <MobileCard
                key={sub.id}
                className={cn(
                  "p-3 transition-all cursor-pointer hover:bg-muted/50 animate-in slide-in-from-bottom-2",
                  sub.status === 'rejected' && "border-l-2 border-l-destructive"
                )}
                style={{ animationDelay: `${index * 0.03}s` }}
                onClick={() => navigate(`/mechanic/historial/${sub.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
                    sub.status === 'pending' && "bg-amber-500/10",
                    (sub.status === 'approved' || sub.status === 'integrated') && "bg-green-500/10",
                    sub.status === 'rejected' && "bg-destructive/10"
                  )}>
                    {getStatusIcon(sub.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium truncate">
                          {sub.equipo?.ficha} - {sub.equipo?.nombre}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(sub.created_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {sub.tipo_mantenimiento}
                    </p>

                    {/* Feedback del admin si fue rechazado */}
                    {sub.status === 'rejected' && sub.admin_feedback && (
                      <div className="mt-2 p-2 rounded bg-destructive/5 border border-destructive/20">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-destructive line-clamp-2">
                            "{sub.admin_feedback}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Indicador integrado */}
                    {sub.status === 'integrated' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-600">
                        <Link2 className="h-3 w-3" />
                        Integrado al sistema
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default MechanicHistory;
