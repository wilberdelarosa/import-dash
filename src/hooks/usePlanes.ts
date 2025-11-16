/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  PlanMantenimiento,
  PlanIntervalo,
  PlanConIntervalos,
  IntervaloConKits,
  IntervaloKitAssignment,
  KitMantenimiento,
} from '@/types/maintenance-plans';

type MutationOptions = {
  silent?: boolean;
};

export function usePlanes() {
  const [planes, setPlanes] = useState<PlanConIntervalos[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPlanes = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: planesData, error: planesError } = await supabase
        .from('planes_mantenimiento')
        .select('*')
        .order('nombre');

      if (planesError) throw planesError;

      const { data: intervalosData, error: intervalosError } = await supabase
        .from('plan_intervalos')
        .select('*')
        .order('orden');

      if (intervalosError) throw intervalosError;

      const { data: intervalosKitsData, error: intervalosKitsError } = await supabase
        .from('plan_intervalo_kits')
        .select('id, plan_intervalo_id, kit_id, created_at, kits_mantenimiento(*)');

      if (intervalosKitsError) throw intervalosKitsError;

      const asignaciones: IntervaloKitAssignment[] = (intervalosKitsData || [])
        .filter((row) => Boolean(row.kits_mantenimiento))
        .map((row) => ({
          id: row.id,
          plan_intervalo_id: row.plan_intervalo_id,
          kit_id: row.kit_id,
          created_at: row.created_at,
          kit: row.kits_mantenimiento as KitMantenimiento,
        }));

      const planesConIntervalos = (planesData || []).map(plan => ({
        ...plan,
        intervalos: (intervalosData || [])
          .filter(int => int.plan_id === plan.id)
          .map(int => ({
            ...int,
            tareas: Array.isArray(int.tareas) ? int.tareas as string[] : [],
            kits: asignaciones.filter((link) => link.plan_intervalo_id === int.id),
          }))
      }));

      setPlanes(planesConIntervalos as PlanConIntervalos[]);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los planes de mantenimiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlanes();

    const channel = supabase
      .channel('planes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planes_mantenimiento' }, () => loadPlanes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_intervalos' }, () => loadPlanes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_intervalo_kits' }, () => loadPlanes())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPlanes]);

  const createPlan = async (plan: Omit<PlanMantenimiento, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('planes_mantenimiento')
        .insert([plan])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Plan creado',
        description: 'El plan de mantenimiento se creó correctamente',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el plan',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePlan = async (id: number, plan: Partial<PlanMantenimiento>) => {
    try {
      const { error } = await supabase
        .from('planes_mantenimiento')
        .update(plan)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Plan actualizado',
        description: 'El plan se actualizó correctamente',
      });
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el plan',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deletePlan = async (id: number) => {
    try {
      const { error } = await supabase
        .from('planes_mantenimiento')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Plan eliminado',
        description: 'El plan se eliminó correctamente',
      });
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el plan',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createIntervalo = async (intervalo: Omit<PlanIntervalo, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('plan_intervalos')
        .insert([intervalo])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Intervalo creado',
        description: 'El intervalo se agregó al plan',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating interval:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el intervalo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateIntervalo = async (id: number, intervalo: Partial<PlanIntervalo>) => {
    try {
      const { error } = await supabase
        .from('plan_intervalos')
        .update(intervalo)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Intervalo actualizado',
        description: 'El intervalo se actualizó correctamente',
      });
    } catch (error: any) {
      console.error('Error updating interval:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el intervalo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteIntervalo = async (id: number) => {
    try {
      const { error } = await supabase
        .from('plan_intervalos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Intervalo eliminado',
        description: 'El intervalo se eliminó correctamente',
      });
    } catch (error: any) {
      console.error('Error deleting interval:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el intervalo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const linkKitToInterval = async (intervaloId: number, kitId: number) => {
    try {
      const { error } = await supabase
        .from('plan_intervalo_kits')
        .insert({ plan_intervalo_id: intervaloId, kit_id: kitId });

      if (error) throw error;

      toast({
        title: 'Kit asignado',
        description: 'El kit se vincul�� al intervalo correctamente.',
      });
      await loadPlanes();
    } catch (error: any) {
      console.error('Error linking kit:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate')
          ? 'El kit ya est�� asignado a este intervalo'
          : 'No se pudo asignar el kit al intervalo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const unlinkKitFromInterval = async (linkId: number) => {
    try {
      const { error } = await supabase
        .from('plan_intervalo_kits')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: 'Kit eliminado',
        description: 'El kit se desvincul�� del intervalo.',
      });
      await loadPlanes();
    } catch (error: any) {
      console.error('Error removing kit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo remover el kit del intervalo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    planes,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    createIntervalo,
    updateIntervalo,
    deleteIntervalo,
    refreshPlanes: loadPlanes,
    linkKitToInterval,
    unlinkKitFromInterval,
  };
}
