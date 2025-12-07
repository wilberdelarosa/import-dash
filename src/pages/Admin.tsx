/**
 * Página de Administración (Admin Panel)
 * Accesible desde móvil y desktop para usuarios con rol admin
 */
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useUserRoles } from '@/hooks/useUserRoles';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

export default function Admin() {
  const { isAdmin, loading } = useUserRoles();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <MobileLayout title="Administración">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MobileLayout title="Acceso Denegado">
        <Card className="p-8 text-center max-w-md mx-auto mt-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground">
            No tienes permisos para acceder al panel de administración.
            Contacta a un administrador si necesitas acceso.
          </p>
        </Card>
      </MobileLayout>
    );
  }

  if (isMobile) {
    return (
      <MobileLayout title="Administración" showBottomNav={true}>
        <AdminPanel />
      </MobileLayout>
    );
  }

  // Desktop view
  return (
    <div className="container mx-auto py-6 px-4">
      <AdminPanel />
    </div>
  );
}
