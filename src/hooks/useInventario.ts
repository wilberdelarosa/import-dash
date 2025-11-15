import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InventarioItem {
  id: number;
  nombre: string;
  tipo: string;
  categoria_equipo: string;
  codigo_identificacion: string;
  numero_parte: string;
  sistema: string | null;
  marca_fabricante: string | null;
  empresa_suplidora: string;
  cantidad: number;
  stock_minimo: number;
  ubicacion: string | null;
  activo: boolean;
  movimientos: any;
  created_at: string;
}

export function useInventario() {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadInventario = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventarios')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setInventario(data || []);
    } catch (error: any) {
      console.error('Error loading inventario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el inventario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventario();

    const channel = supabase
      .channel('inventario-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventarios' }, loadInventario)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createItem = async (item: Omit<InventarioItem, 'id' | 'created_at' | 'movimientos'>) => {
    try {
      const { data, error } = await supabase
        .from('inventarios')
        .insert([{ ...item, movimientos: [] }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Item creado',
        description: 'El item se agregó al inventario',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate') ? 'Ya existe un item con ese código' : 'No se pudo crear el item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateItem = async (id: number, item: Partial<InventarioItem>) => {
    try {
      const { error } = await supabase
        .from('inventarios')
        .update(item)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Item actualizado',
        description: 'El item se actualizó correctamente',
      });
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('inventarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Item eliminado',
        description: 'El item se eliminó del inventario',
      });
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    inventario,
    loading,
    createItem,
    updateItem,
    deleteItem,
    refreshInventario: loadInventario,
  };
}
