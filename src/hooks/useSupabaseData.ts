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
    mantenimientosProgramados: [],
    mantenimientosRealizados: [],
    actualizacionesHorasKm: [],
  });
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setLoading(true);

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

      const { data: historialData, error: historialError } = await supabase
        .from('historial_eventos')
        .select('*')
        .in('tipo_evento', ['mantenimiento_realizado', 'lectura_actualizada'])
        .order('created_at', { ascending: true });

      if (historialError) throw historialError;

      const actualizacionesHorasKm = (historialData || [])
        .filter(evento => evento.tipo_evento === 'lectura_actualizada')
        .map(evento => {
          const metadata = (evento.metadata as any) ?? {};
          const datosDespues = (evento.datos_despues as any) ?? {};

          const horas = Number(
            metadata.horasKm ??
            metadata.horas_km ??
            datosDespues.horasKm ??
            datosDespues.horas_km ??
            metadata.horasKmAlMomento ??
            0
          );

          const incremento = Number(
            metadata.incremento ??
            metadata.incrementoDesdeUltimo ??
            datosDespues.incremento ??
            datosDespues.incrementoDesdeUltimo ??
            0
          );

          return {
            id: Number(evento.id),
            ficha: evento.ficha_equipo ?? metadata.ficha ?? '',
            nombreEquipo: evento.nombre_equipo ?? metadata.nombreEquipo ?? null,
            fecha: metadata.fecha ?? metadata.fechaMantenimiento ?? evento.created_at,
            horasKm: horas,
            incremento,
            usuarioResponsable: evento.usuario_responsable ?? metadata.usuarioResponsable ?? 'Sistema',
          };
        });

      const mantenimientosRealizados = (historialData || [])
        .filter(evento => evento.tipo_evento === 'mantenimiento_realizado')
        .map(evento => {
          const metadata = (evento.metadata as any) ?? {};
          const datosDespues = (evento.datos_despues as any) ?? {};
          const filtros = Array.isArray(metadata.filtrosUtilizados)
            ? metadata.filtrosUtilizados
            : Array.isArray(datosDespues.filtrosUtilizados)
            ? datosDespues.filtrosUtilizados
            : [];

          return {
            id: Number(metadata.id ?? evento.id),
            ficha: evento.ficha_equipo ?? metadata.ficha ?? '',
            nombreEquipo: evento.nombre_equipo ?? metadata.nombreEquipo ?? null,
            fechaMantenimiento: metadata.fechaMantenimiento ?? metadata.fecha ?? evento.created_at,
            horasKmAlMomento: Number(
              metadata.horasKmAlMomento ??
              metadata.horasKm ??
              datosDespues.horasKmAlMomento ??
              datosDespues.horasKm ??
              0
            ),
            idEmpleado: metadata.idEmpleado ?? metadata.empleadoId ?? null,
            observaciones: metadata.observaciones ?? evento.descripcion ?? '',
            incrementoDesdeUltimo: Number(
              metadata.incrementoDesdeUltimo ??
              metadata.incremento ??
              datosDespues.incrementoDesdeUltimo ??
              datosDespues.incremento ??
              0
            ),
            filtrosUtilizados: filtros,
            usuarioResponsable: evento.usuario_responsable ?? metadata.usuarioResponsable ?? 'Sistema',
          };
        });

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
        })),
        mantenimientosRealizados,
        actualizacionesHorasKm,
      });
      
      if (showToast) {
        toast({
          title: "Datos actualizados",
          description: "Los datos se han actualizado correctamente",
        });
      }
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
    
    // Configurar Supabase Realtime para actualizaciones en tiempo real
    const equiposChannel = supabase
      .channel('equipos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos' }, () => {
        loadData();
      })
      .subscribe();

    const inventariosChannel = supabase
      .channel('inventarios-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventarios' }, () => {
        loadData();
      })
      .subscribe();

    const mantenimientosChannel = supabase
      .channel('mantenimientos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mantenimientos_programados' }, () => {
        loadData();
      })
      .subscribe();

    const historialChannel = supabase
      .channel('historial-changes-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historial_eventos' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(equiposChannel);
      supabase.removeChannel(inventariosChannel);
      supabase.removeChannel(mantenimientosChannel);
      supabase.removeChannel(historialChannel);
    };
  }, []);

  const clearDatabase = async () => {
    try {
      setLoading(true);
      
      toast({
        title: "Limpiando base de datos...",
        description: "Por favor espera mientras se eliminan los datos",
      });

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

      await supabase
        .from('historial_eventos')
        .delete()
        .neq('id', 0);

      await supabase
        .from('notificaciones')
        .delete()
        .neq('id', 0);

      toast({
        title: "✅ Éxito",
        description: "Todos los datos fueron eliminados de la base de datos.",
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron eliminar los datos",
        variant: "destructive",
      });
    } finally {
      await loadData(true);
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
        title: "✅ Mantenimiento creado",
        description: `Se creó el mantenimiento para ${mantenimiento.nombreEquipo}`,
      });

      await loadData(true);
    } catch (error) {
      console.error('Error creating mantenimiento:', error);
      toast({
        title: "❌ Error",
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
        title: "✅ Mantenimiento actualizado",
        description: `Se actualizó el mantenimiento de ${mantenimiento.nombreEquipo}`,
      });

      await loadData(true);
    } catch (error) {
      console.error('Error updating mantenimiento:', error);
      toast({
        title: "❌ Error",
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
        title: "✅ Mantenimiento eliminado",
        description: "El mantenimiento fue eliminado correctamente",
      });

      await loadData(true);
    } catch (error) {
      console.error('Error deleting mantenimiento:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el mantenimiento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const migrateFromLocalStorage = async () => {
    try {
      setIsMigrating(true);
      const stored = localStorage.getItem('equipment-management-data');
      if (!stored) {
        toast({
          title: "ℹ️ Sin datos",
          description: "No hay datos en localStorage para migrar",
        });
        return;
      }

      toast({
        title: "🔄 Migrando datos...",
        description: "Por favor espera, esto puede tomar unos momentos",
      });

      const localData = JSON.parse(stored);

      const equiposLocal = Array.isArray(localData.equipos) ? localData.equipos : [];
      const inventariosLocal = Array.isArray(localData.inventarios) ? localData.inventarios : [];
      const mantenimientosProgramadosLocal = Array.isArray(localData.mantenimientosProgramados) ? localData.mantenimientosProgramados : [];
      const mantenimientosRealizadosLocal = Array.isArray(localData.mantenimientosRealizados) ? localData.mantenimientosRealizados : [];
      const actualizacionesLocal = Array.isArray(localData.actualizacionesHorasKm) ? localData.actualizacionesHorasKm : [];
      const empleadosLocal = Array.isArray(localData.empleados) ? localData.empleados : [];

      const equiposMap = new Map<string, string | null>(
        equiposLocal.map((equipo: any) => [equipo.ficha, equipo.nombre ?? null])
      );

      const empleadosMap = new Map<number, string>(
        empleadosLocal.map((empleado: any) => {
          const nombreCompleto = `${empleado.nombre ?? ''} ${empleado.apellido ?? ''}`.trim();
          return [Number(empleado.id), nombreCompleto || empleado.nombre || 'Equipo de mantenimiento'];
        })
      );

      const toISOStringIfValid = (valor?: string | null) => {
        if (!valor) return undefined;
        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString();
      };

      let equiposMigrados = 0;
      let inventariosMigrados = 0;
      let mantenimientosProgramadosMigrados = 0;
      let mantenimientosRealizadosMigrados = 0;
      let actualizacionesMigradas = 0;

      // Migrar equipos
      for (const equipo of equiposLocal) {
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
        equiposMigrados++;
      }

      // Migrar inventarios
      for (const inventario of inventariosLocal) {
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
        inventariosMigrados++;
      }

      // Migrar mantenimientos programados
      for (const mantenimiento of mantenimientosProgramadosLocal) {
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
        mantenimientosProgramadosMigrados++;
      }

      // Migrar mantenimientos realizados al historial
      for (const mantenimiento of mantenimientosRealizadosLocal) {
        const nombreEquipo = equiposMap.get(mantenimiento.ficha) ?? null;
        const empleadoNombre = mantenimiento.idEmpleado
          ? empleadosMap.get(Number(mantenimiento.idEmpleado)) ?? `Empleado ${mantenimiento.idEmpleado}`
          : mantenimiento.usuarioResponsable || 'Equipo de mantenimiento';

        const metadata = {
          ...mantenimiento,
          nombreEquipo,
          usuarioResponsable: empleadoNombre,
        };

        const payload: any = {
          tipo_evento: 'mantenimiento_realizado',
          modulo: 'mantenimientos',
          ficha_equipo: mantenimiento.ficha,
          nombre_equipo: nombreEquipo,
          usuario_responsable: empleadoNombre,
          descripcion: mantenimiento.observaciones || `Mantenimiento realizado al equipo ${nombreEquipo ?? mantenimiento.ficha}`,
          datos_despues: {
            horasKmAlMomento: mantenimiento.horasKmAlMomento,
            incrementoDesdeUltimo: mantenimiento.incrementoDesdeUltimo,
            filtrosUtilizados: mantenimiento.filtrosUtilizados ?? [],
          },
          nivel_importancia: 'info',
          metadata,
        };

        const fechaIso = toISOStringIfValid(mantenimiento.fechaMantenimiento);
        if (fechaIso) {
          payload.created_at = fechaIso;
        }

        const { error } = await supabase.from('historial_eventos').insert(payload);
        if (error) throw error;

        mantenimientosRealizadosMigrados++;
      }

      // Migrar actualizaciones de horas/km al historial
      for (const actualizacion of actualizacionesLocal) {
        const nombreEquipo = equiposMap.get(actualizacion.ficha) ?? null;
        const responsable = actualizacion.usuarioResponsable || actualizacion.responsable || 'Sistema';

        const metadata = {
          ...actualizacion,
          nombreEquipo,
          usuarioResponsable: responsable,
        };

        const payload: any = {
          tipo_evento: 'lectura_actualizada',
          modulo: 'mantenimientos',
          ficha_equipo: actualizacion.ficha,
          nombre_equipo: nombreEquipo,
          usuario_responsable: responsable,
          descripcion: nombreEquipo
            ? `Lectura actualizada para ${nombreEquipo}: ${actualizacion.horasKm}`
            : `Lectura actualizada a ${actualizacion.horasKm}`,
          datos_despues: {
            horasKm: actualizacion.horasKm,
            incremento: actualizacion.incremento,
          },
          nivel_importancia: actualizacion.incremento < 0 ? 'warning' : 'info',
          metadata,
        };

        const fechaIso = toISOStringIfValid(actualizacion.fecha);
        if (fechaIso) {
          payload.created_at = fechaIso;
        }

        const { error } = await supabase.from('historial_eventos').insert(payload);
        if (error) throw error;

        actualizacionesMigradas++;
      }

      toast({
        title: "✅ Migración completada",
        description: `Se migraron ${equiposMigrados} equipos, ${inventariosMigrados} inventarios, ${mantenimientosProgramadosMigrados} mantenimientos programados, ${mantenimientosRealizadosMigrados} mantenimientos realizados y ${actualizacionesMigradas} actualizaciones de horas/kilómetros`,
      });

      await loadData(true);
    } catch (error) {
      console.error('Error migrating data:', error);
      toast({
        title: "❌ Error en migración",
        description: "Error al migrar los datos. Por favor intenta de nuevo",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    data,
    loading,
    isMigrating,
    loadData,
    migrateFromLocalStorage,
    clearDatabase,
    createMantenimiento,
    updateMantenimiento,
    deleteMantenimiento
  };
}
