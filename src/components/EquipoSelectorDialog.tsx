import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Truck, HardHat, Check } from 'lucide-react';
import { Equipo } from '@/types/equipment';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EquipoSelectorDialogProps {
  equipos: Equipo[];
  equipoSeleccionado?: string;
  onSelect: (ficha: string) => void;
  titulo?: string;
  descripcion?: string;
}

export function EquipoSelectorDialog({
  equipos,
  equipoSeleccionado,
  onSelect,
  titulo = "Seleccionar Equipo",
  descripcion = "Selecciona un equipo de la lista"
}: EquipoSelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Mostrar únicamente equipos activos en el selector
  const equiposActivos = equipos.filter(equipo => equipo.activo);

  const equiposFiltrados = equiposActivos.filter(equipo =>
    equipo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    equipo.ficha.toLowerCase().includes(busqueda.toLowerCase()) ||
    equipo.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    equipo.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const equipoActual = equiposActivos.find(e => e.ficha === equipoSeleccionado);

  const handleSeleccionar = (ficha: string) => {
    onSelect(ficha);
    setOpen(false);
    setBusqueda('');
  };

  const getCategoriaIcon = (categoria?: string) => {
    if (!categoria) return <HardHat className="w-5 h-5" />;
    const cat = categoria.toLowerCase();
    // VP-XXX: Vehículos Personales - icono especial
    if (cat.includes('vp') || cat.includes('personal')) {
      return <Truck className="w-5 h-5" />;
    }
    if (cat.includes('vehículo') || cat.includes('camion') || cat.includes('transporte')) {
      return <Truck className="w-5 h-5" />;
    }
    return <HardHat className="w-5 h-5" />;
  };

  const getCategoriaColor = (categoria?: string) => {
    if (!categoria) return 'bg-gray-100 text-gray-800';
    const cat = categoria.toLowerCase();
    // VP-XXX: Vehículos Personales - color distintivo (rosa/fucsia)
    if (cat.includes('vp') || cat.includes('personal')) return 'bg-pink-100 text-pink-800';
    if (cat.includes('excavadora')) return 'bg-amber-100 text-amber-800';
    if (cat.includes('vehículo') || cat.includes('transporte')) return 'bg-blue-100 text-blue-800';
    if (cat.includes('camion')) return 'bg-green-100 text-green-800';
    if (cat.includes('rodillo') || cat.includes('compactador')) return 'bg-purple-100 text-purple-800';
    if (cat.includes('retro')) return 'bg-orange-100 text-orange-800';
    if (cat.includes('cargador') || cat.includes('minicargador')) return 'bg-cyan-100 text-cyan-800';
    if (cat.includes('telehandler')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start text-left font-normal h-auto py-3"
        >
          {equipoActual ? (
            <div className="flex items-center gap-3 w-full">
              <div className={`p-2 rounded-lg ${getCategoriaColor(equipoActual.categoria)}`}>
                {getCategoriaIcon(equipoActual.categoria)}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{equipoActual.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {equipoActual.ficha} · {equipoActual.marca} {equipoActual.modelo}
                </div>
              </div>
              <Badge variant="outline">{equipoActual.categoria}</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="w-4 h-4" />
              <span>{descripcion}</span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{titulo}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ficha, marca o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {equiposFiltrados.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No se encontraron equipos
                </div>
              ) : (
                equiposFiltrados.map((equipo) => (
                  <Card
                    key={equipo.ficha}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                      equipoSeleccionado === equipo.ficha
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSeleccionar(equipo.ficha)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${getCategoriaColor(equipo.categoria)}`}>
                        {getCategoriaIcon(equipo.categoria)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-base leading-tight mb-1">
                              {equipo.nombre}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {equipo.marca} {equipo.modelo}
                            </p>
                          </div>
                          {equipoSeleccionado === equipo.ficha && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {equipo.ficha}
                          </Badge>
                          {equipo.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {equipo.categoria}
                            </Badge>
                          )}
                          {equipo.numeroSerie && (
                            <Badge variant="outline" className="text-xs">
                              S/N: {equipo.numeroSerie}
                            </Badge>
                          )}
                        </div>
                        
                        {equipo.placa && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Placa: {equipo.placa}
                          </div>
                        )}
                        {/* Inactivos no se muestran en este selector */}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
          
          {equiposFiltrados.length > 0 && (
            <div className="text-sm text-muted-foreground pt-2 border-t">
              Mostrando {equiposFiltrados.length} de {equiposActivos.length} equipos
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
