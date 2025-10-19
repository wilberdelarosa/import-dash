import { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useHistorial } from '@/hooks/useHistorial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Info,
  Package,
  Wrench,
  Settings,
  FileText,
  X,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Clock3
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Historial() {
  const {
    eventos,
    loading,
    filtros,
    setFiltros,
    limpiarHistorial,
  } = useHistorial();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const getIconoNivel = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBadgeVariant = (tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (tipo) {
      case 'crear':
        return 'default';
      case 'actualizar':
        return 'secondary';
      case 'eliminar':
        return 'destructive';
      case 'mantenimiento_realizado':
        return 'default';
      case 'lectura_actualizada':
        return 'outline';
      case 'stock_movido':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEventoVisual = (tipo: string) => {
    switch (tipo) {
      case 'crear':
        return {
          icon: <PlusCircle className="h-4 w-4" />,
          iconBgClass: 'bg-emerald-50 text-emerald-600',
          dotClass: 'bg-emerald-500 ring-emerald-200',
          cardClass: 'border-emerald-200/60 hover:border-emerald-300/80',
        };
      case 'actualizar':
        return {
          icon: <RefreshCw className="h-4 w-4" />,
          iconBgClass: 'bg-sky-50 text-sky-600',
          dotClass: 'bg-sky-500 ring-sky-200',
          cardClass: 'border-sky-200/60 hover:border-sky-300/80',
        };
      case 'eliminar':
        return {
          icon: <Trash2 className="h-4 w-4" />,
          iconBgClass: 'bg-rose-50 text-rose-600',
          dotClass: 'bg-rose-500 ring-rose-200',
          cardClass: 'border-rose-200/60 hover:border-rose-300/80',
        };
      case 'mantenimiento_realizado':
        return {
          icon: <Wrench className="h-4 w-4" />,
          iconBgClass: 'bg-amber-50 text-amber-600',
          dotClass: 'bg-amber-500 ring-amber-200',
          cardClass: 'border-amber-200/60 hover:border-amber-300/80',
        };
      case 'lectura_actualizada':
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          iconBgClass: 'bg-indigo-50 text-indigo-600',
          dotClass: 'bg-indigo-500 ring-indigo-200',
          cardClass: 'border-indigo-200/60 hover:border-indigo-300/80',
        };
      case 'stock_movido':
        return {
          icon: <Package className="h-4 w-4" />,
          iconBgClass: 'bg-purple-50 text-purple-600',
          dotClass: 'bg-purple-500 ring-purple-200',
          cardClass: 'border-purple-200/60 hover:border-purple-300/80',
        };
      case 'sistema':
        return {
          icon: <Settings className="h-4 w-4" />,
          iconBgClass: 'bg-slate-50 text-slate-600',
          dotClass: 'bg-slate-500 ring-slate-200',
          cardClass: 'border-slate-200/60 hover:border-slate-300/80',
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          iconBgClass: 'bg-primary/10 text-primary',
          dotClass: 'bg-primary ring-primary/30',
          cardClass: 'border-border hover:border-primary/60',
        };
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      tipoEvento: [],
      modulo: [],
      nivelImportancia: [],
      fichaEquipo: null,
      fechaDesde: null,
      fechaHasta: null,
    });
  };

  const filtrosActivos = [
    filtros.tipoEvento.length > 0,
    filtros.modulo.length > 0,
    filtros.nivelImportancia.length > 0,
    Boolean(filtros.fichaEquipo),
    Boolean(filtros.fechaDesde),
    Boolean(filtros.fechaHasta),
  ].filter(Boolean).length;

  const eventosAgrupados = useMemo(() => {
    const grupos = new Map<string, typeof eventos>();

    eventos.forEach(evento => {
      const fecha = format(new Date(evento.createdAt), "EEEE d 'de' MMMM yyyy", { locale: es });
      if (!grupos.has(fecha)) {
        grupos.set(fecha, []);
      }
      grupos.get(fecha)?.push(evento);
    });

    return Array.from(grupos.entries());
  }, [eventos]);

  const exportarPDF = () => {
    // TODO: Implementar exportación a PDF
    console.log('Exportar a PDF');
  };

  const tiposEvento = ['crear', 'actualizar', 'eliminar', 'mantenimiento_realizado', 'lectura_actualizada', 'stock_movido', 'sistema'];
  const modulos = ['equipos', 'inventarios', 'mantenimientos', 'sistema'];
  const niveles = ['info', 'warning', 'critical'];

  return (
    <Layout title="Historial de Eventos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Historial de Eventos</h1>
            <p className="text-muted-foreground">
              Registro completo de todas las operaciones del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportarPDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Limpiar todo el historial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todos los eventos del historial.
                    Esta operación no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={limpiarHistorial}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {eventos.filter(e => e.nivelImportancia === 'critical').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {eventos.filter(e => e.nivelImportancia === 'warning').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Información</CardTitle>
              <Info className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {eventos.filter(e => e.nivelImportancia === 'info').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de búsqueda y filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en descripción, ficha, equipo, usuario..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant={mostrarFiltros || filtrosActivos ? "default" : "outline"}
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="relative gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {filtrosActivos > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] font-semibold flex items-center justify-center"
                    >
                      {filtrosActivos}
                    </Badge>
                  )}
                </Button>
                {(filtros.tipoEvento.length > 0 || 
                  filtros.modulo.length > 0 || 
                  filtros.nivelImportancia.length > 0 ||
                  filtros.fichaEquipo ||
                  filtros.fechaDesde ||
                  filtros.fechaHasta) && (
                  <Button
                    variant="ghost"
                    onClick={limpiarFiltros}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>

              {mostrarFiltros && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl border border-dashed border-border/60 bg-muted/40 p-6 shadow-inner">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
                    <Select
                      value={filtros.tipoEvento[0] || "todos"}
                      onValueChange={(value) => 
                        setFiltros({ ...filtros, tipoEvento: value === "todos" ? [] : [value] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {tiposEvento.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Módulo</label>
                    <Select
                      value={filtros.modulo[0] || "todos"}
                      onValueChange={(value) => 
                        setFiltros({ ...filtros, modulo: value === "todos" ? [] : [value] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {modulos.map(mod => (
                          <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nivel</label>
                    <Select
                      value={filtros.nivelImportancia[0] || "todos"}
                      onValueChange={(value) => 
                        setFiltros({ ...filtros, nivelImportancia: value === "todos" ? [] : [value] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {niveles.map(nivel => (
                          <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha Desde</label>
                    <Input
                      type="date"
                      value={filtros.fechaDesde?.toISOString().split('T')[0] || ''}
                      onChange={(e) => 
                        setFiltros({ 
                          ...filtros, 
                          fechaDesde: e.target.value ? new Date(e.target.value) : null 
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha Hasta</label>
                    <Input
                      type="date"
                      value={filtros.fechaHasta?.toISOString().split('T')[0] || ''}
                      onChange={(e) => 
                        setFiltros({ 
                          ...filtros, 
                          fechaHasta: e.target.value ? new Date(e.target.value) : null 
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Ficha de Equipo</label>
                    <Input
                      placeholder="AC-001"
                      value={filtros.fichaEquipo || ''}
                      onChange={(e) => 
                        setFiltros({ ...filtros, fichaEquipo: e.target.value || null })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Línea de Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Cargando eventos...
                </div>
              ) : eventosAgrupados.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay eventos que mostrar
                  </p>
                </div>
              ) : (
                <div className="relative px-6 py-8">
                  <div className="absolute left-8 top-0 h-full w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
                  <div className="space-y-10">
                    {eventosAgrupados.map(([fecha, eventosDia]) => (
                      <div key={fecha} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            {fecha}
                          </div>
                          <div className="h-px flex-1 bg-border" />
                          <Badge variant="outline" className="bg-primary/5 text-primary">
                            {eventosDia.length} {eventosDia.length === 1 ? "evento" : "eventos"}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          {eventosDia.map((evento) => {
                            const visual = getEventoVisual(evento.tipoEvento);

                            return (
                              <div key={evento.id} className="group relative pl-16">
                                <div
                                  className={cn(
                                    'absolute left-6 top-7 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-background ring-4 transition-transform duration-300 group-hover:scale-110',
                                    visual.dotClass
                                  )}
                                />
                                <div className="absolute left-0 top-2 flex h-12 w-12 items-center justify-center">
                                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm transition-all duration-300 group-hover:shadow-md">
                                    <span
                                      className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105',
                                        visual.iconBgClass
                                      )}
                                    >
                                      {visual.icon}
                                    </span>
                                  </span>
                                </div>

                                <div
                                  className={cn(
                                    'rounded-xl border bg-card/95 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                                    visual.cardClass
                                  )}
                                >
                                  <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={getBadgeVariant(evento.tipoEvento)} className="capitalize">
                                          {evento.tipoEvento.replace(/_/g, ' ')}
                                        </Badge>
                                        <Badge variant="outline">{evento.modulo}</Badge>
                                        {evento.fichaEquipo && (
                                          <Badge variant="secondary">{evento.fichaEquipo}</Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock3 className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(evento.createdAt), {
                                          addSuffix: true,
                                          locale: es,
                                        })}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-base font-semibold leading-tight">{evento.descripcion}</p>
                                      {evento.nombreEquipo && (
                                        <p className="text-sm text-muted-foreground">Equipo: {evento.nombreEquipo}</p>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                      <span className="font-medium text-foreground">Responsable:</span>
                                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                                        {evento.usuarioResponsable}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        {getIconoNivel(evento.nivelImportancia)}
                                        {evento.nivelImportancia.toUpperCase()}
                                      </span>
                                    </div>

                                    {(evento.datosAntes || evento.datosDespues) && (
                                      <details className="group/open mt-2 rounded-lg border border-dashed border-border/60 bg-muted/40 p-3 text-xs transition-colors hover:border-border">
                                        <summary className="cursor-pointer select-none font-medium text-muted-foreground transition-colors group-open:text-foreground">
                                          Ver detalle técnico
                                        </summary>
                                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                                          {evento.datosAntes && (
                                            <div className="rounded-md bg-background/80 p-2 shadow-inner">
                                              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Antes</p>
                                              <pre className="mt-1 max-h-40 overflow-auto text-[11px] leading-tight">
                                                {JSON.stringify(evento.datosAntes, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                          {evento.datosDespues && (
                                            <div className="rounded-md bg-background/80 p-2 shadow-inner">
                                              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Después</p>
                                              <pre className="mt-1 max-h-40 overflow-auto text-[11px] leading-tight">
                                                {JSON.stringify(evento.datosDespues, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
