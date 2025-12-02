/**
 * Planificador Móvil - Rediseño Premium
 * 
 * Características:
 * - Glassmorphism en todas las cards
 * - Animaciones stagger de entrada
 * - Búsqueda premium con gradientes
 * - Estadísticas visuales superiores
 * - Navegación fluida lista → detalle
 * - Diseño consistente con otros módulos
 */

import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Wrench, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Equipo } from '@/types/equipment';
import { PlanConIntervalos } from '@/types/maintenance-plans';

interface MPSugerido {
    mp: string;
    horasActuales: number;
    razon: string;
    esManual: boolean;
}

interface PlanSugerido {
    plan: PlanConIntervalos;
    score: number;
    razon: string;
}

interface PlanificadorMobileProps {
    equipos: Equipo[];
    equipoSeleccionado: Equipo | null;
    onSelectEquipo: (ficha: string | null) => void;
    planActual: PlanConIntervalos | null;
    mpSugerido: MPSugerido | null;
    planesSugeridos: PlanSugerido[];
    onSeleccionarPlan: (planId: number) => void;
    onAsignarMPManual: (mp: string) => void;
    planManualOverride: Record<string, number>;
}

export function PlanificadorMobile({
    equipos,
    equipoSeleccionado,
    onSelectEquipo,
    planActual,
    mpSugerido,
    planesSugeridos,
    onSeleccionarPlan,
    onAsignarMPManual,
    planManualOverride
}: PlanificadorMobileProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Estadísticas de equipos
    const stats = useMemo(() => ({
        total: equipos.length,
        conPlan: equipos.filter(eq => planManualOverride[eq.ficha]).length,
        sinPlan: equipos.filter(eq => !planManualOverride[eq.ficha]).length,
    }), [equipos, planManualOverride]);

    const equiposFiltrados = equipos.filter(eq =>
        eq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.ficha.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (equipoSeleccionado) {
        return (
            <MobileLayout
                title={equipoSeleccionado.ficha}
                headerActions={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-primary/10 active:scale-90 transition-all"
                        onClick={() => onSelectEquipo(null)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                }
            >
                <div className="space-y-4">
                    {/* Info Equipo Premium */}
                    <MobileCard variant="glass" className="p-4 border-primary/20 shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                        <div className="relative space-y-3">
                            <h3 className="font-bold text-lg text-foreground/90">{equipoSeleccionado.nombre}</h3>
                            <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
                                <Badge variant="outline" className="glass-panel border-primary/20">{equipoSeleccionado.categoria}</Badge>
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {equipoSeleccionado.modelo}
                                </span>
                            </div>
                        </div>
                    </MobileCard>

                    {/* MP Sugerido Premium */}
                    {mpSugerido && (
                        <MobileCard
                            variant="glass"
                            className={cn(
                                "p-4 border-l-4 shadow-premium",
                                mpSugerido.esManual ? "border-l-amber-500 bg-amber-500/5" : "border-l-green-500 bg-green-500/5"
                            )}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-3 rounded-xl shadow-lg",
                                        mpSugerido.esManual ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    )}>
                                        <Wrench className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">{mpSugerido.mp}</span>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            {mpSugerido.esManual ? (
                                                <>
                                                    <Zap className="h-3 w-3" />
                                                    Manual
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Sugerido
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-foreground">{mpSugerido.horasActuales} hrs</p>
                                    <p className="text-xs text-muted-foreground">Actuales</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="glass-panel bg-muted/50 p-3 rounded-lg border border-border/30">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {mpSugerido.razon}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selección manual</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['PM1', 'PM2', 'PM3', 'PM4'].map((mp) => (
                                            <Button
                                                key={mp}
                                                variant={mpSugerido.mp === mp ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "w-full text-sm font-semibold transition-all active:scale-95",
                                                    mpSugerido.mp === mp && "bg-gradient-premium shadow-glow-primary"
                                                )}
                                                onClick={() => onAsignarMPManual(mp)}
                                            >
                                                {mp}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </MobileCard>
                    )}

                    {/* Planes Disponibles */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">Planes Disponibles</h4>
                        <div className="space-y-2">
                            {planesSugeridos.map(({ plan, score, razon }, index) => (
                                <MobileCard
                                    key={plan.id}
                                    variant="glass"
                                    className={cn(
                                        "p-4 cursor-pointer transition-all duration-300 active:scale-[0.98] border-2 animate-slide-in-up fill-mode-backwards",
                                        planManualOverride[equipoSeleccionado.ficha] === plan.id
                                            ? "border-primary bg-primary/5 shadow-glow-primary"
                                            : "border-transparent hover:border-primary/20 hover:shadow-premium"
                                    )}
                                    onClick={() => onSeleccionarPlan(plan.id)}
                                    style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-foreground/90 mb-1">{plan.nombre}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{razon}</p>
                                        </div>
                                        <Badge
                                            variant={score > 80 ? "default" : "secondary"}
                                            className={cn(
                                                "text-[0.65rem] ml-2 shadow-sm",
                                                score > 80 && "bg-gradient-premium border-0"
                                            )}
                                        >
                                            {score}% Match
                                        </Badge>
                                    </div>
                                    {planManualOverride[equipoSeleccionado.ficha] === plan.id && (
                                        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-fade-in">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Plan Seleccionado
                                        </div>
                                    )}
                                </MobileCard>
                            ))}
                        </div>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="Planificador Inteligente">
            <div className="space-y-6">
                {/* Estadísticas Premium */}
                <div className="grid grid-cols-3 gap-3">
                    <MobileCard variant="glass" className="p-3 text-center shadow-premium relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                        <p className="text-2xl font-bold text-primary relative z-10">{stats.total}</p>
                        <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium relative z-10">Total</p>
                    </MobileCard>
                    <MobileCard variant="glass" className="p-3 text-center shadow-premium relative overflow-hidden group border-green-500/20">
                        <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                        <p className="text-2xl font-bold text-green-600 relative z-10">{stats.conPlan}</p>
                        <p className="text-[0.65rem] uppercase tracking-wider text-green-600/80 font-medium relative z-10">Con Plan</p>
                    </MobileCard>
                    <MobileCard variant="glass" className="p-3 text-center shadow-premium relative overflow-hidden group border-amber-500/20">
                        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                        <p className="text-2xl font-bold text-amber-600 relative z-10">{stats.sinPlan}</p>
                        <p className="text-[0.65rem] uppercase tracking-wider text-amber-600/80 font-medium relative z-10">Sin Plan</p>
                    </MobileCard>
                </div>

                {/* Búsqueda Premium */}
                <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary-light/50 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative flex items-center bg-card rounded-xl shadow-sm border border-border/50">
                            <Search className="ml-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar equipo..."
                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 h-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Lista de Equipos con animaciones */}
                {equiposFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                        <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                            <Wrench className="h-10 w-10 text-primary/40" />
                        </div>
                        <p className="text-lg font-semibold text-foreground/80">No se encontraron equipos</p>
                        <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                            {searchTerm ? 'Intenta ajustar tu búsqueda' : 'No hay equipos disponibles'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 pb-24">
                        {equiposFiltrados.map((equipo, index) => (
                            <MobileCard
                                key={equipo.id}
                                variant="glass"
                                className="p-4 cursor-pointer transition-all duration-300 hover:shadow-premium active:scale-[0.98] border border-border/40 animate-slide-in-up fill-mode-backwards"
                                style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                                onClick={() => onSelectEquipo(equipo.ficha)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-foreground/90 truncate">{equipo.nombre}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{equipo.ficha}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <Badge variant="outline" className="text-[0.6rem] whitespace-nowrap glass-panel border-primary/20">
                                            {equipo.categoria}
                                        </Badge>
                                        {planManualOverride[equipo.ficha] && (
                                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </MobileCard>
                        ))}
                    </div>
                )}

                {/* Contador de resultados flotante */}
                {searchTerm && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-scale-in">
                        <div className="rounded-full bg-foreground/90 px-4 py-2 text-xs font-medium text-background shadow-xl backdrop-blur flex items-center gap-2">
                            <Search className="h-3 w-3" />
                            {equiposFiltrados.length} resultado{equiposFiltrados.length !== 1 && 's'}
                        </div>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
