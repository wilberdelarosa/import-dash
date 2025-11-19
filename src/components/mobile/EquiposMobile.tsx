/**
 * Equipos Móvil - Lista optimizada de equipos
 * 
 * Características:
 * - Lista vertical con cards compactos
 * - Búsqueda con debounce
 * - Filtros rápidos (activos/inactivos)
 * - Vista detalle fullscreen
 * - FAB para agregar equipo
 * - Gestos táctiles
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileListCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Power,
  PowerOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Equipo } from '@/types/equipment';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EquiposMobileProps {
  equipos: Equipo[];
  onVerDetalle: (ficha: string) => void;
  onEdit: (equipo: Equipo) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

type FilterType = 'all' | 'active' | 'inactive';

export function EquiposMobile({
  equipos,
  onVerDetalle,
  onEdit,
  onDelete,
  onAdd,
}: EquiposMobileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Estadísticas
  const stats = useMemo(() => ({
    total: equipos.length,
    activos: equipos.filter(e => e.activo).length,
    inactivos: equipos.filter(e => !e.activo).length,
  }), [equipos]);

  // Filtrado y búsqueda
  const equiposFiltrados = useMemo(() => {
    let filtered = equipos;

    // Filtro por estado
    if (filter === 'active') {
      filtered = filtered.filter(e => e.activo);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(e => !e.activo);
    }

    // Búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.ficha?.toLowerCase().includes(query) ||
          e.nombre?.toLowerCase().includes(query) ||
          e.marca?.toLowerCase().includes(query) ||
          e.modelo?.toLowerCase().includes(query) ||
          e.placa?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [equipos, filter, searchQuery]);

  const getCategoryIcon = (categoria?: string) => {
    return <Truck className="h-5 w-5" />;
  };

  return (
    <MobileLayout
      title="Equipos"
      headerActions={
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Filter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[300px]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>Filtra equipos por estado</SheetDescription>
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
                <Truck className="h-4 w-4" />
                Todos ({stats.total})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setFilter('active');
                  setFiltersOpen(false);
                }}
              >
                <Power className="h-4 w-4" />
                Activos ({stats.activos})
              </Button>
              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setFilter('inactive');
                  setFiltersOpen(false);
                }}
              >
                <PowerOff className="h-4 w-4" />
                Inactivos ({stats.inactivos})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-4">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.inactivos}</p>
            <p className="text-xs text-muted-foreground">Inactivos</p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="sticky top-0 z-10 bg-background pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ficha, nombre, marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Chips de filtro */}
          <div className="mt-2 flex gap-2">
            <Badge
              variant={filter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('all')}
            >
              Todos
            </Badge>
            <Badge
              variant={filter === 'active' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('active')}
            >
              Activos
            </Badge>
            <Badge
              variant={filter === 'inactive' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('inactive')}
            >
              Inactivos
            </Badge>
          </div>
        </div>

        {/* Lista de equipos */}
        {equiposFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No hay equipos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery ? 'Intenta con otra búsqueda' : 'Agrega tu primer equipo'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-20">
            {equiposFiltrados.map((equipo) => (
              <div key={equipo.id} className="relative">
                <MobileListCard
                  title={equipo.ficha || 'Sin ficha'}
                  subtitle={equipo.nombre || 'Sin nombre'}
                  meta={`${equipo.marca || ''} ${equipo.modelo || ''}`.trim() || 'Sin marca/modelo'}
                  icon={getCategoryIcon(equipo.categoria)}
                  badge={
                    equipo.activo ? (
                      <Badge className="text-[0.65rem]">Activo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[0.65rem]">
                        Inactivo
                      </Badge>
                    )
                  }
                  onClick={() => onVerDetalle(equipo.ficha || '')}
                />

                {/* Menú de acciones flotante */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerDetalle(equipo.ficha || '');
                      }}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(equipo);
                      }}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(equipo.id);
                      }}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* Resultados de búsqueda */}
        {searchQuery && (
          <div className="sticky bottom-20 left-0 right-0 mx-auto w-fit rounded-full bg-primary/90 px-4 py-2 text-xs text-primary-foreground shadow-lg backdrop-blur">
            {equiposFiltrados.length} resultado{equiposFiltrados.length !== 1 && 's'}
          </div>
        )}
      </div>

      {/* FAB para agregar equipo */}
      <Button
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-xl"
        size="icon"
        onClick={onAdd}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </MobileLayout>
  );
}
