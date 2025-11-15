/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useHistorial } from '@/hooks/useHistorial';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  Wrench,
  Package,
  History as HistoryIcon,
  Calendar,
  AlertCircle,
  TrendingUp,
  Activity,
  Clock3,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CaterpillarDataCard } from './CaterpillarDataCard';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';

interface Props {
  ficha: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipoDetalleUnificado({ ficha, open, onOpenChange }: Props) {
  const { data } = useSupabaseDataContext();
  const { eventos } = useHistorial();
  const [equipo, setEquipo] = useState<any>(null);
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [inventariosRelacionados, setInventariosRelacionados] = useState<any[]>([]);
  const [historialEquipo, setHistorialEquipo] = useState<any[]>([]);
  const [mantenimientosRealizadosData, setMantenimientosRealizadosData] = useState<any[]>([]);
  const [actualizacionesHorasKmData, setActualizacionesHorasKmData] = useState<any[]>([]);

  const esCaterpillar = useMemo(
    () => equipo?.marca?.toLowerCase().includes('caterpillar') || equipo?.marca?.toLowerCase().includes('cat'),
    [equipo],
  );

  const { data: caterpillarData } = useCaterpillarData(
    esCaterpillar ? equipo?.modelo ?? '' : '',
    esCaterpillar ? equipo?.numeroSerie ?? '' : '',
  );

  const proximoMantenimiento = useMemo(() => {
    if (!mantenimientos.length) return null;
    return [...mantenimientos].sort((a, b) => a.horasKmRestante - b.horasKmRestante)[0];
  }, [mantenimientos]);

  const intervaloCodigo = useMemo(() => {
    if (!proximoMantenimiento) return null;
    const match = proximoMantenimiento.tipoMantenimiento?.match(/(PM\d)/i);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
    const frecuencia = proximoMantenimiento.frecuencia ?? 0;
    if (frecuencia <= 0) return null;
    if (frecuencia <= 250) return 'PM1';
    if (frecuencia <= 500) return 'PM2';
    if (frecuencia <= 1000) return 'PM3';
    if (frecuencia <= 2000) return 'PM4';
    return null;
  }, [proximoMantenimiento]);

  const piezasSugeridas = useMemo(() => {
    if (!intervaloCodigo || !caterpillarData?.piezasPorIntervalo) return [];
    return caterpillarData.piezasPorIntervalo[intervaloCodigo] ?? [];
  }, [intervaloCodigo, caterpillarData]);

  const tareasSugeridas = useMemo(() => {
    if (!intervaloCodigo || !caterpillarData?.tareasPorIntervalo) return [];
    return caterpillarData.tareasPorIntervalo[intervaloCodigo] ?? [];
  }, [intervaloCodigo, caterpillarData]);

  const descripcionIntervalo = useMemo(() => {
    if (!intervaloCodigo || !caterpillarData?.intervalos) return null;
    const intervalo = caterpillarData.intervalos.find((item) => item.codigo === intervaloCodigo);
    return intervalo?.descripcion ?? null;
  }, [intervaloCodigo, caterpillarData]);

  const ultimaActualizacionLabel = useMemo(() => {
    if (!proximoMantenimiento?.fechaUltimaActualizacion) return 'Sin registro reciente';
    const fecha = new Date(proximoMantenimiento.fechaUltimaActualizacion);
    if (Number.isNaN(fecha.getTime())) return 'Sin registro reciente';
    return formatDistanceToNow(fecha, { addSuffix: true, locale: es });
  }, [proximoMantenimiento]);

  const lecturaActualLabel = useMemo(() => {
    if (proximoMantenimiento?.horasKmActuales === null || proximoMantenimiento?.horasKmActuales === undefined) {
      return 'Sin lectura registrada';
    }
    return `${proximoMantenimiento.horasKmActuales} horas/km`;
  }, [proximoMantenimiento]);

  useEffect(() => {
    if (ficha && open) {
      // Buscar equipo
      const equipoEncontrado = data.equipos.find(e => e.ficha === ficha);
      setEquipo(equipoEncontrado);

      // Buscar mantenimientos del equipo
      const mants = data.mantenimientosProgramados.filter(m => m.ficha === ficha);
      setMantenimientos(mants);

      // Buscar inventarios relacionados por categoría
      if (equipoEncontrado) {
        const inventarios = data.inventarios.filter(
          i => i.categoriaEquipo === equipoEncontrado.categoria
        );
        setInventariosRelacionados(inventarios);
      }

      // Filtrar historial del equipo
      const historial = eventos.filter(e => e.fichaEquipo === ficha);
      setHistorialEquipo(historial);

      // Mantenimientos realizados
      const realizados = data.mantenimientosRealizados
        .filter(m => m.ficha === ficha)
        .sort((a, b) => new Date(a.fechaMantenimiento).getTime() - new Date(b.fechaMantenimiento).getTime());
      setMantenimientosRealizadosData(realizados);

      // Actualizaciones de horas/km
      const lecturas = data.actualizacionesHorasKm
        .filter(a => a.ficha === ficha)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      setActualizacionesHorasKmData(lecturas);
    }
  }, [ficha, open, data, eventos]);

  if (!equipo) return null;

  const mantenimientoVencido = mantenimientos.some(m => m.horasKmRestante < 0);
  const mantenimientoProximo = mantenimientos.some(m => m.horasKmRestante > 0 && m.horasKmRestante <= 50);
  const ultimoMantenimientoRealizado =
    mantenimientosRealizadosData.length > 0
      ? mantenimientosRealizadosData[mantenimientosRealizadosData.length - 1]
      : null;
  const ultimaLectura =
    actualizacionesHorasKmData.length > 0
      ? actualizacionesHorasKmData[actualizacionesHorasKmData.length - 1]
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Truck className="h-6 w-6" />
                {equipo.nombre}
              </DialogTitle>
              <p className="text-muted-foreground mt-1">Ficha: {equipo.ficha}</p>
            </div>
            <Badge variant={equipo.activo ? "default" : "secondary"}>
              {equipo.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Truck className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="mantenimiento" className="gap-2">
              <Wrench className="h-4 w-4" />
              Mantenimientos
              {mantenimientoVencido && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inventario" className="gap-2">
              <Package className="h-4 w-4" />
              Repuestos
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <HistoryIcon className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {proximoMantenimiento && (
              <Card className="border border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                      <Sparkles className="h-5 w-5" /> Próxima intervención programada
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Basado en las lecturas más recientes registradas para este equipo.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {intervaloCodigo && (
                      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                        {intervaloCodigo}
                      </Badge>
                    )}
                    <Badge variant={getRemainingVariant(proximoMantenimiento.horasKmRestante)}>
                      {formatRemainingLabel(proximoMantenimiento.horasKmRestante)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary/70">Servicio asignado</p>
                      <p className="text-sm font-semibold text-primary">
                        {proximoMantenimiento.tipoMantenimiento || 'Mantenimiento programado'}
                      </p>
                      {descripcionIntervalo && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{descripcionIntervalo}</p>
                      )}
                    </div>
                    <div className="rounded-md border border-primary/20 bg-white/70 p-3 text-xs text-muted-foreground dark:bg-background">
                      <p className="font-semibold text-primary">Última lectura registrada</p>
                      <p className="mt-1 text-sm text-foreground">{lecturaActualLabel}</p>
                      <p className="text-[11px] text-muted-foreground">Actualizado {ultimaActualizacionLabel}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-md border border-primary/20 bg-white/80 p-3 dark:bg-background">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
                        <Package className="h-4 w-4" /> Kit sugerido
                      </p>
                      {esCaterpillar ? (
                        piezasSugeridas.length > 0 ? (
                          <ul className="mt-2 space-y-2 text-xs text-foreground">
                            {piezasSugeridas.map((pieza) => (
                              <li key={pieza.id} className="flex items-start gap-2">
                                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                                  {pieza.pieza.numero_parte}
                                </Badge>
                                <span className="leading-snug">{pieza.pieza.descripcion}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">
                            No hay kits asociados a este intervalo en la base actual. Verifica el OMM para confirmar repuestos.
                          </p>
                        )
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Registra el equipo como Caterpillar para sugerir kits homologados por modelo y serie.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-primary/20 bg-white/80 p-3 dark:bg-background">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
                        <ListChecks className="h-4 w-4" /> Tareas clave
                      </p>
                      {tareasSugeridas.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-foreground">
                          {tareasSugeridas.map((tarea) => (
                            <li key={tarea} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="leading-snug">{tarea}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Cuando se identifique el kit, mostraremos aquí las actividades recomendadas para el intervalo.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tarjeta de datos Caterpillar si aplica */}
            <CaterpillarDataCard
              modelo={equipo.modelo}
              numeroSerie={equipo.numeroSerie}
              marca={equipo.marca}
              mantenimientos={mantenimientos}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Equipo</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{equipo.marca}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{equipo.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número de Serie</p>
                  <p className="font-medium">{equipo.numeroSerie}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium">{equipo.placa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <p className="font-medium">{equipo.categoria}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={equipo.activo ? "default" : "secondary"}>
                    {equipo.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                {!equipo.activo && equipo.motivoInactividad && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Motivo de Inactividad</p>
                    <p className="font-medium">{equipo.motivoInactividad}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Estado General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mantenimientos activos</span>
                  <Badge>{mantenimientos.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mantenimientos vencidos</span>
                  <Badge variant={mantenimientoVencido ? "destructive" : "default"}>
                    {mantenimientos.filter(m => m.horasKmRestante < 0).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Repuestos compatibles</span>
                  <Badge>{inventariosRelacionados.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Eventos registrados</span>
                  <Badge>{historialEquipo.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Último mantenimiento realizado</span>
                  <Badge variant={ultimoMantenimientoRealizado ? "secondary" : "outline"}>
                    {ultimoMantenimientoRealizado
                      ? format(new Date(ultimoMantenimientoRealizado.fechaMantenimiento), 'dd MMM yyyy', { locale: es })
                      : 'Sin registros'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Última lectura registrada</span>
                  <Badge variant={ultimaLectura ? "outline" : "outline"}>
                    {ultimaLectura
                      ? `${ultimaLectura.horasKm} • ${formatDistanceToNow(new Date(ultimaLectura.fecha), {
                          addSuffix: true,
                          locale: es,
                        })}`
                      : 'Sin registros'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mantenimiento" className="space-y-4">
            {mantenimientos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No hay mantenimientos programados para este equipo
                  </p>
                </CardContent>
              </Card>
            ) : (
              mantenimientos.map((mant) => (
                <Card key={mant.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{mant.tipoMantenimiento}</CardTitle>
                      <Badge variant={getRemainingVariant(mant.horasKmRestante)}>
                        {formatRemainingLabel(mant.horasKmRestante)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Horas/Km Actuales</p>
                      <p className="font-medium">{mant.horasKmActuales}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próximo Mantenimiento</p>
                      <p className="font-medium">{mant.proximoMantenimiento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frecuencia</p>
                      <p className="font-medium">Cada {mant.frecuencia}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Última Actualización</p>
                      <p className="font-medium text-xs">
                        {formatDistanceToNow(new Date(mant.fechaUltimaActualizacion), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {mantenimientosRealizadosData.length > 0 && (
              <Card className="border border-amber-200/70 bg-amber-50/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <HistoryIcon className="h-5 w-5" />
                    Mantenimientos realizados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mantenimientosRealizadosData.map((realizado) => (
                    <div
                      key={realizado.id}
                      className="rounded-xl border border-amber-200/60 bg-white/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-amber-800">
                          {format(new Date(realizado.fechaMantenimiento), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <Badge variant="outline">Lectura: {realizado.horasKmAlMomento}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {realizado.observaciones || 'Sin observaciones registradas.'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                          {realizado.usuarioResponsable}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-amber-600" />
                          Incremento: {realizado.incrementoDesdeUltimo}
                        </span>
                      </div>
                      {realizado.filtrosUtilizados?.length > 0 && (
                        <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/60 p-3 text-xs">
                          <p className="font-semibold text-amber-700">Insumos utilizados</p>
                          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                            {realizado.filtrosUtilizados.map((filtro: any, index: number) => (
                              <li key={`${realizado.id}-${index}`} className="flex items-center justify-between">
                                <span>{filtro.nombre}</span>
                                <span className="font-medium text-amber-800">{filtro.cantidad}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {actualizacionesHorasKmData.length > 0 && (
              <Card className="border border-sky-200/70 bg-sky-50/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-700">
                    <Activity className="h-5 w-5" />
                    Actualizaciones de horas/km
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {actualizacionesHorasKmData.map((lectura) => (
                    <div
                      key={lectura.id}
                      className="rounded-xl border border-sky-200/60 bg-white/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-sky-800">
                          {format(new Date(lectura.fecha), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <Badge variant="outline">{lectura.horasKm} horas/km</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-sky-500" />
                          Incremento: {lectura.incremento}
                        </span>
                        <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
                          {lectura.usuarioResponsable}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Registrado {formatDistanceToNow(new Date(lectura.fecha), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inventario" className="space-y-4">
            {inventariosRelacionados.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No hay repuestos relacionados con este equipo
                  </p>
                </CardContent>
              </Card>
            ) : (
              inventariosRelacionados.map((inv) => (
                <Card key={inv.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{inv.nombre}</CardTitle>
                      <Badge
                        variant={
                          inv.cantidad === 0
                            ? "destructive"
                            : inv.cantidad <= 5
                            ? "secondary"
                            : "default"
                        }
                      >
                        Stock: {inv.cantidad}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{inv.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Código</p>
                      <p className="font-medium">{inv.codigoIdentificacion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Proveedor</p>
                      <p className="font-medium">{inv.empresaSuplidora}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Categoría</p>
                      <p className="font-medium">{inv.categoriaEquipo}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            {historialEquipo.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No hay eventos registrados para este equipo
                  </p>
                </CardContent>
              </Card>
            ) : (
              historialEquipo.map((evento) => (
                <Card key={evento.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 mt-1">
                        <HistoryIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{evento.etiquetaSubtipo ?? evento.etiquetaCategoria}</Badge>
                          <Badge variant="outline">{evento.modulo}</Badge>
                        </div>
                        <p className="font-medium mb-1">{evento.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(evento.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })} • {evento.usuarioResponsable}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
