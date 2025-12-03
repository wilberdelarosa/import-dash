import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useHistorial } from '@/hooks/useHistorial';
import {
    Search,
    Filter,
    RefreshCw,
    Download,
    Trash2,
    AlertCircle,
    AlertTriangle,
    Info,
    Wrench,
    TrendingUp,
    Package,
    Settings,
    Activity,
    Calendar,
    ChevronDown,
    ChevronUp,
    Clock,
    X,
    BarChart3,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TipoEventoBase, HistorialEvento } from '@/types/historial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

interface HistorialMobileProps {
    loading?: boolean;
}

export function HistorialMobile({ loading: externalLoading }: HistorialMobileProps) {
    const {
        eventos,
        loading,
        filtros,
        setFiltros,
        limpiarHistorial,
    } = useHistorial();

    const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'stats'>('timeline');
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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

    const getEventoVisual = (tipo: TipoEventoBase) => {
        switch (tipo) {
            case 'crear':
                return {
                    label: 'Creación',
                    bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
                    borderClass: 'border-l-emerald-500',
                    textClass: 'text-emerald-700 dark:text-emerald-400',
                };
            case 'actualizar':
                return {
                    label: 'Actualización',
                    bgClass: 'bg-sky-50 dark:bg-sky-950/20',
                    borderClass: 'border-l-sky-500',
                    textClass: 'text-sky-700 dark:text-sky-400',
                };
            case 'eliminar':
                return {
                    label: 'Eliminación',
                    bgClass: 'bg-rose-50 dark:bg-rose-950/20',
                    borderClass: 'border-l-rose-500',
                    textClass: 'text-rose-700 dark:text-rose-400',
                };
            case 'mantenimiento_realizado':
                return {
                    label: 'Mantenimiento',
                    bgClass: 'bg-amber-50 dark:bg-amber-950/20',
                    borderClass: 'border-l-amber-500',
                    textClass: 'text-amber-700 dark:text-amber-400',
                };
            case 'lectura_actualizada':
                return {
                    label: 'Lectura',
                    bgClass: 'bg-indigo-50 dark:bg-indigo-950/20',
                    borderClass: 'border-l-indigo-500',
                    textClass: 'text-indigo-700 dark:text-indigo-400',
                };
            case 'stock_movido':
                return {
                    label: 'Stock',
                    bgClass: 'bg-purple-50 dark:bg-purple-950/20',
                    borderClass: 'border-l-purple-500',
                    textClass: 'text-purple-700 dark:text-purple-400',
                };
            default:
                return {
                    label: 'Sistema',
                    bgClass: 'bg-slate-50 dark:bg-slate-950/20',
                    borderClass: 'border-l-slate-500',
                    textClass: 'text-slate-700 dark:text-slate-400',
                };
        }
    };

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

    const estadisticas = useMemo(() => {
        const criticos = eventos.filter(e => e.nivelImportancia === 'critical').length;
        const advertencias = eventos.filter(e => e.nivelImportancia === 'warning').length;
        const info = eventos.filter(e => e.nivelImportancia === 'info').length;

        const ultimos7Dias = eventos.filter(e => {
            const fecha = new Date(e.createdAt);
            const haceUnaSemana = new Date();
            haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
            return fecha >= haceUnaSemana;
        }).length;

        return { criticos, advertencias, info, ultimos7Dias };
    }, [eventos]);

    const filtrosActivos = [
        filtros.tipoEvento.length > 0,
        filtros.modulo.length > 0,
        filtros.nivelImportancia.length > 0,
        Boolean(filtros.fichaEquipo),
        Boolean(filtros.fechaDesde),
        Boolean(filtros.fechaHasta),
    ].filter(Boolean).length;

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
        setFilterSheetOpen(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    const formatTime = (dateString: string) => {
        return format(new Date(dateString), 'HH:mm', { locale: es });
    };

    return (
        <MobileLayout
            title="Historial"
            headerActions={
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                    >
                        <RefreshCw className={cn(
                            "h-5 w-5",
                            (refreshing || loading) && "animate-spin"
                        )} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full relative"
                        onClick={() => setFilterSheetOpen(true)}
                    >
                        <Filter className="h-5 w-5" />
                        {filtrosActivos > 0 && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                {filtrosActivos}
                            </div>
                        )}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 pb-20">
                {/* Búsqueda rápida */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar eventos..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                        className="pl-10 h-11"
                    />
                    {filtrosActivos > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                            onClick={limpiarFiltros}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="timeline" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Timeline
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Stats
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="mt-4 space-y-4">
                        {/* Métricas rápidas */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <MobileCard variant="compact" className="text-center">
                                <p className="text-2xl font-bold">{eventos.length}</p>
                                <p className="text-[0.65rem] text-muted-foreground">Total</p>
                            </MobileCard>
                            <MobileCard variant="compact" className="text-center border-red-500/30 bg-red-500/5">
                                <p className="text-2xl font-bold text-destructive">{estadisticas.criticos}</p>
                                <p className="text-[0.65rem] text-muted-foreground">Críticos</p>
                            </MobileCard>
                            <MobileCard variant="compact" className="text-center border-amber-500/30 bg-amber-500/5">
                                <p className="text-2xl font-bold text-amber-600">{estadisticas.advertencias}</p>
                                <p className="text-[0.65rem] text-muted-foreground">Alertas</p>
                            </MobileCard>
                            <MobileCard variant="compact" className="text-center border-blue-500/30 bg-blue-500/5">
                                <p className="text-2xl font-bold text-blue-600">{estadisticas.ultimos7Dias}</p>
                                <p className="text-[0.65rem] text-muted-foreground">7 días</p>
                            </MobileCard>
                        </div>

                        {/* Timeline de eventos */}
                        {loading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p>Cargando eventos...</p>
                            </div>
                        ) : eventosAgrupados.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                                <p className="text-muted-foreground">No hay eventos para mostrar</p>
                                {filtrosActivos > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={limpiarFiltros}
                                    >
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {eventosAgrupados.map(([fecha, eventosDia]) => (
                                    <div key={fecha} className="space-y-3">
                                        {/* Encabezado de fecha */}
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                                {fecha}
                                            </h3>
                                            <div className="h-px flex-1 bg-border" />
                                            <Badge variant="secondary" className="text-xs">
                                                {eventosDia.length}
                                            </Badge>
                                        </div>

                                        {/* Eventos del día */}
                                        <div className="space-y-2">
                                            {eventosDia.map((evento) => {
                                                const visual = getEventoVisual(evento.categoriaEvento);
                                                const isExpanded = expandedEventId === evento.id;

                                                return (
                                                    <MobileCard
                                                        key={evento.id}
                                                        className={cn(
                                                            "p-0 overflow-hidden border-l-4 transition-all",
                                                            visual.borderClass
                                                        )}
                                                    >
                                                        <button
                                                            onClick={() => setExpandedEventId(isExpanded ? null : evento.id)}
                                                            className="w-full p-3 text-left"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0 space-y-2">
                                                                    {/* Header del evento */}
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {getIconoNivel(evento.nivelImportancia)}
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn("text-xs", visual.textClass)}
                                                                        >
                                                                            {visual.label}
                                                                        </Badge>
                                                                        <span className="text-[0.65rem] text-muted-foreground">
                                                                            {formatTime(evento.createdAt)}
                                                                        </span>
                                                                    </div>

                                                                    {/* Descripción */}
                                                                    <p className="text-sm font-medium line-clamp-2">
                                                                        {evento.descripcion}
                                                                    </p>

                                                                    {/* Metadata compacta */}
                                                                    {(evento.fichaEquipo || evento.nombreEquipo) && (
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                            {evento.fichaEquipo && (
                                                                                <span className="font-medium">
                                                                                    {evento.fichaEquipo}
                                                                                </span>
                                                                            )}
                                                                            {evento.nombreEquipo && (
                                                                                <span className="truncate">
                                                                                    {evento.nombreEquipo}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Indicador de expandir */}
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        </button>

                                                        {/* Detalles expandidos */}
                                                        {isExpanded && (
                                                            <div className={cn(
                                                                "border-t border-border/50 p-3 space-y-2 text-xs animate-in slide-in-from-top-2",
                                                                visual.bgClass
                                                            )}>
                                                                <div className="grid gap-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Módulo:</span>
                                                                        <span className="font-medium capitalize">{evento.modulo}</span>
                                                                    </div>
                                                                    {evento.usuarioResponsable && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Usuario:</span>
                                                                            <span className="font-medium">{evento.usuarioResponsable}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Hora exacta:</span>
                                                                        <span className="font-medium">
                                                                            {format(new Date(evento.createdAt), 'HH:mm:ss', { locale: es })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </MobileCard>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="stats" className="mt-4 space-y-4">
                        <MobileCard variant="glass" className="p-4">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Estadísticas Generales
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total de eventos</span>
                                        <span className="font-bold">{eventos.length}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '100%' }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Críticos</span>
                                        <span className="font-bold text-destructive">{estadisticas.criticos}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-destructive"
                                            style={{ width: `${(estadisticas.criticos / (eventos.length || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Advertencias</span>
                                        <span className="font-bold text-amber-600">{estadisticas.advertencias}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500"
                                            style={{ width: `${(estadisticas.advertencias / (eventos.length || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Información</span>
                                        <span className="font-bold text-blue-600">{estadisticas.info}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(estadisticas.info / (eventos.length || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </MobileCard>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Limpiar todo el historial
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción eliminará permanentemente todos los eventos del historial.
                                        Esta operación no se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={limpiarHistorial} className="bg-destructive">
                                        Confirmar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Sheet de filtros */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-[2rem] border-t-0">
                    <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted mb-4" />
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros Avanzados
                        </SheetTitle>
                        <SheetDescription>
                            Personaliza la vista del historial aplicando filtros
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)] pb-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Evento</label>
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
                                    <SelectItem value="crear">Creación</SelectItem>
                                    <SelectItem value="actualizar">Actualización</SelectItem>
                                    <SelectItem value="eliminar">Eliminación</SelectItem>
                                    <SelectItem value="mantenimiento_realizado">Mantenimiento</SelectItem>
                                    <SelectItem value="lectura_actualizada">Lectura</SelectItem>
                                    <SelectItem value="stock_movido">Stock</SelectItem>
                                    <SelectItem value="sistema">Sistema</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nivel de Importancia</label>
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
                                    <SelectItem value="info">Información</SelectItem>
                                    <SelectItem value="warning">Advertencia</SelectItem>
                                    <SelectItem value="critical">Crítico</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha Desde</label>
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha Hasta</label>
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ficha de Equipo</label>
                            <Input
                                placeholder="Ej: AC-001"
                                value={filtros.fichaEquipo || ''}
                                onChange={(e) =>
                                    setFiltros({ ...filtros, fichaEquipo: e.target.value || null })
                                }
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={limpiarFiltros}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Limpiar
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => setFilterSheetOpen(false)}
                        >
                            Aplicar Filtros
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </MobileLayout>
    );
}
