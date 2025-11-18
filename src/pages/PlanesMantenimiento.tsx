import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { usePlanes } from '@/hooks/usePlanes';
import { useKits } from '@/hooks/useKits';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, ClipboardList, Package, Clock, Sparkles, X, ChevronRight, Factory, Layers, Search, BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PlanMantenimiento, PlanIntervalo, IntervaloConKits } from '@/types/maintenance-plans';
import { getStaticModelAliases, getStaticCaterpillarData } from '@/data/caterpillarMaintenance';

export default function PlanesMantenimiento() {
  const { toast } = useToast();
  const {
    planes,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    createIntervalo,
    updateIntervalo,
    deleteIntervalo,
    linkKitToInterval,
    unlinkKitFromInterval,
  } = usePlanes();
  const { kits, createKit, createPieza } = useKits();
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [openIntervaloDialog, setOpenIntervaloDialog] = useState(false);
  const [openKitDialog, setOpenKitDialog] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanMantenimiento | null>(null);
  const [editingIntervalo, setEditingIntervalo] = useState<PlanIntervalo | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [kitDialogContext, setKitDialogContext] = useState<{
    planMarca: string;
    planModelo?: string | null;
    intervalo: IntervaloConKits;
  } | null>(null);
  const [selectedKitId, setSelectedKitId] = useState('');
  const [selectedCatModel, setSelectedCatModel] = useState('');
  const [isImportingCatPlan, setIsImportingCatPlan] = useState(false);
  const catModelOptions = useMemo(() => getStaticModelAliases(), []);
  
  // Estados para control de vista: 'index' muestra resumen, 'details' muestra planes
  const [view, setView] = useState<'index' | 'details'>('index');
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  
  // 🎯 NUEVOS ESTADOS PARA MEJORAS
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMarca, setFiltroMarca] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const compatibleKits = useMemo(() => {
    const base = kits.filter((kit) => kit.activo);
    if (!kitDialogContext) {
      return base;
    }

    return base.filter((kit) => {
      if (kitDialogContext.planMarca && kit.marca && kit.marca !== kitDialogContext.planMarca) {
        return false;
      }

      if (
        kitDialogContext.planModelo &&
        kit.modelo_aplicable &&
        kit.modelo_aplicable !== kitDialogContext.planModelo
      ) {
        return false;
      }

      return true;
    });
  }, [kits, kitDialogContext]);

  // Agrupar planes por marca
  const planesPorMarca = useMemo(() => {
    const grupos: Record<string, typeof planes> = {};
    planes.forEach(plan => {
      if (!grupos[plan.marca]) {
        grupos[plan.marca] = [];
      }
      grupos[plan.marca].push(plan);
    });
    return grupos;
  }, [planes]);

  // Agrupar kits por marca
  const kitsPorMarca = useMemo(() => {
    const grupos: Record<string, typeof kits> = {};
    kits.forEach(kit => {
      const marca = kit.marca || 'Sin marca';
      if (!grupos[marca]) {
        grupos[marca] = [];
      }
      grupos[marca].push(kit);
    });
    return grupos;
  }, [kits]);

  // 🎯 NUEVO: Planes filtrados por búsqueda y filtros
  const planesFiltrados = useMemo(() => {
    let resultado = planes;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(plan =>
        plan.nombre.toLowerCase().includes(term) ||
        plan.marca.toLowerCase().includes(term) ||
        plan.modelo?.toLowerCase().includes(term) ||
        plan.categoria.toLowerCase().includes(term)
      );
    }

    // Filtrar por marca
    if (filtroMarca !== 'todos') {
      resultado = resultado.filter(plan => plan.marca === filtroMarca);
    }

    // Filtrar por categoría
    if (filtroCategoria !== 'todos') {
      resultado = resultado.filter(plan => plan.categoria === filtroCategoria);
    }

    // Filtrar por estado activo
    if (!mostrarInactivos) {
      resultado = resultado.filter(plan => plan.activo);
    }

    return resultado;
  }, [planes, searchTerm, filtroMarca, filtroCategoria, mostrarInactivos]);

  // 🎯 NUEVO: Agrupar planes filtrados por marca
  const planesPorMarcaFiltrados = useMemo(() => {
    const grupos: Record<string, typeof planes> = {};
    planesFiltrados.forEach(plan => {
      if (!grupos[plan.marca]) {
        grupos[plan.marca] = [];
      }
      grupos[plan.marca].push(plan);
    });
    return grupos;
  }, [planesFiltrados]);

  // 🎯 NUEVO: Obtener marcas únicas
  const marcasUnicas = useMemo(() => {
    const marcas = new Set(planes.map(p => p.marca));
    return Array.from(marcas).sort();
  }, [planes]);

  // 🎯 NUEVO: Obtener categorías únicas
  const categoriasUnicas = useMemo(() => {
    const categorias = new Set(planes.map(p => p.categoria));
    return Array.from(categorias).sort();
  }, [planes]);

  // 🎯 NUEVO: Estadísticas rápidas
  const estadisticas = useMemo(() => {
    return {
      total: planes.length,
      activos: planes.filter(p => p.activo).length,
      inactivos: planes.filter(p => !p.activo).length,
      porMarca: Object.entries(planesPorMarca).map(([marca, ps]) => ({
        marca,
        cantidad: ps.length
      })).sort((a, b) => b.cantidad - a.cantidad),
    };
  }, [planes, planesPorMarca]);

  const [planForm, setPlanForm] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    categoria: '',
    descripcion: '',
    activo: true,
  });

  const [intervaloForm, setIntervaloForm] = useState({
    codigo: '',
    nombre: '',
    horas_intervalo: '',
    descripcion: '',
    tareas: '',
    orden: '',
  });

  const handleCreatePlan = async () => {
    if (!planForm.nombre || !planForm.marca || !planForm.categoria) return;
    
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, planForm);
      } else {
        await createPlan(planForm);
      }
      setOpenPlanDialog(false);
      resetPlanForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateIntervalo = async () => {
    if (!intervaloForm.codigo || !intervaloForm.nombre || !intervaloForm.horas_intervalo || !selectedPlanId) return;
    
    try {
      const tareasArray = intervaloForm.tareas.split('\n').filter(t => t.trim());
      const intervaloData = {
        plan_id: selectedPlanId,
        codigo: intervaloForm.codigo,
        nombre: intervaloForm.nombre,
        horas_intervalo: parseInt(intervaloForm.horas_intervalo),
        descripcion: intervaloForm.descripcion || null,
        tareas: tareasArray,
        orden: parseInt(intervaloForm.orden) || 0,
      };

      if (editingIntervalo) {
        await updateIntervalo(editingIntervalo.id, intervaloData);
      } else {
        await createIntervalo(intervaloData);
      }
      setOpenIntervaloDialog(false);
      resetIntervaloForm();
    } catch (error) {
      console.error(error);
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      nombre: '',
      marca: '',
      modelo: '',
      categoria: '',
      descripcion: '',
      activo: true,
    });
    setEditingPlan(null);
  };

  const resetIntervaloForm = () => {
    setIntervaloForm({
      codigo: '',
      nombre: '',
      horas_intervalo: '',
      descripcion: '',
      tareas: '',
      orden: '',
    });
    setEditingIntervalo(null);
    setSelectedPlanId(null);
  };

  const handleEditPlan = (plan: PlanMantenimiento) => {
    setEditingPlan(plan);
    setPlanForm({
      nombre: plan.nombre,
      marca: plan.marca,
      modelo: plan.modelo || '',
      categoria: plan.categoria,
      descripcion: plan.descripcion || '',
      activo: plan.activo,
    });
    setOpenPlanDialog(true);
  };

  const handleEditIntervalo = (intervalo: PlanIntervalo) => {
    setEditingIntervalo(intervalo);
    setSelectedPlanId(intervalo.plan_id);
    setIntervaloForm({
      codigo: intervalo.codigo,
      nombre: intervalo.nombre,
      horas_intervalo: intervalo.horas_intervalo.toString(),
      descripcion: intervalo.descripcion || '',
      tareas: intervalo.tareas.join('\n'),
      orden: intervalo.orden.toString(),
    });
    setOpenIntervaloDialog(true);
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm('Eliminar este plan? Se eliminaran todos sus intervalos.')) {
      await deletePlan(id);
    }
  };

  const handleDeleteIntervalo = async (id: number) => {
    if (confirm('Eliminar este intervalo?')) {
      await deleteIntervalo(id);
    }
  };

  const handleOpenKitDialog = (plan: PlanMantenimiento, intervalo: IntervaloConKits) => {
    setKitDialogContext({ planMarca: plan.marca, planModelo: plan.modelo, intervalo });
    setSelectedKitId('');
    setOpenKitDialog(true);
  };

  const handleAssignKit = async () => {
    if (!kitDialogContext || !selectedKitId) return;
    try {
      await linkKitToInterval(kitDialogContext.intervalo.id, Number(selectedKitId));
      setOpenKitDialog(false);
      setKitDialogContext(null);
      setSelectedKitId('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveKit = async (linkId: number) => {
    try {
      await unlinkKitFromInterval(linkId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImportCaterpillarPlan = async () => {
    if (!selectedCatModel) {
      toast({
        title: 'Selecciona un modelo',
        description: 'Elige un modelo Caterpillar antes de importar la plantilla.',
        variant: 'destructive',
      });
      return;
    }

    const existingPlan = planes.find(
      (plan) => (plan.modelo ?? '').toLowerCase() === selectedCatModel.toLowerCase(),
    );
    if (existingPlan) {
      toast({
        title: 'Plan ya registrado',
        description: `Ya existe un plan para ${selectedCatModel}. Eliminalo o editalo antes de importar nuevamente.`,
        variant: 'destructive',
      });
      return;
    }

    const dataset = getStaticCaterpillarData(selectedCatModel);
    if (!dataset) {
      toast({
        title: 'Plantilla no disponible',
        description: 'No se encontro informacion para el modelo seleccionado.',
        variant: 'destructive',
      });
      return;
    }

    setIsImportingCatPlan(true);
    try {
      const planPayload = {
        nombre: `Plan ${dataset.modelo?.modelo ?? selectedCatModel}`,
        marca: 'Caterpillar',
        modelo: dataset.modelo?.modelo ?? selectedCatModel,
        categoria: dataset.modelo?.categoria ?? 'Maquinaria',
        descripcion:
          dataset.modelo?.notas ??
          `Plan automatico basado en intervalos Caterpillar para ${selectedCatModel}`,
        activo: true,
      };
      const newPlan = await createPlan(planPayload);
      if (!newPlan) {
        throw new Error('No se pudo crear el plan');
      }
      const planId = Number(newPlan.id);
      if (Number.isNaN(planId)) {
        throw new Error('El identificador del plan generado no es numerico');
      }

      for (const intervalo of dataset.intervalos) {
        const tareas = dataset.tareasPorIntervalo[intervalo.codigo] ?? [];
        const intervaloRecord = await createIntervalo({
          plan_id: planId,
          codigo: intervalo.codigo,
          nombre: intervalo.nombre,
          horas_intervalo: intervalo.horas_intervalo,
          descripcion: intervalo.descripcion,
          tareas,
          orden: intervalo.horas_intervalo,
        });

        const piezasIntervalo = dataset.piezasPorIntervalo[intervalo.codigo] ?? [];
        if (!intervaloRecord) {
          continue;
        }
        const intervaloId = Number(intervaloRecord.id);
        if (Number.isNaN(intervaloId)) {
          continue;
        }
        if (piezasIntervalo.length === 0) {
          continue;
        }

        const baseModelo = dataset.modelo?.modelo ?? selectedCatModel;
        const kitCodeRaw = `CAT-${baseModelo}-${intervalo.codigo}`.toUpperCase();
        const kitRecord = await createKit({
          nombre: `Kit ${intervalo.codigo} - ${baseModelo}`,
          codigo: kitCodeRaw.replace(/[^A-Z0-9]+/g, '-'),
          descripcion: `Kit Caterpillar ${intervalo.codigo} para ${baseModelo}`,
          marca: 'Caterpillar',
          modelo_aplicable: baseModelo,
          categoria: dataset.modelo?.categoria ?? 'Maquinaria',
          activo: true,
        });
        if (!kitRecord) {
          continue;
        }
        const kitId = Number(kitRecord.id);
        if (Number.isNaN(kitId)) {
          continue;
        }

        for (const pieza of piezasIntervalo) {
          await createPieza({
            kit_id: kitId,
            numero_parte: pieza.pieza.numero_parte,
            descripcion: pieza.pieza.descripcion,
            tipo: pieza.pieza.tipo || 'Repuesto',
            cantidad: Number(pieza.cantidad ?? 0),
            unidad: 'pieza',
            notas: pieza.notas,
          });
        }

        await linkKitToInterval(intervaloId, kitId);
      }

      toast({
        title: 'Plan importado',
        description: `Se genero el plan y kits para ${selectedCatModel}.`,
      });
      setImportDialogOpen(false);
      setSelectedCatModel('');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error al importar',
        description: 'Ocurrio un problema creando el plan y los kits.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingCatPlan(false);
    }
  };

  const openNewIntervaloDialog = (planId: number) => {
    resetIntervaloForm();
    setSelectedPlanId(planId);
    setOpenIntervaloDialog(true);
  };

  if (loading) {
    return (
      <Layout title="Planes de Mantenimiento">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Planes de Mantenimiento">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="w-8 h-8" />
              Planes de Mantenimiento
            </h1>
            <p className="text-muted-foreground mt-1">
              {view === 'index' 
                ? 'Resumen de planes y kits organizados por marca' 
                : selectedMarca 
                  ? `Planes de ${selectedMarca}` 
                  : 'Define planes con intervalos PM para cada marca y modelo'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {view === 'details' && (
              <Button variant="outline" onClick={() => {
                setView('index');
                setSelectedMarca(null);
              }}>
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Volver al índice
              </Button>
            )}
            <Dialog open={openPlanDialog} onOpenChange={(open) => {
              setOpenPlanDialog(open);
              if (!open) resetPlanForm();
            }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Editar Plan' : 'Crear Plan de Mantenimiento'}</DialogTitle>
                <DialogDescription>Define un plan reutilizable para equipos</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre del Plan *</Label>
                    <Input
                      id="nombre"
                      value={planForm.nombre}
                      onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })}
                      placeholder="Plan CAT 320 Standard"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                      id="marca"
                      value={planForm.marca}
                      onChange={(e) => setPlanForm({ ...planForm, marca: e.target.value })}
                      placeholder="Caterpillar"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={planForm.modelo}
                      onChange={(e) => setPlanForm({ ...planForm, modelo: e.target.value })}
                      placeholder="320 GC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Input
                      id="categoria"
                      value={planForm.categoria}
                      onChange={(e) => setPlanForm({ ...planForm, categoria: e.target.value })}
                      placeholder="Excavadora"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripcion</Label>
                  <Textarea
                    id="descripcion"
                    value={planForm.descripcion}
                    onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })}
                    placeholder="Descripcion del plan..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planForm.activo}
                    onCheckedChange={(checked) => setPlanForm({ ...planForm, activo: checked })}
                  />
                  <Label>Plan activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenPlanDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreatePlan}>
                  {editingPlan ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            <Button variant="outline" className="gap-2" onClick={() => setImportDialogOpen(true)}>
              <Sparkles className="w-4 h-4" />
              Plantilla Caterpillar
            </Button>
          </div>
        </div>

        {planes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-4">No hay planes de mantenimiento</p>
              <Button onClick={() => setOpenPlanDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Plan
              </Button>
            </CardContent>
          </Card>
        ) : view === 'index' ? (
          // Vista de Índice/Resumen
          <div className="grid gap-6">
            {/* 🎯 PANEL DE FILTROS Y BÚSQUEDA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Búsqueda y Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Búsqueda */}
                  <div className="lg:col-span-2">
                    <Label htmlFor="search">Buscar planes</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        type="search"
                        placeholder="Buscar por nombre, marca, modelo..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filtro por Marca */}
                  <div>
                    <Label htmlFor="filtro-marca">Marca</Label>
                    <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                      <SelectTrigger id="filtro-marca">
                        <SelectValue placeholder="Todas las marcas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las marcas</SelectItem>
                        {marcasUnicas.map(marca => (
                          <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Categoría */}
                  <div>
                    <Label htmlFor="filtro-categoria">Categoría</Label>
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger id="filtro-categoria">
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las categorías</SelectItem>
                        {categoriasUnicas.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Toggle mostrar inactivos */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Switch
                    id="mostrar-inactivos"
                    checked={mostrarInactivos}
                    onCheckedChange={setMostrarInactivos}
                  />
                  <Label htmlFor="mostrar-inactivos" className="cursor-pointer">
                    Mostrar planes inactivos
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* 🎯 ESTADÍSTICAS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Total Planes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {planesFiltrados.length !== estadisticas.total && `${planesFiltrados.length} filtrados`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((estadisticas.activos / estadisticas.total) * 100).toFixed(0)}% del total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <X className="w-4 h-4 text-gray-500" />
                    Inactivos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{estadisticas.inactivos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((estadisticas.inactivos / estadisticas.total) * 100).toFixed(0)}% del total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Factory className="w-4 h-4 text-purple-500" />
                    Marcas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{marcasUnicas.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {categoriasUnicas.length} categorías
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-6 h-6" />
                  Resumen de Planes por Marca
                </CardTitle>
                <CardDescription>
                  Haz clic en una marca para ver sus planes detallados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(planesPorMarcaFiltrados).map(([marca, planesGrupo]) => {
                    const totalIntervalos = planesGrupo.reduce((sum, p) => sum + p.intervalos.length, 0);
                    const totalKits = planesGrupo.reduce((sum, p) => 
                      sum + p.intervalos.reduce((s, i) => s + i.kits.length, 0), 0
                    );
                    
                    return (
                      <Card 
                        key={marca}
                        className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50"
                        onClick={() => {
                          setSelectedMarca(marca);
                          setView('details');
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Factory className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
                              {marca}
                            </CardTitle>
                            <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Planes:</span>
                              <Badge variant="secondary" className="group-hover:bg-primary/20">{planesGrupo.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Intervalos PM:</span>
                              <Badge variant="outline" className="group-hover:border-primary">{totalIntervalos}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Kits asociados:</span>
                              <Badge variant="outline" className="group-hover:border-primary">{totalKits}</Badge>
                            </div>
                            <div className="pt-2 border-t mt-3">
                              <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                Modelos: {[...new Set(planesGrupo.map(p => p.modelo).filter(Boolean))].join(', ') || 'Varios'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Resumen de Kits por Marca
                </CardTitle>
                <CardDescription>
                  Visualización rápida de kits disponibles organizados por marca
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(kitsPorMarca).map(([marca, kitsGrupo]) => {
                    const kitsActivos = kitsGrupo.filter(k => k.activo).length;
                    
                    return (
                      <Card key={marca} className="group transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Package className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
                            {marca}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Total kits:</span>
                              <Badge variant="secondary" className="group-hover:bg-primary/20">{kitsGrupo.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Activos:</span>
                              <Badge variant="default">{kitsActivos}</Badge>
                            </div>
                            <div className="pt-2 border-t mt-3">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {kitsGrupo.slice(0, 3).map(k => k.codigo).join(', ')}
                                {kitsGrupo.length > 3 && '...'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Vista de Detalles (planes filtrados por marca)
          <div className="grid gap-6">
            {planesFiltrados
              .filter(plan => !selectedMarca || plan.marca === selectedMarca)
              .map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {plan.nombre}
                        {!plan.activo && <Badge variant="secondary">Inactivo</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {plan.marca} {plan.modelo && ` ${plan.modelo}`}  {plan.categoria}
                      </CardDescription>
                      {plan.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2">{plan.descripcion}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditPlan(plan)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Intervalos de Mantenimiento
                    </h3>
                    <Button size="sm" onClick={() => openNewIntervaloDialog(plan.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Intervalo
                    </Button>
                  </div>
                  {plan.intervalos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay intervalos definidos</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Horas</TableHead>
                          <TableHead>Tareas</TableHead>
                          <TableHead>Kits asignados</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.intervalos.sort((a, b) => a.orden - b.orden).map((intervalo) => (
                          <TableRow key={intervalo.id}>
                            <TableCell>
                              <Badge>{intervalo.codigo}</Badge>
                            </TableCell>
                            <TableCell>{intervalo.nombre}</TableCell>
                            <TableCell>{intervalo.horas_intervalo}h</TableCell>
                            <TableCell>
                              {intervalo.tareas.length > 0 ? (
                                <span className="text-sm">{intervalo.tareas.length} tareas</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Sin tareas</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {intervalo.kits.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">Sin kits asociados</span>
                                ) : (
                                  intervalo.kits.map((link) => (
                                    <div
                                      key={link.id}
                                      className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                                    >
                                      <span className="font-medium">{link.kit.codigo}</span>
                                      <button
                                        type="button"
                                        className="text-muted-foreground transition hover:text-destructive"
                                        onClick={() => handleRemoveKit(link.id)}
                                        title="Quitar kit"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-2"
                                onClick={() => handleOpenKitDialog(plan, intervalo)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Asignar kit
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => handleEditIntervalo(intervalo)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteIntervalo(intervalo.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={openIntervaloDialog} onOpenChange={(open) => {
          setOpenIntervaloDialog(open);
          if (!open) resetIntervaloForm();
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingIntervalo ? 'Editar Intervalo' : 'Nuevo Intervalo'}</DialogTitle>
              <DialogDescription>Define un intervalo de mantenimiento (PM1, PM2, etc.)</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Codigo *</Label>
                  <Input
                    id="codigo"
                    value={intervaloForm.codigo}
                    onChange={(e) => setIntervaloForm({ ...intervaloForm, codigo: e.target.value })}
                    placeholder="PM1"
                  />
                </div>
                <div>
                  <Label htmlFor="horas_intervalo">Horas *</Label>
                  <Input
                    id="horas_intervalo"
                    type="number"
                    value={intervaloForm.horas_intervalo}
                    onChange={(e) => setIntervaloForm({ ...intervaloForm, horas_intervalo: e.target.value })}
                    placeholder="250"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="nombre_intervalo">Nombre *</Label>
                <Input
                  id="nombre_intervalo"
                  value={intervaloForm.nombre}
                  onChange={(e) => setIntervaloForm({ ...intervaloForm, nombre: e.target.value })}
                  placeholder="Servicio basico 250h"
                />
              </div>
              <div>
                <Label htmlFor="descripcion_intervalo">Descripcion</Label>
                <Textarea
                  id="descripcion_intervalo"
                  value={intervaloForm.descripcion}
                  onChange={(e) => setIntervaloForm({ ...intervaloForm, descripcion: e.target.value })}
                  placeholder="Descripcion del intervalo..."
                />
              </div>
              <div>
                <Label htmlFor="tareas">Tareas (una por linea)</Label>
                <Textarea
                  id="tareas"
                  value={intervaloForm.tareas}
                  onChange={(e) => setIntervaloForm({ ...intervaloForm, tareas: e.target.value })}
                  placeholder="Cambio de aceite&#10;Cambio de filtros&#10;Inspeccion general"
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  value={intervaloForm.orden}
                  onChange={(e) => setIntervaloForm({ ...intervaloForm, orden: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenIntervaloDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateIntervalo}>
                {editingIntervalo ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <Dialog
        open={openKitDialog}
        onOpenChange={(open) => {
          setOpenKitDialog(open);
          if (!open) {
            setKitDialogContext(null);
            setSelectedKitId('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar kit al intervalo</DialogTitle>
            <DialogDescription>
              Vuelve reutilizable cada PM vinculando un kit predefinido para el intervalo seleccionado.
            </DialogDescription>
          </DialogHeader>
          {kitDialogContext && (
            <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
              <p>
                <span className="font-semibold">Plan:</span> {kitDialogContext.planMarca}
                {kitDialogContext.planModelo ? ` - ${kitDialogContext.planModelo}` : ''}
              </p>
              <p>
                <span className="font-semibold">Intervalo:</span> {kitDialogContext.intervalo.codigo} - {kitDialogContext.intervalo.nombre}
              </p>
            </div>
          )}
          {compatibleKits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay kits activos que coincidan con la marca o modelo del plan. Crea uno nuevo o activa un kit existente.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="kitSelect">Selecciona un kit</Label>
              <Select value={selectedKitId} onValueChange={setSelectedKitId}>
                <SelectTrigger id="kitSelect">
                  <SelectValue placeholder="Elige un kit disponible" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleKits.map((kit) => (
                    <SelectItem key={kit.id} value={String(kit.id)}>
                      {kit.codigo} - {kit.nombre}
                      {kit.modelo_aplicable ? ` (${kit.modelo_aplicable})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenKitDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignKit} disabled={!selectedKitId || compatibleKits.length === 0}>
              Asignar kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) {
            setSelectedCatModel('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar plantilla Caterpillar</DialogTitle>
            <DialogDescription>
              Genera automaticamente el plan (PM1-PM4) y los kits con filtros oficiales para tu modelo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cat-model-select">Modelo Caterpillar</Label>
            <Select value={selectedCatModel} onValueChange={setSelectedCatModel}>
              <SelectTrigger id="cat-model-select">
                <SelectValue placeholder="Selecciona un modelo disponible" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {catModelOptions.map((option) => (
                  <SelectItem key={option.modelo} value={option.modelo}>
                    {option.modelo}
                    {option.aliases?.length ? ` (${option.aliases.slice(0, 2).join(', ')})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportCaterpillarPlan} disabled={!selectedCatModel || isImportingCatPlan}>
              {isImportingCatPlan ? 'Importando...' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
