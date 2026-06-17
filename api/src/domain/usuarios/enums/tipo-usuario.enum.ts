/**
 * Distingue la identidad del actor (interno o externo).
 * Definido en el dominio para NO depender de los enums de @prisma/client.
 */
export enum TipoUsuario {
  INTERNO = 'INTERNO',
  EXTERNO = 'EXTERNO',
}
