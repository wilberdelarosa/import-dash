export const formatRemainingLabel = (value: number | null | undefined, unidad: string = 'horas') => {
  if (value === null || value === undefined) {
    return 'Sin dato';
  }

  if (value <= 0) {
    const magnitud = Math.abs(value).toFixed(1);
    const suffix = magnitud !== '0.0' ? ` (${magnitud} ${unidad})` : '';
    return `Vencido${suffix}`;
  }

  return `${value.toFixed(1)} ${unidad} restantes`;
};

export const getRemainingVariant = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'secondary';
  if (value <= 0) return 'destructive';
  if (value <= 50) return 'secondary';
  return 'default';
};
