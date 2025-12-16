/**
 * Lista de Equipos Pendientes - Mobile
 * Diseño premium con métricas, estadísticas, filtros y navegación fluida
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { EquipoDetalleUnificado } from '@/components/EquipoDetalleUnificado';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  Clock,
  Search,
  Truck,
  CheckCircle,
  TrendingDown,
  Activity,
  Gauge,
  ChevronRight,
  Wrench,
  Timer,
  Filter,
  X,
  ChevronDown,
  Layers,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemConfig } from '@/context/SystemConfigContext';

export function MechanicPendingList() {
  const navigate = useNavigate();
  const { data } = useSupabaseDataContext();
  const { config } = useSystemConfig();
  const mantenimientos = data.mantenimientosProgramados;
  const equipos = data.equipos;
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('vencidos');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [selectedFicha, setSelectedFicha] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'urgencia' | 'ficha-asc' | 'ficha-desc'>('urgencia');

  // Fichas de equipos activos (no vendidos)
  const fichasEquiposActivos = useMemo(() => {
    return new Set(
      equipos
        .filter(e => e.activo && e.empresa !== 'VENDIDO')
        .map(e => e.ficha)
    );
  }, [equipos]);

  // Mapa de fichas a categorías
  const fichaToCategoria = useMemo(() => {
    const map = new Map<string, string>();
    equipos.forEach(e => {
      if (e.categoria) map.set(e.ficha, e.categoria);
    });
    return map;
  }, [equipos]);

  // Categorías disponibles
  const categoriasDisponibles = useMemo(() => {
    const cats = new Set<string>();
    mantenimientos.forEach(m => {
      if (fichasEquiposActivos.has(m.ficha)) {
        const cat = fichaToCategoria.get(m.ficha);
        if (cat) cats.add(cat);
      }
    });
    return Array.from(cats).sort();
  }, [mantenimientos, fichasEquiposActivos, fichaToCategoria]);

  const formatHours = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return '0';

    const abs = Math.abs(numberValue);
    const rounded = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;
    return rounded.toLocaleString('es-ES', {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
      maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    });
  };

  const handleOpenDetalle = (ficha: string) => {
    setSelectedFicha(ficha);
    setDetalleOpen(true);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearch('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || search.length > 0;

  // Equipos con mantenimiento (solo equipos activos), ordenados por urgencia
  const equiposPendientes = useMemo(() => {
    let base = mantenimientos
      .filter(m => m.activo && fichasEquiposActivos.has(m.ficha))
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

    // Filtrar por categorías seleccionadas
    if (selectedCategories.length > 0) {
      base = base.filter(m => {
        const cat = fichaToCategoria.get(m.ficha);
        return cat && selectedCategories.includes(cat);
      });
    }

    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      base = base.filter(m =>
        m.ficha.toLowerCase().includes(searchLower) ||
        m.nombreEquipo.toLowerCase().includes(searchLower) ||
        m.tipoMantenimiento.toLowerCase().includes(searchLower) ||
        (fichaToCategoria.get(m.ficha)?.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    return base.sort((a, b) => {
      switch (sortBy) {
        case 'urgencia':
          return a.horasKmRestante - b.horasKmRestante;
        case 'ficha-asc':
          return a.ficha.localeCompare(b.ficha, 'es', { numeric: true });
        case 'ficha-desc':
          return b.ficha.localeCompare(a.ficha, 'es', { numeric: true });
        default:
          return a.horasKmRestante - b.horasKmRestante;
      }
    });
  }, [mantenimientos, search, fichasEquiposActivos, selectedCategories, fichaToCategoria, sortBy]);

  const vencidos = useMemo(() => equiposPendientes.filter(e => e.horasKmRestante < 0), [equiposPendientes]);
  const proximos = useMemo(() => equiposPendientes.filter(e => e.horasKmRestante >= 0 && e.horasKmRestante <= config.alertaPreventiva), [equiposPendientes, config.alertaPreventiva]);
  const alDia = useMemo(() => equiposPendientes.filter(e => e.horasKmRestante > config.alertaPreventiva), [equiposPendientes, config.alertaPreventiva]);

  // Estadísticas adicionales
  const stats = useMemo(() => {
    const totalHorasVencidas = vencidos.reduce((sum, e) => sum + Math.abs(e.horasKmRestante), 0);
    const promedioRestante = proximos.length > 0
      ? proximos.reduce((sum, e) => sum + e.horasKmRestante, 0) / proximos.length
      : 0;
    const saludFlota = equiposPendientes.length > 0
      ? Math.round((alDia.length / equiposPendientes.length) * 100)
      : 100;

    return {
      totalHorasVencidas: Math.round(totalHorasVencidas),
      promedioRestante: Math.round(promedioRestante),
      saludFlota,
      urgentes: vencidos.filter(e => e.horasKmRestante < -50).length,
    };
  }, [vencidos, proximos, alDia, equiposPendientes]);

  // Conteo por categoría para mostrar en los checkboxes
  const countByCategory = useMemo(() => {
    const counts = new Map<string, { total: number; vencidos: number; proximos: number }>();

    mantenimientos
      .filter(m => m.activo && fichasEquiposActivos.has(m.ficha))
      .forEach(m => {
        const cat = fichaToCategoria.get(m.ficha);
        if (!cat) return;

        const current = counts.get(cat) || { total: 0, vencidos: 0, proximos: 0 };
        current.total++;
        if (m.horasKmRestante < 0) current.vencidos++;
        else if (m.horasKmRestante <= config.alertaPreventiva) current.proximos++;
        counts.set(cat, current);
      });

    return counts;
  }, [mantenimientos, fichasEquiposActivos, fichaToCategoria, config.alertaPreventiva]);

  const listByTab = useMemo(() => {
    if (tab === 'todos') return equiposPendientes;
    if (tab === 'vencidos') return vencidos;
    if (tab === 'proximos') return proximos;
    if (tab === 'aldia') return alDia;
    return equiposPendientes;
  }, [tab, equiposPendientes, vencidos, proximos, alDia]);

  const getStatusStyles = (horasRestantes: number) => {
    if (horasRestantes < 0) return 'border-destructive/40 bg-gradient-to-r from-destructive/10 to-destructive/5';
    if (horasRestantes <= config.alertaPreventiva) return 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-amber-500/5';
    return 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5';
  };

  const getStatusIcon = (horasRestantes: number) => {
    if (horasRestantes < 0) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (horasRestantes <= config.alertaPreventiva) return <Clock className="h-4 w-4 text-amber-600" />;
    return <CheckCircle className="h-4 w-4 text-emerald-600" />;
  };

  const getStatusBadge = (horasRestantes: number) => {
    if (horasRestantes < 0) {
      return (
        <Badge className="h-6 px-2 text-[10px] leading-none font-bold shrink-0 tabular-nums bg-destructive text-destructive-foreground shadow-sm">
          -{formatHours(horasRestantes)}h
        </Badge>
      );
    }
    if (horasRestantes <= config.alertaPreventiva) {
      return (
        <Badge className="h-6 px-2 text-[10px] leading-none font-bold shrink-0 tabular-nums bg-amber-500 text-white shadow-sm">
          {formatHours(horasRestantes)}h
        </Badge>
      );
    }
    return (
      <Badge className="h-6 px-2 text-[10px] leading-none font-bold shrink-0 tabular-nums bg-emerald-500 text-white shadow-sm">
        {formatHours(horasRestantes)}h
      </Badge>
    );
  };

  const getUrgencyLevel = (horasRestantes: number) => {
    if (horasRestantes < -100) return 'CRÍTICO';
    if (horasRestantes < -50) return 'URGENTE';
    if (horasRestantes < 0) return 'VENCIDO';
    if (horasRestantes <= 25) return 'PRÓXIMO';
    return '';
  };

  return (
    <MobileLayout
      title="Equipos Pendientes"
      showBottomNav={true}
    >
      <div className="flex flex-col gap-3 pb-20">
        {/* Header con métricas */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
          <div className="absolute right-4 top-4">
            <Sparkles className="h-5 w-5 text-primary/50 animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm border border-white/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">Estado de Flota</h2>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest">Panel de control</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black tracking-tight">{stats.saludFlota}<span className="text-lg text-white/70">%</span></p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Salud</p>
              </div>
            </div>

            {/* Barra de progreso de salud */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                <span>Progreso</span>
                <span>{alDia.length}/{equiposPendientes.length} al día</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    stats.saludFlota >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                      stats.saludFlota >= 50 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                        "bg-gradient-to-r from-red-400 to-red-500"
                  )}
                  style={{ width: `${stats.saludFlota}%` }}
                />
              </div>
            </div>

            {/* Métricas compactas */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl bg-destructive/20 p-2.5 text-center border border-destructive/30 backdrop-blur-sm">
                <TrendingDown className="h-3.5 w-3.5 mx-auto mb-1 text-red-400" />
                <p className="text-xl font-bold text-red-400">{vencidos.length}</p>
                <p className="text-[8px] text-white/60 uppercase tracking-wider">Vencidos</p>
              </div>
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-center border border-amber-500/30 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                <p className="text-xl font-bold text-amber-400">{proximos.length}</p>
                <p className="text-[8px] text-white/60 uppercase tracking-wider">Próximos</p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-2.5 text-center border border-emerald-500/30 backdrop-blur-sm">
                <CheckCircle className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-400" />
                <p className="text-xl font-bold text-emerald-400">{alDia.length}</p>
                <p className="text-[8px] text-white/60 uppercase tracking-wider">Al día</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 text-center border border-white/20 backdrop-blur-sm">
                <Truck className="h-3.5 w-3.5 mx-auto mb-1 text-white/80" />
                <p className="text-xl font-bold">{equiposPendientes.length}</p>
                <p className="text-[8px] text-white/60 uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas urgentes */}
        {stats.urgentes > 0 && (
          <MobileCard variant="glass" className="p-3 border-destructive/40 bg-gradient-to-r from-destructive/10 to-destructive/5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/20 p-2.5 animate-pulse border border-destructive/30">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-destructive">¡Atención Urgente!</p>
                <p className="text-xs text-muted-foreground">
                  {stats.urgentes} equipo{stats.urgentes > 1 ? 's' : ''} con más de 50h vencidas
                </p>
              </div>
              <Badge variant="destructive" className="tabular-nums font-bold shadow-sm">
                {stats.totalHorasVencidas}h
              </Badge>
            </div>
          </MobileCard>
        )}

        {/* Búsqueda y Filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipo, ficha, categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 text-sm bg-background/80 backdrop-blur-sm rounded-xl border-border/50"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-11 w-11 shrink-0 rounded-xl transition-all",
              showFilters && "shadow-lg",
              hasActiveFilters && !showFilters && "border-primary text-primary"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && !showFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Panel de filtros por categoría */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="animate-in slide-in-from-top-2 fade-in duration-200">
            <MobileCard variant="glass" className="p-4 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Filtrar por Categoría</h3>
                </div>
                {selectedCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Limpiar
                  </Button>
                )}
              </div>

              {/* Grid de categorías */}
              <div className="grid grid-cols-2 gap-2">
                {categoriasDisponibles.map((cat) => {
                  const catStats = countByCategory.get(cat);
                  const isSelected = selectedCategories.includes(cat);

                  return (
                    <label
                      key={cat}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all",
                        "hover:bg-muted/50 active:scale-[0.98]",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-background/50"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCategory(cat)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{cat}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {catStats?.total || 0} equipos
                          </span>
                          {(catStats?.vencidos || 0) > 0 && (
                            <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                              {catStats?.vencidos}
                            </Badge>
                          )}
                          {(catStats?.proximos || 0) > 0 && (
                            <Badge className="h-4 px-1 text-[9px] bg-amber-500">
                              {catStats?.proximos}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Resumen de filtros activos */}
              {hasActiveFilters && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {selectedCategories.length > 0 && (
                        <span className="font-medium text-primary">
                          {selectedCategories.length} categoría{selectedCategories.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {selectedCategories.length > 0 && search && ' + '}
                      {search && (
                        <span className="font-medium text-primary">
                          búsqueda: "{search}"
                        </span>
                      )}
                    </span>
                    <span className="font-medium">
                      {equiposPendientes.length} resultado{equiposPendientes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Opciones de ordenamiento */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Ordenar por
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={sortBy === 'urgencia' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-9 rounded-lg gap-1"
                    onClick={() => setSortBy('urgencia')}
                  >
                    <Zap className="h-3 w-3" />
                    Urgencia
                  </Button>
                  <Button
                    variant={sortBy === 'ficha-asc' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-9 rounded-lg gap-1"
                    onClick={() => setSortBy('ficha-asc')}
                  >
                    <ArrowUp className="h-3 w-3" />
                    Ficha A-Z
                  </Button>
                  <Button
                    variant={sortBy === 'ficha-desc' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-9 rounded-lg gap-1"
                    onClick={() => setSortBy('ficha-desc')}
                  >
                    <ArrowDown className="h-3 w-3" />
                    Ficha Z-A
                  </Button>
                </div>
              </div>
            </MobileCard>
          </CollapsibleContent>
        </Collapsible>

        {/* Tabs de navegación */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger
              value="vencidos"
              className={cn(
                "text-xs gap-1 rounded-lg data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground",
                "transition-all data-[state=active]:shadow-lg"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                {vencidos.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="proximos"
              className={cn(
                "text-xs gap-1 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white",
                "transition-all data-[state=active]:shadow-lg"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                {proximos.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="aldia"
              className={cn(
                "text-xs gap-1 rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white",
                "transition-all data-[state=active]:shadow-lg"
              )}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                {alDia.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="todos"
              className="text-xs gap-1 rounded-lg data-[state=active]:shadow-lg"
            >
              <Truck className="h-3.5 w-3.5" />
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                {equiposPendientes.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Contenido de cada tab */}
          {(['vencidos', 'proximos', 'aldia', 'todos'] as const).map((k) => (
            <TabsContent
              key={k}
              value={k}
              className="mt-3 focus-visible:outline-none focus-visible:ring-0"
            >
              {listByTab.length === 0 ? (
                <MobileCard variant="glass" className="p-8 rounded-2xl">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-2xl bg-muted p-5 mb-4">
                      <Truck className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {hasActiveFilters ? 'No se encontraron equipos' : 'No hay equipos en este estado'}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 mb-3">
                      {hasActiveFilters ? 'Intenta con otros filtros' : '¡Excelente trabajo!'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={clearFilters}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </MobileCard>
              ) : (
                <div className="space-y-2">
                  {listByTab.map((mant, index) => {
                    const categoria = fichaToCategoria.get(mant.ficha);

                    return (
                      <MobileCard
                        key={mant.id}
                        variant="glass"
                        className={cn(
                          'p-0 overflow-hidden transition-all duration-300 active:scale-[0.98] rounded-2xl',
                          getStatusStyles(mant.horasKmRestante),
                          'animate-in fade-in slide-in-from-left-2'
                        )}
                        style={{ animationDelay: `${index * 0.03}s` }}
                        onClick={() => handleOpenDetalle(mant.ficha)}
                      >
                        {/* Indicador de urgencia */}
                        {getUrgencyLevel(mant.horasKmRestante) && (
                          <div className={cn(
                            'px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2',
                            mant.horasKmRestante < -100 ? 'bg-destructive text-destructive-foreground' :
                              mant.horasKmRestante < -50 ? 'bg-red-600 text-white' :
                                mant.horasKmRestante < 0 ? 'bg-red-500/90 text-white' :
                                  'bg-amber-500 text-white'
                          )}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                            {getUrgencyLevel(mant.horasKmRestante)}
                          </div>
                        )}

                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Icono de estado */}
                            <div className={cn(
                              'rounded-xl p-2.5 shrink-0 border',
                              mant.horasKmRestante < 0 ? 'bg-destructive/10 border-destructive/20' :
                                mant.horasKmRestante <= config.alertaPreventiva ? 'bg-amber-500/10 border-amber-500/20' :
                                  'bg-emerald-500/10 border-emerald-500/20'
                            )}>
                              {getStatusIcon(mant.horasKmRestante)}
                            </div>

                            {/* Info del equipo */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold truncate">{mant.nombreEquipo}</p>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono rounded-md">
                                      {mant.ficha}
                                    </Badge>
                                    {categoria && (
                                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-md">
                                        {categoria}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {getStatusBadge(mant.horasKmRestante)}
                              </div>

                              {/* Métricas del equipo */}
                              <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border/30">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <Gauge className="h-3 w-3" />
                                  <span className="font-semibold">{mant.horasKmActuales}</span>
                                  <span className="text-muted-foreground/70">actual</span>
                                </div>
                                <div className="h-3 w-px bg-border/50" />
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <Timer className="h-3 w-3" />
                                  <span className="font-semibold">{mant.proximoMantenimiento}</span>
                                  <span className="text-muted-foreground/70">próximo</span>
                                </div>
                              </div>
                            </div>

                            {/* Botón de acción */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 rounded-xl shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/mechanic/reportar/${mant.ficha}`);
                                }}
                                aria-label="Reportar"
                              >
                                <Wrench className="h-4 w-4" />
                              </Button>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          </div>
                        </div>
                      </MobileCard>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Resumen rápido */}
        {equiposPendientes.length > 0 && (
          <MobileCard variant="glass" className="p-3 rounded-xl">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Mostrando <span className="font-semibold text-foreground">{listByTab.length}</span> de <span className="font-semibold text-foreground">{equiposPendientes.length}</span> equipos
              </span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3" />
                  Limpiar
                </Button>
              )}
            </div>
          </MobileCard>
        )}
      </div>

      <EquipoDetalleUnificado
        ficha={selectedFicha}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
      />
    </MobileLayout>
  );
}

export default MechanicPendingList;
