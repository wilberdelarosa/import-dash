/**
 * Hook para gestión de roles de usuario
 * Utiliza la tabla user_roles y función has_role de Supabase
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type AppRole = 'admin' | 'supervisor' | 'mechanic' | 'user';

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
  last_sign_in_at?: string;
}

interface UseUserRolesReturn {
  currentUserRole: AppRole | null;
  isAdmin: boolean;
  isSupervisor: boolean;
  isMechanic: boolean;
  isUser: boolean;
  canEdit: boolean;
  canViewDashboard: boolean;
  canViewMantenimiento: boolean;
  canViewHistorial: boolean;
  canViewNotificaciones: boolean;
  loading: boolean;
  users: UserWithRole[];
  loadingUsers: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: AppRole) => Promise<boolean>;
  checkRole: (role: AppRole) => Promise<boolean>;
  error: string | null;
}

// Helper to get/set cached role per user
const ROLE_CACHE_KEY = 'userRole_';

function getCachedRole(userId: string): AppRole | null {
  try {
    const cached = localStorage.getItem(ROLE_CACHE_KEY + userId);
    if (cached && ['admin', 'supervisor', 'mechanic', 'user'].includes(cached)) {
      return cached as AppRole;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function setCachedRole(userId: string, role: AppRole) {
  try {
    localStorage.setItem(ROLE_CACHE_KEY + userId, role);
  } catch {
    // Ignore localStorage errors
  }
}

export function useUserRoles(): UseUserRolesReturn {
  const { user } = useAuth();

  // Initialize with cached role if available (prevents flash)
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(() => {
    if (user?.id) {
      return getCachedRole(user.id);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Cargar rol del usuario actual
  useEffect(() => {
    async function loadCurrentUserRole() {
      if (!user) {
        setCurrentUserRole(null);
        setLoading(false);
        return;
      }

      // If we already have a cached role for this user, use it and skip DB query
      const cachedRole = getCachedRole(user.id);
      if (cachedRole) {
        setCurrentUserRole(cachedRole);
        setLoading(false);
        return; // Skip DB query - use cached value
      }

      // Emails para testing (fallback si no hay rol en BD)
      const mechanicEmail = 'wilber.alitoeirl@gmail.com';
      const supervisorEmail = 'warly.wey@gmail.com';

      try {
        // 1. PRIMERO: Intentar obtener rol de la base de datos
        const { data, error: roleError } = await supabase
          .from('user_roles')
          .select('role')

          .eq('user_id', user.id)
          .single();

        if (!roleError && data?.role) {
          // ✓ Rol encontrado en BD - usar ese
          console.log(`[useUserRoles] Rol desde BD: ${data.role}`);
          const role = data.role as AppRole;
          setCurrentUserRole(role);
          setCachedRole(user.id, role); // Cache for instant restore
          setLoading(false);
          return;
        }

        // 2. FALLBACK: Si no hay rol en BD, usar simulación para emails de prueba
        // Esto permite testing sin necesidad de asignar roles manualmente
        console.log('[useUserRoles] No hay rol en BD, verificando fallback de testing...');

        // Verificar localStorage o query params para simulación manual
        let simulateMechanic = false;
        let simulateSupervisor = false;

        if (typeof window !== 'undefined') {
          try {
            const ls = window.localStorage;
            simulateMechanic = ls?.getItem('simulateRoleMechanic') === '1';
            simulateSupervisor = ls?.getItem('simulateRoleSupervisor') === '1';
          } catch {
            // ignore localStorage read errors
          }

          try {
            const params = new URLSearchParams(window.location.search);
            simulateMechanic = simulateMechanic || params.get('simulateMechanic') === '1';
            simulateSupervisor = simulateSupervisor || params.get('simulateSupervisor') === '1';
          } catch {
            // ignore
          }
        }

        // Auto-assign roles para emails de testing (solo si no hay rol en BD)
        if (user.email === mechanicEmail) {
          simulateMechanic = true;
        }
        if (user.email === supervisorEmail) {
          simulateSupervisor = true;
        }

        if (simulateSupervisor && user.email === supervisorEmail) {
          console.log('[useUserRoles] Usando rol SIMULADO: supervisor');
          setCurrentUserRole('supervisor');
          setCachedRole(user.id, 'supervisor');
          setLoading(false);
          return;
        }

        if (simulateMechanic && user.email === mechanicEmail) {
          console.log('[useUserRoles] Usando rol SIMULADO: mechanic');
          setCurrentUserRole('mechanic');
          setCachedRole(user.id, 'mechanic');
          setLoading(false);
          return;
        }

        // 3. Si no hay rol en BD ni es email de testing, asignar 'user' por defecto
        console.log('[useUserRoles] Sin rol asignado, usando: user');
        setCurrentUserRole('user');
        setCachedRole(user.id, 'user');
      } catch (err) {
        console.error('[useUserRoles] Error:', err);
        setCurrentUserRole('user');
        if (user.id) setCachedRole(user.id, 'user');
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUserRole();
  }, [user]);

  // Verificar si tiene un rol específico usando la función de Supabase
  const checkRole = useCallback(async (role: AppRole): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error: rpcError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: role
      });

      if (rpcError) {
        console.error('Error checking role:', rpcError);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user]);

  // Cargar lista de usuarios (solo para admins)
  const fetchUsers = useCallback(async () => {
    if (!user || currentUserRole !== 'admin') {
      setError('No autorizado');
      return;
    }

    setLoadingUsers(true);
    setError(null);

    try {
      // Obtener todos los roles de usuario
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) {
        throw rolesError;
      }

      // Mapear datos
      const usersWithRoles: UserWithRole[] = (rolesData || []).map(item => ({
        id: item.user_id,
        email: `Usuario ${item.user_id.slice(0, 8)}...`, // No podemos acceder a auth.users directamente
        role: item.role as AppRole,
        created_at: item.created_at
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoadingUsers(false);
    }
  }, [user, currentUserRole]);

  // Actualizar rol de usuario (solo para admins)
  const updateUserRole = useCallback(async (userId: string, role: AppRole): Promise<boolean> => {
    if (!user || currentUserRole !== 'admin') {
      setError('No autorizado para cambiar roles');
      return false;
    }

    try {
      // Verificar si ya existe el registro
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Actualizar rol existente
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo registro de rol
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (insertError) throw insertError;
      }

      // Actualizar lista local
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role } : u
      ));

      return true;
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Error al actualizar rol');
      return false;
    }
  }, [user, currentUserRole]);

  // Permisos derivados
  const isAdmin = currentUserRole === 'admin';
  const isSupervisor = currentUserRole === 'supervisor';
  const isMechanic = currentUserRole === 'mechanic';
  const isUser = currentUserRole === 'user';

  // Permisos de edición: solo admin
  const canEdit = isAdmin;

  // Permisos de visualización: admin y supervisor
  const canViewDashboard = isAdmin || isSupervisor;
  const canViewMantenimiento = isAdmin || isSupervisor;
  const canViewHistorial = isAdmin || isSupervisor;
  const canViewNotificaciones = isAdmin || isSupervisor;

  return {
    currentUserRole,
    isAdmin,
    isSupervisor,
    isMechanic,
    isUser,
    canEdit,
    canViewDashboard,
    canViewMantenimiento,
    canViewHistorial,
    canViewNotificaciones,
    loading,
    users,
    loadingUsers,
    fetchUsers,
    updateUserRole,
    checkRole,
    error
  };
}
