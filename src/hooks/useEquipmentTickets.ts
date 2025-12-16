import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type {
    EquipmentTicket,
    EquipmentTicketWithEquipo,
    CreateTicketData,
    UpdateTicketData,
    TicketStatus,
    TicketHistoryEntry
} from '@/types/tickets';

export function useEquipmentTickets(equipoId?: number) {
    const [tickets, setTickets] = useState<EquipmentTicketWithEquipo[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    // Cargar tickets
    const loadTickets = useCallback(async () => {
        try {
            setLoading(true);

            // @ts-ignore - table exists but types not regenerated yet
            let query = supabase
                .from('equipment_tickets')
                .select(`
          *,
          equipo:equipos(id, ficha, nombre, marca, modelo, categoria)
        `)
                .order('created_at', { ascending: false });

            if (equipoId) {
                query = query.eq('equipo_id', equipoId);
            }

            const { data, error } = await query;

            if (error) throw error;

            setTickets((data || []) as EquipmentTicketWithEquipo[]);
        } catch (error) {
            console.error('Error loading tickets:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los tickets',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [equipoId, toast]);

    // Crear ticket
    const createTicket = useCallback(async (data: CreateTicketData): Promise<string | null> => {
        if (!user?.email) {
            toast({
                title: 'Error',
                description: 'Debes iniciar sesión para crear un ticket',
                variant: 'destructive',
            });
            return null;
        }

        try {
            const ticketData = {
                ...data,
                created_by: user.email,
                status: 'abierto' as TicketStatus,
                prioridad: data.prioridad || 'media',
                cantidad_requerida: data.cantidad_requerida || 1,
            };

            // @ts-ignore - table exists but types not regenerated yet
            const { data: newTicket, error } = await supabase
                .from('equipment_tickets')
                .insert([ticketData])
                .select()
                .single();

            if (error) throw error;

            const ticketId = (newTicket as EquipmentTicket).id;

            // @ts-ignore - table exists but types not regenerated yet
            await supabase.from('ticket_history').insert([{
                ticket_id: ticketId,
                action: 'created',
                status_to: 'abierto',
                comment: `Ticket creado: ${data.titulo}`,
                performed_by: user.email,
            }]);

            toast({
                title: 'Ticket creado',
                description: 'El ticket se ha creado correctamente',
            });

            loadTickets();
            return ticketId;
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast({
                title: 'Error',
                description: 'No se pudo crear el ticket',
                variant: 'destructive',
            });
            return null;
        }
    }, [user, toast, loadTickets]);

    // Actualizar ticket
    const updateTicket = useCallback(async (
        ticketId: string,
        data: UpdateTicketData,
        comment?: string
    ): Promise<boolean> => {
        if (!user?.email) return false;

        try {
            // @ts-ignore - table exists but types not regenerated yet
            const { data: currentTicket } = await supabase
                .from('equipment_tickets')
                .select('status')
                .eq('id', ticketId)
                .single();

            // @ts-ignore - table exists but types not regenerated yet
            const { error } = await supabase
                .from('equipment_tickets')
                .update(data)
                .eq('id', ticketId);

            if (error) throw error;

            const currentStatus = (currentTicket as { status: string } | null)?.status;

            if (data.status && currentStatus && data.status !== currentStatus) {
                // @ts-ignore - table exists but types not regenerated yet
                await supabase.from('ticket_history').insert([{
                    ticket_id: ticketId,
                    action: 'status_change',
                    status_from: currentStatus,
                    status_to: data.status,
                    comment: comment || `Estado cambiado a ${data.status}`,
                    performed_by: user.email,
                }]);
            } else if (comment) {
                // @ts-ignore - table exists but types not regenerated yet
                await supabase.from('ticket_history').insert([{
                    ticket_id: ticketId,
                    action: 'updated',
                    comment,
                    performed_by: user.email,
                }]);
            }

            toast({
                title: 'Ticket actualizado',
                description: 'Los cambios se han guardado correctamente',
            });

            loadTickets();
            return true;
        } catch (error) {
            console.error('Error updating ticket:', error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el ticket',
                variant: 'destructive',
            });
            return false;
        }
    }, [user, toast, loadTickets]);

    // Cambiar estado del ticket
    const changeStatus = useCallback(async (
        ticketId: string,
        newStatus: TicketStatus,
        comment?: string
    ): Promise<boolean> => {
        const updateData: UpdateTicketData = { status: newStatus };

        if (newStatus === 'cerrado') {
            updateData.fecha_cierre = new Date().toISOString().split('T')[0];
        } else if (newStatus === 'en_reparacion') {
            updateData.fecha_inicio_reparacion = new Date().toISOString().split('T')[0];
        }

        return updateTicket(ticketId, updateData, comment);
    }, [updateTicket]);

    // Agregar comentario
    const addComment = useCallback(async (ticketId: string, comment: string): Promise<boolean> => {
        if (!user?.email || !comment.trim()) return false;

        try {
            // @ts-ignore - table exists but types not regenerated yet
            await supabase.from('ticket_history').insert([{
                ticket_id: ticketId,
                action: 'comment',
                comment,
                performed_by: user.email,
            }]);

            toast({
                title: 'Comentario agregado',
            });

            return true;
        } catch (error) {
            console.error('Error adding comment:', error);
            return false;
        }
    }, [user, toast]);

    // Obtener historial de un ticket
    const getTicketHistory = useCallback(async (ticketId: string): Promise<TicketHistoryEntry[]> => {
        try {
            // @ts-ignore - table exists but types not regenerated yet
            const { data, error } = await supabase
                .from('ticket_history')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as TicketHistoryEntry[];
        } catch (error) {
            console.error('Error loading ticket history:', error);
            return [];
        }
    }, []);

    // Obtener un ticket por ID
    const getTicketById = useCallback(async (ticketId: string): Promise<EquipmentTicketWithEquipo | null> => {
        try {
            // @ts-ignore - table exists but types not regenerated yet
            const { data, error } = await supabase
                .from('equipment_tickets')
                .select(`
          *,
          equipo:equipos(id, ficha, nombre, marca, modelo, categoria)
        `)
                .eq('id', ticketId)
                .single();

            if (error) throw error;
            return data as EquipmentTicketWithEquipo;
        } catch (error) {
            console.error('Error loading ticket:', error);
            return null;
        }
    }, []);

    // Eliminar ticket (solo admin)
    const deleteTicket = useCallback(async (ticketId: string): Promise<boolean> => {
        try {
            // @ts-ignore - table exists but types not regenerated yet
            const { error } = await supabase
                .from('equipment_tickets')
                .delete()
                .eq('id', ticketId);

            if (error) throw error;

            toast({
                title: 'Ticket eliminado',
            });

            loadTickets();
            return true;
        } catch (error) {
            console.error('Error deleting ticket:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el ticket',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, loadTickets]);

    // Cargar tickets al montar o cuando cambie equipoId
    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Suscribirse a cambios en tiempo real
    useEffect(() => {
        const channel = supabase
            .channel('equipment-tickets-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'equipment_tickets' },
                () => loadTickets()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadTickets]);

    // Estadísticas
    const stats = {
        total: tickets.length,
        abiertos: tickets.filter(t => t.status === 'abierto').length,
        enProceso: tickets.filter(t => !['abierto', 'cerrado', 'cancelado'].includes(t.status)).length,
        cerrados: tickets.filter(t => t.status === 'cerrado').length,
        cancelados: tickets.filter(t => t.status === 'cancelado').length,
        criticos: tickets.filter(t => t.prioridad === 'critica' && t.status !== 'cerrado').length,
    };

    return {
        tickets,
        loading,
        stats,
        loadTickets,
        createTicket,
        updateTicket,
        changeStatus,
        addComment,
        getTicketHistory,
        getTicketById,
        deleteTicket,
    };
}
