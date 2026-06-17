/** Roles de un usuario interno. Espejo del enum de Prisma, pero independiente. */
export enum RolInterno {
  ADMIN = 'ADMIN',
  MESA_ENTRADA = 'MESA_ENTRADA',
  OPERADOR = 'OPERADOR',
  SUPERVISOR = 'SUPERVISOR',
  AUDITOR = 'AUDITOR',
}
