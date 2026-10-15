import { describe, expect, it } from 'vitest';
import {
  getEstado,
  getProximo,
  getRestante,
  displayRestante,
  horasVencidas,
  MAINTENANCE_DEFAULT_ALERTA_PREVENTIVA,
} from './maintenance-status';

describe('maintenance-status', () => {
  describe('getProximo', () => {
    it('usa el valor persistido cuando existe', () => {
      expect(getProximo({ proximoMantenimiento: 500, horasKmUltimoMantenimiento: 100, frecuencia: 250 })).toBe(500);
    });

    it('recalcula ultimo + frecuencia como fallback', () => {
      expect(getProximo({ horasKmUltimoMantenimiento: 100, frecuencia: 250 })).toBe(350);
    });
  });

  describe('getRestante', () => {
    it('usa el campo horasKmRestante de la BD cuando existe', () => {
      expect(getRestante({ horasKmRestante: 42 })).toBe(42);
    });

    it('recalcula proximo - actuales cuando falta el campo de BD', () => {
      expect(
        getRestante({
          horasKmUltimoMantenimiento: 100,
          frecuencia: 250,
          horasKmActuales: 300,
        }),
      ).toBe(50); // proximo = 350, restante = 350 - 300
    });

    it('puede ser negativo cuando está vencido', () => {
      expect(
        getRestante({
          horasKmUltimoMantenimiento: 100,
          frecuencia: 250,
          horasKmActuales: 400,
        }),
      ).toBe(-50);
    });
  });

  describe('displayRestante', () => {
    it('recorta a 0 cuando el restante es negativo', () => {
      expect(displayRestante({ horasKmRestante: -30 })).toBe(0);
    });

    it('conserva el valor cuando es positivo', () => {
      expect(displayRestante({ horasKmRestante: 30 })).toBe(30);
    });
  });

  describe('horasVencidas', () => {
    it('es 0 cuando no está vencido', () => {
      expect(horasVencidas({ horasKmRestante: 30 })).toBe(0);
    });

    it('es el valor absoluto del restante negativo', () => {
      expect(horasVencidas({ horasKmRestante: -30 })).toBe(30);
    });
  });

  describe('getEstado', () => {
    it('usa el umbral por defecto (50) si no hay configuración', () => {
      expect(getEstado({ horasKmRestante: 49 })).toBe('proximo');
      expect(getEstado({ horasKmRestante: 51 })).toBe('ok');
      expect(MAINTENANCE_DEFAULT_ALERTA_PREVENTIVA).toBe(50);
    });

    it('vencido cuando restante <= 0', () => {
      expect(getEstado({ horasKmRestante: 0 })).toBe('vencido');
      expect(getEstado({ horasKmRestante: -10 })).toBe('vencido');
    });

    it('proximo cuando restante está dentro del umbral configurado', () => {
      expect(getEstado({ horasKmRestante: 80 }, { alertaPreventiva: 100 })).toBe('proximo');
    });

    it('ok cuando restante supera el umbral configurado', () => {
      expect(getEstado({ horasKmRestante: 150 }, { alertaPreventiva: 100 })).toBe('ok');
    });
  });
});
