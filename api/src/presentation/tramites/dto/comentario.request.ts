import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Acciones donde el comentario es opcional (ingresar, tomar, aprobar, cerrar). */
export class ComentarioOpcionalRequest {
  @IsOptional()
  @IsString()
  comentario?: string;
}

/** Acciones donde el comentario es obligatorio (observar, rechazar, responder, etc.). */
export class ComentarioRequeridoRequest {
  @IsString()
  @IsNotEmpty()
  comentario!: string;
}
