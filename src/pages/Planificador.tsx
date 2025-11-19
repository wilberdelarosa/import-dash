import { useState, useMemo, useEffect } from 'react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { usePlanes } from '@/hooks/usePlanes';
import { useKits } from '@/hooks/useKits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Route, 
  Calendar, 
  CheckCircle2, 
  Package, 
  Wrench,
  Edit,
  Save,
  X,
  AlertCircle,
  ListChecks,
  Sparkles,
  Settings,
  ClipboardList,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { supabase } from '@/integrations/supabase/client';
import type { PlanConIntervalos } from '@/types/maintenance-plans';

interface PlanificacionEquipo {
  id?: number;
  fichaEquipo: string;
  nombreEquipo: string;
  categoria: string;
  marca: string;
  modelo: string;
  lecturasActuales: number;
  proximoMP: string;
  proximasHoras: number;
  horasRestantes: number;
  planId: number | null;
  intervaloId: number | null;
  kitId: number | null;
  planNombre: string | null;
  kitNombre: string | null;
  estado: 'pendiente' | 'programado' | 'en_progreso' | 'completado';
  fechaProgramada: string | null;
  created_at?: string;
}

interface PredictedMaintenance {
  codigo: string;
  nombre: string;
  horasIntervalo: number;
  intervaloId: number;
  kitsSugeridos: Array<{
    id: number;
    codigo: string;
    nombre: string;
    cantidadPiezas: number;
  }>;
}

export function Planificador() {
  const { data, loading } = useSupabaseDataContext();
  const { planes } = usePlanes();
  const { kits } = useKits();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignarPlanDialogOpen, setAsignarPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanificacionEquipo | null>(null);
  const [planificacionesGuardadas, setPlanificacionesGuardadas] = useState<PlanificacionEquipo[]>([]);
  const [loadingPlanificaciones, setLoadingPlanificaciones] = useState(true);
  
  // Form states
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedIntervaloId, setSelectedIntervaloId] = useState<number | null>(null);
  const [selectedKitId, setSelectedKitId] = useState<number | null>(null);
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [equipoParaAsignar, setEquipoParaAsignar] = useState<PlanificacionEquipo | null>(null);

  // Cargar planificaciones guardadas desde Supabase
  useEffect(() => {
    loadPlanificaciones();
  }, []);

  const loadPlanificaciones = async () => {
    try {
      setLoadingPlanificaciones(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planificaciones, error } = await (supabase as any)
        .from('planificaciones_mantenimiento')
        .select('*')
        .order('fecha_programada', { ascending: true });

      if (error) throw error;
      setPlanificacionesGuardadas(planificaciones || []);
    } catch (error) {
      console.error('Error loading planificaciones:', error);
    } finally {
      setLoadingPlanificaciones(false);
    }
  };

  // Función para predecir el próximo mantenimiento basado en historial y horas actuales
  const predictNextMaintenance = (equipo: { horasActuales?: number }, planAsociado: PlanConIntervalos | null): PredictedMaintenance | null => {
    if (!planAsociado || planAsociado.intervalos.length === 0) return null;

    const horas = equipo.horasActuales || 0;
    const intervalosOrdenados = [...planAsociado.intervalos].sort((a, b) => a.horas_intervalo - b.horas_intervalo);

    // Buscar el próximo intervalo que le toca según sus horas
    let proximoIntervalo = intervalosOrdenados[0];
    
    for (const intervalo of intervalosOrdenados) {
      const multiplo = Math.floor(horas / intervalo.horas_intervalo);
      const proximoMantenimiento = (multiplo + 1) * intervalo.horas_intervalo;
      
      if (horas < proximoMantenimiento) {
        proximoIntervalo = intervalo;
        break;
      }
    }

    // Si ya pasó todos los intervalos, sugerir el más alto
    if (horas >= intervalosOrdenados[intervalosOrdenados.length - 1].horas_intervalo) {
      proximoIntervalo = intervalosOrdenados[intervalosOrdenados.length - 1];
    }

    return {
      codigo: proximoIntervalo.codigo,
      nombre: proximoIntervalo.nombre,
      horasIntervalo: proximoIntervalo.horas_intervalo,
      intervaloId: proximoIntervalo.id,
      kitsSugeridos: proximoIntervalo.kits.map(k => ({
        id: k.kit.id,
        codigo: k.kit.codigo,
        nombre: k.kit.nombre,
        cantidadPiezas: 0, // Las piezas se cargan por separado
      })),
    };
  };

  // Generar planificaciones automáticas basadas en equipos
  const planificacionesEquipos = useMemo<PlanificacionEquipo[]>(() => {
    return data.equipos
      .filter(e => e.activo)
      .map(equipo => {
        // Buscar si ya tiene una planificación guardada
        const planificacionGuardada = planificacionesGuardadas.find(p => p.fichaEquipo === equipo.ficha);
        
        if (planificacionGuardada) {
          return planificacionGuardada;
        }

        // Buscar plan compatible por marca/modelo
        const planCompatible = planes.find(p => 
          p.activo && 
          p.marca === equipo.marca &&
          (!p.modelo || p.modelo === equipo.modelo)
        );

        const horas = 0; // Las horas se obtienen de mantenimientos_programados
        const prediccion = predictNextMaintenance({ horasActuales: horas }, planCompatible);

        return {
          fichaEquipo: equipo.ficha,
          nombreEquipo: equipo.nombre,
          categoria: equipo.categoria,
          marca: equipo.marca || '',
          modelo: equipo.modelo || '',
          lecturasActuales: horas,
          proximoMP: prediccion?.codigo || 'N/A',
          proximasHoras: prediccion?.horasIntervalo || 0,
          horasRestantes: prediccion ? prediccion.horasIntervalo - (horas % prediccion.horasIntervalo) : 0,
          planId: planCompatible?.id || null,
          intervaloId: prediccion?.intervaloId || null,
          kitId: prediccion?.kitsSugeridos[0]?.id || null,
          planNombre: planCompatible?.nombre || null,
          kitNombre: prediccion?.kitsSugeridos[0]?.nombre || null,
          estado: 'pendiente' as const,
          fechaProgramada: null,
          observaciones: '',
        };
      })
      .sort((a, b) => a.horasRestantes - b.horasRestantes);
  }, [data.equipos, planes, planificacionesGuardadas]);

  const handleAbrirAsignacion = (plan: PlanificacionEquipo) => {
    setEquipoParaAsignar(plan);
    setSelectedPlanId(plan.planId);
    setSelectedIntervaloId(plan.intervaloId);
    setSelectedKitId(plan.kitId);
    setFechaProgramada(plan.fechaProgramada || '');
    setAsignarPlanDialogOpen(true);
  };

  const handleAbrirEdicion = (plan: PlanificacionEquipo) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleAsignarPlan = async () => {
    if (!equipoParaAsignar || !selectedPlanId || !selectedIntervaloId) {
      toast({
        title: 'Datos incompletos',
        description: 'Selecciona un plan e intervalo para continuar',
        variant: 'destructive',
      });
      return;
    }

    try {
      const planSeleccionado = planes.find(p => p.id === selectedPlanId);
      const intervaloSeleccionado = planSeleccionado?.intervalos.find(i => i.id === selectedIntervaloId);
      const kitSeleccionado = kits.find(k => k.id === selectedKitId);

      const planificacionData = {
        fichaEquipo: equipoParaAsignar.fichaEquipo,
        nombreEquipo: equipoParaAsignar.nombreEquipo,
        categoria: equipoParaAsignar.categoria,
        marca: equipoParaAsignar.marca,
        modelo: equipoParaAsignar.modelo,
        lecturasActuales: equipoParaAsignar.lecturasActuales,
        proximoMP: intervaloSeleccionado?.codigo || '',
        proximasHoras: intervaloSeleccionado?.horas_intervalo || 0,
        horasRestantes: equipoParaAsignar.horasRestantes,
        planId: selectedPlanId,
        intervaloId: selectedIntervaloId,
        kitId: selectedKitId,
        planNombre: planSeleccionado?.nombre || null,
        kitNombre: kitSeleccionado?.nombre || null,
        estado: 'programado' as const,
        fechaProgramada: fechaProgramada || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('planificaciones_mantenimiento')
        .insert([planificacionData])
        .select()
        .single();

      if (error) throw error;

      // Registrar en historial
      await supabase.from('historial_eventos').insert({
        tipo_evento: 'planificacion_creada',
        modulo: 'mantenimientos',
        descripcion: `Se asignó el intervalo ${intervaloSeleccionado?.codigo} al equipo ${equipoParaAsignar.nombreEquipo}`,
        ficha_equipo: equipoParaAsignar.fichaEquipo,
        nombre_equipo: equipoParaAsignar.nombreEquipo,
        usuario_responsable: 'Sistema',
        nivel_importancia: 'info',
        datos_despues: JSON.parse(JSON.stringify(data)),
        metadata: JSON.parse(JSON.stringify({
          planId: selectedPlanId,
          intervaloId: selectedIntervaloId,
          kitId: selectedKitId,
          fechaProgramada: fechaProgramada,
        })),
      });

      toast({
        title: 'Plan asignado',
        description: `Se asignó ${intervaloSeleccionado?.codigo} a ${equipoParaAsignar.nombreEquipo}`,
      });

      await loadPlanificaciones();
      setAsignarPlanDialogOpen(false);
      resetAsignacionForm();
    } catch (error: unknown) {
      console.error('Error asignando plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo asignar el plan al equipo',
        variant: 'destructive',
      });
    }
  };

  const handleGuardarPlanificacion = async () => {
    if (!editingPlan || !editingPlan.id) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('planificaciones_mantenimiento')
        .update({ observaciones })
        .eq('id', editingPlan.id);

      if (error) throw error;

      // Registrar en historial
      await supabase.from('historial_eventos').insert({
        tipo_evento: 'planificacion_actualizada',
        modulo: 'mantenimientos',
        descripcion: `Se actualizaron las observaciones de la planificación de ${editingPlan.nombreEquipo}`,
        ficha_equipo: editingPlan.fichaEquipo,
        nombre_equipo: editingPlan.nombreEquipo,
        usuario_responsable: 'Sistema',
        nivel_importancia: 'info',
        datos_antes: JSON.parse(JSON.stringify({ planificacionId: editingPlan.id })),
        datos_despues: JSON.parse(JSON.stringify({ observaciones })),
        metadata: JSON.parse(JSON.stringify({ planificacionId: editingPlan.id })),
      });

      toast({
        title: 'Planificación actualizada',
        description: `Se actualizaron las observaciones para ${editingPlan.nombreEquipo}`,
      });

      await loadPlanificaciones();
      setDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      console.error('Error updating planificacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la planificación',
        variant: 'destructive',
      });
    }
  };

  const handleFinalizarPlanificacion = async (plan: PlanificacionEquipo) => {
    if (!plan.id) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('planificaciones_mantenimiento')
        .update({ activo: false })
        .eq('id', plan.id);

      if (error) throw error;

      // Registrar en historial
      await supabase.from('historial_eventos').insert({
        tipo_evento: 'planificacion_completada',
        modulo: 'mantenimientos',
        descripcion: `Se completó la planificación de mantenimiento para ${plan.nombreEquipo}`,
        ficha_equipo: plan.fichaEquipo,
        nombre_equipo: plan.nombreEquipo,
        usuario_responsable: 'Sistema',
        nivel_importancia: 'info',
        datos_antes: JSON.parse(JSON.stringify({ estado: plan.estado })),
        datos_despues: JSON.parse(JSON.stringify({ estado: 'completado' })),
        metadata: JSON.parse(JSON.stringify({ planificacionId: plan.id, intervaloId: plan.intervaloId })),
      });

      toast({
        title: 'Mantenimiento completado',
        description: `Se marcó como completado el mantenimiento de ${plan.nombreEquipo}`,
      });

      await loadPlanificaciones();
    } catch (error: unknown) {
      console.error('Error finalizando planificacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo finalizar la planificación',
        variant: 'destructive',
      });
    }
  };

  const handleEliminarPlanificacion = async (plan: PlanificacionEquipo) => {
    if (!plan.id) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('planificaciones_mantenimiento')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;

      // Registrar en historial
      await supabase.from('historial_eventos').insert({
        tipo_evento: 'planificacion_eliminada',
        modulo: 'mantenimientos',
        descripcion: `Se eliminó la planificación de mantenimiento de ${plan.nombreEquipo}`,
        ficha_equipo: plan.fichaEquipo,
        nombre_equipo: plan.nombreEquipo,
        usuario_responsable: 'Sistema',
        nivel_importancia: 'warning',
        datos_antes: JSON.parse(JSON.stringify({
          planId: plan.planId,
          intervaloId: plan.intervaloId,
          estado: plan.estado,
        })),
        metadata: JSON.parse(JSON.stringify({ planificacionId: plan.id, intervaloId: plan.intervaloId })),
      });

      toast({
        title: 'Planificación eliminada',
        description: `Se eliminó la planificación de ${plan.nombreEquipo}`,
      });

      await loadPlanificaciones();
    } catch (error: unknown) {
      console.error('Error eliminando planificacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la planificación',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setObservaciones('');
  };

  const resetAsignacionForm = () => {
    setEquipoParaAsignar(null);
    setSelectedPlanId(null);
    setSelectedIntervaloId(null);
    setSelectedKitId(null);
    setFechaProgramada('');
  };

  // Intervalos disponibles según el plan seleccionado
  const intervalosDisponibles = useMemo(() => {
    if (!selectedPlanId) return [];
    const plan = planes.find(p => p.id === selectedPlanId);
    return plan?.intervalos || [];
  }, [selectedPlanId, planes]);

  // Kits sugeridos según el intervalo seleccionado
  const kitsSugeridos = useMemo(() => {
    if (!selectedIntervaloId) return [];
    const intervalo = intervalosDisponibles.find(i => i.id === selectedIntervaloId);
    return intervalo?.kits.map(k => k.kit) || [];
  }, [selectedIntervaloId, intervalosDisponibles]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = planificacionesEquipos.length;
    const criticos = planificacionesEquipos.filter(p => p.horasRestantes < 50).length;
    const programados = planificacionesEquipos.filter(p => p.estado === 'programado').length;
    const completados = planificacionesEquipos.filter(p => p.estado === 'completado').length;
    
    return { total, criticos, programados, completados };
  }, [planificacionesEquipos]);

  if (loading || loadingPlanificaciones) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Cargando planificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">En sistema</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.criticos}</div>
            <p className="text-xs text-muted-foreground mt-1">Menos de 50 h/km</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/40 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Programados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.programados}</div>
            <p className="text-xs text-muted-foreground mt-1">Con plan asignado</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/40 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completados}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="equipos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equipos" className="gap-2">
            <Route className="h-4 w-4" />
            Equipos Activos
          </TabsTrigger>
          <TabsTrigger value="asignaciones" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Planificaciones Asignadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipos" className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Planificaciones Inteligentes
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Predicción automática basada en ciclo de cada equipo y planes configurados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Equipo</TableHead>
                      <TableHead className="font-bold">Marca/Modelo</TableHead>
                      <TableHead className="font-bold text-right">Lectura Actual</TableHead>
                      <TableHead className="font-bold text-center">Próximo MP</TableHead>
                      <TableHead className="font-bold text-right">Restante</TableHead>
                      <TableHead className="font-bold text-center">Plan Sugerido</TableHead>
                      <TableHead className="font-bold text-center">Kit Sugerido</TableHead>
                      <TableHead className="font-bold text-center">Estado</TableHead>
                      <TableHead className="font-bold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planificacionesEquipos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No hay equipos para planificar
                        </TableCell>
                      </TableRow>
                    ) : (
                      planificacionesEquipos.map((plan) => (
                        <TableRow key={plan.fichaEquipo} className="hover:bg-muted/30">
                          <TableCell>
                            <div>
                              <p className="font-medium">{plan.nombreEquipo}</p>
                              <p className="text-xs text-muted-foreground">Ficha: {plan.fichaEquipo}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{plan.marca}</p>
                              {plan.modelo && <p className="text-xs text-muted-foreground">{plan.modelo}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{plan.lecturasActuales} h/km</TableCell>
                          <TableCell className="text-center">
                            {plan.proximoMP !== 'N/A' ? (
                              <Badge className="bg-primary/10 text-primary">{plan.proximoMP}</Badge>
                            ) : (
                              <Badge variant="outline">Sin plan</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={getRemainingVariant(plan.horasRestantes)}>
                              {formatRemainingLabel(plan.horasRestantes)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {plan.planNombre ? (
                              <Badge variant="secondary" className="gap-1 max-w-[150px] truncate">
                                <ClipboardList className="h-3 w-3" />
                                {plan.planNombre}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin plan</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {plan.kitNombre ? (
                              <Badge variant="secondary" className="gap-1 max-w-[150px] truncate">
                                <Package className="h-3 w-3" />
                                {plan.kitNombre}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin kit</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {plan.estado === 'completado' ? (
                              <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Completado
                              </Badge>
                            ) : plan.estado === 'programado' ? (
                              <Badge className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                <Calendar className="h-3 w-3" />
                                Programado
                              </Badge>
                            ) : plan.estado === 'en_progreso' ? (
                              <Badge className="gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20">
                                <Wrench className="h-3 w-3" />
                                En progreso
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {plan.estado === 'pendiente' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleAbrirAsignacion(plan)}
                                  className="h-8 gap-1"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                  Asignar
                                </Button>
                              )}
                              {plan.id && plan.estado !== 'completado' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleAbrirEdicion(plan)}
                                    className="h-8"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleFinalizarPlanificacion(plan)}
                                    className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Finalizar
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asignaciones" className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Listado de Planificaciones Asignadas
              </CardTitle>
              <CardDescription>
                Todas las planificaciones con plan y kit asignado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Equipo</TableHead>
                      <TableHead className="font-bold">Plan Asignado</TableHead>
                      <TableHead className="font-bold">Intervalo PM</TableHead>
                      <TableHead className="font-bold">Kit Asignado</TableHead>
                      <TableHead className="font-bold">Fecha Programada</TableHead>
                      <TableHead className="font-bold text-center">Estado</TableHead>
                      <TableHead className="font-bold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planificacionesGuardadas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay planificaciones asignadas aún
                        </TableCell>
                      </TableRow>
                    ) : (
                      planificacionesGuardadas.map((plan) => (
                        <TableRow key={plan.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div>
                              <p className="font-medium">{plan.nombreEquipo}</p>
                              <p className="text-xs text-muted-foreground">{plan.marca} {plan.modelo}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{plan.planNombre || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-primary/10 text-primary">{plan.proximoMP}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <Package className="h-3 w-3" />
                              {plan.kitNombre || 'Sin kit'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {plan.fechaProgramada ? (
                              <span className="text-sm">{new Date(plan.fechaProgramada).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No programada</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {plan.estado === 'completado' ? (
                              <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Completado
                              </Badge>
                            ) : plan.estado === 'programado' ? (
                              <Badge className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                <Calendar className="h-3 w-3" />
                                Programado
                              </Badge>
                            ) : (
                              <Badge className="gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20">
                                <Wrench className="h-3 w-3" />
                                En progreso
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAbrirEdicion(plan)}
                                className="h-8"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              {plan.estado !== 'completado' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleFinalizarPlanificacion(plan)}
                                  className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEliminarPlanificacion(plan)}
                                className="h-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de asignación de plan */}
      <Dialog open={asignarPlanDialogOpen} onOpenChange={setAsignarPlanDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Asignar Plan y Kit
            </DialogTitle>
            <DialogDescription>
              {equipoParaAsignar?.nombreEquipo} ({equipoParaAsignar?.fichaEquipo})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Lectura Actual</Label>
                <Input value={`${equipoParaAsignar?.lecturasActuales || 0} h/km`} disabled />
              </div>

              <div className="space-y-2">
                <Label>Horas Restantes (Estimado)</Label>
                <Input value={`${equipoParaAsignar?.horasRestantes || 0} h/km`} disabled className="font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Selecciona Plan de Mantenimiento *</Label>
              <Select value={selectedPlanId?.toString()} onValueChange={(v) => setSelectedPlanId(Number(v))}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Elegir plan..." />
                </SelectTrigger>
                <SelectContent>
                  {planes
                    .filter(p => p.activo)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.nombre} - {plan.marca} {plan.modelo || ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {intervalosDisponibles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="intervalo">Selecciona Intervalo PM *</Label>
                <Select 
                  value={selectedIntervaloId?.toString()} 
                  onValueChange={(v) => setSelectedIntervaloId(Number(v))}
                  disabled={!selectedPlanId}
                >
                  <SelectTrigger id="intervalo">
                    <SelectValue placeholder="Elegir intervalo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalosDisponibles.map((intervalo) => (
                      <SelectItem key={intervalo.id} value={intervalo.id.toString()}>
                        {intervalo.codigo} - {intervalo.nombre} ({intervalo.horas_intervalo}h)
                        {intervalo.kits.length > 0 && ` - ${intervalo.kits.length} kits disponibles`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {kitsSugeridos.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="kit">Selecciona Kit (Opcional)</Label>
                <Select 
                  value={selectedKitId?.toString() || ''} 
                  onValueChange={(v) => setSelectedKitId(v ? Number(v) : null)}
                  disabled={!selectedIntervaloId}
                >
                  <SelectTrigger id="kit">
                    <SelectValue placeholder="Elegir kit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kitsSugeridos.map((kit) => (
                      <SelectItem key={kit.id} value={kit.id.toString()}>
                        {kit.codigo} - {kit.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Kits sugeridos según el intervalo seleccionado
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fechaProgramada">Fecha Programada</Label>
              <Input
                id="fechaProgramada"
                type="date"
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre esta planificación..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAsignarPlanDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleAsignarPlan}>
              <Save className="mr-2 h-4 w-4" />
              Asignar Planificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Planificación</DialogTitle>
            <DialogDescription>
              {editingPlan?.nombreEquipo} ({editingPlan?.fichaEquipo})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Plan Asignado</Label>
                <Input value={editingPlan?.planNombre || 'N/A'} disabled />
              </div>

              <div className="space-y-2">
                <Label>Intervalo PM</Label>
                <Input value={editingPlan?.proximoMP || 'N/A'} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kit Asignado</Label>
              <Input value={editingPlan?.kitNombre || 'Sin kit asignado'} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones_edit">Observaciones</Label>
              <Textarea
                id="observaciones_edit"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre esta planificación..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleGuardarPlanificacion}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
