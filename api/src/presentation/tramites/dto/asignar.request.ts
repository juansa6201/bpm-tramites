import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AsignarRequest {
  @IsUUID()
  usuarioAsignadoId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comentario?: string;
}
