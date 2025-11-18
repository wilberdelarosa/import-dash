/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  OverridePlan,
  EquipoConOverride,
  CrearOverrideInput,
  ActualizarOverrideInput,
} from '@/types/planificacion';

/**
 * Hook para gestionar overrides manuales de planes de mantenimiento
 * 
 * Permite:
 * - Ver overrides activos
 * - Crear override cuando sugerencia automática no aplica
 * - Desactivar override para volver a sugerencia automática
 * - Ver historial de cambios
 */
export function useOverridesPlanes() {
  const [overrides, setOverrides] = useState<OverridePlan[]>([]);
  const [equiposConOverride, setEquiposConOverride] = useState<EquipoConOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cargar todos los overrides
  const loadOverrides = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('overrides_planes' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOverrides((data || []) as unknown as OverridePlan[]);
    } catch (error: any) {
      console.error('Error loading overrides:', error);
    }
  }, []);

  // Cargar vista materializada de equipos con override
  const loadEquiposConOverride = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipos_con_overrides' as any)
        .select('*')
        .order('override_fecha', { ascending: false });

      if (error) throw error;
      setEquiposConOverride((data || []) as unknown as EquipoConOverride[]);
    } catch (error: any) {
      console.error('Error loading equipos con override:', error);
    }
  }, []);

  // Cargar todo al montar
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadOverrides(), loadEquiposConOverride()]);
      setLoading(false);
    };

    loadAll();
  }, [loadOverrides, loadEquiposConOverride]);

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('overrides-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'overrides_planes' },
        () => {
          loadOverrides();
          loadEquiposConOverride();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOverrides, loadEquiposConOverride]);

  /**
   * Crear un nuevo override
   */
  const crearOverride = async (input: CrearOverrideInput) => {
    try {
      // Optimistic update
      const tempOverride: OverridePlan = {
        id: -Date.now(),
        ficha_equipo: input.ficha_equipo,
        plan_original_id: input.plan_original_id || null,
        plan_forzado_id: input.plan_forzado_id,
        motivo: input.motivo,
        usuario_email: input.usuario_email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activo: true,
      };
      setOverrides((prev) => [tempOverride, ...prev]);

      const { data, error } = await supabase
        .from('overrides_planes' as any)
        .insert([input])
        .select()
        .single();

      if (error) {
        // Revertir optimistic update
        await loadOverrides();
        throw error;
      }

      // Actualizar con datos reales
      setOverrides((prev) => prev.map((o) => (o.id === tempOverride.id ? data as unknown as OverridePlan : o)));

      toast({
        title: '✅ Override creado',
        description: `Plan manual asignado a equipo ${input.ficha_equipo}`,
      });

      return data as unknown as OverridePlan;
    } catch (error: any) {
      console.error('Error creating override:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo crear el override',
        variant: 'destructive',
      });
      throw error;
    }
  };

  /**
   * Actualizar un override existente
   */
  const actualizarOverride = async (id: number, updates: ActualizarOverrideInput) => {
    try {
      // Optimistic update
      setOverrides((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o))
      );

      const { data, error } = await supabase
        .from('overrides_planes' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        await loadOverrides();
        throw error;
      }

      toast({
        title: '✅ Override actualizado',
        description: 'Cambios guardados correctamente',
      });

      return data as unknown as OverridePlan;
    } catch (error: any) {
      console.error('Error updating override:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo actualizar el override',
        variant: 'destructive',
      });
      throw error;
    }
  };

  /**
   * Desactivar un override (volver a sugerencia automática)
   */
  const desactivarOverride = async (id: number) => {
    try {
      await actualizarOverride(id, { activo: false });

      toast({
        title: '✅ Override desactivado',
        description: 'Se volverá a usar la sugerencia automática',
      });
    } catch (error: any) {
      console.error('Error deactivating override:', error);
      throw error;
    }
  };

  /**
   * Verificar si un equipo tiene override activo
   */
  const verificarOverride = useCallback(
    (fichaEquipo: string): EquipoConOverride | null => {
      return equiposConOverride.find((e) => e.ficha_equipo === fichaEquipo) || null;
    },
    [equiposConOverride]
  );

  /**
   * Obtener override activo de un equipo usando RPC
   */
  const getOverrideActivo = async (fichaEquipo: string): Promise<OverridePlan | null> => {
    try {
      // Por ahora usar query directa hasta que se aplique la migración
      const { data, error } = await supabase
        .from('overrides_planes' as any)
        .select('*')
        .eq('ficha_equipo', fichaEquipo)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data ? (data as unknown as OverridePlan) : null;
    } catch (error: any) {
      console.error('Error getting override activo:', error);
      return null;
    }
  };

  /**
   * Obtener todos los overrides de un equipo (historial)
   */
  const getHistorialOverrides = useCallback(
    (fichaEquipo: string): OverridePlan[] => {
      return overrides.filter((o) => o.ficha_equipo === fichaEquipo);
    },
    [overrides]
  );

  /**
   * Contar overrides activos
   */
  const contarOverridesActivos = useCallback(() => {
    return overrides.filter((o) => o.activo).length;
  }, [overrides]);

  /**
   * Refrescar todo manualmente
   */
  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([loadOverrides(), loadEquiposConOverride()]);
    setLoading(false);
  };

  return {
    // Estado
    overrides,
    equiposConOverride,
    loading,

    // Acciones
    crearOverride,
    actualizarOverride,
    desactivarOverride,

    // Consultas
    verificarOverride,
    getOverrideActivo,
    getHistorialOverrides,
    contarOverridesActivos,

    // Refresh
    refreshOverrides: loadOverrides,
    refreshEquiposOverride: loadEquiposConOverride,
    refreshAll,
  };
}
