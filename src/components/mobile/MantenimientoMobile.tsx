/**
 * Control Mantenimiento Móvil
 * 
 * Características:
 * - Tabla horizontal scrollable con indicadores
 * - Filtros bottom sheet (todos/vencidos/próximos/al día)
 * - Vista detalle expandible
 * - Acciones contextuales por mantenimiento
 * - Registro de mantenimiento realizado
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileTable } from '@/components/mobile/MobileTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  Filter,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MantenimientoProgramado } from '@/types/equipment';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';

interface MantenimientoMobileProps {
  mantenimientos: MantenimientoProgramado[];
  onRegistrar: (mantenimiento: MantenimientoProgramado) => void;
  onVerDetalle: (ficha: string) => void;
}

type FilterType = 'all' | 'vencidos' | 'proximos' | 'ok';

export function MantenimientoMobile({
  mantenimientos,
  onRegistrar,
  onVerDetalle,
}: MantenimientoMobileProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Estadísticas
  const stats = useMemo(() => {
    const vencidos = mantenimientos.filter(m => m.horasKmRestante < 0).length;
    const proximos = mantenimientos.filter(
      m => m.horasKmRestante >= 0 && m.horasKmRestante <= 50
    ).length;
    const ok = mantenimientos.filter(m => m.horasKmRestante > 50).length;

    return { total: mantenimientos.length, vencidos, proximos, ok };
  }, [mantenimientos]);

  // Filtrado
  const mantenimientosFiltrados = useMemo(() => {
    if (filter === 'vencidos') {
      return mantenimientos.filter(m => m.horasKmRestante < 0);
    }
    if (filter === 'proximos') {
      return mantenimientos.filter(
        m => m.horasKmRestante >= 0 && m.horasKmRestante <= 50
      );
    }
    if (filter === 'ok') {
      return mantenimientos.filter(m => m.horasKmRestante > 50);
    }
    return mantenimientos;
  }, [mantenimientos, filter]);

  // Ordenar por urgencia
  const mantenimientosOrdenados = useMemo(() => {
    return [...mantenimientosFiltrados].sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [mantenimientosFiltrados]);

  const getStatusIcon = (restante: number) => {
    if (restante < 0) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (restante <= 50) return <Clock className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (restante: number) => {
    const variant = getRemainingVariant(restante);
    const label = formatRemainingLabel(restante);

    if (restante < 0) {
      return (
        <Badge variant="destructive" className="text-[0.65rem]">
          {label}
        </Badge>
      );
    }
    if (restante <= 50) {
      return (
        <Badge variant="default" className="bg-amber-500 text-[0.65rem]">
          {label}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[0.65rem]">
        {label}
      </Badge>
    );
  };

  return (
    <MobileLayout
      title="Mantenimientos"
      headerActions={
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Filter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[350px]">
            <SheetHeader>
              <SheetTitle>Filtrar mantenimientos</SheetTitle>
              <SheetDescription>Muestra por estado de mantenimiento</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setFilter('all');
                  setFiltersOpen(false);
                }}
              >
                <Wrench className="h-4 w-4" />
                Todos ({stats.total})
              </Button>
              <Button
                variant={filter === 'vencidos' ? 'default' : 'outline'}
                className="w-full justify-start gap-2 text-red-600 hover:text-red-600"
                onClick={() => {
                  setFilter('vencidos');
                  setFiltersOpen(false);
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                Vencidos ({stats.vencidos})
              </Button>
              <Button
                variant={filter === 'proximos' ? 'default' : 'outline'}
                className="w-full justify-start gap-2 text-amber-600 hover:text-amber-600"
                onClick={() => {
                  setFilter('proximos');
                  setFiltersOpen(false);
                }}
              >
                <Clock className="h-4 w-4" />
                Próximos ({stats.proximos})
              </Button>
              <Button
                variant={filter === 'ok' ? 'default' : 'outline'}
                className="w-full justify-start gap-2 text-green-600 hover:text-green-600"
                onClick={() => {
                  setFilter('ok');
                  setFiltersOpen(false);
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Al día ({stats.ok})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-4">
        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border bg-card p-2 text-center">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-[0.65rem] text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.vencidos}</p>
            <p className="text-[0.65rem] text-red-600/80">Vencidos</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.proximos}</p>
            <p className="text-[0.65rem] text-amber-600/80">Próximos</p>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.ok}</p>
            <p className="text-[0.65rem] text-green-600/80">Al día</p>
          </div>
        </div>

        {/* Filtros chip */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Badge
            variant={filter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('all')}
          >
            Todos
          </Badge>
          <Badge
            variant={filter === 'vencidos' ? 'destructive' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('vencidos')}
          >
            Vencidos
          </Badge>
          <Badge
            variant={filter === 'proximos' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap bg-amber-500"
            onClick={() => setFilter('proximos')}
          >
            Próximos
          </Badge>
          <Badge
            variant={filter === 'ok' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap bg-green-500"
            onClick={() => setFilter('ok')}
          >
            Al día
          </Badge>
        </div>

        {/* Tabla compacta */}
        <MobileTable
          data={mantenimientosOrdenados}
          columns={[
            {
              header: 'Estado',
              accessor: (row) => getStatusIcon(row.horasKmRestante),
              minWidth: '50px',
              className: 'text-center',
            },
            {
              header: 'Equipo',
              accessor: 'nombreEquipo',
              cell: (value, row) => (
                <div className="min-w-[120px]">
                  <p className="text-xs font-semibold truncate">{row.ficha}</p>
                  <p className="text-[0.65rem] text-muted-foreground truncate">{String(value)}</p>
                </div>
              ),
              minWidth: '120px',
            },
            {
              header: 'Tipo',
              accessor: 'tipoMantenimiento',
              cell: (value) => (
                <span className="text-xs whitespace-nowrap">{String(value)}</span>
              ),
              mobileHidden: true,
              minWidth: '100px',
            },
            {
              header: 'Restante',
              accessor: 'horasKmRestante',
              cell: (value) => getStatusBadge(Number(value)),
              minWidth: '80px',
            },
            {
              header: 'Próximo',
              accessor: 'proximoMantenimiento',
              cell: (value) => (
                <span className="text-xs font-medium whitespace-nowrap">{String(value)} hrs</span>
              ),
              minWidth: '80px',
            },
          ]}
          actions={[
            {
              label: 'Registrar mantenimiento',
              icon: <Wrench className="h-4 w-4" />,
              onClick: (row) => onRegistrar(row),
            },
            {
              label: 'Ver detalle equipo',
              icon: <Calendar className="h-4 w-4" />,
              onClick: (row) => onVerDetalle(row.ficha),
            },
          ]}
          onRowClick={(row) => onVerDetalle(row.ficha)}
          compact={true}
          emptyMessage="No hay mantenimientos programados"
        />

        {/* Hint */}
        {mantenimientosFiltrados.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Toca una fila para ver detalles del equipo
          </p>
        )}
      </div>
    </MobileLayout>
  );
}
