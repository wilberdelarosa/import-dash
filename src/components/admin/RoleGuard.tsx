/**
 * RoleGuard - Componente para proteger rutas/secciones según rol
 */
import { ReactNode } from 'react';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole: AppRole;
  fallback?: ReactNode;
  showError?: boolean;
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  fallback,
  showError = true 
}: RoleGuardProps) {
  const { currentUserRole, loading, isAdmin } = useUserRoles();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Admin tiene acceso a todo
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar si tiene el rol requerido
  if (currentUserRole === requiredRole) {
    return <>{children}</>;
  }

  // Si hay fallback, mostrarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Mostrar error si está habilitado
  if (showError) {
    return (
      <Alert variant="destructive" className="my-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder a esta sección. 
          Se requiere rol de {requiredRole === 'admin' ? 'administrador' : 'usuario'}.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

/**
 * Hook wrapper para verificar rol fácilmente
 */
export function useRequireRole(requiredRole: AppRole): {
  hasAccess: boolean;
  loading: boolean;
} {
  const { currentUserRole, loading, isAdmin } = useUserRoles();

  return {
    hasAccess: loading ? false : (isAdmin || currentUserRole === requiredRole),
    loading
  };
}
