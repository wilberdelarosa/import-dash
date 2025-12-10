import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { usePlanes } from '@/hooks/usePlanes';
import { useRutasPredictivas } from '@/hooks/useRutasPredictivas';
import { useOverridesPlanes } from '@/hooks/useOverridesPlanes';
import { useKits } from '@/hooks/useKits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Route,
  Search,
  Filter,
  X,
  ChevronRight,
  Gauge,
  Bell,
  Sparkles,
  MapPinned,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Package,
  Wrench,
  Clock,
  Info,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { PlanificadorMobile } from '@/pages/mobile/PlanificadorMobile';

export default function PlanificadorInteligente() {
  const { data, loading } = useSupabaseDataContext();
  const { planes, loading: loadingPlanes } = usePlanes();
  const { kits, loading: loadingKits } = useKits();
  const { toast } = useToast();
  const { overrides, crearOverride } = useOverridesPlanes();

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all');
  const [planManualOverride, setPlanManualOverride] = useState<Record<string, number>>({});
  const [dialogOverrideOpen, setDialogOverrideOpen] = useState(false);
  const [motivoOverride, setMotivoOverride] = useState('');
  const [dialogMPManualOpen, setDialogMPManualOpen] = useState(false);
  const [mpManual, setMpManual] = useState('');
  const [observacionesMPManual, setObservacionesMPManual] = useState('');
  const [mpAsignadoManualmente, setMpAsignadoManualmente] = useState<Record<string, string>>({});
  const [dialogKitDetalleOpen, setDialogKitDetalleOpen] = useState(false);
  const [kitSeleccionado, setKitSeleccionado] = useState<{
    id: number;
    nombre: string;
    codigo: string;
    descripcion: string | null;
    piezas?: Array<{
      id: number;
      numero_parte: string;
      descripcion: string;
      tipo: string;
      cantidad: number;
      unidad: string | null;
      notas: string | null;
    }>;
  } | null>(null);
  const [planesRecomendadosAbierto, setPlanesRecomendadosAbierto] = useState(false);

  // Obtener equipo seleccionado
  const equipo = useMemo(
    () => data.equipos.find((e) => e.ficha === equipoSeleccionado),
    [data.equipos, equipoSeleccionado]
  );

  // Filtrar equipos
  const equiposFiltrados = useMemo(() => {
    let resultado = data.equipos;

    if (busqueda) {
      const term = busqueda.toLowerCase();
      resultado = resultado.filter(
        (eq) =>
          eq.ficha.toLowerCase().includes(term) ||
          eq.nombre.toLowerCase().includes(term) ||
          eq.modelo?.toLowerCase().includes(term)
      );
    }

    if (filtroCategoria !== 'all') {
      resultado = resultado.filter((eq) => eq.categoria === filtroCategoria);
    }

    return resultado;
  }, [data.equipos, busqueda, filtroCategoria]);

  // Categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(data.equipos.map((e) => e.categoria).filter(c => c && c.toString().trim() !== ''));
    return Array.from(cats).sort();
  }, [data.equipos]);

  // Calcular score de similitud de plan
  const calcularScorePlan = (plan: { modelo?: string | null; marca?: string | null; categoria?: string | null }, equipo: { modelo?: string | null; marca?: string | null; categoria?: string | null }) => {
    let score = 0;

    // Modelo exacto +50%
    if (plan.modelo && equipo.modelo && plan.modelo.toLowerCase() === equipo.modelo.toLowerCase()) {
      score += 50;
    }

    // Marca exacta +30%
    if (plan.marca && equipo.marca && plan.marca.toLowerCase() === equipo.marca.toLowerCase()) {
      score += 30;
    }

    // Categoría exacta +20%
    if (plan.categoria && equipo.categoria && plan.categoria.toLowerCase() === equipo.categoria.toLowerCase()) {
      score += 20;
    }

    return score;
  };

  // Planes sugeridos para el equipo
  const planesSugeridos = useMemo(() => {
    if (!equipo || loadingPlanes) return [];

    const sugerencias = planes
      .map((plan) => ({
        plan,
        score: calcularScorePlan(plan, equipo),
        razon: (() => {
          const razones = [];
          if (plan.modelo?.toLowerCase() === equipo.modelo?.toLowerCase()) razones.push('Modelo exacto');
          if (plan.marca?.toLowerCase() === equipo.marca?.toLowerCase()) razones.push('Marca coincide');
          if (plan.categoria?.toLowerCase() === equipo.categoria?.toLowerCase()) razones.push('Categoría coincide');
          return razones.length > 0 ? razones.join(' • ') : 'Genérico';
        })(),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return sugerencias;
  }, [equipo, planes, loadingPlanes]);

  // Plan actual del equipo
  const planActual = useMemo(() => {
    if (!equipo) return null;
    const overrideManual = planManualOverride[equipo.ficha];
    if (overrideManual) {
      return planes.find((p) => p.id === overrideManual);
    }
    return planesSugeridos[0]?.plan || null;
  }, [equipo, planManualOverride, planes, planesSugeridos]);

  // Último mantenimiento realizado del equipo
  const ultimoMantenimientoRealizado = useMemo(() => {
    if (!equipo) return null;
    const mantsEquipo = data.mantenimientosRealizados
      .filter((m) => m.ficha === equipo.ficha)
      .sort((a, b) => new Date(b.fechaMantenimiento).getTime() - new Date(a.fechaMantenimiento).getTime());
    return mantsEquipo[0] || null;
  }, [equipo, data.mantenimientosRealizados]);

  // Mantenimiento programado del equipo
  const mantenimientoProgramado = useMemo(() => {
    if (!equipo) return null;
    return data.mantenimientosProgramados.find((m) => m.ficha === equipo.ficha) || null;
  }, [equipo, data.mantenimientosProgramados]);

  // Calcular MP sugerido según horas desde último mantenimiento
  const mpSugerido = useMemo(() => {
    if (!equipo || !mantenimientoProgramado) return null;

    const horasActuales = mantenimientoProgramado.horasKmActuales;
    const horasUltimoMant = ultimoMantenimientoRealizado?.horasKmAlMomento || mantenimientoProgramado.horasKmUltimoMantenimiento;
    const horasTranscurridas = horasActuales - horasUltimoMant;

    // Si hay MP manual asignado, usarlo
    const mpManualAsignado = mpAsignadoManualmente[equipo.ficha];
    if (mpManualAsignado) {
      const horasObjetivoMap: Record<string, number> = {
        'PM1': 250,
        'PM2': 500,
        'PM3': 1000,
        'PM4': 2000,
      };

      return {
        mp: mpManualAsignado,
        horasObjetivo: horasObjetivoMap[mpManualAsignado] || 250,
        horasTranscurridas,
        horasActuales,
        horasUltimoMant,
        razon: `MP asignado manualmente (${horasTranscurridas.toFixed(1)}h desde último)`,
        esManual: true,
      };
    }

    let mp = 'PM1';
    let horasObjetivo = 250;
    let razon = 'Mantenimiento preventivo regular';

    if (horasTranscurridas >= 2000) {
      mp = 'PM4';
      horasObjetivo = 2000;
      razon = `Han transcurrido ${horasTranscurridas.toFixed(1)}h desde el último mantenimiento mayor`;
    } else if (horasTranscurridas >= 1000) {
      mp = 'PM3';
      horasObjetivo = 1000;
      razon = `Han transcurrido ${horasTranscurridas.toLocaleString()}h desde el último mantenimiento`;
    } else if (horasTranscurridas >= 500) {
      mp = 'PM2';
      horasObjetivo = 500;
      razon = `Han transcurrido ${horasTranscurridas.toLocaleString()}h desde el último mantenimiento`;
    } else {
      razon = `Mantenimiento regular cada 250h (${horasTranscurridas.toFixed(1)}h desde último)`;
    }

    return {
      mp,
      horasObjetivo,
      horasTranscurridas,
      horasActuales,
      horasUltimoMant,
      razon,
      esManual: false,
    };
  }, [equipo, mantenimientoProgramado, ultimoMantenimientoRealizado, mpAsignadoManualmente]);

  // Hook de rutas predictivas
  const { rutas, estadisticas, guardarRutas } = useRutasPredictivas(equipoSeleccionado || '', planActual?.id || null);

  // Kits asociados al plan actual
  const kitsDelPlanActual = useMemo(() => {
    if (!planActual || !planActual.intervalos) return [];

    interface KitConIntervalo {
      id: number;
      nombre: string;
      codigo: string;
      descripcion: string | null;
      marca: string | null;
      modelo_aplicable: string | null;
      categoria: string | null;
      activo: boolean;
      created_at: string;
      intervaloMP: string;
      intervaloNombre: string;
      intervaloHoras: number;
    }

    const todosLosKits: KitConIntervalo[] = [];
    planActual.intervalos.forEach((intervalo) => {
      if (intervalo.kits && intervalo.kits.length > 0) {
        intervalo.kits.forEach((kitAssignment) => {
          if (kitAssignment.kit) {
            todosLosKits.push({
              ...kitAssignment.kit,
              intervaloMP: intervalo.codigo,
              intervaloNombre: intervalo.nombre,
              intervaloHoras: intervalo.horas_intervalo,
            });
          }
        });
      }
    });

    return todosLosKits;
  }, [planActual]);

  // Kit sugerido para el MP actual
  const kitSugeridoParaMP = useMemo(() => {
    if (!mpSugerido || !kitsDelPlanActual.length) return null;

    // Buscar kit que coincida con el MP sugerido
    const kitEncontrado = kitsDelPlanActual.find((kit) =>
      kit.intervaloMP === mpSugerido.mp ||
      kit.intervaloNombre?.toLowerCase().includes(mpSugerido.mp.toLowerCase())
    );

    return kitEncontrado || kitsDelPlanActual[0];
  }, [mpSugerido, kitsDelPlanActual]);

  const handleSeleccionarPlan = (planId: number) => {
    if (!equipo) return;

    setPlanManualOverride((prev) => ({
      ...prev,
      [equipo.ficha]: planId,
    }));

    const planSeleccionado = planes.find((p) => p.id === planId);
    toast({
      title: '✅ Plan seleccionado',
      description: `Usando: ${planSeleccionado?.nombre}`,
    });
  };

  const handleGuardarOverride = async () => {
    if (!equipo || !planActual) return;

    try {
      await crearOverride({
        ficha_equipo: equipo.ficha,
        plan_original_id: planesSugeridos[0]?.plan?.id || null,
        plan_forzado_id: planActual.id,
        motivo: motivoOverride,
        usuario_email: 'admin@alito.com', // TODO: obtener del contexto de auth
      });

      toast({
        title: '✅ Override guardado',
        description: 'El plan manual ha sido registrado en el sistema',
      });

      setDialogOverrideOpen(false);
      setMotivoOverride('');
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar el override',
        variant: 'destructive',
      });
    }
  };

  const handleAsignarMPManual = () => {
    if (!equipo || !mpManual) return;

    // Guardar MP manual para este equipo
    setMpAsignadoManualmente((prev) => ({
      ...prev,
      [equipo.ficha]: mpManual,
    }));

    toast({
      title: '✅ MP Asignado',
      description: `Se asignó ${mpManual} para el equipo ${equipo.ficha}. Las rutas se han replanificado.`,
    });

    setDialogMPManualOpen(false);
    setMpManual('');
    setObservacionesMPManual('');
  };

  const handleVerDetalleKit = async (kit: { id: number; nombre: string; codigo: string; descripcion: string | null }) => {
    // Cargar las piezas del kit
    try {
      const { data: piezas, error } = await supabase
        .from('kit_piezas')
        .select('*')
        .eq('kit_id', kit.id)
        .order('tipo');

      if (error) throw error;

      setKitSeleccionado({
        ...kit,
        piezas: piezas || [],
      });
      setDialogKitDetalleOpen(true);
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudieron cargar las piezas del kit',
        variant: 'destructive',
      });
    }
  };

  const { isMobile } = useDeviceDetection();

  if (isMobile) {
    return (
      <PlanificadorMobile
        equipos={equiposFiltrados}
        equipoSeleccionado={equipo}
        onSelectEquipo={setEquipoSeleccionado}
        planActual={planActual}
        mpSugerido={mpSugerido}
        planesSugeridos={planesSugeridos}
        onSeleccionarPlan={handleSeleccionarPlan}
        onAsignarMPManual={(mp) => {
          setMpManual(mp);
          handleAsignarMPManual();
        }}
        planManualOverride={planManualOverride}
      />
    );
  }

  return (
    <Layout title="Planificador Inteligente">
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/15">
                  <Route className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Planificador Inteligente</CardTitle>
                  <CardDescription className="text-base">
                    Sistema de sugerencias automáticas y rutas predictivas
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{data.equipos.length}</p>
                  <p className="text-xs text-muted-foreground">Equipos</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{planes.length}</p>
                  <p className="text-xs text-muted-foreground">Planes</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{overrides.length}</p>
                  <p className="text-xs text-muted-foreground">Overrides</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Layout principal */}
        <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
          {/* Panel izquierdo - Selector de equipos */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Seleccionar Equipo
                <Badge variant="secondary" className="ml-auto">
                  {equiposFiltrados.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filtro categoría */}
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator />

              {/* Lista de equipos */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : equiposFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No se encontraron equipos</p>
                  </div>
                ) : (
                  equiposFiltrados.map((eq) => (
                    <button
                      key={eq.ficha}
                      onClick={() => setEquipoSeleccionado(eq.ficha)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border-2 transition-all',
                        equipoSeleccionado === eq.ficha
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{eq.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {eq.ficha}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {eq.categoria}
                            </Badge>
                          </div>
                          {eq.modelo && (
                            <p className="text-xs text-muted-foreground mt-1">{eq.modelo}</p>
                          )}
                        </div>
                        <ChevronRight
                          className={cn(
                            'h-5 w-5 transition-transform',
                            equipoSeleccionado === eq.ficha ? 'text-primary rotate-0' : 'text-muted-foreground -rotate-90'
                          )}
                        />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panel derecho - Detalles y rutas */}
          <div className="space-y-6">
            {!equipoSeleccionado ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPinned className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Selecciona un equipo para ver su planificación
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Info del equipo */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Gauge className="h-5 w-5 text-primary" />
                          {equipo?.nombre}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {equipo?.ficha} • {equipo?.modelo} • {equipo?.categoria}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEquipoSeleccionado(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {planActual && (
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm">
                          Plan actual: {planActual.nombre}
                        </Badge>
                        {planManualOverride[equipo!.ficha] && (
                          <Badge variant="outline" className="text-xs">
                            Manual
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Estado Actual - MP Planificado */}
                {mpSugerido && (
                  <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-4 rounded-xl",
                            mpSugerido.esManual ? "bg-amber-100 dark:bg-amber-950" : "bg-green-100 dark:bg-green-950"
                          )}>
                            <Bell className={cn(
                              "h-8 w-8",
                              mpSugerido.esManual ? "text-amber-600" : "text-green-600"
                            )} />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {mpSugerido.esManual ? '🔧 MP Asignado Manualmente' : '🤖 MP Planificado Automático'}
                            </p>
                            <div className="flex items-center gap-3">
                              <Badge className={cn(
                                "text-3xl py-2 px-6",
                                mpSugerido.esManual
                                  ? "bg-amber-600 hover:bg-amber-700"
                                  : "bg-green-600 hover:bg-green-700"
                              )}>
                                {mpSugerido.mp}
                              </Badge>
                              <div>
                                <p className="text-xs text-muted-foreground">Próximo en</p>
                                <p className={cn(
                                  "text-xl font-bold",
                                  (mantenimientoProgramado?.horasKmRestante || 0) > 0
                                    ? "text-orange-600"
                                    : "text-red-600"
                                )}>
                                  {mantenimientoProgramado?.horasKmRestante.toFixed(1)}h
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Horas Actuales</p>
                          <p className="text-2xl font-bold">{mpSugerido.horasActuales.toLocaleString()}h</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {mpSugerido.horasTranscurridas.toLocaleString()}h desde último
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Planes sugeridos - Botón desplegable */}
                {planesSugeridos.length > 0 && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setPlanesRecomendadosAbierto(!planesRecomendadosAbierto)}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>Planes Recomendados</span>
                        <Badge variant="secondary" className="text-xs">
                          {planesSugeridos.length}
                        </Badge>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        planesRecomendadosAbierto && "rotate-90"
                      )} />
                    </Button>

                    {planesRecomendadosAbierto && (
                      <Card className="border-2 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                          <CardDescription>
                            Basado en análisis de similitud de modelo/marca/categoría
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {planesSugeridos.slice(0, 3).map(({ plan, score, razon }) => (
                            <div
                              key={plan.id}
                              className={cn(
                                'p-4 rounded-lg border-2 cursor-pointer transition-all',
                                planManualOverride[equipo!.ficha] === plan.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              )}
                              onClick={() => handleSeleccionarPlan(plan.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      variant={score >= 70 ? 'default' : 'secondary'}
                                      className="text-xs font-bold"
                                    >
                                      {score}% match
                                    </Badge>
                                    {planManualOverride[equipo!.ficha] === plan.id && (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <p className="font-semibold text-sm">{plan.nombre}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {plan.marca} {plan.modelo && `• ${plan.modelo}`} • {razon}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {plan.intervalos?.length || 0} intervalos
                                    </Badge>
                                    {plan.categoria && (
                                      <Badge variant="outline" className="text-xs">
                                        {plan.categoria}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {planManualOverride[equipo!.ficha] && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  const newOverrides = { ...planManualOverride };
                                  delete newOverrides[equipo!.ficha];
                                  setPlanManualOverride(newOverrides);
                                }}
                              >
                                Restaurar automático
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setDialogOverrideOpen(true)}
                              >
                                Guardar override
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* MP Sugerido y Estado del Equipo */}
                {mpSugerido && mantenimientoProgramado && (
                  <Card className={cn(
                    "border-2",
                    mpSugerido.esManual
                      ? "border-amber-200 dark:border-amber-800"
                      : "border-green-200 dark:border-green-800"
                  )}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Wrench className={cn(
                              "h-5 w-5",
                              mpSugerido.esManual ? "text-amber-600" : "text-green-600"
                            )} />
                            {mpSugerido.esManual ? 'MP Asignado Manualmente' : 'MP Sugerido Según Último Mantenimiento'}
                            {mpSugerido.esManual && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                Manual
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Basado en {mpSugerido.horasTranscurridas.toFixed(1)}h desde el último mantenimiento
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {mpSugerido.esManual && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newMPs = { ...mpAsignadoManualmente };
                                delete newMPs[equipo!.ficha];
                                setMpAsignadoManualmente(newMPs);
                                toast({
                                  title: '✅ MP Restaurado',
                                  description: 'Se restauró la sugerencia automática',
                                });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Restaurar Auto
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDialogMPManualOpen(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {mpSugerido.esManual ? 'Cambiar' : 'Asignar Manual'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* MP Sugerido Badge Grande */}
                      <div className={cn(
                        "flex items-center justify-center p-6 rounded-xl border-2",
                        mpSugerido.esManual
                          ? "bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-amber-950/40 border-amber-300 dark:border-amber-700"
                          : "bg-gradient-to-r from-green-50 via-green-100 to-green-50 dark:from-green-950/40 dark:via-green-900/20 dark:to-green-950/40 border-green-300 dark:border-green-700"
                      )}>
                        <div className="text-center">
                          <Badge className={cn(
                            "text-2xl py-2 px-6",
                            mpSugerido.esManual
                              ? "bg-amber-600 hover:bg-amber-700"
                              : "bg-green-600 hover:bg-green-700"
                          )}>
                            {mpSugerido.mp}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-3">
                            {mpSugerido.razon}
                          </p>
                        </div>
                      </div>

                      {/* Información del equipo */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Horas Actuales</p>
                          <p className="text-xl font-bold">{mpSugerido.horasActuales.toFixed(1)}h</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Último Mantenimiento</p>
                          <p className="text-xl font-bold">{mpSugerido.horasUltimoMant.toFixed(1)}h</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Horas Transcurridas</p>
                          <p className="text-xl font-bold text-green-600">{mpSugerido.horasTranscurridas.toFixed(1)}h</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Próximo MP en</p>
                          <p className={cn(
                            "text-xl font-bold",
                            mantenimientoProgramado.horasKmRestante > 0
                              ? "text-orange-600"
                              : "text-red-600"
                          )}>
                            {mantenimientoProgramado.horasKmRestante > 0
                              ? `${mantenimientoProgramado.horasKmRestante.toFixed(1)}h`
                              : `${mantenimientoProgramado.horasKmRestante.toFixed(1)}h`}
                          </p>
                        </div>
                      </div>

                      {/* Último mantenimiento realizado */}
                      {ultimoMantenimientoRealizado && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                                Último Mantenimiento Realizado
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Fecha:</span>{' '}
                                  <span className="font-medium">
                                    {format(new Date(ultimoMantenimientoRealizado.fechaMantenimiento), 'dd MMM yyyy', { locale: es })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Horas:</span>{' '}
                                  <span className="font-medium">
                                    {ultimoMantenimientoRealizado.horasKmAlMomento.toFixed(1)}h
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Observaciones:</span>{' '}
                                  <span className="font-medium">
                                    {ultimoMantenimientoRealizado.observaciones || 'Sin observaciones'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Kits de Mantenimiento */}
                {!planActual && (
                  <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-amber-900 dark:text-amber-100">
                        <Info className="h-5 w-5 text-amber-600" />
                        Sin Plan Asignado
                      </CardTitle>
                      <CardDescription>
                        Este equipo no tiene un plan de mantenimiento asignado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Los equipos que no son Caterpillar o no tienen planes específicos asignados no cuentan con:
                        </p>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>Rutas predictivas de mantenimiento</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>Kits de repuestos asociados</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>Intervalos de mantenimiento predefinidos</span>
                          </li>
                        </ul>
                        <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-muted-foreground">
                            <strong>Sugerencia:</strong> Puedes asignar un plan manualmente desde el módulo de Planes de Mantenimiento
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {planActual && kitsDelPlanActual.length > 0 && (
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-600" />
                        Kits de Mantenimiento del Plan
                        <Badge variant="secondary" className="ml-auto">
                          {kitsDelPlanActual.length} kits
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Kits asociados a los intervalos de este plan
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {kitSugeridoParaMP && mpSugerido && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 dark:from-purple-950/40 dark:via-purple-900/20 dark:to-purple-950/40 rounded-xl border-2 border-purple-300 dark:border-purple-700 mb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-2">
                                  Kit Recomendado para {mpSugerido.mp}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-purple-600">{kitSugeridoParaMP.codigo}</Badge>
                                  <Badge variant="outline">{kitSugeridoParaMP.intervaloMP}</Badge>
                                  <Badge variant="secondary">{kitSugeridoParaMP.intervaloHoras}h</Badge>
                                </div>
                                <p className="text-sm font-medium">{kitSugeridoParaMP.nombre}</p>
                                {kitSugeridoParaMP.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {kitSugeridoParaMP.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerDetalleKit(kitSugeridoParaMP)}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              Ver Detalle
                            </Button>
                          </div>
                        </div>
                      )}

                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                          {kitsDelPlanActual.map((kit) => (
                            <div
                              key={kit.id}
                              className={cn(
                                'p-3 rounded-lg border-2 transition-all',
                                kitSugeridoParaMP?.id === kit.id
                                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/30'
                                  : 'border-border hover:border-purple-200 hover:bg-muted/50'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {kit.codigo}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {kit.intervaloMP}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {kit.intervaloHoras}h
                                    </Badge>
                                    {kitSugeridoParaMP?.id === kit.id && (
                                      <Badge className="text-xs bg-purple-600">Recomendado</Badge>
                                    )}
                                  </div>
                                  <p className="font-semibold text-sm">{kit.nombre}</p>
                                  {kit.descripcion && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {kit.descripcion}
                                    </p>
                                  )}
                                  <div className="flex gap-2 mt-2">
                                    {kit.marca && (
                                      <Badge variant="outline" className="text-xs">
                                        {kit.marca}
                                      </Badge>
                                    )}
                                    {kit.modelo_aplicable && (
                                      <Badge variant="outline" className="text-xs">
                                        {kit.modelo_aplicable}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleVerDetalleKit(kit)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Rutas predictivas */}
                {rutas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Próximas 8 Rutas Predictivas
                        {mpSugerido?.esManual && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            Replanificadas
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {mpSugerido?.esManual
                          ? `Rutas replanificadas automáticamente basadas en ${mpSugerido.mp} asignado manualmente`
                          : 'Generadas automáticamente basadas en el plan actual'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mpSugerido?.esManual && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                          <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            Las rutas han sido recalculadas automáticamente considerando el MP {mpSugerido.mp} asignado manualmente.
                            Los siguientes mantenimientos están planificados en base a esta decisión.
                          </p>
                        </div>
                      )}

                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {rutas.map((ruta, idx) => {
                            // Encontrar el intervalo correspondiente al MP
                            const intervalo = planActual?.intervalos?.find(
                              (int) => int.codigo === ruta.mp || int.nombre.includes(ruta.mp)
                            );

                            // Encontrar kits para este intervalo
                            const kitsDeRuta = intervalo?.kits?.map((k) => k.kit) || [];

                            return (
                              <div
                                key={idx}
                                className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-lg px-3 py-1">
                                      {ruta.mp}
                                    </Badge>
                                    <div>
                                      <p className="font-semibold text-sm">
                                        Ruta #{ruta.orden} • Ciclo {ruta.ciclo}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {ruta.horasObjetivo.toFixed(1)}h objetivo
                                      </p>
                                    </div>
                                  </div>
                                  {idx === 0 && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                                      Próximo
                                    </Badge>
                                  )}
                                </div>

                                {/* Tareas del intervalo */}
                                {intervalo && intervalo.tareas && intervalo.tareas.length > 0 && (
                                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                      <Wrench className="h-3 w-3" />
                                      Tareas Programadas ({intervalo.tareas.length})
                                    </p>
                                    <ul className="space-y-1">
                                      {intervalo.tareas.slice(0, 5).map((tarea, tidx) => (
                                        <li key={tidx} className="text-xs text-muted-foreground flex items-start gap-2">
                                          <CheckCircle2 className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                          <span>{tarea}</span>
                                        </li>
                                      ))}
                                      {intervalo.tareas.length > 5 && (
                                        <li className="text-xs text-muted-foreground italic">
                                          + {intervalo.tareas.length - 5} tareas más...
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {/* Kits asociados */}
                                {kitsDeRuta.length > 0 && (
                                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                                      <Package className="h-3 w-3" />
                                      Kits Requeridos ({kitsDeRuta.length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {kitsDeRuta.map((kit) => (
                                        <Badge key={kit.id} variant="outline" className="text-xs">
                                          {kit.codigo} - {kit.nombre}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {!intervalo && (
                                  <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground text-center">
                                    Intervalo sin configuración de tareas
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>

                      {estadisticas && (
                        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Rutas</p>
                            <p className="text-2xl font-bold">{estadisticas.totalRutas}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ciclos Completos</p>
                            <p className="text-2xl font-bold">{estadisticas.totalCiclos}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Horas Totales</p>
                            <p className="text-2xl font-bold">
                              {estadisticas.horasTotal.toFixed(1)}h
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Botón para guardar rutas */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: '📄 Vista Previa',
                              description: `${rutas.length} rutas generadas para ${equipo?.nombre}. Haz clic en "Guardar Rutas" para confirmar.`,
                            });
                          }}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Vista Previa
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!planActual) {
                              toast({
                                title: '❌ Error',
                                description: 'No hay plan seleccionado',
                                variant: 'destructive',
                              });
                              return;
                            }
                            try {
                              // Usar el hook de rutas predictivas para guardar
                              toast({
                                title: '⏳ Guardando rutas...',
                                description: 'Por favor espera mientras se guardan las planificaciones',
                              });

                              // Llamar a guardarRutas del hook
                              await guardarRutas(rutas, {
                                horasAlerta: 50,
                                esOverride: mpSugerido?.esManual || false,
                              });

                              toast({
                                title: '✅ Rutas guardadas',
                                description: `Se guardaron ${rutas.length} planificaciones para ${equipo?.nombre}`,
                              });
                            } catch (error) {
                              toast({
                                title: '❌ Error',
                                description: 'No se pudieron guardar las rutas',
                                variant: 'destructive',
                              });
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Guardar Rutas ({rutas.length})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialog para guardar override */}
      <Dialog open={dialogOverrideOpen} onOpenChange={setDialogOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Override Manual</DialogTitle>
            <DialogDescription>
              Registra el motivo de la asignación manual de este plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Equipo</Label>
              <p className="text-sm font-medium">{equipo?.nombre}</p>
            </div>
            <div className="space-y-2">
              <Label>Plan seleccionado</Label>
              <p className="text-sm font-medium">{planActual?.nombre}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Input
                id="motivo"
                placeholder="Ej: Requerimientos especiales del cliente"
                value={motivoOverride}
                onChange={(e) => setMotivoOverride(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOverrideOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarOverride} disabled={!motivoOverride}>
              Guardar Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para asignar MP manualmente */}
      <Dialog open={dialogMPManualOpen} onOpenChange={setDialogMPManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Asignar MP Manual
            </DialogTitle>
            <DialogDescription>
              Sobrescribe la sugerencia automática y asigna un MP específico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Equipo</Label>
              <p className="text-sm font-medium">{equipo?.nombre} ({equipo?.ficha})</p>
            </div>

            {mpSugerido && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">MP Sugerido Automático</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-600">{mpSugerido.mp}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Basado en {mpSugerido.horasTranscurridas.toFixed(1)}h transcurridas
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mp-manual">MP a Asignar *</Label>
              <Select value={mpManual} onValueChange={setMpManual}>
                <SelectTrigger id="mp-manual">
                  <SelectValue placeholder="Selecciona el MP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PM1">PM1 - Mantenimiento Regular (250h)</SelectItem>
                  <SelectItem value="PM2">PM2 - Mantenimiento Intermedio (500h)</SelectItem>
                  <SelectItem value="PM3">PM3 - Mantenimiento Mayor (1000h)</SelectItem>
                  <SelectItem value="PM4">PM4 - Mantenimiento Extenso (2000h)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones-mp">Observaciones</Label>
              <Textarea
                id="observaciones-mp"
                placeholder="Ej: Cliente solicitó adelantar el mantenimiento..."
                value={observacionesMPManual}
                onChange={(e) => setObservacionesMPManual(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Esta asignación manual quedará registrada en el sistema para auditoría.
                El sistema volverá a sugerir automáticamente después del próximo mantenimiento.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogMPManualOpen(false);
              setMpManual('');
              setObservacionesMPManual('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAsignarMPManual} disabled={!mpManual}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Asignar MP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalle del kit */}
      <Dialog open={dialogKitDetalleOpen} onOpenChange={setDialogKitDetalleOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Detalle del Kit de Mantenimiento
            </DialogTitle>
            <DialogDescription>
              Componentes y piezas incluidas en este kit
            </DialogDescription>
          </DialogHeader>

          {kitSeleccionado && (
            <div className="space-y-4 py-4">
              {/* Información del kit */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-600">{kitSeleccionado.codigo}</Badge>
                      <h3 className="font-semibold text-lg">{kitSeleccionado.nombre}</h3>
                    </div>
                    {kitSeleccionado.descripcion && (
                      <p className="text-sm text-muted-foreground">
                        {kitSeleccionado.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Piezas del kit */}
              <div>
                <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                  <Wrench className="h-4 w-4" />
                  Piezas del Kit ({kitSeleccionado.piezas?.length || 0})
                </Label>

                {kitSeleccionado.piezas && kitSeleccionado.piezas.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {kitSeleccionado.piezas.map((pieza, idx) => (
                        <div
                          key={pieza.id}
                          className="p-3 rounded-lg border-2 border-border hover:border-purple-200 hover:bg-muted/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  #{idx + 1}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {pieza.tipo}
                                </Badge>
                                <Badge className="bg-blue-600 text-xs">
                                  x{pieza.cantidad} {pieza.unidad || 'unid'}
                                </Badge>
                              </div>

                              <div className="space-y-1">
                                <p className="font-semibold text-sm">
                                  {pieza.descripcion}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  P/N: {pieza.numero_parte}
                                </p>
                                {pieza.notas && (
                                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                                    <p className="text-xs text-amber-800 dark:text-amber-200">
                                      <Info className="h-3 w-3 inline mr-1" />
                                      {pieza.notas}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No hay piezas registradas en este kit</p>
                  </div>
                )}
              </div>

              {/* Resumen */}
              {kitSeleccionado.piezas && kitSeleccionado.piezas.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Piezas</p>
                      <p className="text-2xl font-bold">{kitSeleccionado.piezas.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cantidad Total</p>
                      <p className="text-2xl font-bold">
                        {kitSeleccionado.piezas.reduce((sum, p) => sum + p.cantidad, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tipos Únicos</p>
                      <p className="text-2xl font-bold">
                        {new Set(kitSeleccionado.piezas.map(p => p.tipo)).size}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogKitDetalleOpen(false);
              setKitSeleccionado(null);
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
