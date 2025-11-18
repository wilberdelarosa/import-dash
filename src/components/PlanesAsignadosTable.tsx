import { useState, useMemo } from 'react';
import { usePlanesAsignados, type PlanAsignadoDetallado } from '@/hooks/usePlanesAsignados';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, X, Edit, Check, AlertTriangle, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PlanesAsignadosTable() {
  const { planes, loading, actualizarPlanAsignado, eliminarPlanAsignado } = usePlanesAsignados();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroTecnico, setFiltroTecnico] = useState<string>('all');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('all');
  
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    tecnico_responsable: string;
    horas_alerta: number;
    notas: string;
  }>({
    tecnico_responsable: '',
    horas_alerta: 50,
    notas: '',
  });

  // Obtener técnicos únicos para el filtro
  const tecnicos = useMemo(() => {
    const tecnicosSet = new Set(planes.map((p) => p.tecnico_responsable));
    return Array.from(tecnicosSet).sort();
  }, [planes]);

  // Filtrar planes
  const planesFiltrados = useMemo(() => {
    return planes.filter((plan) => {
      const matchBusqueda =
        !busqueda ||
        plan.equipo_ficha.toLowerCase().includes(busqueda.toLowerCase()) ||
        plan.equipo_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        plan.intervalo_codigo.toLowerCase().includes(busqueda.toLowerCase());

      const matchEstado = filtroEstado === 'all' || plan.estado === filtroEstado;
      const matchTecnico = filtroTecnico === 'all' || plan.tecnico_responsable === filtroTecnico;
      const matchPrioridad =
        filtroPrioridad === 'all' || plan.prioridad.toString() === filtroPrioridad;

      return matchBusqueda && matchEstado && matchTecnico && matchPrioridad;
    });
  }, [planes, busqueda, filtroEstado, filtroTecnico, filtroPrioridad]);

  // KPIs
  const kpis = useMemo(() => {
    return {
      total: planes.length,
      pendientes: planes.filter((p) => p.estado === 'pendiente').length,
      enProceso: planes.filter((p) => p.estado === 'en_proceso').length,
      completados: planes.filter((p) => p.estado === 'completado').length,
      vencidos: planes.filter((p) => p.estado === 'vencido').length,
      urgentes: planes.filter((p) => p.prioridad === 1).length,
    };
  }, [planes]);

  const handleIniciarEdicion = (plan: PlanAsignadoDetallado) => {
    setEditandoId(plan.id);
    setEditForm({
      tecnico_responsable: plan.tecnico_responsable,
      horas_alerta: plan.horas_alerta,
      notas: plan.notas || '',
    });
  };

  const handleGuardarEdicion = async (id: string) => {
    try {
      await actualizarPlanAsignado({
        id,
        ...editForm,
      });
      setEditandoId(null);
    } catch (error) {
      console.error('Error guardando edición:', error);
    }
  };

  const handleCambiarEstado = async (
    id: string,
    nuevoEstado: 'pendiente' | 'en_proceso' | 'completado' | 'vencido'
  ) => {
    try {
      await actualizarPlanAsignado({ id, estado: nuevoEstado });
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const getPrioridadBadge = (prioridad: number) => {
    switch (prioridad) {
      case 0:
        return (
          <Badge variant="destructive" className="text-xs">
            Vencido
          </Badge>
        );
      case 1:
        return (
          <Badge variant="destructive" className="text-xs">
            Urgente
          </Badge>
        );
      case 2:
        return (
          <Badge variant="warning" className="text-xs">
            Alerta
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Normal
          </Badge>
        );
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completado':
        return (
          <Badge variant="success" className="text-xs">
            Completado
          </Badge>
        );
      case 'en_proceso':
        return (
          <Badge variant="warning" className="text-xs">
            En proceso
          </Badge>
        );
      case 'vencido':
        return (
          <Badge variant="destructive" className="text-xs">
            Vencido
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Pendiente
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Pendientes</div>
            <div className="text-2xl font-bold text-slate-600">{kpis.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">En proceso</div>
            <div className="text-2xl font-bold text-blue-600">{kpis.enProceso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Completados</div>
            <div className="text-2xl font-bold text-green-600">{kpis.completados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Vencidos</div>
            <div className="text-2xl font-bold text-red-600">{kpis.vencidos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Urgentes
            </div>
            <div className="text-2xl font-bold text-orange-600">{kpis.urgentes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipo o intervalo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los técnicos</SelectItem>
                {tecnicos.map((tecnico) => (
                  <SelectItem key={tecnico} value={tecnico}>
                    {tecnico}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="0">Vencidos</SelectItem>
                <SelectItem value="1">Urgentes</SelectItem>
                <SelectItem value="2">Alerta</SelectItem>
                <SelectItem value="3">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Planes Asignados</CardTitle>
              <CardDescription className="text-xs mt-1">
                {planesFiltrados.length} de {planes.length} planes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 text-xs">Equipo</TableHead>
                  <TableHead className="h-8 text-xs">Ficha</TableHead>
                  <TableHead className="h-8 text-xs">Intervalo</TableHead>
                  <TableHead className="h-8 text-xs">Técnico</TableHead>
                  <TableHead className="h-8 text-xs text-right">Restante</TableHead>
                  <TableHead className="h-8 text-xs">Estado</TableHead>
                  <TableHead className="h-8 text-xs">Prioridad</TableHead>
                  <TableHead className="h-8 text-xs text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      No hay planes asignados con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  planesFiltrados.map((plan) => (
                    <TableRow key={plan.id} className="h-12">
                      <TableCell className="py-2">
                        <div>
                          <div className="font-medium text-sm leading-tight">{plan.equipo_nombre}</div>
                          <div className="text-xs text-muted-foreground">{plan.equipo_categoria}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs py-2">{plan.equipo_ficha}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-xs">
                          {plan.intervalo_codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        {editandoId === plan.id ? (
                          <Input
                            value={editForm.tecnico_responsable}
                            onChange={(e) =>
                              setEditForm({ ...editForm, tecnico_responsable: e.target.value })
                            }
                            className="h-7 text-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {plan.tecnico_responsable}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        {plan.horas_restantes !== null ? (
                          <span
                            className={cn(
                              'text-sm font-medium',
                              plan.horas_restantes <= 0 && 'text-red-600',
                              plan.horas_restantes > 0 &&
                                plan.horas_restantes <= plan.horas_alerta &&
                                'text-orange-600'
                            )}
                          >
                            {plan.horas_restantes > 0 ? `${plan.horas_restantes}h` : 'Vencido'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">{getEstadoBadge(plan.estado)}</TableCell>
                      <TableCell className="py-2">{getPrioridadBadge(plan.prioridad)}</TableCell>
                      <TableCell className="text-right py-2">
                        {editandoId === plan.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleGuardarEdicion(plan.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditandoId(null)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleIniciarEdicion(plan)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {plan.estado === 'pendiente' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCambiarEstado(plan.id, 'en_proceso')}
                                className="h-6 px-2 text-xs"
                              >
                                Iniciar
                              </Button>
                            )}
                            {plan.estado === 'en_proceso' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCambiarEstado(plan.id, 'completado')}
                                className="h-6 px-2 text-xs"
                              >
                                Completar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => eliminarPlanAsignado(plan.id)}
                              className="h-6 w-6 p-0 text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
