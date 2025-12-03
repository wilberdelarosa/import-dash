// 🎯 Sistema de Responsive Design Avanzado
// Exportaciones centralizadas para fácil uso

// Hooks
export { useResponsive, useDeviceType, useContainerQuery } from '@/hooks/useResponsive.tsx';

// Components
export { ResponsiveContainer } from './ResponsiveContainer';
export { FluidText, H1, H2, H3, Body, Small } from './FluidText';
export { AdaptiveGrid, AdaptiveStack, AdaptiveColumns } from './AdaptiveGrid';

// Types
export type { ResponsiveState } from '@/hooks/useResponsive.tsx';
