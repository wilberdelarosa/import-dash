import { Loader2 } from "lucide-react";

export function LoadingFallback() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium text-muted-foreground animate-pulse">
                    Cargando aplicación...
                </p>
            </div>
        </div>
    );
}
