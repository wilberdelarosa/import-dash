import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Truck,
    Calendar,
    User,
    MessageSquare,
    Paperclip,
    Clock,
    ChevronRight,
    Send,
    Loader2,
    DollarSign,
    FileText,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { useTicketAttachments } from '@/hooks/useTicketAttachments';
import { useUserRoles } from '@/hooks/useUserRoles';
import { TicketStatusBadge, TicketPriorityBadge, TicketTypeBadge } from './TicketStatusBadge';
import { TicketTimeline } from './TicketTimeline';
import type {
    EquipmentTicketWithEquipo,
    TicketStatus,
    UpdateTicketData,
    TicketHistoryEntry
} from '@/types/tickets';
import { TICKET_STATUS_CONFIG, ALLOWED_STATUS_TRANSITIONS } from '@/types/tickets';

interface TicketDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: EquipmentTicketWithEquipo;
    onUpdate?: () => void;
}

export function TicketDetailDialog({
    open,
    onOpenChange,
    ticket,
    onUpdate
}: TicketDetailDialogProps) {
    const { updateTicket, changeStatus, addComment, getTicketHistory, deleteTicket } = useEquipmentTickets();
    const { attachments, loadAttachments, getDownloadUrl } = useTicketAttachments(ticket.id);
    const { isAdmin, isSupervisor } = useUserRoles();
    
    const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    
    // Form para cotización/OC
    const [cotizacionMonto, setCotizacionMonto] = useState('');
    const [cotizacionProveedor, setCotizacionProveedor] = useState('');
    const [ordenCompraNumero, setOrdenCompraNumero] = useState('');

    useEffect(() => {
        if (open && ticket.id) {
            loadHistory();
            loadAttachments(ticket.id);
            // Pre-fill form values
            setCotizacionMonto(ticket.cotizacion_monto?.toString() || '');
            setCotizacionProveedor(ticket.cotizacion_proveedor || '');
            setOrdenCompraNumero(ticket.orden_compra_numero || '');
        }
    }, [open, ticket.id]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getTicketHistory(ticket.id);
        setHistory(data);
        setLoading(false);
    };

    const handleStatusChange = async (newStatus: TicketStatus) => {
        const success = await changeStatus(ticket.id, newStatus);
        if (success) {
            loadHistory();
            onUpdate?.();
        }
    };

    const handleSendComment = async () => {
        if (!comment.trim()) return;
        setSendingComment(true);
        const success = await addComment(ticket.id, comment.trim());
        if (success) {
            setComment('');
            loadHistory();
        }
        setSendingComment(false);
    };

    const handleUpdateCotizacion = async () => {
        const updateData: UpdateTicketData = {
            cotizacion_monto: cotizacionMonto ? parseFloat(cotizacionMonto) : undefined,
            cotizacion_proveedor: cotizacionProveedor || undefined,
            cotizacion_fecha: new Date().toISOString().split('T')[0],
        };
        
        // Si tiene cotización y está en estado 'abierto' o 'en_cotizacion', cambiar a 'cotizado'
        if (cotizacionMonto && ['abierto', 'en_cotizacion'].includes(ticket.status)) {
            updateData.status = 'cotizado';
        }
        
        const success = await updateTicket(ticket.id, updateData, 'Cotización actualizada');
        if (success) {
            loadHistory();
            onUpdate?.();
        }
    };

    const handleUpdateOrdenCompra = async () => {
        const updateData: UpdateTicketData = {
            orden_compra_numero: ordenCompraNumero || undefined,
            orden_compra_fecha: new Date().toISOString().split('T')[0],
        };
        
        if (ordenCompraNumero && ticket.status === 'cotizado') {
            updateData.status = 'orden_compra';
        }
        
        const success = await updateTicket(ticket.id, updateData, `Orden de compra: ${ordenCompraNumero}`);
        if (success) {
            loadHistory();
            onUpdate?.();
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer.')) return;
        const success = await deleteTicket(ticket.id);
        if (success) {
            onOpenChange(false);
            onUpdate?.();
        }
    };

    const handleDownloadAttachment = async (filePath: string, fileName: string) => {
        const url = await getDownloadUrl(filePath);
        if (url) {
            window.open(url, '_blank');
        }
    };

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[ticket.status] || [];
    const canEdit = isAdmin || isSupervisor;
    const isClosed = ticket.status === 'cerrado' || ticket.status === 'cancelado';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <TicketStatusBadge status={ticket.status} />
                                <TicketPriorityBadge priority={ticket.prioridad} />
                                <TicketTypeBadge type={ticket.tipo_problema} />
                            </div>
                            <DialogTitle className="text-xl">{ticket.titulo}</DialogTitle>
                            <DialogDescription className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    <Badge variant="outline">{ticket.ficha}</Badge>
                                    {ticket.equipo?.nombre}
                                </span>
                            </DialogDescription>
                        </div>
                        {isAdmin && !isClosed && (
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
                    <Tabs defaultValue="detalles" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
                            <TabsTrigger value="detalles">Detalles</TabsTrigger>
                            <TabsTrigger value="historial">Historial ({history.length})</TabsTrigger>
                            <TabsTrigger value="adjuntos">Adjuntos ({attachments.length})</TabsTrigger>
                            {canEdit && <TabsTrigger value="gestion">Gestión</TabsTrigger>}
                        </TabsList>

                        <div className="px-6 py-4">
                            {/* Tab Detalles */}
                            <TabsContent value="detalles" className="mt-0 space-y-6">
                                {/* Descripción */}
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Descripción</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                                        {ticket.descripcion}
                                    </p>
                                </div>

                                {/* Pieza solicitada */}
                                {ticket.pieza_solicitada && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Pieza Solicitada</h4>
                                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                                            <p className="text-sm font-medium">{ticket.pieza_solicitada}</p>
                                            {ticket.numero_parte && (
                                                <p className="text-sm text-muted-foreground">N° Parte: {ticket.numero_parte}</p>
                                            )}
                                            <p className="text-sm text-muted-foreground">Cantidad: {ticket.cantidad_requerida}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Info de cotización/OC */}
                                <div className="grid grid-cols-2 gap-4">
                                    {ticket.cotizacion_monto && (
                                        <div className="bg-green-500/10 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-green-600 mb-1">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="text-sm font-medium">Cotización</span>
                                            </div>
                                            <p className="text-lg font-bold">${ticket.cotizacion_monto.toLocaleString()}</p>
                                            {ticket.cotizacion_proveedor && (
                                                <p className="text-xs text-muted-foreground">{ticket.cotizacion_proveedor}</p>
                                            )}
                                        </div>
                                    )}
                                    {ticket.orden_compra_numero && (
                                        <div className="bg-blue-500/10 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                                <FileText className="h-4 w-4" />
                                                <span className="text-sm font-medium">Orden de Compra</span>
                                            </div>
                                            <p className="text-lg font-bold">{ticket.orden_compra_numero}</p>
                                            {ticket.orden_compra_fecha && (
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(ticket.orden_compra_fecha), 'dd MMM yyyy', { locale: es })}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Metadatos */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Creado:</span>
                                        <span>{format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: es })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Por:</span>
                                        <span>{ticket.created_by}</span>
                                    </div>
                                    {ticket.assigned_to && (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Asignado a:</span>
                                            <span>{ticket.assigned_to}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Cambiar estado */}
                                {!isClosed && allowedTransitions.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Cambiar Estado</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {allowedTransitions.map(status => (
                                                <Button
                                                    key={status}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(status)}
                                                    className="gap-1"
                                                >
                                                    <ChevronRight className="h-3 w-3" />
                                                    {TICKET_STATUS_CONFIG[status].label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Resolución */}
                                {ticket.resolucion && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Resolución</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-green-500/10 rounded-lg p-3">
                                            {ticket.resolucion}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab Historial */}
                            <TabsContent value="historial" className="mt-0">
                                <TicketTimeline ticketId={ticket.id} />
                                
                                {/* Agregar comentario */}
                                {!isClosed && (
                                    <div className="mt-4 pt-4 border-t">
                                        <Label className="text-sm font-medium">Agregar comentario</Label>
                                        <div className="flex gap-2 mt-2">
                                            <Textarea
                                                placeholder="Escribe un comentario..."
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                                rows={2}
                                                className="flex-1"
                                            />
                                            <Button 
                                                onClick={handleSendComment} 
                                                disabled={!comment.trim() || sendingComment}
                                                size="icon"
                                                className="self-end"
                                            >
                                                {sendingComment ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Send className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab Adjuntos */}
                            <TabsContent value="adjuntos" className="mt-0">
                                {attachments.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No hay archivos adjuntos</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {attachments.map(att => (
                                            <button
                                                key={att.id}
                                                onClick={() => handleDownloadAttachment(att.file_path, att.file_name)}
                                                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                    <Badge variant="secondary" className="text-xs">
                                                        {att.file_type}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium truncate">{att.file_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : ''}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab Gestión (admin/supervisor) */}
                            {canEdit && (
                                <TabsContent value="gestion" className="mt-0 space-y-6">
                                    {/* Cotización */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium">Cotización</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs">Monto ($)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={cotizacionMonto}
                                                    onChange={e => setCotizacionMonto(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Proveedor</Label>
                                                <Input
                                                    placeholder="Nombre del proveedor"
                                                    value={cotizacionProveedor}
                                                    onChange={e => setCotizacionProveedor(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={handleUpdateCotizacion}>
                                            Guardar Cotización
                                        </Button>
                                    </div>

                                    <Separator />

                                    {/* Orden de Compra */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium">Orden de Compra</h4>
                                        <div>
                                            <Label className="text-xs">Número de OC</Label>
                                            <Input
                                                placeholder="OC-001"
                                                value={ordenCompraNumero}
                                                onChange={e => setOrdenCompraNumero(e.target.value)}
                                            />
                                        </div>
                                        <Button size="sm" onClick={handleUpdateOrdenCompra}>
                                            Guardar Orden de Compra
                                        </Button>
                                    </div>
                                </TabsContent>
                            )}
                        </div>
                    </Tabs>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
