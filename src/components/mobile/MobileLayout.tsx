/**
 * Layout móvil optimizado con navegación completa
 * 
 * Características:
 * - Header compacto con logo y acciones esenciales
 * - Contenido scrollable con safe-area CONSISTENTE
 * - Bottom navigation bar fija con TODAS las rutas principales
 * - Menú lateral completo con todos los módulos
 * - UserBadge con información del usuario y rol
 * - Soporte para gestos táctiles
 * - Transiciones suaves
 */

import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  FileText,
  Settings,
  Sparkles,
  History,
  ClipboardList,
  Zap,
  ListChecks,
  Boxes,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBottomNav?: boolean;
  headerActions?: ReactNode;
}

// NAVEGACIÓN BOTTOM BAR - 5 ítems principales más usados
const bottomNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Inicio' },
  { path: '/equipos', icon: Truck, label: 'Equipos' },
  { path: '/mantenimiento', icon: Wrench, label: 'Mant.' },
  { path: '/inventario', icon: Package, label: 'Inventario' },
  { path: '/asistente', icon: Sparkles, label: 'Asistente' },
];

// MENÚ LATERAL - Todos los módulos organizados
const sideMenuSections = [
  {
    title: 'Principal',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/equipos', icon: Truck, label: 'Equipos' },
      { path: '/mantenimiento', icon: Wrench, label: 'Mantenimiento' },
      { path: '/inventario', icon: Package, label: 'Inventario' },
    ],
  },
  {
    title: 'Planificación',
    items: [
      { path: '/planificador-inteligente', icon: Zap, label: 'Planificador IA' },
      { path: '/planificador', icon: Calendar, label: 'Planificador Manual' },
      { path: '/planes-mantenimiento', icon: ClipboardList, label: 'Planes Asignados' },
      { path: '/control-mantenimiento', icon: Wrench, label: 'Control Profesional' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { path: '/kits', icon: Boxes, label: 'Kits Mantenimiento' },
      { path: '/historial', icon: History, label: 'Historial' },
      { path: '/reportes', icon: FileText, label: 'Reportes' },
      { path: '/listas-personalizadas', icon: ListChecks, label: 'Listas Personalizadas' },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      { path: '/asistente', icon: Sparkles, label: 'Asistente IA' },
      { path: '/configuraciones', icon: Settings, label: 'Configuraciones' },
    ],
  },
];

export function MobileLayout({
  children,
  title,
  showBottomNav = true,
  headerActions
}: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentUserRole, loading: loadingRole } = useUserRoles();
  const { toast } = useToast();

  // Verificar si la ruta actual coincide (incluyendo rutas parciales como /planificador*)
  const isRouteActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isAdmin = currentUserRole === 'admin';
  const email = user?.email || 'Usuario';
  const initials = email.substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cerrar sesión',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background/95 supports-[backdrop-filter]:bg-background/60">
      {/* Header móvil premium - Responsive */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 shadow-sm">
        <div className="flex h-12 sm:h-14 items-center justify-between px-3 sm:px-4 pt-safe">
          {/* Logo animado */}
          <Link to="/" className="flex items-center gap-2 active:scale-95 transition-transform">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              <img src="/favicon.ico" alt="Logo" className="relative h-7 sm:h-8 w-7 sm:w-8 object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[0.65rem] sm:text-xs font-bold tracking-wider text-foreground/90">ALITO</span>
              <span className="text-[0.55rem] sm:text-[0.65rem] text-muted-foreground font-medium">SRL</span>
            </div>
          </Link>

          {/* Título con fade - Responsive */}
          <h1 className="flex-1 truncate text-center text-xs sm:text-sm font-semibold text-foreground/90 animate-fade-in px-2">
            {title}
          </h1>

          {/* Acciones header */}
          <div className="flex items-center gap-1">
            {headerActions}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 active:scale-90 transition-all">
                  <Menu className="h-5 w-5 text-foreground/80" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-80 p-0 border-l-0 bg-background">
                <div className="flex flex-col h-full">
                  {/* Header del menú con info de usuario */}
                  <div className="relative p-4 pb-3 border-b border-border/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    
                    {/* User Badge */}
                    <div className={cn(
                      "relative flex items-center gap-3 p-3 rounded-xl border mb-4",
                      isAdmin ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
                    )}>
                      <Avatar className={cn(
                        "h-10 w-10 border-2",
                        isAdmin ? "border-primary/40" : "border-border"
                      )}>
                        <AvatarFallback className={cn(
                          "text-sm font-bold",
                          isAdmin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium truncate" title={email}>
                          {email}
                        </span>
                        <Badge 
                          variant={isAdmin ? "default" : "secondary"} 
                          className={cn(
                            "w-fit gap-1 text-[10px] px-1.5 py-0 mt-1",
                            isAdmin ? "bg-primary/90" : ""
                          )}
                        >
                          {isAdmin ? <ShieldCheck className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                          {isAdmin ? 'Admin' : 'Usuario'}
                        </Badge>
                      </div>
                      <ThemeToggle />
                    </div>

                    {/* Notificaciones con diseño mejorado */}
                    <Button
                      variant="ghost"
                      className="relative w-full justify-start gap-3 h-11 text-sm font-medium hover:bg-primary/10 rounded-xl transition-all group overflow-hidden"
                      onClick={() => navigate('/configuraciones')}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-3 flex-1">
                        <div className="rounded-lg p-1.5 bg-primary/10">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        Notificaciones
                      </div>
                      <Badge variant="destructive" className="shadow-lg shadow-destructive/30">3</Badge>
                    </Button>
                  </div>

                  <Separator className="opacity-50" />

                  {/* Menú scrollable */}
                  <ScrollArea className="flex-1">
                    <div className="px-4 py-4 space-y-6">
                      {sideMenuSections.map((section) => (
                        <div key={section.title}>
                          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {section.title}
                          </h3>
                          <div className="space-y-1">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              const active = isRouteActive(item.path);

                              return (
                                <Button
                                  key={item.path}
                                  variant="ghost"
                                  className={cn(
                                    "relative w-full justify-start gap-3 h-11 text-sm font-medium transition-all rounded-xl group overflow-hidden",
                                    active
                                      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary hover:from-primary/20 hover:to-primary/10 shadow-sm"
                                      : "hover:bg-muted/50"
                                  )}
                                  onClick={() => navigate(item.path)}
                                >
                                  {active && <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-purple-600 rounded-r" />}
                                  <div className="relative flex items-center gap-3 flex-1">
                                    <div className={cn(
                                      "rounded-lg p-1.5 transition-colors",
                                      active ? "bg-primary/20" : "bg-transparent group-hover:bg-muted"
                                    )}>
                                      <Icon className={cn("h-4 w-4", active && "text-primary")} />
                                    </div>
                                    <span className="flex-1 text-left">{item.label}</span>
                                  </div>
                                  {active && <ChevronRight className="h-4 w-4 text-primary animate-in slide-in-from-left-2" />}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator className="opacity-50" />

                  {/* Footer del menú */}
                  <div className="p-4 space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 text-sm font-medium text-destructive hover:bg-destructive/5"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </Button>
                    <div className="text-center text-xs text-muted-foreground pt-2">
                      v1.0.0 • Alito App
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Contenido principal con padding bottom CONSISTENTE */}
      <ScrollArea
        className={cn(
          "flex-1 bg-slate-50/50 dark:bg-slate-950/50",
          // Padding bottom FIJO para todos los módulos
          showBottomNav && "pb-safe"
        )}
      >
        <main
          className={cn(
            "container mx-auto p-3 sm:p-4 animate-fade-in max-w-screen-xl",
            // Margen bottom aumentado para evitar que botones se oculten
            showBottomNav && "mb-24"
          )}
        >
          {children}
        </main>
      </ScrollArea>

      {/* Bottom navigation bar flotante - CONSISTENTE */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
          <div
            className={cn(
              "flex h-14 sm:h-16 items-center justify-around px-1 sm:px-2",
              // Safe area para dispositivos con notch
              "pb-safe"
            )}
          >
            {bottomNavItems.map(({ path, icon: Icon, label }) => {
              const isActive = isRouteActive(path);

              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "group flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-300 touch-callout-none select-none",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative rounded-2xl p-1 sm:p-1.5 transition-all duration-300 group-active:scale-90",
                    isActive && "bg-primary/10 -translate-y-1 shadow-glow-primary"
                  )}>
                    <Icon className={cn(
                      "h-4 sm:h-5 w-4 sm:w-5 transition-all duration-300",
                      isActive ? "stroke-[2.5px]" : "stroke-2"
                    )} />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[0.6rem] sm:text-[0.65rem] font-medium transition-all duration-300",
                    isActive ? "opacity-100 font-semibold translate-y-0" : "opacity-70 translate-y-1"
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
