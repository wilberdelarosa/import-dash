/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { KitMantenimiento, KitPieza, KitConPiezas } from '@/types/maintenance-plans';

export function useKits() {
  const [kits, setKits] = useState<KitConPiezas[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadKits = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: kitsData, error: kitsError } = await supabase
        .from('kits_mantenimiento')
        .select('*')
        .order('nombre');

      if (kitsError) throw kitsError;

      const { data: piezasData, error: piezasError } = await supabase
        .from('kit_piezas')
        .select('*');

      if (piezasError) throw piezasError;

      const kitsConPiezas = (kitsData || []).map(kit => ({
        ...kit,
        piezas: (piezasData || []).filter(pieza => pieza.kit_id === kit.id)
      }));

      setKits(kitsConPiezas);
    } catch (error: any) {
      console.error('Error loading kits:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los kits de mantenimiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKits();

    const channel = supabase
      .channel('kits-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kits_mantenimiento' }, () => loadKits())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kit_piezas' }, () => loadKits())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadKits]);

  const createKit = async (kit: Omit<KitMantenimiento, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('kits_mantenimiento')
        .insert([kit])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Kit creado',
        description: 'El kit de mantenimiento se creó correctamente',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating kit:', error);
      toast({
        title: 'Error',
        description: error.message.includes('duplicate') ? 'Ya existe un kit con ese código' : 'No se pudo crear el kit',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateKit = async (id: number, kit: Partial<KitMantenimiento>) => {
    try {
      const { error } = await supabase
        .from('kits_mantenimiento')
        .update(kit)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Kit actualizado',
        description: 'El kit se actualizó correctamente',
      });
    } catch (error: any) {
      console.error('Error updating kit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el kit',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteKit = async (id: number) => {
    try {
      const { error } = await supabase
        .from('kits_mantenimiento')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Kit eliminado',
        description: 'El kit se eliminó correctamente',
      });
    } catch (error: any) {
      console.error('Error deleting kit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el kit',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createPieza = async (pieza: Omit<KitPieza, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('kit_piezas')
        .insert([pieza])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Pieza agregada',
        description: 'La pieza se agregó al kit',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating piece:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar la pieza',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePieza = async (id: number, pieza: Partial<KitPieza>) => {
    try {
      const { error } = await supabase
        .from('kit_piezas')
        .update(pieza)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Pieza actualizada',
        description: 'La pieza se actualizó correctamente',
      });
    } catch (error: any) {
      console.error('Error updating piece:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la pieza',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deletePieza = async (id: number) => {
    try {
      const { error } = await supabase
        .from('kit_piezas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Pieza eliminada',
        description: 'La pieza se eliminó del kit',
      });
    } catch (error: any) {
      console.error('Error deleting piece:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la pieza',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    kits,
    loading,
    createKit,
    updateKit,
    deleteKit,
    createPieza,
    updatePieza,
    deletePieza,
    refreshKits: loadKits,
  };
}
