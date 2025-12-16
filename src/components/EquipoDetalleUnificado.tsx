/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  X,
  Gauge,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Timer,
  ExternalLink,
  Settings,
  ClipboardEdit,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CaterpillarDataCard } from './CaterpillarDataCard';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { useSugerenciaMantenimientoExtendida } from '@/hooks/useSugerenciaMantenimiento';
import { usePlanAsignado, useIntervaloActual } from '@/hooks/usePlanAsignado';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isEquipoVendido } from '@/types/equipment';
import { cn } from '@/lib/utils';

interface Props {
  ficha: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipoDetalleUnificado({ ficha, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { data } = useSupabaseDataContext();
  const { eventos } = useHistorial();
  const [equipo, setEquipo] = useState<any>(null);
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [inventariosRelacionados, setInventariosRelacionados] = useState<any[]>([]);
  const [historialEquipo, setHistorialEquipo] = useState<any[]>([]);
  const [mantenimientosRealizadosData, setMantenimientosRealizadosData] = useState<any[]>([]);
  const [actualizacionesHorasKmData, setActualizacionesHorasKmData] = useState<any[]>([]);
  const [intervaloSeleccionado, setIntervaloSeleccionado] = useState<string | null>(null);

  const esCaterpillar = useMemo(
    () => equipo?.marca?.toLowerCase().includes('caterpillar') || equipo?.marca?.toLowerCase().includes('cat'),
    [equipo],
  );

  const { data: caterpillarData } = useCaterpillarData(
    esCaterpillar ? equipo?.modelo ?? '' : '',
    esCaterpillar ? equipo?.numeroSerie ?? '' : '',
  );

  // ========================================
  // USAR HOOK DE PLAN ASIGNADO (sincronizado con Planificador)
  // ========================================
  const {
    planAsignado,
    esOverride,
    motivoOverride,
    razonSeleccion,
    intervalos: intervalosDelPlan,
    loading: loadingPlan
  } = usePlanAsignado(equipo);

  // Obtener próximo mantenimiento (necesario para calcular horas actuales)
  const proximoMantenimiento = useMemo(() => {
    if (!mantenimientos.length) return null;
    return [...mantenimientos].sort((a, b) => a.horasKmRestante - b.horasKmRestante)[0];
  }, [mantenimientos]);

  // Obtener último mantenimiento realizado (el primero del array ya ordenado desc)
  const ultimoMantenimientoRealizado = useMemo(() => {
    if (mantenimientosRealizadosData.length === 0) return null;
    return mantenimientosRealizadosData[0]; // Ya está ordenado de más reciente a más antiguo
  }, [mantenimientosRealizadosData]);

  // Obtener última lectura de horas/km (el primero del array ya ordenado desc)
  const ultimaLectura = useMemo(() => {
    if (actualizacionesHorasKmData.length === 0) return null;
    return actualizacionesHorasKmData[0]; // Ya está ordenado de más reciente a más antiguo
  }, [actualizacionesHorasKmData]);

  // Calcular horas actuales y horas del último mantenimiento
  const horasActuales = ultimaLectura?.horasKm || proximoMantenimiento?.horasKmActuales || 0;
  const horasUltimoMantenimiento = ultimoMantenimientoRealizado?.horasKmAlMomento || 0;

  // Usar hook extendido de sugerencia con información del ciclo
  const sugerencia = useSugerenciaMantenimientoExtendida(
    equipo?.marca,
    equipo?.modelo,
    equipo?.categoria,
    horasActuales,
    horasUltimoMantenimiento
  );

  // Datos del ciclo calculados dinámicamente (reemplaza valores fijos)
  const horasRestantesCiclo = sugerencia.horasParaProximo;
  const estadoAlertaCiclo = sugerencia.estadoAlerta;
  const cicloActual = sugerencia.cicloActual;
  const porcentajeCiclo = sugerencia.porcentajeCiclo;

  // Plan disponible viene del hook usePlanAsignado (sincronizado con Planificador)
  const planDisponible = planAsignado;

  // Intervalo actual a mostrar (sugerido o seleccionado manualmente)
  const intervaloActual = useMemo(() => {
    if (intervaloSeleccionado && planDisponible) {
      return planDisponible.intervalos.find(int => int.id.toString() === intervaloSeleccionado) || sugerencia.intervaloSugerido;
    }
    return sugerencia.intervaloSugerido;
  }, [intervaloSeleccionado, planDisponible, sugerencia.intervaloSugerido]);

  const intervaloCodigo = useMemo(() => {
    if (intervaloActual) {
      return intervaloActual.codigo;
    }
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
  }, [intervaloActual, proximoMantenimiento]);

  const piezasSugeridas = useMemo(() => {
    // 1. Prioridad: Kit del intervalo de BD
    if (intervaloActual && intervaloActual.kits && intervaloActual.kits.length > 0) {
      return intervaloActual.kits.flatMap(kitLink => {
        const kit = kitLink.kit;
        return (kit as any).piezas || [];
      });
    }

    // 2. Si hay kit recomendado del ciclo (datos estáticos Caterpillar/Volvo)
    if (sugerencia.kitRecomendado && sugerencia.kitRecomendado.piezas.length > 0) {
      return sugerencia.kitRecomendado.piezas.map(pieza => ({
        numero_parte: pieza.numeroParte,
        descripcion: pieza.descripcion,
        cantidad: pieza.cantidad,
      }));
    }

    // 3. Fallback a datos Caterpillar estáticos por código de intervalo
    if (!intervaloCodigo || !caterpillarData?.piezasPorIntervalo) return [];
    return caterpillarData.piezasPorIntervalo[intervaloCodigo] ?? [];
  }, [intervaloActual, intervaloCodigo, caterpillarData, sugerencia.kitRecomendado]);

  const tareasSugeridas = useMemo(() => {
    if (intervaloActual && intervaloActual.tareas && intervaloActual.tareas.length > 0) {
      return intervaloActual.tareas;
    }
    if (!intervaloCodigo || !caterpillarData?.tareasPorIntervalo) return [];
    return caterpillarData.tareasPorIntervalo[intervaloCodigo] ?? [];
  }, [intervaloActual, intervaloCodigo, caterpillarData]);

  const descripcionIntervalo = useMemo(() => {
    if (intervaloActual) {
      return intervaloActual.descripcion;
    }
    if (!intervaloCodigo || !caterpillarData?.intervalos) return null;
    const intervalo = caterpillarData.intervalos.find((item) => item.codigo === intervaloCodigo);
    return intervalo?.descripcion ?? null;
  }, [intervaloActual, intervaloCodigo, caterpillarData]);

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

      // Filtrar historial del equipo - ORDENAR DE MÁS RECIENTE A MÁS ANTIGUO
      const historial = eventos
        .filter(e => e.fichaEquipo === ficha)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistorialEquipo(historial);

      // Mantenimientos realizados - ORDENAR DE MÁS RECIENTE A MÁS ANTIGUO
      const realizados = data.mantenimientosRealizados
        .filter(m => m.ficha === ficha)
        .sort((a, b) => new Date(b.fechaMantenimiento).getTime() - new Date(a.fechaMantenimiento).getTime());
      setMantenimientosRealizadosData(realizados);

      // Actualizaciones de horas/km - ORDENAR DE MÁS RECIENTE A MÁS ANTIGUO
      const lecturas = data.actualizacionesHorasKm
        .filter(a => a.ficha === ficha)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setActualizacionesHorasKmData(lecturas);
    }
  }, [ficha, open, data, eventos]);

  // Timeline unificado: combina todos los eventos en una sola línea de tiempo
  const timelineUnificado = useMemo(() => {
    const items: Array<{
      id: string;
      tipo: 'evento' | 'mantenimiento' | 'lectura';
      fecha: Date;
      titulo: string;
      descripcion: string;
      icono: 'history' | 'wrench' | 'gauge';
      badge?: string;
      badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
      detalles?: any;
    }> = [];

    // Agregar eventos del historial
    historialEquipo.forEach(evento => {
      items.push({
        id: `evento-${evento.id}`,
        tipo: 'evento',
        fecha: new Date(evento.createdAt),
        titulo: evento.etiquetaSubtipo ?? evento.etiquetaCategoria,
        descripcion: evento.descripcion,
        icono: 'history',
        badge: evento.modulo,
        badgeVariant: 'outline',
        detalles: evento,
      });
    });

    // Agregar mantenimientos realizados
    mantenimientosRealizadosData.forEach(mant => {
      items.push({
        id: `mant-${mant.id}`,
        tipo: 'mantenimiento',
        fecha: new Date(mant.fechaMantenimiento),
        titulo: 'Mantenimiento realizado',
        descripcion: mant.observaciones || `Lectura: ${mant.horasKmAlMomento}`,
        icono: 'wrench',
        badge: `${mant.horasKmAlMomento} h`,
        badgeVariant: 'default',
        detalles: mant,
      });
    });

    // Agregar actualizaciones de lectura
    actualizacionesHorasKmData.forEach(lectura => {
      items.push({
        id: `lectura-${lectura.id}`,
        tipo: 'lectura',
        fecha: new Date(lectura.fecha),
        titulo: 'Actualización de lectura',
        descripcion: `Nueva lectura: ${lectura.horasKm} | Incremento: +${Number(lectura.incremento).toFixed(1)}`,
        icono: 'gauge',
        badge: `${lectura.horasKm} h`,
        badgeVariant: 'secondary',
        detalles: lectura,
      });
    });

    // Ordenar de más reciente a más antiguo
    return items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [historialEquipo, mantenimientosRealizadosData, actualizacionesHorasKmData]);

  // Calcular días desde última actividad
  const diasDesdeUltimaActividad = useMemo(() => {
    if (timelineUnificado.length === 0) return null;
    const ultimaFecha = timelineUnificado[0].fecha;
    const hoy = new Date();
    return Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));
  }, [timelineUnificado]);

  // Early return DESPUÉS de todos los hooks
  if (!equipo) return null;

  const mantenimientoVencido = mantenimientos.some(m => m.horasKmRestante < 0);
  const mantenimientoProximo = mantenimientos.some(m => m.horasKmRestante > 0 && m.horasKmRestante <= 50);
  const esVendido = isEquipoVendido(equipo.empresa);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[95svh] sm:max-h-[90svh] overflow-y-auto p-0 bg-background">
        {/* Hero Section - Información crítica siempre visible */}
        <div className={cn(
          "sticky top-0 z-20 p-3 sm:p-4 border-b backdrop-blur-xl",
          esVendido
            ? "bg-orange-50/95 dark:bg-orange-950/95 border-orange-200 dark:border-orange-900"
            : mantenimientoVencido
              ? "bg-red-50/95 dark:bg-red-950/95 border-destructive/20"
              : mantenimientoProximo
                ? "bg-amber-50/95 dark:bg-amber-950/95 border-amber-200 dark:border-amber-800"
                : "bg-background/95 border-border"
        )}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={cn(
                  "p-2 sm:p-2.5 rounded-xl shrink-0",
                  esVendido
                    ? "bg-orange-500/10"
                    : mantenimientoVencido
                      ? "bg-destructive/10"
                      : "bg-primary/10"
                )}>
                  <Truck className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6",
                    esVendido
                      ? "text-orange-600"
                      : mantenimientoVencido
                        ? "text-destructive"
                        : "text-primary"
                  )} />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-xl font-bold truncate">{equipo.nombre}</DialogTitle>
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-mono font-medium">{equipo.ficha}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline truncate">{equipo.marca} {equipo.modelo}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {esVendido ? (
                  <Badge variant="outline" className="text-xs border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400">
                    ⚠️ VENDIDO
                  </Badge>
                ) : (
                  <Badge variant={equipo.activo ? "default" : "secondary"} className="text-xs">
                    {equipo.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                )}
                {equipo.empresa && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] sm:text-xs",
                      equipo.empresa === 'ALITO GROUP SRL'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        : equipo.empresa === 'VENDIDO'
                          ? 'border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400'
                          : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    )}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {equipo.empresa === 'ALITO GROUP SRL' ? 'GROUP' : equipo.empresa === 'ALITO EIRL' ? 'EIRL' : equipo.empresa}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Métricas clave en el hero - Siempre visibles */}
          {!esVendido && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
              {/* Lectura actual */}
              <div className="bg-background/80 rounded-lg p-2 sm:p-3 border">
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                  <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">Lectura</span>
                </div>
                <p className="text-base sm:text-lg font-bold">
                  {horasActuales.toLocaleString()}
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5 sm:ml-1">
                    {proximoMantenimiento?.tipoMantenimiento === 'Kilómetros' ? 'km' : 'h'}
                  </span>
                </p>
              </div>

              {/* Horas restantes */}
              <div className={cn(
                "rounded-lg p-2 sm:p-3 border",
                !proximoMantenimiento
                  ? "bg-background/80"
                  : proximoMantenimiento.horasKmRestante <= 0
                    ? "bg-destructive/10 border-destructive/30"
                    : proximoMantenimiento.horasKmRestante <= 50
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-emerald-500/10 border-emerald-500/30"
              )}>
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                  <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">{proximoMantenimiento?.horasKmRestante && proximoMantenimiento.horasKmRestante <= 0 ? 'Vencido' : 'Restante'}</span>
                </div>
                <p className={cn(
                  "text-base sm:text-lg font-bold",
                  !proximoMantenimiento
                    ? "text-muted-foreground"
                    : proximoMantenimiento.horasKmRestante <= 0
                      ? "text-destructive"
                      : proximoMantenimiento.horasKmRestante <= 50
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {proximoMantenimiento
                    ? `${Math.abs(proximoMantenimiento.horasKmRestante).toLocaleString()}`
                    : 'N/A'
                  }
                  {proximoMantenimiento && (
                    <span className="text-[10px] sm:text-xs font-normal ml-0.5 sm:ml-1">
                      {proximoMantenimiento.tipoMantenimiento === 'Kilómetros' ? 'km' : 'h'}
                    </span>
                  )}
                </p>
              </div>

              {/* Próximo MP */}
              <div className="bg-background/80 rounded-lg p-2 sm:p-3 border">
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                  <Wrench className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">Próximo</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-primary truncate">
                  {intervaloCodigo || proximoMantenimiento?.tipoMantenimiento || 'N/A'}
                </p>
              </div>

              {/* Última actividad */}
              <div className="bg-background/80 rounded-lg p-2 sm:p-3 border">
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                  <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">Actividad</span>
                </div>
                <p className="text-xs sm:text-sm font-medium">
                  {diasDesdeUltimaActividad !== null
                    ? diasDesdeUltimaActividad === 0
                      ? 'Hoy'
                      : diasDesdeUltimaActividad === 1
                        ? 'Ayer'
                        : `${diasDesdeUltimaActividad}d`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Alerta de estado crítico */}
          {mantenimientoVencido && !esVendido && (
            <div className="flex items-center gap-2 mt-2 sm:mt-3 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-xs sm:text-sm text-destructive font-medium">
                ¡Mantenimiento vencido!
              </span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="general" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="mantenimiento" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mant.</span>
                {mantenimientoVencido && (
                  <Badge variant="destructive" className="ml-0.5 sm:ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                    !
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="inventario" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Repuestos</span>
              </TabsTrigger>
              <TabsTrigger value="historial" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <HistoryIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Historial</span>
                {timelineUnificado.length > 0 && (
                  <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 min-w-4 sm:min-w-5 px-0.5 sm:px-1 flex items-center justify-center text-[10px] sm:text-xs">
                    {timelineUnificado.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              {/* Sección de sugerencia de mantenimiento inteligente */}
              {(intervaloActual || planDisponible) && (
                <Card className={cn(
                  "border-2 transition-colors",
                  esOverride
                    ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-primary/30 bg-primary/5"
                )}>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className={cn(
                          "text-lg flex items-center gap-2",
                          esOverride ? "text-amber-700 dark:text-amber-400" : "text-primary"
                        )}>
                          <Sparkles className="h-5 w-5" />
                          Próxima intervención programada
                          {esOverride && (
                            <Badge variant="outline" className="ml-2 border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Plan Manual
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {esOverride ? motivoOverride || razonSeleccion : sugerencia.razon}
                        </p>
                        {planDisponible && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground/80">
                              Plan: <span className="font-medium">{planDisponible.nombre}</span>
                            </p>
                            {esOverride && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-400/50">
                                Asignado desde Planificador
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {intervaloCodigo && (
                          <Badge variant="outline" className={cn(
                            esOverride
                              ? "border-amber-500/40 bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "border-primary/40 bg-primary/10 text-primary"
                          )}>
                            {intervaloCodigo}
                          </Badge>
                        )}
                        {proximoMantenimiento && (
                          <Badge variant={getRemainingVariant(proximoMantenimiento.horasKmRestante)}>
                            {formatRemainingLabel(
                              proximoMantenimiento.horasKmRestante,
                              proximoMantenimiento.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas'
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Selector de intervalo manual */}
                    {planDisponible && planDisponible.intervalos.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 pt-2 border-t border-primary/20">
                        <Label htmlFor="intervalo-select" className="text-sm font-medium whitespace-nowrap">
                          Cambiar intervalo:
                        </Label>
                        <Select
                          value={intervaloSeleccionado || sugerencia.intervaloSugerido?.id.toString() || ''}
                          onValueChange={(value) => setIntervaloSeleccionado(value)}
                        >
                          <SelectTrigger id="intervalo-select" className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Seleccionar intervalo" />
                          </SelectTrigger>
                          <SelectContent>
                            {planDisponible.intervalos.map((int) => (
                              <SelectItem key={int.id} value={int.id.toString()}>
                                {int.nombre} ({int.horas_intervalo}h)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {intervaloSeleccionado && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIntervaloSeleccionado(null)}
                            className="text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Restaurar sugerencia
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Botones de acceso rápido */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-primary/20">
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none gap-2"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/mantenimiento?ficha=${ficha}`);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="hidden xs:inline">Control de</span> Mant.
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none gap-2"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/mantenimiento?ficha=${ficha}&action=updateHours`);
                        }}
                      >
                        <ClipboardEdit className="h-4 w-4" />
                        <span className="hidden xs:inline">Actualizar</span> Hrs/Km
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary/70">Servicio asignado</p>
                        <p className="text-sm font-semibold text-primary">
                          {intervaloActual?.nombre || proximoMantenimiento?.tipoMantenimiento || 'Mantenimiento programado'}
                        </p>
                        {descripcionIntervalo && (
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{descripcionIntervalo}</p>
                        )}
                        {intervaloActual && (
                          <div className="mt-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              Frecuencia: {intervaloActual.horas_intervalo} horas
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="rounded-md border border-primary/20 bg-slate-50 p-3 text-xs text-muted-foreground dark:bg-slate-900">
                        <p className="font-semibold text-primary mb-3">Estado del equipo</p>
                        <div className="space-y-3">
                          <div className="bg-primary/5 rounded p-2.5 border border-primary/10">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lectura actual</p>
                            <p className="text-xl font-bold text-foreground">
                              {horasActuales.toLocaleString()}
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                {proximoMantenimiento?.tipoMantenimiento === 'Kilómetros' ? 'km' : 'h'}
                              </span>
                            </p>
                            {ultimaLectura && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Actualizado {formatDistanceToNow(new Date(ultimaLectura.fecha), { addSuffix: true, locale: es })}
                              </p>
                            )}
                          </div>
                          {/* Estado del ciclo calculado dinámicamente */}
                          <div className={`rounded p-2.5 border ${estadoAlertaCiclo === 'vencido'
                            ? 'bg-destructive/5 border-destructive/20'
                            : estadoAlertaCiclo === 'urgente'
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                              : estadoAlertaCiclo === 'proximo'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                            }`}>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                              {estadoAlertaCiclo === 'vencido' ? 'Vencido por' : 'Restante para próximo servicio'}
                            </p>
                            <p className={`text-xl font-bold ${estadoAlertaCiclo === 'vencido'
                              ? 'text-destructive'
                              : estadoAlertaCiclo === 'urgente'
                                ? 'text-red-600 dark:text-red-400'
                                : estadoAlertaCiclo === 'proximo'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                              {Math.abs(horasRestantesCiclo).toLocaleString()}
                              <span className="text-sm font-normal ml-1">h</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                Ciclo #{cicloActual}
                              </p>
                              <span className="text-muted-foreground/50">•</span>
                              <p className="text-xs text-muted-foreground">
                                {porcentajeCiclo.toFixed(0)}% del ciclo
                              </p>
                            </div>
                            {/* Barra de progreso del ciclo */}
                            <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${estadoAlertaCiclo === 'vencido' ? 'bg-destructive' :
                                  estadoAlertaCiclo === 'urgente' ? 'bg-red-500' :
                                    estadoAlertaCiclo === 'proximo' ? 'bg-amber-500' :
                                      'bg-emerald-500'
                                  }`}
                                style={{ width: `${Math.min(100, porcentajeCiclo)}%` }}
                              />
                            </div>
                          </div>
                          <div className="pt-2 border-t border-primary/10">
                            <p className="text-xs text-muted-foreground">
                              Último mant.: <span className="font-medium text-foreground">{horasUltimoMantenimiento.toLocaleString() || 'N/A'}</span>
                              {horasUltimoMantenimiento > 0 && <span className="ml-1">h</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-md border border-primary/20 bg-slate-50 p-3 dark:bg-slate-900">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
                          <Package className="h-4 w-4" /> Kit sugerido
                        </p>
                        {piezasSugeridas.length > 0 ? (
                          <ul className="mt-2 space-y-2 text-xs text-foreground max-h-40 overflow-y-auto">
                            {piezasSugeridas.map((pieza: any, idx: number) => (
                              <li key={pieza.id || idx} className="flex items-start gap-2">
                                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary shrink-0">
                                  {pieza.numero_parte || (pieza.pieza && pieza.pieza.numero_parte)}
                                </Badge>
                                <span className="leading-snug">
                                  {pieza.descripcion || (pieza.pieza && pieza.pieza.descripcion)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">
                            No hay kits asociados a este intervalo. {planDisponible ? 'Importa kits o asígnalos manualmente.' : 'Crea un plan de mantenimiento para este equipo.'}
                          </p>
                        )}
                      </div>
                      <div className="rounded-md border border-primary/20 bg-slate-50 p-3 dark:bg-slate-900">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
                          <ListChecks className="h-4 w-4" /> Tareas clave
                        </p>
                        {tareasSugeridas.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-xs text-foreground max-h-40 overflow-y-auto">
                            {tareasSugeridas.map((tarea, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                <span className="leading-snug">{tarea}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">
                            No hay tareas definidas para este intervalo.
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
                          {formatRemainingLabel(
                            mant.horasKmRestante,
                            mant.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas'
                          )}
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
                            Incremento: {Number(realizado.incrementoDesdeUltimo).toFixed(1)}
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
                            Incremento: {Number(lectura.incremento).toFixed(1)}
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
              {timelineUnificado.length === 0 ? (
                <Card>
                  <CardContent className="p-4 sm:p-8 text-center">
                    <HistoryIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      No hay eventos registrados para este equipo
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-base sm:text-lg">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                        Timeline
                      </span>
                      <Badge variant="secondary" className="text-xs">{timelineUnificado.length}</Badge>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Más reciente primero
                    </p>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <ScrollArea className="h-[280px] sm:h-[400px] pr-2 sm:pr-4">
                      <div className="relative space-y-0">
                        {/* Línea vertical del timeline */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

                        {timelineUnificado.map((item, index) => (
                          <div
                            key={item.id}
                            className="relative pl-10 pb-6 last:pb-0"
                          >
                            {/* Punto del timeline */}
                            <div className={cn(
                              "absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                              item.tipo === 'mantenimiento'
                                ? "bg-amber-500"
                                : item.tipo === 'lectura'
                                  ? "bg-sky-500"
                                  : "bg-primary"
                            )} />

                            <div className={cn(
                              "rounded-lg border p-3 transition-all hover:shadow-md",
                              item.tipo === 'mantenimiento'
                                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/50"
                                : item.tipo === 'lectura'
                                  ? "bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-900/50"
                                  : "bg-card border-border"
                            )}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {item.tipo === 'mantenimiento' && <Wrench className="h-4 w-4 text-amber-600" />}
                                  {item.tipo === 'lectura' && <Gauge className="h-4 w-4 text-sky-600" />}
                                  {item.tipo === 'evento' && <HistoryIcon className="h-4 w-4 text-primary" />}
                                  <span className="font-medium text-sm">{item.titulo}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.badge && (
                                    <Badge
                                      variant={item.badgeVariant || 'outline'}
                                      className="text-xs"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground mb-2">
                                {item.descripcion}
                              </p>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(item.fecha, 'dd MMM yyyy, HH:mm', { locale: es })}
                                </span>
                                <span>
                                  ({formatDistanceToNow(item.fecha, { addSuffix: true, locale: es })})
                                </span>
                                {item.detalles?.usuarioResponsable && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                                    {item.detalles.usuarioResponsable}
                                  </span>
                                )}
                              </div>

                              {/* Detalles adicionales según tipo */}
                              {item.tipo === 'mantenimiento' && item.detalles?.filtrosUtilizados?.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-900/50">
                                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                                    Insumos utilizados:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.detalles.filtrosUtilizados.map((filtro: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs bg-white/50 dark:bg-black/20">
                                        {filtro.nombre} ({filtro.cantidad})
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {item.tipo === 'lectura' && item.detalles?.incremento > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                                  <TrendingUp className="h-3 w-3" />
                                  Incremento: +{Number(item.detalles.incremento).toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
