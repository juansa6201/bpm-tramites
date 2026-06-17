/**
 * Puerto de hashing de passwords. Implementado en infrastructure (bcrypt).
 * El dominio/aplicación no conocen la librería concreta.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
