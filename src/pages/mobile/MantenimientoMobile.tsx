/**
 * Control Mantenimiento Móvil - Versión Completa Gerencial
 * 
 * Características:
 * - Vista resumen gerencial con KPIs
 * - Filtros avanzados con checkbox (categorías, tipos, estados, fichas)
 * - Exportación PDF completa con opciones (todo o por categorías)
 * - Tabla horizontal scrollable con todos los datos
 * - Vista detalle expandible con información completa
 * - Acciones contextuales (Editar, Eliminar, Registrar)
 * - Búsqueda en tiempo real
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  ListFilter,
  MoreVertical,
  ArrowRight,
  Search,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  FileDown,
  Lock,
  BarChart3,
  Calendar,
  Gauge,
  ChevronDown,
  ChevronUp,
  X,
  Printer,
  TrendingUp,
  Activity,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MantenimientoProgramado } from '@/types/equipment';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';

interface MantenimientoMobileProps {
  mantenimientos: MantenimientoProgramado[];
  onRegistrar: (mantenimiento: MantenimientoProgramado) => void;
  onVerDetalle: (ficha: string) => void;
  onEdit?: (mantenimiento: MantenimientoProgramado) => void;
  onDelete?: (mantenimiento: MantenimientoProgramado) => void;
  onCreate?: () => void;
  onRefresh?: () => Promise<void>;
  categorias?: string[];
  tipos?: string[];
  equiposPorFicha?: Record<string, { categoria: string; marca?: string; modelo?: string }>;
}

type ViewMode = 'list' | 'overview';

export function MantenimientoMobile({
  mantenimientos,
  onRegistrar,
  onVerDetalle,
  onEdit,
  onDelete,
  onCreate,
  onRefresh,
  categorias = [],
  tipos = [],
  equiposPorFicha = {}
}: MantenimientoMobileProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { currentUserRole } = useUserRoles();
  const isAdmin = currentUserRole === 'admin';
  const { toast } = useToast();

  // Filtros avanzados con checkbox
  const [filtros, setFiltros] = useState({
    tipos: [] as string[],
    categorias: [] as string[],
    estados: [] as string[],
    fichas: [] as string[],
    restanteMin: '',
    restanteMax: ''
  });

  // Categorías para exportar PDF
  const [exportCategories, setExportCategories] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<'all' | 'categories'>('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Pull to refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Obtener fichas únicas
  const fichasUnicas = useMemo(() => {
    return [...new Set(mantenimientos.map(m => m.ficha))].sort((a, b) => 
      a.localeCompare(b, 'es', { numeric: true })
    );
  }, [mantenimientos]);

  // Filtrado avanzado
  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter(m => {
      // Búsqueda de texto
      const searchMatch =
        m.ficha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nombreEquipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tipoMantenimiento.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Filtro por tipo (checkbox)
      if (filtros.tipos.length > 0 && !filtros.tipos.includes(m.tipoMantenimiento)) {
        return false;
      }

      // Filtro por categoría (requiere equiposPorFicha)
      if (filtros.categorias.length > 0) {
        const equipo = equiposPorFicha[m.ficha];
        if (!equipo || !filtros.categorias.includes(equipo.categoria)) {
          return false;
        }
      }

      // Filtro por ficha
      if (filtros.fichas.length > 0 && !filtros.fichas.includes(m.ficha)) {
        return false;
      }

      // Filtro por estado
      if (filtros.estados.length > 0) {
        const isVencido = m.horasKmRestante <= 0;
        const isProximo = m.horasKmRestante > 0 && m.horasKmRestante <= 100;
        const isNormal = m.horasKmRestante > 100;

        const matchEstado = 
          (filtros.estados.includes('vencido') && isVencido) ||
          (filtros.estados.includes('proximo') && isProximo) ||
          (filtros.estados.includes('normal') && isNormal);

        if (!matchEstado) return false;
      }

      // Filtro por rango de restante
      const restante = Math.abs(m.horasKmRestante);
      if (filtros.restanteMin && restante < parseFloat(filtros.restanteMin)) return false;
      if (filtros.restanteMax && restante > parseFloat(filtros.restanteMax)) return false;

      return m.activo;
    });
  }, [mantenimientos, searchTerm, filtros, equiposPorFicha]);

  // Ordenar por urgencia (vencidos primero)
  const mantenimientosOrdenados = useMemo(() => {
    return [...mantenimientosFiltrados].sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [mantenimientosFiltrados]);

  // Estadísticas detalladas
  const stats = useMemo(() => {
    const total = mantenimientosFiltrados.length;
    const vencidos = mantenimientosFiltrados.filter(m => m.horasKmRestante <= 0);
    const proximos = mantenimientosFiltrados.filter(m => m.horasKmRestante > 0 && m.horasKmRestante <= 100);
    const ok = mantenimientosFiltrados.filter(m => m.horasKmRestante > 100);

    // Calcular promedio de horas restantes para los que están ok
    const avgRestante = ok.length > 0
      ? Math.round(ok.reduce((sum, m) => sum + m.horasKmRestante, 0) / ok.length)
      : 0;

    // Agrupar por categoría
    const porCategoria = categorias.map(cat => {
      const items = mantenimientosFiltrados.filter(m => {
        const equipo = equiposPorFicha[m.ficha];
        return equipo?.categoria === cat;
      });
      return {
        categoria: cat,
        total: items.length,
        vencidos: items.filter(m => m.horasKmRestante <= 0).length,
        proximos: items.filter(m => m.horasKmRestante > 0 && m.horasKmRestante <= 100).length,
        ok: items.filter(m => m.horasKmRestante > 100).length
      };
    }).filter(c => c.total > 0);

    // Equipos más críticos (top 5)
    const criticos = [...mantenimientosFiltrados]
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
      .slice(0, 5);

    return {
      total,
      vencidos: vencidos.length,
      proximos: proximos.length,
      ok: ok.length,
      avgRestante,
      porCategoria,
      criticos,
      porcentajeOk: total > 0 ? Math.round((ok.length / total) * 100) : 0,
      porcentajeCritico: total > 0 ? Math.round(((vencidos.length + proximos.length) / total) * 100) : 0
    };
  }, [mantenimientosFiltrados, categorias, equiposPorFicha]);

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filtros.tipos.length > 0) count++;
    if (filtros.categorias.length > 0) count++;
    if (filtros.estados.length > 0) count++;
    if (filtros.fichas.length > 0) count++;
    if (filtros.restanteMin || filtros.restanteMax) count++;
    return count;
  }, [filtros]);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      tipos: [],
      categorias: [],
      estados: [],
      fichas: [],
      restanteMin: '',
      restanteMax: ''
    });
    setSearchTerm('');
  };

  // Toggle checkbox
  const toggleFilter = (key: 'tipos' | 'categorias' | 'estados' | 'fichas', value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const getStatusIcon = (restante: number) => {
    if (restante < 0) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (restante <= 50) return <Clock className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (restante: number) => {
    if (restante < 0) return "text-destructive";
    if (restante <= 50) return "text-amber-500";
    return "text-green-500";
  };

  const getStatusBg = (restante: number) => {
    if (restante < 0) return "bg-destructive/10 border-destructive/20";
    if (restante <= 50) return "bg-amber-500/10 border-amber-500/20";
    return "bg-green-500/10 border-green-500/20";
  };

  // Exportación PDF completa
  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      if (mantenimientosFiltrados.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'No hay mantenimientos para exportar',
          variant: 'destructive'
        });
        return;
      }

      // Filtrar por categorías si es necesario
      const dataToExport = exportMode === 'categories' && exportCategories.length > 0
        ? mantenimientosFiltrados.filter(m => {
            const equipo = equiposPorFicha[m.ficha];
            return equipo && exportCategories.includes(equipo.categoria);
          })
        : mantenimientosFiltrados;

      if (dataToExport.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'No hay mantenimientos para las categorías seleccionadas',
          variant: 'destructive'
        });
        return;
      }

      // Encabezado corporativo
      doc.setFillColor(36, 99, 56);
      doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('ALITO MANTENIMIENTO', 20, 10);

      // Título
      doc.setFontSize(20);
      doc.setTextColor(36, 99, 56);
      doc.text(
        exportMode === 'categories' 
          ? `Reporte por Categorías: ${exportCategories.join(', ')}`
          : 'Reporte Completo de Mantenimientos',
        20, 28
      );

      // Línea decorativa
      doc.setDrawColor(36, 99, 56);
      doc.setLineWidth(0.5);
      doc.line(20, 32, doc.internal.pageSize.width - 20, 32);

      // Fecha
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      const fechaActual = new Date();
      doc.text(`Generado: ${fechaActual.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })} | ${fechaActual.toLocaleTimeString('es-ES')}`, 20, 40);

      // Resumen ejecutivo con cajas
      const boxY = 48;
      const boxWidth = 55;
      const boxHeight = 16;
      const boxSpacing = 60;

      const totalMant = dataToExport.length;
      const venc = dataToExport.filter(m => m.horasKmRestante <= 0).length;
      const prox = dataToExport.filter(m => m.horasKmRestante > 0 && m.horasKmRestante <= 100).length;
      const norm = dataToExport.filter(m => m.horasKmRestante > 100).length;

      // Caja Total
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(20, boxY, boxWidth, boxHeight, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Total', 25, boxY + 5);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(totalMant.toString(), 25, boxY + 13);

      // Caja Vencidos
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(20 + boxSpacing, boxY, boxWidth, boxHeight, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Vencidos', 25 + boxSpacing, boxY + 5);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(venc.toString(), 25 + boxSpacing, boxY + 13);

      // Caja Próximos
      doc.setFillColor(251, 191, 36);
      doc.roundedRect(20 + boxSpacing * 2, boxY, boxWidth, boxHeight, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Próximos (≤100)', 25 + boxSpacing * 2, boxY + 5);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(prox.toString(), 25 + boxSpacing * 2, boxY + 13);

      // Caja OK
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(20 + boxSpacing * 3, boxY, boxWidth, boxHeight, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Normales', 25 + boxSpacing * 3, boxY + 5);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(norm.toString(), 25 + boxSpacing * 3, boxY + 13);

      // Tabla de datos
      const tableData = dataToExport.map(mant => {
        const unidad = mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
        const equipo = equiposPorFicha[mant.ficha];
        const estado = mant.horasKmRestante <= 0 ? 'Vencido' 
          : mant.horasKmRestante <= 100 ? 'Próximo' : 'Normal';

        return [
          mant.ficha,
          mant.nombreEquipo,
          equipo?.categoria || 'N/A',
          mant.tipoMantenimiento,
          `${mant.horasKmActuales.toLocaleString()} ${unidad}`,
          `${mant.frecuencia.toLocaleString()} ${unidad}`,
          `${mant.horasKmUltimoMantenimiento.toLocaleString()} ${unidad}`,
          `${mant.proximoMantenimiento.toLocaleString()} ${unidad}`,
          formatRemainingLabel(mant.horasKmRestante, unidad),
          mant.fechaUltimoMantenimiento 
            ? new Date(mant.fechaUltimoMantenimiento).toLocaleDateString('es-ES')
            : 'N/A',
          estado
        ];
      });

      autoTable(doc, {
        startY: 70,
        head: [['Ficha', 'Equipo', 'Categoría', 'Tipo', 'Actual', 'Frecuencia', 'Últ. Mant.', 'Próximo', 'Restante', 'Fecha Últ.', 'Estado']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [36, 99, 56],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 28 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 14, halign: 'center' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 18, halign: 'right' },
          7: { cellWidth: 18, halign: 'right' },
          8: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
          9: { cellWidth: 20, halign: 'center' },
          10: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const estado = data.row.raw[10];
            if (data.column.index === 10) {
              if (estado === 'Vencido') {
                data.cell.styles.fillColor = [254, 226, 226];
                data.cell.styles.textColor = [185, 28, 28];
              } else if (estado === 'Próximo') {
                data.cell.styles.fillColor = [254, 243, 199];
                data.cell.styles.textColor = [146, 64, 14];
              } else {
                data.cell.styles.fillColor = [220, 252, 231];
                data.cell.styles.textColor = [21, 128, 61];
              }
            }
            if (data.column.index === 8) {
              if (estado === 'Vencido') data.cell.styles.textColor = [220, 38, 38];
              else if (estado === 'Próximo') data.cell.styles.textColor = [217, 119, 6];
              else data.cell.styles.textColor = [22, 163, 74];
            }
          }
        },
        margin: { top: 20, right: 15, bottom: 25, left: 15 },
        showHead: 'everyPage',
      });

      // Pie de página
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerY = doc.internal.pageSize.height - 12;
        doc.setDrawColor(36, 99, 56);
        doc.setLineWidth(0.3);
        doc.line(15, footerY, doc.internal.pageSize.width - 15, footerY);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('ALITO Mantenimiento - Sistema de Gestión', 15, footerY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 15, footerY + 5, { align: 'right' });
      }

      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`mantenimientos_${exportMode}_${fecha}.pdf`);

      toast({
        title: 'PDF generado',
        description: `Se exportaron ${dataToExport.length} registros`,
      });

      setExportOpen(false);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <MobileLayout
      title="Control Mantenimiento"
      headerActions={
        <div className="flex items-center gap-1">
          {/* Botón de vista */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === 'list' ? 'overview' : 'list')}
            className="h-9 w-9 rounded-full"
          >
            {viewMode === 'list' ? <BarChart3 className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
          </Button>

          {/* Exportar PDF */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExportOpen(true)}
            className="h-9 w-9 rounded-full"
          >
            <FileDown className="h-5 w-5" />
          </Button>

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className={cn("h-9 w-9 rounded-full", refreshing && "animate-spin")}
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          )}

          {/* Filtros */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
                <ListFilter className="h-5 w-5" />
                {filtrosActivos > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
                    {filtrosActivos}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-[2rem] bg-background overflow-hidden flex flex-col">
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
              <SheetHeader className="mt-4 px-4">
                <div className="flex items-center justify-between">
                  <SheetTitle>Filtros Avanzados</SheetTitle>
                  {filtrosActivos > 0 && (
                    <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
                <SheetDescription>Filtra los mantenimientos según tus necesidades</SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 px-4 py-4">
                <div className="space-y-6 pb-24">
                  {/* Estado */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Estado
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'vencido', label: 'Vencidos', icon: AlertTriangle, color: 'text-destructive' },
                        { id: 'proximo', label: 'Próximos (≤100)', icon: Clock, color: 'text-amber-500' },
                        { id: 'normal', label: 'Normales', icon: CheckCircle2, color: 'text-green-500' },
                      ].map(estado => (
                        <label
                          key={estado.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                            filtros.estados.includes(estado.id)
                              ? "bg-primary/10 border-primary"
                              : "bg-card border-border hover:bg-accent"
                          )}
                        >
                          <Checkbox
                            checked={filtros.estados.includes(estado.id)}
                            onCheckedChange={() => toggleFilter('estados', estado.id)}
                          />
                          <estado.icon className={cn("h-4 w-4", estado.color)} />
                          <span className="flex-1 text-sm">{estado.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Categorías */}
                  {categorias.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Categorías
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {categorias.map(cat => (
                          <label
                            key={cat}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm",
                              filtros.categorias.includes(cat)
                                ? "bg-primary/10 border-primary"
                                : "bg-card border-border hover:bg-accent"
                            )}
                          >
                            <Checkbox
                              checked={filtros.categorias.includes(cat)}
                              onCheckedChange={() => toggleFilter('categorias', cat)}
                            />
                            <span className="truncate">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tipos */}
                  {tipos.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        Tipo de Mantenimiento
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {tipos.map(tipo => (
                          <label
                            key={tipo}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm",
                              filtros.tipos.includes(tipo)
                                ? "bg-primary/10 border-primary"
                                : "bg-card border-border hover:bg-accent"
                            )}
                          >
                            <Checkbox
                              checked={filtros.tipos.includes(tipo)}
                              onCheckedChange={() => toggleFilter('tipos', tipo)}
                            />
                            <span className="truncate">{tipo}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fichas */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      Equipos (Ficha)
                    </h4>
                    <div className="max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1">
                      {fichasUnicas.map(ficha => (
                        <label
                          key={ficha}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm",
                            filtros.fichas.includes(ficha)
                              ? "bg-primary/10"
                              : "hover:bg-accent"
                          )}
                        >
                          <Checkbox
                            checked={filtros.fichas.includes(ficha)}
                            onCheckedChange={() => toggleFilter('fichas', ficha)}
                          />
                          <span className="font-mono">{ficha}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rango de restante */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Rango de Hrs/Km Restantes
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Mínimo</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filtros.restanteMin}
                          onChange={(e) => setFiltros(prev => ({ ...prev, restanteMin: e.target.value }))}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Máximo</Label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={filtros.restanteMax}
                          onChange={(e) => setFiltros(prev => ({ ...prev, restanteMax: e.target.value }))}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter className="p-4 border-t bg-background">
                <Button className="w-full h-12 rounded-xl" onClick={() => setFiltersOpen(false)}>
                  Ver {mantenimientosFiltrados.length} resultados
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      }
    >
      <div className="space-y-4 pb-28">
        {/* Buscador */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ficha, equipo, tipo..."
              className="pl-9 h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {(searchTerm || filtrosActivos > 0) && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={limpiarFiltros}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Vista de Resumen Gerencial */}
        {viewMode === 'overview' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            {/* KPIs principales */}
            <div className="grid grid-cols-2 gap-3">
              <MobileCard variant="glass" className="p-4 text-center bg-primary/5 border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                </div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Programados</p>
              </MobileCard>
              <MobileCard variant="glass" className="p-4 text-center bg-green-500/5 border-green-500/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.porcentajeOk}%</p>
                </div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Al Día</p>
              </MobileCard>
            </div>

            {/* Estado general */}
              <MobileCard variant="glass" className="p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Estado General
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Vencidos</span>
                      <span className="text-lg font-bold text-destructive">{stats.vencidos}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-destructive rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.vencidos / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Próximos (≤100)</span>
                      <span className="text-lg font-bold text-amber-500">{stats.proximos}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.proximos / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Normales</span>
                      <span className="text-lg font-bold text-green-500">{stats.ok}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.ok / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </MobileCard>

            {/* Por categoría */}
            {stats.porCategoria.length > 0 && (
              <MobileCard variant="glass" className="p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Por Categoría
                </h3>
                <div className="space-y-3">
                  {stats.porCategoria.map(cat => (
                    <div key={cat.categoria} className="p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{cat.categoria}</span>
                        <Badge variant="outline">{cat.total}</Badge>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {cat.vencidos > 0 && (
                          <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                            {cat.vencidos} vencidos
                          </span>
                        )}
                        {cat.proximos > 0 && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                            {cat.proximos} próximos
                          </span>
                        )}
                        {cat.ok > 0 && (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                            {cat.ok} ok
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </MobileCard>
            )}

            {/* Equipos críticos */}
            {stats.criticos.length > 0 && (
              <MobileCard variant="glass" className="p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Equipos Más Críticos
                </h3>
                <div className="space-y-2">
                  {stats.criticos.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                        getStatusBg(item.horasKmRestante)
                      )}
                      onClick={() => onVerDetalle(item.ficha)}
                    >
                      <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.ficha}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.nombreEquipo}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold text-sm", getStatusColor(item.horasKmRestante))}>
                          {formatRemainingLabel(item.horasKmRestante, item.tipoMantenimiento === 'Horas' ? 'hrs' : 'km')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </MobileCard>
            )}

            {/* Botón para cambiar a lista */}
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl"
              onClick={() => setViewMode('list')}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Ver Lista de Mantenimientos
            </Button>
          </div>
        ) : (
          <>
            {/* Estadísticas compactas */}
            <div className="grid grid-cols-4 gap-2">
              <MobileCard variant="glass" className="p-2 text-center bg-primary/5 border-primary/10">
                <p className="text-lg font-bold text-primary">{stats.total}</p>
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
              </MobileCard>
              <MobileCard variant="glass" className="p-2 text-center bg-destructive/5 border-destructive/10">
                <p className="text-lg font-bold text-destructive">{stats.vencidos}</p>
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Vencidos</p>
              </MobileCard>
              <MobileCard variant="glass" className="p-2 text-center bg-amber-500/5 border-amber-500/10">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.proximos}</p>
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Próx.</p>
              </MobileCard>
              <MobileCard variant="glass" className="p-2 text-center bg-green-500/5 border-green-500/10">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.ok}</p>
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">OK</p>
              </MobileCard>
            </div>

            {/* Lista de mantenimientos */}
            {mantenimientosOrdenados.length > 0 ? (
              <div className="space-y-3">
                {mantenimientosOrdenados.map((item, index) => {
                  const equipo = equiposPorFicha[item.ficha];
                  const isExpanded = expandedCard === `${item.ficha}-${item.id}`;
                  const unidad = item.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';

                  return (
                    <MobileCard
                      key={`${item.ficha}-${item.id}`}
                      variant="compact"
                      className={cn(
                        'relative animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards group overflow-visible',
                        getStatusBg(item.horasKmRestante)
                      )}
                      style={{ animationDelay: `${index * 0.03}s` } as React.CSSProperties}
                    >
                      {/* Dropdown actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-8 w-8 opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuItem onClick={() => onVerDetalle(item.ficha)} className="gap-2 py-2.5">
                            <Calendar className="h-4 w-4" />
                            Ver Equipo
                          </DropdownMenuItem>
                          {isAdmin && (onEdit || onDelete) && <DropdownMenuSeparator />}
                          {isAdmin && onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2 py-2.5">
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {isAdmin && onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="gap-2 py-2.5 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                          {!isAdmin && (
                            <DropdownMenuItem disabled className="gap-2 py-2.5 text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              Solo lectura
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="space-y-3 pt-1 pr-8" onClick={() => setExpandedCard(isExpanded ? null : `${item.ficha}-${item.id}`)}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm",
                            item.horasKmRestante < 0 ? "bg-destructive/20 text-destructive" :
                              item.horasKmRestante <= 50 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                                "bg-green-500/20 text-green-600 dark:text-green-400"
                          )}>
                            {getStatusIcon(item.horasKmRestante)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm">{item.ficha}</h3>
                              <Badge variant="outline" className="text-[0.6rem] h-4 px-1.5 font-normal">
                                {item.tipoMantenimiento}
                              </Badge>
                              {equipo?.categoria && (
                                <Badge variant="secondary" className="text-[0.6rem] h-4 px-1.5">
                                  {equipo.categoria}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.nombreEquipo}
                            </p>
                          </div>
                        </div>

                        {/* Info principal siempre visible */}
                        <div className="grid grid-cols-2 gap-2 bg-background/40 rounded-lg p-2 border border-border/30">
                          <div>
                            <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Actual</p>
                            <p className="text-sm font-semibold">{item.horasKmActuales.toLocaleString()} {unidad}</p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Restante</p>
                            <p className={cn("text-sm font-bold", getStatusColor(item.horasKmRestante))}>
                              {formatRemainingLabel(item.horasKmRestante, unidad)}
                            </p>
                          </div>
                        </div>

                        {/* Info expandida */}
                        {isExpanded && (
                          <div className="space-y-2 animate-in slide-in-from-top-2 fade-in">
                            <div className="grid grid-cols-2 gap-2 bg-background/40 rounded-lg p-2 border border-border/30">
                              <div>
                                <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Frecuencia</p>
                                <p className="text-sm font-medium">{item.frecuencia.toLocaleString()} {unidad}</p>
                              </div>
                              <div>
                                <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Próximo</p>
                                <p className="text-sm font-medium">{item.proximoMantenimiento.toLocaleString()} {unidad}</p>
                              </div>
                              <div>
                                <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Últ. Mant.</p>
                                <p className="text-sm font-medium">{item.horasKmUltimoMantenimiento.toLocaleString()} {unidad}</p>
                              </div>
                              <div>
                                <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Fecha Últ.</p>
                                <p className="text-sm font-medium">
                                  {item.fechaUltimoMantenimiento 
                                    ? new Date(item.fechaUltimoMantenimiento).toLocaleDateString('es-ES')
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              className="w-full h-9 text-xs justify-between group/btn hover:bg-primary/5 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onVerDetalle(item.ficha);
                              }}
                            >
                              <span>Ver detalle del equipo</span>
                              <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          </div>
                        )}

                        {/* Indicador de expandir */}
                        <div className="flex justify-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </MobileCard>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95">
                <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Search className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">No se encontraron resultados</h3>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-[200px]">
                  Intenta ajustar los filtros o buscar con otro término
                </p>
                <Button variant="link" className="mt-2" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB - Solo admin */}
      {onCreate && isAdmin && viewMode === 'list' && (
        <div className="fixed bottom-24 right-4 z-40">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-transform active:scale-90"
            onClick={onCreate}
          >
            <Plus className="h-6 w-6 text-primary-foreground" />
          </Button>
        </div>
      )}

      {/* Dialog de exportación PDF */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Exportar a PDF
            </DialogTitle>
            <DialogDescription>
              Genera un reporte profesional de mantenimientos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Modo de exportación */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Modo de exportación</Label>
              <div className="grid grid-cols-1 gap-2">
                <label
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    exportMode === 'all' ? "bg-primary/10 border-primary" : "bg-card border-border"
                  )}
                >
                  <Checkbox
                    checked={exportMode === 'all'}
                    onCheckedChange={() => setExportMode('all')}
                  />
                  <div>
                    <p className="font-medium text-sm">Exportar todo</p>
                    <p className="text-xs text-muted-foreground">{mantenimientosFiltrados.length} registros</p>
                  </div>
                </label>
                <label
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    exportMode === 'categories' ? "bg-primary/10 border-primary" : "bg-card border-border"
                  )}
                >
                  <Checkbox
                    checked={exportMode === 'categories'}
                    onCheckedChange={() => setExportMode('categories')}
                  />
                  <div>
                    <p className="font-medium text-sm">Por categorías</p>
                    <p className="text-xs text-muted-foreground">Selecciona categorías específicas</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Selección de categorías */}
            {exportMode === 'categories' && categorias.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Categorías a exportar</Label>
                <div className="max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1">
                  {categorias.map(cat => (
                    <label
                      key={cat}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm",
                        exportCategories.includes(cat) ? "bg-primary/10" : "hover:bg-accent"
                      )}
                    >
                      <Checkbox
                        checked={exportCategories.includes(cat)}
                        onCheckedChange={(checked) => {
                          setExportCategories(prev => 
                            checked 
                              ? [...prev, cat]
                              : prev.filter(c => c !== cat)
                          );
                        }}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full h-11 rounded-xl"
              onClick={handleExportPDF}
              disabled={isGeneratingPDF || (exportMode === 'categories' && exportCategories.length === 0)}
            >
              {isGeneratingPDF ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Generar PDF
                </>
              )}
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => setExportOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
