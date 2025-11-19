import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Wrench, History, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { MantenimientoProgramado } from '@/types/equipment';

interface MantenimientoCardProps {
  mantenimiento: MantenimientoProgramado;
  onUpdate: () => void;
  onRealize: () => void;
  onHistory: () => void;
}

export function MantenimientoCard({ mantenimiento, onUpdate, onRealize, onHistory }: MantenimientoCardProps) {
  const proximoCalculado = mantenimiento.horasKmUltimoMantenimiento + mantenimiento.frecuencia;
  const restanteCalculado = proximoCalculado - mantenimiento.horasKmActuales;
  
  const getEstado = () => {
    if (restanteCalculado <= 0) return { 
      label: 'Vencido', 
      variant: 'destructive' as const, 
      icon: AlertCircle,
      color: 'text-destructive'
    };
    if (restanteCalculado <= 100) return { 
      label: 'Próximo', 
      variant: 'secondary' as const, 
      icon: AlertTriangle,
      color: 'text-warning'
    };
    return { 
      label: 'Al Día', 
      variant: 'default' as const, 
      icon: CheckCircle2,
      color: 'text-success'
    };
  };

  const estado = getEstado();
  const unidad = mantenimiento.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
  const IconoEstado = estado.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold">
              {mantenimiento.nombreEquipo}
            </CardTitle>
            <CardDescription className="text-sm">
              Ficha: {mantenimiento.ficha} • {mantenimiento.tipoMantenimiento}
            </CardDescription>
          </div>
          <Badge variant={estado.variant} className="ml-2 flex items-center gap-1">
            <IconoEstado className="w-3 h-3" />
            {estado.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Actual</p>
            <p className="font-semibold text-base">
              {mantenimiento.horasKmActuales.toLocaleString()} {unidad}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Próximo</p>
            <p className="font-semibold text-base">
              {proximoCalculado.toLocaleString()} {unidad}
            </p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-muted-foreground">Restante</p>
            <p className={`font-bold text-lg ${estado.color}`}>
              {restanteCalculado.toFixed(1)} {unidad}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onUpdate}
            className="flex-1"
          >
            <Clock className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
          <Button
            size="sm"
            variant={restanteCalculado <= 0 ? "default" : "outline"}
            onClick={onRealize}
            className="flex-1"
          >
            <Wrench className="w-4 h-4 mr-1" />
            Realizar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onHistory}
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
