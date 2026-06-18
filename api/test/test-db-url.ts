/**
 * Deriva la URL de la base de TEST a partir del DATABASE_URL real, usando un
 * esquema PostgreSQL dedicado (test_e2e). Así los e2e quedan aislados del
 * esquema de desarrollo sin necesidad de otra base ni de credenciales nuevas.
 */
export const TEST_SCHEMA = 'test_e2e';

export function toTestSchemaUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set('schema', TEST_SCHEMA);
  return url.toString();
}
