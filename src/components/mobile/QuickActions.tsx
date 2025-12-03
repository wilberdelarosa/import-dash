/**
 * Quick Actions - Acciones rápidas para móvil
 * 
 * Componente flotante con acciones frecuentes
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Zap,
  Plus,
  Wrench,
  Package,
  Truck,
  ClipboardList,
  QrCode,
  Camera,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  route?: string;
  action?: () => void;
}

const defaultActions: QuickAction[] = [
  { id: 'equipo', label: 'Nuevo Equipo', icon: Truck, color: 'bg-blue-500', route: '/equipos' },
  { id: 'mantenimiento', label: 'Registrar Servicio', icon: Wrench, color: 'bg-emerald-500', route: '/control-mantenimiento' },
  { id: 'inventario', label: 'Añadir Item', icon: Package, color: 'bg-amber-500', route: '/inventario' },
  { id: 'lista', label: 'Nueva Lista', icon: ClipboardList, color: 'bg-purple-500', route: '/listas-personalizadas' },
];

interface QuickActionsProps {
  actions?: QuickAction[];
  onAction?: (actionId: string) => void;
}

export function QuickActions({ actions = defaultActions, onAction }: QuickActionsProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    if (action.action) {
      action.action();
    } else if (action.route) {
      navigate(action.route);
    }
    
    if (onAction) {
      onAction(action.id);
    }
    
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg",
            "bg-gradient-to-br from-primary to-primary/80",
            "hover:scale-105 active:scale-95 transition-all duration-300",
            open && "rotate-45"
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto rounded-t-[2rem] pb-safe">
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
        <SheetHeader className="mt-4 mb-6">
          <SheetTitle className="text-center text-lg">Acciones Rápidas</SheetTitle>
        </SheetHeader>
        
        <div className="grid grid-cols-2 gap-3 px-2 pb-6">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto flex-col gap-2 py-4 rounded-xl border-2 hover:border-primary/50 transition-all"
                onClick={() => handleAction(action)}
              >
                <div className={cn("p-2 rounded-lg", action.color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
