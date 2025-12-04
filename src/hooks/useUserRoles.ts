/**
 * Hook para gestión de roles de usuario
 * Utiliza la tabla user_roles y función has_role de Supabase
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type AppRole = 'admin' | 'supervisor' | 'user';

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

export function useUserRoles(): UseUserRolesReturn {
  const { user } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(null);
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

      try {
        const { data, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError) {
          console.error('Error loading user role:', roleError);
          // Si no tiene rol, asignar 'user' por defecto
          setCurrentUserRole('user');
        } else {
          setCurrentUserRole(data?.role as AppRole || 'user');
        }
      } catch (err) {
        console.error('Error:', err);
        setCurrentUserRole('user');
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
