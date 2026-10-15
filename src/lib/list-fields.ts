// Generic field search/sort helpers shared by every list-style section (equipment catalog,
// maintenance, dashboard, history/reports) so "Buscar en / Buscar / Ordenar por" behaves
// identically everywhere and the EIRL-before-GROUP company grouping stays consistent.
export type FieldConfig<T, K extends string> = { key: K; label: string; get: (row: T) => unknown };
export type SortDirection = 'asc' | 'desc';

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

export const normalizeListText = (value: unknown) =>
  String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const companyRank = (empresa: string | null | undefined) =>
  empresa === 'ALITO EIRL' ? 0 : empresa === 'ALITO GROUP SRL' ? 1 : 2;

export function matchesFieldSearch<T, K extends string>(
  row: T,
  fields: ReadonlyArray<FieldConfig<T, K>>,
  field: 'all' | K,
  query: string,
) {
  const normalized = normalizeListText(query);
  if (!normalized) return true;
  const values = field === 'all' ? fields.map(f => f.get(row)) : [fields.find(f => f.key === field)?.get(row)];
  return values.some(value => normalizeListText(value).includes(normalized));
}

/**
 * Compares two rows by a field. When `ficha` is the sort field and `getEmpresa` is provided,
 * rows are grouped ALITO EIRL first, then ALITO GROUP SRL, then others, regardless of direction,
 * matching the equipment catalog behaviour.
 */
export function compareByField<T, K extends string>(
  a: T,
  b: T,
  fields: ReadonlyArray<FieldConfig<T, K>>,
  field: K,
  direction: SortDirection,
  options?: { getEmpresa?: (row: T) => string | null | undefined; getFicha?: (row: T) => string; tieBreaker?: (a: T, b: T) => number },
) {
  const getFicha = options?.getFicha;
  if (field === 'ficha' && options?.getEmpresa) {
    const company = companyRank(options.getEmpresa(a)) - companyRank(options.getEmpresa(b));
    if (company) return company;
  }
  const config = fields.find(f => f.key === field);
  const compared = collator.compare(String(config?.get(a) ?? '').trim(), String(config?.get(b) ?? '').trim());
  if (compared) return compared * (direction === 'asc' ? 1 : -1);
  if (getFicha) {
    const fichaCompare = collator.compare(getFicha(a).trim(), getFicha(b).trim());
    if (fichaCompare) return fichaCompare;
  }
  return options?.tieBreaker ? options.tieBreaker(a, b) : 0;
}
