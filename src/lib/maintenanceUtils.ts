import type { MantenimientoProgramado } from '@/types/equipment';

export const formatRemainingLabel = (value: number | null | undefined, unidad: string = 'horas') => {
  if (value === null || value === undefined) {
    return 'Sin dato';
  }

  if (value <= 0) {
    const magnitud = Math.abs(Math.round(value));
    const suffix = magnitud > 0 ? ` (${magnitud} ${unidad})` : '';
    return `Vencido${suffix}`;
  }

  return `${Math.round(value)} ${unidad} restantes`;
};

export const getRemainingVariant = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'secondary';
  if (value <= 0) return 'destructive';
  if (value <= 50) return 'secondary';
  return 'default';
};

export const resolveIntervaloCodigo = (mantenimiento: MantenimientoProgramado | undefined | null) => {
  if (!mantenimiento) return null;

  const match = mantenimiento.tipoMantenimiento?.match(/(PM\d)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  const frecuencia = mantenimiento.frecuencia ?? 0;
  if (frecuencia <= 0) return null;
  if (frecuencia <= 250) return 'PM1';
  if (frecuencia <= 500) return 'PM2';
  if (frecuencia <= 1000) return 'PM3';
  if (frecuencia <= 2000) return 'PM4';

  return null;
};
