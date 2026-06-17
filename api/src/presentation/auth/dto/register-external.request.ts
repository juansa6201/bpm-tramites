import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/** Validación HTTP del registro externo (errores de forma → 400). */
export class RegisterExternalRequest {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  documento!: string;

  @IsOptional()
  @IsString()
  organizacion?: string;

  @IsString()
  @MinLength(8, { message: 'El password debe tener al menos 8 caracteres' })
  password!: string;
}
