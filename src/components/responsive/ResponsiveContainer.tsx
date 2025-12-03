import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
    children: ReactNode;
    className?: string;
    /** Custom container breakpoints in pixels */
    breakpoints?: {
        sm?: number;
        md?: number;
        lg?: number;
    };
    /** Container name for nested queries */
    name?: string;
}

/**
 * ResponsiveContainer - Wrapper que habilita Container Queries
 * 
 * Los elementos hijos pueden usar clases @container para responder
 * al tamaño de este contenedor en vez del viewport.
 * 
 * @example
 * ```tsx
 * <ResponsiveContainer>
 *   <div className="grid @md:grid-cols-2 @lg:grid-cols-3">
 *     // Estas columns cambian basado en el container, no el viewport
 *   </div>
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
    children,
    className,
    breakpoints = { sm: 640, md: 768, lg: 1024 },
    name = 'content',
}: ResponsiveContainerProps) {
    return (
        <div
            className={cn('@container', className)}
            style={{
                containerType: 'inline-size',
                containerName: name,
                '--breakpoint-sm': `${breakpoints.sm}px`,
                '--breakpoint-md': `${breakpoints.md}px`,
                '--breakpoint-lg': `${breakpoints.lg}px`,
            } as CSSProperties}
        >
            {children}
        </div>
    );
}
