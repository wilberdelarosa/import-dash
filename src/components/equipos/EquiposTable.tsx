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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Trash2, Edit, Search, Filter, ZoomIn, ZoomOut, Sparkles, Lock } from 'lucide-react';
import { Equipo } from '@/types/equipment';
import { EquipoDialog } from './EquipoDialog';
import { EquipoLink } from '@/components/EquipoLink';
import { usePermissions } from '@/hooks/usePermissions';

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  transporte: ['camion', 'camiones', 'volquete', 'dump truck', 'haul truck'],
  camiones: ['camion', 'camiones', 'volquete', 'haul truck'],
  excavadora: ['excavadora', 'excavadoras'],
  excavacion: ['excavadora', 'excavadoras', 'zanjadora'],
  carga: ['cargador', 'cargadores', 'loader'],
  minicargadores: ['minicargador', 'minicargadores', 'skid steer'],
  retroexcavadora: ['retroexcavadora', 'retroexcavadoras', 'retropala', 'backhoe'],
  retropalas: ['retropala', 'retropalas', 'retroexcavadora'],
  miniexcavadora: ['mini excavadora', 'miniexcavadora', 'mini retro'],
  compactador: ['rodillo', 'rodillos', 'compactador', 'compactadora'],
  rodillos: ['rodillo', 'rodillos', 'compactador'],
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

interface EquiposTableProps {
  equipos: Equipo[];
  onEdit: (equipo: Equipo) => void;
  onDelete: (id: number) => void;
  onVerDetalle?: (ficha: string) => void;
}

export function EquiposTable({ equipos, onEdit, onDelete, onVerDetalle }: EquiposTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [smartQuery, setSmartQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterActivo, setFilterActivo] = useState('all');
  const [tableScale, setTableScale] = useState(1);
  
  const { canEdit, canDelete } = usePermissions();
  const canEditEquipos = canEdit('equipos');
  const canDeleteEquipos = canDelete('equipos');

  const categorias = useMemo(() => [...new Set(equipos.map(eq => eq.categoria))], [equipos]);
  const marcas = useMemo(() => [...new Set(equipos.map(eq => eq.marca))], [equipos]);

  const categoriaLexicon = useMemo(() => {
    return categorias.map((categoria) => {
      const normalizedKey = normalizeText(categoria);
      const synonyms = CATEGORY_SYNONYMS[normalizedKey] ?? [];
      const tokens = new Set([normalizedKey, ...synonyms.map((syn) => normalizeText(syn))]);
      return { categoria, tokens };
    });
  }, [categorias]);

  const smartFilters = useMemo(() => {
    const normalizedQuery = normalizeText(smartQuery);
    if (!normalizedQuery) {
      return { predicate: null as ((equipo: Equipo) => boolean) | null, tags: [] as string[] };
    }

    const tags: string[] = [];
    const excludeBrands: string[] = [];
    const includeBrands: string[] = [];
    const restrictCategories = new Set<string>();
    const mentionedCategories = new Set<string>();
    const categoryConstraints: Record<string, { fichaMin?: string }> = {};
    let globalFichaMin: string | null = null;

    const resolveCategoria = (term: string) => {
      const normalizedTerm = normalizeText(term);
      const found = categoriaLexicon.find(({ tokens }) =>
        Array.from(tokens).some((token) => normalizedTerm.includes(token) || token.includes(normalizedTerm)),
      );
      return found?.categoria;
    };

    const resolveMarca = (term: string) => {
      const normalizedTerm = normalizeText(term);
      const found = marcas.find((marca) => {
        const normalizedMarca = normalizeText(marca);
        return normalizedMarca.includes(normalizedTerm) || normalizedTerm.includes(normalizedMarca);
      });
      return found ?? term.trim();
    };

    categoriaLexicon.forEach(({ categoria, tokens }) => {
      if (Array.from(tokens).some((token) => normalizedQuery.includes(token))) {
        mentionedCategories.add(categoria);
      }
    });

    const brandExcludeRegex = /no\s+(?:son|sean)\s+([a-z0-9\s]+)/g;
    let brandMatch;
    while ((brandMatch = brandExcludeRegex.exec(normalizedQuery)) !== null) {
      const brandTerm = brandMatch[1].trim();
      if (!brandTerm) continue;
      const matchedBrand = resolveMarca(brandTerm);
      const normalizedBrand = normalizeText(matchedBrand);
      if (!excludeBrands.includes(normalizedBrand)) {
        excludeBrands.push(normalizedBrand);
        tags.push(`Excluir marca: ${matchedBrand}`);
      }
    }

    const onlyMatches = [...normalizedQuery.matchAll(/solo\s+(?:los|las)?\s*([a-z0-9\s]+)/g)];
    onlyMatches.forEach((match) => {
      const term = match[1];
      const categoria = resolveCategoria(term);
      if (categoria) {
        restrictCategories.add(categoria);
        tags.push(`Solo categorÃ­a: ${categoria}`);
        mentionedCategories.add(categoria);
      } else {
        const matchedBrand = resolveMarca(term);
        const normalizedBrand = normalizeText(matchedBrand);
        if (!includeBrands.includes(normalizedBrand)) {
          includeBrands.push(normalizedBrand);
          tags.push(`Incluir marca: ${matchedBrand}`);
        }
      }
    });

    const mustMatchBrand = [...normalizedQuery.matchAll(/que\s+sean\s+([a-z0-9\s]+)/g)];
    mustMatchBrand.forEach((match) => {
      const matchedBrand = resolveMarca(match[1]);
      const normalizedBrand = normalizeText(matchedBrand);
      if (!includeBrands.includes(normalizedBrand)) {
        includeBrands.push(normalizedBrand);
        tags.push(`Solo marca: ${matchedBrand}`);
      }
    });

    const fichaMatch = normalizedQuery.match(/superan\s+la\s+ficha\s+([a-z0-9-]+)/);
    if (fichaMatch) {
      const fichaValue = fichaMatch[1].toUpperCase();
      if (mentionedCategories.size > 0) {
        mentionedCategories.forEach((categoria) => {
          categoryConstraints[categoria] = {
            ...(categoryConstraints[categoria] ?? {}),
            fichaMin: fichaValue,
          };
          tags.push(`Ficha > ${fichaValue} en ${categoria}`);
        });
      } else {
        globalFichaMin = fichaValue;
        tags.push(`Ficha > ${fichaValue}`);
      }
    }

    const predicate = (equipo: Equipo) => {
      const normalizedMarca = normalizeText(equipo.marca);

      if (excludeBrands.some((brand) => normalizedMarca.includes(brand))) {
        return false;
      }

      if (includeBrands.length && !includeBrands.some((brand) => normalizedMarca.includes(brand))) {
        return false;
      }

      if (restrictCategories.size > 0 && !restrictCategories.has(equipo.categoria)) {
        return false;
      }

      const categoriaConstraint = categoryConstraints[equipo.categoria];
      const fichaActual = equipo.ficha?.toUpperCase() ?? '';

      if (categoriaConstraint?.fichaMin && fichaActual <= categoriaConstraint.fichaMin) {
        return false;
      }

      if (globalFichaMin && fichaActual <= globalFichaMin) {
        return false;
      }

      return true;
    };

    return { predicate, tags };
  }, [smartQuery, categoriaLexicon, marcas]);

  const clampScale = (value: number) => Math.min(1.4, Math.max(0.8, Number(value.toFixed(2))));
  const handleScaleChange = (value: number[]) => {
    if (!value.length) return;
    setTableScale(clampScale(value[0]));
  };

  const adjustScale = (delta: number) => {
    setTableScale((prev) => clampScale(prev + delta));
  };

  const filteredEquipos = equipos
    .filter(equipo => {
      const matchesSearch = Object.values(equipo)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategoria = filterCategoria === 'all' || equipo.categoria === filterCategoria;
      const matchesActivo = filterActivo === 'all' ||
        (filterActivo === 'activo' && equipo.activo) ||
        (filterActivo === 'inactivo' && !equipo.activo);
      const matchesSmart = smartFilters.predicate ? smartFilters.predicate(equipo) : true;

      return matchesSearch && matchesCategoria && matchesActivo && matchesSmart;
    })
    .sort((a, b) => {
      // Ordenar por ficha de menor a mayor
      return a.ficha.localeCompare(b.ficha, 'es', { numeric: true, sensitivity: 'base' });
    });

  const renderFilterControls = () => (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
      <div className="w-full space-y-3 sm:max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            placeholder={'Búsqueda inteligente (ej. "equipos que no son Caterpillar y camiones con ficha > AC-44")'}
            value={smartQuery}
            onChange={(e) => setSmartQuery(e.target.value)}
            className="pl-10 text-sm"
            aria-label="Búsqueda inteligente con IA"
          />
        </div>
        {smartFilters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {smartFilters.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-primary/40 bg-primary/5 text-xs font-medium text-primary"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="CategorÃ­a" />
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

      <div className="rounded-2xl border border-border/70 bg-card/80 p-2 shadow-lg ring-1 ring-primary/5 dark:border-slate-800 dark:bg-slate-950/40 sm:p-4">
        <div
          className={cn('overflow-x-auto', tableScale > 1 ? 'pb-4' : undefined)}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <div className="rounded-xl bg-background/80 p-2 shadow-inner dark:bg-slate-900/70">
            <div
              className="origin-top-left"
              style={{
                transform: `scale(${tableScale})`,
                transformOrigin: 'top left',
                width: `${100 / tableScale}%`,
              }}
            >
              <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>N° Serie</TableHead>
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
                    <TableCell>
                      <EquipoLink ficha={equipo.ficha} variant="link" className="p-0 h-auto font-normal hover:underline">
                        {equipo.nombre}
                      </EquipoLink>
                    </TableCell>
                    <TableCell>{equipo.marca}</TableCell>
                    <TableCell>{equipo.modelo}</TableCell>
                    <TableCell>{equipo.numeroSerie}</TableCell>
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
                        {canEditEquipos ? (
                          <EquipoDialog
                            equipo={equipo}
                            onSave={onEdit}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            }
                          />
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" disabled className="opacity-50">
                                  <Lock className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Solo administradores pueden editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {canDeleteEquipos ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(equipo.id)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" disabled className="opacity-50">
                                  <Lock className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Solo administradores pueden eliminar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
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

