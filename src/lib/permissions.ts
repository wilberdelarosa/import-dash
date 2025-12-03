/**
 * Sistema de permisos por módulo y rol
 */

export type ModulePermission = 'read' | 'write' | 'delete' | 'admin';

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const MODULES: ModuleConfig[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Panel principal con estadísticas', icon: 'LayoutDashboard' },
  { id: 'equipos', name: 'Equipos', description: 'Gestión de equipos y maquinaria', icon: 'Truck' },
  { id: 'inventario', name: 'Inventario', description: 'Control de inventario y stock', icon: 'Package' },
  { id: 'mantenimiento', name: 'Mantenimiento', description: 'Registro de mantenimientos', icon: 'Wrench' },
  { id: 'planificador', name: 'Planificador', description: 'Planificación inteligente de MP', icon: 'Calendar' },
  { id: 'planes', name: 'Planes', description: 'Gestión de planes de mantenimiento', icon: 'FileText' },
  { id: 'kits', name: 'Kits', description: 'Kits de mantenimiento', icon: 'Box' },
  { id: 'historial', name: 'Historial', description: 'Historial de eventos', icon: 'History' },
  { id: 'reportes', name: 'Reportes', description: 'Generación de reportes', icon: 'BarChart3' },
  { id: 'asistente', name: 'Asistente IA', description: 'Asistente inteligente', icon: 'Bot' },
  { id: 'configuraciones', name: 'Configuraciones', description: 'Ajustes del sistema', icon: 'Settings' },
  { id: 'admin', name: 'Administración', description: 'Panel de administración', icon: 'Shield' },
  { id: 'importar', name: 'Importar Datos', description: 'Importación de datos externos', icon: 'Upload' },
];

export type AppRole = 'admin' | 'user';

// Permisos por defecto para cada rol
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, Record<string, ModulePermission[]>> = {
  admin: {
    dashboard: ['read', 'write', 'delete', 'admin'],
    equipos: ['read', 'write', 'delete', 'admin'],
    inventario: ['read', 'write', 'delete', 'admin'],
    mantenimiento: ['read', 'write', 'delete', 'admin'],
    planificador: ['read', 'write', 'delete', 'admin'],
    planes: ['read', 'write', 'delete', 'admin'],
    kits: ['read', 'write', 'delete', 'admin'],
    historial: ['read', 'write', 'delete', 'admin'],
    reportes: ['read', 'write', 'delete', 'admin'],
    asistente: ['read', 'write', 'delete', 'admin'],
    configuraciones: ['read', 'write', 'delete', 'admin'],
    admin: ['read', 'write', 'delete', 'admin'],
    importar: ['read', 'write', 'delete', 'admin'],
  },
  user: {
    dashboard: ['read'],
    equipos: ['read'],
    inventario: ['read'],
    mantenimiento: ['read'],
    planificador: ['read'],
    planes: ['read'],
    kits: ['read'],
    historial: ['read'],
    reportes: ['read'],
    asistente: ['read'],
    configuraciones: ['read'],
    admin: [],
    importar: [],
  },
};

// Verificar si un rol tiene un permiso específico en un módulo
export function hasPermission(
  role: AppRole | null,
  moduleId: string,
  permission: ModulePermission
): boolean {
  if (!role) return false;
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
  if (!rolePermissions) return false;
  const modulePermissions = rolePermissions[moduleId];
  if (!modulePermissions) return false;
  return modulePermissions.includes(permission);
}

// Obtener todos los permisos de un módulo para un rol
export function getModulePermissions(role: AppRole | null, moduleId: string): ModulePermission[] {
  if (!role) return [];
  return DEFAULT_ROLE_PERMISSIONS[role]?.[moduleId] || [];
}

// Verificar si tiene acceso al módulo (al menos lectura)
export function canAccessModule(role: AppRole | null, moduleId: string): boolean {
  return hasPermission(role, moduleId, 'read');
}

// Verificar si puede editar en el módulo
export function canEditModule(role: AppRole | null, moduleId: string): boolean {
  return hasPermission(role, moduleId, 'write');
}

// Verificar si puede eliminar en el módulo
export function canDeleteModule(role: AppRole | null, moduleId: string): boolean {
  return hasPermission(role, moduleId, 'delete');
}

// Verificar si es admin del módulo
export function isModuleAdmin(role: AppRole | null, moduleId: string): boolean {
  return hasPermission(role, moduleId, 'admin');
}
