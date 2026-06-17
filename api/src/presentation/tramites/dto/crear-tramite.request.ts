import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';

export class CrearTramiteRequest {
  @IsUUID()
  tipoTramiteId!: string;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsEnum(OrigenTramite)
  origen!: OrigenTramite;

  @IsOptional()
  @IsEnum(PrioridadTramite)
  prioridad?: PrioridadTramite;

  @IsOptional()
  @IsUUID()
  usuarioExternoId?: string;

  @IsOptional()
  @IsUUID()
  areaActualId?: string;
}
