/**
 * Mechanic Module Router
 * Detecta dispositivo y muestra versión mobile o desktop
 * Optimizado para evitar glitches de navegación
 */
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useMemo } from 'react';

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
  // Memoizar para evitar re-renders innecesarios
  return useMemo(() => (
    isMobile ? <MechanicDashboard /> : <MechanicDesktop />
  ), [isMobile]);
}

// Pending List - detects device
export function MechanicPendingListRouter() {
  const { isMobile } = useDeviceDetection();
  return useMemo(() => (
    isMobile ? <MechanicPendingList /> : <MechanicPendingListDesktop />
  ), [isMobile]);
}

// Submission Form - detects device
export function MechanicSubmissionFormRouter() {
  const { isMobile } = useDeviceDetection();
  return useMemo(() => (
    isMobile ? <MechanicSubmissionForm /> : <MechanicSubmissionFormDesktop />
  ), [isMobile]);
}

// History - detects device
export function MechanicHistoryRouter() {
  const { isMobile } = useDeviceDetection();
  return useMemo(() => (
    isMobile ? <MechanicHistory /> : <MechanicHistoryDesktop />
  ), [isMobile]);
}
