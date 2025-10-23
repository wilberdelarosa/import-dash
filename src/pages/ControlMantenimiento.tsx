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
import { Loader2, Wrench, CalendarCheck, Gauge, ClipboardList, CalendarRange } from 'lucide-react';
import type { ActualizacionHorasKm, MantenimientoProgramado, MantenimientoRealizado } from '@/types/equipment';
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
  const [updating, setUpdating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [reporteDesde, setReporteDesde] = useState('');
  const [reporteHasta, setReporteHasta] = useState('');
  const [resumenActualizaciones, setResumenActualizaciones] = useState<ResumenActualizaciones | null>(null);

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

    const finAjustado = new Date(fin);
    finAjustado.setHours(23, 59, 59, 999);

    const eventosEnRango = data.actualizacionesHorasKm.filter((evento) => {
      const fechaEvento = new Date(evento.fecha);
      if (Number.isNaN(fechaEvento.getTime())) return false;
      return fechaEvento >= inicio && fechaEvento <= finAjustado;
    });

    const eventosPorFicha = new Map<string, ActualizacionHorasKm>();
    eventosEnRango.forEach((evento) => {
      const actual = eventosPorFicha.get(evento.ficha);
      if (!actual || new Date(evento.fecha).getTime() > new Date(actual.fecha).getTime()) {
        eventosPorFicha.set(evento.ficha, evento);
      }
    });

    const fichasActualizadas = new Set(eventosPorFicha.keys());

    const actualizados = data.mantenimientosProgramados
      .filter((mantenimiento) => fichasActualizadas.has(mantenimiento.ficha))
      .map((mantenimiento) => ({
        mantenimiento,
        evento: eventosPorFicha.get(mantenimiento.ficha) ?? null,
      }));

    const pendientes = data.mantenimientosProgramados
      .filter((mantenimiento) => !fichasActualizadas.has(mantenimiento.ficha));

    setResumenActualizaciones({
      desde: inicio.toISOString(),
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
                <Badge variant={selected.horasKmRestante <= 15 ? 'destructive' : 'outline'}>
                  {selected.horasKmRestante}
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
            {selected.horasKmRestante <= 25 && (
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
                <div className="grid gap-2 md:grid-cols-2">
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
