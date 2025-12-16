// =====================================================
// TIPOS PARA SISTEMA DE TICKETS DE EQUIPOS
// =====================================================

export type TicketStatus =
    | 'abierto'
    | 'en_cotizacion'
    | 'cotizado'
    | 'orden_compra'
    | 'pieza_en_camino'
    | 'pieza_recibida'
    | 'en_reparacion'
    | 'cerrado'
    | 'cancelado';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';

export type TicketProblemType = 'averia' | 'falta_pieza' | 'preventivo' | 'correctivo' | 'otro';

export type AttachmentType = 'foto_problema' | 'cotizacion' | 'orden_compra' | 'factura' | 'otro';

export type TicketHistoryAction = 'created' | 'status_change' | 'comment' | 'attachment_added' | 'assigned' | 'updated';

// Ticket principal
export interface EquipmentTicket {
    id: string;
    equipo_id: number;
    ficha: string;

    // Información del problema
    titulo: string;
    descripcion: string;
    tipo_problema: TicketProblemType;
    prioridad: TicketPriority;

    // Pieza relacionada
    pieza_solicitada: string | null;
    numero_parte: string | null;
    cantidad_requerida: number;

    // Estado
    status: TicketStatus;

    // Cotización
    cotizacion_monto: number | null;
    cotizacion_proveedor: string | null;
    cotizacion_fecha: string | null;

    // Orden de compra
    orden_compra_numero: string | null;
    orden_compra_fecha: string | null;

    // Fechas importantes
    fecha_recepcion_pieza: string | null;
    fecha_inicio_reparacion: string | null;
    fecha_cierre: string | null;

    // Responsables
    created_by: string;
    assigned_to: string | null;

    // Metadatos
    created_at: string;
    updated_at: string;

    // Notas
    resolucion: string | null;
    notas_admin: string | null;
}

// Ticket con datos del equipo (para vistas)
export interface EquipmentTicketWithEquipo extends EquipmentTicket {
    equipo?: {
        id: number;
        ficha: string;
        nombre: string;
        marca: string;
        modelo: string;
        categoria: string;
    };
}

// Adjunto de ticket
export interface TicketAttachment {
    id: string;
    ticket_id: string;
    file_name: string;
    file_type: AttachmentType;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    uploaded_by: string;
    created_at: string;
}

// Historial de ticket
export interface TicketHistoryEntry {
    id: number;
    ticket_id: string;
    action: TicketHistoryAction;
    status_from: TicketStatus | null;
    status_to: TicketStatus | null;
    comment: string | null;
    performed_by: string;
    created_at: string;
}

// Para crear un nuevo ticket
export interface CreateTicketData {
    equipo_id: number;
    ficha: string;
    titulo: string;
    descripcion: string;
    tipo_problema: TicketProblemType;
    prioridad?: TicketPriority;
    pieza_solicitada?: string;
    numero_parte?: string;
    cantidad_requerida?: number;
}

// Para actualizar un ticket
export interface UpdateTicketData {
    titulo?: string;
    descripcion?: string;
    tipo_problema?: TicketProblemType;
    prioridad?: TicketPriority;
    status?: TicketStatus;
    pieza_solicitada?: string;
    numero_parte?: string;
    cantidad_requerida?: number;
    cotizacion_monto?: number;
    cotizacion_proveedor?: string;
    cotizacion_fecha?: string;
    orden_compra_numero?: string;
    orden_compra_fecha?: string;
    fecha_recepcion_pieza?: string;
    fecha_inicio_reparacion?: string;
    fecha_cierre?: string;
    assigned_to?: string;
    resolucion?: string;
    notas_admin?: string;
}

// Constantes de estados con labels y colores
export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    abierto: { label: 'Abierto', color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: 'AlertCircle' },
    en_cotizacion: { label: 'En Cotización', color: 'text-purple-600', bgColor: 'bg-purple-500/10', icon: 'FileSearch' },
    cotizado: { label: 'Cotizado', color: 'text-indigo-600', bgColor: 'bg-indigo-500/10', icon: 'FileCheck' },
    orden_compra: { label: 'Orden de Compra', color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: 'ShoppingCart' },
    pieza_en_camino: { label: 'Pieza en Camino', color: 'text-orange-600', bgColor: 'bg-orange-500/10', icon: 'Truck' },
    pieza_recibida: { label: 'Pieza Recibida', color: 'text-teal-600', bgColor: 'bg-teal-500/10', icon: 'Package' },
    en_reparacion: { label: 'En Reparación', color: 'text-cyan-600', bgColor: 'bg-cyan-500/10', icon: 'Wrench' },
    cerrado: { label: 'Cerrado', color: 'text-green-600', bgColor: 'bg-green-500/10', icon: 'CheckCircle' },
    cancelado: { label: 'Cancelado', color: 'text-red-600', bgColor: 'bg-red-500/10', icon: 'XCircle' },
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
    baja: { label: 'Baja', color: 'text-slate-600', bgColor: 'bg-slate-500/10' },
    media: { label: 'Media', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    alta: { label: 'Alta', color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
    critica: { label: 'Crítica', color: 'text-red-600', bgColor: 'bg-red-500/10' },
};

export const TICKET_PROBLEM_TYPE_CONFIG: Record<TicketProblemType, { label: string; icon: string }> = {
    averia: { label: 'Avería', icon: 'AlertTriangle' },
    falta_pieza: { label: 'Falta de Pieza', icon: 'Package' },
    preventivo: { label: 'Preventivo', icon: 'Calendar' },
    correctivo: { label: 'Correctivo', icon: 'Wrench' },
    otro: { label: 'Otro', icon: 'HelpCircle' },
};

// Transiciones de estado permitidas
export const ALLOWED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    abierto: ['en_cotizacion', 'en_reparacion', 'cerrado', 'cancelado'],
    en_cotizacion: ['cotizado', 'cerrado', 'cancelado'],
    cotizado: ['orden_compra', 'cerrado', 'cancelado'],
    orden_compra: ['pieza_en_camino', 'cancelado'],
    pieza_en_camino: ['pieza_recibida', 'cancelado'],
    pieza_recibida: ['en_reparacion'],
    en_reparacion: ['cerrado'],
    cerrado: [],
    cancelado: [],
};
