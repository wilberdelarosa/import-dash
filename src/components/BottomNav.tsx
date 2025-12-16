import { Link, useLocation } from 'react-router-dom';
import { Home, Truck, Calendar, Wrench, MessageSquare, History, Bell, LucideIcon, FileText, Eye, ClipboardList, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Badge } from '@/components/ui/badge';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export default function BottomNav() {
  const location = useLocation();
  const { isAdmin, isSupervisor, isMechanic } = useUserRoles();
  const { unreadCount } = useUnifiedNotifications();

  const isActiveRoute = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`) || location.pathname.startsWith(to);
  };

  // Items base para todos los usuarios
  const baseItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/equipos', label: 'Equipos', icon: Truck },
    { to: '/mantenimiento', label: 'Mant.', icon: Calendar },
  ];

  // Items para admin
  const adminItems: NavItem[] = [
    ...baseItems,
    { to: '/tickets', label: 'Tickets', icon: Ticket },
    { to: '/asistente', label: 'IA', icon: MessageSquare },
  ];

  // Items para supervisor - dashboard supervisor, reportes, tickets, alertas
  const supervisorItems: NavItem[] = [
    { to: '/supervisor', label: 'Panel', icon: Eye },
    { to: '/supervisor/reportes', label: 'Reportes', icon: FileText },
    { to: '/tickets', label: 'Tickets', icon: Ticket },
    { to: '/historial', label: 'Historial', icon: History },
    { to: '/notificaciones', label: 'Alertas', icon: Bell, badge: unreadCount },
  ];

  // Items para mecánico
  const mechanicItems: NavItem[] = [
    { to: '/mechanic', label: 'Panel', icon: Home },
    { to: '/mechanic/pendientes', label: 'Pendientes', icon: ClipboardList },
    { to: '/mechanic/reportar', label: 'Reportar', icon: FileText },
    { to: '/mechanic/historial', label: 'Mis Rep.', icon: FileText },
    { to: '/historial', label: 'General', icon: History },
  ];

  // Items para usuario normal
  const userItems: NavItem[] = [
    ...baseItems,
    { to: '/asistente', label: 'IA', icon: MessageSquare },
  ];

  // Seleccionar items según rol
  const items = isAdmin
    ? adminItems
    : isSupervisor
      ? supervisorItems
      : isMechanic
        ? mechanicItems
        : userItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/60 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      {/* Safe area para iOS */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-around px-1 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item.to);
          const hasBadge = 'badge' in item && item.badge && item.badge > 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 active:scale-95 min-w-[52px]',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground active:bg-muted/50',
              )}
            >
              {/* Indicador activo */}
              {active && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}

              {/* Fondo sutil cuando está activo */}
              {active && (
                <div className="absolute inset-0 bg-primary/5 rounded-lg" />
              )}

              <div className="relative">
                <Icon className={cn(
                  'h-4 w-4 transition-all duration-200',
                  active ? 'scale-105' : 'scale-100',
                )} />
                {hasBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-[0.6rem] font-medium transition-all duration-200 leading-tight',
                active ? 'scale-100 opacity-100' : 'scale-95 opacity-70',
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
