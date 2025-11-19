/**
 * Inventario Móvil
 * 
 * Características:
 * - Grid de cards compacto (2 columnas)
 * - Tabs de categorías (filtros y chips)
 * - Alertas de stock bajo destacadas
 * - Búsqueda con Input
 * - Acciones por item (edit, delete)
 * - FAB para agregar nuevo
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Package,
  Search,
  Filter,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Inventario as InventarioItem } from '@/types/equipment';

interface InventarioMobileProps {
  inventarios: InventarioItem[];
  onAdd: () => void;
  onEdit: (item: InventarioItem) => void;
  onDelete: (item: InventarioItem) => void;
}

type FilterType = 'all' | 'Filtro' | 'Aceite' | 'Repuesto' | 'Herramienta' | 'low-stock';

export function InventarioMobile({
  inventarios,
  onAdd,
  onEdit,
  onDelete,
}: InventarioMobileProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Estadísticas
  const stats = useMemo(() => {
    const total = inventarios.length;
    const filtros = inventarios.filter((i) => i.tipo === 'Filtro').length;
    const aceites = inventarios.filter((i) => i.tipo === 'Aceite').length;
    const repuestos = inventarios.filter((i) => i.tipo === 'Repuesto').length;
    const herramientas = inventarios.filter((i) => i.tipo === 'Herramienta').length;
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
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Filter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[450px]">
            <SheetHeader>
              <SheetTitle>Filtrar inventario</SheetTitle>
              <SheetDescription>Muestra por tipo o estado de stock</SheetDescription>
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
                <Package className="h-4 w-4" />
                Todos ({stats.total})
              </Button>
              <Button
                variant={filter === 'Filtro' ? 'default' : 'outline'}
                className="w-full justify-start gap-2"
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
                className="w-full justify-start gap-2"
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
                className="w-full justify-start gap-2"
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
                className="w-full justify-start gap-2"
                onClick={() => {
                  setFilter('Herramienta');
                  setFiltersOpen(false);
                }}
              >
                <Package className="h-4 w-4" />
                Herramientas ({stats.herramientas})
              </Button>
              <Button
                variant={filter === 'low-stock' ? 'destructive' : 'outline'}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setFilter('low-stock');
                  setFiltersOpen(false);
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                Stock Bajo ({stats.lowStock})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-4">
        {/* Alertas de stock bajo */}
        {stats.lowStock > 0 && filter !== 'low-stock' && (
          <div
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 cursor-pointer"
            onClick={() => setFilter('low-stock')}
          >
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-600">Stock Bajo</p>
              <p className="text-xs text-red-600/80 truncate">
                {stats.lowStock} {stats.lowStock === 1 ? 'item necesita' : 'items necesitan'} reabastecimiento
              </p>
            </div>
            <Badge variant="destructive">{stats.lowStock}</Badge>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, número de parte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
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
            variant={filter === 'Filtro' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('Filtro')}
          >
            Filtros
          </Badge>
          <Badge
            variant={filter === 'Aceite' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('Aceite')}
          >
            Aceites
          </Badge>
          <Badge
            variant={filter === 'Repuesto' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('Repuesto')}
          >
            Repuestos
          </Badge>
          <Badge
            variant={filter === 'Herramienta' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('Herramienta')}
          >
            Herramientas
          </Badge>
        </div>

        {/* Grid 2 columnas */}
        {inventariosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {inventariosFiltrados.map((item) => (
              <MobileCard
                key={item.id}
                variant="compact"
                className={cn(
                  'relative',
                  isLowStock(item) && 'border-red-500/50 bg-red-500/5'
                )}
              >
                {/* Dropdown actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Contenido */}
                <div className="space-y-2 pr-8">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold line-clamp-2 leading-tight">
                      {item.nombre}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground truncate">
                      {item.numeroParte || 'Sin número de parte'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[0.6rem] px-1 py-0">
                      {item.tipo}
                    </Badge>
                  </div>

                  <div className="space-y-1">
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
                    <div className="flex items-baseline justify-between">
                      <span className="text-[0.65rem] text-muted-foreground">Mínimo:</span>
                      <span className="text-xs">{item.stockMinimo}</span>
                    </div>
                  </div>

                  {isLowStock(item) && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-[0.65rem] font-medium">Stock bajo</span>
                    </div>
                  )}
                </div>
              </MobileCard>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay items en inventario
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {searchTerm || filter !== 'all'
                ? 'Intenta con otros filtros'
                : 'Agrega tu primer item'}
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={onAdd}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </MobileLayout>
  );
}
