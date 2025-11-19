/**
 * Hook avanzado para detectar tipo de dispositivo y orientación
 * 
 * Detecta automáticamente:
 * - Tipo: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
 * - Orientación: portrait, landscape
 * - Touch capability
 * - Dimensiones en tiempo real
 * 
 * @example
 * const { isMobile, isTablet, isDesktop, orientation, dimensions } = useDeviceDetection();
 */

import { useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  breakpoints: {
    xs: boolean;  // < 375px
    sm: boolean;  // 375px - 640px
    md: boolean;  // 640px - 768px
    lg: boolean;  // 768px - 1024px
    xl: boolean;  // 1024px - 1280px
    '2xl': boolean; // > 1280px
  };
}

// Breakpoints personalizados para la app
const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

const getOrientation = (width: number, height: number): Orientation => {
  return width > height ? 'landscape' : 'portrait';
};

const isTouchDevice = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - old browsers
    navigator.msMaxTouchPoints > 0
  );
};

const getBreakpoints = (width: number) => ({
  xs: width < BREAKPOINTS.xs,
  sm: width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm,
  md: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
  lg: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
  xl: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
  '2xl': width >= BREAKPOINTS.xl,
});

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    const type = getDeviceType(width);
    const orientation = getOrientation(width, height);

    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      orientation,
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
      isTouchDevice: typeof window !== 'undefined' ? isTouchDevice() : false,
      dimensions: { width, height },
      breakpoints: getBreakpoints(width),
    };
  });

  const updateDeviceInfo = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const type = getDeviceType(width);
    const orientation = getOrientation(width, height);

    setDeviceInfo({
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      orientation,
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
      isTouchDevice: isTouchDevice(),
      dimensions: { width, height },
      breakpoints: getBreakpoints(width),
    });
  }, []);

  useEffect(() => {
    // Actualizar en resize con debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDeviceInfo, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Actualización inicial
    updateDeviceInfo();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
}

/**
 * Hook simplificado para solo detectar mobile
 */
export function useIsMobileDevice(): boolean {
  const { isMobile } = useDeviceDetection();
  return isMobile;
}

/**
 * Hook para detectar orientación específica
 */
export function useOrientation(): Orientation {
  const { orientation } = useDeviceDetection();
  return orientation;
}
