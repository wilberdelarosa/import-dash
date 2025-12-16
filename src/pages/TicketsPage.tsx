import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Ticket,
    Plus,
    Search,
    Filter,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    BarChart3,
    RefreshCw,
    ChevronRight
} from 'lucide-react';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { TicketCard } from '@/components/tickets';
import { CreateTicketForm } from '@/components/tickets';
import { TicketDetailDialog } from '@/components/tickets/TicketDetailDialog';
import type { TicketStatus, TicketPriority, TicketProblemType, EquipmentTicketWithEquipo } from '@/types/tickets';
import { TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG, TICKET_PROBLEM_TYPE_CONFIG } from '@/types/tickets';
import { useSupabaseData } from '@/hooks/useSupabaseData';

export default function TicketsPage() {
    const navigate = useNavigate();
    const { tickets, loading, stats, loadTickets } = useEquipmentTickets();
    const { data } = useSupabaseData();
    const equipos = data.equipos || [];
    
    // Filtros
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('todos');
    
    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<EquipmentTicketWithEquipo | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    
    // Filtrado de tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // Filtro de búsqueda
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                    ticket.titulo.toLowerCase().includes(query) ||
                    ticket.descripcion.toLowerCase().includes(query) ||
                    ticket.ficha.toLowerCase().includes(query) ||
                    ticket.equipo?.nombre.toLowerCase().includes(query) ||
                    ticket.pieza_solicitada?.toLowerCase().includes(query) ||
                    ticket.numero_parte?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }
            
            // Filtro de estado
            if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
            
            // Filtro de prioridad
            if (priorityFilter !== 'all' && ticket.prioridad !== priorityFilter) return false;
            
            // Filtro de tipo
            if (typeFilter !== 'all' && ticket.tipo_problema !== typeFilter) return false;
            
            // Filtro de tab
            if (activeTab === 'abiertos' && ticket.status !== 'abierto') return false;
            if (activeTab === 'en_proceso' && ['abierto', 'cerrado', 'cancelado'].includes(ticket.status)) return false;
            if (activeTab === 'cerrados' && ticket.status !== 'cerrado') return false;
            if (activeTab === 'criticos' && (ticket.prioridad !== 'critica' || ticket.status === 'cerrado')) return false;
            
            return true;
        });
    }, [tickets, searchQuery, statusFilter, priorityFilter, typeFilter, activeTab]);
    
    const handleTicketClick = (ticket: EquipmentTicketWithEquipo) => {
        setSelectedTicket(ticket);
        setDetailDialogOpen(true);
    };
    
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setTypeFilter('all');
    };
    
    const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Ticket className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Tickets de Equipos</h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestión de incidencias, averías y solicitudes de piezas
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => loadTickets()}>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Actualizar
                            </Button>
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Nuevo Ticket
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container max-w-7xl mx-auto px-4 py-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Abiertos</p>
                                    <p className="text-2xl font-bold">{stats.abiertos}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-blue-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">En Proceso</p>
                                    <p className="text-2xl font-bold">{stats.enProceso}</p>
                                </div>
                                <Clock className="h-8 w-8 text-amber-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Cerrados</p>
                                    <p className="text-2xl font-bold">{stats.cerrados}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Críticos</p>
                                    <p className="text-2xl font-bold">{stats.criticos}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-slate-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-slate-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros y Búsqueda */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Búsqueda */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por título, equipo, pieza..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            
                            {/* Filtros */}
                            <div className="flex flex-wrap gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
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
                                
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="w-[130px]">
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
                                
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {Object.entries(TICKET_PROBLEM_TYPE_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs y Lista */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-muted/50">
                        <TabsTrigger value="todos" className="gap-2">
                            Todos
                            <Badge variant="secondary" className="text-xs">{tickets.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="abiertos" className="gap-2">
                            Abiertos
                            <Badge variant="secondary" className="text-xs">{stats.abiertos}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="en_proceso" className="gap-2">
                            En Proceso
                            <Badge variant="secondary" className="text-xs">{stats.enProceso}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="cerrados" className="gap-2">
                            Cerrados
                            <Badge variant="secondary" className="text-xs">{stats.cerrados}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="criticos" className="gap-2 text-red-600">
                            Críticos
                            {stats.criticos > 0 && (
                                <Badge variant="destructive" className="text-xs">{stats.criticos}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Ticket className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-medium text-muted-foreground">
                                        No hay tickets
                                    </h3>
                                    <p className="text-sm text-muted-foreground/70">
                                        {hasActiveFilters 
                                            ? 'No se encontraron tickets con los filtros aplicados'
                                            : 'Aún no se han creado tickets'
                                        }
                                    </p>
                                    {!hasActiveFilters && (
                                        <Button 
                                            variant="outline" 
                                            className="mt-4"
                                            onClick={() => setCreateDialogOpen(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Crear primer ticket
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTickets.map(ticket => (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        onClick={() => handleTicketClick(ticket)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dialogs */}
            <CreateTicketForm
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                equipoId={equipos[0]?.id}
                ficha={equipos[0]?.ficha}
                equipoNombre={equipos[0]?.nombre}
                onSuccess={() => loadTickets()}
            />
            
            {selectedTicket && (
                <TicketDetailDialog
                    open={detailDialogOpen}
                    onOpenChange={setDetailDialogOpen}
                    ticket={selectedTicket}
                    onUpdate={() => {
                        loadTickets();
                        setSelectedTicket(null);
                    }}
                />
            )}
        </div>
    );
}
