/**
 * Historial del Mecánico - Desktop
 * Lista de todos sus reportes con filtros por estado
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMechanicSubmissions } from '@/hooks/useMechanicSubmissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  CheckCircle,
  XCircle,
  Link2,
  ChevronRight,
  FileText,
  Filter,
  MessageSquare,
  ArrowLeft,
  Eye,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'integrated';

export function MechanicHistoryDesktop() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { submissions, loading, getStats } = useMechanicSubmissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const stats = useMemo(() => getStats(), [getStats]);

  // Open detail dialog if URL has an ID
  useEffect(() => {
    if (id && submissions.length > 0) {
      const found = submissions.find(s => s.id === id);
      if (found) {
        setSelectedSubmission(found);
      }
    }
  }, [id, submissions]);

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    if (statusFilter === 'approved') {
      return submissions.filter(s => s.status === 'approved' || s.status === 'integrated');
    }
    return submissions.filter(s => s.status === statusFilter);
  }, [submissions, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Aprobado</Badge>;
      case 'integrated':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Integrado</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rechazado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout title="Mi Historial">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mechanic')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">Mi Historial de Reportes</h2>
              <p className="text-sm text-muted-foreground">
                Todos los trabajos reportados
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/mechanic/reportar')}>
            <FileText className="h-4 w-4 mr-2" />
            Nuevo Reporte
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rechazados</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mes</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Reportes</CardTitle>
                <CardDescription>
                  {filteredSubmissions.length} reportes encontrados
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-40">
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
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {statusFilter === 'all' ? 'No hay reportes aún' : 'No hay reportes con este filtro'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((sub) => (
                      <TableRow
                        key={sub.id}
                        className={cn(
                          sub.status === 'rejected' && "bg-destructive/5"
                        )}
                      >
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(sub.created_at), "d MMM yyyy", { locale: es })}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(sub.created_at), "HH:mm", { locale: es })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{sub.equipo?.ficha}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {sub.equipo?.nombre}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.tipo_mantenimiento || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {sub.horas_km_actuales.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(sub.status)}
                            {sub.status === 'integrated' && (
                              <Link2 className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sub.admin_feedback ? (
                            <div className="flex items-start gap-1.5 max-w-[200px]">
                              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {sub.admin_feedback}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubmission(sub)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Reporte
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission?.equipo?.ficha} - {selectedSubmission?.equipo?.nombre}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(selectedSubmission.created_at), "d MMM yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedSubmission.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="outline">{selectedSubmission.tipo_mantenimiento || 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lectura</p>
                  <p className="font-mono font-medium">{selectedSubmission.horas_km_actuales.toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Descripción del trabajo</p>
                <p className="text-sm">{selectedSubmission.descripcion || 'Sin descripción'}</p>
              </div>

              {selectedSubmission.partes_usadas && Array.isArray(selectedSubmission.partes_usadas) && selectedSubmission.partes_usadas.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Partes usadas</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSubmission.partes_usadas.map((parte: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {typeof parte === 'string' ? parte : parte.nombre || parte.item?.nombre || 'Parte'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}


              {selectedSubmission.admin_feedback && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">Feedback del supervisor</p>
                  <p className="text-sm">{selectedSubmission.admin_feedback}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default MechanicHistoryDesktop;

