import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Truck, Package, Calendar, BarChart3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const navItems = [
  { path: '/', label: 'Equipos', icon: Truck },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Calendar },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
];

export function Navigation() {
  const location = useLocation();

  const navLinks = useMemo(
    () =>
      navItems.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-medium transition-colors sm:w-auto sm:rounded-none sm:py-4",
            location.pathname === path
              ? "bg-primary/10 text-primary sm:border-b-2 sm:border-primary sm:bg-transparent"
              : "text-muted-foreground hover:bg-muted sm:border-b-2 sm:border-transparent sm:hover:border-gray-300 sm:hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      )),
    [location.pathname]
  );

  return (
    <nav className="border-b bg-white mb-6">
      <Sheet>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between sm:hidden">
            <span className="text-sm font-semibold text-primary">Navegación</span>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Menu className="h-4 w-4" />
                Abrir menú
              </Button>
            </SheetTrigger>
          </div>
          <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-4">
            {navLinks}
          </div>
        </div>
        <SheetContent side="left" className="sm:hidden w-[280px]">
          <SheetHeader className="text-left">
            <SheetTitle>Ir a</SheetTitle>
            <SheetDescription>Selecciona una sección para gestionar.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-2">
            {navItems.map(({ path, label }) => (
              <SheetClose asChild key={path}>
                <Link
                  to={path}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === path
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-foreground hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {label}
                </Link>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}