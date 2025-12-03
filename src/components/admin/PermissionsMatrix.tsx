/**
 * Matriz de permisos por rol y módulo
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MODULES, DEFAULT_ROLE_PERMISSIONS, ModulePermission, AppRole } from '@/lib/permissions';
import { 
  LayoutDashboard, Truck, Package, Wrench, Calendar, FileText, 
  Box, History, BarChart3, Bot, Settings, Shield, Upload, Lock
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Truck, Package, Wrench, Calendar, FileText,
  Box, History, BarChart3, Bot, Settings, Shield, Upload
};

const PERMISSION_LABELS: Record<ModulePermission, { label: string; color: string }> = {
  read: { label: 'Leer', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  write: { label: 'Editar', color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
  delete: { label: 'Eliminar', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
  admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
};

interface PermissionsMatrixProps {
  editable?: boolean;
  onPermissionChange?: (role: AppRole, moduleId: string, permission: ModulePermission, enabled: boolean) => void;
}

export function PermissionsMatrix({ editable = false, onPermissionChange }: PermissionsMatrixProps) {
  const roles: AppRole[] = ['admin', 'user'];
  const permissions: ModulePermission[] = ['read', 'write', 'delete', 'admin'];

  const hasPermission = (role: AppRole, moduleId: string, permission: ModulePermission) => {
    return DEFAULT_ROLE_PERMISSIONS[role]?.[moduleId]?.includes(permission) || false;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Matriz de Permisos</CardTitle>
            <CardDescription>Permisos por rol y módulo del sistema</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Leyenda de permisos */}
        <div className="flex flex-wrap gap-2 mb-4">
          {permissions.map(p => (
            <Badge key={p} variant="outline" className={PERMISSION_LABELS[p].color}>
              {PERMISSION_LABELS[p].label}
            </Badge>
          ))}
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[200px]">Módulo</TableHead>
                {roles.map(role => (
                  <TableHead key={role} className="text-center min-w-[180px]">
                    <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                      {role === 'admin' ? 'Administrador' : 'Usuario'}
                    </Badge>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODULES.map(module => {
                const IconComponent = ICON_MAP[module.icon] || Shield;
                return (
                  <TableRow key={module.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    {roles.map(role => (
                      <TableCell key={role} className="text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {permissions.map(permission => {
                            const enabled = hasPermission(role, module.id, permission);
                            if (editable) {
                              return (
                                <div key={permission} className="flex items-center gap-1">
                                  <Checkbox
                                    checked={enabled}
                                    onCheckedChange={(checked) => 
                                      onPermissionChange?.(role, module.id, permission, !!checked)
                                    }
                                    disabled={role === 'admin'} // Admin siempre tiene todos
                                  />
                                  <span className="text-xs">{PERMISSION_LABELS[permission].label}</span>
                                </div>
                              );
                            }
                            return enabled ? (
                              <Badge 
                                key={permission} 
                                variant="outline" 
                                className={`text-[10px] px-1.5 py-0 ${PERMISSION_LABELS[permission].color}`}
                              >
                                {PERMISSION_LABELS[permission].label.charAt(0)}
                              </Badge>
                            ) : null;
                          })}
                          {!editable && !permissions.some(p => hasPermission(role, module.id, p)) && (
                            <span className="text-xs text-muted-foreground">Sin acceso</span>
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Info adicional */}
        <div className="mt-4 p-3 rounded-lg bg-accent/50 border">
          <p className="text-sm text-muted-foreground">
            <strong>Leyenda:</strong> L = Leer, E = Editar, X = Eliminar, A = Admin completo.
            Los administradores tienen acceso completo a todos los módulos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
