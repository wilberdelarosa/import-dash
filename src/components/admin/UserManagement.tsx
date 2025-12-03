/**
 * Componente de Gestión de Usuarios
 * Panel de administración para gestionar usuarios y roles
 */
import { useEffect, useState, useCallback } from 'react';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Shield, ShieldCheck, RefreshCw, UserCog, AlertTriangle, Search, Mail, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
  last_sign_in_at?: string;
}

export function UserManagement() {
  const { isAdmin } = useUserRoles();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);
    try {
      // Obtener roles de usuarios
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Obtener emails usando la función RPC
      const { data: authData, error: authError } = await supabase.rpc('get_users_with_emails');
      
      if (authError) {
        console.warn('Could not fetch user emails:', authError);
      }

      const usersWithRoles: UserWithRole[] = (rolesData || []).map(item => {
        const authUser = authData?.find((u: any) => u.id === item.user_id);
        return {
          id: item.user_id,
          email: authUser?.email || `Usuario ${item.user_id.slice(0, 8)}...`,
          role: item.role as AppRole,
          created_at: authUser?.created_at || item.created_at,
          last_sign_in_at: authUser?.last_sign_in_at
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingUserId(userId);
    try {
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Rol actualizado',
        description: `El usuario ahora tiene el rol "${newRole === 'admin' ? 'Administrador' : 'Usuario'}"`,
      });
    } catch (err) {
      console.error('Error updating role:', err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder a esta sección. Se requiere rol de administrador.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administra los usuarios y sus roles en el sistema</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Resumen de roles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-accent/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Usuarios</span>
            </div>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Administradores</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Usuarios</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="hidden md:table-cell">Registro</TableHead>
                  <TableHead className="hidden lg:table-cell">Último acceso</TableHead>
                  <TableHead className="text-right">Cambiar Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded-full",
                          user.role === 'admin' ? "bg-primary/10" : "bg-blue-500/10"
                        )}>
                          <Mail className={cn(
                            "h-3.5 w-3.5",
                            user.role === 'admin' ? "text-primary" : "text-blue-600"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{user.email}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={cn(
                          user.role === 'admin' && 'bg-primary',
                          "gap-1"
                        )}
                      >
                        {user.role === 'admin' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <UserCog className="h-3 w-3" />
                        )}
                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(user.last_sign_in_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-[140px]">
                          {updatingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-primary" />
                              Administrador
                            </div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <UserCog className="h-4 w-4" />
                              Usuario
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Información de seguridad */}
        <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                Información de Seguridad
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Los roles se verifican del lado del servidor usando funciones de seguridad. 
                Los administradores tienen acceso completo al sistema. 
                Los usuarios tienen acceso limitado según las políticas configuradas.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
