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
import { MobileCard, MobileListCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Power,
  PowerOff,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  ListFilter,
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
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 active:scale-95 transition-all">
              <ListFilter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px] rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
            <SheetHeader className="mt-4">
              <SheetTitle className="text-center text-xl font-bold">Filtros</SheetTitle>
              <SheetDescription className="text-center">
                Organiza tu vista de equipos
              </SheetDescription>
            </SheetHeader>
            <div className="mt-8 space-y-3 px-4">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                className={cn(
                  "w-full justify-start gap-3 h-14 text-base rounded-xl transition-all",
                  filter === 'all' && "bg-primary shadow-lg shadow-primary/25"
                )}
                onClick={() => {
                  setFilter('all');
                  setFiltersOpen(false);
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/20">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span>Todos los equipos</span>
                  <Badge variant="secondary" className="bg-background/20 text-foreground">{stats.total}</Badge>
                </div>
              </Button>

              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                className={cn(
                  "w-full justify-start gap-3 h-14 text-base rounded-xl transition-all",
                  filter === 'active' && "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 border-emerald-600"
                )}
                onClick={() => {
                  setFilter('active');
                  setFiltersOpen(false);
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/20">
                  <Power className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span>Equipos Activos</span>
                  <Badge variant="secondary" className="bg-background/20 text-foreground">{stats.activos}</Badge>
                </div>
              </Button>

              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                className={cn(
                  "w-full justify-start gap-3 h-14 text-base rounded-xl transition-all",
                  filter === 'inactive' && "bg-slate-600 hover:bg-slate-700 shadow-lg shadow-slate-600/25 border-slate-600"
                )}
                onClick={() => {
                  setFilter('inactive');
                  setFiltersOpen(false);
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/20">
                  <PowerOff className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span>Equipos Inactivos</span>
                  <Badge variant="secondary" className="bg-background/20 text-foreground">{stats.inactivos}</Badge>
                </div>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-6 pb-24">
        {/* Estadísticas rápidas con Glassmorphism */}
        <div className="grid grid-cols-3 gap-3">
          <MobileCard variant="glass" className="p-3 text-center bg-primary/5 border-primary/10">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
          </MobileCard>
          <MobileCard variant="glass" className="p-3 text-center bg-emerald-500/5 border-emerald-500/10">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activos}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Activos</p>
          </MobileCard>
          <MobileCard variant="glass" className="p-3 text-center bg-slate-500/5 border-slate-500/10">
            <p className="text-2xl font-bold text-slate-500 dark:text-slate-400">{stats.inactivos}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Inactivos</p>
          </MobileCard>
        </div>

        {/* Barra de búsqueda Sticky */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ficha, nombre, placa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 h-10 rounded-xl"
            />
          </div>

          {/* Active Filter Indicator */}
          {filter !== 'all' && (
            <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in">
              <span className="text-xs text-muted-foreground">Filtrando por:</span>
              <Badge variant="secondary" className="gap-1 pl-1 pr-2 h-6">
                <div className={cn("h-1.5 w-1.5 rounded-full", filter === 'active' ? "bg-emerald-500" : "bg-slate-500")} />
                {filter === 'active' ? 'Activos' : 'Inactivos'}
                <button onClick={() => setFilter('all')} className="ml-1 hover:text-foreground">×</button>
              </Badge>
            </div>
          )}
        </div>

        {/* Lista de equipos */}
        {equiposFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold">No se encontraron equipos</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay equipos en esta categoría'}
            </p>
            {searchQuery && (
              <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {equiposFiltrados.map((equipo, index) => (
              <div
                key={equipo.id}
                className="relative group animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <MobileListCard
                  title={equipo.ficha || 'Sin ficha'}
                  subtitle={equipo.nombre || 'Sin nombre'}
                  meta={`${equipo.marca || ''} ${equipo.modelo || ''}`.trim() || 'Sin marca/modelo'}
                  icon={getCategoryIcon(equipo.categoria)}
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-accent/50 transition-all"
                  badge={
                    equipo.activo ? (
                      <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 border-slate-500/30 text-slate-600 bg-slate-500/5">Inactivo</Badge>
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
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 active:opacity-100 data-[state=open]:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerDetalle(equipo.ficha || '');
                      }}
                      className="gap-2 py-2.5"
                    >
                      <Eye className="h-4 w-4 text-primary" />
                      Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(equipo);
                      }}
                      className="gap-2 py-2.5"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(equipo.id);
                      }}
                      className="gap-2 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
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
      </div>

      {/* FAB Premium para agregar equipo */}
      <Button
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300"
        size="icon"
        onClick={onAdd}
      >
        <Plus className="h-7 w-7 text-primary-foreground" />
      </Button>
    </MobileLayout>
  );
}
