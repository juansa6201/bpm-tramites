import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoTramite } from '../../../domain/tramites/entities/tipo-tramite.entity';
import { TipoTramiteRepository } from '../../../domain/repositories/tipo-tramite.repository';
import { TipoTramiteMapper } from '../mappers/tipo-tramite.mapper';

/** Implementación Prisma del puerto TipoTramiteRepository (solo lectura). */
@Injectable()
export class PrismaTipoTramiteRepository implements TipoTramiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TipoTramite | null> {
    const row = await this.prisma.tipoTramite.findUnique({ where: { id } });
    return row ? TipoTramiteMapper.toDomain(row) : null;
  }
}
