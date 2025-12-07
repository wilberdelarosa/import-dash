/**
 * ReadOnlyBanner - Banner informativo para modo solo lectura (Supervisor)
 */
import { Eye, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';

interface ReadOnlyBannerProps {
  /** Mostrar aunque no sea supervisor (forzar) */
  forceShow?: boolean;
  /** Clase adicional */
  className?: string;
  /** Mensaje personalizado */
  message?: string;
  /** Variante compacta para móvil */
  compact?: boolean;
}

/**
 * Banner que se muestra cuando el usuario es Supervisor (modo solo lectura)
 * Se puede usar en cualquier vista para indicar que no puede editar
 */
export function ReadOnlyBanner({
  forceShow = false,
  className,
  message = 'Modo Supervisor - Vista de solo lectura',
  compact = false,
}: ReadOnlyBannerProps) {
  const { isSupervisor } = useUserRoles();

  if (!forceShow && !isSupervisor) return null;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs',
          className
        )}
      >
        <Eye className="h-3 w-3" />
        <span>Solo lectura</span>
      </div>
    );
  }

  return (
    <Alert
      className={cn(
        'border-blue-200 bg-blue-50 dark:bg-blue-950/30',
        className
      )}
    >
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <Eye className="h-4 w-4" />
        {message}
      </AlertDescription>
    </Alert>
  );
}

export default ReadOnlyBanner;
