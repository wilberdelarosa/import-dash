/**
 * Layout móvil optimizado con navegación bottom-bar
 * 
 * Características:
 * - Header compacto con logo y acciones esenciales
 * - Contenido scrollable con safe-area
 * - Bottom navigation bar fija
 * - Soporte para gestos táctiles
 * - Transiciones suaves
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Package,
  Calendar,
  Menu,
  Bell,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBottomNav?: boolean;
  headerActions?: ReactNode;
}

const bottomNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Inicio' },
  { path: '/equipos', icon: Truck, label: 'Equipos' },
  { path: '/control-mantenimiento', icon: Wrench, label: 'Mant.' },
  { path: '/inventario', icon: Package, label: 'Inventario' },
  { path: '/planificador', icon: Calendar, label: 'Plan' },
];

export function MobileLayout({ 
  children, 
  title, 
  showBottomNav = true,
  headerActions 
}: MobileLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header móvil compacto */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo compacto */}
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Logo" className="h-8 w-8" />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-bold tracking-wider">ALITO</span>
              <span className="text-[0.65rem] text-muted-foreground">SRL</span>
            </div>
          </div>

          {/* Título actual */}
          <h1 className="flex-1 truncate text-center text-sm font-semibold">
            {title}
          </h1>

          {/* Acciones header */}
          <div className="flex items-center gap-2">
            {headerActions}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Menú</h2>
                    <ThemeToggle />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="justify-start gap-2">
                      <Bell className="h-4 w-4" />
                      Notificaciones
                      <Badge variant="destructive" className="ml-auto">3</Badge>
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Contenido principal scrollable */}
      <ScrollArea className={cn(
        "flex-1",
        showBottomNav && "pb-20" // Espacio para bottom nav
      )}>
        <main className="container mx-auto p-4 pb-safe">
          {children}
        </main>
      </ScrollArea>

      {/* Bottom navigation bar */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-safe">
          <div className="flex h-16 items-center justify-around">
            {bottomNavItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:scale-95"
                  )}
                >
                  <div className={cn(
                    "rounded-lg p-1.5 transition-all duration-200",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[0.65rem] font-medium transition-all duration-200",
                    isActive && "font-semibold"
                  )}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
