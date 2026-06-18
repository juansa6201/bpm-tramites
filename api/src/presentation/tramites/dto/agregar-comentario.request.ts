import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';

export class AgregarComentarioRequest {
  @IsString()
  @IsNotEmpty()
  mensaje!: string;

  /** Opcional: si se omite, el caso de uso usa TODOS. Un externo no puede usar INTERNA. */
  @IsOptional()
  @IsEnum(Visibilidad)
  visibilidad?: Visibilidad;
}
