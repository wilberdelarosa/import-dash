import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Función para registrar eventos en el historial
const recordHistorialEvent = async ({
  tipo,
  descripcion,
  ficha,
  nombre,
  datosAntes,
  datosDespues,
  metadata,
  nivel = 'info',
  usuario = 'Interfaz',
}: {
  tipo: string;
  descripcion: string;
  ficha?: string | null;
  nombre?: string | null;
  datosAntes?: Record<string, unknown> | null;
  datosDespues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  nivel?: 'info' | 'warning' | 'critical';
  usuario?: string;
}) => {
  try {
    const payload = {
      tipo_evento: tipo,
      modulo: 'mantenimientos' as const,
      descripcion,
      ficha_equipo: ficha ?? null,
      nombre_equipo: nombre ?? null,
      usuario_responsable: usuario,
      nivel_importancia: nivel,
      datos_antes: datosAntes ? JSON.parse(JSON.stringify(datosAntes)) : null,
      datos_despues: datosDespues ? JSON.parse(JSON.stringify(datosDespues)) : null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    };

    await supabase.from('historial_eventos').insert(payload);
  } catch (error) {
    console.error('Error recording historial event:', error);
  }
};

export interface PlanAsignado {
  id: string;
  equipo_ficha: string;
  plan_id: string | null;
  intervalo_codigo: string;
  tecnico_responsable: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'vencido';
  horas_alerta: number;
  alerta_activada: boolean;
  fecha_ultima_alerta: string | null;
  horas_actuales: number | null;
  proximo_mantenimiento: number | null;
  fecha_asignacion: string;
  fecha_inicio: string | null;
  fecha_completado: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanAsignadoDetallado extends PlanAsignado {
  equipo_nombre: string;
  equipo_modelo: string;
  equipo_marca: string;
  equipo_categoria: string;
  plan_nombre: string | null;
  plan_modelo: string | null;
  horas_restantes: number | null;
  prioridad: number; // 0: Vencido, 1: Urgente, 2: Alerta, 3: Normal
}

export interface CrearPlanAsignadoParams {
  equipo_ficha: string;
  plan_id?: string | null;
  intervalo_codigo: string;
  tecnico_responsable: string;
  horas_alerta?: number;
  horas_actuales?: number | null;
  proximo_mantenimiento?: number | null;
  notas?: string | null;
}

export interface ActualizarPlanAsignadoParams {
  id: string;
  tecnico_responsable?: string;
  estado?: 'pendiente' | 'en_proceso' | 'completado' | 'vencido';
  horas_alerta?: number;
  horas_actuales?: number | null;
  proximo_mantenimiento?: number | null;
  notas?: string | null;
  fecha_inicio?: string | null;
  fecha_completado?: string | null;
}

export function usePlanesAsignados() {
  const [planes, setPlanes] = useState<PlanAsignadoDetallado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlanes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('planes_asignados_detallados' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .order('prioridad', { ascending: true })
        .order('horas_restantes', { ascending: true });

      if (fetchError) throw fetchError;

      setPlanes((data as unknown as PlanAsignadoDetallado[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar planes asignados';
      setError(message);
      console.error('Error fetching planes asignados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanes();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('planes_asignados_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planes_asignados',
        },
        () => {
          fetchPlanes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const crearPlanAsignado = async (params: CrearPlanAsignadoParams) => {
    try {
      const { data, error: insertError } = await supabase
        .from('planes_asignados' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          equipo_ficha: params.equipo_ficha,
          plan_id: params.plan_id || null,
          intervalo_codigo: params.intervalo_codigo,
          tecnico_responsable: params.tecnico_responsable,
          horas_alerta: params.horas_alerta || 50,
          horas_actuales: params.horas_actuales || null,
          proximo_mantenimiento: params.proximo_mantenimiento || null,
          notas: params.notas || null,
          estado: 'pendiente',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Registrar en historial
      await recordHistorialEvent({
        tipo: 'plan_asignado',
        descripcion: `Plan ${params.intervalo_codigo} asignado a ${params.tecnico_responsable}`,
        ficha: params.equipo_ficha,
        nombre: null,
        datosDespues: {
          intervalo: params.intervalo_codigo,
          tecnico: params.tecnico_responsable,
          horas_alerta: params.horas_alerta,
          estado: 'pendiente',
        },
        metadata: { plan_id: (data as { id?: string })?.id ?? null },
        usuario: params.tecnico_responsable,
      });

      toast({
        title: '✅ Plan asignado',
        description: `${params.intervalo_codigo} asignado a ${params.tecnico_responsable}`,
      });

      await fetchPlanes();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear plan asignado';
      toast({
        title: 'Error al asignar plan',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const crearPlanesMasivos = async (paramsArray: CrearPlanAsignadoParams[]) => {
    try {
      const inserts = paramsArray.map((params) => ({
        equipo_ficha: params.equipo_ficha,
        plan_id: params.plan_id || null,
        intervalo_codigo: params.intervalo_codigo,
        tecnico_responsable: params.tecnico_responsable,
        horas_alerta: params.horas_alerta || 50,
        horas_actuales: params.horas_actuales || null,
        proximo_mantenimiento: params.proximo_mantenimiento || null,
        notas: params.notas || null,
        estado: 'pendiente' as const,
      }));

      const { data, error: insertError } = await supabase
        .from('planes_asignados' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert(inserts)
        .select();

      if (insertError) throw insertError;

      // Registrar en historial
      const fichasAsignadas = paramsArray.map(p => p.equipo_ficha).join(', ');
      await recordHistorialEvent({
        tipo: 'planes_asignados_masivo',
        descripcion: `${paramsArray.length} planes asignados a ${paramsArray[0]?.tecnico_responsable || 'técnico'}`,
        ficha: null,
        nombre: null,
        datosDespues: {
          cantidad: paramsArray.length,
          fichas: fichasAsignadas,
          tecnico: paramsArray[0]?.tecnico_responsable,
        },
        metadata: { planes: paramsArray.map(p => ({ ficha: p.equipo_ficha, intervalo: p.intervalo_codigo })) },
        usuario: paramsArray[0]?.tecnico_responsable,
      });

      toast({
        title: '✅ Planes asignados',
        description: `${paramsArray.length} planes asignados correctamente`,
      });

      await fetchPlanes();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear planes';
      toast({
        title: 'Error al asignar planes',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const actualizarPlanAsignado = async (params: ActualizarPlanAsignadoParams) => {
    try {
      const updateData: Record<string, unknown> = {};

      if (params.tecnico_responsable !== undefined) updateData.tecnico_responsable = params.tecnico_responsable;
      if (params.estado !== undefined) {
        updateData.estado = params.estado;
        if (params.estado === 'en_proceso' && !params.fecha_inicio) {
          updateData.fecha_inicio = new Date().toISOString();
        }
        if (params.estado === 'completado' && !params.fecha_completado) {
          updateData.fecha_completado = new Date().toISOString();
        }
      }
      if (params.horas_alerta !== undefined) updateData.horas_alerta = params.horas_alerta;
      if (params.horas_actuales !== undefined) updateData.horas_actuales = params.horas_actuales;
      if (params.proximo_mantenimiento !== undefined) updateData.proximo_mantenimiento = params.proximo_mantenimiento;
      if (params.notas !== undefined) updateData.notas = params.notas;
      if (params.fecha_inicio !== undefined) updateData.fecha_inicio = params.fecha_inicio;
      if (params.fecha_completado !== undefined) updateData.fecha_completado = params.fecha_completado;

      const { data, error: updateError } = await supabase
        .from('planes_asignados' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Obtener plan original para comparación
      const planOriginal = planes.find(p => p.id === params.id);
      
      // Registrar en historial
      await recordHistorialEvent({
        tipo: params.estado ? 'estado_plan_cambiado' : 'plan_actualizado',
        descripcion: params.estado 
          ? `Estado del plan cambiado a ${params.estado}`
          : 'Plan de mantenimiento actualizado',
        ficha: planOriginal?.equipo_ficha,
        nombre: planOriginal?.equipo_nombre,
        datosAntes: planOriginal ? {
          tecnico: planOriginal.tecnico_responsable,
          estado: planOriginal.estado,
          horas_alerta: planOriginal.horas_alerta,
        } : null,
        datosDespues: updateData,
        metadata: { plan_id: params.id },
        usuario: params.tecnico_responsable || planOriginal?.tecnico_responsable,
      });

      toast({
        title: '✅ Plan actualizado',
        description: 'Los cambios se guardaron correctamente',
      });

      await fetchPlanes();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar plan';
      toast({
        title: 'Error al actualizar',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const eliminarPlanAsignado = async (id: string) => {
    try {
      // Obtener plan antes de eliminar
      const planEliminado = planes.find(p => p.id === id);

      const { error: deleteError } = await supabase
        .from('planes_asignados' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Registrar en historial
      if (planEliminado) {
        await recordHistorialEvent({
          tipo: 'plan_eliminado',
          descripcion: `Plan ${planEliminado.intervalo_codigo} eliminado`,
          ficha: planEliminado.equipo_ficha,
          nombre: planEliminado.equipo_nombre,
          datosAntes: {
            intervalo: planEliminado.intervalo_codigo,
            tecnico: planEliminado.tecnico_responsable,
            estado: planEliminado.estado,
          },
          metadata: { plan_id: id },
        });
      }

      toast({
        title: 'Plan eliminado',
        description: 'El plan se eliminó correctamente',
      });

      await fetchPlanes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar plan';
      toast({
        title: 'Error al eliminar',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const activarAlertas = async () => {
    try {
      const { error: rpcError } = await supabase.rpc('activar_alertas_mantenimiento' as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      if (rpcError) throw rpcError;

      await fetchPlanes();
    } catch (err) {
      console.error('Error activando alertas:', err);
    }
  };

  return {
    planes,
    loading,
    error,
    refetch: fetchPlanes,
    crearPlanAsignado,
    crearPlanesMasivos,
    actualizarPlanAsignado,
    eliminarPlanAsignado,
    activarAlertas,
  };
}
