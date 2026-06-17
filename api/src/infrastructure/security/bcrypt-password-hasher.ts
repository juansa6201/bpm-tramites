import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/password-hasher.port';

/** Implementación de PasswordHasher con bcrypt. */
@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds = 10;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
