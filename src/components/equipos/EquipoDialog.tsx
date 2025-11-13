import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit } from 'lucide-react';
import { Equipo } from '@/types/equipment';

interface EquipoDialogProps {
  equipo?: Equipo;
  onSave: (equipo: Omit<Equipo, 'id'> | Equipo) => void;
  trigger?: React.ReactNode;
}

const categorias = [
  'Vehículo transporte',
  'Excavadora',
  'Minicargadores',
  'Retropalas', 
  'Camiones',
  'Rodillos',
  'Telehandler',
  'Miniretro',
  'Vehículo personal'
];

export function EquipoDialog({ equipo, onSave, trigger }: EquipoDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    ficha: equipo?.ficha || '',
    nombre: equipo?.nombre || '',
    marca: equipo?.marca || '',
    modelo: equipo?.modelo || '',
    numeroSerie: equipo?.numeroSerie || '',
    placa: equipo?.placa || '',
    categoria: equipo?.categoria || '',
    activo: equipo?.activo ?? true,
    motivoInactividad: equipo?.motivoInactividad || '',
  });

  const handleSave = () => {
    const payload = {
      ...formData,
      motivoInactividad: formData.activo
        ? null
        : formData.motivoInactividad.trim() || null,
    };

    if (formData.activo) {
      payload.motivoInactividad = null;
    }

    const equipoData = equipo
      ? { ...payload, id: equipo.id }
      : payload;
    onSave(equipoData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {equipo ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {equipo ? 'Editar' : 'Agregar Equipo'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>{equipo ? 'Editar Equipo' : 'Agregar Nuevo Equipo'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
          <div>
            <Label htmlFor="ficha">Ficha</Label>
            <Input
              id="ficha"
              value={formData.ficha}
              onChange={(e) => setFormData({ ...formData, ficha: e.target.value })}
              placeholder="AC-001"
            />
          </div>
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="HILUX 2021"
            />
          </div>
          <div>
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              placeholder="TOYOTA"
            />
          </div>
          <div>
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="2021"
            />
          </div>
          <div>
            <Label htmlFor="numeroSerie">Número de Serie</Label>
            <Input
              id="numeroSerie"
              value={formData.numeroSerie}
              onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
              placeholder="123456789"
            />
          </div>
          <div>
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
              placeholder="ABC-123"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 md:col-span-2">
            <Switch
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
            />
            <Label htmlFor="activo">Equipo activo</Label>
          </div>
          {!formData.activo && (
            <div className="md:col-span-2">
              <Label htmlFor="motivoInactividad">Motivo de Inactividad</Label>
              <Textarea
                id="motivoInactividad"
                value={formData.motivoInactividad}
                onChange={(e) => setFormData({ ...formData, motivoInactividad: e.target.value })}
                placeholder="Motivo por el cual está inactivo..."
              />
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}