import { useMemo, useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import {
    Search,
    Download,
    ListChecks,
    Filter,
    Palette,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    FileSpreadsheet,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRemainingLabel } from '@/lib/maintenanceUtils';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import type { Equipo, MantenimientoProgramado } from '@/types/equipment';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EnrichedEquipo extends Equipo {
    horasKmActualesLabel: string;
    estadoMantenimiento: string;
    proximoIntervalo: string;
    kitRecomendado: string;
}

const DEFAULT_COLUMNS = ['ficha', 'nombre', 'modelo', 'categoria', 'estadoMantenimiento'];

const resolveIntervaloCodigo = (mantenimiento: MantenimientoProgramado | undefined | null) => {
    if (!mantenimiento) return '';
    const match = mantenimiento.tipoMantenimiento?.match(/(PM\d)/i);
    if (match?.[1]) return match[1].toUpperCase();
    if (!mantenimiento.frecuencia) return '';
    if (mantenimiento.frecuencia <= 250) return 'PM1';
    if (mantenimiento.frecuencia <= 500) return 'PM2';
    if (mantenimiento.frecuencia <= 1000) return 'PM3';
    if (mantenimiento.frecuencia <= 2000) return 'PM4';
    return '';
};

const COLUMN_OPTIONS = [
    { key: 'ficha', label: 'Ficha' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'estadoMantenimiento', label: 'Estado Mant.' },
    { key: 'proximoIntervalo', label: 'Próximo PM' },
    { key: 'kitRecomendado', label: 'Kit Rec.' },
];

const COLOR_THEMES = {
    emerald: { name: 'Esmeralda', class: 'bg-emerald-50 dark:bg-emerald-950/20' },
    amber: { name: 'Ámbar', class: 'bg-amber-50 dark:bg-amber-950/20' },
    sky: { name: 'Cielo', class: 'bg-sky-50 dark:bg-sky-950/20' },
    slate: { name: 'Grafito', class: ' bg-slate-100 dark:bg-slate-900/20' },
};

export function ListasPersonalizadasMobile() {
    const { data } = useSupabaseDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS);
    const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
    const [selectedFichas, setSelectedFichas] = useState<string[]>([]);
    const [colorScheme, setColorScheme] = useState<keyof typeof COLOR_THEMES>('emerald');
    const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [columnsSheetOpen, setColumnsSheetOpen] = useState(false);

    const enrichedEquipos = useMemo<EnrichedEquipo[]>(() => {
        return data.equipos.map((equipo) => {
            const mantenimientos = data.mantenimientosProgramados
                .filter((mant) => mant.ficha === equipo.ficha)
                .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

            const proximoMantenimiento = mantenimientos[0];
            const horasActuales = proximoMantenimiento?.horasKmActuales ?? null;
            const intervaloCodigo = resolveIntervaloCodigo(proximoMantenimiento);
            const marcaLower = equipo.marca?.toLowerCase() ?? '';
            const catData =
                marcaLower.includes('cat') || marcaLower.includes('caterpillar')
                    ? getStaticCaterpillarData(equipo.modelo ?? '')
                    : null;

            const piezas = intervaloCodigo && catData?.piezasPorIntervalo?.[intervaloCodigo]
                ? catData.piezasPorIntervalo[intervaloCodigo]
                : [];

            const estadoMantenimiento = proximoMantenimiento
                ? formatRemainingLabel(proximoMantenimiento.horasKmRestante, 'h/km')
                : 'Sin programa';

            return {
                ...equipo,
                horasKmActualesLabel:
                    horasActuales !== null && horasActuales !== undefined ? `${horasActuales} h/km` : 'Sin dato',
                estadoMantenimiento,
                proximoIntervalo: intervaloCodigo || 'N/A',
                kitRecomendado: piezas.length
                    ? piezas.map((p) => `${p.pieza.numero_parte}`).join(', ')
                    : 'Sin kit',
            };
        });
    }, [data.equipos, data.mantenimientosProgramados]);

    const categoriasDisponibles = useMemo(
        () => Array.from(new Set(data.equipos.map((e) => e.categoria).filter(Boolean))).sort(),
        [data.equipos]
    );

    const filteredEquipos = useMemo(() => {
        return enrichedEquipos.filter((equipo) => {
            if (selectedCategorias.length > 0 && !selectedCategorias.includes(equipo.categoria)) {
                return false;
            }
            if (searchTerm) {
                const normalized = searchTerm.toLowerCase();
                const values = [
                    equipo.nombre,
                    equipo.ficha,
                    equipo.modelo,
                    equipo.categoria,
                    equipo.estadoMantenimiento,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!values.includes(normalized)) {
                    return false;
                }
            }
            return true;
        });
    }, [enrichedEquipos, selectedCategorias, searchTerm]);

    const selectedEquipos = filteredEquipos.filter((e) => selectedFichas.includes(e.ficha));

    const handleToggleColumn = (key: string) => {
        setSelectedColumns((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleToggleCategoria = (categoria: string) => {
        setSelectedCategorias((prev) =>
            prev.includes(categoria) ? prev.filter((c) => c !== categoria) : [...prev, categoria]
        );
    };

    const toggleFicha = (ficha: string) => {
        setSelectedFichas((prev) =>
            prev.includes(ficha) ? prev.filter((f) => f !== ficha) : [...prev, ficha]
        );
    };

    const handleExportCsv = () => {
        const source = selectedEquipos.length > 0 ? selectedEquipos : filteredEquipos;
        if (source.length === 0 || selectedColumns.length === 0) return;

        const header = selectedColumns.join(',');
        const rows = source.map((equipo) =>
            selectedColumns.map((key) => {
                const value = equipo[key as keyof EnrichedEquipo] ?? '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );

        const csvContent = [header, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'lista-personalizada.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <MobileLayout
            title="Listas Personalizadas"
            headerActions={
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full relative"
                        onClick={() => setFilterSheetOpen(true)}
                    >
                        <Filter className="h-5 w-5" />
                        {(selectedCategorias.length > 0 || searchTerm) && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                {selectedCategorias.length + (searchTerm ? 1 : 0)}
                            </div>
                        )}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 pb-20">
                {/* Alert informativo */}
                <MobileCard variant="glass" className="p-4 border-primary/30 bg-primary/5">
                    <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="font-semibold text-sm">Listas Dinámicas</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Personaliza columnas y filtros para crear listados exportables a Excel
                            </p>
                        </div>
                    </div>
                </MobileCard>

                {/* Controles principales */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setColumnsSheetOpen(true)}
                    >
                        <ListChecks className="h-4 w-4" />
                        Columnas ({selectedColumns.length})
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleExportCsv}
                        disabled={selectedColumns.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        Exportar
                    </Button>
                </div>

                {/* Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar equipos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-2">
                    <MobileCard variant="compact" className="text-center">
                        <p className="text-xl font-bold">{filteredEquipos.length}</p>
                        <p className="text-[0.65rem] text-muted-foreground">Equipos</p>
                    </MobileCard>
                    <MobileCard variant="compact" className="text-center border-primary/30">
                        <p className="text-xl font-bold text-primary">{selectedFichas.length}</p>
                        <p className="text-[0.65rem] text-muted-foreground">Selec.</p>
                    </MobileCard>
                    <MobileCard variant="compact" className="text-center border-emerald-500/30">
                        <p className="text-xl font-bold text-emerald-600">{selectedColumns.length}</p>
                        <p className="text-[0.65rem] text-muted-foreground">Columnas</p>
                    </MobileCard>
                </div>

                {/* Lista de equipos */}
                {filteredEquipos.length === 0 ? (
                    <div className="text-center py-12">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                        <p className="text-muted-foreground">No hay equipos que mostrar</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategorias([]);
                            }}
                        >
                            Limpiar filtros
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredEquipos.map((equipo) => {
                            const isSelected = selectedFichas.includes(equipo.ficha);
                            const isExpanded = expandedCardId === equipo.id;

                            return (
                                <MobileCard
                                    key={equipo.id}
                                    className={cn(
                                        "p-0 overflow-hidden transition-all",
                                        isSelected && "ring-2 ring-primary/30 border-primary/50"
                                    )}
                                >
                                    <div className="p-3 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleFicha(equipo.ficha)}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-sm truncate">{equipo.nombre}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">{equipo.ficha}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {equipo.categoria}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 flex-shrink-0"
                                                onClick={() => setExpandedCardId(isExpanded ? null : equipo.id)}
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Detalles principales siempre visibles */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-muted-foreground">Modelo:</span>
                                                <p className="font-medium truncate">{equipo.modelo}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Estado:</span>
                                                <p className="font-medium truncate">{equipo.estadoMantenimiento}</p>
                                            </div>
                                        </div>

                                        {/* Detalles expandidos */}
                                        {isExpanded && (
                                            <div className={cn(
                                                "pt-3 border-t border-border/50 space-y-2 text-xs animate-in slide-in-from-top-2",
                                                COLOR_THEMES[colorScheme].class
                                            )}>
                                                {selectedColumns.includes('marca') && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Marca:</span>
                                                        <span className="font-medium">{equipo.marca}</span>
                                                    </div>
                                                )}
                                                {selectedColumns.includes('proximoIntervalo') && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Próximo PM:</span>
                                                        <span className="font-medium">{equipo.proximoIntervalo}</span>
                                                    </div>
                                                )}
                                                {selectedColumns.includes('kitRecomendado') && (
                                                    <div>
                                                        <span className="text-muted-foreground block mb-1">Kit recomendado:</span>
                                                        <p className="font-medium text-[0.65rem] leading-relaxed">{equipo.kitRecomendado}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </MobileCard>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sheet de filtros */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-[2rem] border-t-0">
                    <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted mb-4" />
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </SheetTitle>
                        <SheetDescription>
                            Personaliza qué equipos mostrar
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="h-[calc(70vh-120px)] mt-6">
                        <div className="space-y-4 pr-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Categorías</label>
                                <div className="space-y-2">
                                    {categoriasDisponibles.map((categoria) => (
                                        <label
                                            key={categoria}
                                            className="flex items-center gap-2 rounded-lg border border-border/60 p-3 text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedCategorias.includes(categoria)}
                                                onCheckedChange={() => handleToggleCategoria(categoria)}
                                            />
                                            <span>{categoria}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tema de color</label>
                                <Select
                                    value={colorScheme}
                                    onValueChange={(value: keyof typeof COLOR_THEMES) => setColorScheme(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(COLOR_THEMES).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="pt-4 border-t flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setSelectedCategorias([]);
                                setSearchTerm('');
                            }}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Limpiar
                        </Button>
                        <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>
                            Aplicar
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Sheet de columnas */}
            <Sheet open={columnsSheetOpen} onOpenChange={setColumnsSheetOpen}>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-[2rem] border-t-0">
                    <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted mb-4" />
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <ListChecks className="h-5 w-5" />
                            Columnas Visibles
                        </SheetTitle>
                        <SheetDescription>
                            Selecciona qué datos mostrar y exportar
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="h-[calc(70vh-120px)] mt-6">
                        <div className="space-y-2 pr-4">
                            {COLUMN_OPTIONS.map((option) => (
                                <label
                                    key={option.key}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                                        selectedColumns.includes(option.key)
                                            ? "border-primary/50 bg-primary/5"
                                            : "border-border/60"
                                    )}
                                >
                                    <Checkbox
                                        checked={selectedColumns.includes(option.key)}
                                        onCheckedChange={() => handleToggleColumn(option.key)}
                                    />
                                    <span className="font-medium">{option.label}</span>
                                    {selectedColumns.includes(option.key) && (
                                        <Check className="h-4 w-4 ml-auto text-primary" />
                                    )}
                                </label>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="pt-4 border-t">
                        <Button className="w-full" onClick={() => setColumnsSheetOpen(false)}>
                            Listo
                        </Button>
                    </div>
            </SheetContent>
        </Sheet>
        </MobileLayout>
    );
}

