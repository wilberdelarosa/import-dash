/**
 * Formulario de Reporte de Trabajo - Desktop
 * Diseño optimizado para pantallas grandes
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useMechanicSubmissions, PartUsada } from '@/hooks/useMechanicSubmissions';
import { useSubmissionAttachments } from '@/hooks/useSubmissionAttachments';
import { useToast } from '@/hooks/use-toast';
import { isEquipoDisponible } from '@/types/equipment';
import {
  Truck,
  Calendar,
  Gauge,
  FileText,
  Wrench,
  Plus,
  X,
  Send,
  Camera,
  Image,
  Loader2,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PhotoPreview {
  file: File;
  preview: string;
}

export function MechanicSubmissionFormDesktop() {
  const navigate = useNavigate();
  const { ficha } = useParams<{ ficha?: string }>();
  const { toast } = useToast();
  const { data } = useSupabaseDataContext();
  const equipos = data.equipos;
  const mantenimientos = data.mantenimientosProgramados;
  const inventarios = data.inventarios;
  const { createSubmission } = useMechanicSubmissions();
  const { uploadAttachments, uploading: uploadingPhotos } = useSubmissionAttachments();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Estado del formulario
  const [selectedEquipoId, setSelectedEquipoId] = useState<number | null>(null);
  const [fechaMantenimiento, setFechaMantenimiento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horasKmActuales, setHorasKmActuales] = useState<string>('');
  const [tipoMantenimiento, setTipoMantenimiento] = useState('');
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [partesUsadas, setPartesUsadas] = useState<PartUsada[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPartsDialog, setShowPartsDialog] = useState(false);
  
  // Estado de fotos
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const MAX_PHOTOS = 5;

  // Parte temporal para agregar
  const [tempPartNombre, setTempPartNombre] = useState('');
  const [tempPartCantidad, setTempPartCantidad] = useState('1');
  const [tempPartReferencia, setTempPartReferencia] = useState('');

  // Preseleccionar equipo si viene de la URL
  useEffect(() => {
    if (ficha && equipos.length > 0) {
      const equipo = equipos.find(e => e.ficha === ficha);
      if (equipo) {
        setSelectedEquipoId(equipo.id);
        const mant = mantenimientos.find(m => m.ficha === ficha);
        if (mant) {
          setHorasKmActuales(mant.horasKmActuales.toString());
          setTipoMantenimiento(mant.tipoMantenimiento);
        }
      }
    }
  }, [ficha, equipos, mantenimientos]);

  const selectedEquipo = useMemo(() => {
    return equipos.find(e => e.id === selectedEquipoId);
  }, [equipos, selectedEquipoId]);

  const mantEquipo = useMemo(() => {
    if (!selectedEquipo) return null;
    return mantenimientos.find(m => m.ficha === selectedEquipo.ficha);
  }, [selectedEquipo, mantenimientos]);

  const handleEquipoChange = (value: string) => {
    const id = parseInt(value);
    setSelectedEquipoId(id);
    const equipo = equipos.find(e => e.id === id);
    if (equipo) {
      const mant = mantenimientos.find(m => m.ficha === equipo.ficha);
      if (mant) {
        setHorasKmActuales(mant.horasKmActuales.toString());
        setTipoMantenimiento(mant.tipoMantenimiento);
      }
    }
  };

  const handleAddPart = () => {
    if (!tempPartNombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la parte es requerido',
        variant: 'destructive',
      });
      return;
    }

    const newPart: PartUsada = {
      nombre: tempPartNombre.trim(),
      cantidad: parseInt(tempPartCantidad) || 1,
      referencia: tempPartReferencia.trim() || undefined,
      del_inventario: false,
    };

    setPartesUsadas([...partesUsadas, newPart]);
    setTempPartNombre('');
    setTempPartCantidad('1');
    setTempPartReferencia('');
    setShowPartsDialog(false);
  };

  const handleRemovePart = (index: number) => {
    setPartesUsadas(partesUsadas.filter((_, i) => i !== index));
  };

  const handleSelectFromInventory = (inv: typeof inventarios[0]) => {
    const newPart: PartUsada = {
      nombre: inv.nombre,
      cantidad: 1,
      referencia: inv.numeroParte,
      del_inventario: true,
      inventario_id: inv.id.toString(),
    };
    setPartesUsadas([...partesUsadas, newPart]);
    setShowPartsDialog(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    const newPhotos: PhotoPreview[] = [];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: `${file.name} excede 10MB`, variant: 'destructive' });
        continue;
      }
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos]);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!selectedEquipoId) {
      toast({ title: 'Error', description: 'Selecciona un equipo', variant: 'destructive' });
      return;
    }
    if (!horasKmActuales || parseInt(horasKmActuales) <= 0) {
      toast({ title: 'Error', description: 'Ingresa las horas/km actuales', variant: 'destructive' });
      return;
    }
    if (!descripcionTrabajo || descripcionTrabajo.length < 20) {
      toast({ title: 'Error', description: 'La descripción debe tener al menos 20 caracteres', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionId = await createSubmission({
        equipo_id: selectedEquipoId,
        fecha_mantenimiento: fechaMantenimiento,
        horas_km_actuales: parseInt(horasKmActuales),
        tipo_mantenimiento: tipoMantenimiento,
        descripcion_trabajo: descripcionTrabajo,
        observaciones: observaciones || undefined,
        partes_usadas: partesUsadas,
      });

      if (submissionId) {
        if (photos.length > 0) {
          const filesToUpload = photos.map(p => p.file);
          await uploadAttachments(filesToUpload, submissionId);
        }
        photos.forEach(p => URL.revokeObjectURL(p.preview));
        navigate('/mechanic/historial');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Reportar Trabajo">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mechanic')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">Nuevo Reporte de Trabajo</h2>
            <p className="text-sm text-muted-foreground">
              Documenta el mantenimiento realizado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Equipo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEquipo ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
                    <div>
                      <h3 className="font-semibold">{selectedEquipo.nombre}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ficha: {selectedEquipo.ficha} • {selectedEquipo.marca} {selectedEquipo.modelo}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEquipoId(null)}>
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Seleccionar Equipo *</Label>
                    <Select onValueChange={handleEquipoChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un equipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipos.filter(e => isEquipoDisponible(e) && e.activo).map((equipo) => (
                          <SelectItem key={equipo.id} value={equipo.id.toString()}>
                            {equipo.ficha} - {equipo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datos del trabajo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Datos del Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Fecha del trabajo *
                    </Label>
                    <Input
                      type="date"
                      value={fechaMantenimiento}
                      onChange={(e) => setFechaMantenimiento(e.target.value)}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5" />
                      Horas/Km actuales *
                    </Label>
                    <Input
                      type="number"
                      value={horasKmActuales}
                      onChange={(e) => setHorasKmActuales(e.target.value)}
                      placeholder="Ej: 1250"
                    />
                    {mantEquipo && (
                      <p className="text-xs text-muted-foreground">
                        Último registro: {mantEquipo.horasKmActuales.toLocaleString()} hrs
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de mantenimiento</Label>
                  <Input
                    value={tipoMantenimiento}
                    onChange={(e) => setTipoMantenimiento(e.target.value)}
                    placeholder="Ej: Cambio de aceite, PM1, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Descripción del trabajo * (mín. 20 caracteres)
                  </Label>
                  <Textarea
                    value={descripcionTrabajo}
                    onChange={(e) => setDescripcionTrabajo(e.target.value)}
                    placeholder="Describa detalladamente el trabajo realizado..."
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {descripcionTrabajo.length}/20 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Observaciones adicionales</Label>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales, alertas, sugerencias..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar derecho */}
          <div className="space-y-6">
            {/* Partes usadas */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Partes Usadas
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPartsDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {partesUsadas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se han agregado partes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {partesUsadas.map((parte, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{parte.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            x{parte.cantidad} {parte.referencia && `• ${parte.referencia}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemovePart(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fotos */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Fotos
                  </CardTitle>
                  <Badge variant="secondary">{photos.length}/{MAX_PHOTOS}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {photos.length < MAX_PHOTOS && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mb-3"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Seleccionar Fotos
                  </Button>
                )}

                {photos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Añade fotos del trabajo realizado
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={photo.preview}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botón de enviar */}
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingPhotos}
            >
              {(isSubmitting || uploadingPhotos) ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {uploadingPhotos ? 'Subiendo fotos...' : 'Enviando...'}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Enviar Reporte
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dialog para agregar partes */}
        <Dialog open={showPartsDialog} onOpenChange={setShowPartsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Parte/Repuesto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de la parte *</Label>
                <Input
                  value={tempPartNombre}
                  onChange={(e) => setTempPartNombre(e.target.value)}
                  placeholder="Ej: Filtro de aceite"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={tempPartCantidad}
                    onChange={(e) => setTempPartCantidad(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de parte</Label>
                  <Input
                    value={tempPartReferencia}
                    onChange={(e) => setTempPartReferencia(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {inventarios.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">O seleccionar del inventario:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {inventarios.slice(0, 10).map((inv) => (
                      <Button
                        key={inv.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => handleSelectFromInventory(inv)}
                      >
                        {inv.nombre} ({inv.numeroParte})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPartsDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPart}>
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default MechanicSubmissionFormDesktop;
