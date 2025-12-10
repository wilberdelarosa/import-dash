import { Link, useLocation, Navigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
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
  FileText,
  ClipboardCheck,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificacionesCentro } from '@/components/NotificacionesCentro';
import { LogoutButton } from '@/components/LogoutButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { BrandLogo } from '@/components/BrandLogo';
import { UserBadge } from '@/components/UserBadge';
import { useUserRoles } from '@/hooks/useUserRoles';

// Nav items for admin/user roles
const adminNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/equipos', label: 'Equipos', icon: Truck },
  { path: '/control-mantenimiento', label: 'Control Mantenimiento', icon: Wrench },
  { path: '/planificador-inteligente', label: 'Planificador Inteligente', icon: Route },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Calendar },
  { path: '/planes-mantenimiento', label: 'Planes Mant.', icon: ClipboardList },
  { path: '/kits-mantenimiento', label: 'Kits Mant.', icon: PackageOpen },
  { path: '/historial', label: 'Historial', icon: History },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  { path: '/listas-personalizadas', label: 'Listas personalizadas', icon: ListChecks },
  { path: '/configuraciones', label: 'Configuraciones', icon: Settings },
  { path: '/asistente', label: 'Asistente IA', icon: MessageSquareText },
];

// Nav items for mechanic role
const mechanicNavItems = [
  { path: '/mechanic', label: 'Inicio', icon: LayoutDashboard },
  { path: '/mechanic/pendientes', label: 'Equipos Pendientes', icon: Truck },
  { path: '/mechanic/reportar', label: 'Reportar Trabajo', icon: ClipboardCheck },
  { path: '/mechanic/historial', label: 'Mis Reportes', icon: FileText },
  { path: '/historial', label: 'Historial General', icon: History },
];

// Nav items for supervisor role
const supervisorNavItems = [
  { path: '/supervisor', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/supervisor/submissions', label: 'Revisar Reportes', icon: FileText },
  { path: '/equipos', label: 'Ver Equipos', icon: Truck },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Calendar },
  { path: '/historial', label: 'Historial', icon: History },
];

interface NavigationProps {
  hideBrand?: boolean;
}

export function Navigation({ hideBrand = false }: NavigationProps) {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { currentUserRole, loading: roleLoading } = useUserRoles();

  // Determine which nav items to use based on role
  const navItems = useMemo(() => {
    if (currentUserRole === 'mechanic') return mechanicNavItems;
    if (currentUserRole === 'supervisor') return supervisorNavItems;
    return adminNavItems; // admin and user use same nav
  }, [currentUserRole]);

  // Primary items based on role
  const primaryPaths = useMemo(() => {
    if (currentUserRole === 'mechanic') {
      return new Set(['/mechanic', '/mechanic/pendientes', '/mechanic/reportar', '/mechanic/historial', '/historial']);
    }
    if (currentUserRole === 'supervisor') {
      return new Set(['/supervisor', '/supervisor/submissions', '/equipos', '/mantenimiento', '/historial']);
    }
    return new Set(['/', '/equipos', '/mantenimiento', '/control-mantenimiento', '/asistente']);
  }, [currentUserRole]);

  const primaryItems = navItems.filter((i) => primaryPaths.has(i.path));
  const secondaryItems = navItems.filter((i) => !primaryPaths.has(i.path));

  return (
    <nav className="border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:border-border/40 dark:bg-card/70 mb-6">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
                {/* Render only primary items in main nav */}
                {primaryItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      'group relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 sm:py-4',
                      location.pathname === path
                        ? 'bg-primary/10 text-primary shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-gradient-to-r hover:from-muted hover:via-muted/90 hover:to-muted hover:text-foreground hover:shadow-md',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 relative z-10')} />
                    <span className="relative z-10">{label}</span>
                  </Link>
                ))}

                {/* Compact control for secondary items: popover (acoplado) + sheet (desacoplado) */}
                <div className="ml-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Menu className="h-4 w-4" />
                        Más
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[220px]">
                      <div className="flex flex-col gap-1">
                        {secondaryItems.map(({ path, label, icon: Icon }) => (
                          <Link
                            key={path}
                            to={path}
                            className={cn(
                              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                              location.pathname === path ? 'bg-muted/10 font-semibold' : 'hover:bg-muted/5',
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                          </Link>
                        ))}
                        <div className="pt-2 border-t mt-2">
                          <Button size="sm" variant="ghost" onClick={() => setSheetOpen(true)} className="w-full">
                            Desacoplar menú
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-3 lg:flex">
                <UserBadge />
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
        <SheetContent side="left" className="w-[320px] bg-background text-foreground sm:hidden overflow-y-auto">
          <SheetHeader className="space-y-3 text-left pb-4 border-b">
            <BrandLogo compact={false} showTagline={true} />
            <SheetTitle className="text-lg font-bold">Navegación</SheetTitle>
            <SheetDescription className="text-sm">Accede a todas las secciones del sistema</SheetDescription>
          </SheetHeader>
          
          {/* Secciones agrupadas */}
          <div className="mt-6 space-y-6">
            {/* Principal */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">Principal</p>
              <div className="grid gap-1.5">
                {primaryItems.map(({ path, label, icon: Icon }) => (
                  <SheetClose asChild key={path}>
                    <Link
                      to={path}
                      className={cn(
                        'group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]',
                        location.pathname === path
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'text-foreground hover:bg-muted active:bg-muted/80',
                      )}
                    >
                      <div className={cn(
                        "rounded-lg p-2 transition-all duration-200 relative z-10",
                        location.pathname === path ? "bg-white/15" : "bg-transparent group-hover:bg-foreground/5"
                      )}>
                        <Icon className="h-5 w-5 shrink-0" />
                      </div>
                      <span className="flex-1 relative z-10">{label}</span>
                      {location.pathname === path && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground shadow-md relative z-10 animate-pulse" />
                      )}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
            
            {/* Gestión y Reportes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">Gestión y Reportes</p>
              <div className="grid gap-1.5">
                {secondaryItems.map(({ path, label, icon: Icon }) => (
                  <SheetClose asChild key={path}>
                    <Link
                      to={path}
                      className={cn(
                        'group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                        location.pathname === path
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {location.pathname === path && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
            
            {/* Usuario y Cuenta */}
            <div className="pt-4 border-t border-border space-y-3">
              <UserBadge className="w-full" />
              <NotificacionesCentro />
              <LogoutButton className="w-full" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
