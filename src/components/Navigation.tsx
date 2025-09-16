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
        <div className="flex space-x-8">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors",
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