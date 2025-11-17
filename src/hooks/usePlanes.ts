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
      
      // Cargar planes con intervalos en una sola query
      const { data: planesData, error: planesError } = await (supabase as any)
        .from('planes_mantenimiento')
        .select('*')
        .order('nombre');

      if (planesError) throw planesError;

      // Cargar intervalos
      const { data: intervalosData, error: intervalosError } = await (supabase as any)
        .from('plan_intervalos')
        .select('*')
        .order('orden');

      if (intervalosError) throw intervalosError;

      // Cargar kits con sus piezas en una query
      const { data: intervalosKitsData, error: intervalosKitsError} = await (supabase as any)
        .from('plan_intervalo_kits')
        .select('id, plan_intervalo_id, kit_id, created_at, kits_mantenimiento(*, kit_piezas(*))');

      if (intervalosKitsError) throw intervalosKitsError;

      // Procesar asignaciones de kits
      const asignaciones: IntervaloKitAssignment[] = (intervalosKitsData || [])
        .filter((row) => Boolean(row.kits_mantenimiento))
        .map((row) => {
          const kit = row.kits_mantenimiento as any;
          // Agregar las piezas al kit
          if (kit && kit.kit_piezas) {
            kit.piezas = kit.kit_piezas;
            delete kit.kit_piezas;
          }
          return {
            id: row.id,
            plan_intervalo_id: row.plan_intervalo_id,
            kit_id: row.kit_id,
            created_at: row.created_at,
            kit: kit as KitMantenimiento,
          };
        });

      // Combinar todo
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

      // Actualización optimista: agregar inmediatamente a la lista local
      const newPlan: PlanConIntervalos = {
        ...data,
        intervalos: [],
      };
      setPlanes(prev => [...prev, newPlan].sort((a, b) => a.nombre.localeCompare(b.nombre)));

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
      // Actualización optimista: actualizar inmediatamente en la UI
      setPlanes(prev => prev.map(p => 
        p.id === id ? { ...p, ...plan } : p
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)));

      const { error } = await supabase
        .from('planes_mantenimiento')
        .update(plan)
        .eq('id', id);

      if (error) {
        // Revertir en caso de error
        await loadPlanes();
        throw error;
      }

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
      // Actualización optimista: remover inmediatamente de la UI
      setPlanes(prev => prev.filter(p => p.id !== id));

      const { error } = await supabase
        .from('planes_mantenimiento')
        .delete()
        .eq('id', id);

      if (error) {
        // Revertir en caso de error
        await loadPlanes();
        throw error;
      }

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

      // Actualización optimista: agregar intervalo inmediatamente al plan
      setPlanes(prev => prev.map(plan => {
        if (plan.id === intervalo.plan_id) {
          const newIntervalo: IntervaloConKits = {
            ...data,
            tareas: Array.isArray(data.tareas) ? data.tareas as string[] : [],
            kits: [],
          };
          return {
            ...plan,
            intervalos: [...plan.intervalos, newIntervalo].sort((a, b) => a.orden - b.orden),
          };
        }
        return plan;
      }));

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
      // Actualización optimista
      setPlanes(prev => prev.map(plan => ({
        ...plan,
        intervalos: plan.intervalos.map(int => 
          int.id === id ? { ...int, ...intervalo } : int
        ).sort((a, b) => a.orden - b.orden),
      })));

      const { error } = await supabase
        .from('plan_intervalos')
        .update(intervalo)
        .eq('id', id);

      if (error) {
        await loadPlanes();
        throw error;
      }

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
      // Actualización optimista
      setPlanes(prev => prev.map(plan => ({
        ...plan,
        intervalos: plan.intervalos.filter(int => int.id !== id),
      })));

      const { error } = await supabase
        .from('plan_intervalos')
        .delete()
        .eq('id', id);

      if (error) {
        await loadPlanes();
        throw error;
      }

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
      const { data, error } = await supabase
        .from('plan_intervalo_kits')
        .insert({ plan_intervalo_id: intervaloId, kit_id: kitId })
        .select('*, kits_mantenimiento(*, kit_piezas(*))')
        .single();

      if (error) throw error;

      // Actualización optimista
      if (data && data.kits_mantenimiento) {
        const kit = data.kits_mantenimiento as any;
        if (kit.kit_piezas) {
          kit.piezas = kit.kit_piezas;
          delete kit.kit_piezas;
        }
        
        setPlanes(prev => prev.map(plan => ({
          ...plan,
          intervalos: plan.intervalos.map(int => {
            if (int.id === intervaloId) {
              return {
                ...int,
                kits: [...int.kits, {
                  id: data.id,
                  plan_intervalo_id: data.plan_intervalo_id,
                  kit_id: data.kit_id,
                  created_at: data.created_at,
                  kit: kit as KitMantenimiento,
                }],
              };
            }
            return int;
          }),
        })));
      }

      toast({
        title: 'Kit asignado',
        description: 'El kit se vinculó al intervalo correctamente.',
      });
    } catch (error: any) {
      await loadPlanes();
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
      // Actualización optimista: remover el kit de la lista inmediatamente
      setPlanes(prev => prev.map(plan => ({
        ...plan,
        intervalos: plan.intervalos.map(int => ({
          ...int,
          kits: int.kits.filter(k => k.id !== linkId),
        })),
      })));

      const { error } = await supabase
        .from('plan_intervalo_kits')
        .delete()
        .eq('id', linkId);

      if (error) {
        await loadPlanes();
        throw error;
      }

      toast({
        title: 'Kit eliminado',
        description: 'El kit se desvinculó del intervalo.',
      });
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

  // Equipment-plan management functions removed (requires database migration)
  // These functions will be available after running the proposed migration

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
