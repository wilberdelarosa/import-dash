import { cn } from "@/lib/utils";

interface BrandLogoProps {
  showTagline?: boolean;
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ showTagline = true, compact = false, className }: BrandLogoProps) {
  const size = compact ? "h-11 w-11" : "h-14 w-14";
  const gap = compact ? "gap-2.5" : "gap-4";

  return (
    <div className={cn("group flex items-center", gap, className)}>
      <div className={cn("relative transition-transform duration-300 group-hover:scale-105", size)}>
        <img
          src="/favicon.ico"
          alt="Logo de ALITO Group"
          className="relative h-full w-full object-contain transition-transform duration-500 group-hover:-translate-y-0.5"
        />
      </div>
      <div className="leading-tight">
        <p
          className={cn(
            "font-semibold uppercase tracking-[0.2em] text-foreground transition-colors group-hover:text-primary",
            compact ? "text-xs" : "text-sm",
          )}
        >
          ALITO GROUP
        </p>
        <p className={cn("font-semibold text-foreground", compact ? "text-base" : "text-2xl")}>SRL</p>
        {showTagline && (
          <p className={cn("text-muted-foreground", compact ? "text-[0.7rem]" : "text-sm")}>
            Mantenimiento inteligente
          </p>
        )}
      </div>
    </div>
  );
}
