/**
 * Constantes globales de la aplicación
 * Centraliza valores numéricos y configuraciones para mejor mantenibilidad
 */

// PAGINACIÓN
export const ITEMS_PER_PAGE = 50;
export const ITEMS_PER_PAGE_SMALL = 20;
export const INITIAL_PAGE = 1;

// MANTENIMIENTOS
export const UMBRAL_MANTENIMIENTO_PROXIMO_HRS = 100;
export const UMBRAL_MANTENIMIENTO_CRITICO_HRS = 10;
export const LIMITE_MANTENIMIENTOS_RECIENTES = 5;
export const LIMITE_MANTENIMIENTOS_DASHBOARD = 10;

// INVENTARIO
export const LIMITE_ITEMS_INVENTARIO_MOSTRAR = 5;
export const LIMITE_MARCAS_COMPATIBLES_MOSTRAR = 2;
export const LIMITE_MODELOS_COMPATIBLES_MOSTRAR = 3;

// HISTORIAL
export const LIMITE_EVENTOS_HISTORIAL = 100;
export const DIAS_HISTORIAL_RECIENTE = 30;

// NOTIFICACIONES
export const INTERVALO_CHEQUEO_NOTIFICACIONES_MS = 60000; // 1 minuto
export const MAX_NOTIFICACIONES_MOSTRAR = 50;

// REPORTES
export const LIMITE_REPORTES_DESCARGABLES = 1000;

// BÚSQUEDA
export const MIN_CARACTERES_BUSQUEDA = 2;
export const RESULTADOS_BUSQUEDA_COMMAND_PALETTE = 5;

// TIMEOUTS
export const DEBOUNCE_SEARCH_MS = 300;
export const TOAST_DURATION_MS = 3000;
export const OPTIMISTIC_UPDATE_TIMEOUT_MS = 5000;

// FORMATO
export const FORMATO_FECHA = 'DD/MM/YYYY';
export const FORMATO_FECHA_HORA = 'DD/MM/YYYY HH:mm';
export const DECIMALES_HORAS = 1;

// VALIDACIONES
export const MIN_LONGITUD_NOMBRE = 3;
export const MAX_LONGITUD_NOMBRE = 100;
export const MIN_LONGITUD_DESCRIPCION = 10;
export const MAX_LONGITUD_DESCRIPCION = 500;
export const REGEX_FICHA_EQUIPO = /^[A-Z]{2}-\d{3}$/;
export const REGEX_NUMERO_PARTE = /^[A-Z0-9-]+$/;

// VALORES POR DEFECTO
export const STOCK_MINIMO_DEFAULT = 5;
export const FRECUENCIA_MANTENIMIENTO_DEFAULT_HRS = 250;
export const HORAS_ACTUALES_DEFAULT = 0;

// COLORES (para gráficos y visualización)
export const COLOR_CHART_PRIMARY = 'hsl(var(--primary))';
export const COLOR_CHART_SUCCESS = 'hsl(142.1 76.2% 36.3%)';
export const COLOR_CHART_WARNING = 'hsl(38 92% 50%)';
export const COLOR_CHART_DANGER = 'hsl(var(--destructive))';
