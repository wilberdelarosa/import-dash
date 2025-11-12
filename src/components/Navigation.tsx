import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Truck,
  Package,
  Calendar,
  BarChart3,
  Menu,
  History,
  LayoutDashboard,
  Settings,
  Wrench,
  MessageSquareText,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificacionesCentro } from '@/components/NotificacionesCentro';
import { LogoutButton } from '@/components/LogoutButton';
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
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/equipos', label: 'Equipos', icon: Truck },
  { path: '/control-mantenimiento', label: 'Control Mantenimiento', icon: Wrench },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Calendar },
  { path: '/historial', label: 'Historial', icon: History },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  { path: '/listas-personalizadas', label: 'Listas personalizadas', icon: ListChecks },
  { path: '/configuraciones', label: 'Configuraciones', icon: Settings },
  { path: '/asistente', label: 'Asistente IA', icon: MessageSquareText },
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
              : "text-muted-foreground hover:bg-muted sm:border-b-2 sm:border-transparent sm:hover:border-border sm:hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      )),
    [location.pathname]
  );

  return (
    <nav className="border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:border-border/40 dark:bg-card/70 mb-6">
      <Sheet>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between sm:hidden">
            <span className="text-sm font-semibold text-primary">Navegación</span>
            <div className="flex gap-2">
              <NotificacionesCentro />
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Menu className="h-4 w-4" />
                  Abrir menú
                </Button>
              </SheetTrigger>
            </div>
          </div>
          <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
              {navLinks}
            </div>
            <div className="flex items-center gap-2">
              <NotificacionesCentro />
              <LogoutButton />
            </div>
          </div>
        </div>
        <SheetContent side="left" className="sm:hidden w-[280px] bg-background text-foreground">
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
                      : "border-border/60 text-foreground hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {label}
                </Link>
              </SheetClose>
            ))}
            <div className="mt-4 pt-4 border-t border-border">
              <LogoutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}