import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DatabaseData } from '@/types/equipment';

type MantenimientoPayload = {
  ficha: string;
  nombreEquipo: string;
  tipoMantenimiento: string;
  horasKmActuales: number;
  fechaUltimaActualizacion: string;
  frecuencia: number;
  fechaUltimoMantenimiento: string | null;
  horasKmUltimoMantenimiento: number;
  activo: boolean;
};

export function useSupabaseData() {
  const [data, setData] = useState<DatabaseData>({
    equipos: [],
    inventarios: [],
    mantenimientosProgramados: []
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar equipos
      const { data: equiposData, error: equiposError } = await supabase
        .from('equipos')
        .select('*')
        .order('id', { ascending: true });

      if (equiposError) throw equiposError;

      // Cargar inventarios
      const { data: inventariosData, error: inventariosError } = await supabase
        .from('inventarios')
        .select('*')
        .order('id', { ascending: true });

      if (inventariosError) throw inventariosError;

      // Cargar mantenimientos programados
      const { data: mantenimientosData, error: mantenimientosError } = await supabase
        .from('mantenimientos_programados')
        .select('*')
        .order('id', { ascending: true });

      if (mantenimientosError) throw mantenimientosError;

      setData({
        equipos: equiposData.map(e => ({
          id: Number(e.id),
          ficha: e.ficha,
          nombre: e.nombre,
          marca: e.marca,
          modelo: e.modelo,
          numeroSerie: e.numero_serie,
          placa: e.placa,
          categoria: e.categoria,
          activo: e.activo,
          motivoInactividad: e.motivo_inactividad
        })),
        inventarios: inventariosData.map(i => ({
          id: Number(i.id),
          nombre: i.nombre,
          tipo: i.tipo,
          categoriaEquipo: i.categoria_equipo,
          cantidad: i.cantidad,
          movimientos: i.movimientos as any[],
          activo: i.activo,
          codigoIdentificacion: i.codigo_identificacion,
          empresaSuplidora: i.empresa_suplidora,
          marcasCompatibles: i.marcas_compatibles || [],
          modelosCompatibles: i.modelos_compatibles || []
        })),
        mantenimientosProgramados: mantenimientosData.map(m => ({
          id: Number(m.id),
          ficha: m.ficha,
          nombreEquipo: m.nombre_equipo,
          tipoMantenimiento: m.tipo_mantenimiento,
          horasKmActuales: Number(m.horas_km_actuales),
          fechaUltimaActualizacion: m.fecha_ultima_actualizacion,
          frecuencia: Number(m.frecuencia),
          fechaUltimoMantenimiento: m.fecha_ultimo_mantenimiento,
          horasKmUltimoMantenimiento: Number(m.horas_km_ultimo_mantenimiento),
          proximoMantenimiento: Number(m.proximo_mantenimiento),
          horasKmRestante: Number(m.horas_km_restante),
          activo: m.activo
        }))
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearDatabase = async () => {
    try {
      setLoading(true);

      await supabase
        .from('mantenimientos_programados')
        .delete()
        .neq('id', 0);

      await supabase
        .from('inventarios')
        .delete()
        .neq('id', 0);

      await supabase
        .from('equipos')
        .delete()
        .neq('id', 0);

      toast({
        title: "Éxito",
        description: "Todos los datos fueron eliminados de la base de datos.",
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los datos",
        variant: "destructive",
      });
    } finally {
      await loadData();
    }
  };

  const mapToDatabasePayload = (mantenimiento: MantenimientoPayload) => {
    const proximo = mantenimiento.horasKmUltimoMantenimiento + mantenimiento.frecuencia;
    const restante = proximo - mantenimiento.horasKmActuales;

    return {
      ficha: mantenimiento.ficha,
      nombre_equipo: mantenimiento.nombreEquipo,
      tipo_mantenimiento: mantenimiento.tipoMantenimiento,
      horas_km_actuales: mantenimiento.horasKmActuales,
      fecha_ultima_actualizacion: mantenimiento.fechaUltimaActualizacion,
      frecuencia: mantenimiento.frecuencia,
      fecha_ultimo_mantenimiento: mantenimiento.fechaUltimoMantenimiento,
      horas_km_ultimo_mantenimiento: mantenimiento.horasKmUltimoMantenimiento,
      proximo_mantenimiento: proximo,
      horas_km_restante: restante,
      activo: mantenimiento.activo,
    };
  };

  const createMantenimiento = async (mantenimiento: MantenimientoPayload) => {
    try {
      const payload = mapToDatabasePayload(mantenimiento);
      const { error } = await supabase
        .from('mantenimientos_programados')
        .insert(payload);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Mantenimiento creado correctamente",
      });

      await loadData();
    } catch (error) {
      console.error('Error creating mantenimiento:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el mantenimiento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMantenimiento = async (id: number, mantenimiento: MantenimientoPayload) => {
    try {
      const payload = mapToDatabasePayload(mantenimiento);
      const { error } = await supabase
        .from('mantenimientos_programados')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Mantenimiento actualizado correctamente",
      });

      await loadData();
    } catch (error) {
      console.error('Error updating mantenimiento:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el mantenimiento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteMantenimiento = async (id: number) => {
    try {
      const { error } = await supabase
        .from('mantenimientos_programados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Mantenimiento eliminado correctamente",
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting mantenimiento:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mantenimiento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const migrateFromLocalStorage = async () => {
    try {
      const stored = localStorage.getItem('equipment-management-data');
      if (!stored) {
        toast({
          title: "Info",
          description: "No hay datos en localStorage para migrar",
        });
        return;
      }

      const localData = JSON.parse(stored);

      // Migrar equipos
      for (const equipo of localData.equipos || []) {
        const { id, ...equipoData } = equipo;
        await supabase.from('equipos').insert({
          ficha: equipoData.ficha,
          nombre: equipoData.nombre,
          marca: equipoData.marca,
          modelo: equipoData.modelo,
          numero_serie: equipoData.numeroSerie,
          placa: equipoData.placa,
          categoria: equipoData.categoria,
          activo: equipoData.activo,
          motivo_inactividad: equipoData.motivoInactividad
        });
      }

      // Migrar inventarios
      for (const inventario of localData.inventarios || []) {
        const { id, ...inventarioData } = inventario;
        await supabase.from('inventarios').insert({
          nombre: inventarioData.nombre,
          tipo: inventarioData.tipo,
          categoria_equipo: inventarioData.categoriaEquipo,
          cantidad: inventarioData.cantidad,
          movimientos: inventarioData.movimientos,
          activo: inventarioData.activo,
          codigo_identificacion: inventarioData.codigoIdentificacion,
          empresa_suplidora: inventarioData.empresaSuplidora,
          marcas_compatibles: inventarioData.marcasCompatibles,
          modelos_compatibles: inventarioData.modelosCompatibles
        });
      }

      // Migrar mantenimientos
      for (const mantenimiento of localData.mantenimientosProgramados || []) {
        const { id, ...mantenimientoData } = mantenimiento;
        await supabase.from('mantenimientos_programados').insert({
          ficha: mantenimientoData.ficha,
          nombre_equipo: mantenimientoData.nombreEquipo,
          tipo_mantenimiento: mantenimientoData.tipoMantenimiento,
          horas_km_actuales: mantenimientoData.horasKmActuales,
          fecha_ultima_actualizacion: mantenimientoData.fechaUltimaActualizacion,
          frecuencia: mantenimientoData.frecuencia,
          fecha_ultimo_mantenimiento: mantenimientoData.fechaUltimoMantenimiento,
          horas_km_ultimo_mantenimiento: mantenimientoData.horasKmUltimoMantenimiento,
          proximo_mantenimiento: mantenimientoData.proximoMantenimiento,
          horas_km_restante: mantenimientoData.horasKmRestante,
          activo: mantenimientoData.activo
        });
      }

      toast({
        title: "Éxito",
        description: "Datos migrados correctamente desde localStorage",
      });

      await loadData();
    } catch (error) {
      console.error('Error migrating data:', error);
      toast({
        title: "Error",
        description: "Error al migrar los datos",
        variant: "destructive"
      });
    }
  };

  return {
    data,
    loading,
    loadData,
    migrateFromLocalStorage,
    clearDatabase,
    createMantenimiento,
    updateMantenimiento,
    deleteMantenimiento
  };
}
