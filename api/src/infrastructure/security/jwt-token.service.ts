import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenPayload, TokenService } from '../../application/ports/token-service.port';

/** Implementación de TokenService con jsonwebtoken (HMAC). */
@Injectable()
export class JwtTokenService implements TokenService {
  private readonly secret: string = process.env.JWT_SECRET ?? 'dev_secret_change_me';
  private readonly expiresIn: string = process.env.JWT_EXPIRES_IN ?? '1h';

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    } as unknown as jwt.SignOptions);
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
