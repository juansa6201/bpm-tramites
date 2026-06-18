import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';

/**
 * Query params de GET /tramites. Los valores llegan como string: `@Type`
 * convierte page/pageSize a número antes de validar (el ValidationPipe global
 * tiene transform + whitelist activados).
 */
export class ListarTramitesQuery {
  @IsOptional()
  @IsEnum(EstadoTramite)
  estado?: EstadoTramite;

  @IsOptional()
  @IsEnum(OrigenTramite)
  origen?: OrigenTramite;

  @IsOptional()
  @IsEnum(PrioridadTramite)
  prioridad?: PrioridadTramite;

  @IsOptional()
  @IsUUID()
  areaActualId?: string;

  @IsOptional()
  @IsUUID()
  usuarioAsignadoId?: string;

  @IsOptional()
  @IsUUID()
  usuarioExternoId?: string;

  // Rango sobre fechaCreacion. `@Type(() => Date)` convierte el string ISO de la
  // query a Date antes de validar (ej: '2026-06-01' o un ISO completo).
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  creadoDesde?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  creadoHasta?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
