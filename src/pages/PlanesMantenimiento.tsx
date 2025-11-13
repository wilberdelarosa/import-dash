import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { usePlanes } from '@/hooks/usePlanes';
import { useKits } from '@/hooks/useKits';
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
import { Plus, Pencil, Trash2, ClipboardList, Package, Clock } from 'lucide-react';
import { useState } from 'react';
import type { PlanMantenimiento, PlanIntervalo } from '@/types/maintenance-plans';

export default function PlanesMantenimiento() {
  const { planes, loading, createPlan, updatePlan, deletePlan, createIntervalo, updateIntervalo, deleteIntervalo } = usePlanes();
  const { kits } = useKits();
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [openIntervaloDialog, setOpenIntervaloDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanMantenimiento | null>(null);
  const [editingIntervalo, setEditingIntervalo] = useState<PlanIntervalo | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

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
    if (confirm('¿Eliminar este plan? Se eliminarán todos sus intervalos.')) {
      await deletePlan(id);
    }
  };

  const handleDeleteIntervalo = async (id: number) => {
    if (confirm('¿Eliminar este intervalo?')) {
      await deleteIntervalo(id);
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
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Planes de Mantenimiento">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="w-8 h-8" />
              Planes de Mantenimiento
            </h1>
            <p className="text-muted-foreground mt-1">
              Define planes con intervalos PM para cada marca y modelo
            </p>
          </div>
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
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Input
                      id="categoria"
                      value={planForm.categoria}
                      onChange={(e) => setPlanForm({ ...planForm, categoria: e.target.value })}
                      placeholder="Excavadora"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={planForm.descripcion}
                    onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })}
                    placeholder="Descripción del plan..."
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
        ) : (
          <div className="grid gap-6">
            {planes.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {plan.nombre}
                        {!plan.activo && <Badge variant="secondary">Inactivo</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {plan.marca} {plan.modelo && `• ${plan.modelo}`} • {plan.categoria}
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
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Horas</TableHead>
                          <TableHead>Tareas</TableHead>
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
                  <Label htmlFor="codigo">Código *</Label>
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
                  placeholder="Servicio básico 250h"
                />
              </div>
              <div>
                <Label htmlFor="descripcion_intervalo">Descripción</Label>
                <Textarea
                  id="descripcion_intervalo"
                  value={intervaloForm.descripcion}
                  onChange={(e) => setIntervaloForm({ ...intervaloForm, descripcion: e.target.value })}
                  placeholder="Descripción del intervalo..."
                />
              </div>
              <div>
                <Label htmlFor="tareas">Tareas (una por línea)</Label>
                <Textarea
                  id="tareas"
                  value={intervaloForm.tareas}
                  onChange={(e) => setIntervaloForm({ ...intervaloForm, tareas: e.target.value })}
                  placeholder="Cambio de aceite&#10;Cambio de filtros&#10;Inspección general"
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
      </div>
    </Layout>
  );
}
