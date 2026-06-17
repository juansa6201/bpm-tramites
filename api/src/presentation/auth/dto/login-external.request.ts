import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** Validación HTTP del login externo. */
export class LoginExternalRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
