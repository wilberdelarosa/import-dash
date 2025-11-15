import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EquipoPlan, PlanConIntervalos } from '@/types/maintenance-plans';

interface EquipoPlanConDetalles extends EquipoPlan {
  plan: PlanConIntervalos;
}

export function useEquipoPlanes(equipoId?: number) {
  const [equipoPlanes, setEquipoPlanes] = useState<EquipoPlanConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEquipoPlanes = async () => {
    if (!equipoId) {
      setEquipoPlanes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Cargar equipo_planes
      const { data: equipoPlanesData, error: epError } = await supabase
        .from('equipo_planes')
        .select('*')
        .eq('equipo_id', equipoId)
        .eq('activo', true);

      if (epError) throw epError;

      if (!equipoPlanesData || equipoPlanesData.length === 0) {
        setEquipoPlanes([]);
        return;
      }

      // Cargar los planes asociados
      const planIds = equipoPlanesData.map(ep => ep.plan_id);
      const { data: planesData, error: planesError } = await supabase
        .from('planes_mantenimiento')
        .select('*')
        .in('id', planIds);

      if (planesError) throw planesError;

      // Cargar intervalos
      const { data: intervalosData, error: intervalosError } = await supabase
        .from('plan_intervalos')
        .select('*')
        .in('plan_id', planIds)
        .order('orden');

      if (intervalosError) throw intervalosError;

      // Combinar datos
      const planesConIntervalos = (planesData || []).map(plan => ({
        ...plan,
        intervalos: (intervalosData || []).map(intervalo => ({
          ...intervalo,
          tareas: Array.isArray(intervalo.tareas) ? intervalo.tareas as string[] : []
        })).filter(intervalo => intervalo.plan_id === plan.id)
      }));

      const resultado: EquipoPlanConDetalles[] = equipoPlanesData.map(ep => ({
        ...ep,
        plan: planesConIntervalos.find(p => p.id === ep.plan_id)!
      })).filter(item => item.plan) as EquipoPlanConDetalles[];

      setEquipoPlanes(resultado);
    } catch (error: any) {
      console.error('Error loading equipo planes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los planes del equipo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipoPlanes();

    if (!equipoId) return;

    const channel = supabase
      .channel('equipo-planes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipo_planes' }, loadEquipoPlanes)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipoId]);

  const vincularPlan = async (planId: number, horasInicio: number = 0) => {
    if (!equipoId) return;

    try {
      const { data, error } = await supabase
        .from('equipo_planes')
        .insert([{
          equipo_id: equipoId,
          plan_id: planId,
          horas_inicio: horasInicio,
          activo: true
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Plan vinculado',
        description: 'El plan se vinculó correctamente al equipo',
      });

      loadEquipoPlanes();
      return data;
    } catch (error: any) {
      console.error('Error vinculando plan:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate') ? 'Este plan ya está vinculado' : 'No se pudo vincular el plan',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const desvincularPlan = async (equipoPlanId: number) => {
    try {
      const { error } = await supabase
        .from('equipo_planes')
        .update({ activo: false })
        .eq('id', equipoPlanId);

      if (error) throw error;

      toast({
        title: 'Plan desvinculado',
        description: 'El plan se desvinculó del equipo',
      });

      loadEquipoPlanes();
    } catch (error: any) {
      console.error('Error desvinculando plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo desvincular el plan',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    equipoPlanes,
    loading,
    vincularPlan,
    desvincularPlan,
    refreshEquipoPlanes: loadEquipoPlanes,
  };
}
