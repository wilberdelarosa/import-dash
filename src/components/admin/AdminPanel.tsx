/**
 * Panel de Administración Completo y Robusto
 */
import { useState, useEffect } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserManagement } from './UserManagement';
import { RoleGuard } from './RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Settings, Activity, Shield, ShieldCheck, 
  Database, Bell, Lock, UserCog, RefreshCw, CheckCircle2,
  AlertTriangle, Server, Key, FileText, BarChart3, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULES, DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions';

interface SystemStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  totalEquipos: number;
  totalMantenimientos: number;
  totalInventario: number;
}

export function AdminPanel() {
  const { currentUserRole, isAdmin, loading } = useUserRoles();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [usersRes, equiposRes, mantRes, invRes] = await Promise.all([
        supabase.from('user_roles').select('role'),
        supabase.from('equipos').select('id', { count: 'exact', head: true }),
        supabase.from('mantenimientos_programados').select('id', { count: 'exact', head: true }),
        supabase.from('inventarios').select('id', { count: 'exact', head: true }),
      ]);

      const roles = usersRes.data || [];
      setStats({
        totalUsers: roles.length,
        adminUsers: roles.filter(r => r.role === 'admin').length,
        regularUsers: roles.filter(r => r.role === 'user').length,
        totalEquipos: equiposRes.count || 0,
        totalMantenimientos: mantRes.count || 0,
        totalInventario: invRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  return (
    <RoleGuard requiredRole="admin">
      <div className="space-y-6">
        {/* Header de Admin */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Panel de Administración</h2>
              <p className="text-muted-foreground">Gestiona usuarios, permisos y configuración del sistema</p>
            </div>
          </div>
          <Badge variant="default" className="gap-2 py-1.5 px-3 w-fit">
            <ShieldCheck className="h-4 w-4" />
            Administrador
          </Badge>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Usuarios
                </CardDescription>
                <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {stats.adminUsers} admins, {stats.regularUsers} usuarios
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Equipos
                </CardDescription>
                <CardTitle className="text-3xl">{stats.totalEquipos}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Registrados en el sistema
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Mantenimientos
                </CardDescription>
                <CardTitle className="text-3xl">{stats.totalMantenimientos}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Programados activos
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Inventario
                </CardDescription>
                <CardTitle className="text-3xl">{stats.totalInventario}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Items en stock
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs de administración */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="permisos" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Permisos</span>
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="permisos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Matriz de Permisos por Módulo
                </CardTitle>
                <CardDescription>
                  Visualiza los permisos asignados a cada rol por módulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Módulo</th>
                        <th className="text-center p-2 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Admin
                          </div>
                        </th>
                        <th className="text-center p-2 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <UserCog className="h-4 w-4 text-blue-500" />
                            Usuario
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map(module => {
                        const adminPerms = DEFAULT_ROLE_PERMISSIONS.admin[module.id] || [];
                        const userPerms = DEFAULT_ROLE_PERMISSIONS.user[module.id] || [];
                        
                        return (
                          <tr key={module.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{module.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{module.description}</span>
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {adminPerms.includes('read') && <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Ver</Badge>}
                                {adminPerms.includes('write') && <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">Editar</Badge>}
                                {adminPerms.includes('delete') && <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">Eliminar</Badge>}
                                {adminPerms.includes('admin') && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Admin</Badge>}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {userPerms.length === 0 ? (
                                  <Badge variant="secondary" className="text-xs">Sin acceso</Badge>
                                ) : (
                                  <>
                                    {userPerms.includes('read') && <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Ver</Badge>}
                                    {userPerms.includes('write') && <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">Editar</Badge>}
                                    {userPerms.includes('delete') && <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">Eliminar</Badge>}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Alert className="mt-4">
                  <Eye className="h-4 w-4" />
                  <AlertTitle>Nota sobre permisos</AlertTitle>
                  <AlertDescription>
                    Los usuarios con rol "Usuario" solo pueden ver información. No pueden crear, editar ni eliminar registros.
                    Solo los administradores tienen control total del sistema.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguridad" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Configuración de Seguridad
                </CardTitle>
                <CardDescription>
                  Estado de las políticas de seguridad y acceso al sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estado de seguridad */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Estado de Seguridad</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium">Row Level Security (RLS)</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                        Activo
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium">Función has_role()</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                        Configurada
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium">Autenticación</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                        Email/Password
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium">Asignación automática</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                        Trigger activo
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Roles disponibles */}
                <div>
                  <h4 className="font-semibold mb-3">Roles del Sistema</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Administrador</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                        <li>• Acceso completo al sistema</li>
                        <li>• Gestión de usuarios y roles</li>
                        <li>• Crear, editar y eliminar registros</li>
                        <li>• Configuración del sistema</li>
                        <li>• Importación/exportación de datos</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <UserCog className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Usuario</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                        <li>• Solo lectura en todos los módulos</li>
                        <li>• Consultar equipos e inventario</li>
                        <li>• Ver mantenimientos y planes</li>
                        <li>• Usar asistente IA</li>
                        <li>• Sin acceso a administración</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Políticas RLS */}
                <div>
                  <h4 className="font-semibold mb-3">Políticas de Acceso (RLS)</h4>
                  <div className="p-4 rounded-lg bg-accent/50 border">
                    <div className="flex items-start gap-3">
                      <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm">
                          El sistema utiliza <strong>Row Level Security (RLS)</strong> para proteger los datos a nivel de base de datos.
                          Cada operación es verificada en el servidor antes de ejecutarse.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          La función <code className="bg-muted px-1 rounded">has_role()</code> verifica roles de forma segura
                          usando <code className="bg-muted px-1 rounded">SECURITY DEFINER</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sistema" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-5 w-5 text-primary" />
                      Estado del Sistema
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchStats} disabled={loadingStats}>
                      <RefreshCw className={cn("h-4 w-4 mr-2", loadingStats && "animate-spin")} />
                      Actualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Base de datos</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      Conectada
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Autenticación</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      Activa
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Edge Functions</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      Disponibles
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Sistema de Roles</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      Configurado
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-primary" />
                    Canales de Notificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border">
                    <span className="text-sm font-medium">Canal Email</span>
                    <Badge variant="secondary">Configurado</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border">
                    <span className="text-sm font-medium">Canal SMS</span>
                    <Badge variant="secondary">Disponible</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border">
                    <span className="text-sm font-medium">Push Notifications</span>
                    <Badge variant="secondary">Activo</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info adicional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Versión</p>
                    <p className="font-semibold">1.0.0</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Entorno</p>
                    <p className="font-semibold">Producción</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Backend</p>
                    <p className="font-semibold">Lovable Cloud</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
