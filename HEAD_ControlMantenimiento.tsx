import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
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
} from 'lucide-react';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import type { ActualizacionHorasKm, MantenimientoProgramado, MantenimientoRealizado } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';

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
      'No hay descripci├│n homologada para este intervalo.'
    );
  }, [intervalosDisponibles, planIntervalo]);

  const planTareas = useMemo(() => {
    if (!planIntervalo) return [] as string[];
    return planCatData.tareasPorIntervalo?.[planIntervalo] ?? [];
  }, [planCatData.tareasPorIntervalo, planIntervalo]);

  const planKit = useMemo(() => {
    if (!planIntervalo) return [] as string[];
    const piezas = planCatData.piezasPorIntervalo?.[planIntervalo] ?? [];
    return piezas.map((pieza) => `${pieza.pieza.numero_parte} ┬À ${pieza.pieza.descripcion}`);
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
          Registra equipos Caterpillar para habilitar la planificaci├│n inteligente de rutas preventivas.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="planFichaFloating">Equipo Caterpillar</Label>
              <Select
                id="planFichaFloating"
                value={planFicha ?? ''}
                onValueChange={(value) => setPlanFicha(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un equipo" />
                </SelectTrigger>
                <SelectContent>
                  {caterpillarEquipos.map((equipo) => (
                    <SelectItem key={equipo.ficha} value={equipo.ficha}>
                      {equipo.nombre} ┬À {equipo.ficha}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      {intervalo.codigo} ┬À {intervalo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {loadingPlanCat && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando cat├ílogo Caterpillar...
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
              <p className="text-xs text-muted-foreground">Pr├│ximo objetivo</p>
              <p className="text-lg font-semibold">
                {planProximo ? `${planProximo.proximoMantenimiento} h/km` : 'Sin programaci├│n'}
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
                <GraduationCap className="h-4 w-4 text-primary" /> Capacitaci├│n m├¡nima
              </p>
              <p className="mt-1 text-sm font-medium leading-snug">{planCapacitacion}</p>
            </div>
          </div>
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm font-semibold">Descripci├│n del intervalo {planIntervalo || 'seleccionado'}</p>
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
          ? catData.piezasPorIntervalo[intervalo].map((pieza) => `${pieza.pieza.numero_parte} ┬À ${pieza.pieza.descripcion}`)
          : [];
        const intervaloDescripcion = intervalo && catData?.intervalos
          ? catData.intervalos.find((item) => item.codigo === intervalo)?.descripcion ?? 'Sin descripci├│n'
          : 'Sin descripci├│n';
        const capacitacion =
          catData?.mantenimientosEspeciales?.find((especial) => especial.intervaloCodigo === intervalo)?.responsableSugerido ||
          'Asignar t├®cnico certificado';

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
        <Navigation />
        <Card>
          <CardHeader>
            <CardTitle>Preparando datos</CardTitle>
            <CardDescription>Esperando informaci├│n de los equipos...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando informaci├│n de mantenimiento</span>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (!hasMantenimientosProgramados) {
    return (
      <Layout title="Control integral de mantenimiento">
        <Navigation />
        <div className="space-y-4 px-4 pb-4">
          <Alert variant="warning">
            <AlertTitle>Sin mantenimientos programados</AlertTitle>
            <AlertDescription>
              Define al menos un plan de mantenimiento en el m├│dulo de Planes de mantenimiento o sincroniza tus registros para empezar a visualizar el control integral.
            </AlertDescription>
          </Alert>
          <Card className="border-dashed border-border/70">
            <CardHeader>
              <CardTitle>Planificador preventivo</CardTitle>
              <CardDescription>
                Una vez que haya fichas vinculadas y tareas programadas la informaci├│n aparecer├í autom├íticamente en este espacio.
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
        <Navigation />
        <Card>
          <CardHeader>
            <CardTitle>Preparando selecci├│n</CardTitle>
            <CardDescription>Estamos escogiendo el equipo m├ís relevante para mostrarte los detalles.</CardDescription>
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
        title: 'Fechas inv├ílidas',
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
        title: 'Rango inv├ílido',
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
        <Navigation />

        <div className="space-y-6 lg:space-y-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Programados
                </CardTitle>
                <CardDescription className="text-3xl font-semibold text-foreground">
                  {totalEquiposPlanificados}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Equipos con plan preventivo activo dentro de la plataforma.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Cobertura semanal
                </CardTitle>
                <CardDescription className="text-3xl font-semibold text-foreground">
                  {coberturaSemanal}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={coberturaSemanal} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {resumenActualizaciones?.actualizados.length ?? 0} lecturas registradas en la ├║ltima ventana.
                </p>
              </CardContent>
            </Card>
            <Card className={pendientesCriticos.length > 0 ? 'border-destructive/30 bg-destructive/5' : undefined}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Pendientes cr├¡ticos
                </CardTitle>
                <CardDescription className="text-3xl font-semibold text-foreground">
                  {pendientesCriticos.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Equipos con menos de 25 horas/km disponibles para completar su ciclo.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Ruta inteligente
                </CardTitle>
                <CardDescription className="text-3xl font-semibold text-foreground">
                  {rutaSeleccionadaCount}/{planRutaFiltrada.length || planRuta.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Equipos marcados para el siguiente recorrido preventivo Caterpillar.
              </CardContent>
            </Card>
          </section>
          <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
            <div className="space-y-6">
            <div className="hidden">
            <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-primary" /> Planificador preventivo Caterpillar
                  </CardTitle>
                  <CardDescription>Arma rutas MP1-MP4 con kits homologados y responsables sugeridos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {caterpillarEquipos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Registra equipos Caterpillar para habilitar la planificaci├│n inteligente de rutas preventivas.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="planFicha">Equipo Caterpillar</Label>
                        <Select value={planFicha ?? ''} onValueChange={(value) => setPlanFicha(value)}>
                          <SelectTrigger id="planFicha">
                            <SelectValue placeholder="Selecciona un equipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {caterpillarEquipos.map((equipo) => (
                              <SelectItem key={equipo.ficha} value={equipo.ficha}>
                                {equipo.nombre} ÔÇó {equipo.ficha}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                                {intervalo.codigo} ÔÇó {intervalo.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {loadingPlanCat && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Consultando cat├ílogo Caterpillar...
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
                        <p className="text-xs text-muted-foreground">Pr├│ximo objetivo</p>
                        <p className="text-lg font-semibold">
                          {planProximo ? `${planProximo.proximoMantenimiento} h/km` : 'Sin programaci├│n'}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Restante estimado</p>
                        <Badge variant={planProximo ? getRemainingVariant(planProximo.horasKmRestante) : 'outline'}>
                          {planProximo ? `${planProximo.horasKmRestante} h/km` : 'ÔÇö'}
                        </Badge>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <GraduationCap className="h-4 w-4 text-primary" /> Capacitaci├│n m├¡nima
                        </p>
                        <p className="mt-1 text-sm font-medium leading-snug">{planCapacitacion}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-dashed p-4">
                      <p className="text-sm font-semibold">Descripci├│n del intervalo {planIntervalo || 'seleccionado'}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{planIntervaloDescripcion}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
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

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <MapPinned className="h-4 w-4 text-primary" /> Ruta sugerida {planIntervalo ? `ÔÇó ${planIntervalo}` : ''}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{planRutaFiltrada.length} equipos</Badge>
                          <Badge variant="secondary">{rutaSeleccionadaCount} marcados</Badge>
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
                        <p className="text-sm text-muted-foreground">
                          No hay equipos Caterpillar con programaci├│n activa para este intervalo.
                        </p>
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
                                  <TableHead>Pr├│ximo objetivo</TableHead>
                                  <TableHead>Capacitaci├│n</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {planRutaFiltrada.map((item, index) => {
                                  const isMarked = rutaMarcada.includes(item.ficha);
                                  return (
                                    <TableRow
                                      key={`${item.ficha}-${item.intervalo}-${item.proximo}-${index}`}
                                      className={isMarked ? 'bg-primary/5' : undefined}
                                    >
                                      <TableCell>
                                        <Checkbox
                                          checked={isMarked}
                                          onCheckedChange={() => toggleRutaFicha(item.ficha)}
                                          aria-label={`Marcar ${item.ficha}`}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{item.nombre}</div>
                                        <p className="text-xs text-muted-foreground">{item.ficha} ÔÇó {item.categoria}</p>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="secondary">{item.intervalo}</Badge>
                                        <p className="mt-1 text-xs text-muted-foreground leading-snug">{item.intervaloDescripcion}</p>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge variant={getRemainingVariant(item.restante)}>{item.restante}</Badge>
                                      </TableCell>
                                      <TableCell>{item.proximo}</TableCell>
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

            <Card className="overflow-hidden border border-dashed border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" /> Actualiza y registra
                </CardTitle>
                <CardDescription>Gestiona lecturas y mantenimientos desde un mismo panel.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="lecturas" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="lecturas">Actualizar lectura</TabsTrigger>
                    <TabsTrigger value="mantenimientos">Registrar mantenimiento</TabsTrigger>
                  </TabsList>
                  <TabsContent value="lecturas" className="space-y-4">
                    <form className="grid gap-4" onSubmit={handleActualizarHoras}>
                      <div className="grid gap-2">
                        <Label htmlFor="horasLectura">Nueva lectura</Label>
                        <Input
                          id="horasLectura"
                          type="number"
                          min={0}
                          required
                          value={horasLectura}
                          onChange={(event) => setHorasLectura(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="unidadLectura">Unidad de medici├│n</Label>
                        <Select value={unidadLectura} onValueChange={(value) => setUnidadLectura(value as 'horas' | 'km')}>
                          <SelectTrigger id="unidadLectura" className="w-full">
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="horas">Horas de uso</SelectItem>
                            <SelectItem value="km">Kil├│metros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="fechaLectura">Fecha de la lectura</Label>
                          <Input
                            id="fechaLectura"
                            type="date"
                            required
                            value={fechaLectura}
                            onChange={(event) => setFechaLectura(event.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="responsableLectura">Responsable</Label>
                          <Input
                            id="responsableLectura"
                            placeholder="Operador o t├®cnico"
                            value={responsableLectura}
                            onChange={(event) => setResponsableLectura(event.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notasLectura">Observaciones</Label>
                        <Textarea
                          id="notasLectura"
                          placeholder="Ingresa detalles relevantes de la lectura"
                          value={notasLectura}
                          onChange={(event) => setNotasLectura(event.target.value)}
                        />
                      </div>
                      <Button type="submit" disabled={updating}>
                        {updating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando
                          </>
                        ) : (
                          'Actualizar lectura'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="mantenimientos" className="space-y-4">
                    <form className="grid gap-4" onSubmit={handleRegistrarMantenimiento}>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="registroFecha">Fecha del mantenimiento</Label>
                          <Input
                            id="registroFecha"
                            type="date"
                            required
                            value={registroFecha}
                            onChange={(event) => setRegistroFecha(event.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="registroHoras">Horas/km al momento</Label>
                          <Input
                            id="registroHoras"
                            type="number"
                            min={0}
                            required
                            value={registroHoras}
                            onChange={(event) => setRegistroHoras(event.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="registroUnidad">Unidad de medici├│n</Label>
                          <Select
                            value={unidadRegistro}
                            onValueChange={(value) => setUnidadRegistro(value as 'horas' | 'km')}
                          >
                            <SelectTrigger id="registroUnidad" className="w-full">
                              <SelectValue placeholder="Selecciona unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="horas">Horas de uso</SelectItem>
                              <SelectItem value="km">Kil├│metros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="registroResponsable">Responsable</Label>
                        <Input
                          id="registroResponsable"
                          placeholder="T├®cnico o cuadrilla"
                          value={registroResponsable}
                          onChange={(event) => setRegistroResponsable(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="registroFiltros">Filtros o repuestos utilizados</Label>
                        <Textarea
                          id="registroFiltros"
                          placeholder="Separar por coma. Ej: Filtro aceite, Filtro aire"
                          value={registroFiltros}
                          onChange={(event) => setRegistroFiltros(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="registroObservaciones">Observaciones</Label>
                        <Textarea
                          id="registroObservaciones"
                          placeholder="Describe el trabajo realizado"
                          value={registroObservaciones}
                          onChange={(event) => setRegistroObservaciones(event.target.value)}
                        />
                      </div>
                      <Button type="submit" disabled={registering}>
                        {registering ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando
                          </>
                        ) : (
                          'Registrar mantenimiento'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

              <Card className="flex flex-col overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" /> Pr├│ximas intervenciones
                  </CardTitle>
                  <CardDescription>Calendario din├ímico con los siguientes equipos a intervenir.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 px-0 pb-6 sm:px-6">
                <div className="-mx-4 overflow-x-auto sm:mx-0">
                  <div className="min-w-full rounded-md border">
                    <Table className="w-full min-w-[640px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipo</TableHead>
                          <TableHead>Ficha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Horas/km restantes</TableHead>
                          <TableHead>Pr├│ximo objetivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proximos.map((mantenimiento) => (
                          <TableRow key={mantenimiento.id}>
                            <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                            <TableCell>{mantenimiento.ficha}</TableCell>
                            <TableCell>{mantenimiento.tipoMantenimiento}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={mantenimiento.horasKmRestante <= 15 ? 'destructive' : 'secondary'}>
                                {mantenimiento.horasKmRestante}
                              </Badge>
                            </TableCell>
                            <TableCell>{mantenimiento.proximoMantenimiento}</TableCell>
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
<Card className="overflow-hidden">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarRange className="h-5 w-5 text-primary" /> Reportes inteligentes de actualizaciones
                  </CardTitle>
                  <CardDescription>
                    Prioriza las lecturas registradas esta semana y ubica lo que falta por gestionar.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground lg:justify-end">
                  {resumenActualizaciones ? (
                    <>
                      <Badge variant="secondary">
                        Actualizados: {resumenActualizaciones.actualizados.length}
                      </Badge>
                      <Badge variant={resumenActualizaciones.pendientes.length > 0 ? 'destructive' : 'outline'}>
                        Pendientes: {resumenActualizaciones.pendientes.length}
                      </Badge>
                      <Badge variant="outline">
                        {new Date(resumenActualizaciones.desde).toLocaleDateString()} -{' '}
                        {new Date(resumenActualizaciones.hasta).toLocaleDateString()}
                      </Badge>
                    </>
                  ) : (
                    <p>Configura un rango para activar el panel semanal.</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reporteDesdeInline">Desde</Label>
                    <Input
                      id="reporteDesdeInline"
                      type="date"
                      value={reporteDesde}
                      onChange={(event) => setReporteDesde(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reporteHastaInline">Hasta</Label>
                    <Input
                      id="reporteHastaInline"
                      type="date"
                      value={reporteHasta}
                      onChange={(event) => setReporteHasta(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Atajo r├ípido</Label>
                    <Button type="button" variant="secondary" onClick={handleSemanaActual}>
                      Semana en curso
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Vista extendida</Label>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => setIsResumenOpen(true)}>
                      <CalendarRange className="h-4 w-4" /> Panel flotante
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => handleGenerarReporte({ abrirResumenFlotante: false })}>
                    Actualizar vista
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleLimpiarReporte}>
                    Limpiar
                  </Button>
                </div>

                {resumenActualizaciones ? (
                  <Tabs
                    value={reporteSegmento}
                    onValueChange={(value) => setReporteSegmento(value as 'resumen' | 'actualizados' | 'pendientes')}
                    className="space-y-4"
                  >
                    <TabsList className="flex w-full flex-col gap-2 sm:flex-row">
                      <TabsTrigger value="resumen" className="flex-1">
                        Panorama semanal
                      </TabsTrigger>
                      <TabsTrigger value="actualizados" className="flex-1">
                        Actualizaciones registradas
                      </TabsTrigger>
                      <TabsTrigger value="pendientes" className="flex-1">
                        Por conseguir
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="resumen" className="space-y-4">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-lg border p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Lecturas registradas
                          </p>
                          <p className="mt-2 text-3xl font-semibold">
                            {resumenActualizaciones.actualizados.length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cobertura del {coberturaSemanal}% sobre {totalEquiposPlanificados} mantenimientos monitoreados.
                          </p>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Pendientes por conseguir
                          </p>
                          <p className="mt-2 text-3xl font-semibold">
                            {resumenActualizaciones.pendientes.length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pendientesCriticos.length} con menos de 25 horas/km disponibles.
                          </p>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Rango analizado
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {new Date(resumenActualizaciones.desde).toLocaleDateString()} -{' '}
                            {new Date(resumenActualizaciones.hasta).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Ajusta el rango para inspeccionar otra semana o proyecto.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-semibold">Actualizaciones de la semana</p>
                          <div className="mt-3 space-y-3">
                            {ultimasLecturasSemana.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                A├║n no se registran lecturas en este rango.
                              </p>
                            ) : (
                              ultimasLecturasSemana.map(({ mantenimiento, evento }) => (
                                <div
                                  key={mantenimiento.id}
                                  className="flex items-center justify-between gap-3 rounded-md border p-3"
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
                              <p className="text-sm text-muted-foreground">Todos los equipos est├ín al d├¡a.</p>
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
                                  <TableHead>├Ültima lectura</TableHead>
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
                                        ? `${evento.horasKm} h/km ÔÇó ${new Date(evento.fecha).toLocaleDateString()}`
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
                                  <TableHead>├Ültima actualizaci├│n</TableHead>
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
                  <CalendarRange className="h-5 w-5 text-primary" /> Resumen por rango de actualizaci├│n
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mant├®n abierta la ventana para actualizar lecturas o registrar mantenimientos en paralelo.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsResumenOpen(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar resumen</span>
              </Button>
            </div>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="reporteDesde">Desde</Label>
                <Input
                  id="reporteDesde"
                  type="date"
                  value={reporteDesde}
                  onChange={(event) => setReporteDesde(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reporteHasta">Hasta</Label>
                <Input
                  id="reporteHasta"
                  type="date"
                  value={reporteHasta}
                  onChange={(event) => setReporteHasta(event.target.value)}
                />
              </div>
              <div className="flex items-end gap-2 md:col-span-2 lg:col-span-1">
                <Button type="button" onClick={() => handleGenerarReporte()} className="flex-1">
                  Generar reporte
                </Button>
                <Button type="button" variant="ghost" onClick={handleLimpiarReporte}>
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
                    Per├¡odo: {new Date(resumenActualizaciones.desde).toLocaleDateString()} - {new Date(resumenActualizaciones.hasta).toLocaleDateString()}
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
                                <TableHead>├Ültima lectura</TableHead>
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
                                      ? `${evento.horasKm} h/km ÔÇó ${new Date(evento.fecha).toLocaleDateString()}`
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
                                <TableHead>├Ültima actualizaci├│n</TableHead>
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
          onClick={() => setPlanificadorOpen((prev) => !prev)}
          size="icon"
        >
          <Route className="h-5 w-5" />
          <span className="sr-only">Alternar planificador preventivo</span>
        </Button>
        <Button
          className="pointer-events-auto h-14 w-14 rounded-full shadow-lg transition hover:scale-105"
          onClick={() => setIsResumenOpen((prev) => !prev)}
          size="icon"
        >
          <CalendarRange className="h-5 w-5" />
          <span className="sr-only">Alternar resumen de actualizaciones</span>
        </Button>
      </div>
      </Layout>
    </>
  );
}


