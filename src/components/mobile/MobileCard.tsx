/**
 * Card optimizado para móvil con diseño compacto
 * 
 * Características:
 * - Padding reducido para móvil
 * - Touch feedback
 * - Swipe actions opcionales
 * - Estados visuales optimizados
 */

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface MobileCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'list-item';
  showArrow?: boolean;
  icon?: ReactNode;
}

export function MobileCard({
  title,
  description,
  children,
  footer,
  onClick,
  className,
  variant = 'default',
  showArrow = false,
  icon,
}: MobileCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const isCompact = variant === 'compact' || variant === 'list-item';
  const isListItem = variant === 'list-item';

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer active:scale-[0.98]",
        isPressed && "shadow-sm",
        isListItem && "border-l-4 border-l-primary",
        className
      )}
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      {(title || description) && (
        <CardHeader className={cn(
          isCompact ? "p-3 pb-2" : "p-4 pb-3"
        )}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {icon && (
                <div className="flex-shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <CardTitle className={cn(
                    "truncate",
                    isCompact ? "text-sm" : "text-base"
                  )}>
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className={cn(
                    "truncate",
                    isCompact ? "text-xs mt-0.5" : "text-sm mt-1"
                  )}>
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {showArrow && (
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(
        isCompact ? "p-3 pt-0" : "p-4 pt-0"
      )}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className={cn(
          "border-t",
          isCompact ? "p-3" : "p-4"
        )}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Card para listas móviles - ultra compacto
 */
interface MobileListCardProps {
  title?: string;
  subtitle?: string;
  meta?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
  children?: ReactNode; // Permitir children para contenido custom
}

export function MobileListCard({
  title,
  subtitle,
  meta,
  icon,
  badge,
  onClick,
  className,
  children,
}: MobileListCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition-all active:scale-[0.98]",
        onClick && "cursor-pointer active:bg-accent",
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      
      {/* Si hay children, usar eso; sino usar estructura por defecto */}
      {children ? (
        children
      ) : (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {title && <p className="truncate text-sm font-semibold">{title}</p>}
            {badge}
          </div>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
          {meta && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground/70">{meta}</p>
          )}
        </div>
      )}
      
      {!children && <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground/50" />}
    </div>
  );
}
