/**
 * Formateadores centralizados para componentes móviles
 * Basados en el patrón de SupervisorDashboard.tsx
 * 
 * Características:
 * - Formateo consistente de números con locale español
 * - Redondeo inteligente (enteros para >= 100, 1 decimal para < 100)
 * - Manejo de valores inválidos
 */

/**
 * Formatea un número con locale español y redondeo inteligente
 */
export const formatNumber = (value: unknown, suffix: string = ''): string => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return `0${suffix}`;

    const abs = Math.abs(numberValue);
    const rounded = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;

    const text = rounded.toLocaleString('es-ES', {
        minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
        maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    });

    return `${text}${suffix}`;
};

/**
 * Formatea valor como horas
 */
export const formatHours = (value: unknown): string => formatNumber(value, 'h');

/**
 * Formatea valor como kilómetros
 */
export const formatKm = (value: unknown): string => formatNumber(value, 'km');

/**
 * Formatea valor restante (horas/km)
 */
export const formatRemaining = (value: unknown, unit: 'h' | 'km' = 'h'): string => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return `0${unit}`;

    const abs = Math.abs(numberValue);
    const rounded = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;

    const text = rounded.toLocaleString('es-ES', {
        minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
        maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    });

    return `${text}${unit}`;
};

/**
 * Formatea stock (sin sufijo)
 */
export const formatStock = (value: unknown): string => formatNumber(value);

/**
 * Formatea lectura actual con unidad inteligente
 */
export const formatReading = (value: unknown, tipo?: string): string => {
    const unit = tipo === 'Kilometraje' ? 'km' : 'h';
    return formatNumber(value, unit);
};

/**
 * Clases CSS estándar para badges numéricos
 */
export const BADGE_NUMERIC_CLASSES = "h-5 px-2 py-0.5 text-[10px] leading-none font-medium max-w-[110px] truncate tabular-nums";

/**
 * Clases CSS para variante de badge por estado
 */
export const getBadgeVariantClasses = (restante: number) => {
    if (restante < 0) {
        return "bg-destructive/10 text-destructive border-destructive/20";
    }
    if (restante <= 50) {
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
    return "bg-green-500/10 text-green-600 border-green-500/20";
};
