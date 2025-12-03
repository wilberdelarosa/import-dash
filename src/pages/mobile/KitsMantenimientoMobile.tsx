/**
 * Kits de Mantenimiento Móvil
 * 
 * Vista optimizada para gestión de kits en dispositivos móviles
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
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Package,
  ListFilter,
  Clock,
  Wrench,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';

interface Kit {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  marca?: string;
  modeloAplicable?: string;
  categoria?: string;
  intervaloHoras?: number;
  activo: boolean;
  piezasCount?: number;
}

interface KitsMantenimientoMobileProps {
  kits: Kit[];
  onView: (kit: Kit) => void;
  onEdit: (kit: Kit) => void;
  onDelete: (kit: Kit) => void;
  onCreate: () => void;
}

export function KitsMantenimientoMobile({
  kits,
  onView,
  onEdit,
  onDelete,
  onCreate,
}: KitsMantenimientoMobileProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { currentUserRole } = useUserRoles();
  const isAdmin = currentUserRole === 'admin';

  // Categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(kits.map(k => k.categoria).filter(Boolean));
    return Array.from(cats) as string[];
  }, [kits]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: kits.length,
    activos: kits.filter(k => k.activo).length,
    categorias: categories.length,
  }), [kits, categories]);

  // Filtrado
  const kitsFiltrados = useMemo(() => {
    return kits.filter(kit => {
      const matchSearch = !searchTerm || 
        kit.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kit.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kit.marca?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = filterCategory === 'all' || kit.categoria === filterCategory;
      
      return matchSearch && matchCategory;
    });
  }, [kits, searchTerm, filterCategory]);

  return (
    <MobileLayout
      title="Kits de Mantenimiento"
      headerActions={
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <ListFilter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px] rounded-t-[2rem]">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
            <SheetHeader className="mt-4">
              <SheetTitle className="text-center">Filtrar Kits</SheetTitle>
              <SheetDescription className="text-center">Por categoría</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-2 px-4">
              <Button
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                className="w-full justify-start h-12 rounded-xl"
                onClick={() => {
                  setFilterCategory('all');
                  setFiltersOpen(false);
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                Todos los kits
                <Badge variant="secondary" className="ml-auto">{stats.total}</Badge>
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={filterCategory === cat ? 'default' : 'outline'}
                  className="w-full justify-start h-12 rounded-xl"
                  onClick={() => {
                    setFilterCategory(cat);
                    setFiltersOpen(false);
                  }}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  {cat}
                  <Badge variant="secondary" className="ml-auto">
                    {kits.filter(k => k.categoria === cat).length}
                  </Badge>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <MobileCard variant="glass" className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Total</p>
          </MobileCard>
          <MobileCard variant="glass" className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.activos}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Activos</p>
          </MobileCard>
          <MobileCard variant="glass" className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.categorias}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Categorías</p>
          </MobileCard>
        </div>

        {/* Search */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar kit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0"
            />
          </div>
        </div>

        {/* Lista */}
        {kitsFiltrados.length > 0 ? (
          <div className="space-y-3">
            {kitsFiltrados.map((kit, index) => (
              <MobileCard
                key={kit.id}
                variant="compact"
                className={cn(
                  "relative group animate-in slide-in-from-bottom-4 fade-in",
                  !kit.activo && "opacity-60"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3" onClick={() => onView(kit)}>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{kit.codigo}</span>
                      {!kit.activo && <Badge variant="secondary" className="text-[9px]">Inactivo</Badge>}
                    </div>
                    <h4 className="font-semibold text-sm truncate">{kit.nombre}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {kit.marca && <span>{kit.marca}</span>}
                      {kit.intervaloHoras && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {kit.intervaloHoras}h
                        </span>
                      )}
                    </div>
                    {kit.categoria && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        {kit.categoria}
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onView(kit)} className="gap-2">
                      <Eye className="h-4 w-4" />
                      Ver detalle
                    </DropdownMenuItem>
                    {isAdmin ? (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(kit)} className="gap-2">
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(kit)} 
                          className="gap-2 text-destructive focus:text-destructive"
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
              </MobileCard>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold">No hay kits</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'Intenta con otra búsqueda' : 'Crea tu primer kit de mantenimiento'}
            </p>
          </div>
        )}
      </div>

      {/* FAB - Solo admin */}
      {isAdmin && (
        <Button
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/30 z-50"
          onClick={onCreate}
        >
          <Plus className="h-7 w-7" />
        </Button>
      )}
    </MobileLayout>
  );
}
