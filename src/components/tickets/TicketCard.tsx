import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Truck, Clock, User } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge, TicketTypeBadge } from './TicketStatusBadge';
import type { EquipmentTicketWithEquipo } from '@/types/tickets';

interface TicketCardProps {
    ticket: EquipmentTicketWithEquipo;
    onClick?: () => void;
    compact?: boolean;
}

export function TicketCard({ ticket, onClick, compact = false }: TicketCardProps) {
    const isPriorityCritical = ticket.prioridad === 'critica';
    const isOpen = ticket.status === 'abierto';

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
                isPriorityCritical && isOpen && 'border-red-500/50 bg-red-50/30 dark:bg-red-950/10',
                onClick && 'cursor-pointer'
            )}
            onClick={onClick}
        >
            <CardContent className={cn('p-4', compact && 'p-3')}>
                <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className={cn(
                                'font-semibold text-foreground truncate',
                                compact ? 'text-sm' : 'text-base'
                            )}>
                                {ticket.titulo}
                            </h3>
                            {ticket.equipo && (
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                                    <Truck className="h-3.5 w-3.5" />
                                    <span className="font-medium">{ticket.ficha}</span>
                                    <span className="truncate">- {ticket.equipo.nombre}</span>
                                </div>
                            )}
                        </div>
                        <TicketStatusBadge status={ticket.status} size={compact ? 'sm' : 'md'} />
                    </div>

                    {/* Descripción (solo si no es compact) */}
                    {!compact && ticket.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.descripcion}
                        </p>
                    )}

                    {/* Pieza solicitada */}
                    {ticket.pieza_solicitada && (
                        <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                                Pieza: {ticket.pieza_solicitada}
                                {ticket.numero_parte && ` (${ticket.numero_parte})`}
                            </Badge>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority={ticket.prioridad} size="sm" />
                            <TicketTypeBadge type={ticket.tipo_problema} size="sm" />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {ticket.created_by.split('@')[0]}
                            </span>
                        </div>
                    </div>

                    {/* Info adicional de cotización/OC */}
                    {(ticket.cotizacion_monto || ticket.orden_compra_numero) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                            {ticket.cotizacion_monto && (
                                <span>💰 ${ticket.cotizacion_monto.toLocaleString()}</span>
                            )}
                            {ticket.orden_compra_numero && (
                                <span>📋 OC: {ticket.orden_compra_numero}</span>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Versión mínima para listas
export function TicketCardMini({ ticket, onClick }: TicketCardProps) {
    return (
        <div
            className={cn(
                'flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer',
                ticket.prioridad === 'critica' && ticket.status === 'abierto' && 'border-red-500/50'
            )}
            onClick={onClick}
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ticket.titulo}</p>
                <p className="text-xs text-muted-foreground">
                    {ticket.ficha} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
                </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
                <TicketPriorityBadge priority={ticket.prioridad} size="sm" />
                <TicketStatusBadge status={ticket.status} size="sm" showIcon={false} />
            </div>
        </div>
    );
}
