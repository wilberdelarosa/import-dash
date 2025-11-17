/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Route, 
  CalendarRange, 
  Loader2, 
  Package, 
  ClipboardList, 
  MapPinned, 
  GraduationCap,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';

const resolveIntervaloCodigo = (mantenimiento: any) => {
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

export function PlanificacionFlotante() {
  const { data } = useSupabaseDataContext();
  const [open, setOpen] = useState(false);
  const [planFicha, setPlanFicha] = useState<string | null>(null);
  const [planIntervalo, setPlanIntervalo] = useState<string>('');
  const [rutaMarcada, setRutaMarcada] = useState<string[]>([]);

  // Equipos Caterpillar disponibles
  const caterpillarEquipos = useMemo(
    () => data.equipos.filter((equipo) => 
      equipo.marca?.toLowerCase().includes('cat') && equipo.activo
    ),
    [data.equipos],
  );

  // Equipo seleccionado
  const planEquipo = useMemo(
    () => (planFicha ? data.equipos.find((equipo) => equipo.ficha === planFicha) ?? null : null),
    [data.equipos, planFicha],
  );

  // Mantenimientos del equipo
  const planMantenimientos = useMemo(
    () =>
      planFicha
        ? data.mantenimientosProgramados
            .filter((mantenimiento) => mantenimiento.ficha === planFicha)
            .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
        : [],
    [data.mantenimientosProgramados, planFicha],
  );

  const esPlanCaterpillar = (planEquipo?.marca ?? '').toLowerCase().includes('cat');

  const { data: planCatData, loading: loadingPlanCat } = useCaterpillarData(
    esPlanCaterpillar ? planEquipo?.modelo ?? '' : '',
    esPlanCaterpillar ? planEquipo?.numeroSerie ?? '' : '',
  );

  const intervalosDisponibles = useMemo(() => {
    if (!esPlanCaterpillar || !planEquipo?.modelo) return [];
    const staticData = getStaticCaterpillarData(planEquipo.modelo);
    return staticData?.intervalos ?? [];
  }, [esPlanCaterpillar, planEquipo]);

  const planProximo = planMantenimientos[0] ?? null;
  const planIntervaloObj = intervalosDisponibles.find((i) => i.codigo === planIntervalo);
  const planIntervaloDescripcion = planIntervaloObj?.descripcion ?? 'Selecciona un intervalo para ver sus tareas.';
  
  // 🚀 INTELLIGENT MP ASSIGNMENT - Suggest best MP based on hours remaining
  const mpSugerido = useMemo(() => {
    if (!planProximo) return null;
    
    const restante = planProximo.horasKmRestante;
    const actual = planProximo.horasKmActuales;
    
    // Analyze remaining hours and suggest appropriate MP level
    let sugerencia = '';
    let codigo = '';
    let urgencia: 'high' | 'medium' | 'low' = 'low';
    let razon = '';
    
    if (restante < 50) {
      urgencia = 'high';
      // Critical - suggest immediate MP
      const intervaloActual = resolveIntervaloCodigo(planProximo);
      codigo = intervaloActual || 'PM1';
      sugerencia = `${codigo} URGENTE`;
      razon = `Solo quedan ${restante} h/km antes del próximo mantenimiento`;
    } else if (restante < 200) {
      urgencia = 'medium';
      // Medium priority - plan ahead
      const intervaloActual = resolveIntervaloCodigo(planProximo);
      codigo = intervaloActual || 'PM2';
      sugerencia = `${codigo} Planificado`;
      razon = `Quedan ${restante} h/km, planifica con anticipación`;
    } else {
      urgencia = 'low';
      // Low priority - standard maintenance
      const intervaloActual = resolveIntervaloCodigo(planProximo);
      codigo = intervaloActual || 'PM1';
      sugerencia = `${codigo} Normal`;
      razon = `${restante} h/km disponibles antes del próximo MP`;
    }
    
    // Determine optimal MP based on current hours
    let mpOptimo = 'PM1';
    if (actual >= 2000) mpOptimo = 'PM4';
    else if (actual >= 1000) mpOptimo = 'PM3';
    else if (actual >= 500) mpOptimo = 'PM2';
    
    return {
      codigo,
      sugerencia,
      urgencia,
      razon,
      mpOptimo,
      proximoEn: restante,
    };
  }, [planProximo]);
  
  // Obtener tareas, kit y capacitación desde planCatData si está disponible
  const planTareas = planCatData?.tareasPorIntervalo?.[planIntervalo] ?? [];
  const planKit = planCatData?.piezasPorIntervalo?.[planIntervalo]?.map(p => `${p.pieza.numero_parte} - ${p.pieza.descripcion}`) ?? [];
  const planCapacitacion = 'Técnico certificado Caterpillar';
  const planEspeciales = planMantenimientos.filter((m) => m.tipoMantenimiento?.toLowerCase().includes('especial'));

  // Generar ruta sugerida
  const planRutaFiltrada = useMemo<RutaPlanItem[]>(() => {
    if (!planIntervalo || caterpillarEquipos.length === 0) return [];

    const staticData = intervalosDisponibles.find((i) => i.codigo === planIntervalo);
    if (!staticData) return [];

    const items: RutaPlanItem[] = [];
    for (const equipo of caterpillarEquipos) {
      const mantenimientosEquipo = data.mantenimientosProgramados
        .filter((m) => m.ficha === equipo.ficha)
        .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

      const proximo = mantenimientosEquipo[0];
      if (!proximo) continue;

      const intervaloActual = resolveIntervaloCodigo(proximo);
      if (intervaloActual === planIntervalo) {
        // Obtener datos de caterpillar para este modelo
        const catData = getStaticCaterpillarData(equipo.modelo);
        const tareas = catData?.tareasPorIntervalo?.[planIntervalo] ?? [];
        const kit = catData?.piezasPorIntervalo?.[planIntervalo]?.map(p => `${p.pieza.numero_parte} - ${p.pieza.descripcion}`) ?? [];
        
        items.push({
          ficha: equipo.ficha,
          nombre: equipo.nombre,
          categoria: equipo.categoria,
          intervalo: planIntervalo,
          intervaloDescripcion: staticData.descripcion,
          restante: proximo.horasKmRestante,
          proximo: proximo.proximoMantenimiento,
          tareas,
          kit,
          capacitacion: 'Técnico certificado Caterpillar',
        });
      }
    }

    return items;
  }, [planIntervalo, caterpillarEquipos, data.mantenimientosProgramados, intervalosDisponibles]);

  const toggleRutaFicha = (ficha: string) => {
    setRutaMarcada((prev) =>
      prev.includes(ficha) ? prev.filter((f) => f !== ficha) : [...prev, ficha],
    );
  };

  const toggleRutaFiltrada = (checked: boolean) => {
    setRutaMarcada(checked ? planRutaFiltrada.map((item) => item.ficha) : []);
  };

  const limpiarRutaFiltrada = () => {
    setRutaMarcada([]);
  };

  const rutaSeleccionadaCount = rutaMarcada.length;
  const rutaHeaderState =
    planRutaFiltrada.length > 0 && rutaSeleccionadaCount === planRutaFiltrada.length
      ? true
      : rutaSeleccionadaCount > 0 && rutaSeleccionadaCount < planRutaFiltrada.length
      ? 'indeterminate'
      : false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-20 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl"
          title="Planificación de Mantenimiento"
        >
          <CalendarRange className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            Planificador Preventivo Inteligente • Caterpillar
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Asignación automática de MP basada en horas de operación y análisis predictivo
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {caterpillarEquipos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Registra equipos Caterpillar para habilitar la planificación inteligente de rutas preventivas.
            </p>
          ) : (
            <>
              {/* Selector de equipo e intervalo */}
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

              {/* 🚀 INTELLIGENT MP SUGGESTION CARD */}
              {mpSugerido && planEquipo && (
                <Card className={`overflow-hidden border-2 ${
                  mpSugerido.urgencia === 'high' 
                    ? 'border-destructive/50 bg-gradient-to-br from-destructive/10 via-background to-background' 
                    : mpSugerido.urgencia === 'medium'
                    ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-background to-background'
                    : 'border-green-500/50 bg-gradient-to-br from-green-500/10 via-background to-background'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-3 ${
                          mpSugerido.urgencia === 'high' 
                            ? 'bg-gradient-to-br from-destructive/20 to-destructive/10' 
                            : mpSugerido.urgencia === 'medium'
                            ? 'bg-gradient-to-br from-orange-500/20 to-orange-500/10'
                            : 'bg-gradient-to-br from-green-500/20 to-green-500/10'
                        }`}>
                          <Sparkles className={`h-6 w-6 ${
                            mpSugerido.urgencia === 'high' 
                              ? 'text-destructive' 
                              : mpSugerido.urgencia === 'medium'
                              ? 'text-orange-500'
                              : 'text-green-500'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">Sugerencia Inteligente de MP</CardTitle>
                          <CardDescription>Basado en análisis de horas de operación</CardDescription>
                        </div>
                      </div>
                      {mpSugerido.urgencia === 'high' && (
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          URGENTE
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border-2 border-border/50 bg-card p-4">
                        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          MP Sugerido
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {mpSugerido.sugerencia}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {mpSugerido.razon}
                        </p>
                      </div>
                      <div className="rounded-xl border-2 border-border/50 bg-card p-4">
                        <p className="text-xs font-semibold text-muted-foreground">MP Óptimo Actual</p>
                        <p className="mt-2 text-2xl font-bold text-primary">
                          {mpSugerido.mpOptimo}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Basado en {planProximo?.horasKmActuales || 0} h/km
                        </p>
                      </div>
                      <div className="rounded-xl border-2 border-border/50 bg-card p-4">
                        <p className="text-xs font-semibold text-muted-foreground">Próximo en</p>
                        <p className={`mt-2 text-2xl font-bold ${
                          mpSugerido.urgencia === 'high' ? 'text-destructive' : 'text-foreground'
                        }`}>
                          {mpSugerido.proximoEn} h/km
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {mpSugerido.urgencia === 'high' 
                            ? 'Requiere atención inmediata' 
                            : mpSugerido.urgencia === 'medium'
                            ? 'Planifica esta semana'
                            : 'Dentro del rango normal'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quick action buttons */}
                    <div className="flex flex-wrap gap-2 rounded-xl bg-muted/50 p-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setPlanIntervalo(mpSugerido.codigo);
                        }}
                        className="rounded-lg bg-gradient-to-r from-primary to-primary/90"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Aplicar MP Sugerido
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPlanIntervalo(mpSugerido.mpOptimo);
                        }}
                        className="rounded-lg"
                      >
                        Usar MP Óptimo ({mpSugerido.mpOptimo})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información del equipo seleccionado */}
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

              {/* Descripción del intervalo */}
              <div className="rounded-lg border border-dashed p-4">
                <p className="text-sm font-semibold">
                  Descripción del intervalo {planIntervalo || 'seleccionado'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{planIntervaloDescripcion}</p>
              </div>

              {/* Tareas y Kit */}
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <ClipboardList className="h-4 w-4 text-primary" /> Tareas clave
                  </p>
                  {planTareas.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {planTareas.map((tarea, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span className="leading-snug">{tarea}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Registra el intervalo para mostrar el checklist oficial.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Package className="h-4 w-4 text-primary" /> Kit recomendado
                    </p>
                    {planKit.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm">
                        {planKit.map((pieza, idx) => (
                          <li key={idx} className="leading-snug">
                            {pieza}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay repuestos registrados para este intervalo.
                      </p>
                    )}
                  </div>
                  {planEspeciales.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm">
                      <p className="font-semibold text-amber-800">Mantenimiento especial</p>
                      <ul className="mt-2 space-y-1 text-amber-800">
                        {planEspeciales.map((especial) => (
                          <li key={especial.id} className="leading-snug">
                            {especial.tipoMantenimiento || 'Mantenimiento especial'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Ruta sugerida */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPinned className="h-4 w-4 text-primary" /> Ruta sugerida{' '}
                    {planIntervalo ? `• ${planIntervalo}` : ''}
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
                                <TableCell className="font-medium">
                                  <div>
                                    <p className="font-semibold">{item.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{item.ficha}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{item.intervalo}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={getRemainingVariant(item.restante)}>
                                    {formatRemainingLabel(item.restante)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{item.proximo} h/km</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.capacitacion}</TableCell>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
