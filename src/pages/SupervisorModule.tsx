/**
 * Supervisor Module - Device Detection Routers
 * Routes supervisor pages to mobile or desktop versions based on device
 */
import { useIsMobileDevice } from '@/hooks/useDeviceDetection';

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
  
  if (isMobile) {
    return <SupervisorDashboard />;
  }
  
  return <SupervisorDesktop />;
}

/**
 * Router for Supervisor Submissions view
 */
export function SupervisorSubmissionsRouter() {
  const isMobile = useIsMobileDevice();
  
  if (isMobile) {
    return <SupervisorSubmissions />;
  }
  
  return <SupervisorSubmissionsDesktop />;
}

export default {
  SupervisorDashboardRouter,
  SupervisorSubmissionsRouter,
};
