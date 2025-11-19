import { useDeviceDetection } from './useDeviceDetection';

export function useResponsive() {
  const { isMobile, isTablet } = useDeviceDetection();
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}
