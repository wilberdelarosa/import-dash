/**
 * Lista de Equipos Pendientes - Desktop
 * Muestra equipos con mantenimiento pendiente/vencido
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Clock,
  Search,
  FileText,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MechanicPendingListDesktop() {
  const navigate = useNavigate();
  const { data } = useSupabaseDataContext();
  const mantenimientos = data.mantenimientosProgramados;
  const [search, setSearch] = useState('');

  // Equipos con mantenimiento pendiente/vencido, ordenados por urgencia
  const equiposPendientes = useMemo(() => {
    const pendientes = mantenimientos
      .filter(m => m.activo)
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

    if (!search) return pendientes;

    const searchLower = search.toLowerCase();
    return pendientes.filter(m =>
      m.ficha.toLowerCase().includes(searchLower) ||
      m.nombreEquipo.toLowerCase().includes(searchLower)
    );
  }, [mantenimientos, search]);

  const vencidos = equiposPendientes.filter(e => e.horasKmRestante < 0).length;
  const proximos = equiposPendientes.filter(e => e.horasKmRestante >= 0 && e.horasKmRestante <= 50).length;

  const getUrgencyBadge = (horasRestantes: number) => {
    if (horasRestantes < 0) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCIDO hace {Math.abs(horasRestantes)}h
        </Badge>
      );
    }
    if (horasRestantes <= 50) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Próximo en {horasRestantes}h
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
        Al día ({horasRestantes}h)
      </Badge>
    );
  };

  return (
    <Layout title="Equipos Pendientes">
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
              <h2 className="text-xl font-bold">Equipos Pendientes</h2>
              <p className="text-sm text-muted-foreground">
                Equipos que requieren mantenimiento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              {vencidos} vencidos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              {proximos} próximos
            </Badge>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ficha o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista de Equipos</CardTitle>
            <CardDescription>
              {equiposPendientes.length} equipos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {equiposPendientes.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {search ? 'No se encontraron equipos' : 'No hay equipos pendientes'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Tipo Mantenimiento</TableHead>
                      <TableHead className="text-right">Horas Actuales</TableHead>
                      <TableHead className="text-right">Límite</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposPendientes.map((mant) => (
                      <TableRow
                        key={mant.id}
                        className={cn(
                          mant.horasKmRestante < 0 && "bg-destructive/5",
                          mant.horasKmRestante >= 0 && mant.horasKmRestante <= 50 && "bg-amber-500/5"
                        )}
                      >
                        <TableCell className="font-medium">{mant.nombreEquipo}</TableCell>
                        <TableCell>{mant.ficha}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{mant.tipoMantenimiento}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {mant.horasKmActuales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {mant.proximoMantenimiento.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(mant.horasKmRestante)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => navigate(`/mechanic/reportar/${mant.ficha}`)}
                          >
                            <FileText className="h-4 w-4" />
                            Reportar
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
    </Layout>
  );
}

export default MechanicPendingListDesktop;
