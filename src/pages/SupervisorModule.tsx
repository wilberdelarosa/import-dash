/**
 * Supervisor Module - Device Detection Routers
 * Routes supervisor pages to mobile or desktop versions based on device
 * Optimizado para evitar glitches de navegación
 */
import { useIsMobileDevice } from '@/hooks/useDeviceDetection';
import { useMemo } from 'react';

// Mobile versions
import { SupervisorDashboard } from './mobile/SupervisorDashboard';
import { SupervisorSubmissions } from './mobile/SupervisorSubmissions';

// Desktop versions
import { SupervisorDesktop } from './SupervisorDesktop';
import { SupervisorSubmissionsDesktop } from './SupervisorSubmissionsDesktop';

/**
 * Router for Supervisor Dashboard
 */
export function SupervisorDashboardRouter() {
  const isMobile = useIsMobileDevice();
  
  // Memoizar para evitar re-renders y glitches
  return useMemo(() => (
    isMobile ? <SupervisorDashboard /> : <SupervisorDesktop />
  ), [isMobile]);
}

/**
 * Router for Supervisor Submissions view
 */
export function SupervisorSubmissionsRouter() {
  const isMobile = useIsMobileDevice();
  
  return useMemo(() => (
    isMobile ? <SupervisorSubmissions /> : <SupervisorSubmissionsDesktop />
  ), [isMobile]);
}

export default {
  SupervisorDashboardRouter,
  SupervisorSubmissionsRouter,
};
