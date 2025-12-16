import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    Plus,
    ArrowRight,
    MessageSquare,
    Paperclip,
    UserPlus,
    Edit,
    Loader2
} from 'lucide-react';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { TicketStatusBadge } from './TicketStatusBadge';
import type { TicketHistoryEntry, TicketHistoryAction, TicketStatus } from '@/types/tickets';

const ActionIcons: Record<TicketHistoryAction, React.ComponentType<{ className?: string }>> = {
    created: Plus,
    status_change: ArrowRight,
    comment: MessageSquare,
    attachment_added: Paperclip,
    assigned: UserPlus,
    updated: Edit,
};

const ActionLabels: Record<TicketHistoryAction, string> = {
    created: 'Ticket creado',
    status_change: 'Cambio de estado',
    comment: 'Comentario',
    attachment_added: 'Archivo adjuntado',
    assigned: 'Asignación',
    updated: 'Actualización',
};

interface TicketTimelineProps {
    ticketId: string;
}

export function TicketTimeline({ ticketId }: TicketTimelineProps) {
    const { getTicketHistory } = useEquipmentTickets();
    const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getTicketHistory(ticketId);
            setHistory(data);
            setLoading(false);
        }
        load();
    }, [ticketId, getTicketHistory]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No hay historial disponible
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {history.map((entry, index) => {
                const Icon = ActionIcons[entry.action];
                const isLast = index === history.length - 1;

                return (
                    <div key={entry.id} className="flex gap-3">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center',
                                entry.action === 'created' ? 'bg-primary/10 text-primary' :
                                    entry.action === 'status_change' ? 'bg-blue-500/10 text-blue-500' :
                                        entry.action === 'comment' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-muted text-muted-foreground'
                            )}>
                                <Icon className="h-4 w-4" />
                            </div>
                            {!isLast && (
                                <div className="w-0.5 flex-1 bg-border mt-2" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{ActionLabels[entry.action]}</span>

                                {/* Status change badges */}
                                {entry.action === 'status_change' && entry.status_from && entry.status_to && (
                                    <div className="flex items-center gap-1.5">
                                        <TicketStatusBadge status={entry.status_from as TicketStatus} size="sm" showIcon={false} />
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        <TicketStatusBadge status={entry.status_to as TicketStatus} size="sm" showIcon={false} />
                                    </div>
                                )}
                            </div>

                            {/* Comment/Description */}
                            {entry.comment && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {entry.comment}
                                </p>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span className="font-medium">{entry.performed_by.split('@')[0]}</span>
                                <span>•</span>
                                <span title={format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: es })}>
                                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
