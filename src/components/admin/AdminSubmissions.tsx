/**
 * AdminSubmissions - Gestión de Reportes de Mecánicos
 * Permite al admin aprobar o rechazar submissions de mantenimiento
 */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  FileText,
  Truck,
  User,
  Calendar,
  Gauge,
  Package,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Link2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PartUsada {
  nombre: string;
  cantidad: number;
  referencia?: string;
  del_inventario: boolean;
  inventario_id?: string;
}

interface Submission {
  id: string;
  created_by: string;
  equipo_id: number;
  fecha_mantenimiento: string;
  horas_km_actuales: number;
  tipo_mantenimiento: string | null;
  descripcion_trabajo: string | null;
  observaciones: string | null;
  partes_usadas: PartUsada[];
  status: 'pending' | 'approved' | 'rejected' | 'integrated';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  equipo?: {
    id: number;
    ficha: string;
    nombre: string;
    marca: string;
    modelo: string;
  };
  creator?: {
    email: string;
  };
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'integrated';

export function AdminSubmissions() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_submissions')
        .select(`
          *,
          equipo:equipos(id, ficha, nombre, marca, modelo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions((data || []) as unknown as Submission[]);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleApprove = async (submission: Submission) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('approve_and_integrate_submission', {
        p_submission_id: submission.id,
        p_admin_feedback: 'Aprobado e integrado al sistema',
      });

      if (error) throw error;

      toast({
        title: '✅ Reporte Aprobado',
        description: `El mantenimiento de ${submission.equipo?.ficha} ha sido integrado al sistema.`,
      });

      fetchSubmissions();
      setShowDetailDialog(false);
    } catch (err) {
      console.error('Error approving submission:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo aprobar el reporte',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectFeedback.trim()) {
      toast({
        title: 'Error',
        description: 'Debes indicar el motivo del rechazo',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('reject_submission', {
        p_submission_id: selectedSubmission.id,
        p_feedback: rejectFeedback,
      });

      if (error) throw error;

      toast({
        title: 'Reporte Rechazado',
        description: 'El mecánico ha sido notificado con el motivo.',
      });

      fetchSubmissions();
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      setRejectFeedback('');
    } catch (err) {
      console.error('Error rejecting submission:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo rechazar el reporte',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
            <CheckCircle className="h-3 w-3" />
            Aprobado
          </Badge>
        );
      case 'integrated':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
            <Link2 className="h-3 w-3" />
            Integrado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
            <XCircle className="h-3 w-3" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  const openDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetailDialog(true);
  };

  const openRejectDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setRejectFeedback('');
    setShowRejectDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              Pendientes
            </CardDescription>
            <CardTitle className="text-2xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <CheckCircle className="h-3 w-3" />
              Aprobados
            </CardDescription>
            <CardTitle className="text-2xl">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <XCircle className="h-3 w-3" />
              Rechazados
            </CardDescription>
            <CardTitle className="text-2xl">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <FileText className="h-3 w-3" />
              Total
            </CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ficha, equipo o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchSubmissions} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Cargando reportes...</p>
          </Card>
        ) : filteredSubmissions.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">
              {statusFilter === 'pending'
                ? 'No hay reportes pendientes de revisión'
                : 'No se encontraron reportes'}
            </p>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              className={cn(
                "transition-all hover:shadow-md cursor-pointer",
                submission.status === 'pending' && "border-amber-500/30 bg-amber-500/5"
              )}
              onClick={() => openDetail(submission)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold truncate">
                        {submission.equipo?.ficha} - {submission.equipo?.nombre}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {submission.descripcion_trabajo || 'Sin descripción'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(submission.fecha_mantenimiento), 'dd MMM yyyy', { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {submission.horas_km_actuales.toLocaleString()} hrs
                      </span>
                      {submission.partes_usadas && submission.partes_usadas.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {submission.partes_usadas.length} partes
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(submission.status)}
                    {submission.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-green-600 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(submission);
                          }}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRejectDialog(submission);
                          }}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalle del Reporte
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles del mantenimiento reportado por el mecánico
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Equipo Info */}
              <div className="p-4 rounded-lg bg-accent/50 border">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{selectedSubmission.equipo?.nombre}</h3>
                    <p className="text-sm text-muted-foreground">
                      Ficha: {selectedSubmission.equipo?.ficha} • {selectedSubmission.equipo?.marca} {selectedSubmission.equipo?.modelo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado:</span>
                {getStatusBadge(selectedSubmission.status)}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha del Mantenimiento</Label>
                  <p className="font-medium">
                    {format(new Date(selectedSubmission.fecha_mantenimiento), 'dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Horas/KM Actuales</Label>
                  <p className="font-medium">{selectedSubmission.horas_km_actuales.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo de Mantenimiento</Label>
                  <p className="font-medium">{selectedSubmission.tipo_mantenimiento || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reportado</Label>
                  <p className="font-medium">
                    {format(new Date(selectedSubmission.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <Label className="text-xs text-muted-foreground">Descripción del Trabajo</Label>
                <p className="mt-1 p-3 rounded-lg bg-muted/50 text-sm">
                  {selectedSubmission.descripcion_trabajo || 'Sin descripción'}
                </p>
              </div>

              {/* Observaciones */}
              {selectedSubmission.observaciones && (
                <div>
                  <Label className="text-xs text-muted-foreground">Observaciones</Label>
                  <p className="mt-1 p-3 rounded-lg bg-muted/50 text-sm">
                    {selectedSubmission.observaciones}
                  </p>
                </div>
              )}

              {/* Partes Utilizadas */}
              {selectedSubmission.partes_usadas && selectedSubmission.partes_usadas.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Partes Utilizadas ({selectedSubmission.partes_usadas.length})
                  </Label>
                  <div className="mt-2 space-y-2">
                    {selectedSubmission.partes_usadas.map((parte, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div>
                          <span className="font-medium text-sm">{parte.nombre}</span>
                          {parte.referencia && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({parte.referencia})
                            </span>
                          )}
                        </div>
                        <Badge variant="outline">{parte.cantidad} ud</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Feedback (si existe) */}
              {selectedSubmission.admin_feedback && (
                <div className={cn(
                  "p-3 rounded-lg border",
                  selectedSubmission.status === 'rejected'
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-green-500/5 border-green-500/20"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium text-sm">Feedback del Admin</span>
                  </div>
                  <p className="text-sm">{selectedSubmission.admin_feedback}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedSubmission?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => openRejectDialog(selectedSubmission)}
                  className="text-destructive"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => handleApprove(selectedSubmission)}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  Aprobar e Integrar
                </Button>
              </>
            )}
            {selectedSubmission?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rechazar Reporte
            </DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo para que el mecánico pueda corregirlo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Motivo del Rechazo *</Label>
              <Textarea
                placeholder="Ej: Falta especificar las horas exactas del aceite cambiado..."
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                className="mt-1.5"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este mensaje será enviado al mecánico
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectFeedback.trim()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
