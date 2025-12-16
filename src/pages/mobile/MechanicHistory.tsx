/**
 * Historial del Mecánico - Mobile
 * Lista de todos sus reportes con filtros por estado
 * Incluye vista de detalle cuando se navega a /mechanic/historial/:id
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMechanicSubmissions, Submission, SubmissionAttachment } from '@/hooks/useMechanicSubmissions';
import { supabase } from '@/integrations/supabase/client';
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
  Truck,
  Calendar,
  Gauge,
  Wrench,
  Package,
  Image as ImageIcon,
  X,
  ZoomIn,
  Download,
  AlertTriangle,
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
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'integrated';

// Componente de galería de fotos
function PhotoGallery({ attachments }: { attachments: SubmissionAttachment[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      setLoading(true);
      const urls = new Map<string, string>();

      for (const att of attachments) {
        try {
          const { data } = await supabase.storage
            .from('submission-attachments')
            .createSignedUrl(att.storage_path, 3600); // 1 hour

          if (data?.signedUrl) {
            urls.set(att.id, data.signedUrl);
          }
        } catch (err) {
          console.error('Error loading image:', att.filename, err);
        }
      }

      setImageUrls(urls);
      setLoading(false);
    }

    if (attachments.length > 0) {
      loadImages();
    } else {
      setLoading(false);
    }
  }, [attachments]);

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay fotos adjuntas</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {attachments.map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {attachments.map((att) => {
          const url = imageUrls.get(att.id);
          return (
            <button
              key={att.id}
              className="aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted relative group"
              onClick={() => url && setSelectedImage(url)}
            >
              {url ? (
                <>
                  <img
                    src={url}
                    alt={att.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal de imagen ampliada */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/95 border-0">
          <VisuallyHidden>
            <DialogTitle>Imagen ampliada</DialogTitle>
            <DialogDescription>Vista ampliada de la foto adjunta</DialogDescription>
          </VisuallyHidden>
          <button
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Foto ampliada"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper to safely parse partes_usadas (can be string JSON or array)
function parsePartesUsadas(partes: unknown): Array<{ nombre: string; cantidad: number; referencia?: string; del_inventario?: boolean }> {
  if (!partes) return [];
  if (Array.isArray(partes)) return partes;
  if (typeof partes === 'string') {
    try {
      const parsed = JSON.parse(partes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Vista de detalle de submission
function SubmissionDetail({ submission, onBack }: { submission: Submission; onBack: () => void }) {
  const [attachments, setAttachments] = useState<SubmissionAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  // Parse partes_usadas safely
  const partesUsadas = useMemo(() => parsePartesUsadas(submission.partes_usadas), [submission.partes_usadas]);

  useEffect(() => {
    async function loadAttachments() {
      try {
        const { data, error } = await supabase
          .from('submission_attachments')
          .select('*')
          .eq('submission_id', submission.id);

        if (error) throw error;
        setAttachments((data || []) as SubmissionAttachment[]);
      } catch (err) {
        console.error('Error loading attachments:', err);
      } finally {
        setLoadingAttachments(false);
      }
    }

    loadAttachments();
  }, [submission.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500 text-white">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white">Aprobado</Badge>;
      case 'integrated':
        return <Badge className="bg-blue-500 text-white">Integrado</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-destructive-foreground">Rechazado</Badge>;
      default:
        return null;
    }
  };

  return (
    <MobileLayout
      title="Detalle del Reporte"
      showBottomNav={true}
      headerActions={
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      }
    >
      <div className="space-y-4 pb-20">
        {/* Header con status */}
        <MobileCard variant="glass" className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">
                {submission.equipo?.ficha} - {submission.equipo?.nombre}
              </h2>
              <p className="text-sm text-muted-foreground">
                {submission.equipo?.marca} {submission.equipo?.modelo}
              </p>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </MobileCard>

        {/* Información principal */}
        <MobileCard variant="glass" className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Información del Reporte
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha de mantenimiento</p>
                <p className="text-sm font-medium">
                  {format(new Date(submission.fecha_mantenimiento), "d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Horas/Km registradas</p>
                <p className="text-sm font-medium">{submission.horas_km_actuales}</p>
              </div>
            </div>

            {submission.tipo_mantenimiento && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de mantenimiento</p>
                  <p className="text-sm font-medium">{submission.tipo_mantenimiento}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Enviado</p>
                <p className="text-sm font-medium">
                  {format(new Date(submission.created_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          </div>
        </MobileCard>

        {/* Descripción del trabajo */}
        {submission.descripcion_trabajo && (
          <MobileCard variant="glass" className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Descripción del Trabajo
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {submission.descripcion_trabajo}
            </p>
          </MobileCard>
        )}

        {/* Observaciones */}
        {submission.observaciones && (
          <MobileCard variant="glass" className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Observaciones
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {submission.observaciones}
            </p>
          </MobileCard>
        )}

        {/* Partes usadas */}
        {partesUsadas.length > 0 && (
          <MobileCard variant="glass" className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Partes Utilizadas ({partesUsadas.length})
            </h3>
            <div className="space-y-2">
              {partesUsadas.map((parte, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{parte.nombre}</p>
                    {parte.referencia && (
                      <p className="text-xs text-muted-foreground">Ref: {parte.referencia}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="tabular-nums">
                      x{parte.cantidad}
                    </Badge>
                    {parte.del_inventario && (
                      <Badge variant="outline" className="text-[10px]">Inv.</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </MobileCard>
        )}

        {/* Fotos adjuntas */}
        <MobileCard variant="glass" className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Fotos Adjuntas {!loadingAttachments && `(${attachments.length})`}
          </h3>
          {loadingAttachments ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <PhotoGallery attachments={attachments} />
          )}
        </MobileCard>

        {/* Feedback del admin */}
        {submission.status === 'rejected' && submission.admin_feedback && (
          <MobileCard variant="glass" className="p-4 border-destructive/30 bg-destructive/5">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              Motivo del Rechazo
            </h3>
            <p className="text-sm text-muted-foreground">
              "{submission.admin_feedback}"
            </p>
          </MobileCard>
        )}

        {/* Estado integrado */}
        {submission.status === 'integrated' && (
          <MobileCard variant="glass" className="p-4 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-2 text-blue-600">
              <Link2 className="h-4 w-4" />
              <p className="text-sm font-medium">
                Este reporte ha sido integrado al sistema de mantenimiento
              </p>
            </div>
            {submission.reviewed_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Integrado el {format(new Date(submission.reviewed_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </p>
            )}
          </MobileCard>
        )}
      </div>
    </MobileLayout>
  );
}

// Componente principal
export function MechanicHistory() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { submissions, loading } = useMechanicSubmissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Buscar submission por id si estamos en detalle
  const selectedSubmission = useMemo(() => {
    if (!id) return null;
    return submissions.find(s => s.id === id) || null;
  }, [id, submissions]);

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

  // Si hay ID, mostrar detalle
  if (id) {
    if (loading) {
      return (
        <MobileLayout title="Cargando..." showBottomNav={true}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </MobileLayout>
      );
    }

    if (!selectedSubmission) {
      return (
        <MobileLayout title="No encontrado" showBottomNav={true}>
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Reporte no encontrado</h2>
            <p className="text-sm text-muted-foreground mb-4">
              El reporte que buscas no existe o no tienes acceso a él.
            </p>
            <Button onClick={() => navigate('/mechanic/historial')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al historial
            </Button>
          </div>
        </MobileLayout>
      );
    }

    return (
      <SubmissionDetail
        submission={selectedSubmission}
        onBack={() => navigate('/mechanic/historial')}
      />
    );
  }

  // Lista de submissions
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
