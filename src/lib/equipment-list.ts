import type { Equipo } from '@/types/equipment';
import { compareByField, matchesFieldSearch, normalizeListText, type FieldConfig } from '@/lib/list-fields';

const fieldValue = (equipo: Equipo, field: EquipmentSortField) =>
  field === 'activo' ? (equipo.empresa === 'VENDIDO' ? 'Vendido' : equipo.activo ? 'Activo' : 'Inactivo') : equipo[field];

export const equipmentFields: ReadonlyArray<FieldConfig<Equipo, EquipmentSortField>> = [
  { key: 'ficha', label: 'Ficha', get: e => fieldValue(e, 'ficha') },
  { key: 'nombre', label: 'Nombre', get: e => fieldValue(e, 'nombre') },
  { key: 'empresa', label: 'Empresa', get: e => fieldValue(e, 'empresa') },
  { key: 'marca', label: 'Marca', get: e => fieldValue(e, 'marca') },
  { key: 'modelo', label: 'Modelo', get: e => fieldValue(e, 'modelo') },
  { key: 'numeroSerie', label: 'N° Serie', get: e => fieldValue(e, 'numeroSerie') },
  { key: 'categoria', label: 'Categoría', get: e => fieldValue(e, 'categoria') },
  { key: 'segmento', label: 'Segmento', get: e => fieldValue(e, 'segmento') },
  { key: 'placa', label: 'Placa', get: e => fieldValue(e, 'placa') },
  { key: 'activo', label: 'Estado', get: e => fieldValue(e, 'activo') },
] as const as ReadonlyArray<FieldConfig<Equipo, EquipmentSortField>>;

const rawEquipmentFields = [
  { key: 'ficha', label: 'Ficha' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'marca', label: 'Marca' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'numeroSerie', label: 'N° Serie' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'segmento', label: 'Segmento' },
  { key: 'placa', label: 'Placa' },
  { key: 'activo', label: 'Estado' },
] as const;

export type EquipmentSortField = typeof rawEquipmentFields[number]['key'];
export type EquipmentSearchField = 'all' | EquipmentSortField;
export type EquipmentSortDirection = 'asc' | 'desc';

export const normalizeEquipmentText = normalizeListText;
export const equipmentCompanyLabel = (equipo: Equipo) =>
  equipo.empresa === 'ALITO GROUP SRL' ? 'GROUP' : equipo.empresa === 'VENDIDO' ? 'VENDIDO' : 'EIRL';

export function matchesEquipmentSearch(equipo: Equipo, field: EquipmentSearchField, query: string) {
  return matchesFieldSearch(equipo, equipmentFields, field, query);
}

export function compareEquipment(a: Equipo, b: Equipo, field: EquipmentSortField, direction: EquipmentSortDirection) {
  return compareByField(a, b, equipmentFields, field, direction, {
    getEmpresa: e => e.empresa,
    getFicha: e => e.ficha,
    tieBreaker: (x, y) => x.id - y.id,
  });
}
