import { IsEnum, IsOptional } from 'class-validator';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';

/** El archivo va como multipart; la visibilidad como query param opcional. */
export class SubirDocumentoQuery {
  @IsOptional()
  @IsEnum(Visibilidad)
  visibilidad?: Visibilidad;
}
