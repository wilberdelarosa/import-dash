/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { PlanConIntervalos } from '@/types/maintenance-plans';

interface Props {
  plan: PlanConIntervalos;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GestionEquiposPlan({ plan, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Gestión de Equipos del Plan: {plan.nombre}</DialogTitle>
          <DialogDescription>
            Gestionar equipos asociados a este plan
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta funcionalidad requiere una actualización de la base de datos. 
            Por favor, ejecuta la migración pendiente para habilitar la gestión de equipos por plan.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}

