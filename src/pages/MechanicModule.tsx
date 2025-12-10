/**
 * Mechanic Module Router
 * Detecta dispositivo y muestra versión mobile o desktop
 */
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Mobile versions
import { MechanicDashboard } from '@/pages/mobile/MechanicDashboard';
import { MechanicPendingList } from '@/pages/mobile/MechanicPendingList';
import { MechanicSubmissionForm } from '@/pages/mobile/MechanicSubmissionForm';
import { MechanicHistory } from '@/pages/mobile/MechanicHistory';

// Desktop versions
import { MechanicDesktop } from '@/pages/MechanicDesktop';
import { MechanicPendingListDesktop } from '@/pages/MechanicPendingListDesktop';
import { MechanicSubmissionFormDesktop } from '@/pages/MechanicSubmissionFormDesktop';
import { MechanicHistoryDesktop } from '@/pages/MechanicHistoryDesktop';

// Dashboard - detects device
export function MechanicDashboardRouter() {
  const { isMobile } = useDeviceDetection();
  return isMobile ? <MechanicDashboard /> : <MechanicDesktop />;
}

// Pending List - detects device
export function MechanicPendingListRouter() {
  const { isMobile } = useDeviceDetection();
  return isMobile ? <MechanicPendingList /> : <MechanicPendingListDesktop />;
}

// Submission Form - detects device
export function MechanicSubmissionFormRouter() {
  const { isMobile } = useDeviceDetection();
  return isMobile ? <MechanicSubmissionForm /> : <MechanicSubmissionFormDesktop />;
}

// History - detects device
export function MechanicHistoryRouter() {
  const { isMobile } = useDeviceDetection();
  return isMobile ? <MechanicHistory /> : <MechanicHistoryDesktop />;
}
