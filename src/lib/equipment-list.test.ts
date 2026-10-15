import { describe, expect, it } from 'vitest';
import type { Equipo } from '@/types/equipment';
import { compareEquipment, matchesEquipmentSearch, equipmentFields } from './equipment-list';

const equipo = (id: number, ficha: string, empresa: Equipo['empresa'], nombre = 'Excavadora'): Equipo => ({ id, ficha, empresa, nombre, marca: 'SDLG', modelo: 'E660', numeroSerie: 'ABC123', placa: 'L123', categoria: 'Excavación', segmento: null, activo: true, motivoInactividad: null });
const rows = [equipo(1, 'AC-2', 'ALITO GROUP SRL'), equipo(2, 'AC-10', 'ALITO EIRL'), equipo(3, 'AC-2', 'ALITO EIRL'), equipo(4, 'AC-1', 'VENDIDO')];
describe('equipment field search and sorting', () => {
  it('groups EIRL before GROUP and sold with numeric ficha order', () => {
    expect([...rows].sort((a, b) => compareEquipment(a, b, 'ficha', 'asc')).map(e => e.id)).toEqual([3, 2, 1, 4]);
  });
  it('reverses ficha within each company, not company priority', () => {
    expect([...rows].sort((a, b) => compareEquipment(a, b, 'ficha', 'desc')).map(e => e.id)).toEqual([2, 3, 1, 4]);
  });
  it('sorts names across companies and supports descending', () => {
    const a = equipo(1, 'AC-2', 'ALITO GROUP SRL', 'Camión');
    const b = equipo(2, 'AC-1', 'ALITO EIRL', 'Rodillo');
    expect(compareEquipment(a, b, 'nombre', 'asc')).toBeLessThan(0);
    expect(compareEquipment(a, b, 'nombre', 'desc')).toBeGreaterThan(0);
  });
  it('searches only the selected field, ignoring accents', () => {
    expect(matchesEquipmentSearch(rows[0], 'categoria', 'excavacion')).toBe(true);
    expect(matchesEquipmentSearch(rows[0], 'ficha', 'SDLG')).toBe(false);
    expect(matchesEquipmentSearch(rows[0], 'all', 'SDLG')).toBe(true);
    expect(matchesEquipmentSearch(rows[0], 'segmento', 'algo')).toBe(false);
  });
  it('supports all displayed fields including state and null values', () => {
    for (const { key } of equipmentFields) expect(Number.isFinite(compareEquipment(rows[0], rows[1], key, 'asc'))).toBe(true);
    expect(matchesEquipmentSearch(rows[3], 'activo', 'vendido')).toBe(true);
    expect(matchesEquipmentSearch(rows[0], 'activo', 'activo')).toBe(true);
  });
});