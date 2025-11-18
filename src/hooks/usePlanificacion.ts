/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  PlanificacionMantenimiento,
  AlertaMantenimiento,
  EquipoPlanAuto,
  EquipoConPlanSugerido,
  EquipoRequiereAlerta,
  CrearPlanificacionInput,
  CrearAlertaInput,
} from '@/types/planificacion';

export function usePlanificacion() {
  const [planificaciones, setPlanificaciones] = useState<PlanificacionMantenimiento[]>([]);
  const [alertas, setAlertas] = useState<AlertaMantenimiento[]>([]);
  const [equiposPlanesAuto, setEquiposPlanesAuto] = useState<EquipoPlanAuto[]>([]);
  const [equiposConPlanes, setEquiposConPlanes] = useState<EquipoConPlanSugerido[]>([]);
  const [equiposRequierenAlerta, setEquiposRequierenAlerta] = useState<EquipoRequiereAlerta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cargar todas las planificaciones
  const loadPlanificaciones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('planificaciones_mantenimiento' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlanificaciones((data || []) as unknown as PlanificacionMantenimiento[]);
    } catch (error: any) {
      console.error('Error loading planificaciones:', error);
    }
  }, []);

  // Cargar alertas configuradas
  const loadAlertas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alertas_mantenimiento' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlertas((data || []) as unknown as AlertaMantenimiento[]);
    } catch (error: any) {
      console.error('Error loading alertas:', error);
    }
  }, []);

  // Cargar asociaciones automáticas equipo-plan
  const loadEquiposPlanesAuto = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipos_planes_auto' as any)
        .select('*')
        .order('modelo');

      if (error) throw error;
      setEquiposPlanesAuto((data || []) as unknown as EquipoPlanAuto[]);
    } catch (error: any) {
      console.error('Error loading equipos_planes_auto:', error);
    }
  }, []);

  // Cargar equipos con sus planes sugeridos (vista materializada)
  const loadEquiposConPlanes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipos_con_planes_sugeridos' as any)
        .select('*')
        .order('nombre');

      if (error) throw error;
      setEquiposConPlanes((data || []) as unknown as EquipoConPlanSugerido[]);
    } catch (error: any) {
      console.error('Error loading equipos_con_planes:', error);
    }
  }, []);

  // Obtener equipos que requieren alerta
  const loadEquiposRequierenAlerta = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_equipos_requieren_alerta' as any);

      if (error) throw error;
      setEquiposRequierenAlerta((data || []) as unknown as EquipoRequiereAlerta[]);
    } catch (error: any) {
      console.error('Error loading equipos que requieren alerta:', error);
    }
  }, []);

  // Cargar todo al iniciar
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadPlanificaciones(),
      loadAlertas(),
      loadEquiposPlanesAuto(),
      loadEquiposConPlanes(),
      loadEquiposRequierenAlerta(),
    ]);
    setLoading(false);
  }, [loadPlanificaciones, loadAlertas, loadEquiposPlanesAuto, loadEquiposConPlanes, loadEquiposRequierenAlerta]);

  useEffect(() => {
    loadAll();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('planificacion-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planificaciones_mantenimiento' }, () => loadPlanificaciones())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas_mantenimiento' }, () => {
        loadAlertas();
        loadEquiposRequierenAlerta();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_planes_auto' }, () => {
        loadEquiposPlanesAuto();
        loadEquiposConPlanes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll, loadPlanificaciones, loadAlertas, loadEquiposPlanesAuto, loadEquiposConPlanes, loadEquiposRequierenAlerta]);

  // ========== PLANIFICACIONES ==========

  const crearPlanificacion = async (planificacion: CrearPlanificacionInput) => {
    try {
      const { data, error } = await supabase
        .from('planificaciones_mantenimiento' as any)
        .insert([planificacion])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Planificación creada',
        description: `${planificacion.nombreEquipo} - ${planificacion.proximoMP}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating planificacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la planificación',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const actualizarPlanificacion = async (id: number, updates: Partial<PlanificacionMantenimiento>) => {
    try {
      const { error } = await supabase
        .from('planificaciones_mantenimiento' as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Planificación actualizada',
        description: 'Los cambios se guardaron correctamente',
      });
    } catch (error: any) {
      console.error('Error updating planificacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la planificación',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const eliminarPlanificacion = async (id: number) => {
    try {
      const { error } = await supabase
        .from('planificaciones_mantenimiento' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Planificación eliminada',
        description: 'La planificación se eliminó correctamente',
      });
    } catch (error: any) {
      console.error('Error deleting planificacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la planificación',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // ========== ALERTAS ==========

  const crearAlerta = async (alerta: CrearAlertaInput) => {
    try {
      const { data, error } = await supabase
        .from('alertas_mantenimiento' as any)
        .insert([alerta as any])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Alerta configurada',
        description: `Se alertará ${alerta.horas_alerta}h antes para ${alerta.nombre_equipo}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating alerta:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate') 
          ? 'Ya existe una alerta para este equipo e intervalo'
          : 'No se pudo crear la alerta',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const actualizarAlerta = async (id: number, updates: Partial<AlertaMantenimiento>) => {
    try {
      const { error } = await supabase
        .from('alertas_mantenimiento' as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Alerta actualizada',
        description: 'La configuración se actualizó correctamente',
      });
    } catch (error: any) {
      console.error('Error updating alerta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la alerta',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const eliminarAlerta = async (id: number) => {
    try {
      const { error } = await supabase
        .from('alertas_mantenimiento' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Alerta eliminada',
        description: 'La alerta se eliminó correctamente',
      });
    } catch (error: any) {
      console.error('Error deleting alerta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la alerta',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // ========== ASOCIACIONES AUTO EQUIPO-PLAN ==========

  const asociarPlanAModelo = async (modelo: string, marca: string, planId: number, categoria?: string) => {
    try {
      const { data, error} = await supabase
        .from('equipos_planes_auto' as any)
        .insert([{ modelo, marca, plan_id: planId, categoria }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Plan asociado',
        description: `Todos los ${modelo} ${marca} usarán este plan automáticamente`,
      });

      // Refrescar vista materializada
      await supabase.rpc('refresh_equipos_planes_sugeridos' as any);

      return data;
    } catch (error: any) {
      console.error('Error asociando plan:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate')
          ? 'Este modelo ya tiene ese plan asignado'
          : 'No se pudo asociar el plan',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const desasociarPlanDeModelo = async (id: number) => {
    try {
      const { error } = await supabase
        .from('equipos_planes_auto' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Asociación eliminada',
        description: 'El plan se desvinculó del modelo',
      });

      // Refrescar vista materializada
      await supabase.rpc('refresh_equipos_planes_sugeridos' as any);
    } catch (error: any) {
      console.error('Error desasociando plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la asociación',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    // Estados
    planificaciones,
    alertas,
    equiposPlanesAuto,
    equiposConPlanes,
    equiposRequierenAlerta,
    loading,

    // Métodos
    crearPlanificacion,
    actualizarPlanificacion,
    eliminarPlanificacion,
    crearAlerta,
    actualizarAlerta,
    eliminarAlerta,
    asociarPlanAModelo,
    desasociarPlanDeModelo,
    
    // Refrescar
    refreshPlanificaciones: loadPlanificaciones,
    refreshAlertas: loadAlertas,
    refreshAll: loadAll,
  };
}
