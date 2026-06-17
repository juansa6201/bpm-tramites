/** Resultado paginado genérico (usado por los listados de dominio). */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
