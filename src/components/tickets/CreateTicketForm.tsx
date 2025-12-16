import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Loader2, AlertTriangle, Package, Wrench, Calendar, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentTickets } from '@/hooks/useEquipmentTickets';
import { useTicketAttachments } from '@/hooks/useTicketAttachments';
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
    { value: 'falta_pieza', label: 'Falta de Pieza', icon: <Package className="h-4 w-4 text-amber-500" /> },
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
    equipoId,
    ficha,
    equipoNombre,
    onSuccess
}: CreateTicketFormProps) {
    const { createTicket } = useEquipmentTickets();
    const { uploadMultipleAttachments, uploading } = useTicketAttachments();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
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
            if (file.size > 10 * 1024 * 1024) continue; // Max 10MB

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
                // Subir fotos si hay
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

    const isValid = titulo.trim().length >= 5 && descripcion.trim().length >= 10;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Reportar Problema
                    </DialogTitle>
                    <DialogDescription>
                        {equipoNombre ? (
                            <span className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{ficha}</Badge>
                                <span>{equipoNombre}</span>
                            </span>
                        ) : (
                            'Crea un ticket para reportar una avería o solicitar una pieza'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Tipo de problema */}
                    <div className="space-y-2">
                        <Label>Tipo de Problema</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {problemTypeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setTipoProblema(opt.value)}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs',
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
                    <div className="space-y-2">
                        <Label>Prioridad</Label>
                        <div className="flex gap-2">
                            {priorityOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPrioridad(opt.value)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-sm flex-1',
                                        prioridad === opt.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-transparent bg-muted/50 hover:bg-muted'
                                    )}
                                >
                                    <span className={cn('w-2.5 h-2.5 rounded-full', opt.color)} />
                                    <span className="font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                        <Label htmlFor="titulo">Título *</Label>
                        <Input
                            id="titulo"
                            placeholder="Ej: Fuga de aceite en cilindro hidráulico"
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            maxLength={255}
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción *</Label>
                        <Textarea
                            id="descripcion"
                            placeholder="Describe el problema con detalle..."
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            {descripcion.length}/500 caracteres
                        </p>
                    </div>

                    {/* Pieza (opcional) */}
                    {(tipoProblem === 'falta_pieza' || tipoProblem === 'averia') && (
                        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
                            <Label className="text-sm font-medium">Pieza requerida (opcional)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Input
                                        placeholder="Nombre de la pieza"
                                        value={piezaSolicitada}
                                        onChange={e => setPiezaSolicitada(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Input
                                        placeholder="N° de parte"
                                        value={numeroParte}
                                        onChange={e => setNumeroParte(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="w-24">
                                <Label className="text-xs">Cantidad</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={cantidadRequerida}
                                    onChange={e => setCantidadRequerida(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Fotos */}
                    <div className="space-y-2">
                        <Label>Fotos del problema</Label>
                        <div className="flex flex-wrap gap-2">
                            {photos.map((photo, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                    <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(idx)}
                                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {photos.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                >
                                    <Camera className="h-5 w-5" />
                                    <span className="text-xs">Añadir</span>
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
                        <p className="text-xs text-muted-foreground">Máximo 5 fotos, 10MB cada una</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting || uploading}
                    >
                        {(isSubmitting || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Crear Ticket
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
