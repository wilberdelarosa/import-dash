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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { EquipoDetalleUnificado } from '@/components/EquipoDetalleUnificado';
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
  const equipos = data.equipos;
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('vencidos');

  const [selectedFicha, setSelectedFicha] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  // Fichas de equipos activos (no vendidos)
  const fichasEquiposActivos = useMemo(() => {
    return new Set(
      equipos
        .filter(e => e.activo && e.empresa !== 'VENDIDO')
        .map(e => e.ficha)
    );
  }, [equipos]);

  const handleOpenDetalle = (ficha: string) => {
    setSelectedFicha(ficha);
    setDetalleOpen(true);
  };

  const formatHours = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return '0';

    const abs = Math.abs(numberValue);
    const rounded = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;
    return rounded.toLocaleString('es-ES', {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
      maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    });
  };

  // Equipos con mantenimiento (solo equipos activos), ordenados por urgencia
  const equiposPendientes = useMemo(() => {
    const base = mantenimientos
      .filter(m => m.activo && fichasEquiposActivos.has(m.ficha))
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

    if (!search) return base;

    const searchLower = search.toLowerCase();
    return base.filter(m =>
      m.ficha.toLowerCase().includes(searchLower) ||
      m.nombreEquipo.toLowerCase().includes(searchLower)
    );
  }, [mantenimientos, search, fichasEquiposActivos]);

  const vencidosList = useMemo(() => equiposPendientes.filter(e => e.horasKmRestante < 0), [equiposPendientes]);
  const proximosList = useMemo(() => equiposPendientes.filter(e => e.horasKmRestante >= 0 && e.horasKmRestante <= 50), [equiposPendientes]);
  const alDiaList = useMemo(() => equiposPendientes.filter(e => e.horasKmRestante > 50), [equiposPendientes]);

  const equiposTabla = useMemo(() => {
    if (tab === 'todos') return equiposPendientes;
    if (tab === 'vencidos') return vencidosList;
    if (tab === 'proximos') return proximosList;
    if (tab === 'aldia') return alDiaList;
    return equiposPendientes;
  }, [tab, equiposPendientes, vencidosList, proximosList, alDiaList]);

  const getUrgencyBadge = (horasRestantes: number) => {
    if (horasRestantes < 0) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCIDO hace {formatHours(horasRestantes)}h
        </Badge>
      );
    }
    if (horasRestantes <= 50) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Próximo en {formatHours(horasRestantes)}h
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
        Al día ({formatHours(horasRestantes)}h)
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
              {vencidosList.length} vencidos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              {proximosList.length} próximos
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
              {equiposTabla.length} equipos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full max-w-[560px] grid-cols-4">
                  <TabsTrigger value="vencidos" className="text-sm gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Vencidos ({vencidosList.length})
                  </TabsTrigger>
                  <TabsTrigger value="proximos" className="text-sm gap-2">
                    <Clock className="h-4 w-4" />
                    Próximos ({proximosList.length})
                  </TabsTrigger>
                  <TabsTrigger value="aldia" className="text-sm gap-2">
                    <Truck className="h-4 w-4" />
                    Al día ({alDiaList.length})
                  </TabsTrigger>
                  <TabsTrigger value="todos" className="text-sm gap-2">
                    <Truck className="h-4 w-4" />
                    Todos ({equiposPendientes.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {equiposTabla.length === 0 ? (
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
                    {equiposTabla.map((mant) => (
                      <TableRow
                        key={mant.id}
                        className={cn(
                          'cursor-pointer',
                          mant.horasKmRestante < 0 && "bg-destructive/5",
                          mant.horasKmRestante >= 0 && mant.horasKmRestante <= 50 && "bg-amber-500/5"
                        )}
                        onClick={() => handleOpenDetalle(mant.ficha)}
                      >
                        <TableCell className="font-medium max-w-[360px] truncate">{mant.nombreEquipo}</TableCell>
                        <TableCell className="tabular-nums">{mant.ficha}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{mant.tipoMantenimiento}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(mant.horasKmActuales).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(mant.proximoMantenimiento).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(mant.horasKmRestante)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/mechanic/reportar/${mant.ficha}`);
                            }}
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

      <EquipoDetalleUnificado
        ficha={selectedFicha}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
      />
    </Layout>
  );
}

export default MechanicPendingListDesktop;
