import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Trash2, Edit, Search, Filter, ZoomIn, ZoomOut } from 'lucide-react';
import { Equipo } from '@/types/equipment';
import { EquipoDialog } from './EquipoDialog';

interface EquiposTableProps {
  equipos: Equipo[];
  onEdit: (equipo: Equipo) => void;
  onDelete: (id: number) => void;
  onVerDetalle?: (ficha: string) => void;
}

export function EquiposTable({ equipos, onEdit, onDelete, onVerDetalle }: EquiposTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterActivo, setFilterActivo] = useState('all');
  const [tableScale, setTableScale] = useState(1);

  const categorias = useMemo(() => [...new Set(equipos.map(eq => eq.categoria))], [equipos]);

  const clampScale = (value: number) => Math.min(1.4, Math.max(0.8, Number(value.toFixed(2))));
  const handleScaleChange = (value: number[]) => {
    if (!value.length) return;
    setTableScale(clampScale(value[0]));
  };

  const adjustScale = (delta: number) => {
    setTableScale((prev) => clampScale(prev + delta));
  };

  const filteredEquipos = equipos.filter(equipo => {
    const matchesSearch = Object.values(equipo)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategoria = filterCategoria === 'all' || equipo.categoria === filterCategoria;
    const matchesActivo = filterActivo === 'all' ||
      (filterActivo === 'activo' && equipo.activo) ||
      (filterActivo === 'inactivo' && !equipo.activo);

    return matchesSearch && matchesCategoria && matchesActivo;
  });

  const renderFilterControls = () => (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar equipos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActivo} onValueChange={setFilterActivo}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Sheet>
            <div className="flex items-center justify-between gap-2 sm:hidden">
              <span className="text-sm font-semibold text-primary">Filtros</span>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Ajustar filtros
                </Button>
              </SheetTrigger>
            </div>
            <div className="hidden w-full sm:block">{renderFilterControls()}</div>
            <SheetContent side="bottom" className="sm:hidden">
              <SheetHeader className="text-left">
                <SheetTitle>Filtros y búsqueda</SheetTitle>
                <SheetDescription>Refina la tabla para encontrar el equipo que necesitas.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {renderFilterControls()}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zoom</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => adjustScale(-0.1)}
                aria-label="Reducir zoom de la tabla"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[tableScale]}
                min={0.8}
                max={1.4}
                step={0.05}
                onValueChange={handleScaleChange}
                className="w-32 sm:w-40"
                aria-label="Control de zoom"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => adjustScale(0.1)}
                aria-label="Aumentar zoom de la tabla"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-sm font-medium text-muted-foreground">
                {Math.round(tableScale * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card p-2 sm:p-4 shadow-sm">
        <div
          className={cn(
            'overflow-x-auto',
            tableScale > 1 ? 'pb-4' : undefined
          )}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <div
            className="origin-top-left"
            style={{
              transform: `scale(${tableScale})`,
              transformOrigin: 'top left',
              width: `${100 / tableScale}%`,
            }}
          >
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/40 text-muted-foreground dark:bg-muted/20">
                  <TableHead>Ficha</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipos.map((equipo) => (
                  <TableRow key={equipo.id}>
                    <TableCell className="font-medium">{equipo.ficha}</TableCell>
                    <TableCell>{equipo.nombre}</TableCell>
                    <TableCell>{equipo.marca}</TableCell>
                    <TableCell>{equipo.modelo}</TableCell>
                    <TableCell>{equipo.categoria}</TableCell>
                    <TableCell>{equipo.placa}</TableCell>
                    <TableCell>
                      <Badge variant={equipo.activo ? "default" : "secondary"}>
                        {equipo.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {onVerDetalle && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onVerDetalle(equipo.ficha)}
                          >
                            Ver Detalle
                          </Button>
                        )}
                        <EquipoDialog
                          equipo={equipo}
                          onSave={onEdit}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(equipo.id)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {filteredEquipos.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No se encontraron equipos que coincidan con los filtros seleccionados.
        </div>
      )}
    </div>
  );
}
