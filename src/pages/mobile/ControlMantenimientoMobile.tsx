import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Search,
    Gauge,
    ClipboardList,
    CalendarCheck,
    Save,
    Clock,
    MapPinned,
    ChevronRight,
    Activity,
    Calendar,
    CheckCircle2,
    History,
    Wrench,
    AlertTriangle,
    Mic,
    Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MantenimientoProgramado, MantenimientoRealizado, Equipo, isEquipoDisponible } from '@/types/equipment';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { useToast } from '@/hooks/use-toast';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { VoiceMultiUpdate } from '@/components/VoiceMultiUpdate';

interface DatosMantenimiento {
    tipo?: string;
    fecha: string;
    horasRealizadas?: number;
    horasKm: number;
    observaciones?: string;
    unidad?: 'horas' | 'km';
    notas?: string;
    repuestos?: { id: number; cantidad: number }[];
}

interface ControlMantenimientoMobileProps {
    equipos: MantenimientoProgramado[];
    catalogoEquipos: Equipo[];
    onUpdateLectura: (id: number, lectura: number, fecha: string, notas?: string) => Promise<void>;
    onRegistrarMantenimiento: (id: number, datos: DatosMantenimiento) => Promise<void>;
    onVoiceBatchUpdate?: (updates: Array<{ mantenimientoId: number; lectura: number; ficha: string }>) => Promise<void>;
    loading?: boolean;
    isReadOnly?: boolean;
}

// Helper para resolver intervalo
const resolveIntervaloCodigo = (mantenimiento: MantenimientoProgramado | null) => {
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

export function ControlMantenimientoMobile({
    equipos,
    catalogoEquipos,
    onUpdateLectura,
    onRegistrarMantenimiento,
    onVoiceBatchUpdate,
    loading,
    isReadOnly
}: ControlMantenimientoMobileProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('lecturas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEquipo, setSelectedEquipo] = useState<MantenimientoProgramado | null>(null);

    // Estados para lectura
    const [lecturaActual, setLecturaActual] = useState('');
    const [fechaLectura, setFechaLectura] = useState(new Date().toISOString().split('T')[0]);
    const [notasLectura, setNotasLectura] = useState('');
    const [updating, setUpdating] = useState(false);

    // Estados para registro
    const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().split('T')[0]);
    const [observacionesRegistro, setObservacionesRegistro] = useState('');
    const [registering, setRegistering] = useState(false);

    // Estados para filtros en Estado
    const [estadoSearch, setEstadoSearch] = useState('');
    const [estadoCategoriaFilter, setEstadoCategoriaFilter] = useState('all');
    const [estadoVistaActiva, setEstadoVistaActiva] = useState<'pendientes' | 'actualizados'>('pendientes');

    // Estados para pestaña Estado
    const [fechaInicio, setFechaInicio] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 1); // Lunes
        return d.toISOString().split('T')[0];
    });
    const [fechaFin, setFechaFin] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 7); // Domingo
        return d.toISOString().split('T')[0];
    });

    // Lógica Caterpillar para Plan
    const equipoInfo = useMemo(() => {
        if (!selectedEquipo || !catalogoEquipos) return null;
        return catalogoEquipos.find(e => e.ficha === selectedEquipo.ficha);
    }, [selectedEquipo, catalogoEquipos]);

    const { data: catData, loading: catLoading } = useCaterpillarData(
        equipoInfo?.modelo || '',
        equipoInfo?.numeroSerie || ''
    );

    const intervaloCodigo = useMemo(() => {
        return resolveIntervaloCodigo(selectedEquipo);
    }, [selectedEquipo]);

    const tareasPlan = useMemo(() => {
        if (!intervaloCodigo || !catData.tareasPorIntervalo) return [];
        return catData.tareasPorIntervalo[intervaloCodigo] || [];
    }, [intervaloCodigo, catData]);

    const kitsPlan = useMemo(() => {
        if (!intervaloCodigo || !catData.piezasPorIntervalo) return [];
        return catData.piezasPorIntervalo[intervaloCodigo] || [];
    }, [intervaloCodigo, catData]);

    const equiposFiltrados = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return equipos.filter(e =>
            e.ficha.toLowerCase().includes(term) ||
            e.nombreEquipo.toLowerCase().includes(term)
        ).slice(0, 5); // Limitar resultados
    }, [equipos, searchTerm]);

    const estadoActualizacion = useMemo(() => {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);

        const actualizados: MantenimientoProgramado[] = [];
        const pendientes: MantenimientoProgramado[] = [];

        equipos.forEach(eq => {
            const fechaUltima = new Date(eq.fechaUltimaActualizacion);
            // Ajustar zona horaria si es necesario, pero asumimos ISO string
            if (fechaUltima >= inicio && fechaUltima <= fin) {
                actualizados.push(eq);
            } else {
                pendientes.push(eq);
            }
        });

        return { actualizados, pendientes };
    }, [equipos, fechaInicio, fechaFin]);

    const porcentajeCumplimiento = useMemo(() => {
        const total = equipos.length;
        if (total === 0) return 0;
        return Math.round((estadoActualizacion.actualizados.length / total) * 100);
    }, [equipos.length, estadoActualizacion.actualizados.length]);

    // Categorías disponibles para filtro
    const categoriasDisponibles = useMemo(() => {
        const cats = new Set(equipos.map(e => {
            const equipo = catalogoEquipos.find(ce => ce.ficha === e.ficha);
            return equipo?.categoria || 'Sin categoría';
        }));
        return Array.from(cats).sort();
    }, [equipos, catalogoEquipos]);

    // Filtrar y ordenar por ficha ascendente
    const filteredPendientes = useMemo(() => {
        let list = [...estadoActualizacion.pendientes];
        if (estadoSearch) {
            const term = estadoSearch.toLowerCase();
            list = list.filter(e => e.ficha.toLowerCase().includes(term) || e.nombreEquipo.toLowerCase().includes(term));
        }
        if (estadoCategoriaFilter !== 'all') {
            list = list.filter(e => {
                const equipo = catalogoEquipos.find(ce => ce.ficha === e.ficha);
                return equipo?.categoria === estadoCategoriaFilter;
            });
        }
        return list.sort((a, b) => a.ficha.localeCompare(b.ficha, undefined, { numeric: true }));
    }, [estadoActualizacion.pendientes, estadoSearch, estadoCategoriaFilter, catalogoEquipos]);

    const filteredActualizados = useMemo(() => {
        let list = [...estadoActualizacion.actualizados];
        if (estadoSearch) {
            const term = estadoSearch.toLowerCase();
            list = list.filter(e => e.ficha.toLowerCase().includes(term) || e.nombreEquipo.toLowerCase().includes(term));
        }
        if (estadoCategoriaFilter !== 'all') {
            list = list.filter(e => {
                const equipo = catalogoEquipos.find(ce => ce.ficha === e.ficha);
                return equipo?.categoria === estadoCategoriaFilter;
            });
        }
        return list.sort((a, b) => a.ficha.localeCompare(b.ficha, undefined, { numeric: true }));
    }, [estadoActualizacion.actualizados, estadoSearch, estadoCategoriaFilter, catalogoEquipos]);

    const handleSelectEquipo = (equipo: MantenimientoProgramado) => {
        setSelectedEquipo(equipo);
        setLecturaActual(equipo.horasKmActuales.toString());
        setSearchTerm(''); // Limpiar búsqueda para enfocar en el seleccionado
    };

    const handleUpdate = async () => {
        if (!selectedEquipo || !lecturaActual) return;

        const nuevaLectura = Number(lecturaActual);
        if (isNaN(nuevaLectura)) {
            toast({ title: "Error", description: "La lectura debe ser un número válido", variant: "destructive" });
            return;
        }

        if (nuevaLectura < selectedEquipo.horasKmActuales) {
            toast({
                title: "Advertencia",
                description: "La nueva lectura es menor a la actual. Verifica el dato.",
                variant: "destructive"
            });
            return;
        }

        setUpdating(true);
        try {
            await onUpdateLectura(
                selectedEquipo.id,
                nuevaLectura,
                new Date(fechaLectura).toISOString(),
                notasLectura
            );
            toast({ title: "Lectura actualizada", description: `Nueva lectura para ${selectedEquipo.ficha}: ${nuevaLectura}` });
            setSelectedEquipo(null);
            setNotasLectura('');
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar la lectura", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const handleRegister = async () => {
        if (!selectedEquipo) return;
        setRegistering(true);
        try {
            await onRegistrarMantenimiento(selectedEquipo.id, {
                tipo: selectedEquipo.tipoMantenimiento,
                fecha: fechaRegistro,
                horasKm: Number(lecturaActual), // Usar la lectura actual o la que se haya modificado
                observaciones: observacionesRegistro,
                unidad: selectedEquipo.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas'
            });
            toast({ title: "Mantenimiento registrado", description: "El mantenimiento ha sido guardado exitosamente" });
            setSelectedEquipo(null);
            setObservacionesRegistro('');
        } catch (error) {
            toast({ title: "Error", description: "No se pudo registrar el mantenimiento", variant: "destructive" });
        } finally {
            setRegistering(false);
        }
    };

    return (
        <MobileLayout title="Control Operativo">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="lecturas">
                        <Gauge className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Lecturas</span>
                        <span className="sm:hidden">Lect.</span>
                    </TabsTrigger>
                    <TabsTrigger value="registro">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Registrar</span>
                        <span className="sm:hidden">Reg.</span>
                    </TabsTrigger>
                    <TabsTrigger value="plan">
                        <CalendarCheck className="h-4 w-4 mr-2" />
                        Plan
                    </TabsTrigger>
                    <TabsTrigger value="estado">
                        <Activity className="h-4 w-4 mr-2" />
                        Estado
                    </TabsTrigger>
                </TabsList>

                <div className="space-y-4 pb-20">
                    {/* Contenido de Pestañas */}
                    <TabsContent value="lecturas" className="mt-0 space-y-4">
                        {/* Buscador de Equipos (Solo visible en Lecturas si no hay seleccionado) */}
                        {!selectedEquipo && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar equipo por ficha..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-12 text-lg"
                                        autoFocus
                                    />
                                </div>

                                {equiposFiltrados.length > 0 && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase px-1">Resultados</p>
                                        {equiposFiltrados.map(equipo => (
                                            <MobileCard
                                                key={equipo.id}
                                                onClick={() => handleSelectEquipo(equipo)}
                                                className="active:scale-[0.98] transition-transform"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{equipo.ficha}</h3>
                                                        <p className="text-sm text-muted-foreground">{equipo.nombreEquipo}</p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </MobileCard>
                                        ))}
                                    </div>
                                )}

                                {searchTerm && equiposFiltrados.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No se encontraron equipos</p>
                                    </div>
                                )}

                                {!searchTerm && (
                                    <div className="text-center py-12 opacity-50">
                                        <Gauge className="h-12 w-12 mx-auto mb-2" />
                                        <p>Ingresa una ficha para comenzar</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Vista de Equipo Seleccionado (Solo en Lecturas) */}
                        {selectedEquipo && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-xl border border-border/50">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedEquipo.ficha}</h2>
                                        <p className="text-sm text-muted-foreground">{selectedEquipo.nombreEquipo}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedEquipo.tipoMantenimiento}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEquipo(null)}>
                                        Cambiar
                                    </Button>
                                </div>

                                {/* Información contextual del mantenimiento */}
                                <MobileCard variant="glass" className="p-4">
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Estado del Mantenimiento
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                Última actualización
                                            </span>
                                            <span className="text-xs font-medium">
                                                {new Date(selectedEquipo.fechaUltimaActualizacion).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        {selectedEquipo.fechaUltimoMantenimiento && (
                                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                                <span className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Wrench className="h-3 w-3" />
                                                    Último mantenimiento
                                                </span>
                                                <span className="text-xs font-medium">
                                                    {new Date(selectedEquipo.fechaUltimoMantenimiento).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-xs text-muted-foreground">Estado</span>
                                            <Badge
                                                variant={getRemainingVariant(selectedEquipo.horasKmRestante)}
                                                className="h-5 px-2 py-0.5 text-[10px] leading-none font-medium tabular-nums"
                                            >
                                                {formatRemainingLabel(
                                                    selectedEquipo.horasKmRestante,
                                                    selectedEquipo.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas'
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </MobileCard>

                                {/* Formulario de actualización de lectura */}
                                <MobileCard className="p-4 sm:p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Gauge className="h-4 w-4" />
                                            Nueva Lectura
                                        </label>
                                        <Input
                                            type="number"
                                            value={lecturaActual}
                                            onChange={(e) => setLecturaActual(e.target.value)}
                                            className="text-2xl sm:text-3xl font-bold h-14 sm:h-16 text-center tracking-widest"
                                            placeholder="0"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                                            <span className="tabular-nums">Anterior: {selectedEquipo.horasKmActuales.toLocaleString('es-ES')}</span>
                                            <span className={cn(
                                                "font-medium",
                                                Number(lecturaActual) < selectedEquipo.horasKmActuales && "text-destructive"
                                            )}>
                                                <span className="tabular-nums">
                                                    Diferencia: {(Number(lecturaActual || 0) - selectedEquipo.horasKmActuales).toLocaleString('es-ES')}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Fecha de Actualización
                                        </label>
                                        <Input
                                            type="date"
                                            value={fechaLectura}
                                            onChange={(e) => setFechaLectura(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Notas (Opcional)</label>
                                        <Input
                                            placeholder="Observaciones adicionales..."
                                            value={notasLectura}
                                            onChange={(e) => setNotasLectura(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>

                                    <Button
                                        className="w-full h-12 text-base font-semibold"
                                        onClick={handleUpdate}
                                        disabled={updating || !lecturaActual}
                                    >
                                        {updating ? (
                                            <>
                                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Actualizar Lectura
                                            </>
                                        )}
                                    </Button>
                                </MobileCard>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="registro" className="mt-0 space-y-6">
                        {/* Reutilizamos el buscador si no hay equipo seleccionado */}
                        {!selectedEquipo ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar equipo para registrar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-12 text-lg"
                                    />
                                </div>
                                {equiposFiltrados.map(equipo => (
                                    <MobileCard
                                        key={equipo.id}
                                        onClick={() => handleSelectEquipo(equipo)}
                                        className="active:scale-[0.98] transition-transform"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-lg">{equipo.ficha}</h3>
                                                <p className="text-sm text-muted-foreground">{equipo.nombreEquipo}</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </MobileCard>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedEquipo.ficha}</h2>
                                        <p className="text-sm text-muted-foreground">{selectedEquipo.nombreEquipo}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEquipo(null)}>
                                        Cambiar
                                    </Button>
                                </div>
                                <MobileCard className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Fecha</label>
                                            <Input
                                                type="date"
                                                value={fechaRegistro}
                                                onChange={(e) => setFechaRegistro(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Lectura al momento</label>
                                            <Input
                                                type="number"
                                                value={lecturaActual}
                                                onChange={(e) => setLecturaActual(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Observaciones</label>
                                            <Input
                                                value={observacionesRegistro}
                                                onChange={(e) => setObservacionesRegistro(e.target.value)}
                                                placeholder="Detalles del trabajo realizado..."
                                            />
                                        </div>

                                        <Button
                                            className="w-full h-12"
                                            onClick={handleRegister}
                                            disabled={registering}
                                        >
                                            {registering ? 'Registrando...' : 'Confirmar Mantenimiento'}
                                        </Button>
                                    </div>
                                </MobileCard>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="plan" className="mt-0 space-y-4">
                        {!selectedEquipo ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar equipo para ver plan..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-12 text-lg"
                                    />
                                </div>
                                {equiposFiltrados.map(equipo => (
                                    <MobileCard
                                        key={equipo.id}
                                        onClick={() => handleSelectEquipo(equipo)}
                                        className="active:scale-[0.98] transition-transform"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-lg">{equipo.ficha}</h3>
                                                <p className="text-sm text-muted-foreground">{equipo.nombreEquipo}</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </MobileCard>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedEquipo.ficha}</h2>
                                        <p className="text-sm text-muted-foreground">{selectedEquipo.nombreEquipo}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEquipo(null)}>
                                        Cambiar
                                    </Button>
                                </div>
                                <MobileCard>
                                    <div className="grid grid-cols-2 gap-4 p-2">
                                        <div className="text-center p-2 bg-muted/50 rounded-lg">
                                            <p className="text-xs text-muted-foreground uppercase">Próximo</p>
                                            <p className="text-xl font-bold">{selectedEquipo.proximoMantenimiento}</p>
                                        </div>
                                        <div className={cn("text-center p-2 rounded-lg",
                                            selectedEquipo.horasKmRestante < 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                        )}>
                                            <p className="text-xs uppercase opacity-80">Restante</p>
                                            <p className="text-xl font-bold">{formatRemainingLabel(selectedEquipo.horasKmRestante)}</p>
                                        </div>
                                    </div>
                                </MobileCard>

                                {/* Detalles del Plan Caterpillar */}
                                <div className="space-y-4">
                                    <h3 className="font-medium px-1 flex items-center gap-2">
                                        <Wrench className="h-4 w-4" />
                                        Detalles del Mantenimiento ({intervaloCodigo || 'N/A'})
                                    </h3>

                                    {catLoading ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                            Cargando plan...
                                        </div>
                                    ) : (
                                        <>
                                            {tareasPlan.length > 0 ? (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase px-1">Tareas ({tareasPlan.length})</p>
                                                    <div className="space-y-2">
                                                        {tareasPlan.map((tarea, idx) => (
                                                            <MobileCard key={idx} className="p-3 text-sm">
                                                                {tarea}
                                                            </MobileCard>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-muted-foreground bg-muted/20 rounded-xl">
                                                    No hay tareas definidas para este intervalo.
                                                </div>
                                            )}

                                            {kitsPlan.length > 0 && (
                                                <div className="space-y-2 mt-4">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase px-1">Repuestos ({kitsPlan.length})</p>
                                                    <div className="space-y-2">
                                                        {kitsPlan.map((item, idx) => (
                                                            <MobileCard key={idx} className="p-3 flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-medium text-sm">{item.pieza.numero_parte}</p>
                                                                    <p className="text-xs text-muted-foreground">{item.pieza.descripcion}</p>
                                                                </div>
                                                                <Badge variant="outline">{item.cantidad} un.</Badge>
                                                            </MobileCard>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-medium px-1">Historial Reciente</h3>
                                    <div className="text-center py-8 text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed">
                                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No hay registros recientes disponibles en esta vista rápida.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="estado" className="mt-0 space-y-4">
                        <MobileCard className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Rango de Fecha</h3>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Desde</label>
                                    <Input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Hasta</label>
                                    <Input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </MobileCard>

                        {/* KPIs */}
                        <div className="grid grid-cols-2 gap-3">
                            <MobileCard
                                className={cn(
                                    "p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
                                    estadoVistaActiva === 'actualizados'
                                        ? "bg-emerald-500/15 border-emerald-500/40 ring-2 ring-emerald-500/30"
                                        : "bg-emerald-500/5 border-emerald-500/20"
                                )}
                                onClick={() => setEstadoVistaActiva('actualizados')}
                            >
                                <span className="text-3xl font-bold text-emerald-600">{estadoActualizacion.actualizados.length}</span>
                                <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider mt-1">Actualizados</span>
                            </MobileCard>
                            <MobileCard
                                className={cn(
                                    "p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
                                    estadoVistaActiva === 'pendientes'
                                        ? "bg-destructive/15 border-destructive/40 ring-2 ring-destructive/30"
                                        : "bg-destructive/5 border-destructive/20"
                                )}
                                onClick={() => setEstadoVistaActiva('pendientes')}
                            >
                                <span className="text-3xl font-bold text-destructive">{estadoActualizacion.pendientes.length}</span>
                                <span className="text-xs font-medium text-destructive uppercase tracking-wider mt-1">Pendientes</span>
                            </MobileCard>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Cumplimiento</span>
                                <span className="font-bold">{porcentajeCumplimiento}%</span>
                            </div>
                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${porcentajeCumplimiento}%` }}
                                />
                            </div>
                        </div>

                        {/* Filtros de búsqueda */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar ficha o nombre..."
                                    value={estadoSearch}
                                    onChange={(e) => setEstadoSearch(e.target.value)}
                                    className="pl-9 h-10"
                                />
                            </div>
                            <Select value={estadoCategoriaFilter} onValueChange={setEstadoCategoriaFilter}>
                                <SelectTrigger className="w-[120px] h-10">
                                    <Filter className="h-3.5 w-3.5 mr-1" />
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {categoriasDisponibles.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Voz Multi-Ficha Mobile */}
                        {onVoiceBatchUpdate && (
                            <MobileCard className="p-4">
                                <VoiceMultiUpdate
                                    onUpdateBatch={onVoiceBatchUpdate}
                                    isReadOnly={isReadOnly}
                                />
                            </MobileCard>
                        )}

                        {/* Lista de equipos */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold px-1">
                                    {estadoVistaActiva === 'pendientes' ? 'Pendientes' : 'Actualizados'}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    {estadoVistaActiva === 'pendientes' ? filteredPendientes.length : filteredActualizados.length} equipos
                                </Badge>
                            </div>

                            {estadoVistaActiva === 'pendientes' ? (
                                filteredPendientes.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredPendientes.map(eq => (
                                            <MobileCard key={eq.id} className="border-l-4 border-l-destructive">
                                                <div className="flex justify-between items-center">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-sm">{eq.ficha}</h4>
                                                        <p className="text-xs text-muted-foreground truncate">{eq.nombreEquipo}</p>
                                                        <p className="text-[10px] text-muted-foreground">Última act: {new Date(eq.fechaUltimaActualizacion).toLocaleDateString()}</p>
                                                    </div>
                                                    <Button size="sm" variant="outline" className="h-8 ml-2 shrink-0" onClick={() => {
                                                        setSelectedEquipo(eq);
                                                        setActiveTab('lecturas');
                                                    }}>
                                                        Actualizar
                                                    </Button>
                                                </div>
                                            </MobileCard>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        {estadoSearch ? 'Sin resultados para la búsqueda' : 'No hay equipos pendientes'}
                                    </div>
                                )
                            ) : (
                                filteredActualizados.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredActualizados.map(eq => (
                                            <MobileCard key={eq.id} className="border-l-4 border-l-emerald-500">
                                                <div className="flex justify-between items-center">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-sm">{eq.ficha}</h4>
                                                        <p className="text-xs text-muted-foreground truncate">{eq.nombreEquipo}</p>
                                                        <p className="text-[10px] text-muted-foreground">Actualizado: {new Date(eq.fechaUltimaActualizacion).toLocaleDateString()}</p>
                                                    </div>
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                                </div>
                                            </MobileCard>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        {estadoSearch ? 'Sin resultados para la búsqueda' : 'No hay equipos actualizados en este rango'}
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </MobileLayout>
    );
}
