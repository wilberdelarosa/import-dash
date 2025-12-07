/**
 * Hook para gestión de archivos adjuntos de submissions
 * Maneja subida a Storage y creación de registros en submission_attachments
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AttachmentData {
  id?: string;
  submission_id?: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  file_size: number;
}

const BUCKET_NAME = 'submissions';

export function useSubmissionAttachments() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Subir archivo a Storage
   */
  const uploadFile = useCallback(async (
    file: File,
    submissionId: string,
  ): Promise<AttachmentData | null> => {
    try {
      // Generar path único
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `${submissionId}/${filename}`;

      // Subir a Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type,
        });

      if (error) {
        // Si el bucket no existe, dar instrucción clara
        if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          throw new Error(
            'El bucket "submissions" no existe en Supabase Storage. ' +
            'Créalo desde el Dashboard de Supabase > Storage > New bucket'
          );
        }
        throw error;
      }

      return {
        storage_path: data.path,
        filename: file.name,
        mime_type: file.type,
        file_size: file.size,
      };
    } catch (err: unknown) {
      console.error('Error uploading file:', err);
      const message = err instanceof Error ? err.message : 'Error al subir archivo';
      toast({
        title: 'Error de subida',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Crear registro de attachment en la BD
   */
  const createAttachmentRecord = useCallback(async (
    submissionId: string,
    attachment: AttachmentData,
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('submission_attachments')
        .insert({
          submission_id: submissionId,
          storage_path: attachment.storage_path,
          filename: attachment.filename,
          mime_type: attachment.mime_type,
          file_size: attachment.file_size,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (err: unknown) {
      console.error('Error creating attachment record:', err);
      return null;
    }
  }, []);

  /**
   * Subir múltiples archivos para un submission
   */
  const uploadAttachments = useCallback(async (
    files: File[],
    submissionId: string,
  ): Promise<AttachmentData[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    setProgress(0);
    const results: AttachmentData[] = [];

    for (let i = 0; i < files.length; i++) {
      const uploaded = await uploadFile(files[i], submissionId);
      if (uploaded) {
        const recordId = await createAttachmentRecord(submissionId, uploaded);
        if (recordId) {
          results.push({ ...uploaded, id: recordId, submission_id: submissionId });
        }
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    setProgress(0);

    if (results.length > 0 && results.length === files.length) {
      toast({
        title: 'Archivos subidos',
        description: `${results.length} archivo(s) adjuntado(s) correctamente`,
      });
    } else if (results.length > 0) {
      toast({
        title: 'Subida parcial',
        description: `${results.length} de ${files.length} archivos subidos`,
        variant: 'destructive',
      });
    }

    return results;
  }, [uploadFile, createAttachmentRecord, toast]);

  /**
   * Obtener attachments de un submission
   */
  const getAttachments = useCallback(async (submissionId: string): Promise<AttachmentData[]> => {
    try {
      const { data, error } = await supabase
        .from('submission_attachments')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as AttachmentData[];
    } catch (err) {
      console.error('Error fetching attachments:', err);
      return [];
    }
  }, []);

  /**
   * Eliminar attachment
   */
  const deleteAttachment = useCallback(async (
    attachmentId: string,
    storagePath: string,
  ): Promise<boolean> => {
    try {
      // Eliminar de Storage
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

      // Eliminar registro
      const { error } = await supabase
        .from('submission_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting attachment:', err);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el archivo',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  /**
   * Obtener URL pública de un archivo
   */
  const getPublicUrl = useCallback((storagePath: string): string => {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    return data.publicUrl;
  }, []);

  /**
   * Obtener URL firmada (temporal) para archivos privados
   */
  const getSignedUrl = useCallback(async (storagePath: string, expiresIn = 3600): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  }, []);

  return {
    uploading,
    progress,
    uploadFile,
    uploadAttachments,
    createAttachmentRecord,
    getAttachments,
    deleteAttachment,
    getPublicUrl,
    getSignedUrl,
    BUCKET_NAME,
  };
}

export default useSubmissionAttachments;
