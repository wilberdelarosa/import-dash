/**
 * useFluidHeight - Hook para alturas fluidas que se adaptan al viewport móvil
 * Basado en Sistema Responsive v2.0
 */
import { useState, useEffect, useCallback } from 'react';

interface FluidHeightConfig {
    minHeight: number;        // Altura mínima en px
    maxHeight: number;        // Altura máxima en px
    preferredVh: number;      // Porcentaje del viewport preferido
    reservedHeight?: number;  // Altura reservada para otros elementos
}

interface FluidHeightResult {
    height: number;
    cssValue: string;
    isCompact: boolean;
}

// Presets para uso común
export const FLUID_HEIGHT_PRESETS = {
    compact: { minHeight: 120, maxHeight: 200, preferredVh: 20, reservedHeight: 500 },
    default: { minHeight: 150, maxHeight: 250, preferredVh: 25, reservedHeight: 450 },
    expanded: { minHeight: 200, maxHeight: 400, preferredVh: 35, reservedHeight: 300 },
} as const;

export function useFluidHeight(config: FluidHeightConfig): FluidHeightResult {
    const { minHeight, maxHeight, preferredVh, reservedHeight = 0 } = config;

    const calculateHeight = useCallback(() => {
        // Usar visualViewport para altura real visible (mejor soporte móvil)
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const availableHeight = viewportHeight - reservedHeight;

        // Calcular altura preferida
        const preferredHeight = (availableHeight * preferredVh) / 100;

        // Aplicar clamp
        const clampedHeight = Math.max(minHeight, Math.min(preferredHeight, maxHeight));

        return Math.round(clampedHeight);
    }, [minHeight, maxHeight, preferredVh, reservedHeight]);

    const [height, setHeight] = useState(() => calculateHeight());

    useEffect(() => {
        const updateHeight = () => setHeight(calculateHeight());

        // Escuchar cambios en visualViewport (mejor para móvil)
        const viewport = window.visualViewport;
        if (viewport) {
            viewport.addEventListener('resize', updateHeight);
            viewport.addEventListener('scroll', updateHeight);
        }

        window.addEventListener('resize', updateHeight);
        window.addEventListener('orientationchange', updateHeight);

        return () => {
            viewport?.removeEventListener('resize', updateHeight);
            viewport?.removeEventListener('scroll', updateHeight);
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('orientationchange', updateHeight);
        };
    }, [calculateHeight]);

    return {
        height,
        cssValue: `${height}px`,
        isCompact: height <= minHeight * 1.2,
    };
}
