/**
 * Sección de Administración completa
 * Incluye gestión de usuarios, configuración del sistema y estadísticas
 */
import { useState } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserManagement } from './UserManagement';
import { RoleGuard } from './RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Settings, Activity, Shield, ShieldCheck, 
  Database, Bell, Lock, UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSection() {
  const { currentUserRole, isAdmin, loading } = useUserRoles();
  const [activeTab, setActiveTab] = useState('usuarios');

  return (
    <RoleGuard requiredRole="admin">
      <div className="space-y-6">
        {/* Header de Admin */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Panel de Administración</h2>
              <p className="text-muted-foreground">Gestiona usuarios, roles y configuración del sistema</p>
            </div>
          </div>
          <Badge variant="default" className="gap-2 py-1.5 px-3">
            <ShieldCheck className="h-4 w-4" />
            Administrador
          </Badge>
        </div>

        {/* Tabs de administración */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuarios</span>
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

          <TabsContent value="seguridad" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Configuración de Seguridad
                </CardTitle>
                <CardDescription>
                  Gestiona las políticas de seguridad y acceso al sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        <li>• Acceso a dashboard y equipos</li>
                        <li>• Ver y registrar mantenimientos</li>
                        <li>• Consultar inventario</li>
                        <li>• Usar asistente IA</li>
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
                          El sistema utiliza <strong>Row Level Security (RLS)</strong> de Supabase 
                          para proteger los datos. Cada tabla tiene políticas que determinan 
                          qué usuarios pueden ver, crear, editar o eliminar registros.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          La función <code className="bg-muted px-1 rounded">has_role()</code> se 
                          utiliza para verificar roles de forma segura en el servidor.
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
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Estado del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm font-medium">Base de datos</span>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      Conectada
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm font-medium">Autenticación</span>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      Activa
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm font-medium">Edge Functions</span>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      Disponibles
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-primary" />
                    Notificaciones
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
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
