/**
 * PermissionGuard - Componente para proteger acciones según permisos del módulo
 */
import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ModulePermission } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  moduleId: string;
  permission: ModulePermission;
  fallback?: ReactNode;
  showLockIcon?: boolean;
  tooltipMessage?: string;
}

/**
 * Protege elementos UI según permisos
 * Si el usuario no tiene el permiso, muestra el fallback o nada
 */
export function PermissionGuard({ 
  children, 
  moduleId, 
  permission,
  fallback,
  showLockIcon = false,
  tooltipMessage
}: PermissionGuardProps) {
  const { has, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const hasPermission = has(moduleId, permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockIcon) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-muted-foreground cursor-not-allowed opacity-50">
              <Lock className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage || 'No tienes permisos para esta acción'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}

/**
 * Hook para verificar permisos en lógica de componentes
 */
export function useModulePermission(moduleId: string, permission: ModulePermission): boolean {
  const { has, loading } = usePermissions();
  
  if (loading) return false;
  return has(moduleId, permission);
}

/**
 * Componente para deshabilitar botones según permisos
 */
interface PermissionButtonProps {
  children: ReactNode;
  moduleId: string;
  permission: ModulePermission;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function PermissionButton({
  children,
  moduleId,
  permission,
  onClick,
  className,
  disabled
}: PermissionButtonProps) {
  const { has, loading } = usePermissions();
  const hasPermission = has(moduleId, permission);
  const isDisabled = loading || !hasPermission || disabled;

  if (!hasPermission) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={className}>
              <button 
                disabled 
                className="opacity-50 cursor-not-allowed pointer-events-none"
                style={{ pointerEvents: 'none' }}
              >
                {children}
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Solo administradores pueden realizar esta acción</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className={className} onClick={!isDisabled ? onClick : undefined}>
      {children}
    </span>
  );
}
