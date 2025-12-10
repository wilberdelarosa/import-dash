/**
 * Vista de Submissions para Supervisor - Desktop
 * Solo lectura - puede ver pero no aprobar/rechazar
 */
import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Search,
  FileText,
  Truck,
  Calendar,
  Gauge,
  Package,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function SupervisorSubmissionsDesktop() {
  const { submissions, loading } = useAdminSubmissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

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

  return (
    <Layout title="Reportes de Mecánicos">
      <div className="space-y-6">
        {/* Header con aviso de solo lectura */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-600">Vista de Solo Lectura</p>
              <p className="text-sm text-muted-foreground">
                Puede ver los reportes pero no aprobar o rechazar. Contacta al administrador.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rechazados</p>
                  <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
                </div>
                <XCircle className="h-10 w-10 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-10 w-10 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Lista de Reportes</CardTitle>
                <CardDescription>Reportes de mantenimiento enviados por mecánicos</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar equipo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-[250px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-[150px]">
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
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando reportes...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No se encontraron reportes</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horas/KM</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[80px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((sub) => (
                      <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{sub.equipo?.ficha}</p>
                              <p className="text-xs text-muted-foreground">{sub.equipo?.nombre}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(sub.fecha_mantenimiento), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>{sub.horas_km_actuales.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-sm">{sub.tipo_mantenimiento || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate max-w-[200px] block">
                            {sub.descripcion_trabajo || '-'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubmission(sub)}
                          >
                            <Eye className="h-4 w-4" />
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

      {/* Dialog de detalle */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalle del Reporte
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Equipo */}
              <Card className="bg-accent/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{selectedSubmission.equipo?.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSubmission.equipo?.ficha} • {selectedSubmission.equipo?.marca} {selectedSubmission.equipo?.modelo}
                      </p>
                    </div>
                    <div className="ml-auto">{getStatusBadge(selectedSubmission.status)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalles en grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Fecha</span>
                  </div>
                  <p className="font-medium">
                    {format(new Date(selectedSubmission.fecha_mantenimiento), 'dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Gauge className="h-4 w-4" />
                    <span className="text-xs">Horas/KM</span>
                  </div>
                  <p className="font-medium">{selectedSubmission.horas_km_actuales.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Tipo de Mantenimiento</span>
                  </div>
                  <p className="font-medium">{selectedSubmission.tipo_mantenimiento || '-'}</p>
                </div>
              </div>

              {/* Descripción */}
              {selectedSubmission.descripcion_trabajo && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Descripción del Trabajo</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedSubmission.descripcion_trabajo}</p>
                </div>
              )}

              {/* Observaciones */}
              {selectedSubmission.observaciones && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Observaciones</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedSubmission.observaciones}</p>
                </div>
              )}

              {/* Partes usadas */}
              {selectedSubmission.partes_usadas && selectedSubmission.partes_usadas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Partes Utilizadas
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedSubmission.partes_usadas.map((part, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-muted/30 px-3 py-2 rounded-lg">
                        <span>{part.nombre}</span>
                        <Badge variant="secondary">x{part.cantidad}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback si fue rechazado */}
              {selectedSubmission.status === 'rejected' && selectedSubmission.admin_feedback && (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive mb-1">Motivo del Rechazo</p>
                        <p className="text-sm">{selectedSubmission.admin_feedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default SupervisorSubmissionsDesktop;
