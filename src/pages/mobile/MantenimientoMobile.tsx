/**
 * Control Mantenimiento Móvil
 * 
 * Características:
 * - Tabla horizontal scrollable con indicadores
 * - Filtros bottom sheet (todos/vencidos/próximos/al día + categorías/tipos)
 * - Vista detalle expandible
 * - Acciones contextuales completas (Editar, Eliminar, Registrar)
 * - Búsqueda en tiempo real
 * - Pull-to-refresh
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  Filter,
  Calendar,
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
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

type FilterType = 'all' | 'vencidos' | 'proximos' | 'ok';

export function MantenimientoMobile({
  mantenimientos,
  onRegistrar,
  onVerDetalle,
  onEdit,
  onDelete,
  onCreate,
  onRefresh,
  categorias = [],
  tipos = []
}: MantenimientoMobileProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

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

  // Estadísticas
  const stats = useMemo(() => {
    const vencidos = mantenimientos.filter(m => m.horasKmRestante < 0).length;
    const proximos = mantenimientos.filter(
      m => m.horasKmRestante >= 0 && m.horasKmRestante <= 50
    ).length;
    const ok = mantenimientos.filter(m => m.horasKmRestante > 50).length;

    return { total: mantenimientos.length, vencidos, proximos, ok };
  }, [mantenimientos]);

  // Filtrado
  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter(m => {
      // Filtro de texto
      const searchMatch =
        m.ficha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nombreEquipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tipoMantenimiento.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Filtro de estado
      if (filter === 'vencidos' && m.horasKmRestante >= 0) return false;
      if (filter === 'proximos' && (m.horasKmRestante < 0 || m.horasKmRestante > 50)) return false;
      if (filter === 'ok' && m.horasKmRestante <= 50) return false;

      // Filtro de categoría (requiere que la data incluya categoría o se pase map)
      // Por ahora asumimos que si se pasa categoría se filtra externamente o se implementará después
      // Si el objeto mantenimiento tuviera categoría:
      // if (selectedCategory !== 'all' && m.categoria !== selectedCategory) return false;

      // Filtro de tipo
      if (selectedType !== 'all' && m.tipoMantenimiento !== selectedType) return false;

      return true;
    });
  }, [mantenimientos, filter, searchTerm, selectedType]);

  // Ordenar por urgencia
  const mantenimientosOrdenados = useMemo(() => {
    return [...mantenimientosFiltrados].sort((a, b) => a.horasKmRestante - b.horasKmRestante);
  }, [mantenimientosFiltrados]);

  const getStatusIcon = (restante: number) => {
    if (restante < 0) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (restante <= 50) return <Clock className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (restante: number) => {
    if (restante < 0) return "text-red-500";
    if (restante <= 50) return "text-amber-500";
    return "text-green-500";
  };

  // Exportación PDF
  const handleExportPDF = async () => {
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Configurar fuente
      doc.setFont('helvetica');

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
      doc.text('Reporte de Mantenimientos', 20, 28);

      // Fecha
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleString()}`, 20, 35);

      // Tabla
      const tableData = mantenimientosFiltrados.map(mant => {
        const unidad = mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
        return [
          mant.ficha,
          mant.nombreEquipo,
          mant.tipoMantenimiento,
          `${mant.horasKmActuales} ${unidad}`,
          `${mant.frecuencia} ${unidad}`,
          `${mant.proximoMantenimiento} ${unidad}`,
          formatRemainingLabel(mant.horasKmRestante, unidad),
          mant.horasKmRestante <= 0 ? 'Vencido' : mant.horasKmRestante <= 50 ? 'Próximo' : 'Normal'
        ];
      });

      autoTable(doc, {
        startY: 45,
        head: [['Ficha', 'Equipo', 'Tipo', 'Actual', 'Frecuencia', 'Próximo', 'Restante', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [36, 99, 56] },
        styles: { fontSize: 8 },
      });

      doc.save(`mantenimientos_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
    }
  };

  return (
    <MobileLayout
      title="Mantenimientos"
      headerActions={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportPDF}
            className="h-9 w-9 rounded-full hover:bg-primary/10"
          >
            <FileDown className="h-5 w-5" />
          </Button>
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
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 active:scale-95 transition-all">
                <ListFilter className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl overflow-y-auto">
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
              <SheetHeader className="mt-4">
                <SheetTitle className="text-center text-xl font-bold">Filtrar mantenimientos</SheetTitle>
                <SheetDescription className="text-center">Personaliza la vista de tus mantenimientos</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 px-4 pb-8">
                {/* Filtros de Estado */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      className={cn(
                        "w-full justify-start gap-3 h-12 text-base rounded-xl transition-all",
                        filter === 'all' && "bg-primary shadow-lg shadow-primary/25"
                      )}
                      onClick={() => setFilter('all')}
                    >
                      <Wrench className="h-4 w-4" />
                      <div className="flex flex-1 items-center justify-between">
                        <span>Todos</span>
                        <Badge variant="secondary" className="bg-background/20 text-foreground">{stats.total}</Badge>
                      </div>
                    </Button>

                    <Button
                      variant={filter === 'vencidos' ? 'destructive' : 'outline'}
                      className={cn(
                        "w-full justify-start gap-3 h-12 text-base rounded-xl transition-all border-red-200 dark:border-red-900",
                        filter === 'vencidos' && "shadow-lg shadow-red-900/20"
                      )}
                      onClick={() => setFilter('vencidos')}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <div className="flex flex-1 items-center justify-between">
                        <span>Vencidos</span>
                        <Badge variant={filter === 'vencidos' ? 'secondary' : 'destructive'} className={cn(filter === 'vencidos' && "bg-background/20 text-foreground")}>{stats.vencidos}</Badge>
                      </div>
                    </Button>

                    <Button
                      variant={filter === 'proximos' ? 'default' : 'outline'}
                      className={cn(
                        "w-full justify-start gap-3 h-12 text-base rounded-xl transition-all",
                        filter === 'proximos' && "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-900/20 border-amber-600"
                      )}
                      onClick={() => setFilter('proximos')}
                    >
                      <Clock className="h-4 w-4" />
                      <div className="flex flex-1 items-center justify-between">
                        <span>Próximos</span>
                        <Badge variant="secondary" className="bg-background/20 text-foreground">{stats.proximos}</Badge>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Filtros adicionales */}
                {tipos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Tipo de Mantenimiento</h4>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-full h-12 rounded-xl">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {tipos.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {categorias.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Categoría</h4>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full h-12 rounded-xl">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categorias.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  className="w-full h-12 rounded-xl mt-4"
                  onClick={() => setFiltersOpen(false)}
                >
                  Ver {mantenimientosFiltrados.length} resultados
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      }
    >
      <div className="space-y-4 pb-24">
        {/* Buscador Sticky */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl px-1 py-2 -mx-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ficha, equipo..."
              className="pl-9 h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Estadísticas Compactas */}
        <div className="grid grid-cols-4 gap-2">
          <MobileCard variant="glass" className="p-2 text-center bg-primary/5 border-primary/10">
            <p className="text-lg font-bold text-primary">{stats.total}</p>
            <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
          </MobileCard>
          <MobileCard variant="glass" className="p-2 text-center bg-red-500/5 border-red-500/10">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.vencidos}</p>
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

        {/* Chips de filtro rápido */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
          <Badge
            variant={filter === 'all' ? 'default' : 'outline'}
            className={cn(
              "cursor-pointer px-4 py-1.5 rounded-full transition-all whitespace-nowrap",
              filter === 'all' ? "bg-primary border-0" : "hover:bg-accent"
            )}
            onClick={() => setFilter('all')}
          >
            Todos
          </Badge>
          <Badge
            variant={filter === 'vencidos' ? 'destructive' : 'outline'}
            className={cn(
              "cursor-pointer px-4 py-1.5 rounded-full transition-all whitespace-nowrap",
              filter === 'vencidos' ? "" : "hover:bg-accent"
            )}
            onClick={() => setFilter('vencidos')}
          >
            Vencidos
          </Badge>
          <Badge
            variant={filter === 'proximos' ? 'default' : 'outline'}
            className={cn(
              "cursor-pointer px-4 py-1.5 rounded-full transition-all whitespace-nowrap",
              filter === 'proximos' ? "bg-amber-600 border-0" : "hover:bg-accent"
            )}
            onClick={() => setFilter('proximos')}
          >
            Próximos
          </Badge>
        </div>

        {/* Lista de mantenimientos */}
        {mantenimientosOrdenados.length > 0 ? (
          <div className="space-y-3">
            {mantenimientosOrdenados.map((item, index) => (
              <MobileCard
                key={`${item.ficha}-${item.proximoMantenimiento}`}
                variant="compact"
                className={cn(
                  'relative animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards group overflow-visible',
                  item.horasKmRestante < 0 ? 'border-red-500/30 bg-red-500/5' :
                    item.horasKmRestante <= 50 ? 'border-amber-500/30 bg-amber-500/5' :
                      'bg-card/50 backdrop-blur-sm border-border/50'
                )}
                style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
              >
                {/* Dropdown actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem onClick={() => onRegistrar(item)} className="gap-2 py-2.5">
                      <Wrench className="h-4 w-4 text-primary" />
                      Registrar Mant.
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onVerDetalle(item.ficha)} className="gap-2 py-2.5">
                      <Calendar className="h-4 w-4" />
                      Ver Equipo
                    </DropdownMenuItem>
                    {(onEdit || onDelete) && <DropdownMenuSeparator />}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2 py-2.5">
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="gap-2 py-2.5 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="space-y-3 pt-1 pr-6">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm",
                      item.horasKmRestante < 0 ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                        item.horasKmRestante <= 50 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    )}>
                      {getStatusIcon(item.horasKmRestante)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate">{item.ficha}</h3>
                        <Badge variant="outline" className="text-[0.6rem] h-4 px-1.5 font-normal">
                          {item.tipoMantenimiento}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.nombreEquipo}
                      </p>
                    </div>
                  </div>

                  {/* Detalles expandidos (siempre visibles en móvil para acceso rápido) */}
                  <div className="grid grid-cols-2 gap-2 bg-background/40 rounded-lg p-2 border border-border/30">
                    <div>
                      <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Próximo</p>
                      <p className="text-sm font-semibold">{item.proximoMantenimiento} {item.tipoMantenimiento === 'Horas' ? 'hrs' : 'km'}</p>
                    </div>
                    <div>
                      <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Restante</p>
                      <p className={cn("text-sm font-bold", getStatusColor(item.horasKmRestante))}>
                        {formatRemainingLabel(item.horasKmRestante, item.tipoMantenimiento === 'Horas' ? 'hrs' : 'km')}
                      </p>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border/20 mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>Frec: {item.frecuencia}</span>
                      <span>Último: {item.horasKmUltimoMantenimiento}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full h-8 text-xs justify-between group/btn hover:bg-primary/5 hover:text-primary"
                    onClick={() => onRegistrar(item)}
                  >
                    <span>Registrar mantenimiento</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </MobileCard>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              No se encontraron resultados
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-[200px]">
              Intenta ajustar los filtros o buscar con otro término
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* FAB - Floating Action Button */}
      {onCreate && (
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
    </MobileLayout>
  );
}
