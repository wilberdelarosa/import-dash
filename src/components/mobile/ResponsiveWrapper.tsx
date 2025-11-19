/**
 * Wrapper adaptativo que detecta dispositivo y renderiza versión adecuada
 * 
 * Uso:
 * <ResponsiveWrapper
 *   mobile={<MobileVersion />}
 *   desktop={<DesktopVersion />}
 * />
 */

import { ReactNode } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface ResponsiveWrapperProps {
  mobile: ReactNode;
  desktop: ReactNode;
  tablet?: ReactNode; // Opcional: versión específica para tablet
  breakpoint?: 'mobile' | 'tablet'; // En qué punto cambiar (default: mobile)
}

export function ResponsiveWrapper({
  mobile,
  desktop,
  tablet,
  breakpoint = 'mobile',
}: ResponsiveWrapperProps) {
  const { isMobile, isTablet } = useDeviceDetection();

  // Si hay versión tablet específica
  if (tablet && isTablet) {
    return <>{tablet}</>;
  }

  // Cambiar según breakpoint
  if (breakpoint === 'mobile') {
    return isMobile ? <>{mobile}</> : <>{desktop}</>;
  }

  // breakpoint === 'tablet': mostrar mobile hasta tablet inclusive
  return (isMobile || isTablet) ? <>{mobile}</> : <>{desktop}</>;
}
