import { useState, useEffect } from 'react';
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

type EntityChangeSummary = {
  added: string[];
  updated: string[];
  unchanged: string[];
};

interface SyncSummary {
  equipos: EntityChangeSummary;
  inventarios: EntityChangeSummary;
  mantenimientosProgramados: EntityChangeSummary;
  empleados: EntityChangeSummary;
  historial: {
    mantenimientosRealizados: number;
    lecturasRegistradas: number;
    omitidos: number;
  };
}

interface ActualizacionHorasPayload {
  mantenimientoId: number;
  horasKm: number;
  fecha?: string;
  usuarioResponsable?: string;
  observaciones?: string;
}

interface RegistrarMantenimientoPayload {
  mantenimientoId: number;
  fecha?: string;
  horasKm: number;
  observaciones?: string;
  filtrosUtilizados?: MantenimientoRealizado['filtrosUtilizados'];
  usuarioResponsable?: string;
}

interface HistorialLogPayload {
  tipoEvento: string;
  modulo: string;
  descripcion: string;
  fichaEquipo?: string | null;
  nombreEquipo?: string | null;
  usuarioResponsable?: string;
  datosAntes?: unknown;
  datosDespues?: unknown;
  metadata?: Record<string, unknown>;
  nivel?: 'info' | 'warning' | 'critical';
  fecha?: string;
}

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

      const { data: empleadosData, error: empleadosError } = await supabase
        .from('empleados')
        .select('*')
        .order('id', { ascending: true });

      if (empleadosError) throw empleadosError;

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
        empleados: (empleadosData ?? []).map((empleado) => ({
          id: Number(empleado.id),
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          cargo: empleado.cargo,
          categoria: empleado.categoria,
          fechaNacimiento: empleado.fecha_nacimiento ?? '',
          activo: Boolean(empleado.activo),
          email: empleado.email,
          telefono: empleado.telefono,
        })),
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

  const logHistorialEvent = async ({
    tipoEvento,
    modulo,
    descripcion,
    fichaEquipo = null,
    nombreEquipo = null,
    usuarioResponsable = 'Sistema',
    datosAntes = null,
    datosDespues = null,
    metadata = {},
    nivel = 'info',
    fecha,
  }: HistorialLogPayload) => {
    try {
      const createdAt = fecha ? new Date(fecha).toISOString() : new Date().toISOString();
      const payload = {
        tipo_evento: tipoEvento,
        modulo,
        descripcion,
        ficha_equipo: fichaEquipo,
        nombre_equipo: nombreEquipo,
        usuario_responsable: usuarioResponsable,
        nivel_importancia: nivel,
        datos_antes: datosAntes,
        datos_despues: datosDespues,
        metadata,
        created_at: createdAt,
      };

      const { error } = await supabase.from('historial_eventos').insert([payload]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error logging historial event:', error);
    }
  };

  const toISOStringIfValid = (valor?: string | null) => {
    if (!valor) return undefined;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString();
  };

  const syncJsonData = async (
    bundle: ImportBundle,
    options: { silent?: boolean; mode?: 'sync' | 'migrate' } = {}
  ): Promise<SyncSummary> => {
    const { silent = false } = options;

    const summary: SyncSummary = {
      equipos: { added: [], updated: [], unchanged: [] },
      inventarios: { added: [], updated: [], unchanged: [] },
      mantenimientosProgramados: { added: [], updated: [], unchanged: [] },
      empleados: { added: [], updated: [], unchanged: [] },
      historial: {
        mantenimientosRealizados: 0,
        lecturasRegistradas: 0,
        omitidos: 0,
      },
    };

    const equiposBundle = Array.isArray(bundle.equipos) ? bundle.equipos : [];
    const inventariosBundle = Array.isArray(bundle.inventarios) ? bundle.inventarios : [];
    const mantenimientosBundle = Array.isArray(bundle.mantenimientosProgramados)
      ? bundle.mantenimientosProgramados
      : [];
    const mantenimientosRealizadosBundle = Array.isArray(bundle.mantenimientosRealizados)
      ? bundle.mantenimientosRealizados
      : [];
    const actualizacionesBundle = Array.isArray(bundle.actualizacionesHorasKm)
      ? bundle.actualizacionesHorasKm
      : [];
    const empleadosBundle = Array.isArray(bundle.empleados) ? bundle.empleados : [];

    const normalizeEquipo = (equipo: Equipo): Equipo => ({
      id: Number(equipo.id ?? 0),
      ficha: equipo.ficha,
      nombre: equipo.nombre,
      marca: equipo.marca,
      modelo: equipo.modelo,
      numeroSerie: equipo.numeroSerie,
      placa: equipo.placa,
      categoria: equipo.categoria,
      activo: Boolean(equipo.activo ?? true),
      motivoInactividad: equipo.motivoInactividad ?? null,
    });

    const hasEquipoChanges = (a: Equipo, b: Equipo) =>
      a.nombre !== b.nombre ||
      a.marca !== b.marca ||
      a.modelo !== b.modelo ||
      a.numeroSerie !== b.numeroSerie ||
      a.placa !== b.placa ||
      a.categoria !== b.categoria ||
      a.activo !== b.activo ||
      (a.motivoInactividad ?? '') !== (b.motivoInactividad ?? '');

    const normalizeInventario = (inventario: Inventario): Inventario => ({
      id: Number(inventario.id ?? 0),
      nombre: inventario.nombre ?? inventario.tipo,
      tipo: inventario.tipo ?? inventario.nombre,
      categoriaEquipo: inventario.categoriaEquipo ?? '',
      cantidad: Number(inventario.cantidad ?? 0),
      movimientos: Array.isArray(inventario.movimientos) ? inventario.movimientos : [],
      activo: inventario.activo ?? true,
      codigoIdentificacion: inventario.codigoIdentificacion ?? '',
      empresaSuplidora: inventario.empresaSuplidora ?? '',
      marcasCompatibles: inventario.marcasCompatibles ?? [],
      modelosCompatibles: inventario.modelosCompatibles ?? [],
    });

    const mapInventarioToDatabase = (inventario: Inventario) => ({
      nombre: inventario.nombre,
      tipo: inventario.tipo,
      categoria_equipo: inventario.categoriaEquipo,
      cantidad: inventario.cantidad,
      movimientos: inventario.movimientos as any,
      activo: inventario.activo,
      codigo_identificacion: inventario.codigoIdentificacion,
      empresa_suplidora: inventario.empresaSuplidora,
      marcas_compatibles: inventario.marcasCompatibles,
      modelos_compatibles: inventario.modelosCompatibles,
    });

    const hasInventarioChanges = (a: Inventario, b: Inventario) =>
      a.nombre !== b.nombre ||
      a.tipo !== b.tipo ||
      a.categoriaEquipo !== b.categoriaEquipo ||
      a.cantidad !== b.cantidad ||
      a.activo !== b.activo ||
      a.empresaSuplidora !== b.empresaSuplidora ||
      a.codigoIdentificacion !== b.codigoIdentificacion ||
      JSON.stringify(a.movimientos) !== JSON.stringify(b.movimientos) ||
      JSON.stringify(a.marcasCompatibles) !== JSON.stringify(b.marcasCompatibles) ||
      JSON.stringify(a.modelosCompatibles) !== JSON.stringify(b.modelosCompatibles);

    const normalizeMantenimiento = (mantenimiento: MantenimientoProgramado): MantenimientoProgramado => ({
      id: Number(mantenimiento.id ?? 0),
      ficha: mantenimiento.ficha,
      nombreEquipo: mantenimiento.nombreEquipo,
      tipoMantenimiento: mantenimiento.tipoMantenimiento,
      horasKmActuales: Number(mantenimiento.horasKmActuales ?? 0),
      fechaUltimaActualizacion: mantenimiento.fechaUltimaActualizacion,
      frecuencia: Number(mantenimiento.frecuencia ?? 0),
      fechaUltimoMantenimiento: mantenimiento.fechaUltimoMantenimiento ?? null,
      horasKmUltimoMantenimiento: Number(mantenimiento.horasKmUltimoMantenimiento ?? 0),
      proximoMantenimiento: Number(mantenimiento.proximoMantenimiento ?? 0),
      horasKmRestante: Number(mantenimiento.horasKmRestante ?? 0),
      activo: mantenimiento.activo ?? true,
    });

    const hasMantenimientoChanges = (a: MantenimientoProgramado, b: MantenimientoProgramado) =>
      a.nombreEquipo !== b.nombreEquipo ||
      a.tipoMantenimiento !== b.tipoMantenimiento ||
      a.horasKmActuales !== b.horasKmActuales ||
      a.frecuencia !== b.frecuencia ||
      a.fechaUltimoMantenimiento !== b.fechaUltimoMantenimiento ||
      a.proximoMantenimiento !== b.proximoMantenimiento ||
      a.horasKmRestante !== b.horasKmRestante ||
      a.activo !== b.activo;

    const normalizeEmpleado = (empleado: Empleado): Empleado => ({
      id: Number(empleado.id ?? 0),
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      cargo: empleado.cargo,
      categoria: empleado.categoria,
      fechaNacimiento: empleado.fechaNacimiento ?? '',
      activo: empleado.activo ?? true,
      email: empleado.email ?? null,
      telefono: empleado.telefono ?? null,
    });

    const mapEmpleadoToDatabase = (empleado: Empleado) => ({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      cargo: empleado.cargo,
      categoria: empleado.categoria,
      fecha_nacimiento: empleado.fechaNacimiento || null,
      activo: empleado.activo,
      email: empleado.email,
      telefono: empleado.telefono,
    });

    const hasEmpleadoChanges = (a: Empleado, b: Empleado) =>
      a.nombre !== b.nombre ||
      a.apellido !== b.apellido ||
      a.cargo !== b.cargo ||
      a.categoria !== b.categoria ||
      a.fechaNacimiento !== b.fechaNacimiento ||
      a.activo !== b.activo ||
      (a.email ?? '') !== (b.email ?? '') ||
      (a.telefono ?? '') !== (b.telefono ?? '');

    const buildEmpleadoKey = (empleado: Partial<Empleado>) => {
      if (empleado.email) {
        return empleado.email.toLowerCase();
      }
      if (empleado.id) {
        return `id-${empleado.id}`;
      }
      return `${(empleado.nombre ?? '').toLowerCase()}-${(empleado.apellido ?? '').toLowerCase()}-${(empleado.cargo ?? '').toLowerCase()}`;
    };

    const equiposIndex = new Map<string, Equipo>();
    data.equipos.forEach((eq) => equiposIndex.set(eq.ficha, eq));

    const inventariosIndex = new Map<string, Inventario>();
    data.inventarios.forEach((inv) => inventariosIndex.set(inv.codigoIdentificacion, inv));

    const mantenimientosIndex = new Map<string, MantenimientoProgramado>();
    data.mantenimientosProgramados.forEach((mant) => {
      mantenimientosIndex.set(`${mant.ficha}::${mant.tipoMantenimiento}`.toLowerCase(), mant);
    });

    const empleadosIndex = new Map<string, Empleado>();
    (data.empleados ?? []).forEach((emp) => empleadosIndex.set(buildEmpleadoKey(emp), emp));

    const empleadosNombre = new Map<number, string>();
    (data.empleados ?? []).forEach((emp) => {
      const nombreCompleto = `${emp.nombre ?? ''} ${emp.apellido ?? ''}`.trim();
      empleadosNombre.set(Number(emp.id), nombreCompleto || emp.nombre);
    });

    const existingRealizadosKeys = new Set<string>();
    data.mantenimientosRealizados.forEach((evento) => {
      const fecha = toISOStringIfValid(evento.fechaMantenimiento) ?? new Date(evento.fechaMantenimiento).toISOString();
      existingRealizadosKeys.add(`${evento.ficha}::${fecha}`);
    });

    const existingLecturasKeys = new Set<string>();
    data.actualizacionesHorasKm.forEach((evento) => {
      const fecha = toISOStringIfValid(evento.fecha) ?? new Date(evento.fecha).toISOString();
      existingLecturasKeys.add(`${evento.ficha}::${fecha}::${Number(evento.horasKm)}`);
    });

    for (const equipoRaw of equiposBundle) {
      const equipo = normalizeEquipo(equipoRaw);
      const { id: _omit, ...equipoSinId } = equipo;
      const existente = equiposIndex.get(equipo.ficha);

      if (!existente) {
        await createEquipo(equipoSinId, { skipReload: true, silent: true });
        summary.equipos.added.push(`${equipo.ficha} - ${equipo.nombre}`);
      } else if (hasEquipoChanges(existente, equipo)) {
        await updateEquipo({ ...existente, ...equipo, id: existente.id }, { skipReload: true, silent: true });
        summary.equipos.updated.push(`${equipo.ficha} - ${equipo.nombre}`);
      } else {
        summary.equipos.unchanged.push(`${equipo.ficha} - ${equipo.nombre}`);
      }
    }

    for (const inventarioRaw of inventariosBundle) {
      const inventario = normalizeInventario(inventarioRaw);
      const existente = inventariosIndex.get(inventario.codigoIdentificacion);

      if (!existente) {
        const { error } = await supabase
          .from('inventarios')
          .insert([mapInventarioToDatabase(inventario)]);
        if (error) throw error;
        summary.inventarios.added.push(`${inventario.codigoIdentificacion} - ${inventario.nombre}`);
        await logHistorialEvent({
          tipoEvento: 'inventario_creado',
          modulo: 'inventarios',
          descripcion: `Se agregó el inventario ${inventario.nombre}`,
          datosAntes: null,
          datosDespues: inventario,
          metadata: { codigo: inventario.codigoIdentificacion },
        });
      } else if (hasInventarioChanges(existente, inventario)) {
        const { error } = await supabase
          .from('inventarios')
          .update(mapInventarioToDatabase(inventario))
          .eq('id', existente.id);
        if (error) throw error;
        summary.inventarios.updated.push(`${inventario.codigoIdentificacion} - ${inventario.nombre}`);
        await logHistorialEvent({
          tipoEvento: 'inventario_actualizado',
          modulo: 'inventarios',
          descripcion: `Se actualizó el inventario ${inventario.nombre}`,
          datosAntes: existente,
          datosDespues: inventario,
          metadata: { codigo: inventario.codigoIdentificacion },
        });
      } else {
        summary.inventarios.unchanged.push(`${inventario.codigoIdentificacion} - ${inventario.nombre}`);
      }
    }

    for (const mantenimientoRaw of mantenimientosBundle) {
      const mantenimiento = normalizeMantenimiento(mantenimientoRaw);
      const key = `${mantenimiento.ficha}::${mantenimiento.tipoMantenimiento}`.toLowerCase();
      const existente = mantenimientosIndex.get(key);

      const payload: MantenimientoPayload = {
        ficha: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo,
        tipoMantenimiento: mantenimiento.tipoMantenimiento,
        horasKmActuales: mantenimiento.horasKmActuales,
        fechaUltimaActualizacion: mantenimiento.fechaUltimaActualizacion,
        frecuencia: mantenimiento.frecuencia,
        fechaUltimoMantenimiento: mantenimiento.fechaUltimoMantenimiento,
        horasKmUltimoMantenimiento: mantenimiento.horasKmUltimoMantenimiento,
        activo: mantenimiento.activo,
      };

      if (!existente) {
        await createMantenimiento(payload, { skipReload: true, silent: true });
        summary.mantenimientosProgramados.added.push(`${mantenimiento.ficha} - ${mantenimiento.tipoMantenimiento}`);
      } else if (hasMantenimientoChanges(existente, mantenimiento)) {
        await updateMantenimiento(existente.id, payload, { skipReload: true, silent: true });
        summary.mantenimientosProgramados.updated.push(`${mantenimiento.ficha} - ${mantenimiento.tipoMantenimiento}`);
      } else {
        summary.mantenimientosProgramados.unchanged.push(`${mantenimiento.ficha} - ${mantenimiento.tipoMantenimiento}`);
      }
    }

    for (const empleadoRaw of empleadosBundle) {
      const empleado = normalizeEmpleado(empleadoRaw);
      const key = buildEmpleadoKey(empleado);
      const existente = empleadosIndex.get(key);
      const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.trim();

      if (!existente) {
        const { data: inserted, error } = await supabase
          .from('empleados')
          .insert(mapEmpleadoToDatabase(empleado))
          .select('*')
          .single();
        if (error) throw error;
        summary.empleados.added.push(nombreCompleto || empleado.nombre);
        if (inserted?.id) {
          empleadosNombre.set(Number(inserted.id), nombreCompleto || empleado.nombre);
        }
        await logHistorialEvent({
          tipoEvento: 'empleado_registrado',
          modulo: 'empleados',
          descripcion: `Se registró ${nombreCompleto || empleado.nombre}`,
          datosAntes: null,
          datosDespues: inserted ?? empleado,
          metadata: { cargo: empleado.cargo, categoria: empleado.categoria },
        });
      } else if (hasEmpleadoChanges(existente, empleado)) {
        const { data: updatedRow, error } = await supabase
          .from('empleados')
          .update(mapEmpleadoToDatabase(empleado))
          .eq('id', existente.id)
          .select('*')
          .single();
        if (error) throw error;
        summary.empleados.updated.push(nombreCompleto || empleado.nombre);
        const targetId = Number(updatedRow?.id ?? existente.id);
        empleadosNombre.set(targetId, nombreCompleto || empleado.nombre);
        await logHistorialEvent({
          tipoEvento: 'empleado_actualizado',
          modulo: 'empleados',
          descripcion: `Se actualizó ${nombreCompleto || empleado.nombre}`,
          datosAntes: existente,
          datosDespues: updatedRow ?? empleado,
          metadata: { cargo: empleado.cargo, categoria: empleado.categoria },
        });
      } else {
        summary.empleados.unchanged.push(nombreCompleto || empleado.nombre);
      }
    }

    const equiposNombreMap = new Map<string, string | null>();
    data.equipos.forEach((eq) => equiposNombreMap.set(eq.ficha, eq.nombre));
    equiposBundle.forEach((eq) => {
      const normalizado = normalizeEquipo(eq);
      if (!equiposNombreMap.has(normalizado.ficha)) {
        equiposNombreMap.set(normalizado.ficha, normalizado.nombre);
      }
    });

    for (const mantenimiento of mantenimientosRealizadosBundle) {
      const fechaIso = toISOStringIfValid(mantenimiento.fechaMantenimiento) ?? new Date().toISOString();
      const key = `${mantenimiento.ficha}::${fechaIso}`;
      if (existingRealizadosKeys.has(key)) {
        summary.historial.omitidos++;
        continue;
      }

      const nombreEquipo = equiposNombreMap.get(mantenimiento.ficha) ?? mantenimiento.nombreEquipo ?? null;
      const responsable = mantenimiento.idEmpleado
        ? empleadosNombre.get(Number(mantenimiento.idEmpleado)) ?? `Empleado ${mantenimiento.idEmpleado}`
        : mantenimiento.usuarioResponsable || 'Equipo de mantenimiento';

      const metadata = {
        ...mantenimiento,
        nombreEquipo,
        usuarioResponsable: responsable,
      };

      const payload = {
        tipo_evento: 'mantenimiento_realizado',
        modulo: 'mantenimientos',
        ficha_equipo: mantenimiento.ficha,
        nombre_equipo: nombreEquipo,
        usuario_responsable: responsable,
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
        created_at: fechaIso,
      };

      const { error } = await supabase.from('historial_eventos').insert([payload]);
      if (error) throw error;
      summary.historial.mantenimientosRealizados += 1;
      existingRealizadosKeys.add(key);
    }

    for (const actualizacion of actualizacionesBundle) {
      const fechaIso = toISOStringIfValid(actualizacion.fecha) ?? new Date().toISOString();
      const key = `${actualizacion.ficha}::${fechaIso}::${Number(actualizacion.horasKm ?? 0)}`;
      if (existingLecturasKeys.has(key)) {
        summary.historial.omitidos++;
        continue;
      }

      const nombreEquipo = equiposNombreMap.get(actualizacion.ficha) ?? actualizacion.nombreEquipo ?? null;
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
          horasKm: Number(actualizacion.horasKm ?? 0),
          incremento: Number(actualizacion.incremento ?? 0),
        } as any,
        nivel_importancia: Number(actualizacion.incremento ?? 0) < 0 ? 'warning' : 'info',
        metadata: metadata as any,
        created_at: fechaIso,
      };

      const { error } = await supabase.from('historial_eventos').insert([payload]);
      if (error) throw error;
      summary.historial.lecturasRegistradas += 1;
      existingLecturasKeys.add(key);
    }

    await loadData();

    if (!silent) {
      const cambios =
        summary.equipos.added.length +
        summary.equipos.updated.length +
        summary.inventarios.added.length +
        summary.inventarios.updated.length +
        summary.mantenimientosProgramados.added.length +
        summary.mantenimientosProgramados.updated.length +
        summary.empleados.added.length +
        summary.empleados.updated.length +
        summary.historial.mantenimientosRealizados +
        summary.historial.lecturasRegistradas;

      if (cambios === 0) {
        toast({
          title: 'Sin cambios detectados',
          description: 'Todo está sincronizado con la base de datos.',
        });
      } else {
        const detalles = [
          `Equipos: +${summary.equipos.added.length} / ✎${summary.equipos.updated.length}`,
          `Inventarios: +${summary.inventarios.added.length} / ✎${summary.inventarios.updated.length}`,
          `Mant. programados: +${summary.mantenimientosProgramados.added.length} / ✎${summary.mantenimientosProgramados.updated.length}`,
          `Empleados: +${summary.empleados.added.length} / ✎${summary.empleados.updated.length}`,
          `Historial añadido: ${summary.historial.mantenimientosRealizados + summary.historial.lecturasRegistradas}`,
        ];

        toast({
          title: 'Sincronización aplicada',
          description: detalles.join('\n'),
        });
      }
    }

    return summary;
  };

  const summarizeSyncResult = (summary: SyncSummary) => {
    return [
      `Equipos ➜ +${summary.equipos.added.length} / ✎${summary.equipos.updated.length}`,
      `Inventarios ➜ +${summary.inventarios.added.length} / ✎${summary.inventarios.updated.length}`,
      `Mant. programados ➜ +${summary.mantenimientosProgramados.added.length} / ✎${summary.mantenimientosProgramados.updated.length}`,
      `Empleados ➜ +${summary.empleados.added.length} / ✎${summary.empleados.updated.length}`,
      `Historial ➜ ${summary.historial.mantenimientosRealizados + summary.historial.lecturasRegistradas} nuevos (${summary.historial.omitidos} omitidos)`
    ].join('\n');
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
        .from('empleados')
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

      await supabase
        .from('configuraciones')
        .delete()
        .neq('clave', '');

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

  const mapEquipoToDatabasePayload = (equipo: Omit<Equipo, 'id'>) => ({
    ficha: equipo.ficha,
    nombre: equipo.nombre,
    marca: equipo.marca,
    modelo: equipo.modelo,
    numero_serie: equipo.numeroSerie,
    placa: equipo.placa,
    categoria: equipo.categoria,
    activo: equipo.activo,
    motivo_inactividad: equipo.motivoInactividad,
  });

  const mapDatabaseEquipoToLocal = (equipo: any): Equipo => ({
    id: Number(equipo.id),
    ficha: equipo.ficha,
    nombre: equipo.nombre,
    marca: equipo.marca,
    modelo: equipo.modelo,
    numeroSerie: equipo.numero_serie,
    placa: equipo.placa,
    categoria: equipo.categoria,
    activo: Boolean(equipo.activo),
    motivoInactividad: equipo.motivo_inactividad ?? null,
  });

  const createEquipo = async (
    equipo: Omit<Equipo, 'id'>,
    options: { skipReload?: boolean; silent?: boolean } = {}
  ) => {
    const { skipReload = false, silent = false } = options;

    try {
      const payload = mapEquipoToDatabasePayload(equipo);
      const { data: inserted, error } = await supabase
        .from('equipos')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      const equipoCreado = inserted ? mapDatabaseEquipoToLocal(inserted) : { ...equipo, id: 0 } as Equipo;

      await logHistorialEvent({
        tipoEvento: 'equipo_creado',
        modulo: 'equipos',
        descripcion: `Se registró el equipo ${equipo.nombre} (${equipo.ficha})`,
        fichaEquipo: equipo.ficha,
        nombreEquipo: equipo.nombre,
        datosAntes: null,
        datosDespues: equipoCreado,
        metadata: {
          categoria: equipo.categoria,
          marca: equipo.marca,
          modelo: equipo.modelo,
          placa: equipo.placa,
        },
      });

      if (!silent) {
        toast({
          title: '✅ Equipo creado',
          description: `El equipo ${equipo.nombre} se registró correctamente`,
        });
      }

      if (!skipReload) {
        await loadData(true);
      }

      return equipoCreado;
    } catch (error) {
      console.error('Error creating equipo:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo registrar el equipo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEquipo = async (
    equipo: Equipo,
    options: { skipReload?: boolean; silent?: boolean } = {}
  ) => {
    const { skipReload = false, silent = false } = options;

    try {
      const equipoPrevio = data.equipos.find((item) => item.id === equipo.id) ?? null;
      const payload = mapEquipoToDatabasePayload(equipo);
      const { data: updatedRow, error } = await supabase
        .from('equipos')
        .update(payload)
        .eq('id', equipo.id)
        .select('*')
        .single();

      if (error) throw error;

      const equipoActualizado = updatedRow ? mapDatabaseEquipoToLocal(updatedRow) : equipo;

      await logHistorialEvent({
        tipoEvento: 'equipo_actualizado',
        modulo: 'equipos',
        descripcion: `Se actualizaron los datos del equipo ${equipo.nombre} (${equipo.ficha})`,
        fichaEquipo: equipo.ficha,
        nombreEquipo: equipo.nombre,
        datosAntes: equipoPrevio,
        datosDespues: equipoActualizado,
        metadata: {
          categoria: equipo.categoria,
          marca: equipo.marca,
          modelo: equipo.modelo,
          placa: equipo.placa,
        },
      });

      if (!silent) {
        toast({
          title: '✅ Equipo actualizado',
          description: `El equipo ${equipo.nombre} se actualizó correctamente`,
        });
      }

      if (!skipReload) {
        await loadData(true);
      }

      return equipoActualizado;
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

  const deleteEquipo = async (
    id: number,
    options: { skipReload?: boolean; silent?: boolean } = {}
  ) => {
    const { skipReload = false, silent = false } = options;
    const equipoPrevio = data.equipos.find((item) => item.id === id) ?? null;

    try {
      const { error } = await supabase
        .from('equipos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (equipoPrevio) {
        await logHistorialEvent({
          tipoEvento: 'equipo_eliminado',
          modulo: 'equipos',
          descripcion: `Se eliminó el equipo ${equipoPrevio.nombre} (${equipoPrevio.ficha})`,
          fichaEquipo: equipoPrevio.ficha,
          nombreEquipo: equipoPrevio.nombre,
          datosAntes: equipoPrevio,
          datosDespues: null,
          metadata: {
            categoria: equipoPrevio.categoria,
            marca: equipoPrevio.marca,
            modelo: equipoPrevio.modelo,
            placa: equipoPrevio.placa,
          },
        });
      }

      if (!silent) {
        toast({
          title: '✅ Equipo eliminado',
          description: 'El equipo fue eliminado de la base de datos',
        });
      }

      if (!skipReload) {
        await loadData(true);
      }
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

  const mapToDatabasePayload = (mantenimiento: MantenimientoPayload) => {
    const horasUltimo = Number(mantenimiento.horasKmUltimoMantenimiento ?? 0);
    const frecuencia = Number(mantenimiento.frecuencia ?? 0);
    const horasActuales = Number(mantenimiento.horasKmActuales ?? 0);

    const proximo = horasUltimo + frecuencia;
    const restante = proximo - horasActuales;

    const fechaUltimaActualizacion =
      toISOStringIfValid(mantenimiento.fechaUltimaActualizacion) ?? new Date().toISOString();
    const fechaUltimoMantenimiento =
      toISOStringIfValid(mantenimiento.fechaUltimoMantenimiento) ?? null;

    return {
      ficha: mantenimiento.ficha,
      nombre_equipo: mantenimiento.nombreEquipo,
      tipo_mantenimiento: mantenimiento.tipoMantenimiento,
      horas_km_actuales: horasActuales,
      fecha_ultima_actualizacion: fechaUltimaActualizacion,
      frecuencia,
      fecha_ultimo_mantenimiento: fechaUltimoMantenimiento,
      horas_km_ultimo_mantenimiento: horasUltimo,
      proximo_mantenimiento: proximo,
      horas_km_restante: restante,
      activo: mantenimiento.activo,
    };
  };

  const createMantenimiento = async (
    mantenimiento: MantenimientoPayload,
    options: { skipReload?: boolean; silent?: boolean } = {}
  ) => {
    const { skipReload = false, silent = false } = options;
    try {
      const payload = mapToDatabasePayload(mantenimiento);
      const { data: inserted, error } = await supabase
        .from('mantenimientos_programados')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      await logHistorialEvent({
        tipoEvento: 'mantenimiento_programado_creado',
        modulo: 'mantenimientos',
        descripcion: `Se programó el mantenimiento ${mantenimiento.tipoMantenimiento} para ${mantenimiento.nombreEquipo}`,
        fichaEquipo: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo,
        datosAntes: null,
        datosDespues: inserted,
        metadata: {
          frecuencia: mantenimiento.frecuencia,
          horasKmActuales: mantenimiento.horasKmActuales,
          horasKmUltimoMantenimiento: mantenimiento.horasKmUltimoMantenimiento,
        },
      });

      if (!silent) {
        toast({
          title: "✅ Mantenimiento creado",
          description: `Se creó el mantenimiento para ${mantenimiento.nombreEquipo}`,
        });
      }

      if (!skipReload) {
        await loadData(true);
      }

      return inserted;
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

  const updateMantenimiento = async (
    id: number,
    mantenimiento: MantenimientoPayload,
    options: { skipReload?: boolean; silent?: boolean } = {}
  ) => {
    const { skipReload = false, silent = false } = options;
    try {
      const mantenimientoPrevio = data.mantenimientosProgramados.find((item) => item.id === id) ?? null;
      const payload = mapToDatabasePayload(mantenimiento);
      const { data: actualizado, error } = await supabase
        .from('mantenimientos_programados')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      await logHistorialEvent({
        tipoEvento: 'mantenimiento_programado_actualizado',
        modulo: 'mantenimientos',
        descripcion: `Se actualizó el mantenimiento ${mantenimiento.tipoMantenimiento} para ${mantenimiento.nombreEquipo}`,
        fichaEquipo: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo,
        datosAntes: mantenimientoPrevio,
        datosDespues: actualizado ?? mantenimiento,
        metadata: {
          frecuencia: mantenimiento.frecuencia,
          horasKmActuales: mantenimiento.horasKmActuales,
          horasKmUltimoMantenimiento: mantenimiento.horasKmUltimoMantenimiento,
        },
      });

      if (!silent) {
        toast({
          title: "✅ Mantenimiento actualizado",
          description: `Se actualizó el mantenimiento de ${mantenimiento.nombreEquipo}`,
        });
      }

      if (!skipReload) {
        await loadData(true);
      }

      return actualizado ?? payload;
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

  const deleteMantenimiento = async (
    id: number,
    options: { skipReload?: boolean; silent?: boolean } = {}
  ) => {
    const { skipReload = false, silent = false } = options;
    try {
      const mantenimientoPrevio = data.mantenimientosProgramados.find((item) => item.id === id) ?? null;
      const { error } = await supabase
        .from('mantenimientos_programados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (mantenimientoPrevio) {
        await logHistorialEvent({
          tipoEvento: 'mantenimiento_programado_eliminado',
          modulo: 'mantenimientos',
          descripcion: `Se eliminó el mantenimiento ${mantenimientoPrevio.tipoMantenimiento} del equipo ${mantenimientoPrevio.nombreEquipo}`,
          fichaEquipo: mantenimientoPrevio.ficha,
          nombreEquipo: mantenimientoPrevio.nombreEquipo,
          datosAntes: mantenimientoPrevio,
          datosDespues: null,
          metadata: {
            frecuencia: mantenimientoPrevio.frecuencia,
            horasKmUltimoMantenimiento: mantenimientoPrevio.horasKmUltimoMantenimiento,
          },
        });
      }

      if (!silent) {
        toast({
          title: "✅ Mantenimiento eliminado",
          description: "El mantenimiento fue eliminado correctamente",
        });
      }

      if (!skipReload) {
        await loadData(true);
      }
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
  }: ActualizacionHorasPayload) => {
    const mantenimiento = data.mantenimientosProgramados.find((m) => m.id === mantenimientoId);

    if (!mantenimiento) {
      toast({
        title: "❌ Error",
        description: "No se encontró el mantenimiento seleccionado",
        variant: "destructive",
      });
      throw new Error('Mantenimiento no encontrado');
    }

    const horasActuales = Number(horasKm);
    const incremento = horasActuales - Number(mantenimiento.horasKmActuales ?? 0);
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

      const unidad = mantenimiento.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas';
      const descripcion = observaciones
        ? observaciones
        : `Lectura actualizada a ${horasActuales} ${unidad}`;

      const metadata = {
        id: mantenimientoId,
        ficha: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo,
        horasKm: horasActuales,
        incremento,
        fecha: fechaIso,
        usuarioResponsable,
        observaciones,
      };

      const { error: historialError } = await supabase.from('historial_eventos').insert({
        tipo_evento: 'lectura_actualizada',
        modulo: 'mantenimientos',
        ficha_equipo: mantenimiento.ficha,
        nombre_equipo: mantenimiento.nombreEquipo,
        usuario_responsable: usuarioResponsable,
        descripcion,
        datos_despues: {
          horasKm: horasActuales,
          incremento,
        },
        metadata,
        created_at: fechaIso,
      });

      if (historialError) throw historialError;

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
  }: RegistrarMantenimientoPayload) => {
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
    const incremento = lectura - Number(mantenimiento.horasKmUltimoMantenimiento ?? 0);
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
        : `Mantenimiento ${mantenimiento.tipoMantenimiento} realizado para ${mantenimiento.nombreEquipo}`;

      const metadata = {
        id: mantenimientoId,
        ficha: mantenimiento.ficha,
        nombreEquipo: mantenimiento.nombreEquipo,
        fechaMantenimiento: fechaIso,
        horasKmAlMomento: lectura,
        incrementoDesdeUltimo: incremento,
        filtrosUtilizados,
        usuarioResponsable,
        observaciones,
      };

      const { error: historialError } = await supabase.from('historial_eventos').insert({
        tipo_evento: 'mantenimiento_realizado',
        modulo: 'mantenimientos',
        ficha_equipo: mantenimiento.ficha,
        nombre_equipo: mantenimiento.nombreEquipo,
        usuario_responsable: usuarioResponsable,
        descripcion,
        datos_despues: {
          horasKmAlMomento: lectura,
          incrementoDesdeUltimo: incremento,
          filtrosUtilizados,
        },
        metadata,
        created_at: fechaIso,
      });

      if (historialError) throw historialError;

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

      const localData = JSON.parse(stored);
      const summary = await syncJsonData(localData, { silent: true, mode: 'migrate' });

      toast({
        title: "✅ Migración completada",
        description: summarizeSyncResult(summary),
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
    try {
      setIsMigrating(true);

      const summary = await syncJsonData(bundle, { silent: true, mode: 'migrate' });

      toast({
        title: "✅ Importación completada",
        description: summarizeSyncResult(summary),
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

  return {
    data,
    loading,
    isMigrating,
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
