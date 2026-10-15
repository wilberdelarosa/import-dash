import { Fragment, useMemo, useState } from 'react';
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
import { Trash2, Edit, Search, Filter, ZoomIn, ZoomOut, Sparkles, Lock, Building2, Tag, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Equipo, EMPRESAS_DISPONIBLES, isEquipoVendido } from '@/types/equipment';
import { EquipoDialog } from './EquipoDialog';
import { EquipoLink } from '@/components/EquipoLink';
import { usePermissions } from '@/hooks/usePermissions';
import { EquipmentFieldControls } from './EquipmentFieldControls';
import { compareEquipment, equipmentFields, equipmentCompanyLabel, matchesEquipmentSearch, type EquipmentSearchField, type EquipmentSortField, type EquipmentSortDirection } from '@/lib/equipment-list';

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
  // VP-XXX: Vehículos Personales (nueva categoría)
  vehiculopersonal: ['vehiculo personal', 'vp', 'carro', 'auto', 'automovil', 'particular'],
  vehiculopersonalvp: ['vehiculo personal', 'vp', 'carro', 'auto', 'particular'],
  telehandler: ['telehandler', 'manipulador', 'telescopico'],
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
  const [searchField, setSearchField] = useState<EquipmentSearchField>('all');
  const [sortField, setSortField] = useState<EquipmentSortField>('ficha');
  const [sortDirection, setSortDirection] = useState<EquipmentSortDirection>('asc');
  const [filterMarca, setFilterMarca] = useState('all');
  const selectSortField = (field: EquipmentSortField) => { setSortField(field); setSortDirection('asc'); };
  const toggleColumn = (field: EquipmentSortField) => {
    setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };
  const [smartQuery, setSmartQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  // Por defecto mostrar solo activos (oculta vendidos e inactivos)
  const [filterActivo, setFilterActivo] = useState('activo');
  const [tableScale, setTableScale] = useState(1);
  
  const { canEdit, canDelete } = usePermissions();
  const canEditEquipos = canEdit('equipos');
  const canDeleteEquipos = canDelete('equipos');

  const categorias = useMemo(() => [...new Set(equipos.map(eq => eq.categoria))].filter(cat => cat && cat.trim() !== ''), [equipos]);
  const marcas = useMemo(() => [...new Set(equipos.map(eq => eq.marca))].filter(marca => marca && marca.trim() !== ''), [equipos]);

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
      const matchesSearch = matchesEquipmentSearch(equipo, searchField, searchTerm);
      const matchesMarca = filterMarca === 'all' || equipo.marca === filterMarca;

      const matchesCategoria = filterCategoria === 'all' || equipo.categoria === filterCategoria;
      const matchesEmpresa = filterEmpresa === 'all' || equipo.empresa === filterEmpresa;
      
      // Lógica de filtro por estado (incluye vendidos)
      const esVendido = isEquipoVendido(equipo.empresa);
      let matchesActivo = false;
      
      switch (filterActivo) {
        case 'all':
          // Todos excepto vendidos (para ver vendidos usar 'vendido')
          matchesActivo = !esVendido;
          break;
        case 'activo':
          // Solo activos y no vendidos
          matchesActivo = equipo.activo && !esVendido;
          break;
        case 'inactivo':
          // Solo inactivos pero no vendidos
          matchesActivo = !equipo.activo && !esVendido;
          break;
        case 'vendido':
          // Solo vendidos
          matchesActivo = esVendido;
          break;
        case 'todo':
          // Absolutamente todos (incluyendo vendidos)
          matchesActivo = true;
          break;
        default:
          matchesActivo = true;
      }
      
      const matchesSmart = smartFilters.predicate ? smartFilters.predicate(equipo) : true;

      return matchesSearch && matchesMarca && matchesCategoria && matchesEmpresa && matchesActivo && matchesSmart;
    })
    .sort((a, b) => compareEquipment(a, b, sortField, sortDirection));

  const renderFilterControls = () => (
    <div className="grid w-full min-w-0 gap-4 xl:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <EquipmentFieldControls query={searchTerm} onQueryChange={setSearchTerm} searchField={searchField} onSearchFieldChange={setSearchField} sortField={sortField} onSortFieldChange={selectSortField} direction={sortDirection} onDirectionChange={setSortDirection} />
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
      <div className="grid min-w-0 content-start gap-3 sm:grid-cols-2">
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger aria-label="Filtrar por categoría" className="h-11 w-full min-w-0">
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
        <Select value={filterMarca} onValueChange={setFilterMarca}>
          <SelectTrigger aria-label="Filtrar por marca" className="h-11 w-full min-w-0"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas las marcas</SelectItem>{marcas.map(marca => <SelectItem key={marca} value={marca}>{marca}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
          <SelectTrigger aria-label="Filtrar por empresa" className="h-11 w-full min-w-0">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {EMPRESAS_DISPONIBLES.map(emp => (
              <SelectItem key={emp} value={emp}>{emp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActivo} onValueChange={setFilterActivo}>
          <SelectTrigger aria-label="Filtrar por estado" className="h-11 w-full min-w-0">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos (sin vendidos)</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
            <SelectItem value="vendido" className="text-orange-600">⚠️ Vendidos</SelectItem>
            <SelectItem value="todo" className="text-muted-foreground">📋 Absolutamente todos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-4">
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
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto sm:hidden">
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

      <div className="min-w-0 max-w-full rounded-lg border border-border bg-card p-2 sm:p-4">
        <div
          className={cn('max-w-full overflow-x-auto overscroll-x-contain touch-auto', tableScale > 1 ? 'pb-4' : undefined)}
        >
          <div className="rounded-lg bg-background p-2">
            <div
              className="origin-top-left"
              style={{
                transform: `scale(${tableScale})`,
                transformOrigin: 'top left',
                width: `${100 / tableScale}%`,
              }}
            >
              <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  {equipmentFields.map(field => <TableHead key={field.key} aria-sort={sortField === field.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <Button variant="ghost" className="h-11 gap-2 whitespace-nowrap px-2" onClick={() => toggleColumn(field.key)} aria-label={`Ordenar por ${field.label}`}>
                      {field.label}{sortField === field.key ? (sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </TableHead>)}
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipos.map((equipo, index) => (
                  <Fragment key={equipo.id}>
                  {sortField === 'ficha' && (index === 0 || filteredEquipos[index - 1]?.empresa !== equipo.empresa) && <TableRow data-company-group={equipmentCompanyLabel(equipo)} className="border-t-2 border-border bg-muted/50 hover:bg-muted/50"><TableCell colSpan={11} className="py-3 text-xs font-semibold text-muted-foreground">{equipo.empresa}</TableCell></TableRow>}
                  <TableRow data-equipment-row={equipo.ficha}>
                    <TableCell className="font-medium">{equipo.ficha}</TableCell>
                    <TableCell>
                      <EquipoLink ficha={equipo.ficha} variant="link" className="p-0 h-auto font-normal hover:underline">
                        {equipo.nombre}
                      </EquipoLink>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-semibold whitespace-nowrap",
                          equipo.empresa === 'VENDIDO'
                            ? 'border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400'
                            : equipo.empresa === 'ALITO GROUP SRL' 
                              ? 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400' 
                              : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        )}
                      >
                        {equipo.empresa === 'VENDIDO' ? '⚠️ VENDIDO' : equipo.empresa === 'ALITO GROUP SRL' ? 'GROUP' : 'EIRL'}
                      </Badge>
                    </TableCell>
                    <TableCell>{equipo.marca}</TableCell>
                    <TableCell>{equipo.modelo}</TableCell>
                    <TableCell>{equipo.numeroSerie}</TableCell>
                    <TableCell>{equipo.categoria}</TableCell>
                    <TableCell>{equipo.segmento || '—'}</TableCell>
                    <TableCell>{equipo.placa}</TableCell>
                    <TableCell>
                      {isEquipoVendido(equipo.empresa) ? (
                        <Badge variant="outline" className="border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400">
                          Vendido
                        </Badge>
                      ) : (
                        <Badge variant={equipo.activo ? "default" : "secondary"}>
                          {equipo.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      )}
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
                  </Fragment>
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

