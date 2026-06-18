import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';

export class EditarTramiteRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descripcion?: string;

  @IsOptional()
  @IsEnum(PrioridadTramite)
  prioridad?: PrioridadTramite;
}
