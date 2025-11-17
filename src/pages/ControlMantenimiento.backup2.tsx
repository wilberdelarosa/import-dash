import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { EquipoSelectorDialog } from '@/components/EquipoSelectorDialog';
import {
  Loader2,
  Wrench,
  CalendarCheck,
  Gauge,
  ClipboardList,
  CalendarRange,
  Route,
  MapPinned,
  GraduationCap,
  X,
  Activity,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
} from 'lucide-react';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import type { ActualizacionHorasKm, MantenimientoProgramado, MantenimientoRealizado } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import { Planificador } from '@/pages/Planificador';

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }
  return date.toLocaleDateString();
};

const resolveIntervaloCodigo = (mantenimiento: MantenimientoProgramado | null | undefined) => {
  if (!mantenimiento) return '';
  const match = mantenimiento.tipoMantenimiento?.match(/(PM\d)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }
  if (!mantenimiento.frecuencia) return '';
  if (mantenimiento.frecuencia <= 250) return 'PM1';
  if (mantenimiento.frecuencia <= 500) return 'PM2';
  if (mantenimiento.frecuencia <= 1000) return 'PM3';
  if (mantenimiento.frecuencia <= 2000) return 'PM4';
  return '';
};

const normalizarRangoFechas = (desde: string, hasta: string) => {
  const inicio = new Date(desde);
  const fin = new Date(hasta);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || inicio > fin) {
    return null;
  }

  const inicioAjustado = new Date(inicio);
  inicioAjustado.setHours(0, 0, 0, 0);

  const finAjustado = new Date(fin);
  finAjustado.setHours(23, 59, 59, 999);

  return {
    desde: inicioAjustado.toISOString(),
    hasta: finAjustado.toISOString(),
  };
};

const obtenerSemanaActual = () => {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - 6);
  const toISODate = (fecha: Date) => fecha.toISOString().split('T')[0];
  return {
    desde: toISODate(inicio),
    hasta: toISODate(fin),
  };
};

interface RutaPlanItem {
  ficha: string;
  nombre: string;
  categoria: string;
  intervalo: string;
  intervaloDescripcion: string;
  restante: number;
  proximo: number;
  tareas: string[];
  kit: string[];
  capacitacion: string;
}

interface ResumenActualizaciones {
  desde: string;
  hasta: string;
  actualizados: {
    mantenimiento: MantenimientoProgramado;
    evento: ActualizacionHorasKm | null;
  }[];
  pendientes: MantenimientoProgramado[];
}

export default function ControlMantenimiento() {
  const {
    data,
    loading,
    updateHorasActuales,
    registrarMantenimientoRealizado,
  } = useSupabaseDataContext();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mostrarListaEquipos, setMostrarListaEquipos] = useState(false);
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [horasLectura, setHorasLectura] = useState('');
  const [fechaLectura, setFechaLectura] = useState('');
  const [responsableLectura, setResponsableLectura] = useState('');
  const [notasLectura, setNotasLectura] = useState('');
  const [registroFecha, setRegistroFecha] = useState('');
  const [registroHoras, setRegistroHoras] = useState('');
  const [registroResponsable, setRegistroResponsable] = useState('');
  const [registroObservaciones, setRegistroObservaciones] = useState('');
  const [registroFiltros, setRegistroFiltros] = useState('');
  const [unidadLectura, setUnidadLectura] = useState<'horas' | 'km'>('horas');
  const [unidadRegistro, setUnidadRegistro] = useState<'horas' | 'km'>('horas');
  const [updating, setUpdating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [reporteDesde, setReporteDesde] = useState('');
  const [reporteHasta, setReporteHasta] = useState('');
  const [reporteRango, setReporteRango] = useState<{ desde: string; hasta: string } | null>(null);
  const [isResumenOpen, setIsResumenOpen] = useState(false);
  const [reporteSegmento, setReporteSegmento] = useState<'resumen' | 'actualizados' | 'pendientes'>('resumen');
  const [planificadorOpen, setPlanificadorOpen] = useState(false);
  const [tabActivo, setTabActivo] = useState<'mantenimiento' | 'planificador'>('mantenimiento');
  const caterpillarEquipos = useMemo(
    () =>
      data.equipos
        .filter((equipo) => equipo.marca?.toLowerCase().includes('cat'))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [data.equipos],
  );
  const [planFicha, setPlanFicha] = useState<string | null>(null);
  const [planIntervalo, setPlanIntervalo] = useState<string>('');
  const [rutaMarcada, setRutaMarcada] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && data.mantenimientosProgramados.length > 0 && selectedId === null) {
      setSelectedId(data.mantenimientosProgramados[0].id);
    }
  }, [loading, data.mantenimientosProgramados, selectedId]);

  useEffect(() => {
    if (caterpillarEquipos.length > 0) {
      setPlanFicha((current) => {
        if (current && caterpillarEquipos.some((equipo) => equipo.ficha === current)) {
          return current;
        }
        return caterpillarEquipos[0].ficha;
      });
    } else {
      setPlanFicha(null);
    }
  }, [caterpillarEquipos]);

  useEffect(() => {
    if (reporteRango || reporteDesde || reporteHasta) return;
    const semanaActual = obtenerSemanaActual();
    setReporteDesde(semanaActual.desde);
    setReporteHasta(semanaActual.hasta);
    const rangoNormalizado = normalizarRangoFechas(semanaActual.desde, semanaActual.hasta);
    if (rangoNormalizado) {
      setReporteRango(rangoNormalizado);
    }
  }, [reporteDesde, reporteHasta, reporteRango]);

  const selected = useMemo(
    () => data.mantenimientosProgramados.find((mantenimiento) => mantenimiento.id === selectedId) ?? null,
    [data.mantenimientosProgramados, selectedId]
  );

  useEffect(() => {
    if (selected) {
      setHorasLectura(selected.horasKmActuales.toString());
      setRegistroHoras(selected.horasKmActuales.toString());
      setFechaLectura(new Date().toISOString().slice(0, 10));
      setRegistroFecha(new Date().toISOString().slice(0, 10));
      const unidadInferida = selected.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas';
      setUnidadLectura(unidadInferida as 'horas' | 'km');
      setUnidadRegistro(unidadInferida as 'horas' | 'km');
    }
  }, [selectedId, selected]);

  const planEquipo = useMemo(
    () => (planFicha ? data.equipos.find((equipo) => equipo.ficha === planFicha) ?? null : null),
    [data.equipos, planFicha],
  );

  const planMantenimientos = useMemo(
    () =>
      planFicha
        ? data.mantenimientosProgramados
            .filter((mantenimiento) => mantenimiento.ficha === planFicha)
            .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
        : [],
    [data.mantenimientosProgramados, planFicha],
  );

  const planProximo = planMantenimientos[0] ?? null;
  const planIntervaloSugerido = resolveIntervaloCodigo(planProximo);
  const esPlanCaterpillar = (planEquipo?.marca ?? '').toLowerCase().includes('cat');

  const { data: planCatData, loading: loadingPlanCat } = useCaterpillarData(
    esPlanCaterpillar ? planEquipo?.modelo ?? '' : '',
    esPlanCaterpillar ? planEquipo?.numeroSerie ?? '' : '',
  );

  const intervalosDisponibles = useMemo(() => planCatData.intervalos ?? [], [planCatData.intervalos]);

  useEffect(() => {
    if (intervalosDisponibles.length === 0) {
      setPlanIntervalo('');
      return;
    }
    setPlanIntervalo((current) => {
      if (current && intervalosDisponibles.some((intervalo) => intervalo.codigo === current)) {
        return current;
      }
      if (planIntervaloSugerido && intervalosDisponibles.some((intervalo) => intervalo.codigo === planIntervaloSugerido)) {
        return planIntervaloSugerido;
      }
      return intervalosDisponibles[0].codigo;
    });
  }, [intervalosDisponibles, planIntervaloSugerido]);

  const planIntervaloDescripcion = useMemo(() => {
    if (!planIntervalo) return 'Selecciona un intervalo para ver el detalle oficial.';
    return (
      intervalosDisponibles.find((intervalo) => intervalo.codigo === planIntervalo)?.descripcion ??
      'No hay descripción homologada para este intervalo.'
    );
  }, [intervalosDisponibles, planIntervalo]);

  const planTareas = useMemo(() => {
    if (!planIntervalo) return [] as string[];
    return planCatData.tareasPorIntervalo?.[planIntervalo] ?? [];
  }, [planCatData.tareasPorIntervalo, planIntervalo]);

  const planKit = useMemo(() => {
    if (!planIntervalo) return [] as string[];
    const piezas = planCatData.piezasPorIntervalo?.[planIntervalo] ?? [];
    return piezas.map((pieza) => `${pieza.pieza.numero_parte} · ${pieza.pieza.descripcion}`);
  }, [planCatData.piezasPorIntervalo, planIntervalo]);

  const planEspeciales = useMemo(
    () =>
      planIntervalo
        ? (planCatData.mantenimientosEspeciales ?? []).filter(
          (especial) => especial.intervaloCodigo === planIntervalo,
        )
        : [],
    [planCatData.mantenimientosEspeciales, planIntervalo],
  );

  const planCapacitacion = 
    planEspeciales[0]?.responsableSugerido
    ?? 'Define el responsable certificado para este plan';

  const planPanelContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" />
          <span className="font-semibold">Planificador preventivo Caterpillar</span>
        </div>
        <div className="text-xs text-muted-foreground">Selecciona tu equipo y intervalo</div>
      </div>
      {caterpillarEquipos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Registra equipos Caterpillar para habilitar la planificación inteligente de rutas preventivas.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="planFichaFloating">Equipo Caterpillar</Label>
              <EquipoSelectorDialog
                equipos={caterpillarEquipos}
                equipoSeleccionado={planFicha ?? undefined}
                onSelect={(ficha) => setPlanFicha(ficha)}
                titulo="Seleccionar Equipo Caterpillar"
                descripcion="Selecciona un equipo Caterpillar"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="planIntervaloFloating">Intervalo oficial</Label>
              <Select
                id="planIntervaloFloating"
                value={planIntervalo}
                onValueChange={(value) => setPlanIntervalo(value)}
                disabled={intervalosDisponibles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="MP disponible" />
                </SelectTrigger>
                <SelectContent>
                  {intervalosDisponibles.map((intervalo) => (
                    <SelectItem key={intervalo.codigo} value={intervalo.codigo}>
                      {intervalo.codigo} · {intervalo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {loadingPlanCat && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando catálogo Caterpillar...
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Lectura actual</p>
              <p className="text-lg font-semibold">
                {planProximo ? `${planProximo.horasKmActuales} h/km` : 'Sin registro'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Próximo objetivo</p>
              <p className="text-lg font-semibold">
                {planProximo ? `${planProximo.proximoMantenimiento} h/km` : 'Sin programación'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Restante estimado</p>
              <Badge variant={planProximo ? getRemainingVariant(planProximo.horasKmRestante) : 'outline'}>
                {planProximo ? `${planProximo.horasKmRestante} h/km` : 'Sin dato'}
              </Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="h-4 w-4 text-primary" /> Capacitación mínima
              </p>
              <p className="mt-1 text-sm font-medium leading-snug">{planCapacitacion}</p>
            </div>
          </div>
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm font-semibold">Descripción del intervalo {planIntervalo || 'seleccionado'}</p>
            <p className="mt-1 text-sm text-muted-foreground">{planIntervaloDescripcion}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
            <div className="space-y-3 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" /> Tareas clave
              </p>
              {planTareas.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {planTareas.map((tarea) => (
                    <li key={tarea} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="leading-snug">{tarea}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Registra el intervalo para mostrar el checklist oficial.</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MapPinned className="h-4 w-4 text-primary" /> Kit recomendado
                </p>
                {planKit.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {planKit.map((pieza) => (
                      <li key={pieza} className="leading-snug">{pieza}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay repuestos registrados para este intervalo.</p>
                )}
              </div>
              {planEspeciales.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm">
                  <p className="font-semibold text-amber-800">Mantenimiento especial</p>
                  <ul className="mt-2 space-y-1 text-amber-800">
                    {planEspeciales.map((especial) => (
                      <li key={especial.id} className="leading-snug">{especial.descripcion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const planRuta: RutaPlanItem[] = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof getStaticCaterpillarData> | null>();
    return data.mantenimientosProgramados
      .map((mantenimiento) => {
        const equipo = data.equipos.find((item) => item.ficha === mantenimiento.ficha);
        if (!equipo || !equipo.marca?.toLowerCase().includes('cat')) {
          return null;
        }
        const intervalo = resolveIntervaloCodigo(mantenimiento) || 'Sin MP';
        let catData = cache.get(equipo.modelo);
        if (!cache.has(equipo.modelo)) {
          catData = getStaticCaterpillarData(equipo.modelo);
          cache.set(equipo.modelo, catData ?? null);
        }
        const tareas = intervalo && catData?.tareasPorIntervalo?.[intervalo]
          ? catData.tareasPorIntervalo[intervalo]
          : [];
        const kit = intervalo && catData?.piezasPorIntervalo?.[intervalo]
          ? catData.piezasPorIntervalo[intervalo].map((pieza) => `${pieza.pieza.numero_parte} · ${pieza.pieza.descripcion}`)
          : [];
        const intervaloDescripcion = intervalo && catData?.intervalos
          ? catData.intervalos.find((item) => item.codigo === intervalo)?.descripcion ?? 'Sin descripción'
          : 'Sin descripción';
        const capacitacion =
          catData?.mantenimientosEspeciales?.find((especial) => especial.intervaloCodigo === intervalo)?.responsableSugerido ||
          'Asignar técnico certificado';

        return {
          ficha: equipo.ficha,
          nombre: equipo.nombre,
          categoria: equipo.categoria,
          intervalo,
          intervaloDescripcion,
          restante: mantenimiento.horasKmRestante,
          proximo: mantenimiento.proximoMantenimiento,
          tareas,
          kit,
          capacitacion,
        } satisfies RutaPlanItem;
      })
      .filter((item): item is RutaPlanItem => item !== null)
      .sort((a, b) => a.restante - b.restante);
  }, [data.equipos, data.mantenimientosProgramados]);

  useEffect(() => {
    setRutaMarcada((prev) => prev.filter((ficha) => planRuta.some((item) => item.ficha === ficha)));
  }, [planRuta]);

  const planRutaFiltrada = useMemo(
    () => (planIntervalo ? planRuta.filter((item) => item.intervalo === planIntervalo) : planRuta),
    [planIntervalo, planRuta],
  );

  const rutaMarcadaFiltrada = useMemo(
    () => rutaMarcada.filter((ficha) => planRutaFiltrada.some((item) => item.ficha === ficha)),
    [rutaMarcada, planRutaFiltrada],
  );

  const rutaSeleccionadaCount = rutaMarcadaFiltrada.length;
  const rutaHeaderState: boolean | 'indeterminate' = planRutaFiltrada.length === 0
    ? false
    : rutaSeleccionadaCount === planRutaFiltrada.length
      ? true
      : rutaSeleccionadaCount > 0
        ? 'indeterminate'
        : false;

  const toggleRutaFicha = (ficha: string) => {
    setRutaMarcada((prev) => (prev.includes(ficha) ? prev.filter((item) => item !== ficha) : [...prev, ficha]));
  };

  const toggleRutaFiltrada = (checked: boolean) => {
    if (checked) {
      setRutaMarcada((prev) => {
        const current = new Set(prev);
        planRutaFiltrada.forEach((item) => current.add(item.ficha));
        return Array.from(current);
      });
    } else {
      setRutaMarcada((prev) => prev.filter((ficha) => !planRutaFiltrada.some((item) => item.ficha === ficha)));
    }
  };

  const limpiarRutaFiltrada = () => {
    setRutaMarcada((prev) => prev.filter((ficha) => !planRutaFiltrada.some((item) => item.ficha === ficha)));
  };

  const resumenActualizaciones = useMemo(() => {
    if (!reporteRango) return null;

    const inicio = new Date(reporteRango.desde);
    const fin = new Date(reporteRango.hasta);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return null;
    }

    const eventosEnRango = data.actualizacionesHorasKm.filter((evento) => {
      const fechaEvento = new Date(evento.fecha);
      if (Number.isNaN(fechaEvento.getTime())) return false;
      return fechaEvento >= inicio && fechaEvento <= fin;
    });

    const eventosPorFicha = new Map<string, ActualizacionHorasKm[]>();
    eventosEnRango.forEach((evento) => {
      const listaEventos = eventosPorFicha.get(evento.ficha) ?? [];
      listaEventos.push(evento);
      eventosPorFicha.set(evento.ficha, listaEventos);
    });

    const actualizados: ResumenActualizaciones['actualizados'] = [];
    const pendientes: ResumenActualizaciones['pendientes'] = [];

    data.mantenimientosProgramados.forEach((mantenimiento) => {
      const fechaUltima = new Date(mantenimiento.fechaUltimaActualizacion);
      if (Number.isNaN(fechaUltima.getTime())) {
        pendientes.push(mantenimiento);
        return;
      }

      const fechaUltimaAjustada = new Date(fechaUltima);
      fechaUltimaAjustada.setHours(0, 0, 0, 0);

      if (fechaUltimaAjustada < inicio || fechaUltimaAjustada > fin) {
        pendientes.push(mantenimiento);
        return;
      }

      const eventosFicha = eventosPorFicha.get(mantenimiento.ficha) ?? [];
      const eventoRelacionado =
        eventosFicha.find((evento) => {
          const fechaEvento = new Date(evento.fecha);
          if (Number.isNaN(fechaEvento.getTime())) return false;
          return fechaEvento.toDateString() === fechaUltima.toDateString();
        }) ?? null;

      actualizados.push({
        mantenimiento,
        evento: eventoRelacionado,
      });
    });

    return {
      desde: reporteRango.desde,
      hasta: reporteRango.hasta,
      actualizados,
      pendientes,
    } satisfies ResumenActualizaciones;
  }, [data.actualizacionesHorasKm, data.mantenimientosProgramados, reporteRango]);

  const totalEquiposPlanificados = data.mantenimientosProgramados.length;
  const coberturaSemanal =
    resumenActualizaciones && totalEquiposPlanificados > 0
      ? Math.round((resumenActualizaciones.actualizados.length / totalEquiposPlanificados) * 100)
      : 0;
  const pendientesCriticos = resumenActualizaciones
    ? resumenActualizaciones.pendientes.filter((mantenimiento) => (mantenimiento.horasKmRestante ?? 0) <= 25)
    : [];
  const ultimasLecturasSemana = resumenActualizaciones
    ? resumenActualizaciones.actualizados
        .slice()
        .sort((a, b) => {
          const fechaA = a.evento?.fecha ? new Date(a.evento.fecha).getTime() : 0;
          const fechaB = b.evento?.fecha ? new Date(b.evento.fecha).getTime() : 0;
          return fechaB - fechaA;
        })
        .slice(0, 3)
    : [];
  const pendientesPrioritarios = resumenActualizaciones
    ? resumenActualizaciones.pendientes
        .slice()
        .sort((a, b) => (a.horasKmRestante ?? 0) - (b.horasKmRestante ?? 0))
        .slice(0, 3)
    : [];
  const hasMantenimientosProgramados = data.mantenimientosProgramados.length > 0;

  if (loading) {
    return (
      <Layout title="Control integral de mantenimiento">
        <Card>
          <CardHeader>
            <CardTitle>Preparando datos</CardTitle>
            <CardDescription>Esperando información de los equipos...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando información de mantenimiento</span>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (!hasMantenimientosProgramados) {
    return (
      <Layout title="Control integral de mantenimiento">
        <div className="space-y-4 px-4 pb-4">
          <Alert variant="warning">
            <AlertTitle>Sin mantenimientos programados</AlertTitle>
            <AlertDescription>
              Define al menos un plan de mantenimiento en el módulo de Planes de mantenimiento o sincroniza tus registros para empezar a visualizar el control integral.
            </AlertDescription>
          </Alert>
          <Card className="border-dashed border-border/70">
            <CardHeader>
              <CardTitle>Planificador preventivo</CardTitle>
              <CardDescription>
                Una vez que haya fichas vinculadas y tareas programadas la información aparecerá automáticamente en este espacio.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Agrega equipos, asigna intervalos y vincula kits para mantener tu programa actualizado.
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!selected) {
    return (
      <Layout title="Control integral de mantenimiento">
        <Card>
          <CardHeader>
            <CardTitle>Preparando selección</CardTitle>
            <CardDescription>Estamos escogiendo el equipo más relevante para mostrarte los detalles.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Recuperando datos del equipo</span>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const proximos = data.mantenimientosProgramados
    .slice()
    .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
    .slice(0, 8);

  const unidadMantenimiento = selected?.tipoMantenimiento?.toLowerCase().includes('km') ? 'km' : 'horas';

  const handleActualizarHoras = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      await updateHorasActuales({
        mantenimientoId: selected.id,
        horasKm: Number(horasLectura),
        fecha: fechaLectura,
        usuarioResponsable: responsableLectura || undefined,
        observaciones: notasLectura || undefined,
        unidad: unidadLectura,
      });
      setNotasLectura('');
    } finally {
      setUpdating(false);
    }
  };

  const handleRegistrarMantenimiento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setRegistering(true);
    try {
      const filtros = registroFiltros
        .split(',')
        .map((filtro) => filtro.trim())
        .filter(Boolean)
        .map((nombre) => ({ nombre, cantidad: 1 } as MantenimientoRealizado['filtrosUtilizados'][number]));

      await registrarMantenimientoRealizado({
        mantenimientoId: selected.id,
        fecha: registroFecha,
        horasKm: Number(registroHoras),
        observaciones: registroObservaciones || undefined,
        filtrosUtilizados: filtros as MantenimientoRealizado['filtrosUtilizados'],
        usuarioResponsable: registroResponsable || undefined,
        unidad: unidadRegistro,
      });
      setRegistroObservaciones('');
      setRegistroFiltros('');
    } finally {
      setRegistering(false);
    }
  };

  const handleGenerarReporte = (options?: { abrirResumenFlotante?: boolean }) => {
    if (!reporteDesde || !reporteHasta) {
      toast({
        title: 'Selecciona el rango',
        description: 'Debes indicar fecha inicial y final para generar el resumen.',
        variant: 'destructive',
      });
      return;
    }

    const inicio = new Date(reporteDesde);
    const fin = new Date(reporteHasta);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      toast({
        title: 'Fechas inválidas',
        description: 'Verifica los valores seleccionados e intenta nuevamente.',
        variant: 'destructive',
      });
      return;
    }

    if (inicio > fin) {
      toast({
        title: 'Rango incorrecto',
        description: 'La fecha inicial no puede ser mayor que la final.',
        variant: 'destructive',
      });
      return;
    }

    const rangoNormalizado = normalizarRangoFechas(reporteDesde, reporteHasta);

    if (!rangoNormalizado) {
      toast({
        title: 'Rango inválido',
        description: 'No fue posible normalizar las fechas. Intenta nuevamente.',
        variant: 'destructive',
      });
      return;
    }

    setReporteRango(rangoNormalizado);
    if (options?.abrirResumenFlotante ?? true) {
      setIsResumenOpen(true);
    }
  };

  const handleLimpiarReporte = () => {
    setReporteDesde('');
    setReporteHasta('');
    setReporteRango(null);
  };

  const handleSemanaActual = () => {
    const semanaActual = obtenerSemanaActual();
    setReporteDesde(semanaActual.desde);
    setReporteHasta(semanaActual.hasta);
    const rangoNormalizado = normalizarRangoFechas(semanaActual.desde, semanaActual.hasta);
    if (rangoNormalizado) {
      setReporteRango(rangoNormalizado);
      setReporteSegmento('resumen');
    }
  };

  return (
    <>
      <Layout title="Control integral de mantenimiento">
        <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as 'mantenimiento' | 'planificador')} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="mantenimiento" className="gap-2">
              <Gauge className="h-4 w-4" />
              Mantenimiento
            </TabsTrigger>
            <TabsTrigger value="planificador" className="gap-2">
              <Route className="h-4 w-4" />
              Planificador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mantenimiento" className="space-y-8 lg:space-y-10 mt-0">
        <div className="space-y-6 lg:space-y-8">
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Card className="group relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50/60 via-blue-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-950/15 hover:shadow-2xl hover:scale-[1.03] hover:border-blue-300 transition-all duration-500">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="space-y-2 pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-blue-500/15 rounded-xl group-hover:bg-blue-500/25 transition-colors duration-300">
                    <CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5 bg-blue-500/10 text-blue-700 border-blue-200">Activos</Badge>
                </div>
                <CardTitle className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Programados
                </CardTitle>
                <CardDescription className="text-4xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {totalEquiposPlanificados}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pb-4 pt-0 relative z-10 font-medium">
                Equipos con plan preventivo activo
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50/60 via-green-50/30 to-transparent dark:from-green-950/30 dark:via-green-950/15 hover:shadow-2xl hover:scale-[1.03] hover:border-green-300 transition-all duration-500">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="space-y-2 pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-green-500/15 rounded-xl group-hover:bg-green-500/25 transition-colors duration-300">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5 bg-green-500/10 text-green-700 border-green-200">Cobertura</Badge>
                </div>
                <CardTitle className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Cobertura Semanal
                </CardTitle>
                <CardDescription className="text-4xl font-black text-green-600 dark:text-green-400 tabular-nums">
                  {coberturaSemanal}%
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0 space-y-2.5 relative z-10">
                <Progress value={coberturaSemanal} className="h-3 bg-green-100 dark:bg-green-950/50 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-green-600" />
                <p className="text-xs text-muted-foreground font-medium">
                  {resumenActualizaciones?.actualizados.length ?? 0} lecturas en la última ventana
                </p>
              </CardContent>
            </Card>

            <Card className={`group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] ${
              pendientesCriticos.length > 0 
                ? 'border-red-200 bg-gradient-to-br from-red-50/60 via-red-50/30 to-transparent dark:from-red-950/30 dark:via-red-950/15 hover:border-red-300' 
                : 'border-gray-200 bg-gradient-to-br from-gray-50/60 via-gray-50/30 to-transparent dark:from-gray-950/30 hover:border-gray-300'
            }`}>
              <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700 ${
                pendientesCriticos.length > 0 ? 'bg-red-500/10' : 'bg-gray-500/10'
              }`} />
              <CardHeader className="space-y-2 pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl transition-colors duration-300 ${
                    pendientesCriticos.length > 0 
                      ? 'bg-red-500/15 group-hover:bg-red-500/25' 
                      : 'bg-gray-500/15 group-hover:bg-gray-500/25'
                  }`}>
                    <AlertTriangle className={`h-6 w-6 ${pendientesCriticos.length > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-400'}`} />
                  </div>
                  {pendientesCriticos.length > 0 && (
                    <Badge variant="destructive" className="text-[0.65rem] px-2 py-0.5 animate-pulse">¡Urgente!</Badge>
                  )}
                </div>
                <CardTitle className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Críticos
                </CardTitle>
                <CardDescription className={`text-4xl font-black tabular-nums ${
                  pendientesCriticos.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                }`}>
                  {pendientesCriticos.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pb-4 pt-0 relative z-10 font-medium">
                Con menos de 25 h/km disponibles
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50/60 via-purple-50/30 to-transparent dark:from-purple-950/30 dark:via-purple-950/15 hover:shadow-2xl hover:scale-[1.03] hover:border-purple-300 transition-all duration-500">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="space-y-2 pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl group-hover:bg-purple-500/25 transition-colors duration-300">
                    <Route className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5 bg-purple-500/10 text-purple-700 border-purple-200">Ruta</Badge>
                </div>
                <CardTitle className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Ruta Inteligente
                </CardTitle>
                <CardDescription className="text-4xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
                  {rutaSeleccionadaCount}<span className="text-2xl text-muted-foreground">/{planRutaFiltrada.length || planRuta.length}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pb-4 pt-0 relative z-10 font-medium">
                Marcados para recorrido preventivo
              </CardContent>
            </Card>
          </section>
          <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
            <div className="space-y-6">

            <Card className="relative overflow-hidden border-2 border-primary/40 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-primary/5 via-background to-muted/20">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              <CardHeader className="pb-6 border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/15 rounded-xl">
                    <Gauge className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-black">Actualiza y registra</span>
                </CardTitle>
                <CardDescription className="text-sm mt-2 font-medium">Gestiona lecturas y mantenimientos desde un mismo panel</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Seleccionar equipo
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarListaEquipos(!mostrarListaEquipos)}
                      className="gap-2 h-9 text-xs rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 font-semibold"
                    >
                      <ClipboardList className="h-4 w-4" />
                      {mostrarListaEquipos ? 'Ocultar lista' : 'Ver todos'}
                    </Button>
                  </div>
                  
                  {mostrarListaEquipos && (
                    <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-muted/40 to-muted/20 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 shadow-lg">
                      <div className="relative">
                        <Input
                          placeholder="🔍 Buscar por ficha o nombre..."
                          value={busquedaEquipo}
                          onChange={(e) => setBusquedaEquipo(e.target.value)}
                          className="bg-background border-2 h-10 text-sm font-medium pl-4 focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                        {data.mantenimientosProgramados
                          .filter(mp => {
                            const search = busquedaEquipo.toLowerCase();
                            return mp.ficha.toLowerCase().includes(search) || 
                                   mp.nombreEquipo.toLowerCase().includes(search);
                          })
                          .sort((a, b) => a.ficha.localeCompare(b.ficha))
                          .map(mp => (
                            <button
                              key={mp.id}
                              type="button"
                              onClick={() => {
                                setSelectedId(mp.id);
                                setMostrarListaEquipos(false);
                                setBusquedaEquipo('');
                              }}
                              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-300 ${
                                selectedId === mp.id 
                                  ? 'bg-primary/15 border-primary/60 shadow-lg scale-[1.02] ring-2 ring-primary/20' 
                                  : 'bg-background hover:bg-accent/50 hover:shadow-md hover:scale-[1.01] hover:border-primary/30'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2.5 mb-1.5">
                                    <Badge variant="outline" className="font-mono text-[0.7rem] px-2 py-0.5 font-bold border-2">{mp.ficha}</Badge>
                                    <span className="font-bold text-sm truncate">{mp.nombreEquipo}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[0.7rem] text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1">
                                      <Wrench className="h-3 w-3" />
                                      {mp.tipoMantenimiento}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Gauge className="h-3 w-3" />
                                      {mp.horasKmActuales} {mp.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'h'}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={getRemainingVariant(mp.horasKmRestante)} className="flex-shrink-0 text-sm font-black px-3 py-1.5 shadow-sm">
                                  {mp.horasKmRestante}
                                </Badge>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <EquipoSelectorDialog
                    equipos={data.equipos.filter(eq => 
                      data.mantenimientosProgramados.some(mp => mp.ficha === eq.ficha)
                    )}
                    equipoSeleccionado={selected?.ficha}
                    onSelect={(ficha) => {
                      const mantenimiento = data.mantenimientosProgramados.find(mp => mp.ficha === ficha);
                      if (mantenimiento) {
                        setSelectedId(mantenimiento.id);
                      }
                    }}
                    titulo="Seleccionar Equipo para Mantenimiento"
                    descripcion="Selecciona el equipo a gestionar"
                  />
                  
                  {selected && (
                    <Card className="relative overflow-hidden border-2 border-l-4 border-l-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-xl animate-in fade-in slide-in-from-left duration-500">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
                      <CardContent className="p-4 relative z-10">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-2">
                                <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1 font-bold border-2">{selected.ficha}</Badge>
                                <Badge variant="outline" className="text-xs px-2.5 py-1">
                                  {selected.tipoMantenimiento}
                                </Badge>
                              </div>
                              <h3 className="font-black text-lg mb-1 leading-tight">{selected.nombreEquipo}</h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 p-3.5 border border-blue-200/50 dark:border-blue-800/30">
                              <p className="text-[0.65rem] text-muted-foreground uppercase font-bold tracking-wider mb-1">Lectura actual</p>
                              <p className="text-2xl font-black mt-1.5 text-blue-600 dark:text-blue-400 tabular-nums">{selected.horasKmActuales}</p>
                              <p className="text-[0.65rem] text-muted-foreground mt-1.5 font-medium">{selected.tipoMantenimiento.toLowerCase().includes('km') ? 'kilómetros' : 'horas'}</p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 p-3.5 border border-orange-200/50 dark:border-orange-800/30">
                              <p className="text-[0.65rem] text-muted-foreground uppercase font-bold tracking-wider mb-1">Restante</p>
                              <div className="mt-1.5">
                                <Badge variant={getRemainingVariant(selected.horasKmRestante)} className="text-xl font-black px-3 py-1.5 shadow-sm">
                                  {selected.horasKmRestante}
                                </Badge>
                              </div>
                              <p className="text-[0.65rem] text-muted-foreground mt-1.5 font-medium">hasta próximo MP</p>
                            </div>
                          </div>
                          <div className="rounded-xl bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 p-3.5 border border-green-200/50 dark:border-green-800/30">
                            <p className="text-[0.65rem] text-muted-foreground uppercase font-bold tracking-wider mb-2">Próximo mantenimiento</p>
                            <div className="flex flex-col gap-1.5">
                              <span className="font-black text-base text-green-600 dark:text-green-400">En {selected.proximoMantenimiento} {selected.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'h'}</span>
                              <span className="text-[0.7rem] text-muted-foreground font-medium">Última actualización: {formatDate(selected.fechaUltimaActualizacion)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Tabs defaultValue="lecturas" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 h-auto p-1.5 bg-muted/50 rounded-xl gap-1.5">
                    <TabsTrigger value="lecturas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-10 font-bold transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]">
                      <Gauge className="w-4 h-4 mr-2" />
                      Actualizar lectura
                    </TabsTrigger>
                    <TabsTrigger value="mantenimientos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-10 font-bold transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]">
                      <Wrench className="w-4 h-4 mr-2" />
                      Registrar mantenimiento
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="lecturas" className="space-y-4">
                    {!selected ? (
                      <Alert className="border-2 border-yellow-300/50 bg-gradient-to-r from-yellow-50/60 to-transparent dark:from-yellow-950/30 shadow-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle className="font-black text-base">Selecciona un equipo</AlertTitle>
                        <AlertDescription className="font-medium">
                          Debes seleccionar un equipo antes de actualizar su lectura.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <form className="grid gap-5" onSubmit={handleActualizarHoras}>
                        <div className="relative overflow-hidden rounded-xl border-2 border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/60 via-blue-50/30 to-transparent dark:from-blue-950/30 p-4 shadow-md">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl -mr-12 -mt-12" />
                          <p className="text-sm font-black uppercase tracking-wider mb-3 text-blue-700 dark:text-blue-400 relative z-10">📊 Información actual</p>
                          <div className="flex items-center justify-between text-sm relative z-10">
                            <span className="text-muted-foreground font-bold">Última lectura registrada:</span>
                            <Badge variant="secondary" className="text-base font-black px-3 py-1.5 border-2 shadow-sm">{selected.horasKmActuales} {selected.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'h'}</Badge>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-2.5">
                            <Label htmlFor="horasLectura" className="text-base font-black flex items-center gap-2">
                              <Gauge className="w-4 h-4" />
                              Nueva lectura *
                            </Label>
                            <Input
                              id="horasLectura"
                              type="number"
                              min={0}
                              step="0.1"
                              required
                              value={horasLectura}
                              onChange={(event) => setHorasLectura(event.target.value)}
                              placeholder={`Ej: ${Number(selected.horasKmActuales) + 10}`}
                              className="text-lg font-bold h-12 border-2 focus-visible:ring-2 focus-visible:ring-primary/50"
                            />
                            <p className="text-xs text-muted-foreground font-medium">
                              Ingresa la nueva lectura del hodómetro/cuenta horas
                            </p>
                          </div>
                          <div className="grid gap-2.5">
                            <Label htmlFor="unidadLectura" className="text-base font-black">Unidad de medición *</Label>
                            <Select value={unidadLectura} onValueChange={(value) => setUnidadLectura(value as 'horas' | 'km')}>
                              <SelectTrigger id="unidadLectura" className="h-12 border-2 font-bold">
                                <SelectValue placeholder="Selecciona unidad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="horas" className="font-bold">⏱️ Horas de uso</SelectItem>
                                <SelectItem value="km" className="font-bold">🛣️ Kilómetros</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-2.5">
                            <Label htmlFor="fechaLectura" className="font-black flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Fecha de la lectura *
                            </Label>
                            <Input
                              id="fechaLectura"
                              type="date"
                              required
                              value={fechaLectura}
                              onChange={(event) => setFechaLectura(event.target.value)}
                              max={new Date().toISOString().slice(0, 10)}
                              className="h-11 border-2 font-semibold"
                            />
                          </div>
                          <div className="grid gap-2.5">
                            <Label htmlFor="responsableLectura" className="font-black flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Responsable
                            </Label>
                            <Input
                              id="responsableLectura"
                              placeholder="Operador o técnico"
                              value={responsableLectura}
                              onChange={(event) => setResponsableLectura(event.target.value)}
                              className="h-11 border-2"
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2.5">
                          <Label htmlFor="notasLectura" className="font-black flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Observaciones
                          </Label>
                          <Textarea
                            id="notasLectura"
                            placeholder="Condición del equipo, anomalías detectadas, etc."
                            value={notasLectura}
                            onChange={(event) => setNotasLectura(event.target.value)}
                            rows={3}
                            className="border-2 resize-none"
                          />
                        </div>
                        
                        <Button type="submit" disabled={updating || !selected} size="lg" className="w-full gap-2.5 h-12 font-black text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                          {updating ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" /> Guardando...
                            </>
                          ) : (
                            <>
                              <CalendarCheck className="h-5 w-5" />
                              Actualizar lectura
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </TabsContent>
                  <TabsContent value="mantenimientos" className="space-y-4">
                    {!selected ? (
                      <Alert className="border-2 border-yellow-300/50 bg-gradient-to-r from-yellow-50/60 to-transparent dark:from-yellow-950/30 shadow-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle className="font-black text-base">Selecciona un equipo</AlertTitle>
                        <AlertDescription className="font-medium">
                          Debes seleccionar un equipo antes de registrar un mantenimiento.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <form className="grid gap-5" onSubmit={handleRegistrarMantenimiento}>
                        <div className="relative overflow-hidden rounded-xl border-2 border-green-200/50 dark:border-green-800/30 bg-gradient-to-br from-green-50/60 via-green-50/30 to-transparent dark:from-green-950/30 p-4 shadow-md">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/10 rounded-full blur-2xl -mr-12 -mt-12" />
                          <p className="text-sm font-black uppercase tracking-wider mb-3 text-green-700 dark:text-green-400 relative z-10">⚙️ Información del equipo</p>
                          <div className="space-y-2 text-sm relative z-10">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground font-bold">Próximo mantenimiento:</span>
                              <span className="font-black text-base">{selected.proximoMantenimiento} {selected.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'h'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground font-bold">Restante:</span>
                              <Badge variant={getRemainingVariant(selected.horasKmRestante)} className="font-black px-3 py-1.5 shadow-sm">
                                {selected.horasKmRestante} {selected.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'h'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="grid gap-2.5">
                            <Label htmlFor="registroFecha" className="font-black flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Fecha del mantenimiento *
                            </Label>
                            <Input
                              id="registroFecha"
                              type="date"
                              required
                              value={registroFecha}
                              onChange={(event) => setRegistroFecha(event.target.value)}
                              max={new Date().toISOString().slice(0, 10)}
                              className="h-11 border-2 font-semibold"
                            />
                          </div>
                          <div className="grid gap-2.5">
                            <Label htmlFor="registroHoras" className="font-black flex items-center gap-2">
                              <Gauge className="w-4 h-4" />
                              Lectura al momento *
                            </Label>
                            <Input
                              id="registroHoras"
                              type="number"
                              min={0}
                              step="0.1"
                              required
                              value={registroHoras}
                              onChange={(event) => setRegistroHoras(event.target.value)}
                              placeholder={selected.horasKmActuales.toString()}
                              className="font-bold h-11 border-2"
                            />
                          </div>
                          <div className="grid gap-2.5">
                            <Label htmlFor="registroUnidad" className="font-black">Unidad *</Label>
                            <Select
                              value={unidadRegistro}
                              onValueChange={(value) => setUnidadRegistro(value as 'horas' | 'km')}
                            >
                              <SelectTrigger id="registroUnidad" className="h-11 border-2 font-bold">
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="horas" className="font-bold">⏱️ Horas</SelectItem>
                                <SelectItem value="km" className="font-bold">🛣️ Km</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid gap-2.5">
                          <Label htmlFor="registroResponsable" className="font-black flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Responsable / Técnico
                          </Label>
                          <Input
                            id="registroResponsable"
                            placeholder="Nombre del técnico o cuadrilla responsable"
                            value={registroResponsable}
                            onChange={(event) => setRegistroResponsable(event.target.value)}
                            className="h-11 border-2"
                          />
                        </div>
                        
                        <div className="grid gap-2.5">
                          <Label htmlFor="registroFiltros" className="font-black flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Filtros o repuestos utilizados
                          </Label>
                          <Textarea
                            id="registroFiltros"
                            placeholder="Ej: Filtro de aceite, Filtro de aire, Filtro de combustible (separar por coma)"
                            value={registroFiltros}
                            onChange={(event) => setRegistroFiltros(event.target.value)}
                            rows={2}
                            className="border-2 resize-none"
                          />
                          <p className="text-xs text-muted-foreground font-medium">
                            Lista los repuestos utilizados separados por coma
                          </p>
                        </div>
                        
                        <div className="grid gap-2.5">
                          <Label htmlFor="registroObservaciones" className="font-black flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Observaciones del trabajo realizado
                          </Label>
                          <Textarea
                            id="registroObservaciones"
                            placeholder="Detalla el trabajo realizado, hallazgos, recomendaciones, etc."
                            value={registroObservaciones}
                            onChange={(event) => setRegistroObservaciones(event.target.value)}
                            rows={4}
                            className="border-2 resize-none"
                          />
                        </div>
                        
                        <Button type="submit" disabled={registering || !selected} size="lg" className="w-full gap-2.5 h-12 font-black text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                          {registering ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" /> Guardando...
                            </>
                          ) : (
                            <>
                              <Wrench className="h-5 w-5" />
                              Registrar mantenimiento
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

              <Card className="relative overflow-hidden flex flex-col shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-t-4 border-t-primary animate-in fade-in slide-in-from-bottom">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                <CardHeader className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4 border-b-2 border-primary/20">
                  <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="p-2 bg-primary/15 rounded-xl">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-black">Próximas intervenciones</CardTitle>
                    </div>
                    <CardDescription className="text-xs font-medium">Calendario dinámico con los siguientes equipos a intervenir</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 px-0 pb-5 sm:px-6 pt-4">
                <div className="-mx-4 overflow-x-auto sm:mx-0">
                  <div className="min-w-full rounded-xl border-2 shadow-lg">
                    <Table className="w-full min-w-[640px]">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-2">
                          <TableHead className="font-black text-xs uppercase tracking-wider">Equipo</TableHead>
                          <TableHead className="font-black text-xs uppercase tracking-wider">Ficha</TableHead>
                          <TableHead className="font-black text-xs uppercase tracking-wider">Tipo</TableHead>
                          <TableHead className="text-right font-black text-xs uppercase tracking-wider">Restante</TableHead>
                          <TableHead className="font-black text-xs uppercase tracking-wider">Próximo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proximos.map((mantenimiento) => (
                          <TableRow key={mantenimiento.id} className="hover:bg-accent/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] border-b hover:shadow-md">
                            <TableCell className="font-black text-sm">{mantenimiento.nombreEquipo}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-[0.65rem] px-2 py-1 font-bold border-2">
                                {mantenimiento.ficha}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-bold">{mantenimiento.tipoMantenimiento}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={mantenimiento.horasKmRestante <= 15 ? 'destructive' : mantenimiento.horasKmRestante <= 50 ? 'default' : 'secondary'}
                                className="font-black text-sm px-3 py-1.5 shadow-sm"
                              >
                                {mantenimiento.horasKmRestante}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-black text-sm">{mantenimiento.proximoMantenimiento}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
<Card className="relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-t-4 border-t-blue-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-500/60 to-transparent" />
              <CardHeader className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-gradient-to-r from-blue-50/60 via-blue-50/30 to-transparent dark:from-blue-950/30 pb-4 border-b-2 border-blue-200/50 dark:border-blue-800/30">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/15 rounded-xl">
                      <CalendarRange className="h-5 w-5 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl font-black">Reportes de actualizaciones</CardTitle>
                  </div>
                  <CardDescription className="text-xs font-medium">
                    Lecturas registradas esta semana y equipos pendientes
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground lg:justify-end relative z-10">
                  {resumenActualizaciones ? (
                    <>
                      <Badge variant="secondary" className="text-xs font-black px-3 py-1.5 shadow-sm border-2">
                        Actualizados: {resumenActualizaciones.actualizados.length}
                      </Badge>
                      <Badge variant={resumenActualizaciones.pendientes.length > 0 ? 'destructive' : 'outline'} className="text-xs font-black px-3 py-1.5 shadow-sm border-2">
                        Pendientes: {resumenActualizaciones.pendientes.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-bold px-3 py-1.5 border-2">
                        {new Date(resumenActualizaciones.desde).toLocaleDateString()} -{' '}
                        {new Date(resumenActualizaciones.hasta).toLocaleDateString()}
                      </Badge>
                    </>
                  ) : (
                    <p className="text-xs font-medium">Configura rango para activar panel</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="grid gap-2.5">
                    <Label htmlFor="reporteDesdeInline" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Desde
                    </Label>
                    <Input
                      id="reporteDesdeInline"
                      type="date"
                      value={reporteDesde}
                      onChange={(event) => setReporteDesde(event.target.value)}
                      className="h-10 text-sm border-2 font-semibold"
                    />
                  </div>
                  <div className="grid gap-2.5">
                    <Label htmlFor="reporteHastaInline" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Hasta
                    </Label>
                    <Input
                      id="reporteHastaInline"
                      type="date"
                      value={reporteHasta}
                      onChange={(event) => setReporteHasta(event.target.value)}
                      className="h-10 text-sm border-2 font-semibold"
                    />
                  </div>
                  <div className="grid gap-2.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Atajo rápido</Label>
                    <Button type="button" variant="secondary" onClick={handleSemanaActual} className="h-10 text-sm font-bold border-2 hover:scale-[1.02] transition-transform">
                      📅 Semana en curso
                    </Button>
                  </div>
                  <div className="grid gap-2.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Vista extendida</Label>
                    <Button type="button" variant="outline" className="gap-2 h-10 text-sm font-bold border-2 hover:scale-[1.02] transition-transform" onClick={() => setIsResumenOpen(true)}>
                      <CalendarRange className="h-3.5 w-3.5" /> 📊 Panel flotante
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => handleGenerarReporte({ abrirResumenFlotante: false })} size="sm" className="gap-2 font-bold shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                    <CalendarCheck className="h-4 w-4" />
                    Actualizar vista
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleLimpiarReporte} size="sm" className="font-bold hover:scale-[1.02] transition-transform">
                    ✖️ Limpiar
                  </Button>
                </div>

                {resumenActualizaciones ? (
                  <Tabs
                    value={reporteSegmento}
                    onValueChange={(value) => setReporteSegmento(value as 'resumen' | 'actualizados' | 'pendientes')}
                    className="space-y-4"
                  >
                    <TabsList className="flex w-full flex-col gap-2 sm:flex-row h-auto p-1.5 bg-muted/50 rounded-xl">
                      <TabsTrigger value="resumen" className="flex-1 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-10 transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]">
                        📊 Panorama semanal
                      </TabsTrigger>
                      <TabsTrigger value="actualizados" className="flex-1 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-10 transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]">
                        ✅ Actualizados
                      </TabsTrigger>
                      <TabsTrigger value="pendientes" className="flex-1 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-10 transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]">
                        ⏳ Pendientes
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="resumen" className="space-y-4">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <div className="relative overflow-hidden rounded-xl border-2 border-green-200/50 dark:border-green-800/30 bg-gradient-to-br from-green-50/60 via-green-50/30 to-transparent dark:from-green-950/30 p-4 shadow-md hover:shadow-lg transition-shadow">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-full blur-2xl -mr-10 -mt-10" />
                          <p className="text-[0.65rem] font-black uppercase tracking-wider text-green-700 dark:text-green-400 relative z-10">
                            Lecturas registradas
                          </p>
                          <p className="mt-2 text-4xl font-black tabular-nums relative z-10">
                            {resumenActualizaciones.actualizados.length}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 font-medium relative z-10">
                            Cobertura {coberturaSemanal}% sobre {totalEquiposPlanificados} monitoreos
                          </p>
                        </div>
                        <div className="relative overflow-hidden rounded-xl border-2 border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/60 via-amber-50/30 to-transparent dark:from-amber-950/30 p-4 shadow-md hover:shadow-lg transition-shadow">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10" />
                          <p className="text-[0.65rem] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 relative z-10">
                            Pendientes
                          </p>
                          <p className="mt-2 text-4xl font-black tabular-nums relative z-10">
                            {resumenActualizaciones.pendientes.length}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 font-medium relative z-10">
                            {pendientesCriticos.length} con menos de 25 h/km disponibles
                          </p>
                        </div>
                        <div className="relative overflow-hidden rounded-xl border-2 border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/60 via-blue-50/30 to-transparent dark:from-blue-950/30 p-4 shadow-md hover:shadow-lg transition-shadow">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl -mr-10 -mt-10" />
                          <p className="text-[0.65rem] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 relative z-10">
                            Rango analizado
                          </p>
                          <p className="mt-2 text-base font-black leading-tight relative z-10">
                            {new Date(resumenActualizaciones.desde).toLocaleDateString()} -{' '}
                            {new Date(resumenActualizaciones.hasta).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 font-medium relative z-10">
                            Ajusta el rango para otra semana
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border-2 p-4 bg-gradient-to-br from-muted/40 to-transparent shadow-sm">
                          <p className="text-sm font-black mb-1">Actualizaciones de la semana</p>
                          <div className="mt-3 space-y-3">
                            {ultimasLecturasSemana.length === 0 ? (
                              <p className="text-sm text-muted-foreground font-medium">
                                Aún no se registran lecturas en este rango.
                              </p>
                            ) : (
                              ultimasLecturasSemana.map(({ mantenimiento, evento }) => (
                                <div
                                  key={mantenimiento.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border-2 p-3 hover:bg-accent/50 transition-colors"
                                >
                                  <div>
                                    <p className="font-medium">{mantenimiento.nombreEquipo ?? 'Equipo sin nombre'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {mantenimiento.ficha ? `Ficha ${mantenimiento.ficha}` : 'Sin ficha registrada'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Responsable: {evento?.usuarioResponsable ?? 'No registrado'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline">{evento ? formatDate(evento.fecha) : 'Sin fecha'}</Badge>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {evento ? `${evento.horasKm} h/km` : 'Sin lectura'}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-semibold">Pendientes prioritarios</p>
                          <div className="mt-3 space-y-3">
                            {pendientesPrioritarios.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Todos los equipos están al día.</p>
                            ) : (
                              pendientesPrioritarios.map((mantenimiento) => (
                                <div
                                  key={mantenimiento.id}
                                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                                >
                                  <div>
                                    <p className="font-medium">{mantenimiento.nombreEquipo ?? 'Equipo sin nombre'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {mantenimiento.ficha ? `Ficha ${mantenimiento.ficha}` : 'Sin ficha registrada'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={getRemainingVariant(mantenimiento.horasKmRestante)}>
                                      {formatRemainingLabel(mantenimiento.horasKmRestante)}
                                    </Badge>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Lectura actual: {mantenimiento.horasKmActuales} h/km
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="actualizados" className="space-y-4">
                      {resumenActualizaciones.actualizados.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay registros en el rango seleccionado.</p>
                      ) : (
                        <div className="-mx-4 overflow-x-auto sm:mx-0">
                          <div className="min-w-full rounded-md border">
                            <Table className="w-full min-w-[560px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Equipo</TableHead>
                                  <TableHead>Ficha</TableHead>
                                  <TableHead>Última lectura</TableHead>
                                  <TableHead>Responsable</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {resumenActualizaciones.actualizados.map(({ mantenimiento, evento }) => (
                                  <TableRow key={mantenimiento.id}>
                                    <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                                    <TableCell>{mantenimiento.ficha}</TableCell>
                                    <TableCell>
                                      {evento
                                        ? `${evento.horasKm} h/km • ${new Date(evento.fecha).toLocaleDateString()}`
                                        : 'Sin detalle'}
                                    </TableCell>
                                    <TableCell>{evento?.usuarioResponsable ?? 'No registrado'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="pendientes" className="space-y-4">
                      {resumenActualizaciones.pendientes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Todos los equipos tienen lectura en el rango.</p>
                      ) : (
                        <div className="-mx-4 overflow-x-auto sm:mx-0">
                          <div className="min-w-full rounded-md border">
                            <Table className="w-full min-w-[520px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Equipo</TableHead>
                                  <TableHead>Ficha</TableHead>
                                  <TableHead>Última actualización</TableHead>
                                  <TableHead>Horas/km actuales</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {resumenActualizaciones.pendientes.map((mantenimiento) => (
                                  <TableRow key={mantenimiento.id}>
                                    <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                                    <TableCell>{mantenimiento.ficha}</TableCell>
                                    <TableCell>{formatDate(mantenimiento.fechaUltimaActualizacion)}</TableCell>
                                    <TableCell>{mantenimiento.horasKmActuales}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Completa el rango y actualiza la vista para habilitar el resumen semanal.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {planificadorOpen && (
          <div
            role="dialog"
            aria-modal="false"
            className="pointer-events-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-primary/25 bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Route className="h-5 w-5 text-primary" /> Planificador preventivo Caterpillar
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Usa esta burbuja para ver los kits, tareas y rutas sin ocupar toda la pantalla.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPlanificadorOpen(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar planificador</span>
              </Button>
            </div>
            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">{planPanelContent}</div>
          </div>
        )}
        {isResumenOpen && (
          <div
            role="dialog"
            aria-modal="false"
            className="pointer-events-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-primary/20 bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <CalendarRange className="h-5 w-5 text-primary" /> Resumen por rango de actualización
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mantén abierta la ventana para actualizar lecturas o registrar mantenimientos en paralelo.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsResumenOpen(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar resumen</span>
              </Button>
            </div>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="reporteDesde" className="font-semibold">Desde</Label>
                  <Input
                    id="reporteDesde"
                    type="date"
                    value={reporteDesde}
                    onChange={(event) => setReporteDesde(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reporteHasta" className="font-semibold">Hasta</Label>
                  <Input
                    id="reporteHasta"
                    type="date"
                    value={reporteHasta}
                    onChange={(event) => setReporteHasta(event.target.value)}
                  />
                </div>
              </div>
              
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase">Rangos rápidos</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      const hoy = new Date();
                      const formatted = hoy.toISOString().slice(0, 10);
                      setReporteDesde(formatted);
                      setReporteHasta(formatted);
                      const rangoNormalizado = normalizarRangoFechas(formatted, formatted);
                      if (rangoNormalizado) setReporteRango(rangoNormalizado);
                    }}
                  >
                    Hoy
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      const hoy = new Date();
                      const ayer = new Date(hoy);
                      ayer.setDate(ayer.getDate() - 1);
                      const formatted = ayer.toISOString().slice(0, 10);
                      setReporteDesde(formatted);
                      setReporteHasta(formatted);
                      const rangoNormalizado = normalizarRangoFechas(formatted, formatted);
                      if (rangoNormalizado) setReporteRango(rangoNormalizado);
                    }}
                  >
                    Ayer
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={handleSemanaActual}>
                    Semana actual
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      const hoy = new Date();
                      const hace7dias = new Date(hoy);
                      hace7dias.setDate(hace7dias.getDate() - 7);
                      setReporteDesde(hace7dias.toISOString().slice(0, 10));
                      setReporteHasta(hoy.toISOString().slice(0, 10));
                      const rangoNormalizado = normalizarRangoFechas(
                        hace7dias.toISOString().slice(0, 10),
                        hoy.toISOString().slice(0, 10)
                      );
                      if (rangoNormalizado) setReporteRango(rangoNormalizado);
                    }}
                  >
                    Últimos 7 días
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      const hoy = new Date();
                      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                      setReporteDesde(primerDiaMes.toISOString().slice(0, 10));
                      setReporteHasta(hoy.toISOString().slice(0, 10));
                      const rangoNormalizado = normalizarRangoFechas(
                        primerDiaMes.toISOString().slice(0, 10),
                        hoy.toISOString().slice(0, 10)
                      );
                      if (rangoNormalizado) setReporteRango(rangoNormalizado);
                    }}
                  >
                    Este mes
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="button" onClick={() => handleGenerarReporte()} className="flex-1 gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  Generar reporte
                </Button>
                <Button type="button" variant="outline" onClick={handleLimpiarReporte}>
                  Limpiar
                </Button>
              </div>
            </div>

            {resumenActualizaciones ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary">
                    Actualizados: {resumenActualizaciones.actualizados.length}
                  </Badge>
                  <Badge variant={resumenActualizaciones.pendientes.length > 0 ? 'destructive' : 'outline'}>
                    Pendientes: {resumenActualizaciones.pendientes.length}
                  </Badge>
                  <Badge variant="outline">
                    Período: {new Date(resumenActualizaciones.desde).toLocaleDateString()} - {new Date(resumenActualizaciones.hasta).toLocaleDateString()}
                  </Badge>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Equipos con lectura registrada</h4>
                    {resumenActualizaciones.actualizados.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay registros en el rango seleccionado.</p>
                    ) : (
                      <div className="-mx-4 overflow-x-auto sm:mx-0">
                        <div className="min-w-full rounded-md border">
                          <Table className="w-full min-w-[560px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Equipo</TableHead>
                                <TableHead>Ficha</TableHead>
                                <TableHead>Última lectura</TableHead>
                                <TableHead>Responsable</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resumenActualizaciones.actualizados.map(({ mantenimiento, evento }) => (
                                <TableRow key={mantenimiento.id}>
                                  <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                                  <TableCell>{mantenimiento.ficha}</TableCell>
                                  <TableCell>
                                    {evento
                                      ? `${evento.horasKm} h/km • ${new Date(evento.fecha).toLocaleDateString()}`
                                      : 'Sin detalle'}
                                  </TableCell>
                                  <TableCell>{evento?.usuarioResponsable ?? 'No registrado'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Equipos pendientes</h4>
                    {resumenActualizaciones.pendientes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Todos los equipos tienen lectura en el rango.</p>
                    ) : (
                      <div className="-mx-4 overflow-x-auto sm:mx-0">
                        <div className="min-w-full rounded-md border">
                          <Table className="w-full min-w-[520px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Equipo</TableHead>
                                <TableHead>Ficha</TableHead>
                                <TableHead>Última actualización</TableHead>
                                <TableHead>Horas/km actuales</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resumenActualizaciones.pendientes.map((mantenimiento) => (
                                <TableRow key={mantenimiento.id}>
                                  <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                                  <TableCell>{mantenimiento.ficha}</TableCell>
                                  <TableCell>{formatDate(mantenimiento.fechaUltimaActualizacion)}</TableCell>
                                  <TableCell>{mantenimiento.horasKmActuales}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Completa el rango y genera el reporte para revisar el estado de las lecturas.
              </p>
            )}
          </div>
        </div>
        )}
        <Button
          className="pointer-events-auto h-14 w-14 rounded-full shadow-lg transition hover:scale-105"
          onClick={() => setIsResumenOpen((prev) => !prev)}
          size="icon"
        >
          <CalendarRange className="h-5 w-5" />
          <span className="sr-only">Alternar resumen de actualizaciones</span>
        </Button>
      </div>
      </TabsContent>

      <TabsContent value="planificador" className="mt-0">
        <div className="space-y-6">
          <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Route className="h-6 w-6 text-purple-500" /> Planificador preventivo Caterpillar
              </CardTitle>
              <CardDescription>Arma rutas MP1-MP4 con kits homologados y responsables sugeridos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
            {caterpillarEquipos.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sin equipos Caterpillar</AlertTitle>
                <AlertDescription>
                  Registra equipos Caterpillar para habilitar la planificación inteligente de rutas preventivas.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="planFicha">Equipo Caterpillar</Label>
                    <EquipoSelectorDialog
                      equipos={caterpillarEquipos}
                      equipoSeleccionado={planFicha ?? undefined}
                      onSelect={(ficha) => setPlanFicha(ficha)}
                      titulo="Seleccionar Equipo Caterpillar"
                      descripcion="Selecciona un equipo Caterpillar"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="planIntervalo">Intervalo oficial</Label>
                    <Select
                      value={planIntervalo}
                      onValueChange={(value) => setPlanIntervalo(value)}
                      disabled={intervalosDisponibles.length === 0}
                    >
                      <SelectTrigger id="planIntervalo">
                        <SelectValue placeholder="MP disponible" />
                      </SelectTrigger>
                      <SelectContent>
                        {intervalosDisponibles.map((intervalo) => (
                          <SelectItem key={intervalo.codigo} value={intervalo.codigo}>
                            {intervalo.codigo} • {intervalo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loadingPlanCat && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Consultando catálogo Caterpillar...
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border p-4 bg-gradient-to-br from-blue-50/30 to-transparent dark:from-blue-950/10">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Lectura actual</p>
                    <p className="text-2xl font-bold mt-1">
                      {planProximo ? `${planProximo.horasKmActuales}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">h/km</p>
                  </div>
                  <div className="rounded-lg border p-4 bg-gradient-to-br from-green-50/30 to-transparent dark:from-green-950/10">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Próximo objetivo</p>
                    <p className="text-2xl font-bold mt-1">
                      {planProximo ? `${planProximo.proximoMantenimiento}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">h/km</p>
                  </div>
                  <div className="rounded-lg border p-4 bg-gradient-to-br from-amber-50/30 to-transparent dark:from-amber-950/10">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Restante estimado</p>
                    <div className="mt-1">
                      <Badge variant={planProximo ? getRemainingVariant(planProximo.horasKmRestante) : 'outline'} className="text-lg font-bold px-3 py-1">
                        {planProximo ? `${planProximo.horasKmRestante}` : '—'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">h/km</p>
                  </div>
                  <div className="rounded-lg border p-4 bg-gradient-to-br from-purple-50/30 to-transparent dark:from-purple-950/10">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase">
                      <GraduationCap className="h-4 w-4 text-purple-500" /> Capacitación
                    </p>
                    <p className="mt-2 text-sm font-medium leading-snug">{planCapacitacion}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Descripción del intervalo {planIntervalo || 'seleccionado'}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{planIntervaloDescripcion}</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <div className="space-y-3 rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-transparent">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <ClipboardList className="h-5 w-5 text-primary" /> Tareas clave
                    </p>
                    {planTareas.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                        {planTareas.map((tarea, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            <span className="leading-snug">{tarea}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selecciona un intervalo para ver el checklist oficial.</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-transparent">
                      <p className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <MapPinned className="h-5 w-5 text-primary" /> Kit recomendado
                      </p>
                      {planKit.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {planKit.map((pieza, idx) => (
                            <li key={idx} className="leading-snug text-muted-foreground">{pieza}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay repuestos registrados para este intervalo.</p>
                      )}
                    </div>
                    {planEspeciales.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-sm">
                        <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Mantenimiento especial
                        </p>
                        <ul className="mt-2 space-y-1 text-amber-800 dark:text-amber-300">
                          {planEspeciales.map((especial) => (
                            <li key={especial.id} className="leading-snug">{especial.descripcion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <MapPinned className="h-5 w-5 text-primary" /> Ruta sugerida {planIntervalo ? `• ${planIntervalo}` : ''}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-sm">{planRutaFiltrada.length} equipos</Badge>
                      <Badge variant="secondary" className="text-sm">{rutaSeleccionadaCount} marcados</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRutaFiltrada(true)}
                        disabled={planRutaFiltrada.length === 0}
                      >
                        Seleccionar tramo
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={limpiarRutaFiltrada}
                        disabled={rutaSeleccionadaCount === 0}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                  {planRutaFiltrada.length === 0 ? (
                    <Alert>
                      <AlertTitle className="text-sm">Sin equipos en ruta</AlertTitle>
                      <AlertDescription className="text-sm">
                        No hay equipos Caterpillar con programación activa para este intervalo.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="-mx-4 overflow-x-auto sm:mx-0">
                      <div className="min-w-full rounded-md border">
                        <Table className="w-full min-w-[760px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <Checkbox
                                  checked={rutaHeaderState}
                                  onCheckedChange={(checked) => toggleRutaFiltrada(Boolean(checked))}
                                  aria-label="Seleccionar ruta sugerida"
                                />
                              </TableHead>
                              <TableHead>Equipo</TableHead>
                              <TableHead>Intervalo</TableHead>
                              <TableHead className="text-right">Restante</TableHead>
                              <TableHead>Próximo objetivo</TableHead>
                              <TableHead>Capacitación</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planRutaFiltrada.map((item, index) => {
                              const isMarked = rutaMarcada.includes(item.ficha);
                              return (
                                <TableRow
                                  key={`${item.ficha}-${item.intervalo}-${item.proximo}-${index}`}
                                  className={`hover:bg-accent/50 transition-colors ${isMarked ? 'bg-primary/5' : ''}`}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={isMarked}
                                      onCheckedChange={() => toggleRutaFicha(item.ficha)}
                                      aria-label={`Marcar ${item.ficha}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-semibold">{item.nombre}</div>
                                    <p className="text-xs text-muted-foreground">{item.ficha} • {item.categoria}</p>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{item.intervalo}</Badge>
                                    <p className="mt-1 text-xs text-muted-foreground leading-snug">{item.intervaloDescripcion}</p>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant={getRemainingVariant(item.restante)} className="font-semibold">{item.restante}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">{item.proximo}</TableCell>
                                  <TableCell className="text-sm leading-snug">{item.capacitacion}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

    </Tabs>
      </Layout>
    </>
  );
}


