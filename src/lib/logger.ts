/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sistema de logging estructurado para la aplicación
 * Proporciona una interfaz consistente para registrar eventos, errores y métricas
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Mantener últimos 1000 logs en memoria

  /**
   * Log de nivel DEBUG - solo en desarrollo
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log de nivel INFO - información general
   */
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log de nivel WARN - advertencias
   */
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log de nivel ERROR - errores críticos
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, { ...context, error });
    
    // En producción, enviar a servicio de monitoreo (ej: Sentry)
    if (!this.isDevelopment && window.Sentry) {
      window.Sentry.captureException(error || new Error(message), {
        contexts: { custom: context },
      });
    }
  }

  /**
   * Registrar métrica de performance
   */
  metric(name: string, value: number, unit: string = 'ms', context?: LogContext) {
    this.log(LogLevel.INFO, `Metric: ${name}`, {
      ...context,
      metric: { name, value, unit },
    });
  }

  /**
   * Medir tiempo de ejecución de una función
   */
  async measureTime<T>(
    name: string,
    fn: () => Promise<T> | T,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.metric(name, duration, 'ms', context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${name} failed after ${duration.toFixed(2)}ms`, error as Error, context);
      throw error;
    }
  }

  /**
   * Registrar evento de usuario
   */
  trackEvent(eventName: string, properties?: Record<string, any>) {
    this.info(`Event: ${eventName}`, {
      event: eventName,
      properties,
    });

    // En producción, enviar a analytics
    if (!this.isDevelopment && window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }

  /**
   * Obtener logs almacenados
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Limpiar logs almacenados
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Exportar logs como JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private log(level: LogLevel, message: string, context?: LogContext & { error?: Error }) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: context?.error,
    };

    // Agregar a logs en memoria
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remover el más antiguo
    }

    // Console output con formato
    const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                         level === LogLevel.WARN ? 'warn' : 'log';
    
    if (this.isDevelopment) {
      const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}${contextStr}`);
      if (context?.error) {
        console.error(context.error);
      }
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Extender Window para tipos de Sentry y Analytics
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
    gtag?: (command: string, eventName: string, properties?: Record<string, any>) => void;
  }
}

/**
 * Wrapper para funciones async con logging automático
 */
export function withLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
  context?: LogContext
): T {
  return (async (...args: Parameters<T>) => {
    logger.debug(`Executing ${name}`, context);
    try {
      const result = await logger.measureTime(name, () => fn(...args), context);
      logger.debug(`Completed ${name}`, context);
      return result;
    } catch (error) {
      logger.error(`Failed ${name}`, error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Wrapper para componentes - usar en ErrorBoundary
 * 
 * @example
 * ```tsx
 * class ErrorBoundary extends React.Component {
 *   componentDidCatch(error, errorInfo) {
 *     logger.error('Component error', error, { component: this.props.name });
 *   }
 * }
 * ```
 */
