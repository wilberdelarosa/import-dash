/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useHistorial } from '@/hooks/useHistorial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  Clock3,
  Activity,
  BarChart3,
  Database,
  User,
  Eye,
  EyeOff,
  ChevronDown,
  Archive,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { HistorialEvento, TipoEventoBase } from '@/types/historial';

export default function Historial() {
  const {
    eventos,
    loading,
    filtros,
    setFiltros,
    limpiarHistorial,
  } = useHistorial();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'timeline' | 'tabla' | 'estadisticas'>('timeline');
  const [mostrarDetallesTecnicos, setMostrarDetallesTecnicos] = useState(false);

  const normalizeNumber = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const buildDetallesEvento = (evento: HistorialEvento): { label: string; value: ReactNode }[] => {
    const detalles: { label: string; value: ReactNode }[] = [];
    const metadata = (evento.metadata ?? {}) as Record<string, any>;
    const datosAntes = (evento.datosAntes ?? {}) as Record<string, any>;
    const datosDespues = (evento.datosDespues ?? {}) as Record<string, any>;

    if (evento.fichaEquipo) {
      detalles.push({ label: 'Ficha', value: evento.fichaEquipo });
    }

    switch (evento.tipoEvento) {
      case 'lectura_actualizada': {
        const lectura = normalizeNumber(datosDespues.horasKm ?? metadata.horasKm);
        const lecturaAnterior = normalizeNumber(datosAntes.horasKm ?? metadata.horasPrevias);
        const incremento = normalizeNumber(datosDespues.incremento ?? metadata.incremento);
        const restante = normalizeNumber(datosDespues.restante ?? metadata.restante);
        const observaciones = metadata.observaciones ?? datosDespues.observaciones;

        if (lectura !== null) {
          detalles.push({ label: 'Lectura registrada', value: `${lectura} h/km` });
        }
        if (lecturaAnterior !== null) {
          detalles.push({ label: 'Lectura anterior', value: `${lecturaAnterior} h/km` });
        }
        if (incremento !== null) {
          detalles.push({ label: 'Incremento', value: `${incremento} h/km` });
        }
        if (restante !== null) {
          detalles.push({ label: 'Horas/km restantes', value: `${restante} h/km` });
        }
        if (observaciones) {
          detalles.push({ label: 'Observaciones', value: <span className="text-sm text-muted-foreground">{observaciones}</span> });
        }
        break;
      }
      case 'mantenimiento_realizado': {
        const lectura = normalizeNumber(datosDespues.horasKmAlMomento ?? metadata.horasKmAlMomento);
        const lecturaAnterior = normalizeNumber(metadata.horasPrevias ?? datosAntes.horasKmUltimoMantenimiento);
        const incremento = normalizeNumber(datosDespues.incrementoDesdeUltimo ?? metadata.incrementoDesdeUltimo);
        const filtros = Array.isArray(metadata.filtrosUtilizados)
          ? metadata.filtrosUtilizados
          : Array.isArray(datosDespues.filtrosUtilizados)
          ? datosDespues.filtrosUtilizados
          : [];
        const observaciones = metadata.observaciones ?? datosDespues.observaciones;

        if (lectura !== null) {
          detalles.push({ label: 'Horas/km al momento', value: `${lectura} h/km` });
        }
        if (lecturaAnterior !== null) {
          detalles.push({ label: 'Lectura previa', value: `${lecturaAnterior} h/km` });
        }
        if (incremento !== null) {
          detalles.push({ label: 'Incremento desde último', value: `${incremento} h/km` });
        }
        if (filtros.length > 0) {
          const listado = filtros
            .map((filtro: any) => {
              if (!filtro) return null;
              const nombre = filtro.nombre ?? filtro.descripcion ?? 'Filtro';
              const cantidad = filtro.cantidad ?? 1;
              return `${nombre} (${cantidad})`;
            })
            .filter(Boolean)
            .join(', ');
          if (listado) {
            detalles.push({ label: 'Filtros utilizados', value: listado });
          }
        }
        if (observaciones) {
          detalles.push({ label: 'Observaciones', value: <span className="text-sm text-muted-foreground">{observaciones}</span> });
        }
        break;
      }
      default: {
        if (evento.descripcion) {
          detalles.push({ label: 'Descripción', value: evento.descripcion });
        }
        break;
      }
    }

    if (metadata.fechaMantenimiento || metadata.fecha) {
      const fechaRef = metadata.fechaMantenimiento ?? metadata.fecha;
      if (typeof fechaRef === 'string') {
        detalles.push({ label: 'Fecha registrada', value: new Date(fechaRef).toLocaleString('es-ES') });
      }
    }

    return detalles;
  };

  const renderDetallesEvento = (evento: HistorialEvento) => {
    const detalles = buildDetallesEvento(evento);
    if (detalles.length === 0) return null;

    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {detalles.map((detalle, index) => (
          <div key={`${detalle.label}-${index}`} className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{detalle.label}</p>
            <p className="text-sm font-medium mt-1 break-words">{detalle.value}</p>
          </div>
        ))}
      </div>
    );
  };

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

  const getIconoModulo = (modulo: string) => {
    switch (modulo) {
      case 'equipos':
        return <Activity className="h-4 w-4" />;
      case 'inventarios':
        return <Package className="h-4 w-4" />;
      case 'mantenimientos':
        return <Settings className="h-4 w-4" />;
      case 'sistema':
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (
    tipo: TipoEventoBase,
  ): "default" | "secondary" | "destructive" | "outline" => {
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

  const getEventoVisual = (tipo: TipoEventoBase) => {
    switch (tipo) {
      case 'crear':
        return {
          label: 'Creación',
          icon: <PlusCircle className="h-4 w-4" />,
          iconBgClass: 'bg-emerald-50 text-emerald-600',
          dotClass: 'bg-emerald-500 ring-emerald-200',
          cardClass: 'border-emerald-200/60 hover:border-emerald-300/80',
        };
      case 'actualizar':
        return {
          label: 'Actualización',
          icon: <RefreshCw className="h-4 w-4" />,
          iconBgClass: 'bg-sky-50 text-sky-600',
          dotClass: 'bg-sky-500 ring-sky-200',
          cardClass: 'border-sky-200/60 hover:border-sky-300/80',
        };
      case 'eliminar':
        return {
          label: 'Eliminación',
          icon: <Trash2 className="h-4 w-4" />,
          iconBgClass: 'bg-rose-50 text-rose-600',
          dotClass: 'bg-rose-500 ring-rose-200',
          cardClass: 'border-rose-200/60 hover:border-rose-300/80',
        };
      case 'mantenimiento_realizado':
        return {
          label: 'Mantenimiento realizado',
          icon: <Wrench className="h-4 w-4" />,
          iconBgClass: 'bg-amber-50 text-amber-600',
          dotClass: 'bg-amber-500 ring-amber-200',
          cardClass: 'border-amber-200/60 hover:border-amber-300/80',
        };
      case 'lectura_actualizada':
        return {
          label: 'Lectura actualizada',
          icon: <TrendingUp className="h-4 w-4" />,
          iconBgClass: 'bg-indigo-50 text-indigo-600',
          dotClass: 'bg-indigo-500 ring-indigo-200',
          cardClass: 'border-indigo-200/60 hover:border-indigo-300/80',
        };
      case 'stock_movido':
        return {
          label: 'Movimiento de stock',
          icon: <Package className="h-4 w-4" />,
          iconBgClass: 'bg-purple-50 text-purple-600',
          dotClass: 'bg-purple-500 ring-purple-200',
          cardClass: 'border-purple-200/60 hover:border-purple-300/80',
        };
      case 'sistema':
      default:
        return {
          label: 'Sistema',
          icon: <Settings className="h-4 w-4" />,
          iconBgClass: 'bg-slate-50 text-slate-600',
          dotClass: 'bg-slate-500 ring-slate-200',
          cardClass: 'border-slate-200/60 hover:border-slate-300/80',
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

  // Estadísticas avanzadas
  const estadisticasAvanzadas = useMemo(() => {
    const porModulo = eventos.reduce((acc, evento) => {
      acc[evento.modulo] = (acc[evento.modulo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const porTipo = eventos.reduce((acc, evento) => {
      const key = evento.categoriaEvento;
      const actual = acc[key] ?? { etiqueta: evento.etiquetaCategoria, cantidad: 0 };
      actual.cantidad += 1;
      actual.etiqueta = evento.etiquetaCategoria;
      acc[key] = actual;
      return acc;
    }, {} as Partial<Record<TipoEventoBase, { etiqueta: string; cantidad: number }>>);

    const porEquipo = eventos
      .filter(e => e.fichaEquipo)
      .reduce((acc, evento) => {
        const key = `${evento.fichaEquipo} - ${evento.nombreEquipo}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topEquipos = Object.entries(porEquipo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const ultimosSieteDias = eventos.filter(e => {
      const fecha = new Date(e.createdAt);
      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
      return fecha >= haceUnaSemana;
    }).length;

    return {
      porModulo,
      porTipo,
      porEquipo,
      topEquipos,
      ultimosSieteDias,
      promedioEventosPorDia: eventos.length > 0 ? (eventos.length / 30).toFixed(1) : '0'
    };
  }, [eventos]);

  const exportarPDF = () => {
    // TODO: Implementar exportación a PDF
    console.log('Exportar a PDF');
  };

  const tiposEvento: TipoEventoBase[] = ['crear', 'actualizar', 'eliminar', 'mantenimiento_realizado', 'lectura_actualizada', 'stock_movido', 'sistema'];
  const modulos = ['equipos', 'inventarios', 'mantenimientos', 'sistema'];
  const niveles = ['info', 'warning', 'critical'];

  return (
    <Layout title="Historial de Eventos">
      <div className="space-y-6">
        {/* Header con Tabs */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">Historial de Eventos</h1>
            <p className="text-muted-foreground">
              Registro cronológico y análisis de todas las actividades del sistema
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            <Tabs value={vistaActiva} onValueChange={(v) => setVistaActiva(v as any)} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline" className="gap-2">
                  <Clock3 className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="tabla" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Tabla
                </TabsTrigger>
                <TabsTrigger value="estadisticas" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => setMostrarDetallesTecnicos(!mostrarDetallesTecnicos)}
                variant="outline" 
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {mostrarDetallesTecnicos ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {mostrarDetallesTecnicos ? 'Ocultar' : 'Ver'} Datos
              </Button>
              
              <Button onClick={exportarPDF} variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                    <Trash2 className="h-4 w-4 mr-2" />
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
        </div>

        {/* Estadísticas Mejoradas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventos.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 7 días: {estadisticasAvanzadas.ultimosSieteDias}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {eventos.filter(e => e.nivelImportancia === 'critical').length}
              </div>
              <Progress 
                value={(eventos.filter(e => e.nivelImportancia === 'critical').length / (eventos.length || 1)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {eventos.filter(e => e.nivelImportancia === 'warning').length}
              </div>
              <Progress 
                value={(eventos.filter(e => e.nivelImportancia === 'warning').length / (eventos.length || 1)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Información</CardTitle>
              <Info className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {eventos.filter(e => e.nivelImportancia === 'info').length}
              </div>
              <Progress 
                value={(eventos.filter(e => e.nivelImportancia === 'info').length / (eventos.length || 1)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio/Día</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticasAvanzadas.promedioEventosPorDia}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 30 días
              </p>
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
                {filtrosActivos > 0 && (
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
                        setFiltros({
                          ...filtros,
                          tipoEvento: value === "todos" ? [] : [value as TipoEventoBase],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {tiposEvento.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{getEventoVisual(tipo).label}</SelectItem>
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
                          <SelectItem key={mod} value={mod} className="capitalize">{mod}</SelectItem>
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
                          <SelectItem key={nivel} value={nivel} className="capitalize">{nivel}</SelectItem>
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

        {/* Contenido según vista activa */}
        {vistaActiva === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Línea de Tiempo
              </CardTitle>
              <CardDescription>
                {eventos.length > 0 
                  ? `Mostrando ${eventos.length} evento(s) ordenados cronológicamente`
                  : 'No hay eventos registrados'
                }
              </CardDescription>
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
                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                            <Badge variant="secondary" className="gap-1">
                              <Activity className="h-3 w-3" />
                              {eventosDia.length}
                            </Badge>
                          </div>

                          <div className="space-y-4 pl-6">
                            {eventosDia.map((evento) => {
                              const visual = getEventoVisual(evento.categoriaEvento);
                              const detallesEvento = renderDetallesEvento(evento);

                              return (
                                <Collapsible key={evento.id}>
                                  <div className="flex items-start gap-3 group relative">
                                    <div className="absolute -left-9 mt-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm ring-2 ring-primary/20 z-10">
                                      {getIconoNivel(evento.nivelImportancia)}
                                    </div>

                                    <Card className={cn(
                                      "flex-1 hover:shadow-lg transition-all border-l-4",
                                      visual.cardClass
                                    )} style={{
                                      borderLeftColor: evento.nivelImportancia === 'critical' ? 'hsl(var(--destructive))' :
                                                      evento.nivelImportancia === 'warning' ? 'rgb(245, 158, 11)' :
                                                      'hsl(var(--primary))'
                                    }}>
                                      <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Badge variant={getBadgeVariant(evento.categoriaEvento)} className="gap-1">
                                                <span className="flex items-center gap-1">
                                                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', visual.iconBgClass)}>
                                                    {visual.icon}
                                                  </span>
                                                  {visual.label}
                                                </span>
                                              </Badge>
                                              {evento.etiquetaSubtipo && evento.etiquetaSubtipo !== visual.label && (
                                                <Badge variant="outline" className="gap-1">
                                                  <Info className="h-3 w-3" />
                                                  {evento.etiquetaSubtipo}
                                                </Badge>
                                              )}
                                              <Badge variant="outline" className="gap-1">
                                                {getIconoModulo(evento.modulo)}
                                                <span className="capitalize">{evento.modulo}</span>
                                              </Badge>
                                              {evento.fichaEquipo && (
                                                <Badge variant="secondary" className="gap-1">
                                                  <Archive className="h-3 w-3" />
                                                  {evento.fichaEquipo}
                                                </Badge>
                                              )}
                                            </div>
                                            
                                            <p className="text-sm font-medium leading-relaxed">
                                              {evento.descripcion}
                                            </p>
                                            
                                            {evento.nombreEquipo && (
                                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Activity className="h-3 w-3" />
                                                {evento.nombreEquipo}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>

                                      <CardContent className="pt-0 space-y-3">
                                        <Separator />
                                        
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                          <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded">
                                            <User className="h-3 w-3" />
                                            <span className="font-medium">{evento.usuarioResponsable}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded">
                                            <Clock3 className="h-3 w-3" />
                                            {new Date(evento.createdAt).toLocaleTimeString('es-ES', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              second: '2-digit'
                                            })}
                                          </div>
                                        </div>

                                        {detallesEvento && (
                                          <div className="pt-3">
                                            {detallesEvento}
                                          </div>
                                        )}

                                        {mostrarDetallesTecnicos && (evento.datosAntes || evento.datosDespues) && (
                                          <div className="space-y-2 pt-2">
                                            {evento.datosAntes && (
                                              <div className="rounded-lg bg-muted/50 p-3 space-y-1 border">
                                                <p className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
                                                  <Database className="h-3 w-3" />
                                                  Datos anteriores:
                                                </p>
                                                <pre className="text-xs overflow-x-auto bg-background p-2 rounded font-mono">
                                                  {JSON.stringify(evento.datosAntes, null, 2)}
                                                </pre>
                                              </div>
                                            )}
                                            
                                            {evento.datosDespues && (
                                              <div className="rounded-lg bg-muted/50 p-3 space-y-1 border">
                                                <p className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
                                                  <Database className="h-3 w-3" />
                                                  Datos nuevos:
                                                </p>
                                                <pre className="text-xs overflow-x-auto bg-background p-2 rounded font-mono">
                                                  {JSON.stringify(evento.datosDespues, null, 2)}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>
                                </Collapsible>
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
        )}

        {vistaActiva === 'tabla' && (
          <Card>
            <CardHeader>
              <CardTitle>Vista de Tabla</CardTitle>
              <CardDescription>Todos los eventos en formato tabular</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium">Fecha/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium">Módulo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium">Descripción</th>
                        <th className="px-4 py-3 text-left text-xs font-medium">Equipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium">Nivel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventos.map((evento, idx) => {
                        const visual = getEventoVisual(evento.categoriaEvento);

                        return (
                          <tr key={evento.id} className={cn(
                            "border-b transition-colors hover:bg-muted/50",
                            idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                          )}>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            {new Date(evento.createdAt).toLocaleString('es-ES')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <Badge variant={getBadgeVariant(evento.categoriaEvento)} className="text-xs">
                                <span className="flex items-center gap-1">
                                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', visual.iconBgClass)}>
                                    {visual.icon}
                                  </span>
                                  {visual.label}
                                </span>
                              </Badge>
                              {evento.etiquetaSubtipo && evento.etiquetaSubtipo !== visual.label && (
                                <span className="text-[11px] text-muted-foreground">
                                  {evento.etiquetaSubtipo}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {getIconoModulo(evento.modulo)}
                              <span className="text-xs capitalize">{evento.modulo}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs max-w-xs truncate">
                            {evento.descripcion}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {evento.fichaEquipo ? (
                              <Badge variant="secondary" className="text-xs">
                                {evento.fichaEquipo}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs">{evento.usuarioResponsable}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {getIconoNivel(evento.nivelImportancia)}
                            </div>
                          </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {vistaActiva === 'estadisticas' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Eventos por Módulo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(estadisticasAvanzadas.porModulo).map(([modulo, cantidad]) => (
                    <div key={modulo} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getIconoModulo(modulo)}
                          <span className="capitalize font-medium">{modulo}</span>
                        </div>
                        <span className="font-bold">{cantidad}</span>
                      </div>
                      <Progress value={(cantidad / eventos.length) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tipos de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(estadisticasAvanzadas.porTipo).map(([tipo, data]) => {
                    if (!data) return null;

                    const visual = getEventoVisual(tipo as TipoEventoBase);
                    const porcentaje = eventos.length > 0 ? (data.cantidad / eventos.length) * 100 : 0;

                    return (
                      <div key={tipo} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{data.etiqueta ?? visual.label}</span>
                          <span className="font-bold">{data.cantidad}</span>
                        </div>
                        <Progress value={porcentaje} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top 10 Equipos con Más Actividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                {estadisticasAvanzadas.topEquipos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos de equipos disponibles
                  </p>
                ) : (
                  <div className="space-y-3">
                    {estadisticasAvanzadas.topEquipos.map(([equipo, cantidad], idx) => (
                      <div key={equipo} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                            <span className="font-medium">{equipo}</span>
                          </div>
                          <span className="font-bold">{cantidad} eventos</span>
                        </div>
                        <Progress value={(cantidad / eventos.length) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
