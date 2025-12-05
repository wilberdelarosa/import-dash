/**
 * Formulario de Reporte de Trabajo - Mecánico
 * Mobile-first design para pantallas pequeñas
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
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
import { useToast } from '@/hooks/use-toast';
import {
  Truck,
  Calendar,
  Gauge,
  FileText,
  Wrench,
  Plus,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function MechanicSubmissionForm() {
  const navigate = useNavigate();
  const { ficha } = useParams<{ ficha?: string }>();
  const { toast } = useToast();
  const { data } = useSupabaseDataContext();
  const equipos = data.equipos;
  const mantenimientos = data.mantenimientosProgramados;
  const inventarios = data.inventarios;
  const { createSubmission } = useMechanicSubmissions();

  // Estado del formulario
  const [selectedEquipoId, setSelectedEquipoId] = useState<number | null>(null);
  const [fechaMantenimiento, setFechaMantenimiento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horasKmActuales, setHorasKmActuales] = useState<string>('');
  const [tipoMantenimiento, setTipoMantenimiento] = useState('');
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [partesUsadas, setPartesUsadas] = useState<PartUsada[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPartsSheet, setShowPartsSheet] = useState(false);

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
        // Obtener horas actuales del mantenimiento
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
    setShowPartsSheet(false);
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
    setShowPartsSheet(false);
  };

  const handleSubmit = async () => {
    // Validaciones
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
        navigate('/mechanic/historial');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Reportar Trabajo" showBottomNav={false}>
      <div className="space-y-3 pb-24">
        {/* Equipo seleccionado */}
        {selectedEquipo ? (
          <MobileCard className="p-3 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{selectedEquipo.nombre}</h3>
                <p className="text-xs text-muted-foreground">
                  Ficha: {selectedEquipo.ficha} • {selectedEquipo.marca} {selectedEquipo.modelo}
                </p>
              </div>
            </div>
          </MobileCard>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs">Seleccionar Equipo *</Label>
            <Select onValueChange={handleEquipoChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecciona un equipo" />
              </SelectTrigger>
              <SelectContent>
                {equipos.filter(e => e.activo).map((equipo) => (
                  <SelectItem key={equipo.id} value={equipo.id.toString()}>
                    {equipo.ficha} - {equipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Fecha */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Fecha del trabajo *
          </Label>
          <Input
            type="date"
            value={fechaMantenimiento}
            onChange={(e) => setFechaMantenimiento(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="h-9 text-sm"
          />
        </div>

        {/* Horas/Km */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            Horas/Km actuales del equipo *
          </Label>
          <Input
            type="number"
            value={horasKmActuales}
            onChange={(e) => setHorasKmActuales(e.target.value)}
            placeholder="Ej: 1250"
            className="h-9 text-sm"
          />
          {mantEquipo && (
            <p className="text-[10px] text-muted-foreground">
              Último registro: {mantEquipo.horasKmActuales.toLocaleString()} hrs
            </p>
          )}
        </div>

        {/* Tipo de mantenimiento */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Tipo de mantenimiento
          </Label>
          <Input
            value={tipoMantenimiento}
            onChange={(e) => setTipoMantenimiento(e.target.value)}
            placeholder="Ej: Cambio de aceite"
            className="h-9 text-sm"
          />
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Descripción del trabajo * (mín. 20 caracteres)
          </Label>
          <Textarea
            value={descripcionTrabajo}
            onChange={(e) => setDescripcionTrabajo(e.target.value)}
            placeholder="Describa el trabajo realizado..."
            className="min-h-[80px] text-sm resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {descripcionTrabajo.length}/20 caracteres
          </p>
        </div>

        {/* Partes utilizadas */}
        <MobileCard className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              Partes/Repuestos utilizados
            </Label>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowPartsSheet(true)}
            >
              <Plus className="h-3 w-3" />
              Agregar
            </Button>
          </div>

          {partesUsadas.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No se han agregado partes
            </p>
          ) : (
            <div className="space-y-1.5">
              {partesUsadas.map((parte, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{parte.nombre}</p>
                    <p className="text-[10px] text-muted-foreground">
                      x{parte.cantidad} {parte.referencia && `• ${parte.referencia}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemovePart(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </MobileCard>

        {/* Observaciones */}
        <div className="space-y-1.5">
          <Label className="text-xs">Observaciones adicionales</Label>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales, alertas, sugerencias..."
            className="min-h-[60px] text-sm resize-none"
          />
        </div>
      </div>

      {/* Botón de enviar (sticky) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t safe-area-pb">
        <Button
          className="w-full h-11 text-sm gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Enviando...' : 'Enviar para Aprobación'}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Una vez enviado, el admin revisará y aprobará tu reporte
        </p>
      </div>

      {/* Sheet para agregar partes */}
      <Sheet open={showPartsSheet} onOpenChange={setShowPartsSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-muted" />
          <SheetHeader className="mt-3">
            <SheetTitle className="text-base">Agregar Parte</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-4 pb-4">
            {/* Buscar en inventario */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Seleccionar del inventario:
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {inventarios.slice(0, 10).map((inv) => (
                  <Button
                    key={inv.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => handleSelectFromInventory(inv)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{inv.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">
                        P/N: {inv.numeroParte} • Stock: {inv.cantidad}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">o escribir manualmente</span>
              </div>
            </div>

            {/* Escribir manualmente */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nombre de la parte *</Label>
                <Input
                  value={tempPartNombre}
                  onChange={(e) => setTempPartNombre(e.target.value)}
                  placeholder="Ej: Filtro de aceite"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    value={tempPartCantidad}
                    onChange={(e) => setTempPartCantidad(e.target.value)}
                    min="1"
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Referencia/P.N.</Label>
                  <Input
                    value={tempPartReferencia}
                    onChange={(e) => setTempPartReferencia(e.target.value)}
                    placeholder="Opcional"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
              <Button className="w-full h-10" onClick={handleAddPart}>
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar Parte
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </MobileLayout>
  );
}

export default MechanicSubmissionForm;
