import type { Equipo } from '@/types/equipment';

export const equipmentFields = [
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

export type EquipmentSortField = typeof equipmentFields[number]['key'];
export type EquipmentSearchField = 'all' | EquipmentSortField;
export type EquipmentSortDirection = 'asc' | 'desc';
const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
export const normalizeEquipmentText = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const equipmentCompanyLabel = (equipo: Equipo) => equipo.empresa === 'ALITO GROUP SRL' ? 'GROUP' : equipo.empresa === 'VENDIDO' ? 'VENDIDO' : 'EIRL';
const companyRank = (equipo: Equipo) => equipo.empresa === 'ALITO EIRL' ? 0 : equipo.empresa === 'ALITO GROUP SRL' ? 1 : 2;
const fieldValue = (equipo: Equipo, field: EquipmentSortField) => field === 'activo' ? (equipo.empresa === 'VENDIDO' ? 'Vendido' : equipo.activo ? 'Activo' : 'Inactivo') : equipo[field];

export function matchesEquipmentSearch(equipo: Equipo, field: EquipmentSearchField, query: string) {
  const normalized = normalizeEquipmentText(query);
  if (!normalized) return true;
  const values = field === 'all' ? equipmentFields.map(({ key }) => fieldValue(equipo, key)) : [fieldValue(equipo, field)];
  return values.some(value => normalizeEquipmentText(value).includes(normalized));
}

export function compareEquipment(a: Equipo, b: Equipo, field: EquipmentSortField, direction: EquipmentSortDirection) {
  // Company order remains fixed even when ficha direction is reversed.
  if (field === 'ficha') {
    const company = companyRank(a) - companyRank(b);
    if (company) return company;
  }
  const compared = collator.compare(String(fieldValue(a, field) ?? ''), String(fieldValue(b, field) ?? ''));
  return compared ? compared * (direction === 'asc' ? 1 : -1) : collator.compare(a.ficha, b.ficha) || a.id - b.id;
}