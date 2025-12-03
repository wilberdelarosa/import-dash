import { useState, useEffect, useCallback } from 'react';

export interface ResponsiveState {
    // Device detection
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isUltrawide: boolean;

    // Dimensions
    width: number;
    height: number;

    // Orientation
    orientation: 'portrait' | 'landscape';

    // Capabilities
    isTouch: boolean;
    prefersReducedMotion: boolean;

    // Breakpoint helpers
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    isAtLeast: (bp: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') => boolean;
    isAtMost: (bp: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') => boolean;
}

const BREAKPOINTS = {
    xs: 375,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

function getBreakpoint(width: number): ResponsiveState['breakpoint'] {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
}

export function useResponsive(): ResponsiveState {
    const [state, setState] = useState<ResponsiveState>(() => {
        // Initial state (SSR-safe)
        if (typeof window === 'undefined') {
            return {
                isMobile: false,
                isTablet: false,
                isDesktop: true,
                isUltrawide: false,
                width: 1024,
                height: 768,
                orientation: 'landscape',
                isTouch: false,
                prefersReducedMotion: false,
                breakpoint: 'lg',
                isAtLeast: () => false,
                isAtMost: () => false,
            };
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const breakpoint = getBreakpoint(width);

        return {
            isMobile: width < BREAKPOINTS.md,
            isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
            isDesktop: width >= BREAKPOINTS.lg && width < 2560,
            isUltrawide: width >= 2560,
            width,
            height,
            orientation: width > height ? 'landscape' : 'portrait',
            isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            breakpoint,
            isAtLeast: (bp) => width >= BREAKPOINTS[bp],
            isAtMost: (bp) => width <= BREAKPOINTS[bp],
        };
    });

    const updateState = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const breakpoint = getBreakpoint(width);

        setState({
            isMobile: width < BREAKPOINTS.md,
            isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
            isDesktop: width >= BREAKPOINTS.lg && width < 2560,
            isUltrawide: width >= 2560,
            width,
            height,
            orientation: width > height ? 'landscape' : 'portrait',
            isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            breakpoint,
            isAtLeast: (bp) => width >= BREAKPOINTS[bp],
            isAtMost: (bp) => width <= BREAKPOINTS[bp],
        });
    }, []);

    useEffect(() => {
        // Update on mount
        updateState();

        // Debounced resize handler
        let timeoutId: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(updateState, 150);
        };

        // Media query listener for reduced motion
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleMotionChange = () => updateState();

        window.addEventListener('resize', handleResize);
        motionQuery.addEventListener('change', handleMotionChange);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
            motionQuery.removeEventListener('change', handleMotionChange);
        };
    }, [updateState]);

    return state;
}

// Hook alternativo más ligero solo para detección mobile/desktop
export function useDeviceType() {
    const { isMobile, isTablet, isDesktop } = useResponsive();
    return { isMobile, isTablet, isDesktop };
}

// Hook para container queries en JavaScript (cuando CSS no es suficiente)
export function useContainerQuery(ref: React.RefObject<HTMLElement>) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setWidth(entry.contentRect.width);
            }
        });

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [ref]);

    return {
        width,
        isSmall: width < 400,
        isMedium: width >= 400 && width < 600,
        isLarge: width >= 600,
    };
}
