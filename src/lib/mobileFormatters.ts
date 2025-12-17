/**
 * Formateadores centralizados para componentes móviles
 * Basados en el patrón de SupervisorDashboard.tsx
 * 
 * Características:
 * - Formateo consistente de números con locale español
 * - Redondeo a 2 decimales efectivos
 * - Manejo de valores inválidos
 */

/**
 * Formatea un número con locale español y 2 decimales máximo
 * Para valores >= 100, redondea a entero
 * Para valores >= 10, usa 1 decimal
 * Para valores < 10, usa 2 decimales
 */
export const formatNumber = (value: unknown, suffix: string = ''): string => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return `0${suffix}`;

    const abs = Math.abs(numberValue);
    let rounded: number;
    let decimals: number;

    if (abs >= 100) {
        rounded = Math.round(abs * 100) / 100; // Round to 2 decimals
        decimals = rounded % 1 === 0 ? 0 : 2;
    } else if (abs >= 10) {
        rounded = Math.round(abs * 100) / 100;
        decimals = rounded % 1 === 0 ? 0 : 2;
    } else {
        rounded = Math.round(abs * 100) / 100;
        decimals = rounded % 1 === 0 ? 0 : 2;
    }

    const text = rounded.toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });

    return `${text}${suffix}`;
};

/**
 * Limpia decimales excesivos en un texto (para mensajes de notificación)
 * Encuentra números con más de 2 decimales y los redondea
 */
export const cleanDecimalsInText = (text: string): string => {
    // Match numbers with excessive decimals (more than 2)
    return text.replace(/(\d+\.\d{3,})/g, (match) => {
        const num = parseFloat(match);
        if (Number.isFinite(num)) {
            return (Math.round(num * 100) / 100).toString();
        }
        return match;
    });
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

    const rounded = Math.round(Math.abs(numberValue) * 100) / 100;
    const decimals = rounded % 1 === 0 ? 0 : 2;

    const text = rounded.toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
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
