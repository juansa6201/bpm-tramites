import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearAreaRequest {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

export class ActualizarAreaRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
