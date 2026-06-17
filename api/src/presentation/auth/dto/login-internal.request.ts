import { IsEmail } from 'class-validator';

/** Validación HTTP del login interno MOCK (solo email del seed). */
export class LoginInternalRequest {
  @IsEmail()
  email!: string;
}
