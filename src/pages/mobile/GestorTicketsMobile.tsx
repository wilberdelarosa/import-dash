import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Search,
    Plus,
    Ticket,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    ListFilter,
    RefreshCw,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets/TicketStatusBadge';
import { CreateTicketForm } from '@/components/tickets/CreateTicketForm';
import type { TicketStatus, TicketPriority, EquipmentTicketWithEquipo } from '@/types/tickets';
import { TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG } from '@/types/tickets';

type FilterMode = 'todos' | 'abiertos' | 'proceso' | 'cerrados' | 'criticos';

export function GestorTicketsMobile() {
    const { tickets, loading, stats, loadTickets } = useEquipmentTickets();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<FilterMode>('todos');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filtrar tickets
    const filteredTickets = useMemo(() => {
        let result = [...tickets];

        // Filtro por modo
        if (filterMode === 'abiertos') {
            result = result.filter(t => t.status === 'abierto');
        } else if (filterMode === 'proceso') {
            result = result.filter(t => !['abierto', 'cerrado', 'cancelado'].includes(t.status));
        } else if (filterMode === 'cerrados') {
            result = result.filter(t => ['cerrado', 'cancelado'].includes(t.status));
        } else if (filterMode === 'criticos') {
            result = result.filter(t => t.prioridad === 'critica');
        }

        // Búsqueda
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.titulo.toLowerCase().includes(query) ||
                t.descripcion.toLowerCase().includes(query) ||
                t.ficha.toLowerCase().includes(query) ||
                t.equipo?.nombre?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [tickets, filterMode, searchTerm]);

    const formatTimeAgo = (date: string) => {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
    };

    return (
        <MobileLayout
            title="Tickets"
            headerActions={
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-primary/10"
                        onClick={() => loadTickets()}
                    >
                        <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
                    </Button>
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10">
                                <ListFilter className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-auto max-h-[85svh] overflow-y-auto pb-safe rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
                            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
                            <SheetHeader className="mt-4">
                                <SheetTitle className="text-center text-xl font-bold">Filtrar tickets</SheetTitle>
                                <SheetDescription className="text-center">Muestra por estado o prioridad</SheetDescription>
                            </SheetHeader>
                            <div className="mt-8 space-y-3 px-4 pb-6">
                                <Button
                                    variant={filterMode === 'todos' ? 'default' : 'outline'}
                                    className={cn(
                                        "w-full justify-start gap-3 h-14 text-base rounded-xl transition-all",
                                        filterMode === 'todos' && "bg-primary shadow-lg shadow-primary/25"
                                    )}
                                    onClick={() => {
                                        setFilterMode('todos');
                                        setFiltersOpen(false);
                                    }}
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/20">
                                        <Ticket className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-1 items-center justify-between">
                                        <span>Todos los tickets</span>
                                        <Badge variant="secondary" className="bg-background/20 text-foreground">{stats.total}</Badge>
                                    </div>
                                </Button>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant={filterMode === 'abiertos' ? 'default' : 'outline'}
                                        className={cn("w-full justify-start gap-2 h-12 rounded-xl", filterMode === 'abiertos' && "bg-blue-600 hover:bg-blue-700 border-blue-600")}
                                        onClick={() => {
                                            setFilterMode('abiertos');
                                            setFiltersOpen(false);
                                        }}
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        Abiertos ({stats.abiertos})
                                    </Button>
                                    <Button
                                        variant={filterMode === 'proceso' ? 'default' : 'outline'}
                                        className={cn("w-full justify-start gap-2 h-12 rounded-xl", filterMode === 'proceso' && "bg-amber-600 hover:bg-amber-700 border-amber-600")}
                                        onClick={() => {
                                            setFilterMode('proceso');
                                            setFiltersOpen(false);
                                        }}
                                    >
                                        <Clock className="h-4 w-4" />
                                        En Proceso ({stats.enProceso})
                                    </Button>
                                    <Button
                                        variant={filterMode === 'cerrados' ? 'default' : 'outline'}
                                        className={cn("w-full justify-start gap-2 h-12 rounded-xl", filterMode === 'cerrados' && "bg-green-600 hover:bg-green-700 border-green-600")}
                                        onClick={() => {
                                            setFilterMode('cerrados');
                                            setFiltersOpen(false);
                                        }}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Cerrados ({stats.cerrados})
                                    </Button>
                                    <Button
                                        variant={filterMode === 'criticos' ? 'default' : 'outline'}
                                        className={cn("w-full justify-start gap-2 h-12 rounded-xl", filterMode === 'criticos' && "bg-red-600 hover:bg-red-700 border-red-600")}
                                        onClick={() => {
                                            setFilterMode('criticos');
                                            setFiltersOpen(false);
                                        }}
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        Críticos ({stats.criticos})
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            }
        >
            <div className="space-y-4 pb-20">
                {/* Stats rápidos */}
                <div className="grid grid-cols-4 gap-2">
                    <div
                        className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer",
                            filterMode === 'abiertos' ? "bg-blue-500/20 border-blue-500/50" : "bg-blue-500/5 border-blue-500/20"
                        )}
                        onClick={() => setFilterMode(filterMode === 'abiertos' ? 'todos' : 'abiertos')}
                    >
                        <AlertTriangle className="h-4 w-4 text-blue-500 mb-1" />
                        <span className="text-lg font-bold text-blue-600">{stats.abiertos}</span>
                        <span className="text-[9px] text-muted-foreground">Abiertos</span>
                    </div>
                    <div
                        className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer",
                            filterMode === 'proceso' ? "bg-amber-500/20 border-amber-500/50" : "bg-amber-500/5 border-amber-500/20"
                        )}
                        onClick={() => setFilterMode(filterMode === 'proceso' ? 'todos' : 'proceso')}
                    >
                        <Clock className="h-4 w-4 text-amber-500 mb-1" />
                        <span className="text-lg font-bold text-amber-600">{stats.enProceso}</span>
                        <span className="text-[9px] text-muted-foreground">Proceso</span>
                    </div>
                    <div
                        className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer",
                            filterMode === 'cerrados' ? "bg-green-500/20 border-green-500/50" : "bg-green-500/5 border-green-500/20"
                        )}
                        onClick={() => setFilterMode(filterMode === 'cerrados' ? 'todos' : 'cerrados')}
                    >
                        <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
                        <span className="text-lg font-bold text-green-600">{stats.cerrados}</span>
                        <span className="text-[9px] text-muted-foreground">Cerrados</span>
                    </div>
                    <div
                        className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer",
                            filterMode === 'criticos' ? "bg-red-500/20 border-red-500/50" : "bg-red-500/5 border-red-500/20"
                        )}
                        onClick={() => setFilterMode(filterMode === 'criticos' ? 'todos' : 'criticos')}
                    >
                        <AlertTriangle className="h-4 w-4 text-red-500 mb-1" />
                        <span className="text-lg font-bold text-red-600">{stats.criticos}</span>
                        <span className="text-[9px] text-muted-foreground">Críticos</span>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-xl border-b border-border/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar ticket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 h-10 rounded-xl text-sm"
                        />
                    </div>

                    {/* Chips de filtro */}
                    <div className="flex gap-2 overflow-x-auto pb-1 mt-2 no-scrollbar">
                        {(['todos', 'abiertos', 'proceso', 'cerrados'] as FilterMode[]).map(mode => (
                            <Badge
                                key={mode}
                                variant={filterMode === mode ? 'default' : 'outline'}
                                className={cn(
                                    "cursor-pointer px-3 py-1 rounded-full transition-all whitespace-nowrap text-xs",
                                    filterMode === mode ? "bg-primary shadow-lg shadow-primary/25 border-0" : "hover:bg-accent"
                                )}
                                onClick={() => setFilterMode(mode)}
                            >
                                {mode === 'todos' ? 'Todos' : mode === 'abiertos' ? 'Abiertos' : mode === 'proceso' ? 'En Proceso' : 'Cerrados'}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Lista de tickets */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredTickets.length > 0 ? (
                    <div className="space-y-3">
                        {filteredTickets.map((ticket, index) => (
                            <MobileCard
                                key={ticket.id}
                                className={cn(
                                    'animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards p-3',
                                    ticket.prioridad === 'critica' && 'border-red-500/30 bg-red-500/5'
                                )}
                                style={{ animationDelay: `${index * 0.03}s` } as React.CSSProperties}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Indicador de prioridad */}
                                    <div className={cn(
                                        "w-1 self-stretch rounded-full shrink-0",
                                        ticket.prioridad === 'critica' ? 'bg-red-500' :
                                            ticket.prioridad === 'alta' ? 'bg-amber-500' :
                                                ticket.prioridad === 'media' ? 'bg-blue-500' : 'bg-slate-400'
                                    )} />

                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold line-clamp-2 leading-tight">
                                                    {ticket.titulo}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
                                                        {ticket.ficha}
                                                    </Badge>
                                                    {ticket.equipo?.nombre && (
                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                            {ticket.equipo.nombre}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </div>

                                        {/* Badges de estado */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <TicketStatusBadge status={ticket.status} size="sm" />
                                            <TicketPriorityBadge priority={ticket.prioridad} size="sm" />
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span>{formatTimeAgo(ticket.created_at)}</span>
                                            {ticket.pieza_solicitada && (
                                                <span className="truncate max-w-[120px]">
                                                    🔧 {ticket.pieza_solicitada}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </MobileCard>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Ticket className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-base font-semibold text-muted-foreground">
                            {searchTerm || filterMode !== 'todos' ? 'No hay resultados' : 'No hay tickets'}
                        </h3>
                        <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                            {searchTerm || filterMode !== 'todos'
                                ? 'Intenta con otros filtros'
                                : 'Crea tu primer ticket'}
                        </p>
                        {searchTerm && (
                            <Button variant="link" size="sm" onClick={() => setSearchTerm('')} className="mt-2 text-xs">
                                Limpiar búsqueda
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* FAB */}
            <Button
                size="lg"
                className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 z-50"
                onClick={() => setShowCreateModal(true)}
            >
                <Plus className="h-7 w-7 text-primary-foreground" />
            </Button>

            {/* Modal crear ticket */}
            <CreateTicketForm
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={() => {
                    loadTickets();
                }}
            />
        </MobileLayout>
    );
}
