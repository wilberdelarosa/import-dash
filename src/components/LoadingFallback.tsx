/**
 * LoadingFallback - Premium loading screen with brand identity
 * Used for lazy-loaded routes and initial app load
 */
export function LoadingFallback() {
    return (
        <div className="fixed inset-0 z-50 flex h-[100dvh] w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-8">
                {/* Logo with animated glow */}
                <div className="relative">
                    <div className="h-20 w-20 flex items-center justify-center">
                        <img src="/favicon.ico" alt="ALITO" className="h-20 w-20 object-contain" />
                    </div>
                    {/* Outer ring spinner */}
                    <div
                        className="absolute -inset-3 rounded-3xl border-2 border-transparent border-t-primary/60 border-r-primary/30 animate-spin"
                        style={{ animationDuration: '1.2s' }}
                    />
                    {/* Inner ring (counter-rotate) */}
                    <div
                        className="absolute -inset-1.5 rounded-2xl border border-transparent border-b-primary/40 animate-spin"
                        style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
                    />
                </div>

                {/* Brand text */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">ALITO</h1>
                    <p className="text-sm text-muted-foreground">Sistema de Mantenimiento</p>
                </div>

                {/* Loading indicator */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">Cargando módulo...</span>
                </div>

                {/* Skeleton preview of UI */}
                <div className="w-72 space-y-4 opacity-30 mt-4">
                    {/* Header skeleton */}
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted shimmer" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-muted rounded shimmer w-24" />
                            <div className="h-2 bg-muted rounded shimmer w-16" />
                        </div>
                    </div>
                    {/* Cards skeleton */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="h-12 rounded-lg bg-muted shimmer" />
                        <div className="h-12 rounded-lg bg-muted shimmer" style={{ animationDelay: '0.1s' }} />
                        <div className="h-12 rounded-lg bg-muted shimmer" style={{ animationDelay: '0.2s' }} />
                    </div>
                    {/* List skeleton */}
                    <div className="space-y-2">
                        <div className="h-10 rounded-lg bg-muted shimmer" />
                        <div className="h-10 rounded-lg bg-muted shimmer" style={{ animationDelay: '0.15s' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
