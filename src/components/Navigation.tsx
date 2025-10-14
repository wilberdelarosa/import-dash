import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Truck, Package, Calendar, BarChart3 } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Equipos', icon: Truck },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Calendar },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b mb-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "inline-flex w-full items-center justify-center px-3 py-3 sm:w-auto sm:py-4 border-b-2 text-sm font-medium transition-colors rounded-md sm:rounded-none",
                location.pathname === path
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}