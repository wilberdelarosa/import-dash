/**
 * useContainerSize - Hook para detectar el tamaño del contenedor
 * Útil para lógica condicional basada en el espacio disponible
 */
import { useState, useEffect, useRef, RefObject } from 'react';

interface ContainerSize {
    width: number;
    height: number;
    isNarrow: boolean;   // < 320px
    isCompact: boolean;  // < 375px
    isMedium: boolean;   // 375-414px
    isWide: boolean;     // > 414px
}

export function useContainerSize<T extends HTMLElement>(): [RefObject<T>, ContainerSize] {
    const ref = useRef<T>(null);
    const [size, setSize] = useState<ContainerSize>({
        width: 0,
        height: 0,
        isNarrow: false,
        isCompact: true,
        isMedium: false,
        isWide: false,
    });

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;

            const { width, height } = entry.contentRect;

            setSize({
                width,
                height,
                isNarrow: width < 320,
                isCompact: width < 375,
                isMedium: width >= 375 && width < 414,
                isWide: width >= 414,
            });
        });

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, []);

    return [ref, size];
}
