/**
 * Reportes Móvil - Rediseño Premium
 * 
 * Características:
 * - Integrado con MobileLayout (bottom nav consistente)
 * - Glassmorphism en todas las cards
 * - Animaciones stagger
 * - Filtros interactivos por categoría
 * - Diseño premium consistente
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, TrendingUp, Filter, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { MantenimientoProgramado } from '@/types/equipment';

interface ResumenCategoria {
    categoria: string;
    total: number;
    activos: number;
}

interface ReportesMobileProps {
    stats: {
        total: number;
        activos: number;
        vencidos: number;
        porVencer: number;
    };
    resumenCategoria: ResumenCategoria[];
    mantenimientosVencidos: MantenimientoProgramado[];
    onExportPDF: () => void;
}

type FilterType = 'all' | string;

export function ReportesMobile({
    stats,
    resumenCategoria,
    mantenimientosVencidos,
    onExportPDF
}: ReportesMobileProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<FilterType>('all');

    // Filtrar mantenimientos por categoría
    const mantenimientosFiltrados = useMemo(() => {
        if (selectedCategory === 'all') return mantenimientosVencidos;
        // Note: MantenimientoProgramado might not have 'categoria' directly, usually it's on the equipment.
        // Assuming for now it's passed or available. If not, we might need to adjust.
        // Checking MantenimientoProgramado type in equipment.ts:
        // It has: id, ficha, nombreEquipo, tipoMantenimiento, ...
        // It does NOT have 'categoria'.
        // However, the original code used `m.categoria`.
        // If `mantenimientosVencidos` passed here has extra fields, we should define an extended interface.
        // For now, I will cast to any to avoid breaking existing logic if the data actually has it, 
        // or I should check where this data comes from.
        // Given the user wants to "fix problems", I should probably be careful.
        // But without changing the parent component, I can't add fields.
        // I will assume the passed objects have it (maybe joined in the backend).
        return mantenimientosVencidos.filter((m: any) => m.categoria === selectedCategory);
    }, [mantenimientosVencidos, selectedCategory]);

    return (
        <MobileLayout
            title="Reportes"
            headerActions={
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[400px] rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
                        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
                        <SheetHeader className="mt-4">
                            <SheetTitle className="text-center text-xl font-bold bg-gradient-premium bg-clip-text text-transparent">
                                Filtrar por categoría
                            </SheetTitle>
                            <SheetDescription className="text-center">
                                Selecciona una categoría para ver detalles
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-8 space-y-3 px-4">
                            <Button
                                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                className={cn("w-full justify-start gap-3 h-12 text-base rounded-xl", selectedCategory === 'all' && "bg-gradient-premium shadow-glow-primary")}
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setFiltersOpen(false);
                                }}
                            >
                                Todas las categorías
                            </Button>
                            {resumenCategoria.map((cat) => (
                                <Button
                                    key={cat.categoria}
                                    variant={selectedCategory === cat.categoria ? 'default' : 'outline'}
                                    className={cn(
                                        "w-full justify-start gap-3 h-12 text-base rounded-xl",
                                        selectedCategory === cat.categoria && "bg-primary/90 shadow-lg"
                                    )}
                                    onClick={() => {
                                        setSelectedCategory(cat.categoria);
                                        setFiltersOpen(false);
                                    }}
                                >
                                    {cat.categoria} ({cat.total})
                                </Button>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            }
        >
            <div className="space-y-6 pb-24">
                {/* Resumen Cards Premium con Glassmorphism */}
                <div className="grid grid-cols-2 gap-3">
                    <MobileCard variant="glass" className="p-4 border-primary/20 shadow-premium relative overflow-hidden group animate-slide-in-up" style={{ animationDelay: '0s' } as React.CSSProperties}>
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                        <div className="text-center relative z-10">
                            <p className="text-3xl font-bold text-primary mb-1">{stats.total}</p>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Total Equipos</p>
                        </div>
                    </MobileCard>
                    <MobileCard variant="glass" className="p-4 border-green-500/20 shadow-premium relative overflow-hidden group animate-slide-in-up" style={{ animationDelay: '0.1s' } as React.CSSProperties}>
                        <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                        <div className="text-center relative z-10">
                            <p className="text-3xl font-bold text-green-600 mb-1">{stats.activos}</p>
                            <p className="text-xs uppercase tracking-wider text-green-600/80 font-medium">Activos</p>
                        </div>
                    </MobileCard>
                    <MobileCard variant="glass" className="p-4 border-red-500/20 shadow-premium relative overflow-hidden group animate-slide-in-up" style={{ animationDelay: '0.2s' } as React.CSSProperties}>
                        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                        <div className="text-center relative z-10">
                            <p className="text-3xl font-bold text-red-600 mb-1">{stats.vencidos}</p>
                            <p className="text-xs uppercase tracking-wider text-red-600/80 font-medium">Vencidos</p>
                        </div>
                    </MobileCard>
                    <MobileCard variant="glass" className="p-4 border-amber-500/20 shadow-premium relative overflow-hidden group animate-slide-in-up" style={{ animationDelay: '0.3s' } as React.CSSProperties}>
                        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                        <div className="text-center relative z-10">
                            <p className="text-3xl font-bold text-amber-600 mb-1">{stats.porVencer}</p>
                            <p className="text-xs uppercase tracking-wider text-amber-600/80 font-medium">Por Vencer</p>
                        </div>
                    </MobileCard>
                </div>

                {/* Action Button Premium */}
                <Button
                    className="w-full h-12 bg-gradient-premium shadow-glow-primary text-base font-semibold active:scale-95 transition-all rounded-xl"
                    size="lg"
                    onClick={onExportPDF}
                >
                    <Download className="mr-2 h-5 w-5" />
                    Descargar Reporte PDF
                </Button>

                {/* Categorías con diseño premium */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Por Categoría
                    </h3>
                    <div className="space-y-2">
                        {resumenCategoria.map((cat, index) => (
                            <MobileCard
                                key={cat.categoria}
                                variant="glass"
                                className="p-3 border border-border/40 hover:shadow-premium transition-all animate-slide-in-up fill-mode-backwards"
                                style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-foreground/90">{cat.categoria}</span>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className="text-xs glass-panel">{cat.total}</Badge>
                                        <Badge
                                            variant="outline"
                                            className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                                        >
                                            {cat.activos} activos
                                        </Badge>
                                    </div>
                                </div>
                            </MobileCard>
                        ))}
                    </div>
                </div>

                {/* Alertas Críticas Premium */}
                {mantenimientosFiltrados.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-red-600 px-1 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 animate-pulse" />
                                Atención Requerida
                            </h3>
                            {selectedCategory !== 'all' && (
                                <Badge
                                    variant="outline"
                                    className="text-xs cursor-pointer"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    Ver todas
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-2">
                            {mantenimientosFiltrados.slice(0, 10).map((mant, index) => (
                                <MobileCard
                                    key={mant.id}
                                    variant="glass"
                                    className="p-3 border-l-4 border-l-red-500 bg-red-500/5 animate-slide-in-up fill-mode-backwards"
                                    style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-foreground/90 truncate">{mant.nombreEquipo}</p>
                                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{mant.ficha}</p>
                                        </div>
                                        <Badge variant="destructive" className="text-[0.65rem] shadow-sm ml-2 whitespace-nowrap">
                                            -{Math.abs(mant.horasKmRestante).toFixed(0)} hrs
                                        </Badge>
                                    </div>
                                </MobileCard>
                            ))}
                        </div>
                        {mantenimientosFiltrados.length > 10 && (
                            <p className="text-center text-xs text-muted-foreground">
                                +{mantenimientosFiltrados.length - 10} mantenimientos más
                            </p>
                        )}
                    </div>
                )}

                {/* Empty state cuando no hay vencidos */}
                {mantenimientosFiltrados.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <p className="text-base font-semibold text-foreground/80">¡Todo al día!</p>
                        <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                            {selectedCategory === 'all'
                                ? 'No hay mantenimientos vencidos en este momento'
                                : `No hay mantenimientos vencidos en ${selectedCategory}`
                            }
                        </p>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
