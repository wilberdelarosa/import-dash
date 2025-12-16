import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Loader2, AlertTriangle, Package, Wrench, Calendar, HelpCircle, Truck, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { useTicketAttachments } from '@/hooks/useTicketAttachments';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import type { CreateTicketData, TicketProblemType, TicketPriority } from '@/types/tickets';

interface CreateTicketFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    equipoId?: number;
    ficha?: string;
    equipoNombre?: string;
    onSuccess?: (ticketId: string) => void;
}

interface PhotoPreview {
    file: File;
    preview: string;
}

const problemTypeOptions: { value: TicketProblemType; label: string; icon: React.ReactNode }[] = [
    { value: 'averia', label: 'Avería', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
    { value: 'falta_pieza', label: 'Falta Pieza', icon: <Package className="h-4 w-4 text-amber-500" /> },
    { value: 'preventivo', label: 'Preventivo', icon: <Calendar className="h-4 w-4 text-blue-500" /> },
    { value: 'correctivo', label: 'Correctivo', icon: <Wrench className="h-4 w-4 text-purple-500" /> },
    { value: 'otro', label: 'Otro', icon: <HelpCircle className="h-4 w-4 text-slate-500" /> },
];

const priorityOptions: { value: TicketPriority; label: string; color: string }[] = [
    { value: 'baja', label: 'Baja', color: 'bg-slate-500' },
    { value: 'media', label: 'Media', color: 'bg-blue-500' },
    { value: 'alta', label: 'Alta', color: 'bg-amber-500' },
    { value: 'critica', label: 'Crítica', color: 'bg-red-500' },
];

export function CreateTicketForm({
    open,
    onOpenChange,
    equipoId: propEquipoId,
    ficha: propFicha,
    equipoNombre: propEquipoNombre,
    onSuccess
}: CreateTicketFormProps) {
    const { isMobile } = useDeviceDetection();
    const { createTicket } = useEquipmentTickets();
    const { uploadMultipleAttachments, uploading } = useTicketAttachments();
    const { data } = useSupabaseDataContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedEquipoId, setSelectedEquipoId] = useState<number | null>(null);
    const [equipoSearch, setEquipoSearch] = useState('');

    const equipoId = propEquipoId ?? selectedEquipoId ?? undefined;
    const selectedEquipo = useMemo(() => {
        if (propEquipoId) return { id: propEquipoId, ficha: propFicha || '', nombre: propEquipoNombre || '' };
        if (selectedEquipoId) {
            const eq = data.equipos.find(e => e.id === selectedEquipoId);
            return eq ? { id: eq.id, ficha: eq.ficha, nombre: eq.nombre } : null;
        }
        return null;
    }, [propEquipoId, propFicha, propEquipoNombre, selectedEquipoId, data.equipos]);

    const ficha = selectedEquipo?.ficha;
    const equipoNombre = selectedEquipo?.nombre;

    const filteredEquipos = useMemo(() => {
        if (!equipoSearch.trim()) return data.equipos.filter(e => e.activo).slice(0, 6);
        const query = equipoSearch.toLowerCase();
        return data.equipos
            .filter(e => e.activo && (
                e.ficha.toLowerCase().includes(query) ||
                e.nombre.toLowerCase().includes(query) ||
                e.marca.toLowerCase().includes(query)
            ))
            .slice(0, 6);
    }, [data.equipos, equipoSearch]);

    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipoProblem, setTipoProblema] = useState<TicketProblemType>('averia');
    const [prioridad, setPrioridad] = useState<TicketPriority>('media');
    const [piezaSolicitada, setPiezaSolicitada] = useState('');
    const [numeroParte, setNumeroParte] = useState('');
    const [cantidadRequerida, setCantidadRequerida] = useState('1');
    const [photos, setPhotos] = useState<PhotoPreview[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setTitulo('');
        setDescripcion('');
        setTipoProblema('averia');
        setPrioridad('media');
        setPiezaSolicitada('');
        setNumeroParte('');
        setCantidadRequerida('1');
        photos.forEach(p => URL.revokeObjectURL(p.preview));
        setPhotos([]);
        if (!propEquipoId) {
            setSelectedEquipoId(null);
            setEquipoSearch('');
        }
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPhotos: PhotoPreview[] = [];
        for (const file of Array.from(files)) {
            if (photos.length + newPhotos.length >= 5) break;
            if (!file.type.startsWith('image/')) continue;
            if (file.size > 10 * 1024 * 1024) continue;

            newPhotos.push({
                file,
                preview: URL.createObjectURL(file),
            });
        }

        setPhotos(prev => [...prev, ...newPhotos]);
        e.target.value = '';
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async () => {
        if (!equipoId || !ficha) return;
        if (!titulo.trim() || !descripcion.trim()) return;

        setIsSubmitting(true);
        try {
            const ticketData: CreateTicketData = {
                equipo_id: equipoId,
                ficha,
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                tipo_problema: tipoProblem,
                prioridad,
                pieza_solicitada: piezaSolicitada.trim() || undefined,
                numero_parte: numeroParte.trim() || undefined,
                cantidad_requerida: parseInt(cantidadRequerida) || 1,
            };

            const ticketId = await createTicket(ticketData);

            if (ticketId) {
                if (photos.length > 0) {
                    await uploadMultipleAttachments(
                        photos.map(p => p.file),
                        'foto_problema',
                        ticketId
                    );
                }

                onSuccess?.(ticketId);
                handleClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = !!equipoId && !!ficha && titulo.trim().length >= 5 && descripcion.trim().length >= 10;

    // Contenido del formulario (reutilizado en Dialog y Sheet)
    const formContent = (
        <div className="space-y-3">
            {/* Selector de equipo */}
            {!propEquipoId && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Equipo *</Label>
                    {selectedEquipo ? (
                        <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                                <Badge variant="outline" className="shrink-0 text-[10px]">{selectedEquipo.ficha}</Badge>
                                <span className="font-medium text-xs truncate">{selectedEquipo.nombre}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => {
                                    setSelectedEquipoId(null);
                                    setEquipoSearch('');
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar equipo..."
                                    value={equipoSearch}
                                    onChange={e => setEquipoSearch(e.target.value)}
                                    className="pl-8 text-xs h-8"
                                />
                            </div>
                            <div className="max-h-28 overflow-y-auto space-y-0.5 rounded-lg border p-1">
                                {filteredEquipos.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground text-center py-2">
                                        No se encontraron equipos
                                    </p>
                                ) : (
                                    filteredEquipos.map(eq => (
                                        <button
                                            key={eq.id}
                                            type="button"
                                            onClick={() => setSelectedEquipoId(eq.id)}
                                            className="w-full flex items-center gap-1.5 p-1.5 rounded hover:bg-muted text-left text-[10px] transition-colors"
                                        >
                                            <Truck className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <Badge variant="outline" className="text-[9px] px-1 shrink-0">{eq.ficha}</Badge>
                                            <span className="flex-1 truncate">{eq.nombre}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info del equipo pre-seleccionado */}
            {propEquipoId && equipoNombre && (
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    <Badge variant="outline" className="text-[10px]">{ficha}</Badge>
                    <span className="font-medium text-xs">{equipoNombre}</span>
                </div>
            )}

            {/* Tipo de problema - 2 filas de botones */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo de Problema</Label>
                <div className="grid grid-cols-3 gap-1.5">
                    {problemTypeOptions.slice(0, 3).map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTipoProblema(opt.value)}
                            className={cn(
                                'flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border-2 transition-all text-[10px]',
                                tipoProblem === opt.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-transparent bg-muted/50 hover:bg-muted'
                            )}
                        >
                            {opt.icon}
                            <span className="font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    {problemTypeOptions.slice(3).map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTipoProblema(opt.value)}
                            className={cn(
                                'flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border-2 transition-all text-[10px]',
                                tipoProblem === opt.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-transparent bg-muted/50 hover:bg-muted'
                            )}
                        >
                            {opt.icon}
                            <span className="font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Prioridad */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Prioridad</Label>
                <div className="grid grid-cols-4 gap-1">
                    {priorityOptions.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPrioridad(opt.value)}
                            className={cn(
                                'flex items-center justify-center gap-1 py-1.5 rounded-lg border-2 transition-all text-[10px]',
                                prioridad === opt.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-transparent bg-muted/50 hover:bg-muted'
                            )}
                        >
                            <span className={cn('w-2 h-2 rounded-full shrink-0', opt.color)} />
                            <span className="font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Título */}
            <div className="space-y-1">
                <Label htmlFor="titulo" className="text-xs font-medium">Título *</Label>
                <Input
                    id="titulo"
                    placeholder="Ej: Fuga de aceite"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    maxLength={255}
                    className="text-xs h-8"
                />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
                <Label htmlFor="descripcion" className="text-xs font-medium">Descripción *</Label>
                <Textarea
                    id="descripcion"
                    placeholder="Describe el problema..."
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                />
            </div>

            {/* Pieza (opcional) */}
            {(tipoProblem === 'falta_pieza' || tipoProblem === 'averia') && (
                <div className="space-y-1.5 p-2 rounded-lg bg-muted/30 border">
                    <Label className="text-[10px] font-medium">Pieza (opcional)</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                        <Input
                            placeholder="Nombre"
                            value={piezaSolicitada}
                            onChange={e => setPiezaSolicitada(e.target.value)}
                            className="text-xs h-7"
                        />
                        <Input
                            placeholder="N° parte"
                            value={numeroParte}
                            onChange={e => setNumeroParte(e.target.value)}
                            className="text-xs h-7"
                        />
                    </div>
                </div>
            )}

            {/* Fotos */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fotos</Label>
                <div className="flex flex-wrap gap-1.5">
                    {photos.map((photo, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border">
                            <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </div>
                    ))}
                    {photos.length < 5 && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                            <Camera className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                />
            </div>
        </div>
    );

    // Footer con botones
    const formFooter = (
        <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting} className="flex-1 text-xs">
                Cancelar
            </Button>
            <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting || uploading}
                className="flex-1 text-xs"
            >
                {(isSubmitting || uploading) && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                Crear Ticket
            </Button>
        </div>
    );

    // Renderizar Sheet en móvil, Dialog en desktop
    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleClose}>
                <SheetContent side="bottom" className="h-auto max-h-[90svh] overflow-y-auto pb-safe rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
                    <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
                    <SheetHeader className="mt-3 pb-2">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Reportar Problema
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                            Crea un ticket para reportar una avería
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-1">
                        {formContent}
                        {formFooter}
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Reportar Problema
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Crea un ticket para reportar una avería o solicitar una pieza
                    </DialogDescription>
                </DialogHeader>
                {formContent}
                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting || uploading}
                    >
                        {(isSubmitting || uploading) && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                        Crear Ticket
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
