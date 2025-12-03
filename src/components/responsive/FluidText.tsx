import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface FluidTextProps {
    /** Typography size variant using fluid CSS variables */
    variant?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    children: ReactNode;
    className?: string;
    as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

/**
 * FluidText - Componente de texto con tamaño fluido
 * 
 * Usa CSS clamp() para escalar automáticamente entre breakpoints
 * sin necesidad de media queries.
 * 
 * @example
 * ```tsx
 * <FluidText variant="2xl" as="h1">
 *   Título que escala automáticamente
 * </FluidText>
 * ```
 */
export function FluidText({
    variant = 'base',
    children,
    className,
    as: Component = 'span',
}: FluidTextProps) {
    return (
        <Component
            className={cn(className)}
            style={{
                fontSize: `var(--text-${variant})`,
            } as CSSProperties}
        >
            {children}
        </Component>
    );
}

/**
 * Variantes pre-construidas para uso común
 */
export const H1 = ({ children, className }: { children: ReactNode; className?: string }) => (
    <FluidText variant="3xl" as="h1" className={cn('font-bold', className)}>
        {children}
    </FluidText>
);

export const H2 = ({ children, className }: { children: ReactNode; className?: string }) => (
    <FluidText variant="2xl" as="h2" className={cn('font-semibold', className)}>
        {children}
    </FluidText>
);

export const H3 = ({ children, className }: { children: ReactNode; className?: string }) => (
    <FluidText variant="xl" as="h3" className={cn('font-semibold', className)}>
        {children}
    </FluidText>
);

export const Body = ({ children, className }: { children: ReactNode; className?: string }) => (
    <FluidText variant="base" as="p" className={className}>
        {children}
    </FluidText>
);

export const Small = ({ children, className }: { children: ReactNode; className?: string }) => (
    <FluidText variant="sm" as="span" className={className}>
        {children}
    </FluidText>
);
