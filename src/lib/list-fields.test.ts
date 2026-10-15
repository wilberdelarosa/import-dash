import { describe, expect, it } from 'vitest';
import { compareByField, matchesFieldSearch, type FieldConfig } from './list-fields';

type Row = { ficha: string; empresa: string; nombre: string };
const fields: FieldConfig<Row, 'ficha' | 'nombre'>[] = [
  { key: 'ficha', label: 'Ficha', get: r => r.ficha },
  { key: 'nombre', label: 'Nombre', get: r => r.nombre },
];
const row = (ficha: string, empresa: string, nombre = 'Equipo'): Row => ({ ficha, empresa, nombre });

describe('generic field list helpers', () => {
  it('groups by empresa rank before comparing ficha when getEmpresa is provided', () => {
    const rows = [row('AC-2', 'ALITO GROUP SRL'), row('AC-10', 'ALITO EIRL'), row('AC-1', 'OTRA')];
    const sorted = [...rows].sort((a, b) => compareByField(a, b, fields, 'ficha', 'asc', { getEmpresa: r => r.empresa, getFicha: r => r.ficha }));
    expect(sorted.map(r => r.ficha)).toEqual(['AC-10', 'AC-2', 'AC-1']);
  });

  it('keeps company priority fixed when direction is reversed', () => {
    const rows = [row('AC-2', 'ALITO GROUP SRL'), row('AC-10', 'ALITO EIRL')];
    const sorted = [...rows].sort((a, b) => compareByField(a, b, fields, 'ficha', 'desc', { getEmpresa: r => r.empresa, getFicha: r => r.ficha }));
    expect(sorted.map(r => r.ficha)).toEqual(['AC-10', 'AC-2']);
  });

  it('falls back to plain field comparison without getEmpresa', () => {
    expect(compareByField(row('B', 'x'), row('A', 'x'), fields, 'nombre', 'asc')).toBeGreaterThanOrEqual(0);
  });

  it('searches only the selected field, accent-insensitive', () => {
    expect(matchesFieldSearch(row('F-1', 'x', 'Excavación'), fields, 'nombre', 'excavacion')).toBe(true);
    expect(matchesFieldSearch(row('F-1', 'x', 'Excavación'), fields, 'ficha', 'excavacion')).toBe(false);
    expect(matchesFieldSearch(row('F-1', 'x', 'Excavación'), fields, 'all', 'f-1')).toBe(true);
  });
});
