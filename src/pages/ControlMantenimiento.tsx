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
import { Loader2, Wrench, CalendarCheck, Gauge, ClipboardList, CalendarRange, Route, GraduationCap, Settings2 } from 'lucide-react';
import { formatRemainingLabel, getRemainingVariant, resolveIntervaloCodigo } from '@/lib/maintenanceUtils';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import type { ActualizacionHorasKm, MantenimientoProgramado, MantenimientoRealizado, Equipo } from '@/types/equipment';
import type { ModeloIntervaloPieza } from '@/types/caterpillar';
import { useToast } from '@/hooks/use-toast';

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }
  return date.toLocaleDateString();
};

interface ResumenActualizaciones {
  desde: string;
  hasta: string;
  actualizados: {
    mantenimiento: MantenimientoProgramado;
    evento: ActualizacionHorasKm | null;
  }[];
  pendientes: MantenimientoProgramado[];
}

type PlanInterval = 'proximo' | 'PM1' | 'PM2' | 'PM3' | 'PM4';

const PLAN_INTERVAL_OPTIONS: { value: PlanInterval; label: string; helper: string }[] = [
  { value: 'proximo', label: 'Próximo programado', helper: 'Ordenado por horas/km restantes' },
  { value: 'PM1', label: 'PM1 • 250h', helper: 'Inspección básica y muestreo SOS' },
  { value: 'PM2', label: 'PM2 • 500h', helper: 'Cambio de aceite motor y filtros principales' },
  { value: 'PM3', label: 'PM3 • 1,000h', helper: 'Filtro hidráulico/transmisión y ajustes mayores' },
  { value: 'PM4', label: 'PM4 • 2,000h', helper: 'Overhaul programado con ajustes de válvulas' },
];

interface CaterpillarPlanRow {
  equipo: Equipo;
  proximo: MantenimientoProgramado | null;
  intervalo: string;
  horasRestantes: number | null;
  lecturaActual: number | null;
  descripcion: string | null;
  horasIntervalo: number | null;
  tareas: string[];
  piezas: ModeloIntervaloPieza[];
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
  const [planIntervalo, setPlanIntervalo] = useState<PlanInterval>('proximo');

  useEffect(() => {
    if (!loading && data.mantenimientosProgramados.length > 0 && selectedId === null) {
      setSelectedId(data.mantenimientosProgramados[0].id);
    }
  }, [loading, data.mantenimientosProgramados, selectedId]);

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

  const caterpillarEntries = useMemo(() => {
    return data.equipos
      .filter((equipo) => {
        const marca = equipo.marca?.toLowerCase() ?? '';
        return marca.includes('cat');
      })
      .map((equipo) => {
        const programados = data.mantenimientosProgramados
          .filter((mantenimiento) => mantenimiento.ficha === equipo.ficha)
          .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

        const proximoMant = programados[0] ?? null;
        const intervaloProgramado = resolveIntervaloCodigo(proximoMant);
        const catData = getStaticCaterpillarData(equipo.modelo);

        return {
          equipo,
          proximo: proximoMant,
          intervaloProgramado,
          catData,
        };
      });
  }, [data.equipos, data.mantenimientosProgramados]);

  const planRows = useMemo<CaterpillarPlanRow[]>(() => {
    return caterpillarEntries
      .map(({ equipo, proximo, intervaloProgramado, catData }) => {
        const targetInterval = planIntervalo === 'proximo' ? intervaloProgramado : planIntervalo;
        if (planIntervalo !== 'proximo' && targetInterval !== planIntervalo) {
          return null;
        }

        const intervaloLabel = targetInterval ?? 'No asignado';
        const tareas = targetInterval && catData?.tareasPorIntervalo?.[targetInterval]
          ? catData.tareasPorIntervalo[targetInterval]
          : [];
        const piezas = targetInterval && catData?.piezasPorIntervalo?.[targetInterval]
          ? catData.piezasPorIntervalo[targetInterval]
          : [];
        const intervaloInfo = targetInterval && catData?.intervalos
          ? catData.intervalos.find((item) => item.codigo === targetInterval) ?? null
          : null;

        return {
          equipo,
          proximo,
          intervalo: intervaloLabel,
          horasRestantes: proximo?.horasKmRestante ?? null,
          lecturaActual: proximo?.horasKmActuales ?? null,
          descripcion: intervaloInfo?.descripcion ?? null,
          horasIntervalo: intervaloInfo?.horas_intervalo ?? null,
          tareas,
          piezas,
        } satisfies CaterpillarPlanRow;
      })
      .filter((row): row is CaterpillarPlanRow => {
        if (!row) return false;
        if (planIntervalo === 'proximo') return true;
        return row.intervalo === planIntervalo;
      })
      .sort((a, b) => {
        const aVal = a.horasRestantes ?? Number.POSITIVE_INFINITY;
        const bVal = b.horasRestantes ?? Number.POSITIVE_INFINITY;
        return aVal - bVal;
      });
  }, [caterpillarEntries, planIntervalo]);

  const trainingInfo = useMemo(() => {
    if (planIntervalo === 'proximo') {
      return null;
    }

    const tareas = new Set<string>();
    const piezas = new Map<string, string>();
    let descripcion: string | null = null;

    caterpillarEntries.forEach(({ catData }) => {
      if (!catData) return;
      const intervalo = catData.intervalos?.find((item) => item.codigo === planIntervalo);
      if (intervalo && !descripcion) {
        descripcion = intervalo.descripcion ?? null;
      }
      catData.tareasPorIntervalo?.[planIntervalo]?.forEach((tarea) => tareas.add(tarea));
      catData.piezasPorIntervalo?.[planIntervalo]?.forEach((pieza) => {
        piezas.set(pieza.pieza.numero_parte, pieza.pieza.descripcion);
      });
    });

    return {
      descripcion,
      tareas: Array.from(tareas),
      piezas: Array.from(piezas.entries()).map(([numero, descripcion]) => ({ numero, descripcion })),
    };
  }, [caterpillarEntries, planIntervalo]);

  const intervalOption = PLAN_INTERVAL_OPTIONS.find((option) => option.value === planIntervalo);
  const totalCaterpillar = caterpillarEntries.length;
  const totalPlan = planRows.length;
  const planSinAsignar = planRows.filter((row) => row.intervalo === 'No asignado').length;

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
        <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
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
              <Select
                value={selectedId?.toString()}
                onValueChange={(value) => setSelectedId(Number(value))}
              >
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
                    <Select
                      value={unidadRegistro}
                      onValueChange={(value) => setUnidadRegistro(value as 'horas' | 'km')}
                    >
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

        </div>
      </div>

        <div className="grid gap-6 xl:grid-cols-[3fr,2fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" /> Planificador Caterpillar
              </CardTitle>
              <CardDescription>
                Organiza la ruta técnica para {totalCaterpillar} equipos con intervalos PM homologados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Intervalo objetivo
                  </Label>
                  <Select value={planIntervalo} onValueChange={(value) => setPlanIntervalo(value as PlanInterval)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {intervalOption?.helper && (
                    <p className="text-[11px] text-muted-foreground">{intervalOption.helper}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Ruta generada: {totalPlan}</Badge>
                  <Badge variant="outline">Cat totales: {totalCaterpillar}</Badge>
                  {planSinAsignar > 0 && (
                    <Badge variant="destructive">Pendientes de PM: {planSinAsignar}</Badge>
                  )}
                </div>
              </div>

              {planIntervalo === 'proximo' ? (
                <Alert className="border-primary/40 bg-primary/5">
                  <AlertTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Route className="h-4 w-4" /> Ruta priorizada por horas/km
                  </AlertTitle>
                  <AlertDescription>
                    {totalPlan > 0
                      ? 'Atiende los equipos en este orden para evitar vencimientos y actualizar lecturas en campo.'
                      : 'No hay equipos Caterpillar con programación activa. Registra un mantenimiento programado para iniciar la ruta.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-amber-300 bg-amber-50/70">
                  <AlertTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <GraduationCap className="h-4 w-4" /> Capacitación rápida {planIntervalo}
                  </AlertTitle>
                  <AlertDescription className="space-y-3 text-amber-900">
                    {trainingInfo?.descripcion ? (
                      <p className="text-sm leading-snug">{trainingInfo.descripcion}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Define las tareas de referencia para este intervalo según el manual Caterpillar.
                      </p>
                    )}
                    {trainingInfo?.tareas?.length ? (
                      <ul className="list-disc space-y-1 pl-4 text-xs">
                        {trainingInfo.tareas.map((tarea) => (
                          <li key={tarea}>{tarea}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No hay tareas sugeridas cargadas para este intervalo. Agrégalas en el módulo Caterpillar.
                      </p>
                    )}
                    {trainingInfo?.piezas?.length ? (
                      <div className="space-y-1 text-xs">
                        {trainingInfo.piezas.map((pieza) => (
                          <div key={pieza.numero} className="flex items-center gap-2">
                            <Badge variant="outline" className="border-amber-400 text-[11px] font-semibold text-amber-800">
                              {pieza.numero}
                            </Badge>
                            <span>{pieza.descripcion}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Completa el kit de piezas recomendado para este intervalo en la ficha Caterpillar.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {totalPlan === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Ajusta el intervalo o registra mantenimientos programados para ver la secuencia recomendada.
                </div>
              ) : (
                <div className="-mx-4 overflow-x-auto sm:mx-0">
                  <div className="min-w-full rounded-md border">
                    <Table className="w-full min-w-[820px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead>Modelo / Serie</TableHead>
                          <TableHead>Intervalo</TableHead>
                          <TableHead className="text-right">Horas/km restantes</TableHead>
                          <TableHead>Kit sugerido</TableHead>
                          <TableHead>Tareas clave</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planRows.map((row, index) => (
                          <TableRow key={`${row.equipo.ficha}-${row.intervalo}-${index}`}>
                            <TableCell className="font-semibold">{index + 1}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <span className="font-medium">{row.equipo.nombre}</span>
                                <Badge variant="outline" className="text-xs">
                                  {row.equipo.ficha}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <span className="font-medium">{row.equipo.modelo}</span>
                                {row.equipo.numeroSerie && (
                                  <p className="text-xs text-muted-foreground">Serie: {row.equipo.numeroSerie}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={row.intervalo === 'No asignado' ? 'outline' : 'default'}>
                                    {row.intervalo === 'No asignado' ? 'Pendiente' : row.intervalo}
                                  </Badge>
                                  {row.horasIntervalo && (
                                    <Badge variant="secondary" className="text-[11px]">
                                      {row.horasIntervalo} h
                                    </Badge>
                                  )}
                                </div>
                                {row.descripcion && (
                                  <p className="text-[11px] text-muted-foreground leading-snug">{row.descripcion}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={getRemainingVariant(row.horasRestantes)}>
                                {formatRemainingLabel(row.horasRestantes, 'horas/km')}
                              </Badge>
                              {row.lecturaActual !== null && (
                                <p className="mt-1 text-[11px] text-muted-foreground">Lectura: {row.lecturaActual}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs">
                                {row.piezas.length > 0 ? (
                                  row.piezas.map((pieza) => (
                                    <div key={pieza.id} className="flex items-start gap-2">
                                      <Badge variant="outline" className="text-[11px] font-semibold">
                                        {pieza.pieza.numero_parte}
                                      </Badge>
                                      <span className="leading-snug">{pieza.pieza.descripcion}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">
                                    Asigna el kit sugerido para este intervalo.
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs">
                                {row.tareas.length > 0 ? (
                                  row.tareas.map((tarea) => (
                                    <p key={tarea} className="leading-snug">• {tarea}</p>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">
                                    Agrega tareas de referencia para orientar a la cuadrilla.
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" /> Resumen por rango de actualización
              </CardTitle>
              <CardDescription>
                Selecciona un periodo para identificar qué equipos registraron lecturas y cuáles siguen pendientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-6 sm:px-6">
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
                      <h4 className="font-semibold text-sm">Equipos con lectura registrada</h4>
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
                      <h4 className="font-semibold text-sm">Equipos pendientes</h4>
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
            </CardContent>
          </Card>
        </div>

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
    </Layout>
  );
}
