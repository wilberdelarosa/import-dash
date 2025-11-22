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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/60 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      {/* Safe area para iOS */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 min-w-[60px]',
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground active:bg-muted/50',
              )}
            >
              {/* Indicador activo */}
              {active && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
              
              {/* Fondo sutil cuando está activo */}
              {active && (
                <div className="absolute inset-0 bg-primary/5 rounded-xl" />
              )}
              
              <Icon className={cn(
                'h-5 w-5 transition-all duration-200',
                active ? 'scale-110' : 'scale-100',
              )} />
              <span className={cn(
                'text-[0.65rem] font-medium transition-all duration-200',
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
