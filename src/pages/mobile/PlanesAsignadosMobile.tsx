/**
 * Planes Asignados Móvil
 * 
 * Características:
 * - Lista vertical de planes con MobileListCard
 * - Filtros bottom sheet (estado, técnico, prioridad)
 * - Estadísticas compactas (4 columnas)
 * - Búsqueda por equipo o intervalo
 * - Acciones rápidas (cambiar estado, editar, eliminar)
 * - Badges de estado y prioridad
 */

import { useState, useMemo } from 'react';
import { usePlanesAsignados, type PlanAsignadoDetallado } from '@/hooks/usePlanesAsignados';
import { MobileSheet } from "@/components/mobile/MobileSheet";
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileListCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  MoreVertical,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function PlanesAsignadosMobile() {
  const { planes, loading, actualizarPlanAsignado, eliminarPlanAsignado } = usePlanesAsignados();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroTecnico, setFiltroTecnico] = useState<string>('all');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanAsignadoDetallado | null>(null);

  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [editForm, setEditForm] = useState<{
    tecnico_responsable: string;
    estado: 'pendiente' | 'en_proceso' | 'completado' | 'vencido';
    horas_alerta: number;
    notas: string;
  }>({
    tecnico_responsable: '',
    estado: 'pendiente',
    horas_alerta: 50,
    notas: '',
  });

  // Técnicos únicos
  const tecnicos = useMemo(() => {
    const tecnicosSet = new Set(planes.map((p) => p.tecnico_responsable).filter(t => t && t.trim() !== ''));
    return Array.from(tecnicosSet).sort();
  }, [planes]);

  // Filtrado
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

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: planes.length,
      pendientes: planes.filter((p) => p.estado === 'pendiente').length,
      enProceso: planes.filter((p) => p.estado === 'en_proceso').length,
      completados: planes.filter((p) => p.estado === 'completado').length,
      vencidos: planes.filter((p) => p.estado === 'vencido').length,
    };
  }, [planes]);

  const getEstadoBadge = (estado: string) => {
    const config = {
      pendiente: { label: 'Pendiente', variant: 'outline' as const, className: 'border-amber-500 text-amber-600' },
      en_proceso: { label: 'En Proceso', variant: 'default' as const, className: 'bg-blue-500' },
      completado: { label: 'Completado', variant: 'default' as const, className: 'bg-green-500' },
      vencido: { label: 'Vencido', variant: 'destructive' as const, className: '' },
    };
    const c = config[estado as keyof typeof config] || config.pendiente;
    return (
      <Badge variant={c.variant} className={cn('text-[0.65rem]', c.className)}>
        {c.label}
      </Badge>
    );
  };

  const getPrioridadIcon = (prioridad: number) => {
    if (prioridad === 1) return <AlertTriangle className="h-3 w-3 text-red-500" />;
    if (prioridad === 2) return <Clock className="h-3 w-3 text-amber-500" />;
    return <CheckCircle2 className="h-3 w-3 text-green-500" />;
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

  const abrirEdicion = (plan: PlanAsignadoDetallado) => {
    setPlanSeleccionado(plan);
    setEditForm({
      tecnico_responsable: plan.tecnico_responsable,
      estado: plan.estado,
      horas_alerta: plan.horas_alerta,
      notas: plan.notas || '',
    });
    setEditDialog(true);
  };

  const handleGuardarEdicion = async () => {
    if (!planSeleccionado) return;
    setGuardandoEdicion(true);
    try {
      await actualizarPlanAsignado({
        id: planSeleccionado.id,
        ...editForm,
      });
      setEditDialog(false);
      setPlanSeleccionado(null);
    } catch (error) {
      console.error('Error guardando edición:', error);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminar = async (id: string) => {
    try {
      await eliminarPlanAsignado(id);
    } catch (error) {
      console.error('Error eliminando plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MobileLayout
      title="Planes Asignados"
      headerActions={
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Filter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[85svh] overflow-y-auto pb-safe rounded-t-[2rem]">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted mb-4" />
            <SheetHeader>
              <SheetTitle>Filtrar planes</SheetTitle>
              <SheetDescription>Filtra por estado, técnico o prioridad</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Técnico</label>
                <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tecnicos.map((tec) => (
                      <SelectItem key={tec} value={tec}>
                        {tec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridad</label>
                <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="1">Alta (1)</SelectItem>
                    <SelectItem value="2">Media (2)</SelectItem>
                    <SelectItem value="3">Baja (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFiltroEstado('all');
                  setFiltroTecnico('all');
                  setFiltroPrioridad('all');
                  setFiltersOpen(false);
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-4 pb-20">
        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border bg-card p-2 text-center">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-[0.65rem] text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.pendientes}</p>
            <p className="text-[0.65rem] text-amber-600/80">Pendiente</p>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.enProceso}</p>
            <p className="text-[0.65rem] text-blue-600/80">En Curso</p>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.completados}</p>
            <p className="text-[0.65rem] text-green-600/80">Hecho</p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por equipo o intervalo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista de planes */}
        {planesFiltrados.length > 0 ? (
          <div className="space-y-3">
            {planesFiltrados.map((plan) => (
              <MobileListCard
                key={plan.id}
                icon={getPrioridadIcon(plan.prioridad)}
                badge={getEstadoBadge(plan.estado)}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {plan.equipo_ficha} - {plan.intervalo_codigo}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {plan.equipo_nombre}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCambiarEstado(plan.id, 'en_proceso')}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Marcar en proceso
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCambiarEstado(plan.id, 'completado')}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Marcar completado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => abrirEdicion(plan)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEliminar(plan.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{plan.tecnico_responsable}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(plan.fecha_asignacion).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {plan.notas && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {plan.notas}
                    </p>
                  )}
                </div>
              </MobileListCard>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay planes asignados
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {busqueda || filtroEstado !== 'all'
                ? 'Intenta con otros filtros'
                : 'Asigna planes desde el planificador'}
            </p>
          </div>
        )}
      </div>

      {/* Diálogo de edición */}
      <MobileSheet
        open={editDialog}
        onOpenChange={setEditDialog}
        title="Editar Plan"
        description={`${planSeleccionado?.equipo_ficha} - ${planSeleccionado?.intervalo_codigo}`}
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setEditDialog(false)} disabled={guardandoEdicion}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleGuardarEdicion} disabled={guardandoEdicion}>
              {guardandoEdicion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Técnico responsable</label>
            <Input
              value={editForm.tecnico_responsable}
              onChange={(e) => setEditForm({ ...editForm, tecnico_responsable: e.target.value })}
              placeholder="Nombre del técnico"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={editForm.estado}
              onValueChange={(value) =>
                setEditForm({ ...editForm, estado: value as typeof editForm.estado })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Horas de alerta</label>
            <Input
              type="number"
              value={editForm.horas_alerta}
              onChange={(e) =>
                setEditForm({ ...editForm, horas_alerta: Number(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <Textarea
              value={editForm.notas}
              onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>
        </div>
      </MobileSheet>
    </MobileLayout>
  );
}
