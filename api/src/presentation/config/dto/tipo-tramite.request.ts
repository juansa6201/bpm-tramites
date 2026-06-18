import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CrearTipoTramiteRequest {
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereExterno?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteInicioExterno?: boolean;

  @IsInt()
  @Min(0)
  slaHoras!: number;

  @IsOptional()
  @IsUUID()
  areaInicialId?: string;
}

export class ActualizarTipoTramiteRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereExterno?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteInicioExterno?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  slaHoras?: number;

  @IsOptional()
  @IsUUID()
  areaInicialId?: string;
}
