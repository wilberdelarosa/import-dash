import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute - Premium loading skeleton with brand identity
 * Prevents FOUC and provides smooth transition to content
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
          {/* Logo ALITO */}
          <div className="relative">
            <div className="h-16 w-16 flex items-center justify-center">
              <img src="/favicon.ico" alt="ALITO" className="h-16 w-16 object-contain" />
            </div>
            {/* Spinner ring */}
            <div className="absolute -inset-2 rounded-3xl border-2 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '1s' }} />
          </div>

          {/* Brand name */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground">ALITO</h2>
            <p className="text-sm text-muted-foreground animate-pulse">Verificando sesión...</p>
          </div>

          {/* Skeleton preview */}
          <div className="w-64 space-y-3 opacity-40">
            <div className="h-2 bg-muted rounded-full shimmer" />
            <div className="h-2 bg-muted rounded-full w-4/5 shimmer" style={{ animationDelay: '0.1s' }} />
            <div className="h-2 bg-muted rounded-full w-3/5 shimmer" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Render inmediato sin animación para evitar glitch de navegación
  return <>{children}</>;
}
