/**
 * Hook para gestión de submissions del mecánico
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PartUsada {
  nombre: string;
  cantidad: number;
  referencia?: string;
  del_inventario: boolean;
  inventario_id?: string;
}

export interface Submission {
  id: string;
  created_by: string;
  equipo_id: number;
  fecha_mantenimiento: string;
  horas_km_actuales: number;
  tipo_mantenimiento: string | null;
  descripcion_trabajo: string | null;
  observaciones: string | null;
  partes_usadas: PartUsada[];
  status: 'pending' | 'approved' | 'rejected' | 'integrated';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  equipo?: {
    id: number;
    ficha: string;
    nombre: string;
    marca: string;
    modelo: string;
  };
}

export interface SubmissionAttachment {
  id: string;
  submission_id: string;
  storage_path: string;
  filename: string;
  mime_type: string | null;
  file_size: number | null;
}

interface CreateSubmissionData {
  equipo_id: number;
  fecha_mantenimiento: string;
  horas_km_actuales: number;
  tipo_mantenimiento?: string;
  descripcion_trabajo?: string;
  observaciones?: string;
  partes_usadas?: PartUsada[];
}

export function useMechanicSubmissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar submissions del mecánico actual
  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('maintenance_submissions')
        .select(`
          *,
          equipo:equipos(id, ficha, nombre, marca, modelo)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSubmissions((data || []) as unknown as Submission[]);
    } catch (err: unknown) {
      console.error('Error fetching submissions:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubmissions();
    
    // Suscripción realtime para actualizaciones de status
    if (user) {
      const channel = supabase
        .channel('mechanic-submissions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'maintenance_submissions',
            filter: `created_by=eq.${user.id}`
          },
          (payload) => {
            console.log('[useMechanicSubmissions] Realtime update:', payload);
            fetchSubmissions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchSubmissions, user]);

  // Crear nuevo submission
  const createSubmission = useCallback(async (data: CreateSubmissionData): Promise<string | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para crear un reporte',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const insertData = {
        created_by: user.id,
        equipo_id: data.equipo_id,
        fecha_mantenimiento: data.fecha_mantenimiento,
        horas_km_actuales: data.horas_km_actuales,
        tipo_mantenimiento: data.tipo_mantenimiento || null,
        descripcion_trabajo: data.descripcion_trabajo || null,
        observaciones: data.observaciones || null,
        partes_usadas: data.partes_usadas || [],
      };
      
      const { data: newSubmission, error: insertError } = await supabase
        .from('maintenance_submissions')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Reporte enviado',
        description: 'Tu reporte ha sido enviado para aprobación',
      });

      await fetchSubmissions();
      return newSubmission?.id || null;
    } catch (err: unknown) {
      console.error('Error creating submission:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo crear el reporte',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, fetchSubmissions]);

  // Obtener estadísticas del mecánico
  const getStats = useCallback(() => {
    const pending = submissions.filter(s => s.status === 'pending').length;
    const approved = submissions.filter(s => s.status === 'approved' || s.status === 'integrated').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    const thisMonth = submissions.filter(s => {
      const date = new Date(s.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return { pending, approved, rejected, thisMonth };
  }, [submissions]);

  return {
    submissions,
    loading,
    error,
    createSubmission,
    fetchSubmissions,
    getStats,
  };
}

// Hook para admin - gestión de todas las submissions
export function useAdminSubmissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllSubmissions = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('maintenance_submissions')
        .select(`
          *,
          equipo:equipos(id, ficha, nombre, marca, modelo)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions((data || []) as unknown as Submission[]);
    } catch (err: unknown) {
      console.error('Error fetching all submissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveSubmission = useCallback(async (submissionId: string, feedback?: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_and_integrate_submission', {
        p_submission_id: submissionId,
        p_admin_feedback: feedback || null,
      });

      if (error) throw error;

      toast({
        title: 'Reporte aprobado',
        description: 'El reporte ha sido aprobado e integrado al sistema',
      });

      await fetchAllSubmissions();
      return true;
    } catch (err: unknown) {
      console.error('Error approving submission:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo aprobar el reporte',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchAllSubmissions]);

  const rejectSubmission = useCallback(async (submissionId: string, feedback: string) => {
    try {
      const { data, error } = await supabase.rpc('reject_submission', {
        p_submission_id: submissionId,
        p_feedback: feedback,
      });

      if (error) throw error;

      toast({
        title: 'Reporte rechazado',
        description: 'El reporte ha sido rechazado y el mecánico será notificado',
      });

      await fetchAllSubmissions();
      return true;
    } catch (err: unknown) {
      console.error('Error rejecting submission:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo rechazar el reporte',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchAllSubmissions]);

  useEffect(() => {
    fetchAllSubmissions();
    
    // Suscripción realtime para actualizaciones
    const channel = supabase
      .channel('admin-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_submissions'
        },
        (payload) => {
          console.log('[useAdminSubmissions] Realtime update:', payload);
          fetchAllSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllSubmissions]);

  return {
    submissions,
    loading,
    fetchAllSubmissions,
    approveSubmission,
    rejectSubmission,
  };
}
