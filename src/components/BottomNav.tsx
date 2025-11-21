import { Link, useLocation } from 'react-router-dom';
import { Home, Truck, Calendar, Wrench, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/equipos', label: 'Equipos', icon: Truck },
  { to: '/mantenimiento', label: 'Mantenimiento', icon: Calendar },
  { to: '/control-mantenimiento', label: 'Control', icon: Wrench },
  { to: '/asistente', label: 'Asistente', icon: MessageSquare },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 border-t border-border/40 sm:hidden">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2">
        <div className="flex w-full items-center justify-between">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5')} />
                <span className="text-[0.65rem]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
