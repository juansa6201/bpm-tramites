/** Estado de un usuario externo. Espejo del enum de Prisma, pero independiente. */
export enum EstadoUsuarioExterno {
  PENDIENTE_VERIFICACION = 'PENDIENTE_VERIFICACION',
  ACTIVO = 'ACTIVO',
  BLOQUEADO = 'BLOQUEADO',
}
