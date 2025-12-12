import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  Box,
  ListFilter,
  Lock,
} from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';
import { Inventario as InventarioItem } from '@/types/equipment';

interface InventarioMobileProps {
  inventarios: InventarioItem[];
  onAdd: () => void;
  onEdit: (item: InventarioItem) => void;
  onDelete: (item: InventarioItem) => void;
}

export function InventarioMobile({
  inventarios,
  onAdd,
  onEdit,
  onDelete,
}: InventarioMobileProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { currentUserRole } = useUserRoles();
  const isAdmin = currentUserRole === 'admin';

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = inventarios.length;
    const filtros = inventarios.filter((i) => i.tipo === 'Filtro').length;
    const aceites = inventarios.filter((i) => i.tipo === 'Aceite').length;
    const repuestos = inventarios.filter((i) => i.tipo === 'Repuesto').length;
    const herramientas = inventarios.filter(
      (i) => i.tipo === 'Herramienta'
    ).length;
    const lowStock = inventarios.filter(
      (i) => i.cantidad < i.stockMinimo
    ).length;

    return { total, filtros, aceites, repuestos, herramientas, lowStock };
  }, [inventarios]);

  // Filtrado y búsqueda
  const inventariosFiltrados = useMemo(() => {
    let resultado = inventarios;

    // Filtro por tipo o stock bajo
    if (filter === 'low-stock') {
      resultado = resultado.filter((i) => i.cantidad < i.stockMinimo);
    } else if (filter !== 'all') {
      resultado = resultado.filter((i) => i.tipo === filter);
    }

    // Búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (i) =>
          i.nombre?.toLowerCase().includes(search) ||
          i.numeroParte?.toLowerCase().includes(search) ||
          i.codigoIdentificacion?.toLowerCase().includes(search)
      );
    }

    return resultado;
  }, [inventarios, filter, searchTerm]);

  const isLowStock = (item: InventarioItem) => item.cantidad < item.stockMinimo;

  return (
    <MobileLayout
      title="Inventario"
      headerActions={
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 active:scale-95 transition-all">
              <ListFilter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[85svh] overflow-y-auto pb-safe rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
            <SheetHeader className="mt-4">
              <SheetTitle className="text-center text-xl font-bold">Filtrar inventario</SheetTitle>
              <SheetDescription className="text-center">Muestra por tipo o estado de stock</SheetDescription>
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
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span>Todos los items</span>
                  <Badge variant="secondary" className="bg-background/20 text-foreground">{stats.total}</Badge>
                </div>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={filter === 'Filtro' ? 'default' : 'outline'}
                  className={cn("w-full justify-start gap-2 h-12 rounded-xl", filter === 'Filtro' && "bg-blue-600 hover:bg-blue-700 border-blue-600")}
                  onClick={() => {
                    setFilter('Filtro');
                    setFiltersOpen(false);
                  }}
                >
                  <Box className="h-4 w-4" />
                  Filtros ({stats.filtros})
                </Button>
                <Button
                  variant={filter === 'Aceite' ? 'default' : 'outline'}
                  className={cn("w-full justify-start gap-2 h-12 rounded-xl", filter === 'Aceite' && "bg-amber-600 hover:bg-amber-700 border-amber-600")}
                  onClick={() => {
                    setFilter('Aceite');
                    setFiltersOpen(false);
                  }}
                >
                  <Package className="h-4 w-4" />
                  Aceites ({stats.aceites})
                </Button>
                <Button
                  variant={filter === 'Repuesto' ? 'default' : 'outline'}
                  className={cn("w-full justify-start gap-2 h-12 rounded-xl", filter === 'Repuesto' && "bg-slate-600 hover:bg-slate-700 border-slate-600")}
                  onClick={() => {
                    setFilter('Repuesto');
                    setFiltersOpen(false);
                  }}
                >
                  <Package className="h-4 w-4" />
                  Repuestos ({stats.repuestos})
                </Button>
                <Button
                  variant={filter === 'Herramienta' ? 'default' : 'outline'}
                  className={cn("w-full justify-start gap-2 h-12 rounded-xl", filter === 'Herramienta' && "bg-purple-600 hover:bg-purple-700 border-purple-600")}
                  onClick={() => {
                    setFilter('Herramienta');
                    setFiltersOpen(false);
                  }}
                >
                  <Package className="h-4 w-4" />
                  Herram. ({stats.herramientas})
                </Button>
              </div>

              <Button
                variant={filter === 'low-stock' ? 'destructive' : 'outline'}
                className={cn(
                  "w-full justify-start gap-3 h-14 mt-2 rounded-xl border-red-200 dark:border-red-900",
                  filter === 'low-stock' && "shadow-lg shadow-red-900/20"
                )}
                onClick={() => {
                  setFilter('low-stock');
                  setFiltersOpen(false);
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className={cn(filter !== 'low-stock' && "text-red-600 dark:text-red-400")}>Stock Bajo</span>
                  <Badge variant={filter === 'low-stock' ? 'secondary' : 'destructive'} className={cn(filter === 'low-stock' && "bg-background/20 text-foreground")}>{stats.lowStock}</Badge>
                </div>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-6 pb-20">
        {/* Alertas de stock bajo Premium */}
        {stats.lowStock > 0 && filter !== 'low-stock' && (
          <div
            className="group relative flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 cursor-pointer overflow-hidden transition-all hover:bg-red-500/10 active:scale-[0.98]"
            onClick={() => setFilter('low-stock')}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-sm">
              <AlertTriangle className="h-6 w-6 animate-pulse-soft" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Atención Requerida</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {stats.lowStock} {stats.lowStock === 1 ? 'item tiene' : 'items tienen'} stock crítico
              </p>
            </div>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500 text-white font-bold text-xs shadow-md animate-pulse">
              {stats.lowStock}
            </div>
          </div>
        )}

        {/* Búsqueda y Filtros Sticky */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-xl border-b border-border/50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 h-10 rounded-xl"
            />
          </div>

          {/* Filtros chip animados */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Badge
              variant={filter === 'all' ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer px-4 py-1.5 rounded-full transition-all duration-300 whitespace-nowrap",
                filter === 'all' ? "bg-primary shadow-lg shadow-primary/25 border-0" : "hover:bg-accent"
              )}
              onClick={() => setFilter('all')}
            >
              Todos
            </Badge>
            <Badge
              variant={filter === 'Filtro' ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer px-4 py-1.5 rounded-full transition-all duration-300 whitespace-nowrap",
                filter === 'Filtro' ? "bg-blue-600 border-0 shadow-lg shadow-blue-900/20" : "hover:bg-accent"
              )}
              onClick={() => setFilter('Filtro')}
            >
              Filtros
            </Badge>
            <Badge
              variant={filter === 'Aceite' ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer px-4 py-1.5 rounded-full transition-all duration-300 whitespace-nowrap",
                filter === 'Aceite' ? "bg-amber-600 border-0 shadow-lg shadow-amber-900/20" : "hover:bg-accent"
              )}
              onClick={() => setFilter('Aceite')}
            >
              Aceites
            </Badge>
            <Badge
              variant={filter === 'Repuesto' ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer px-4 py-1.5 rounded-full transition-all duration-300 whitespace-nowrap",
                filter === 'Repuesto' ? "bg-slate-600 border-0 shadow-lg shadow-slate-900/20" : "hover:bg-accent"
              )}
              onClick={() => setFilter('Repuesto')}
            >
              Repuestos
            </Badge>
          </div>
        </div>

        {/* Grid 2 columnas */}
        {inventariosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {inventariosFiltrados.map((item, index) => (
              <MobileCard
                key={item.id}
                variant="compact"
                className={cn(
                  'relative animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards group overflow-visible',
                  isLowStock(item) ? 'border-red-500/30 bg-red-500/5' : 'bg-card/50 backdrop-blur-sm border-border/50'
                )}
                style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
              >
                {/* Dropdown actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    {isAdmin ? (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(item)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        Solo lectura
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Contenido */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold line-clamp-2 leading-tight text-foreground/90 h-8">
                        {item.nombre}
                      </p>
                    </div>
                    <p className="text-[0.65rem] text-muted-foreground font-mono bg-muted/50 rounded px-1 w-fit">
                      {item.numeroParte || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={item.activo ? 'outline' : 'secondary'} className="text-[0.6rem] px-1.5 py-0 h-4 border-primary/20 text-primary">
                      {item.tipo}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 bg-accent/5 rounded-lg p-2 border border-border/30">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[0.65rem] text-muted-foreground">Stock:</span>
                      <span
                        className={cn(
                          'text-sm font-bold',
                          isLowStock(item) ? 'text-red-600' : 'text-foreground'
                        )}
                      >
                        {item.cantidad}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", isLowStock(item) ? "bg-red-500" : "bg-primary")}
                        style={{ width: `${Math.min((item.cantidad / (item.stockMinimo * 2)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {isLowStock(item) && (
                    <div className="flex items-center gap-1 text-red-600 animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-[0.65rem] font-bold">Stock Crítico</span>
                    </div>
                  )}
                </div>
              </MobileCard>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              No hay items
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-[200px]">
              {searchTerm || filter !== 'all'
                ? 'Intenta con otros filtros'
                : 'Agrega tu primer item al inventario'}
            </p>
            {searchTerm && (
              <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}
      </div>

      {/* FAB Premium - Solo admin */}
      {isAdmin && (
        <Button
          size="lg"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 z-50"
          onClick={onAdd}
        >
          <Plus className="h-7 w-7 text-primary-foreground" />
        </Button>
      )}
    </MobileLayout>
  );
}
