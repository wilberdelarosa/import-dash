import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { AlertTriangle, Plus, Loader2, Ticket } from 'lucide-react';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { TicketCard, TicketCardMini } from './TicketCard';
import { CreateTicketForm } from './CreateTicketForm';
import type { TicketStatus } from '@/types/tickets';

interface EquipmentTicketsListProps {
    equipoId: number;
    ficha: string;
    equipoNombre: string;
    compact?: boolean;
}

type FilterStatus = 'all' | 'activos' | 'cerrados';

export function EquipmentTicketsList({
    equipoId,
    ficha,
    equipoNombre,
    compact = false
}: EquipmentTicketsListProps) {
    const { tickets, loading, stats } = useEquipmentTickets(equipoId);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('activos');
    const [showCreateForm, setShowCreateForm] = useState(false);

    const filteredTickets = tickets.filter(ticket => {
        if (filterStatus === 'activos') {
            return !['cerrado', 'cancelado'].includes(ticket.status);
        }
        if (filterStatus === 'cerrados') {
            return ['cerrado', 'cancelado'].includes(ticket.status);
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con stats y acciones */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-primary" />
                        Tickets
                    </h3>
                    <div className="flex items-center gap-2">
                        {stats.abiertos > 0 && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                {stats.abiertos} abiertos
                            </Badge>
                        )}
                        {stats.enProceso > 0 && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                {stats.enProceso} en proceso
                            </Badge>
                        )}
                        {stats.criticos > 0 && (
                            <Badge variant="destructive">
                                {stats.criticos} críticos
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="activos">Activos</SelectItem>
                            <SelectItem value="cerrados">Cerrados</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Nuevo
                    </Button>
                </div>
            </div>

            {/* Lista de tickets */}
            {filteredTickets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">
                            {filterStatus === 'activos'
                                ? 'No hay tickets activos para este equipo'
                                : 'No hay tickets registrados'}
                        </p>
                        <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Reportar un problema
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredTickets.map(ticket => (
                        compact ? (
                            <TicketCardMini key={ticket.id} ticket={ticket} />
                        ) : (
                            <TicketCard key={ticket.id} ticket={ticket} compact />
                        )
                    ))}
                </div>
            )}

            {/* Modal de creación */}
            <CreateTicketForm
                open={showCreateForm}
                onOpenChange={setShowCreateForm}
                equipoId={equipoId}
                ficha={ficha}
                equipoNombre={equipoNombre}
            />
        </div>
    );
}

// Badge contador para usar en tabs
export function TicketCountBadge({ equipoId }: { equipoId: number }) {
    const { stats } = useEquipmentTickets(equipoId);
    const activeCount = stats.abiertos + stats.enProceso;

    if (activeCount === 0) return null;

    return (
        <Badge
            variant={stats.criticos > 0 ? 'destructive' : 'secondary'}
            className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px]"
        >
            {activeCount}
        </Badge>
    );
}
