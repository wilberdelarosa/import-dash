import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MantenimientoProgramado } from '@/types/equipment';
import { ITEMS_PER_PAGE } from '@/lib/constants';

interface UseMantenimientosPaginadosOptions {
  filterFicha?: string;
  filterEstado?: 'todos' | 'proximos' | 'vencidos' | 'completados';
  orderBy?: 'horas_km_restante' | 'created_at' | 'tipo_mantenimiento';
  orderDirection?: 'asc' | 'desc';
}

export function useMantenimientosPaginados(options: UseMantenimientosPaginadosOptions = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const {
    filterFicha,
    filterEstado = 'todos',
    orderBy = 'horas_km_restante',
    orderDirection = 'asc',
  } = options;

  const loadMantenimientos = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('mantenimientos_programados')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filterFicha) {
        query = query.ilike('ficha', `%${filterFicha}%`);
      }

      switch (filterEstado) {
        case 'proximos':
          query = query
            .gt('horas_km_restante', 0)
            .lte('horas_km_restante', 100);
          break;
        case 'vencidos':
          query = query.lt('horas_km_restante', 0);
          break;
        case 'completados':
          query = query.eq('activo', false);
          break;
        case 'todos':
        default:
          query = query.eq('activo', true);
          break;
      }

      // Aplicar ordenamiento
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Aplicar paginación
      query = query.range(from, to);

      const { data: mantenimientos, error, count } = await query;

      if (error) throw error;

      setData(mantenimientos || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error loading mantenimientos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mantenimientos',
        variant: 'destructive',
      });
      setData([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, filterFicha, filterEstado, orderBy, orderDirection, toast]);

  useEffect(() => {
    loadMantenimientos();
  }, [loadMantenimientos]);

  // Reset a página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [filterFicha, filterEstado, orderBy, orderDirection]);

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const refresh = useCallback(() => {
    loadMantenimientos();
  }, [loadMantenimientos]);

  return {
    data,
    loading,
    page,
    totalPages,
    totalCount,
    setPage,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    itemsPerPage: ITEMS_PER_PAGE,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    startIndex: (page - 1) * ITEMS_PER_PAGE + 1,
    endIndex: Math.min(page * ITEMS_PER_PAGE, totalCount),
  };
}
