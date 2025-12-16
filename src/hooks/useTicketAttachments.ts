import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { TicketAttachment, AttachmentType } from '@/types/tickets';

const BUCKET_NAME = 'ticket-attachments';

export function useTicketAttachments(ticketId?: string) {
    const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    // Cargar adjuntos de un ticket
    const loadAttachments = useCallback(async (id?: string) => {
        const targetId = id || ticketId;
        if (!targetId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ticket_attachments')
                .select('*')
                .eq('ticket_id', targetId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAttachments((data || []) as TicketAttachment[]);
        } catch (error) {
            console.error('Error loading attachments:', error);
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    // Subir un archivo
    const uploadAttachment = useCallback(async (
        file: File,
        fileType: AttachmentType,
        targetTicketId?: string
    ): Promise<TicketAttachment | null> => {
        const id = targetTicketId || ticketId;
        if (!id || !user?.email) return null;

        try {
            setUploading(true);

            // Generar path único
            const ext = file.name.split('.').pop() || 'jpg';
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const storagePath = `${id}/${filename}`;

            // Subir a Storage
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Crear registro en DB
            const attachmentData = {
                ticket_id: id,
                file_name: file.name,
                file_type: fileType,
                file_path: storagePath,
                file_size: file.size,
                mime_type: file.type,
                uploaded_by: user.email,
            };

            const { data, error: dbError } = await supabase
                .from('ticket_attachments')
                .insert([attachmentData])
                .select()
                .single();

            if (dbError) throw dbError;

            // Registrar en historial del ticket
            await supabase.from('ticket_history').insert([{
                ticket_id: id,
                action: 'attachment_added',
                comment: `Archivo adjuntado: ${file.name} (${fileType})`,
                performed_by: user.email,
            }]);

            toast({
                title: 'Archivo subido',
                description: file.name,
            });

            loadAttachments(id);
            return data as TicketAttachment;
        } catch (error) {
            console.error('Error uploading attachment:', error);
            toast({
                title: 'Error',
                description: 'No se pudo subir el archivo',
                variant: 'destructive',
            });
            return null;
        } finally {
            setUploading(false);
        }
    }, [ticketId, user, toast, loadAttachments]);

    // Subir múltiples archivos
    const uploadMultipleAttachments = useCallback(async (
        files: File[],
        fileType: AttachmentType,
        targetTicketId?: string
    ): Promise<TicketAttachment[]> => {
        const results: TicketAttachment[] = [];

        for (const file of files) {
            const result = await uploadAttachment(file, fileType, targetTicketId);
            if (result) results.push(result);
        }

        return results;
    }, [uploadAttachment]);

    // Obtener URL de descarga de un archivo
    const getDownloadUrl = useCallback(async (filePath: string): Promise<string | null> => {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(filePath, 3600); // 1 hora de validez

            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            console.error('Error getting download URL:', error);
            return null;
        }
    }, []);

    // Eliminar un adjunto
    const deleteAttachment = useCallback(async (attachment: TicketAttachment): Promise<boolean> => {
        try {
            // Eliminar de Storage
            await supabase.storage.from(BUCKET_NAME).remove([attachment.file_path]);

            // Eliminar registro de DB
            const { error } = await supabase
                .from('ticket_attachments')
                .delete()
                .eq('id', attachment.id);

            if (error) throw error;

            toast({
                title: 'Archivo eliminado',
            });

            loadAttachments(attachment.ticket_id);
            return true;
        } catch (error) {
            console.error('Error deleting attachment:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el archivo',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, loadAttachments]);

    return {
        attachments,
        loading,
        uploading,
        loadAttachments,
        uploadAttachment,
        uploadMultipleAttachments,
        getDownloadUrl,
        deleteAttachment,
    };
}
