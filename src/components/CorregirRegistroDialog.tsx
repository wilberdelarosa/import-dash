/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Trash2, Save, Loader2 } from 'lucide-react';

export interface RegistroCorregible {
  eventoId: number;
  tipo: 'mantenimiento' | 'lectura';
  fecha: string;
  horasKm: number;
  observaciones?: string | null;
}

interface Props {
  registro: RegistroCorregible | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toDateInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function CorregirRegistroDialog({ registro, open, onOpenChange }: Props) {
  const { corregirRegistroHistorial, eliminarRegistroHistorial } = useSupabaseDataContext();
  const [fecha, setFecha] = useState('');
  const [horasKm, setHorasKm] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (registro && open) {
      setFecha(toDateInput(registro.fecha));
      setHorasKm(String(registro.horasKm ?? ''));
      setObservaciones(registro.observaciones ?? '');
    }
  }, [registro, open]);

  if (!registro) return null;

  const esMantenimiento = registro.tipo === 'mantenimiento';

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await corregirRegistroHistorial({
        eventoId: registro.eventoId,
        horasKm: horasKm === '' ? undefined : Number(horasKm),
        fecha,
        observaciones,
      });
      onOpenChange(false);
    } catch {
      /* el hook ya notifica el error */
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    setSaving(true);
    try {
      await eliminarRegistroHistorial(registro.eventoId);
      setConfirmDelete(false);
      onOpenChange(false);
    } catch {
      /* el hook ya notifica el error */
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {esMantenimiento ? 'Corregir mantenimiento' : 'Corregir lectura'}
            </DialogTitle>
            <DialogDescription>
              Ajusta los datos si se registraron mal. La secuencia de mantenimiento se
              recalcula automáticamente con todo el historial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="corregir-fecha">Fecha</Label>
              <Input
                id="corregir-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corregir-lectura">Lectura (horas / km)</Label>
              <Input
                id="corregir-lectura"
                type="number"
                inputMode="decimal"
                value={horasKm}
                onChange={(e) => setHorasKm(e.target.value)}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corregir-obs">Observaciones</Label>
              <Textarea
                id="corregir-obs"
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalle del trabajo o motivo de la corrección"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="min-h-11 w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar registro
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="min-h-11 flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGuardar}
                disabled={saving}
                className="min-h-11 flex-1 sm:flex-none"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará del historial y la secuencia de mantenimiento del equipo se
              recalculará con los registros restantes. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar} disabled={saving}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
