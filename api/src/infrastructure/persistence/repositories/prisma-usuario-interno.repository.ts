import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsuarioInterno } from '../../../domain/usuarios/entities/usuario-interno.entity';
import { UsuarioInternoRepository } from '../../../domain/usuarios/repositories/usuario-interno.repository';
import { UsuarioInternoMapper } from '../mappers/usuario-interno.mapper';

/** Implementación Prisma del puerto UsuarioInternoRepository (solo lectura). */
@Injectable()
export class PrismaUsuarioInternoRepository implements UsuarioInternoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UsuarioInterno | null> {
    const row = await this.prisma.usuarioInterno.findUnique({ where: { id } });
    return row ? UsuarioInternoMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UsuarioInterno | null> {
    const row = await this.prisma.usuarioInterno.findUnique({ where: { email } });
    return row ? UsuarioInternoMapper.toDomain(row) : null;
  }

  async findByAzureObjectId(azureObjectId: string): Promise<UsuarioInterno | null> {
    const row = await this.prisma.usuarioInterno.findUnique({ where: { azureObjectId } });
    return row ? UsuarioInternoMapper.toDomain(row) : null;
  }
}
