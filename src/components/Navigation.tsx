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
  ClipboardList,
  PackageOpen,
  Download,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificacionesCentro } from '@/components/NotificacionesCentro';
import { LogoutButton } from '@/components/LogoutButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { BrandLogo } from '@/components/BrandLogo';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/equipos', label: 'Equipos', icon: Truck },
  { path: '/control-mantenimiento', label: 'Control Mantenimiento', icon: Wrench },
  { path: '/planificador-inteligente', label: 'Planificador Inteligente', icon: Route },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Calendar },
  { path: '/planes-mantenimiento', label: 'Planes Mant.', icon: ClipboardList },
  { path: '/kits-mantenimiento', label: 'Kits Mant.', icon: PackageOpen },
  // { path: '/importar-caterpillar', label: 'Importar CAT', icon: Download }, // Oculto por solicitud del usuario
  { path: '/historial', label: 'Historial', icon: History },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  { path: '/listas-personalizadas', label: 'Listas personalizadas', icon: ListChecks },
  { path: '/configuraciones', label: 'Configuraciones', icon: Settings },
  { path: '/asistente', label: 'Asistente IA', icon: MessageSquareText },
];

interface NavigationProps {
  hideBrand?: boolean;
}

export function Navigation({ hideBrand = false }: NavigationProps) {
  const location = useLocation();

  const navLinks = useMemo(
    () =>
      navItems.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={cn(
            'group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 sm:w-auto sm:rounded-lg sm:py-4',
            location.pathname === path
              ? 'bg-primary/10 text-primary shadow-lg shadow-primary/20'
              : 'text-muted-foreground hover:bg-gradient-to-r hover:from-muted hover:via-muted/90 hover:to-muted hover:text-foreground hover:shadow-md',
          )}
        >
          <Icon className={cn(
            "h-4 w-4 relative z-10 transition-all duration-300 drop-shadow-sm",
            location.pathname === path ? "scale-110" : "group-hover:scale-125 group-hover:rotate-6"
          )} />
          <span className="relative z-10">{label}</span>
        </Link>
      )),
    [location.pathname],
  );

  return (
    <nav className="border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:border-border/40 dark:bg-card/70 mb-6">
      <Sheet>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between sm:hidden">
            <BrandLogo compact showTagline={false} />
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
          <div className="hidden w-full flex-col gap-4 sm:flex">
            <div className="flex w-full flex-col items-center justify-between gap-4 lg:flex-row">
              {!hideBrand && (
                <BrandLogo compact showTagline={false} className="shrink-0" />
              )}
              <div
                className={cn(
                  'flex w-full flex-wrap items-center gap-2 lg:flex-1 lg:justify-center lg:gap-4',
                  hideBrand ? 'justify-start sm:justify-center' : 'justify-center',
                )}
              >
                {navLinks}
              </div>
              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                <NotificacionesCentro />
                <LogoutButton />
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-2 lg:hidden">
              <div className="flex items-center gap-2">
                <NotificacionesCentro />
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
        <SheetContent side="left" className="w-[280px] bg-background text-foreground sm:hidden overflow-y-auto">
          <SheetHeader className="space-y-3 text-left pb-4 border-b">
            <BrandLogo compact={false} showTagline={true} />
            <SheetTitle className="text-lg">Navegación</SheetTitle>
            <SheetDescription className="text-sm">Selecciona una sección para gestionar.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-1.5">
            {navItems.map(({ path, label, icon: Icon }) => (
              <SheetClose asChild key={path}>
                <Link
                  to={path}
                  className={cn(
                    'group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300',
                    location.pathname === path
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg'
                      : 'text-foreground hover:bg-gradient-to-r hover:from-muted hover:to-muted/80 active:scale-95 hover:shadow-md',
                  )}
                >
                  {location.pathname === path && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse" />
                  )}
                  <div className={cn(
                    "rounded-lg p-2 transition-all duration-300 relative z-10",
                    location.pathname === path ? "bg-white/10" : "bg-transparent group-hover:bg-foreground/5"
                  )}>
                    <Icon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="flex-1 relative z-10">{label}</span>
                  {location.pathname === path && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground shadow-md relative z-10" />
                  )}
                </Link>
              </SheetClose>
            ))}
            <div className="mt-6 border-t border-border pt-4 space-y-2">
              <div className="px-4 py-2">
                <NotificacionesCentro />
              </div>
              <LogoutButton className="w-full" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
