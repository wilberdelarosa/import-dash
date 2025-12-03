import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface AdaptiveGridProps {
    children: ReactNode;
    /**
     * Minimum width of each column before wrapping
     * Supports any CSS unit (px, rem, %, etc.)
     * @default "250px"
     */
    minWidth?: string;
    /**
     * Maximum width of each column
     * Set to 'none' for no maximum
     * @default "1fr"
     */
    maxWidth?: string;
    /**
     * Gap between grid items
     * Can use fluid spacing variables like var(--space-md)
     * @default "1rem"
     */
    gap?: string;
    /**
     * Row gap (if different from column gap)
     */
    rowGap?: string;
    /**
     * Column gap (if different from row gap)
     */
    columnGap?: string;
    className?: string;
}

/**
 * AdaptiveGrid - Grid que se adapta automáticamente sin media queries
 * 
 * Usa CSS Grid con repeat(auto-fit, minmax()) para crear layouts
 * que responden al espacio disponible sin breakpoints hardcoded.
 * 
 * @example
 * ```tsx
 * // Grid que crea columnas de mínimo 300px
 * <AdaptiveGrid minWidth="300px" gap="var(--space-lg)">
 *   <Card />
 *   <Card />
 *   <Card />
 * </AdaptiveGrid>
 * 
 * // Grid con spacing fluido
 * <AdaptiveGrid 
 *   minWidth="250px" 
 *   gap="clamp(1rem, 2vw, 2rem)"
 * >
 *   <Item />
 * </AdaptiveGrid>
 * ```
 */
export function AdaptiveGrid({
    children,
    minWidth = '250px',
    maxWidth = '1fr',
    gap,
    rowGap,
    columnGap,
    className,
}: AdaptiveGridProps) {
    return (
        <div
            className={cn(className)}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(min(${minWidth}, 100%), ${maxWidth}))`,
                gap: gap,
                rowGap: rowGap,
                columnGap: columnGap,
            } as CSSProperties}
        >
            {children}
        </div>
    );
}

/**
 * AdaptiveStack - Variante que hace stack vertical en móvil
 * y grid horizontal en desktop
 */
interface AdaptiveStackProps extends AdaptiveGridProps {
    /**
     * Número de columnas en desktop
     * @default 2
     */
    columns?: number;
}

export function AdaptiveStack({
    children,
    columns = 2,
    gap = 'var(--space-md)',
    className,
}: AdaptiveStackProps) {
    return (
        <div
            className={cn(className)}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(min(300px, 100%), 1fr))`,
                gap,
            } as CSSProperties}
        >
            {children}
        </div>
    );
}

/**
 * AdaptiveColumns - Grid con número fijo de columnas que colapsa en móvil
 */
interface AdaptiveColumnsProps {
    children: ReactNode;
    /**
     * Número de columnas en desktop
     */
    columns: 2 | 3 | 4 | 5 | 6;
    /**
     * Breakpoint en px donde comienza el layout multi-columna
     * @default 768
     */
    breakpoint?: number;
    gap?: string;
    className?: string;
}

export function AdaptiveColumns({
    children,
    columns,
    breakpoint = 768,
    gap = 'var(--space-md)',
    className,
}: AdaptiveColumnsProps) {
    // Calcula el minWidth basado en el número de columnas y breakpoint
    const minWidth = `${breakpoint / columns}px`;

    return (
        <div
            className={cn(className)}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(min(${minWidth}, 100%), 1fr))`,
                gap,
            } as CSSProperties}
        >
            {children}
        </div>
    );
}
