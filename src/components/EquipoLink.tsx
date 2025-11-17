import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { EquipoDetalleUnificado } from './EquipoDetalleUnificado';

interface Props {
  ficha: string;
  children: React.ReactNode;
  variant?: 'link' | 'default' | 'outline' | 'ghost';
  className?: string;
}

/**
 * Componente que permite abrir el diálogo de detalles del equipo
 * desde cualquier lugar de la aplicación
 */
export function EquipoLink({ ficha, children, variant = 'link', className }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
      >
        {children}
        {variant === 'link' && <ExternalLink className="ml-1 h-3 w-3" />}
      </Button>
      
      <EquipoDetalleUnificado
        ficha={ficha}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
