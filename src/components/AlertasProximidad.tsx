import { useMemo } from 'react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Bell,
    AlertTriangle,
    AlertCircle,
    Clock,
    Wrench,
    ChevronRight,
    Gauge,
    TrendingDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AlertaProximidad {
    id: string;
    fichaEquipo: string;
    nombreEquipo: string;
    categoria: string;
    marca: string | null;
    horasActuales: number;
    horasRestantes: number;
    proximoMP: string;
    nivel: 'critico' | 'alerta' | 'proximo';
    mensaje: string;
}

export function AlertasProximidad() {
    const navigate = useNavigate();
    const { data } = useSupabaseDataContext();

    // Generar alertas basadas en los mantenimientos programados
    const alertas = useMemo((): AlertaProximidad[] => {
        if (!data.mantenimientosProgramados || data.mantenimientosProgramados.length === 0) {
            return [];
        }

        // Solo equipos activos
        const equiposActivos = new Set(data.equipos.filter(e => e.activo).map(e => e.ficha));

        return data.mantenimientosProgramados
            .filter(m => equiposActivos.has(m.ficha))
            .map(m => {
                const equipo = data.equipos.find(e => e.ficha === m.ficha);
                const horasRestantes = m.horasKmRestante;

                let nivel: 'critico' | 'alerta' | 'proximo';
                let mensaje: string;

                if (horasRestantes <= 0) {
                    nivel = 'critico';
                    mensaje = `⚠️ VENCIDO: ${Math.abs(horasRestantes).toFixed(0)}h de retraso`;
                } else if (horasRestantes <= 25) {
                    nivel = 'critico';
                    mensaje = `🚨 CRÍTICO: Faltan solo ${horasRestantes.toFixed(0)}h`;
                } else if (horasRestantes <= 50) {
                    nivel = 'alerta';
                    mensaje = `⚡ ALERTA: Faltan ${horasRestantes.toFixed(0)}h`;
                } else if (horasRestantes <= 100) {
                    nivel = 'proximo';
                    mensaje = `📅 PRÓXIMO: Faltan ${horasRestantes.toFixed(0)}h`;
                } else {
                    return null; // No mostrar alertas para equipos con más de 100h restantes
                }

                // Extraer código de MP
                let proximoMP = m.tipoMantenimiento;
                const match = m.tipoMantenimiento.match(/(PM\d)/i);
                if (match?.[1]) {
                    proximoMP = match[1].toUpperCase();
                }

                return {
                    id: m.id.toString(),
                    fichaEquipo: m.ficha,
                    nombreEquipo: m.nombreEquipo,
                    categoria: equipo?.categoria || 'Sin categoría',
                    marca: equipo?.marca || null,
                    horasActuales: m.horasKmActuales,
                    horasRestantes,
                    proximoMP,
                    nivel,
                    mensaje,
                };
            })
            .filter((a): a is AlertaProximidad => a !== null)
            .sort((a, b) => a.horasRestantes - b.horasRestantes);
    }, [data.mantenimientosProgramados, data.equipos]);

    // Agrupar por nivel
    const alertasCriticas = alertas.filter(a => a.nivel === 'critico');
    const alertasAlerta = alertas.filter(a => a.nivel === 'alerta');
    const alertasProximas = alertas.filter(a => a.nivel === 'proximo');

    const getNivelConfig = (nivel: 'critico' | 'alerta' | 'proximo') => {
        switch (nivel) {
            case 'critico':
                return {
                    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                    textColor: 'text-red-700 dark:text-red-300',
                    badgeClass: 'bg-red-600 hover:bg-red-700',
                    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
                };
            case 'alerta':
                return {
                    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
                    textColor: 'text-amber-700 dark:text-amber-300',
                    badgeClass: 'bg-amber-600 hover:bg-amber-700',
                    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                };
            case 'proximo':
                return {
                    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                    textColor: 'text-blue-700 dark:text-blue-300',
                    badgeClass: 'bg-blue-600 hover:bg-blue-700',
                    icon: <Clock className="h-4 w-4 text-blue-500" />,
                };
        }
    };

    if (alertas.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bell className="h-5 w-5 text-primary" />
                        Alertas de Mantenimiento
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                        No hay alertas de mantenimiento pendientes
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Todos los equipos están al día
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bell className="h-5 w-5 text-primary" />
                            Alertas de Mantenimiento
                            {alertas.length > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {alertas.length}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Equipos que requieren atención próximamente
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/mantenimiento')}
                    >
                        Ver todos
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Resumen rápido */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Críticos</p>
                            <p className="text-lg font-bold text-red-600">{alertasCriticas.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Alertas</p>
                            <p className="text-lg font-bold text-amber-600">{alertasAlerta.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Próximos</p>
                            <p className="text-lg font-bold text-blue-600">{alertasProximas.length}</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Lista de alertas */}
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                        {alertas.slice(0, 10).map((alerta) => {
                            const config = getNivelConfig(alerta.nivel);
                            return (
                                <div
                                    key={alerta.id}
                                    className={cn(
                                        'p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.01]',
                                        config.bgColor
                                    )}
                                    onClick={() => navigate(`/mantenimiento?ficha=${alerta.fichaEquipo}`)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{config.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-sm truncate">
                                                    {alerta.fichaEquipo} - {alerta.nombreEquipo}
                                                </p>
                                                <Badge className={cn('text-xs shrink-0', config.badgeClass)}>
                                                    {alerta.proximoMP}
                                                </Badge>
                                            </div>
                                            <p className={cn('text-xs mt-1', config.textColor)}>
                                                {alerta.mensaje}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Gauge className="h-3 w-3" />
                                                    {alerta.horasActuales.toFixed(0)}h actuales
                                                </span>
                                                {alerta.marca && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{alerta.marca}</span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <span>{alerta.categoria}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </div>
                                </div>
                            );
                        })}

                        {alertas.length > 10 && (
                            <div className="text-center pt-2">
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => navigate('/mantenimiento')}
                                >
                                    Ver {alertas.length - 10} alertas más...
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer con estadísticas */}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Promedio: {(alertas.reduce((a, b) => a + b.horasRestantes, 0) / alertas.length).toFixed(0)}h restantes
                    </span>
                    <span>
                        Última actualización: ahora
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
