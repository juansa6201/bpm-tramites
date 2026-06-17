import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class DerivarRequest {
  @IsUUID()
  areaNuevaId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comentario?: string;
}
