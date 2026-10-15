const DEFAULT_PAGE_SIZE = 1000;

type QueryResult<T> = { data: T[] | null; error: unknown };

/**
 * Trae TODAS las filas de una consulta Supabase paginando internamente.
 * PostgREST limita cada respuesta a 1000 filas por defecto, así que
 * cualquier listado que pueda superar ese umbral debe usar este helper
 * en lugar de un único `.select()`.
 *
 * @param queryBuilder función que recibe (offset, limit) y debe devolver
 *   el builder de Supabase ya acotado con `.range(offset, offset + limit - 1)`.
 */
export async function fetchAll<T = any>(
  queryBuilder: (offset: number, limit: number) => PromiseLike<QueryResult<T>>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const results: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await queryBuilder(offset, pageSize);
    if (error) throw error;
    const page = data ?? [];
    results.push(...page);
    if (page.length < pageSize) break;
  }
  return results;
}
