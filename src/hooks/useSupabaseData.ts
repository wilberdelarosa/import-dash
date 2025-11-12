import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  DatabaseData,
  Equipo,
  Inventario,
  MantenimientoProgramado,
  MantenimientoRealizado,
  ActualizacionHorasKm,
  Empleado,
} from '@/types/equipment';
import { DEMO_DATABASE_DATA } from '@/data/demoDatabase';

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

type ImportBundle = {
  equipos?: Equipo[];
  inventarios?: Inventario[];
  mantenimientosProgramados?: MantenimientoProgramado[];
  mantenimientosRealizados?: MantenimientoRealizado[];
  actualizacionesHorasKm?: ActualizacionHorasKm[];
  empleados?: Empleado[];
};

type EquipoPayload = Omit<Equipo, 'id'>;
type InventarioPayload = Omit<Inventario, 'id'>;

type EquipoChange = { ficha: string; cambios: string[] };
type InventarioChange = { codigo: string; cambios: string[] };
type MantenimientoChange = { ficha: string; tipo: string; cambios: string[] };

export interface SyncSummary {
  equipos: {
    inserted: string[];
    updated: EquipoChange[];
  };
  inventarios: {
    inserted: string[];
    updated: InventarioChange[];
  };
  mantenimientosProgramados: {
    inserted: string[];
    updated: MantenimientoChange[];
  };
  warnings: string[];
  totalChanges: number;
}

interface ActualizacionHorasPayload {
  mantenimientoId: number;
  horasKm: number;
  fecha?: string;
  usuarioResponsable?: string;
  observaciones?: string;
  unidad?: 'horas' | 'km';
}

interface RegistrarMantenimientoPayload {
  mantenimientoId: number;
  fecha?: string;
  horasKm: number;
  observaciones?: string;
  filtrosUtilizados?: MantenimientoRealizado['filtrosUtilizados'];
  usuarioResponsable?: string;
  unidad?: 'horas' | 'km';
}

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number' && Number.isNaN(value)) {
    return '—';
  }
  return Array.isArray(value) ? JSON.stringify(value) : String(value);
};

const describeChange = (label: string, before: unknown, after: unknown) => {
  if (before === after) {
    return null;
  }
  return `${label}: ${formatValue(before)} → ${formatValue(after)}`;
};

const mapEquipoToRow = (equipo: EquipoPayload) => ({
  ficha: equipo.ficha,
  nombre: equipo.nombre,
  marca: equipo.marca,
  modelo: equipo.modelo,
  numero_serie: equipo.numeroSerie,
  chasis: equipo.chasis,
  placa: equipo.placa,
  categoria: equipo.categoria,
  activo: equipo.activo,
  motivo_inactividad: equipo.motivoInactividad ?? null,
  capacitacion_minima: equipo.capacitacionMinima ?? null,
});

const mapInventarioToRow = (inventario: InventarioPayload) => ({
  nombre: inventario.nombre,
  tipo: inventario.tipo,
  categoria_equipo: inventario.categoriaEquipo,
  cantidad: Number(inventario.cantidad ?? 0),
  movimientos: (Array.isArray(inventario.movimientos) ? inventario.movimientos : []) as any,
  activo: inventario.activo,
  codigo_identificacion: inventario.codigoIdentificacion,
  empresa_suplidora: inventario.empresaSuplidora,
  marcas_compatibles: inventario.marcasCompatibles ?? [],
  modelos_compatibles: inventario.modelosCompatibles ?? [],
});

const mantenimientoKey = (ficha: string, tipo: string) => `${ficha}__${tipo}`.toLowerCase();

const diffEquipo = (current: Equipo, incoming: EquipoPayload) => {
  const cambios: string[] = [];
  const maybe = (label: string, before: unknown, after: unknown) => {
    const change = describeChange(label, before, after);
    if (change) cambios.push(change);
  };

  maybe('Ficha', current.ficha, incoming.ficha);
  maybe('Nombre', current.nombre, incoming.nombre);
  maybe('Marca', current.marca, incoming.marca);
  maybe('Modelo', current.modelo, incoming.modelo);
  maybe('Número de serie', current.numeroSerie, incoming.numeroSerie);
  maybe('Chasis', current.chasis, incoming.chasis);
  maybe('Placa', current.placa, incoming.placa);
  maybe('Categoría', current.categoria, incoming.categoria);
  maybe('Estado', current.activo ? 'Activo' : 'Inactivo', incoming.activo ? 'Activo' : 'Inactivo');
  maybe('Motivo inactividad', current.motivoInactividad, incoming.motivoInactividad ?? null);
  maybe('Capacitación mínima', current.capacitacionMinima, incoming.capacitacionMinima ?? null);

  return cambios;
};

const diffInventario = (current: Inventario, incoming: InventarioPayload) => {
  const cambios: string[] = [];
  const maybe = (label: string, before: unknown, after: unknown) => {
    const change = describeChange(label, before, after);
    if (change) cambios.push(change);
  };

  maybe('Código', current.codigoIdentificacion, incoming.codigoIdentificacion);
  maybe('Nombre', current.nombre, incoming.nombre);
  maybe('Tipo', current.tipo, incoming.tipo);
  maybe('Categoría', current.categoriaEquipo, incoming.categoriaEquipo);
  maybe('Cantidad', current.cantidad, incoming.cantidad);
  maybe('Estado', current.activo ? 'Activo' : 'Inactivo', incoming.activo ? 'Activo' : 'Inactivo');
  maybe('Empresa suplidora', current.empresaSuplidora, incoming.empresaSuplidora);
  maybe('Marcas compatibles', current.marcasCompatibles, incoming.marcasCompatibles);
  maybe('Modelos compatibles', current.modelosCompatibles, incoming.modelosCompatibles);

  return cambios;
};

const diffMantenimiento = (current: MantenimientoProgramado, incoming: MantenimientoPayload) => {
  const cambios: string[] = [];
  const maybe = (label: string, before: unknown, after: unknown) => {
    const change = describeChange(label, before, after);
    if (change) cambios.push(change);
  };

  maybe('Ficha', current.ficha, incoming.ficha);
  maybe('Nombre del equipo', current.nombreEquipo, incoming.nombreEquipo);
  maybe('Tipo de mantenimiento', current.tipoMantenimiento, incoming.tipoMantenimiento);
  maybe('Horas/km actuales', current.horasKmActuales, incoming.horasKmActuales);
  maybe('Frecuencia', current.frecuencia, incoming.frecuencia);
  maybe('Fecha última actualización', current.fechaUltimaActualizacion, incoming.fechaUltimaActualizacion);
  maybe('Fecha último mantenimiento', current.fechaUltimoMantenimiento, incoming.fechaUltimoMantenimiento ?? null);
  maybe('Horas último mantenimiento', current.horasKmUltimoMantenimiento, incoming.horasKmUltimoMantenimiento);
  maybe('Activo', current.activo ? 'Activo' : 'Inactivo', incoming.activo ? 'Activo' : 'Inactivo');

  return cambios;
};

const toEquipoPayload = (equipo: Equipo): EquipoPayload => ({
  ficha: equipo.ficha,
  nombre: equipo.nombre,
  marca: equipo.marca,
  modelo: equipo.modelo,
  numeroSerie: equipo.numeroSerie,
  chasis: equipo.chasis,
  placa: equipo.placa,
  categoria: equipo.categoria,
  activo: equipo.activo,
  motivoInactividad: equipo.motivoInactividad ?? null,
  capacitacionMinima: equipo.capacitacionMinima ?? null,
});

const toInventarioPayload = (inventario: Inventario): InventarioPayload => ({
  nombre: inventario.nombre,
  tipo: inventario.tipo,
  categoriaEquipo: inventario.categoriaEquipo,
  cantidad: inventario.cantidad,
  movimientos: inventario.movimientos,
  activo: inventario.activo,
  codigoIdentificacion: inventario.codigoIdentificacion,
  empresaSuplidora: inventario.empresaSuplidora,
  marcasCompatibles: inventario.marcasCompatibles,
  modelosCompatibles: inventario.modelosCompatibles,
});

const toMantenimientoPayload = (mantenimiento: MantenimientoProgramado): MantenimientoPayload => ({
  ficha: mantenimiento.ficha,
  nombreEquipo: mantenimiento.nombreEquipo,
  tipoMantenimiento: mantenimiento.tipoMantenimiento,
  horasKmActuales: mantenimiento.horasKmActuales,
  fechaUltimaActualizacion: mantenimiento.fechaUltimaActualizacion,
  frecuencia: mantenimiento.frecuencia,
  fechaUltimoMantenimiento: mantenimiento.fechaUltimoMantenimiento,
  horasKmUltimoMantenimiento: mantenimiento.horasKmUltimoMantenimiento,
  activo: mantenimiento.activo,
});

export function useSupabaseData() {
  const [data, setData] = useState<DatabaseData>({
    equipos: [],
    inventarios: [],
    mantenimientosProgramados: [],
    mantenimientosRealizados: [],
    actualizacionesHorasKm: [],
    empleados: [],
  });
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const demoToastShownRef = useRef(false);
  const demoWriteNoticeShownRef = useRef(false);

  const showDemoWriteNotice = () => {
    if (demoWriteNoticeShownRef.current) {
      return;
    }

    toast({
      title: 'Modo demostración activo',
      description:
        'Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY con credenciales válidas para habilitar los cambios en la base de datos.',
    });
    demoWriteNoticeShownRef.current = true;
  };

  const recordHistorialEvent = async ({
    tipo,
    modulo,
    descripcion,
    ficha,
    nombre,
    datosAntes,
    datosDespues,
    metadata,
    nivel = 'info',
    usuario = 'Interfaz',
    createdAt,
  }: {
    tipo: string;
    modulo: 'equipos' | 'inventarios' | 'mantenimientos' | 'sistema';
    descripcion: string;
    ficha?: string | null;
    nombre?: string | null;
    datosAntes?: any;
    datosDespues?: any;
    metadata?: any;
    nivel?: 'info' | 'warning' | 'critical';
    usuario?: string;
    createdAt?: string;
  }) => {
    try {
      if (usingDemoData) {
        return;
      }

      const payload = {
        tipo_evento: tipo,
        modulo,
        descripcion,
        ficha_equipo: ficha ?? null,
        nombre_equipo: nombre ?? null,
        usuario_responsable: usuario,
        nivel_importancia: nivel,
        datos_antes: datosAntes ?? null,
        datos_despues: datosDespues ?? null,
        metadata: metadata ?? null,
      } as const;

      if (createdAt) {
        await supabase.from('historial_eventos').insert({ ...payload, created_at: createdAt });
      } else {
        await supabase.from('historial_eventos').insert(payload);
      }
    } catch (error) {
      console.error('Error guardando evento en historial:', error);
    }
  };

  const loadData = async (showToast = false) => {
    try {
      if (usingDemoData && !showToast) {
        setData(DEMO_DATABASE_DATA);
        setLoading(false);
        return;
      }

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

          const horasPrevias = Number(
            metadata.horasPrevias ??
            datosDespues.horasPrevias ??
            metadata.horasKmAnterior ??
            0
          );

          const restante = Number(
            metadata.restante ??
            datosDespues.restante ??
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
            horasPrevias,
            restante,
            observaciones: metadata.observaciones ?? datosDespues.observaciones ?? null,
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
            observaciones: metadata.observaciones ?? datosDespues.observaciones ?? evento.descripcion ?? '',
            incrementoDesdeUltimo: Number(
              metadata.incrementoDesdeUltimo ??
              metadata.incremento ??
              datosDespues.incrementoDesdeUltimo ??
              datosDespues.incremento ??
              0
            ),
            filtrosUtilizados: filtros,
            usuarioResponsable: evento.usuario_responsable ?? metadata.usuarioResponsable ?? 'Sistema',
            horasPrevias: Number(metadata.horasPrevias ?? metadata.horasKmAnterior ?? 0),
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
          chasis: e.chasis ?? '',
          placa: e.placa,
          categoria: e.categoria,
          activo: e.activo,
          motivoInactividad: e.motivo_inactividad ?? null,
          capacitacionMinima: e.capacitacion_minima ?? null,
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
        empleados: [],
      });
      
      if (showToast) {
        toast({
          title: "Datos actualizados",
          description: "Los datos se han actualizado correctamente",
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setData(DEMO_DATABASE_DATA);
      setUsingDemoData(true);

      if (!demoToastShownRef.current) {
        toast({
          title: 'No se pudo conectar a Supabase',
          description:
            'Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Se cargaron datos de demostración para continuar.',
          variant: 'destructive',
        });
        demoToastShownRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usingDemoData) {
      setData(DEMO_DATABASE_DATA);
      setLoading(false);
      return;
    }

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
  }, [usingDemoData]);

  const clearDatabase = async () => {
    try {
      if (usingDemoData) {
        showDemoWriteNotice();
        return;
      }

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

  const createEquipo = async (equipo: EquipoPayload) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      const payload = mapEquipoToRow(equipo);
      const { data: inserted, error } = await supabase
        .from('equipos')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await recordHistorialEvent({
        tipo: 'equipo_creado',
        modulo: 'equipos',
        descripcion: `Se registró el equipo ${equipo.nombre}`,
        ficha: equipo.ficha,
        nombre: equipo.nombre,
        datosDespues: { id: inserted?.id, ...equipo },
        metadata: {
          origen: 'interfaz',
          accion: 'crear',
        },
      });

      toast({
        title: '✅ Equipo creado',
        description: `Se registró el equipo ${equipo.nombre}.`,
      });

      await loadData(true);
    } catch (error) {
      console.error('Error creating equipo:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo crear el equipo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEquipo = async (id: number, equipo: EquipoPayload) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      const existing = data.equipos.find((item) => item.id === id);
      if (!existing) {
        toast({
          title: '❌ Error',
          description: 'No se encontró el equipo seleccionado',
          variant: 'destructive',
        });
        throw new Error('Equipo no encontrado');
      }

      const cambios = diffEquipo(existing, equipo);
      if (cambios.length === 0) {
        toast({
          title: 'Sin cambios detectados',
          description: 'No se aplicaron modificaciones al equipo.',
        });
        return;
      }

      const payload = mapEquipoToRow(equipo);
      const { error } = await supabase
        .from('equipos')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      await recordHistorialEvent({
        tipo: 'equipo_actualizado',
        modulo: 'equipos',
        descripcion: `Se actualizaron datos del equipo ${equipo.nombre}`,
        ficha: equipo.ficha,
        nombre: equipo.nombre,
        datosAntes: existing,
        datosDespues: { id, ...equipo },
        metadata: { cambios },
      });

      toast({
        title: '✅ Equipo actualizado',
        description: `Se guardaron los cambios para ${equipo.nombre}.`,
      });

      await loadData(true);
    } catch (error) {
      console.error('Error updating equipo:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo actualizar el equipo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEquipo = async (id: number) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      const existing = data.equipos.find((item) => item.id === id);
      if (!existing) {
        toast({
          title: '❌ Error',
          description: 'No se encontró el equipo a eliminar',
          variant: 'destructive',
        });
        throw new Error('Equipo no encontrado');
      }

      const { error } = await supabase
        .from('equipos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await recordHistorialEvent({
        tipo: 'equipo_eliminado',
        modulo: 'equipos',
        descripcion: `Se eliminó el equipo ${existing.nombre}`,
        ficha: existing.ficha,
        nombre: existing.nombre,
        datosAntes: existing,
        metadata: { accion: 'eliminar' },
      });

      toast({
        title: '✅ Equipo eliminado',
        description: 'El equipo fue eliminado correctamente.',
      });

      await loadData(true);
    } catch (error) {
      console.error('Error deleting equipo:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo eliminar el equipo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createMantenimiento = async (mantenimiento: MantenimientoPayload) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      const payload = mapToDatabasePayload(mantenimiento);
      const { data: inserted, error } = await supabase
        .from('mantenimientos_programados')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await recordHistorialEvent({
        tipo: 'mantenimiento_creado',
        modulo: 'mantenimientos',
        descripcion: `Se creó el mantenimiento para ${mantenimiento.nombreEquipo}`,
        ficha: mantenimiento.ficha,
        nombre: mantenimiento.nombreEquipo,
        datosDespues: { id: inserted?.id, ...payload },
        metadata: { origen: 'interfaz', accion: 'crear' },
      });

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
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      const existing = data.mantenimientosProgramados.find((item) => item.id === id);
      if (!existing) {
        toast({
          title: '❌ Error',
          description: 'No se encontró el mantenimiento seleccionado',
          variant: 'destructive',
        });
        throw new Error('Mantenimiento no encontrado');
      }

      const cambios = diffMantenimiento(existing, mantenimiento);
      if (cambios.length === 0) {
        toast({
          title: 'Sin cambios detectados',
          description: 'No se aplicaron modificaciones al mantenimiento programado.',
        });
        return;
      }

      const payload = mapToDatabasePayload(mantenimiento);
      const { error } = await supabase
        .from('mantenimientos_programados')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      await recordHistorialEvent({
        tipo: 'mantenimiento_actualizado',
        modulo: 'mantenimientos',
        descripcion: `Se actualizó el mantenimiento de ${mantenimiento.nombreEquipo}`,
        ficha: mantenimiento.ficha,
        nombre: mantenimiento.nombreEquipo,
        datosAntes: existing,
        datosDespues: { id, ...payload },
        metadata: { cambios },
      });

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
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      const existing = data.mantenimientosProgramados.find((item) => item.id === id);
      if (!existing) {
        toast({
          title: '❌ Error',
          description: 'No se encontró el mantenimiento a eliminar',
          variant: 'destructive',
        });
        throw new Error('Mantenimiento no encontrado');
      }

      const { error } = await supabase
        .from('mantenimientos_programados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await recordHistorialEvent({
        tipo: 'mantenimiento_eliminado',
        modulo: 'mantenimientos',
        descripcion: `Se eliminó el mantenimiento de ${existing.nombreEquipo}`,
        ficha: existing.ficha,
        nombre: existing.nombreEquipo,
        datosAntes: existing,
        metadata: { accion: 'eliminar' },
      });

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

  const updateHorasActuales = async ({
    mantenimientoId,
    horasKm,
    fecha,
    usuarioResponsable = 'Equipo de mantenimiento',
    observaciones,
    unidad,
  }: ActualizacionHorasPayload) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    const mantenimiento = data.mantenimientosProgramados.find((m) => m.id === mantenimientoId);

    if (!mantenimiento) {
      toast({
        title: "❌ Error",
        description: "No se encontró el mantenimiento seleccionado",
        variant: "destructive",
      });
      throw new Error('Mantenimiento no encontrado');
    }

    const horasPrevias = Number(mantenimiento.horasKmActuales ?? 0);
    const horasActuales = Number(horasKm);
    const unidadLectura = unidad ?? (mantenimiento.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas');
    const incremento = horasActuales - horasPrevias;
    const fechaIso = fecha ? new Date(fecha).toISOString() : new Date().toISOString();
    const restanteCalculado = Math.max(mantenimiento.proximoMantenimiento - horasActuales, 0);

    try {
      const { error: updateError } = await supabase
        .from('mantenimientos_programados')
        .update({
          horas_km_actuales: horasActuales,
          fecha_ultima_actualizacion: fechaIso,
          horas_km_restante: restanteCalculado,
        })
        .eq('id', mantenimientoId);

      if (updateError) throw updateError;

      const descripcion = observaciones
        ? observaciones
        : `Lectura actualizada a ${horasActuales} ${unidadLectura}`;

      const metadata = {
        id: mantenimientoId,
        ficha: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo,
        horasKm: horasActuales,
        horasPrevias,
        incremento,
        fecha: fechaIso,
        usuarioResponsable,
        observaciones,
        restante: restanteCalculado,
        unidad: unidadLectura,
      };

      await recordHistorialEvent({
        tipo: 'lectura_actualizada',
        modulo: 'mantenimientos',
        descripcion,
        ficha: mantenimiento.ficha,
        nombre: mantenimiento.nombreEquipo,
        datosAntes: {
          horasKm: horasPrevias,
          fechaUltimaActualizacion: mantenimiento.fechaUltimaActualizacion,
        },
        datosDespues: {
          horasKm: horasActuales,
          incremento,
          restante: restanteCalculado,
          fecha: fechaIso,
          observaciones,
          unidad: unidadLectura,
        },
        metadata,
        usuario: usuarioResponsable,
        createdAt: fechaIso,
      });

      toast({
        title: "✅ Horas actualizadas",
        description: `Se registró la nueva lectura para ${mantenimiento.nombreEquipo}`,
      });

      await loadData(true);
    } catch (error) {
      console.error('Error updating horas actuales:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar la lectura de horas/kilómetros",
        variant: "destructive",
      });
      throw error;
    }
  };

  const registrarMantenimientoRealizado = async ({
    mantenimientoId,
    fecha,
    horasKm,
    observaciones,
    filtrosUtilizados = [],
    usuarioResponsable = 'Equipo de mantenimiento',
    unidad,
  }: RegistrarMantenimientoPayload) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    const mantenimiento = data.mantenimientosProgramados.find((m) => m.id === mantenimientoId);

    if (!mantenimiento) {
      toast({
        title: "❌ Error",
        description: "No se encontró el mantenimiento seleccionado",
        variant: "destructive",
      });
      throw new Error('Mantenimiento no encontrado');
    }

    const fechaIso = fecha ? new Date(fecha).toISOString() : new Date().toISOString();
    const lectura = Number(horasKm);
    const unidadMantenimiento = unidad ?? (mantenimiento.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas');
    const horasPrevias = Number(mantenimiento.horasKmUltimoMantenimiento ?? 0);
    const incremento = lectura - horasPrevias;
    const proximo = lectura + Number(mantenimiento.frecuencia ?? 0);
    const restante = Math.max(proximo - lectura, 0);

    try {
      const { error: updateError } = await supabase
        .from('mantenimientos_programados')
        .update({
          fecha_ultimo_mantenimiento: fechaIso,
          horas_km_ultimo_mantenimiento: lectura,
          proximo_mantenimiento: proximo,
          horas_km_restante: restante,
          horas_km_actuales: lectura,
          fecha_ultima_actualizacion: fechaIso,
        })
        .eq('id', mantenimientoId);

      if (updateError) throw updateError;

      const descripcion = observaciones
        ? observaciones
        : `Mantenimiento ${mantenimiento.tipoMantenimiento} realizado para ${mantenimiento.nombreEquipo} (${lectura} ${unidadMantenimiento})`;

      const metadata = {
        id: mantenimientoId,
        ficha: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo,
        fechaMantenimiento: fechaIso,
        horasKmAlMomento: lectura,
        horasPrevias,
        incrementoDesdeUltimo: incremento,
        filtrosUtilizados,
        usuarioResponsable,
        observaciones,
        proximoMantenimientoCalculado: proximo,
        unidad: unidadMantenimiento,
      };

      await recordHistorialEvent({
        tipo: 'mantenimiento_realizado',
        modulo: 'mantenimientos',
        descripcion,
        ficha: mantenimiento.ficha,
        nombre: mantenimiento.nombreEquipo,
        datosAntes: {
          horasKmUltimoMantenimiento: mantenimiento.horasKmUltimoMantenimiento,
          fechaUltimoMantenimiento: mantenimiento.fechaUltimoMantenimiento,
        },
        datosDespues: {
          horasKmAlMomento: lectura,
          incrementoDesdeUltimo: incremento,
          filtrosUtilizados,
          observaciones,
          fechaMantenimiento: fechaIso,
          unidad: unidadMantenimiento,
        },
        metadata,
        usuario: usuarioResponsable,
        createdAt: fechaIso,
      });

      toast({
        title: "✅ Mantenimiento registrado",
        description: `Se registró el mantenimiento de ${mantenimiento.nombreEquipo}`,
      });

      await loadData(true);
    } catch (error) {
      console.error('Error registrando mantenimiento realizado:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo registrar el mantenimiento realizado",
        variant: "destructive",
      });
      throw error;
    }
  };

  const syncImportBundle = async (bundle: ImportBundle): Promise<SyncSummary> => {
    const summary: SyncSummary = {
      equipos: { inserted: [], updated: [] },
      inventarios: { inserted: [], updated: [] },
      mantenimientosProgramados: { inserted: [], updated: [] },
      warnings: [],
      totalChanges: 0,
    };

    // Limpiar base de datos completamente antes de importar
    toast({
      title: "Limpiando base de datos...",
      description: "Eliminando todos los datos existentes incluyendo historial",
    });

    // Eliminar todos los datos existentes
    await supabase.from('notificaciones').delete().neq('id', 0);
    await supabase.from('mantenimientos_programados').delete().neq('id', 0);
    await supabase.from('inventarios').delete().neq('id', 0);
    await supabase.from('equipos').delete().neq('id', 0);
    await supabase.from('historial_eventos').delete().neq('id', 0);

    // Recargar datos vacíos
    await loadData();

    const equiposIncoming = Array.isArray(bundle.equipos) ? bundle.equipos : [];
    const inventariosIncoming = Array.isArray(bundle.inventarios) ? bundle.inventarios : [];
    const mantenimientosIncoming = Array.isArray(bundle.mantenimientosProgramados)
      ? bundle.mantenimientosProgramados
      : [];

    const equiposMap = new Map(data.equipos.map((equipo) => [equipo.ficha, equipo]));
    const inventariosMap = new Map(
      data.inventarios.map((inventario) => [inventario.codigoIdentificacion, inventario]),
    );
    const mantenimientosMap = new Map(
      data.mantenimientosProgramados.map((mantenimiento) => [
        mantenimientoKey(mantenimiento.ficha, mantenimiento.tipoMantenimiento),
        mantenimiento,
      ]),
    );

    for (const incomingEquipo of equiposIncoming) {
      if (!incomingEquipo.ficha) {
        summary.warnings.push(
          `Se ignoró un equipo sin ficha (${incomingEquipo.nombre ?? 'Sin nombre'})`,
        );
        continue;
      }

      const payloadEquipo = toEquipoPayload(incomingEquipo);
      const existing = equiposMap.get(incomingEquipo.ficha);

      if (!existing) {
        const { data: inserted, error } = await supabase
          .from('equipos')
          .insert(mapEquipoToRow(payloadEquipo))
          .select()
          .single();

        if (error) throw error;

        summary.equipos.inserted.push(incomingEquipo.ficha);
        summary.totalChanges += 1;
      } else {
        const cambios = diffEquipo(existing, payloadEquipo);
        if (cambios.length === 0) {
          continue;
        }

        const { error } = await supabase
          .from('equipos')
          .update(mapEquipoToRow(payloadEquipo))
          .eq('id', existing.id);

        if (error) throw error;

        summary.equipos.updated.push({ ficha: incomingEquipo.ficha, cambios });
        summary.totalChanges += 1;
      }
    }

    for (const incomingInventario of inventariosIncoming) {
      if (!incomingInventario.codigoIdentificacion) {
        summary.warnings.push(
          `Se ignoró un inventario sin código (${incomingInventario.nombre ?? 'Sin nombre'})`,
        );
        continue;
      }

      const payloadInventario = toInventarioPayload(incomingInventario);
      const existing = inventariosMap.get(incomingInventario.codigoIdentificacion);

      if (!existing) {
        const { error } = await supabase
          .from('inventarios')
          .insert(mapInventarioToRow(payloadInventario));

        if (error) throw error;

        summary.inventarios.inserted.push(incomingInventario.codigoIdentificacion);
        summary.totalChanges += 1;
      } else {
        const cambios = diffInventario(existing, payloadInventario);
        if (cambios.length === 0) {
          continue;
        }

        const { error } = await supabase
          .from('inventarios')
          .update(mapInventarioToRow(payloadInventario))
          .eq('id', existing.id);

        if (error) throw error;

        summary.inventarios.updated.push({
          codigo: incomingInventario.codigoIdentificacion,
          cambios,
        });
        summary.totalChanges += 1;
      }
    }

    for (const incomingMantenimiento of mantenimientosIncoming) {
      if (!incomingMantenimiento.ficha) {
        summary.warnings.push(
          `Se ignoró un mantenimiento sin ficha (${incomingMantenimiento.nombreEquipo ?? 'Sin nombre'})`,
        );
        continue;
      }

      const key = mantenimientoKey(
        incomingMantenimiento.ficha,
        incomingMantenimiento.tipoMantenimiento,
      );
      const payloadMantenimiento = toMantenimientoPayload(incomingMantenimiento);
      const existing = mantenimientosMap.get(key);

      if (!existing) {
        const { error } = await supabase
          .from('mantenimientos_programados')
          .insert(mapToDatabasePayload(payloadMantenimiento));

        if (error) throw error;

        summary.mantenimientosProgramados.inserted.push(
          `${incomingMantenimiento.ficha} · ${incomingMantenimiento.tipoMantenimiento}`,
        );
        summary.totalChanges += 1;
      } else {
        const cambios = diffMantenimiento(existing, payloadMantenimiento);
        if (cambios.length === 0) {
          continue;
        }

        const { error } = await supabase
          .from('mantenimientos_programados')
          .update(mapToDatabasePayload(payloadMantenimiento))
          .eq('id', existing.id);

        if (error) throw error;

        summary.mantenimientosProgramados.updated.push({
          ficha: incomingMantenimiento.ficha,
          tipo: incomingMantenimiento.tipoMantenimiento,
          cambios,
        });
        summary.totalChanges += 1;
      }
    }

    // Crear un solo evento resumen de la importación
    const totalEquipos = summary.equipos.inserted.length + summary.equipos.updated.length;
    const totalInventarios = summary.inventarios.inserted.length + summary.inventarios.updated.length;
    const totalMantenimientos = summary.mantenimientosProgramados.inserted.length + summary.mantenimientosProgramados.updated.length;
    
    const descripcionDetallada = `Importación masiva completada: ${totalEquipos} equipos, ${totalInventarios} inventarios, ${totalMantenimientos} mantenimientos programados`;
    
    await recordHistorialEvent({
      tipo: 'importacion_sincronizada',
      modulo: 'sistema',
      descripcion: descripcionDetallada,
      metadata: {
        ...summary,
        resumen: {
          equipos: totalEquipos,
          inventarios: totalInventarios,
          mantenimientos: totalMantenimientos
        }
      },
      nivel: summary.totalChanges > 0 ? 'info' : 'warning',
    });

    return summary;
  };

  const migrateBundleToSupabase = async (bundle: ImportBundle) => {
    const equiposLocal: Equipo[] = Array.isArray(bundle.equipos) ? bundle.equipos : [];
    const inventariosLocal: Inventario[] = Array.isArray(bundle.inventarios) ? bundle.inventarios : [];
    const mantenimientosProgramadosLocal: MantenimientoProgramado[] = Array.isArray(
      bundle.mantenimientosProgramados
    )
      ? bundle.mantenimientosProgramados
      : [];
    const mantenimientosRealizadosLocal: MantenimientoRealizado[] = Array.isArray(
      bundle.mantenimientosRealizados
    )
      ? bundle.mantenimientosRealizados
      : [];
    const actualizacionesLocal: ActualizacionHorasKm[] = Array.isArray(bundle.actualizacionesHorasKm)
      ? bundle.actualizacionesHorasKm
      : [];
    const empleadosLocal: Empleado[] = Array.isArray(bundle.empleados) ? bundle.empleados : [];

    const equiposMap = new Map<string, string | null>(
      equiposLocal.map((equipo: Equipo) => [equipo.ficha, equipo.nombre ?? null])
    );

    const empleadosMap = new Map<number, string>(
      empleadosLocal.map((empleado: Empleado) => {
        const nombreCompleto = `${empleado.nombre ?? ''} ${empleado.apellido ?? ''}`.trim();
        return [
          Number(empleado.id),
          nombreCompleto || empleado.nombre || 'Equipo de mantenimiento'
        ];
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

    for (const equipo of equiposLocal) {
      const { id, ...equipoData } = equipo;
      const { error } = await supabase.from('equipos').insert({
        ficha: equipoData.ficha,
        nombre: equipoData.nombre,
        marca: equipoData.marca,
        modelo: equipoData.modelo,
        numero_serie: equipoData.numeroSerie,
        placa: equipoData.placa,
        categoria: equipoData.categoria,
        activo: equipoData.activo,
        motivo_inactividad: equipoData.motivoInactividad ?? null,
      });
      if (error) throw error;
      equiposMigrados++;
    }

    for (const inventario of inventariosLocal) {
      const { id, ...inventarioData } = inventario;
      const { error } = await supabase.from('inventarios').insert([{
        nombre: inventarioData.tipo, // Using tipo as nombre since nombre doesn't exist in original data
        tipo: inventarioData.tipo,
        categoria_equipo: inventarioData.categoriaEquipo,
        cantidad: Number(inventarioData.cantidad ?? 0),
        movimientos: (Array.isArray(inventarioData.movimientos) ? inventarioData.movimientos : []) as any,
        activo: inventarioData.activo ?? true,
        codigo_identificacion: inventarioData.codigoIdentificacion ?? '',
        empresa_suplidora: inventarioData.empresaSuplidora ?? '',
        marcas_compatibles: inventarioData.marcasCompatibles ?? [],
        modelos_compatibles: inventarioData.modelosCompatibles ?? [],
      }]);
      if (error) throw error;
      inventariosMigrados++;
    }

    for (const mantenimiento of mantenimientosProgramadosLocal) {
      const { id, ...mantenimientoData } = mantenimiento;
      const { error } = await supabase.from('mantenimientos_programados').insert({
        ficha: mantenimientoData.ficha,
        nombre_equipo: mantenimientoData.nombreEquipo,
        tipo_mantenimiento: mantenimientoData.tipoMantenimiento,
        horas_km_actuales: Number(mantenimientoData.horasKmActuales ?? 0),
        fecha_ultima_actualizacion: mantenimientoData.fechaUltimaActualizacion,
        frecuencia: Number(mantenimientoData.frecuencia ?? 0),
        fecha_ultimo_mantenimiento: mantenimientoData.fechaUltimoMantenimiento,
        horas_km_ultimo_mantenimiento: Number(mantenimientoData.horasKmUltimoMantenimiento ?? 0),
        proximo_mantenimiento: Number(mantenimientoData.proximoMantenimiento ?? 0),
        horas_km_restante: Number(mantenimientoData.horasKmRestante ?? 0),
        activo: mantenimientoData.activo ?? true,
      });
      if (error) throw error;
      mantenimientosProgramadosMigrados++;
    }

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

      const payload = {
        tipo_evento: 'mantenimiento_realizado',
        modulo: 'mantenimientos',
        ficha_equipo: mantenimiento.ficha,
        nombre_equipo: nombreEquipo,
        usuario_responsable: empleadoNombre,
        descripcion:
          mantenimiento.observaciones || `Mantenimiento realizado al equipo ${nombreEquipo ?? mantenimiento.ficha}`,
        datos_despues: {
          horasKmAlMomento: mantenimiento.horasKmAlMomento,
          incrementoDesdeUltimo: mantenimiento.incrementoDesdeUltimo,
          filtrosUtilizados: Array.isArray(mantenimiento.filtrosUtilizados)
            ? mantenimiento.filtrosUtilizados
            : [],
        } as any,
        nivel_importancia: 'info',
        metadata: metadata as any,
      };

      const fechaIso = toISOStringIfValid(mantenimiento.fechaMantenimiento);
      const insertPayload = fechaIso ? { ...payload, created_at: fechaIso } : payload;

      const { error } = await supabase.from('historial_eventos').insert([insertPayload]);
      if (error) throw error;

      mantenimientosRealizadosMigrados++;
    }

    for (const actualizacion of actualizacionesLocal) {
      const nombreEquipo = equiposMap.get(actualizacion.ficha) ?? null;
      const responsable = actualizacion.usuarioResponsable || 'Sistema';

      const metadata = {
        ...actualizacion,
        nombreEquipo,
        usuarioResponsable: responsable,
      };

      const payload = {
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
        } as any,
        nivel_importancia: Number(actualizacion.incremento ?? 0) < 0 ? 'warning' : 'info',
        metadata: metadata as any,
      };

      const fechaIso = toISOStringIfValid(actualizacion.fecha);
      const insertPayload = fechaIso ? { ...payload, created_at: fechaIso } : payload;

      const { error } = await supabase.from('historial_eventos').insert([insertPayload]);
      if (error) throw error;

      actualizacionesMigradas++;
    }

    return {
      equiposMigrados,
      inventariosMigrados,
      mantenimientosProgramadosMigrados,
      mantenimientosRealizadosMigrados,
      actualizacionesMigradas,
    };
  };

  const migrateFromLocalStorage = async () => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

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

      const localData = JSON.parse(stored);
      const summary = await migrateBundleToSupabase(localData);

      await loadData();

      toast({
        title: "✅ Migración completada",
        description: `Se migraron ${summary.equiposMigrados} equipos, ${summary.inventariosMigrados} inventarios, ${summary.mantenimientosProgramadosMigrados} mantenimientos programados, ${summary.mantenimientosRealizadosMigrados} mantenimientos realizados y ${summary.actualizacionesMigradas} actualizaciones de horas/kilómetros`,
      });
    } catch (error) {
      console.error('Error migrating data:', error);
      toast({
        title: "❌ Error en migración",
        description: "Error al migrar los datos. Por favor intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const importJsonData = async (bundle: ImportBundle) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      setIsMigrating(true);

      const summary = await migrateBundleToSupabase(bundle);

      await loadData();

      toast({
        title: "✅ Importación completada",
        description: `Se importaron ${summary.equiposMigrados} equipos, ${summary.inventariosMigrados} inventarios, ${summary.mantenimientosProgramadosMigrados} mantenimientos programados, ${summary.mantenimientosRealizadosMigrados} mantenimientos realizados y ${summary.actualizacionesMigradas} actualizaciones de horas/kilómetros`,
      });
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "❌ Error en importación",
        description: "Error al importar los datos. Por favor intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const syncJsonData = async (bundle: ImportBundle) => {
    if (usingDemoData) {
      showDemoWriteNotice();
      return;
    }

    try {
      setIsMigrating(true);

      const summary = await syncImportBundle(bundle);

      await loadData();

      return summary;
    } catch (error) {
      console.error('Error synchronizing import:', error);
      toast({
        title: '❌ Error en sincronización',
        description: 'No se pudieron sincronizar los datos importados.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    data,
    loading,
    isMigrating,
    usingDemoData,
    loadData,
    migrateFromLocalStorage,
    importJsonData,
    syncJsonData,
    clearDatabase,
    createEquipo,
    updateEquipo,
    deleteEquipo,
    createMantenimiento,
    updateMantenimiento,
    deleteMantenimiento,
    updateHorasActuales,
    registrarMantenimientoRealizado,
  };
}
