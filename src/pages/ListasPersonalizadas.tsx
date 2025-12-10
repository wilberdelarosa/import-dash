import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check,
  ChevronDown,
  Download,
  Edit2,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  LayoutTemplate,
  ListChecks,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatRemainingLabel } from '@/lib/maintenanceUtils';
import { cn } from '@/lib/utils';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import type { Equipo, MantenimientoProgramado } from '@/types/equipment';
import { isEquipoVendido } from '@/types/equipment';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { ListasPersonalizadasMobile } from '@/pages/mobile/ListasPersonalizadasMobile';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface ListaGuardada {
  id: string;
  nombre: string;
  descripcion?: string;
  fichas: string[];
  columnas: string[];
  colorScheme: string;
  createdAt: string;
  updatedAt: string;
}

interface ColumnOption {
  key: string;
  label: string;
  description: string;
  group: 'basico' | 'mantenimiento' | 'avanzado';
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

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'import-dash-listas-guardadas';
const DEFAULT_COLUMNS = ['ficha', 'nombre', 'marca', 'modelo', 'numeroSerie', 'placa'];

const COLOR_THEMES: Record<string, { name: string; header: string; badge: string; rowHover: string }> = {
  emerald: {
    name: 'Esmeralda',
    header: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    rowHover: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20',
  },
  amber: {
    name: 'Ámbar',
    header: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    rowHover: 'hover:bg-amber-50/60 dark:hover:bg-amber-900/20',
  },
  sky: {
    name: 'Cielo',
    header: 'bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
    badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    rowHover: 'hover:bg-sky-50/60 dark:hover:bg-sky-900/20',
  },
  slate: {
    name: 'Grafito',
    header: 'bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100',
    badge: 'border-slate-300 bg-slate-800 text-slate-100 dark:border-slate-600',
    rowHover: 'hover:bg-slate-100 dark:hover:bg-slate-800/50',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

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

const buildColumnOptions = (): ColumnOption[] => [
  { key: 'ficha', label: 'Ficha', description: 'Identificador interno', group: 'basico', accessor: (e) => e.ficha },
  { key: 'nombre', label: 'Nombre', description: 'Nombre del equipo', group: 'basico', accessor: (e) => e.nombre },
  { key: 'marca', label: 'Marca', description: 'Fabricante', group: 'basico', accessor: (e) => e.marca },
  { key: 'modelo', label: 'Modelo', description: 'Modelo exacto', group: 'basico', accessor: (e) => e.modelo },
  { key: 'numeroSerie', label: 'N° Serie', description: 'Número de serie', group: 'basico', accessor: (e) => e.numeroSerie },
  { key: 'placa', label: 'Placa', description: 'Placa vehicular', group: 'basico', accessor: (e) => e.placa },
  { key: 'categoria', label: 'Categoría', description: 'Tipo de equipo', group: 'basico', accessor: (e) => e.categoria },
  { key: 'empresa', label: 'Empresa', description: 'Empresa propietaria', group: 'basico', accessor: (e) => e.empresa || 'Sin asignar' },
  { key: 'activo', label: 'Estado', description: 'Activo/Inactivo', group: 'basico', accessor: (e) => (e.activo ? 'Activo' : 'Inactivo') },
  { key: 'horasKmActualesLabel', label: 'Lectura Actual', description: 'Horas o km registrados', group: 'mantenimiento', accessor: (e) => e.horasKmActualesLabel },
  { key: 'estadoMantenimiento', label: 'Estado Mant.', description: 'Estado del mantenimiento', group: 'mantenimiento', accessor: (e) => e.estadoMantenimiento },
  { key: 'proximoIntervalo', label: 'Intervalo PM', description: 'Próximo PM', group: 'mantenimiento', accessor: (e) => e.proximoIntervalo },
  { key: 'proximoIntervaloDescripcion', label: 'Descripción Intervalo', description: 'Tareas sugeridas', group: 'avanzado', accessor: (e) => e.proximoIntervaloDescripcion },
  { key: 'kitRecomendado', label: 'Kit Recomendado', description: 'Repuestos sugeridos', group: 'avanzado', accessor: (e) => e.kitRecomendado },
  { key: 'tareasClave', label: 'Tareas Clave', description: 'Actividades críticas', group: 'avanzado', accessor: (e) => e.tareasClave },
  { key: 'motivoInactividad', label: 'Motivo Inactividad', description: 'Razón si inactivo', group: 'avanzado', accessor: (e) => e.motivoInactividad || 'N/A' },
];

const generateId = () => `lista_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function ListasPersonalizadas() {
  const { isMobile } = useDeviceDetection();
  const { data, loadData } = useSupabaseDataContext();
  const columnOptions = useMemo(() => buildColumnOptions(), []);

  const [listasGuardadas, setListasGuardadas] = useState<ListaGuardada[]>([]);
  const [listaActiva, setListaActiva] = useState<ListaGuardada | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [selectedFichas, setSelectedFichas] = useState<string[]>([]);
  const [colorScheme, setColorScheme] = useState<keyof typeof COLOR_THEMES>('emerald');
  const [columnTab, setColumnTab] = useState<'basico' | 'mantenimiento' | 'avanzado'>('basico');
  const [searchFichas, setSearchFichas] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nombreNuevaLista, setNombreNuevaLista] = useState('');
  const [descripcionNuevaLista, setDescripcionNuevaLista] = useState('');
  const [editingListaId, setEditingListaId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setListasGuardadas(JSON.parse(saved) as ListaGuardada[]);
    } catch (error) {
      console.error('Error cargando listas:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listasGuardadas));
    } catch (error) {
      console.error('Error guardando listas:', error);
    }
  }, [listasGuardadas]);

  const enrichedEquipos = useMemo<EnrichedEquipo[]>(() => {
    const cache = new Map<string, ReturnType<typeof getStaticCaterpillarData> | null>();
    const resolveCatData = (modelo: string) => {
      if (!modelo) return null;
      if (!cache.has(modelo)) cache.set(modelo, getStaticCaterpillarData(modelo));
      return cache.get(modelo) ?? null;
    };
    return data.equipos.map((equipo) => {
      const mantenimientos = data.mantenimientosProgramados.filter((m) => m.ficha === equipo.ficha).sort((a, b) => a.horasKmRestante - b.horasKmRestante);
      const prox = mantenimientos[0];
      const horas = prox?.horasKmActuales ?? null;
      const codigo = resolveIntervaloCodigo(prox);
      const marcaLower = equipo.marca?.toLowerCase() ?? '';
      const catData = marcaLower.includes('cat') || marcaLower.includes('caterpillar') ? resolveCatData(equipo.modelo ?? '') : null;
      const piezas = codigo && catData?.piezasPorIntervalo?.[codigo] ? catData.piezasPorIntervalo[codigo] : [];
      const tareas = codigo && catData?.tareasPorIntervalo?.[codigo] ? catData.tareasPorIntervalo[codigo] : [];
      return {
        ...equipo,
        horasKmActualesLabel: horas !== null ? `${horas} horas/km` : 'Sin dato',
        estadoMantenimiento: prox ? formatRemainingLabel(prox.horasKmRestante, 'horas/km') : 'Sin programación',
        proximoIntervalo: codigo || 'No asignado',
        proximoIntervaloDescripcion: codigo && catData?.intervalos?.find((i) => i.codigo === codigo)?.descripcion || 'Sin detalle',
        kitRecomendado: piezas.length ? piezas.map((p) => `${p.pieza.numero_parte} — ${p.pieza.descripcion}`).join('\n') : 'No hay kit',
        tareasClave: tareas.length ? tareas.join('\n') : 'Sin tareas',
      } satisfies EnrichedEquipo;
    });
  }, [data.equipos, data.mantenimientosProgramados]);

  const equiposPorFicha = useMemo(() => new Map(enrichedEquipos.map((e) => [e.ficha, e])), [enrichedEquipos]);

  const fichasDisponibles = useMemo(() => {
    const terms = searchFichas.toLowerCase().trim().split(',').map((t) => t.trim()).filter(Boolean);
    return enrichedEquipos
      .filter((eq) => {
        if (isEquipoVendido(eq.empresa)) return false;
        if (terms.length === 0) return true;
        const text = [eq.ficha, eq.nombre, eq.marca, eq.modelo, eq.categoria, eq.numeroSerie, eq.placa, eq.empresa].filter(Boolean).join(' ').toLowerCase();
        return terms.some((t) => text.includes(t));
      })
      .sort((a, b) => a.ficha.localeCompare(b.ficha, 'es', { numeric: true }));
  }, [enrichedEquipos, searchFichas]);

  const selectedEquipos = useMemo(() => selectedFichas.map((f) => equiposPorFicha.get(f)).filter(Boolean) as EnrichedEquipo[], [selectedFichas, equiposPorFicha]);
  const columnMap = useMemo(() => columnOptions.reduce<Record<string, ColumnOption>>((acc, o) => ({ ...acc, [o.key]: o }), {}), [columnOptions]);
  const columnsByGroup = useMemo(() => ({ basico: columnOptions.filter((c) => c.group === 'basico'), mantenimiento: columnOptions.filter((c) => c.group === 'mantenimiento'), avanzado: columnOptions.filter((c) => c.group === 'avanzado') }), [columnOptions]);
  const theme = COLOR_THEMES[colorScheme];

  const handleToggleFicha = (ficha: string) => setSelectedFichas((prev) => (prev.includes(ficha) ? prev.filter((f) => f !== ficha) : [...prev, ficha]));
  const handleRemoveFicha = (ficha: string) => setSelectedFichas((prev) => prev.filter((f) => f !== ficha));
  const handleToggleColumn = (key: string) => setSelectedColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  const handleSelectAllColumnsInGroup = (group: 'basico' | 'mantenimiento' | 'avanzado') => { const cols = columnsByGroup[group].map((c) => c.key); setSelectedColumns((prev) => [...new Set([...prev, ...cols])]); };
  const handleClearColumnsInGroup = (group: 'basico' | 'mantenimiento' | 'avanzado') => { const cols = columnsByGroup[group].map((c) => c.key); setSelectedColumns((prev) => prev.filter((k) => !cols.includes(k))); };

  const handleSaveLista = () => {
    if (!nombreNuevaLista.trim()) { toast.error('El nombre es requerido'); return; }
    if (selectedFichas.length === 0) { toast.error('Selecciona al menos una ficha'); return; }
    const now = new Date().toISOString();
    if (editingListaId) {
      setListasGuardadas((prev) => prev.map((l) => l.id === editingListaId ? { ...l, nombre: nombreNuevaLista.trim(), descripcion: descripcionNuevaLista.trim(), fichas: selectedFichas, columnas: selectedColumns, colorScheme, updatedAt: now } : l));
      toast.success('Lista actualizada');
    } else {
      const nueva: ListaGuardada = { id: generateId(), nombre: nombreNuevaLista.trim(), descripcion: descripcionNuevaLista.trim(), fichas: selectedFichas, columnas: selectedColumns, colorScheme, createdAt: now, updatedAt: now };
      setListasGuardadas((prev) => [...prev, nueva]);
      setListaActiva(nueva);
      toast.success('Lista guardada');
    }
    setShowSaveDialog(false);
    setNombreNuevaLista('');
    setDescripcionNuevaLista('');
    setEditingListaId(null);
  };

  const handleLoadLista = (lista: ListaGuardada) => {
    setListaActiva(lista);
    setSelectedFichas(lista.fichas.filter((f) => equiposPorFicha.has(f)));
    setSelectedColumns(lista.columnas);
    setColorScheme(lista.colorScheme as keyof typeof COLOR_THEMES);
    toast.success(`Lista "${lista.nombre}" cargada`);
  };

  const handleDeleteLista = () => {
    if (!listaActiva) return;
    setListasGuardadas((prev) => prev.filter((l) => l.id !== listaActiva.id));
    setListaActiva(null);
    setSelectedFichas([]);
    setShowDeleteDialog(false);
    toast.success('Lista eliminada');
  };

  const handleNewLista = () => { setListaActiva(null); setSelectedFichas([]); setSelectedColumns(DEFAULT_COLUMNS); setColorScheme('emerald'); };

  const handleRegenerar = async () => {
    toast.info('Actualizando datos...');
    await loadData(false);
    setSelectedFichas((prev) => prev.filter((f) => equiposPorFicha.has(f)));
    toast.success('Datos actualizados');
  };

  const handleOpenSaveDialog = (isEdit = false) => {
    if (isEdit && listaActiva) { setNombreNuevaLista(listaActiva.nombre); setDescripcionNuevaLista(listaActiva.descripcion || ''); setEditingListaId(listaActiva.id); }
    else { setNombreNuevaLista(''); setDescripcionNuevaLista(''); setEditingListaId(null); }
    setShowSaveDialog(true);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (selectedEquipos.length === 0) return;
    const header = selectedColumns.map((k) => columnMap[k]?.label ?? k);
    const rows = selectedEquipos.map((e) => selectedColumns.map((k) => `"${(columnMap[k]?.accessor(e) ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(','));
    downloadFile([header.join(','), ...rows].join('\n'), `${listaActiva?.nombre || 'lista'}.csv`, 'text/csv');
    toast.success('Exportado a CSV');
  };

  const handleExportJson = () => {
    if (selectedEquipos.length === 0) return;
    const jsonData = selectedEquipos.map((e) => { const obj: Record<string, string> = {}; selectedColumns.forEach((k) => { obj[columnMap[k]?.label ?? k] = columnMap[k]?.accessor(e) ?? ''; }); return obj; });
    downloadFile(JSON.stringify(jsonData, null, 2), `${listaActiva?.nombre || 'lista'}.json`, 'application/json');
    toast.success('Exportado a JSON');
  };

  const handleExportPdf = () => {
    if (selectedEquipos.length === 0) return;
    try {
      // Decide orientation based on number of columns
      const orientation: 'portrait' | 'landscape' = selectedColumns.length > 6 ? 'landscape' : 'portrait';
      const doc = new jsPDF(orientation);

      // Header
      doc.setFontSize(16);
      doc.setTextColor(34, 34, 34);
      const title = listaActiva?.nombre || 'Lista de Equipos';
      doc.text(title, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const subtitle = listaActiva?.descripcion ? `${listaActiva.descripcion} • ` : '';
      doc.text(`${subtitle}${selectedEquipos.length} equipos • Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 26);

      // Table headers and body
      const head = [selectedColumns.map((k) => columnMap[k]?.label ?? k)];
      const body = selectedEquipos.map((e) => selectedColumns.map((k) => {
        const raw = columnMap[k]?.accessor(e) ?? '';
        // replace newlines with spaces so autotable wraps correctly
        return String(raw).replace(/\n/g, ' ');
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).autoTable({
        startY: 32,
        head,
        body,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: (() => {
          // Set some reasonable column widths based on number of columns
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const styles: Record<number, any> = {};
          const cols = selectedColumns.length;
          const base = Math.floor(180 / Math.max(cols, 1));
          for (let i = 0; i < cols; i++) styles[i] = { cellWidth: base };
          return styles;
        })(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didDrawPage: (_data: any) => {
          // Footer with page number
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pageCount = (doc as any).internal.getNumberOfPages();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(`Página ${currentPage} / ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
        }
      });

      const filename = `${(listaActiva?.nombre || 'lista').replace(/[^a-z0-9-]/gi, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success('PDF generado');
    } catch (err) {
      console.error('Error generando PDF:', err);
      toast.error('Error generando PDF');
    }
  };

  if (isMobile) return <ListasPersonalizadasMobile />;

  return (
    <Layout title="Gestor de Listas">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestor de Listas</h1>
            <p className="text-sm text-muted-foreground">Crea, guarda y exporta listas personalizadas de equipos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleNewLista}><Plus className="mr-2 h-4 w-4" /> Nueva Lista</Button>
            {listasGuardadas.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><FolderOpen className="mr-2 h-4 w-4" /> Mis Listas ({listasGuardadas.length})<ChevronDown className="ml-2 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {listasGuardadas.map((lista) => (
                    <DropdownMenuItem key={lista.id} onClick={() => handleLoadLista(lista)} className="flex flex-col items-start">
                      <span className="font-medium">{lista.nombre}</span>
                      <span className="text-xs text-muted-foreground">{lista.fichas.length} equipos • {new Date(lista.updatedAt).toLocaleDateString('es-DO')}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {listaActiva && (
          <Alert className="border-primary/40 bg-primary/5">
            <ListChecks className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">{listaActiva.nombre}<Badge variant="secondary" className="text-xs">{selectedFichas.length} equipos</Badge></AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{listaActiva.descripcion || 'Sin descripción'}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenSaveDialog(true)}><Edit2 className="mr-1 h-3 w-3" /> Editar</Button>
                <Button variant="ghost" size="sm" onClick={handleRegenerar}><RefreshCw className="mr-1 h-3 w-3" /> Regenerar</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setShowDeleteDialog(true)}><Trash2 className="mr-1 h-3 w-3" /> Eliminar</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Configuración</CardTitle>
              <CardDescription>Selecciona fichas y columnas para tu lista</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold"><ListChecks className="h-4 w-4" /> Seleccionar Fichas</Label>
                <p className="text-xs text-muted-foreground">Busca por ficha, nombre, marca, modelo o categoría. Usa comas para múltiples términos.</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Ej: AC-023, Caterpillar, excavadora" value={searchFichas} onChange={(e) => setSearchFichas(e.target.value)} onFocus={() => setDropdownOpen(true)} className="pl-10" />
                </div>
                {dropdownOpen && (
                  <div className="relative">
                    <Card className="absolute z-50 w-full max-h-64 overflow-hidden shadow-lg">
                      <ScrollArea className="h-64">
                        <div className="p-2">
                          {fichasDisponibles.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">No se encontraron equipos</p>
                          ) : fichasDisponibles.map((equipo) => {
                            const isSelected = selectedFichas.includes(equipo.ficha);
                            return (
                              <button key={equipo.ficha} onClick={() => handleToggleFicha(equipo.ficha)} className={cn('flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted', isSelected && 'bg-primary/10')}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2"><span className="font-mono font-semibold">{equipo.ficha}</span><span className="truncate text-muted-foreground">{equipo.nombre}</span></div>
                                  <div className="text-xs text-muted-foreground">{equipo.marca} {equipo.modelo} • {equipo.categoria}</div>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      <div className="border-t p-2"><Button variant="ghost" size="sm" className="w-full" onClick={() => setDropdownOpen(false)}>Cerrar</Button></div>
                    </Card>
                  </div>
                )}
                {selectedFichas.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><span className="text-sm font-medium">{selectedFichas.length} fichas seleccionadas</span><Button variant="ghost" size="sm" onClick={() => setSelectedFichas([])}>Limpiar todo</Button></div>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {selectedFichas.map((ficha) => (<Badge key={ficha} variant="secondary" className="gap-1">{ficha}<button onClick={() => handleRemoveFicha(ficha)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button></Badge>))}
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold"><LayoutTemplate className="h-4 w-4" /> Columnas</Label>
                <Tabs value={columnTab} onValueChange={(v) => setColumnTab(v as typeof columnTab)}>
                  <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="basico" className="text-xs">Básico</TabsTrigger><TabsTrigger value="mantenimiento" className="text-xs">Mant.</TabsTrigger><TabsTrigger value="avanzado" className="text-xs">Avanzado</TabsTrigger></TabsList>
                  {(['basico', 'mantenimiento', 'avanzado'] as const).map((group) => (
                    <TabsContent key={group} value={group} className="space-y-2">
                      <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => handleSelectAllColumnsInGroup(group)} className="text-xs h-7">Todas</Button><Button size="sm" variant="ghost" onClick={() => handleClearColumnsInGroup(group)} className="text-xs h-7">Ninguna</Button></div>
                      <div className="grid gap-2 max-h-40 overflow-y-auto">
                        {columnsByGroup[group].map((col) => (<label key={col.key} className="flex items-center gap-2 rounded-md bg-muted/40 p-2 text-xs cursor-pointer"><Checkbox checked={selectedColumns.includes(col.key)} onCheckedChange={() => handleToggleColumn(col.key)} /><span className="font-medium">{col.label}</span></label>))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold"><Palette className="h-4 w-4" /> Tema</Label>
                <Select value={colorScheme} onValueChange={(v) => setColorScheme(v as keyof typeof COLOR_THEMES)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(COLOR_THEMES).map(([key, t]) => (<SelectItem key={key} value={key}>{t.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex flex-col gap-2"><Button onClick={() => handleOpenSaveDialog(false)} disabled={selectedFichas.length === 0}><Save className="mr-2 h-4 w-4" /> Guardar Lista</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Vista Previa</CardTitle><CardDescription>{selectedEquipos.length} equipo{selectedEquipos.length !== 1 ? 's' : ''} • {selectedColumns.length} columnas</CardDescription></div>
              {selectedEquipos.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button><Download className="mr-2 h-4 w-4" /> Exportar<ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCsv}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (CSV)</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportJson}><FileJson className="mr-2 h-4 w-4" /> JSON</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportPdf}><FileText className="mr-2 h-4 w-4" /> PDF (Imprimir)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              {selectedEquipos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16 text-center">
                  <ListChecks className="h-12 w-12 text-muted-foreground/50" />
                  <div><p className="font-medium">No hay equipos seleccionados</p><p className="text-sm text-muted-foreground">Usa el buscador para agregar fichas a tu lista</p></div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className={theme.header}>
                        {selectedColumns.map((key) => (<TableHead key={key} className="text-xs font-semibold uppercase">{columnMap[key]?.label ?? key}</TableHead>))}
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEquipos.map((equipo) => (
                        <TableRow key={equipo.id} className={theme.rowHover}>
                          {selectedColumns.map((key) => {
                            const value = columnMap[key]?.accessor(equipo) ?? '';
                            return (<TableCell key={`${equipo.id}-${key}`} className="text-sm">{key === 'estadoMantenimiento' ? (<Badge variant="outline" className={cn(theme.badge, 'text-xs')}>{value}</Badge>) : value.split('\n').map((line, i) => (<span key={i} className="block">{line}</span>))}</TableCell>);
                          })}
                          <TableCell><Button variant="ghost" size="sm" onClick={() => handleRemoveFicha(equipo.ficha)}><X className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingListaId ? 'Editar Lista' : 'Guardar Nueva Lista'}</DialogTitle><DialogDescription>Dale un nombre a tu lista</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input placeholder="Ej: Excavadoras Caterpillar" value={nombreNuevaLista} onChange={(e) => setNombreNuevaLista(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Input placeholder="Ej: Lista para mantenimiento mensual" value={descripcionNuevaLista} onChange={(e) => setDescripcionNuevaLista(e.target.value)} /></div>
            <div className="rounded-md bg-muted p-3 text-sm"><p><strong>{selectedFichas.length}</strong> equipos • <strong>{selectedColumns.length}</strong> columnas • Tema: <strong>{COLOR_THEMES[colorScheme].name}</strong></p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button><Button onClick={handleSaveLista}><Save className="mr-2 h-4 w-4" /> {editingListaId ? 'Actualizar' : 'Guardar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>¿Eliminar lista?</DialogTitle><DialogDescription>Eliminarás permanentemente "{listaActiva?.nombre}".</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button><Button variant="destructive" onClick={handleDeleteLista}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


