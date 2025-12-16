import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Ticket,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    BarChart3,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { TicketCard } from '@/components/tickets/TicketCard';
import { CreateTicketForm } from '@/components/tickets/CreateTicketForm';
import { GestorTicketsMobile } from './mobile/GestorTicketsMobile';
import { cn } from '@/lib/utils';
import type { TicketStatus, TicketPriority, EquipmentTicketWithEquipo } from '@/types/tickets';
import { TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG } from '@/types/tickets';

type ViewMode = 'todos' | 'abiertos' | 'en_proceso' | 'cerrados';

export default function GestorTickets() {
    const { isMobile } = useDeviceDetection();
    const { tickets, loading, stats, loadTickets } = useEquipmentTickets();
    const { data } = useSupabaseDataContext();

    // Renderizar versión móvil si corresponde
    if (isMobile) {
        return <GestorTicketsMobile />;
    }

    // Filtros
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
    const [equipoFilter, setEquipoFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('todos');

    // Modal crear ticket
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEquipoForCreate, setSelectedEquipoForCreate] = useState<{
        id: number;
        ficha: string;
        nombre: string;
    } | null>(null);

    // Equipos únicos para filtro
    const equiposUnicos = useMemo(() => {
        const fichas = new Set(tickets.map(t => t.ficha));
        return data.equipos.filter(e => fichas.has(e.ficha));
    }, [tickets, data.equipos]);

    // Filtrar tickets
    const filteredTickets = useMemo(() => {
        let result = [...tickets];

        if (viewMode === 'abiertos') {
            result = result.filter(t => t.status === 'abierto');
        } else if (viewMode === 'en_proceso') {
            result = result.filter(t => !['abierto', 'cerrado', 'cancelado'].includes(t.status));
        } else if (viewMode === 'cerrados') {
            result = result.filter(t => ['cerrado', 'cancelado'].includes(t.status));
        }

        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter);
        }

        if (priorityFilter !== 'all') {
            result = result.filter(t => t.prioridad === priorityFilter);
        }

        if (equipoFilter !== 'all') {
            result = result.filter(t => t.ficha === equipoFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.titulo.toLowerCase().includes(query) ||
                t.descripcion.toLowerCase().includes(query) ||
                t.ficha.toLowerCase().includes(query) ||
                t.equipo?.nombre?.toLowerCase().includes(query) ||
                t.pieza_solicitada?.toLowerCase().includes(query) ||
                t.numero_parte?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [tickets, viewMode, statusFilter, priorityFilter, equipoFilter, searchQuery]);

    const ticketsByStatus = useMemo(() => {
        const groups: Record<TicketStatus, EquipmentTicketWithEquipo[]> = {
            abierto: [],
            en_cotizacion: [],
            cotizado: [],
            orden_compra: [],
            pieza_en_camino: [],
            pieza_recibida: [],
            en_reparacion: [],
            cerrado: [],
            cancelado: [],
        };

        filteredTickets.forEach(ticket => {
            groups[ticket.status].push(ticket);
        });

        return groups;
    }, [filteredTickets]);

    const handleCreateTicket = (equipo?: typeof selectedEquipoForCreate) => {
        setSelectedEquipoForCreate(equipo || null);
        setShowCreateModal(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <Navigation />

            <main className="mx-auto max-w-[1600px] px-3 pb-24 sm:px-6 sm:pb-8 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10">
                                <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            Gestor de Tickets
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                            Gestiona incidencias, averías y solicitudes de piezas
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => loadTickets()} className="text-xs sm:text-sm">
                            <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2", loading && "animate-spin")} />
                            <span className="hidden sm:inline">Actualizar</span>
                        </Button>
                        <Button size="sm" onClick={() => handleCreateTicket()} className="text-xs sm:text-sm">
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Nuevo
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 mb-4 sm:mb-6">
                    <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Abiertos</p>
                                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.abiertos}</p>
                                </div>
                                <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8 text-blue-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">En Proceso</p>
                                    <p className="text-lg sm:text-2xl font-bold text-amber-600">{stats.enProceso}</p>
                                </div>
                                <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-amber-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Cerrados</p>
                                    <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.cerrados}</p>
                                </div>
                                <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-500/20 bg-red-50/50 dark:bg-red-950/20">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Críticos</p>
                                    <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.criticos}</p>
                                </div>
                                <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8 text-red-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-500/20 hidden sm:block">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Cancelados</p>
                                    <p className="text-lg sm:text-2xl font-bold text-slate-600">{stats.cancelados}</p>
                                </div>
                                <XCircle className="h-5 w-5 sm:h-8 sm:w-8 text-slate-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5 hidden sm:block">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                                    <p className="text-lg sm:text-2xl font-bold text-primary">{stats.total}</p>
                                </div>
                                <BarChart3 className="h-5 w-5 sm:h-8 sm:w-8 text-primary/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card className="mb-4 sm:mb-6">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col gap-3">
                            {/* Búsqueda */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por título, equipo, pieza..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 text-sm"
                                />
                            </div>

                            {/* Filtros */}
                            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | 'all')}>
                                    <SelectTrigger className="w-full sm:w-36 text-sm">
                                        <Filter className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}>
                                    <SelectTrigger className="w-full sm:w-28 text-sm">
                                        <SelectValue placeholder="Prioridad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {Object.entries(TICKET_PRIORITY_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={equipoFilter} onValueChange={setEquipoFilter}>
                                    <SelectTrigger className="w-full sm:w-40 text-sm">
                                        <Truck className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        <SelectValue placeholder="Equipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los equipos</SelectItem>
                                        {equiposUnicos.map(equipo => (
                                            <SelectItem key={equipo.ficha} value={equipo.ficha}>
                                                {equipo.ficha} - {equipo.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(statusFilter !== 'all' || priorityFilter !== 'all' || equipoFilter !== 'all' || searchQuery) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => {
                                            setStatusFilter('all');
                                            setPriorityFilter('all');
                                            setEquipoFilter('all');
                                            setSearchQuery('');
                                        }}
                                    >
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vista por tabs */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-4">
                        <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
                            <TabsTrigger value="todos" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
                                Todos
                                <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{tickets.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="abiertos" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
                                Abiertos
                                <Badge variant="outline" className="ml-1 bg-blue-500/10 text-blue-600 text-[10px] h-4 px-1">{stats.abiertos}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="en_proceso" className="gap-1 text-xs sm:text-sm whitespace-nowrap flex-1 sm:flex-none">
                                En Proceso
                                <Badge variant="outline" className="ml-1 bg-amber-500/10 text-amber-600 text-[10px] h-4 px-1">{stats.enProceso}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="cerrados" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
                                Cerrados
                                <Badge variant="outline" className="ml-1 bg-green-500/10 text-green-600 text-[10px] h-4 px-1">{stats.cerrados}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value={viewMode} className="mt-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 sm:py-20">
                                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 sm:py-16 text-center">
                                    <Ticket className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-base sm:text-lg font-medium mb-2">
                                        {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || equipoFilter !== 'all'
                                            ? 'No se encontraron tickets'
                                            : 'No hay tickets registrados'
                                        }
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || equipoFilter !== 'all'
                                            ? 'Intenta con otros filtros de búsqueda'
                                            : 'Crea el primer ticket para comenzar a gestionar incidencias'
                                        }
                                    </p>
                                    <Button size="sm" onClick={() => handleCreateTicket()}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Crear Ticket
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredTickets.map(ticket => (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        compact
                                        onClick={() => {
                                            // TODO: Abrir detalle del ticket
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Resumen por estado (solo desktop) */}
                {viewMode === 'todos' && filteredTickets.length > 0 && (
                    <div className="mt-6 sm:mt-8 hidden sm:block">
                        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            Resumen por Estado
                        </h3>
                        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                            {(['abierto', 'en_cotizacion', 'cotizado', 'orden_compra', 'en_reparacion'] as TicketStatus[]).map(status => {
                                const count = ticketsByStatus[status].length;
                                const config = TICKET_STATUS_CONFIG[status];
                                return (
                                    <Card
                                        key={status}
                                        className={cn(
                                            "cursor-pointer hover:shadow-md transition-all",
                                            count > 0 && config.bgColor
                                        )}
                                        onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
                                    >
                                        <CardContent className="p-2 sm:p-3">
                                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                                <span className={cn("text-[10px] sm:text-xs font-medium truncate", config.color)}>
                                                    {config.label}
                                                </span>
                                                <span className="text-lg sm:text-xl font-bold">{count}</span>
                                            </div>
                                            {count > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    {ticketsByStatus[status].filter(t => t.prioridad === 'critica').length > 0 && (
                                                        <Badge variant="destructive" className="text-[9px] sm:text-[10px] h-3.5 sm:h-4 px-1">
                                                            {ticketsByStatus[status].filter(t => t.prioridad === 'critica').length} críticos
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal crear ticket */}
            <CreateTicketForm
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                equipoId={selectedEquipoForCreate?.id}
                ficha={selectedEquipoForCreate?.ficha}
                equipoNombre={selectedEquipoForCreate?.nombre}
                onSuccess={() => {
                    loadTickets();
                    setSelectedEquipoForCreate(null);
                }}
            />
        </div>
    );
}
