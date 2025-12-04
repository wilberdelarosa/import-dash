/**
 * Página de Notificaciones - Wrapper para versión mobile/desktop
 */
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { NotificacionesMobile } from '@/pages/mobile/NotificacionesMobile';
import { Layout } from '@/components/Layout';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function Notificaciones() {
  const { isMobile } = useDeviceDetection();

  if (isMobile) {
    return <NotificacionesMobile />;
  }

  // Versión desktop - usa el centro de notificaciones dentro del layout
  return (
    <Layout title="Notificaciones">
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Centro de Notificaciones</h1>
        <NotificationCenter />
      </div>
    </Layout>
  );
}
