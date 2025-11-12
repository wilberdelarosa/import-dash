import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Download,
  Filter,
  LayoutTemplate,
  ListChecks,
  Palette,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';
import { formatRemainingLabel } from '@/lib/maintenanceUtils';
import { cn } from '@/lib/utils';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import type { Equipo, MantenimientoProgramado } from '@/types/equipment';

interface ColumnOption {
  key: string;
  label: string;
  description: string;
  accessor: (equipo: EnrichedEquipo) => string;
}

interface EnrichedEquipo extends Equipo {
  horasKmActualesLabel: string;
  estadoMantenimiento: string;
  proximoIntervalo: string;
  proximoIntervaloDescripcion: string;
  kitRecomendado: string;
  tareasClave: string;
}

const DEFAULT_COLUMNS = ['ficha', 'nombre', 'modelo', 'categoria', 'estadoMantenimiento', 'kitRecomendado'];

const COLOR_THEMES: Record<string, { name: string; header: string; badge: string; rowHover: string; }> = {
  emerald: {
    name: 'Esmeralda',
    header: 'bg-emerald-50 text-emerald-800',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rowHover: 'hover:bg-emerald-50/60',
  },
  amber: {
    name: 'Ámbar',
    header: 'bg-amber-50 text-amber-800',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    rowHover: 'hover:bg-amber-50/60',
  },
  sky: {
    name: 'Cielo',
    header: 'bg-sky-50 text-sky-800',
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
    rowHover: 'hover:bg-sky-50/60',
  },
  slate: {
    name: 'Grafito',
    header: 'bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100',
    badge: 'border-slate-300 bg-slate-800 text-slate-100 dark:border-slate-600',
    rowHover: 'hover:bg-slate-800/60 dark:hover:bg-slate-700/50',
  },
};

const resolveIntervaloCodigo = (mantenimiento: MantenimientoProgramado | undefined | null) => {
  if (!mantenimiento) return '';
  const match = mantenimiento.tipoMantenimiento?.match(/(PM\d)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }
  if (!mantenimiento.frecuencia) return '';
  if (mantenimiento.frecuencia <= 250) return 'PM1';
  if (mantenimiento.frecuencia <= 500) return 'PM2';
  if (mantenimiento.frecuencia <= 1000) return 'PM3';
  if (mantenimiento.frecuencia <= 2000) return 'PM4';
  return '';
};

const buildColumnOptions = (): ColumnOption[] => [
  {
    key: 'ficha',
    label: 'Ficha',
    description: 'Identificador interno del equipo.',
    accessor: (equipo) => equipo.ficha,
  },
  {
    key: 'nombre',
    label: 'Nombre',
    description: 'Nombre comercial o alias operativo.',
    accessor: (equipo) => equipo.nombre,
  },
  {
    key: 'marca',
    label: 'Marca',
    description: 'Fabricante registrado del equipo.',
    accessor: (equipo) => equipo.marca,
  },
  {
    key: 'modelo',
    label: 'Modelo',
    description: 'Modelo exacto según ficha técnica.',
    accessor: (equipo) => equipo.modelo,
  },
  {
    key: 'numeroSerie',
    label: 'N° de serie',
    description: 'Número de serie físico reportado en la placa.',
    accessor: (equipo) => equipo.numeroSerie,
  },
  {
    key: 'chasis',
    label: 'Chasis',
    description: 'Serie de chasis o bastidor registrada.',
    accessor: (equipo) => equipo.chasis,
  },
  {
    key: 'categoria',
    label: 'Categoría',
    description: 'Categoría operativa utilizada para agrupar el equipo.',
    accessor: (equipo) => equipo.categoria,
  },
  {
    key: 'placa',
    label: 'Placa',
    description: 'Placa o código de activo fijo.',
    accessor: (equipo) => equipo.placa,
  },
  {
    key: 'horasKmActualesLabel',
    label: 'Lectura actual',
    description: 'Lectura de horas o kilómetros registrada en el último mantenimiento programado.',
    accessor: (equipo) => equipo.horasKmActualesLabel,
  },
  {
    key: 'estadoMantenimiento',
    label: 'Estado de mantenimiento',
    description: 'Situación del mantenimiento (al día, próximo o vencido).',
    accessor: (equipo) => equipo.estadoMantenimiento,
  },
  {
    key: 'proximoIntervalo',
    label: 'Intervalo próximo',
    description: 'Intervalo PM asociado al próximo servicio.',
    accessor: (equipo) => equipo.proximoIntervalo,
  },
  {
    key: 'proximoIntervaloDescripcion',
    label: 'Descripción del intervalo',
    description: 'Resumen de las tareas sugeridas por Caterpillar.',
    accessor: (equipo) => equipo.proximoIntervaloDescripcion,
  },
  {
    key: 'kitRecomendado',
    label: 'Kit recomendado',
    description: 'Filtros y repuestos sugeridos para la intervención.',
    accessor: (equipo) => equipo.kitRecomendado,
  },
  {
    key: 'tareasClave',
    label: 'Tareas clave',
    description: 'Actividades críticas incluidas en el kit.',
    accessor: (equipo) => equipo.tareasClave,
  },
  {
    key: 'capacitacionMinima',
    label: 'Capacitación mínima',
    description: 'Perfil mínimo sugerido para operar o intervenir el equipo.',
    accessor: (equipo) => equipo.capacitacionMinima ?? 'No definida',
  },
];

export default function ListasPersonalizadas() {
  const { data } = useSupabaseDataContext();
  const columnOptions = useMemo(() => buildColumnOptions(), []);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [colorScheme, setColorScheme] = useState<'emerald' | 'amber' | 'sky' | 'slate'>('emerald');
  const [selectedFichas, setSelectedFichas] = useState<string[]>([]);

  const categoriasDisponibles = useMemo(
    () => Array.from(new Set(data.equipos.map((equipo) => equipo.categoria))).sort(),
    [data.equipos],
  );

  const marcasDisponibles = useMemo(
    () => Array.from(new Set(data.equipos.map((equipo) => equipo.marca))).sort(),
    [data.equipos],
  );

  const columnMap = useMemo(() => {
    return columnOptions.reduce<Record<string, ColumnOption>>((acc, option) => {
      acc[option.key] = option;
      return acc;
    }, {});
  }, [columnOptions]);

  const equiposPorFicha = useMemo(() => {
    return enrichedEquipos.reduce<Map<string, EnrichedEquipo>>((acc, equipo) => {
      acc.set(equipo.ficha, equipo);
      return acc;
    }, new Map());
  }, [enrichedEquipos]);

  useEffect(() => {
    setSelectedFichas((prev) => prev.filter((ficha) => equiposPorFicha.has(ficha)));
  }, [equiposPorFicha]);

  const enrichedEquipos = useMemo<EnrichedEquipo[]>(() => {
    const cache = new Map<string, ReturnType<typeof getStaticCaterpillarData> | null>();

    const resolveCatData = (modelo: string) => {
      if (!modelo) return null;
      if (!cache.has(modelo)) {
        cache.set(modelo, getStaticCaterpillarData(modelo));
      }
      return cache.get(modelo) ?? null;
    };

    return data.equipos.map((equipo) => {
      const mantenimientos = data.mantenimientosProgramados
        .filter((mant) => mant.ficha === equipo.ficha)
        .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

      const proximoMantenimiento = mantenimientos[0];
      const horasActuales = proximoMantenimiento?.horasKmActuales ?? null;
      const intervaloCodigo = resolveIntervaloCodigo(proximoMantenimiento);
      const catData =
        equipo.marca.toLowerCase().includes('cat') || equipo.marca.toLowerCase().includes('caterpillar')
          ? resolveCatData(equipo.modelo)
          : null;

      const piezas = intervaloCodigo && catData?.piezasPorIntervalo?.[intervaloCodigo]
        ? catData.piezasPorIntervalo[intervaloCodigo]
        : [];

      const tareas = intervaloCodigo && catData?.tareasPorIntervalo?.[intervaloCodigo]
        ? catData.tareasPorIntervalo[intervaloCodigo]
        : [];

      const estadoMantenimiento = proximoMantenimiento
        ? formatRemainingLabel(proximoMantenimiento.horasKmRestante, 'horas/km')
        : 'Sin programación activa';

      return {
        ...equipo,
        horasKmActualesLabel: horasActuales !== null && horasActuales !== undefined ? `${horasActuales} horas/km` : 'Sin dato',
        estadoMantenimiento,
        proximoIntervalo: intervaloCodigo || 'No asignado',
        proximoIntervaloDescripcion:
          intervaloCodigo && catData?.intervalos?.find((intervalo) => intervalo.codigo === intervaloCodigo)?.descripcion
            ? catData.intervalos.find((intervalo) => intervalo.codigo === intervaloCodigo)!.descripcion
            : 'Sin detalle disponible para el modelo registrado.',
        kitRecomendado: piezas.length
          ? piezas
              .map((pieza) => `${pieza.pieza.numero_parte} · ${pieza.pieza.descripcion}`)
              .join(' \n')
          : 'No hay kit sugerido para este modelo.',
        tareasClave: tareas.length ? tareas.join(' \n') : 'Sin tareas recomendadas en el catálogo.',
      } satisfies EnrichedEquipo;
    });
  }, [data.equipos, data.mantenimientosProgramados]);

  const filteredEquipos = useMemo(() => {
    return enrichedEquipos.filter((equipo) => {
      if (selectedCategorias.length > 0 && !selectedCategorias.includes(equipo.categoria)) {
        return false;
      }
      if (selectedMarcas.length > 0 && !selectedMarcas.includes(equipo.marca)) {
        return false;
      }
      if (searchTerm) {
        const normalized = searchTerm.toLowerCase();
        const values = [
          equipo.nombre,
          equipo.ficha,
          equipo.modelo,
          equipo.categoria,
          equipo.marca,
          equipo.numeroSerie,
          equipo.placa,
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
  }, [enrichedEquipos, selectedCategorias, selectedMarcas, searchTerm]);

  const filteredSelectedFichas = useMemo(() => {
    const fichasSet = new Set(filteredEquipos.map((equipo) => equipo.ficha));
    return selectedFichas.filter((ficha) => fichasSet.has(ficha));
  }, [filteredEquipos, selectedFichas]);

  const selectedCount = filteredSelectedFichas.length;

  const selectedEquipos = useMemo(
    () => filteredEquipos.filter((equipo) => selectedFichas.includes(equipo.ficha)),
    [filteredEquipos, selectedFichas],
  );

  const selectionSummary = useMemo(() => {
    const resumen = new Map<string, { count: number; categoria: string }>();
    selectedFichas.forEach((ficha) => {
      const equipo = equiposPorFicha.get(ficha);
      if (!equipo) return;
      const current = resumen.get(equipo.categoria) ?? { count: 0, categoria: equipo.categoria };
      current.count += 1;
      resumen.set(equipo.categoria, current);
    });
    return Array.from(resumen.values());
  }, [selectedFichas, equiposPorFicha]);

  const toggleFicha = (ficha: string) => {
    setSelectedFichas((prev) =>
      prev.includes(ficha) ? prev.filter((item) => item !== ficha) : [...prev, ficha],
    );
  };

  const toggleAllFiltered = (checked: boolean) => {
    if (checked) {
      setSelectedFichas((prev) => {
        const current = new Set(prev);
        filteredEquipos.forEach((equipo) => current.add(equipo.ficha));
        return Array.from(current);
      });
    } else {
      setSelectedFichas((prev) => prev.filter((ficha) => !filteredSelectedFichas.includes(ficha)));
    }
  };

  const clearSelection = () => {
    setSelectedFichas((prev) => prev.filter((ficha) => !filteredSelectedFichas.includes(ficha)));
  };

  const handleToggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(key)) {
        return prev.filter((column) => column !== key);
      }
      return [...prev, key];
    });
  };

  const handleToggleCategoria = (categoria: string) => {
    setSelectedCategorias((prev) => {
      if (prev.includes(categoria)) {
        return prev.filter((item) => item !== categoria);
      }
      return [...prev, categoria];
    });
  };

  const handleToggleMarca = (marca: string) => {
    setSelectedMarcas((prev) => {
      if (prev.includes(marca)) {
        return prev.filter((item) => item !== marca);
      }
      return [...prev, marca];
    });
  };

  const handleExportCsv = () => {
    const source = selectedEquipos.length > 0 ? selectedEquipos : filteredEquipos;
    if (source.length === 0 || selectedColumns.length === 0) return;
    const header = selectedColumns.map((key) => columnMap[key]?.label ?? key);
    const rows = source.map((equipo) =>
      selectedColumns.map((key) => {
        const value = columnMap[key]?.accessor(equipo) ?? '';
        return `"${value.replace(/"/g, '""')}"`;
      }).join(','),
    );

    const csvContent = [header.join(','), ...rows].join('\n');
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

  const handleExportPdf = () => {
    const source = selectedEquipos.length > 0 ? selectedEquipos : filteredEquipos;
    if (source.length === 0 || selectedColumns.length === 0) return;
    const header = selectedColumns.map((key) => columnMap[key]?.label ?? key);
    const rows = source.map((equipo) =>
      selectedColumns
        .map((key) => `<td style="padding:8px;border:1px solid #ddd;font-size:12px;">${
          columnMap[key]?.accessor(equipo).replace(/\n/g, '<br/>') ?? ''
        }</td>`)
        .join(''),
    );

    const tableHtml = `
      <html>
        <head>
          <title>Lista personalizada</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 24px; color: #111827; }
            table { border-collapse: collapse; width: 100%; }
            th { background: #0f172a; color: white; padding: 10px; text-align: left; font-size: 13px; }
            td { vertical-align: top; }
          </style>
        </head>
        <body>
          <h2>Lista personalizada de equipos</h2>
          <table>
            <thead>
              <tr>${header.map((label) => `<th>${label}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => `<tr>${row}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const theme = COLOR_THEMES[colorScheme];
  const headerCheckboxState: boolean | 'indeterminate' = filteredEquipos.length === 0
    ? false
    : selectedCount === filteredEquipos.length
      ? true
      : selectedCount > 0
        ? 'indeterminate'
        : false;

  return (
    <Layout title="Listas personalizadas">
      <Navigation />

      <div className="space-y-6 lg:space-y-8">
        <Alert className="border-primary/40 bg-primary/5">
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Nuevas vistas dinámicas</AlertTitle>
          <AlertDescription>
            Selecciona las columnas, categorías y estilos visuales para generar listados a medida. Desde aquí puedes exportar las
            vistas a CSV (Excel) o imprimirlas en PDF para compartir con tu equipo.
          </AlertDescription>
        </Alert>

        <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Card className="border border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LayoutTemplate className="h-5 w-5" /> Configura tu lista
              </CardTitle>
              <CardDescription>
                Define qué información necesitas antes de generar la tabla.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Search className="h-4 w-4" /> Búsqueda rápida
                </Label>
                <Input
                  placeholder="Filtra por nombre, ficha, modelo o estado..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Filter className="h-4 w-4" /> Categorías
                </Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {categoriasDisponibles.map((categoria) => (
                    <label key={categoria} className="flex items-center gap-2 rounded-md border border-border/60 p-2 text-sm">
                      <Checkbox
                        checked={selectedCategorias.includes(categoria)}
                        onCheckedChange={() => handleToggleCategoria(categoria)}
                      />
                      <span>{categoria}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Tag className="h-4 w-4" /> Marcas
                </Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {marcasDisponibles.map((marca) => (
                    <label key={marca} className="flex items-center gap-2 rounded-md border border-border/60 p-2 text-sm">
                      <Checkbox
                        checked={selectedMarcas.includes(marca)}
                        onCheckedChange={() => handleToggleMarca(marca)}
                      />
                      <span>{marca}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="h-4 w-4" /> Selección manual de fichas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marca fichas específicas para exportar listas enfocadas o preparar rutas por categoría.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllFiltered(true)}
                    disabled={filteredEquipos.length === 0}
                  >
                    Seleccionar todo ({filteredEquipos.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    disabled={selectedCount === 0}
                  >
                    Limpiar selección
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCount} en esta vista
                  </Badge>
                </div>
                {selectionSummary.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectionSummary.map(({ categoria, count }) => (
                      <Badge key={categoria} variant="outline" className="border-dashed text-xs">
                        {categoria}: {count}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    No hay fichas marcadas todavía. Usa la columna de selección en la tabla para comenzar.
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {selectedEquipos.length > 0
                    ? 'Las exportaciones y reportes usarán solamente las fichas marcadas en esta vista.'
                    : 'Si no seleccionas fichas, exportaremos todos los equipos filtrados.'}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Palette className="h-4 w-4" /> Estilo de tabla
                </Label>
                <Select value={colorScheme} onValueChange={(value: 'emerald' | 'amber' | 'sky' | 'slate') => setColorScheme(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un tema" />
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

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4" /> Columnas mostradas
                </Label>
                <div className="grid max-h-[280px] grid-cols-1 gap-2 overflow-y-auto border border-border/60 p-2 sm:grid-cols-2">
                  {columnOptions.map((option) => (
                    <label key={option.key} className="flex items-start gap-2 rounded-md bg-muted/40 p-2 text-xs">
                      <Checkbox
                        checked={selectedColumns.includes(option.key)}
                        onCheckedChange={() => handleToggleColumn(option.key)}
                      />
                      <div className="space-y-1">
                        <span className="font-medium">{option.label}</span>
                        <p className="text-muted-foreground leading-snug">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/90">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg">Previsualización</CardTitle>
                <CardDescription>
                  {filteredEquipos.length} equipo{filteredEquipos.length === 1 ? '' : 's'} coinciden con los filtros aplicados.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={selectedColumns.length === 0}>
                  <Download className="mr-2 h-4 w-4" /> Exportar PDF
                </Button>
                <Button size="sm" onClick={handleExportCsv} disabled={selectedColumns.length === 0}>
                  <Download className="mr-2 h-4 w-4" /> Exportar Excel (CSV)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {filteredEquipos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 py-16 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Ajusta los filtros o las columnas para ver resultados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={theme.header}>
                        <TableHead className="w-12">
                          <Checkbox
                            aria-label="Seleccionar todos los equipos visibles"
                            checked={headerCheckboxState}
                            onCheckedChange={(checked) => toggleAllFiltered(Boolean(checked))}
                          />
                        </TableHead>
                        {selectedColumns.map((key) => (
                          <TableHead key={key} className="text-xs font-semibold uppercase tracking-wide">
                            {columnMap[key]?.label ?? key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipos.map((equipo) => {
                        const isSelected = selectedFichas.includes(equipo.ficha);
                        return (
                          <TableRow
                            key={equipo.id}
                            className={cn(
                              `${theme.rowHover} transition-colors`,
                              isSelected && 'ring-1 ring-primary/40 bg-primary/5 dark:bg-primary/10',
                            )}
                          >
                            <TableCell className="align-top">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleFicha(equipo.ficha)}
                                aria-label={`Seleccionar ${equipo.ficha}`}
                              />
                            </TableCell>
                          {selectedColumns.map((key) => {
                            const rawValue = columnMap[key]?.accessor(equipo) ?? '';
                            const parts = rawValue.split('\n');
                            return (
                              <TableCell key={`${equipo.id}-${key}`} className="align-top text-sm">
                                {parts.map((part, index) => (
                                  <span key={index} className="block">
                                    {key === 'estadoMantenimiento' ? (
                                      <Badge variant="outline" className={`${theme.badge} text-xs font-medium`}>
                                        {part}
                                      </Badge>
                                    ) : (
                                      part
                                    )}
                                  </span>
                                ))}
                              </TableCell>
                            );
                          })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
