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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Wrench, CalendarCheck, Gauge, ClipboardList, CalendarRange, Route, MapPinned, GraduationCap } from 'lucide-react';
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
  const [resumenActualizaciones, setResumenActualizaciones] = useState<ResumenActualizaciones | null>(null);
  const [isResumenDialogOpen, setIsResumenDialogOpen] = useState(false);
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

  const planCapacitacion = planEquipo?.capacitacionMinima
    ?? planEspeciales[0]?.responsableSugerido
    ?? 'Define el responsable certificado para este plan';

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
          equipo.capacitacionMinima ||
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

  if (loading || !selected) {
    return (
      <Layout title="Control integral de mantenimiento">
        <Navigation />
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

  const handleGenerarReporte = () => {
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

    const inicioAjustado = new Date(inicio);
    inicioAjustado.setHours(0, 0, 0, 0);

    const finAjustado = new Date(fin);
    finAjustado.setHours(23, 59, 59, 999);

    const eventosEnRango = data.actualizacionesHorasKm.filter((evento) => {
      const fechaEvento = new Date(evento.fecha);
      if (Number.isNaN(fechaEvento.getTime())) return false;
      return fechaEvento >= inicioAjustado && fechaEvento <= finAjustado;
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

      if (fechaUltimaAjustada < inicioAjustado || fechaUltimaAjustada > finAjustado) {
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

    setResumenActualizaciones({
      desde: inicioAjustado.toISOString(),
      hasta: finAjustado.toISOString(),
      actualizados,
      pendientes,
    });
  };

  const handleLimpiarReporte = () => {
    setReporteDesde('');
    setReporteHasta('');
    setResumenActualizaciones(null);
  };

  return (
    <Layout title="Control integral de mantenimiento">
      <Navigation />

      <div className="space-y-6 lg:space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" /> Selecciona un mantenimiento
                </CardTitle>
                <CardDescription>Conecta con la programación oficial para trabajar sobre datos en vivo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mantenimiento">Equipo y ficha</Label>
                  <Select value={selectedId?.toString()} onValueChange={(value) => setSelectedId(Number(value))}>
                    <SelectTrigger id="mantenimiento">
                      <SelectValue placeholder="Selecciona un equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.mantenimientosProgramados.map((mantenimiento) => (
                        <SelectItem key={mantenimiento.id} value={mantenimiento.id.toString()}>
                          {mantenimiento.nombreEquipo} • {mantenimiento.ficha}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 rounded-md border p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lectura actual</span>
                    <Badge variant="secondary">{selected.horasKmActuales} h/km</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Próximo mantenimiento</span>
                    <Badge>{selected.proximoMantenimiento} h/km</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Horas/km restantes</span>
                    <Badge variant={getRemainingVariant(selected?.horasKmRestante)}>
                      {formatRemainingLabel(selected?.horasKmRestante, unidadMantenimiento)}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Última actualización</span>
                    <span className="font-medium">{formatDate(selected.fechaUltimaActualizacion)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Último mantenimiento</span>
                    <span className="font-medium">{formatDate(selected.fechaUltimoMantenimiento)}</span>
                  </div>
                </div>
                {selected && selected.horasKmRestante <= 25 && (
                  <Alert variant={selected.horasKmRestante <= 10 ? 'destructive' : 'warning'}>
                    <AlertTitle>Atención</AlertTitle>
                    <AlertDescription>
                      El equipo está próximo a cumplir el ciclo. Actualiza la lectura o programa la intervención.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

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
                    Registra equipos Caterpillar para habilitar la planificación inteligente de rutas preventivas.
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
                                {equipo.nombre} • {equipo.ficha}
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
                          {planProximo ? `${planProximo.horasKmRestante} h/km` : '—'}
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
                          <MapPinned className="h-4 w-4 text-primary" /> Ruta sugerida {planIntervalo ? `• ${planIntervalo}` : ''}
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
                          No hay equipos Caterpillar con programación activa para este intervalo.
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
                                  <TableHead>Próximo objetivo</TableHead>
                                  <TableHead>Capacitación</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {planRutaFiltrada.map((item) => {
                                  const isMarked = rutaMarcada.includes(item.ficha);
                                  return (
                                    <TableRow key={item.ficha} className={isMarked ? 'bg-primary/5' : undefined}>
                                      <TableCell>
                                        <Checkbox
                                          checked={isMarked}
                                          onCheckedChange={() => toggleRutaFicha(item.ficha)}
                                          aria-label={`Marcar ${item.ficha}`}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{item.nombre}</div>
                                        <p className="text-xs text-muted-foreground">{item.ficha} • {item.categoria}</p>
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

            <Card className="flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> Próximas intervenciones
                </CardTitle>
                <CardDescription>Calendario dinámico con los siguientes equipos a intervenir.</CardDescription>
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
                          <TableHead>Próximo objetivo</TableHead>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" /> Actualizar horas/km actuales
                </CardTitle>
                <CardDescription>Sincroniza la lectura del equipo y regístrala en el historial.</CardDescription>
              </CardHeader>
              <CardContent>
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
                    <Label htmlFor="unidadLectura">Unidad de medición</Label>
                    <Select value={unidadLectura} onValueChange={(value) => setUnidadLectura(value as 'horas' | 'km')}>
                      <SelectTrigger id="unidadLectura" className="w-full">
                        <SelectValue placeholder="Selecciona unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horas">Horas de uso</SelectItem>
                        <SelectItem value="km">Kilómetros</SelectItem>
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
                        placeholder="Operador o técnico"
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" /> Registrar mantenimiento realizado
                </CardTitle>
                <CardDescription>Actualiza el ciclo y deja constancia en el historial.</CardDescription>
              </CardHeader>
              <CardContent>
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
                      <Label htmlFor="registroUnidad">Unidad de medición</Label>
                      <Select value={unidadRegistro} onValueChange={(value) => setUnidadRegistro(value as 'horas' | 'km')}>
                        <SelectTrigger id="registroUnidad" className="w-full">
                          <SelectValue placeholder="Selecciona unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="horas">Horas de uso</SelectItem>
                          <SelectItem value="km">Kilómetros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="registroResponsable">Responsable</Label>
                    <Input
                      id="registroResponsable"
                      placeholder="Técnico o cuadrilla"
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
              </CardContent>
            </Card>

            <Dialog open={isResumenDialogOpen} onOpenChange={setIsResumenDialogOpen}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarRange className="h-5 w-5 text-primary" /> Resumen por rango de actualización
                    </CardTitle>
                    <CardDescription>
                      Selecciona un periodo para identificar qué equipos registraron lecturas y cuáles siguen pendientes.
                    </CardDescription>
                  </div>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 sm:w-auto">
                      Abrir resumen
                    </Button>
                  </DialogTrigger>
                </CardHeader>
              </Card>
              <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarRange className="h-5 w-5 text-primary" /> Resumen por rango de actualización
                  </DialogTitle>
                  <DialogDescription>
                    Selecciona un periodo para identificar qué equipos registraron lecturas y cuáles siguen pendientes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
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
                    <div className="flex items-end gap-2">
                      <Button type="button" onClick={handleGenerarReporte} className="flex-1">
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
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Layout>
  );
}
