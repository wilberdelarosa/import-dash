/**
 * Hook para gestionar permisos de usuario
 */
import { useMemo } from 'react';
import { useUserRoles } from './useUserRoles';
import { 
  hasPermission, 
  canAccessModule, 
  canEditModule, 
  canDeleteModule, 
  isModuleAdmin,
  getModulePermissions,
  ModulePermission,
  MODULES
} from '@/lib/permissions';

export function usePermissions() {
  const { currentUserRole, isAdmin, loading } = useUserRoles();

  const permissions = useMemo(() => ({
    // Verificar permiso específico
    has: (moduleId: string, permission: ModulePermission) => 
      hasPermission(currentUserRole, moduleId, permission),
    
    // Verificar acceso al módulo
    canAccess: (moduleId: string) => 
      canAccessModule(currentUserRole, moduleId),
    
    // Verificar si puede editar
    canEdit: (moduleId: string) => 
      canEditModule(currentUserRole, moduleId),
    
    // Verificar si puede eliminar
    canDelete: (moduleId: string) => 
      canDeleteModule(currentUserRole, moduleId),
    
    // Verificar si es admin del módulo
    isModuleAdmin: (moduleId: string) => 
      isModuleAdmin(currentUserRole, moduleId),
    
    // Obtener permisos de un módulo
    getPermissions: (moduleId: string) => 
      getModulePermissions(currentUserRole, moduleId),
    
    // Módulos accesibles
    accessibleModules: MODULES.filter(m => 
      canAccessModule(currentUserRole, m.id)
    ),
    
    // Es admin global
    isGlobalAdmin: isAdmin,
    
    // Rol actual
    role: currentUserRole,
  }), [currentUserRole, isAdmin]);

  return {
    ...permissions,
    loading,
  };
}
