import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentoTramite } from '../../../domain/tramites/entities/documento-tramite.entity';
import {
  DocumentoTramiteRepository,
  NuevoDocumentoData,
} from '../../../domain/repositories/documento-tramite.repository';
import { DocumentoTramiteMapper } from '../mappers/documento-tramite.mapper';

/** Implementación Prisma del puerto DocumentoTramiteRepository. */
@Injectable()
export class PrismaDocumentoTramiteRepository implements DocumentoTramiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: NuevoDocumentoData): Promise<DocumentoTramite> {
    const row = await this.prisma.documentoTramite.create({
      data: {
        tramiteId: data.tramiteId,
        nombreArchivo: data.nombreArchivo,
        mimeType: data.mimeType,
        size: data.size,
        storageKey: data.storageKey,
        visibilidad: data.visibilidad as never,
        subidoPorTipo: data.subidoPorTipo as never,
        subidoPorId: data.subidoPorId,
      },
    });
    return DocumentoTramiteMapper.toDomain(row);
  }

  async findById(id: string): Promise<DocumentoTramite | null> {
    const row = await this.prisma.documentoTramite.findUnique({ where: { id } });
    return row ? DocumentoTramiteMapper.toDomain(row) : null;
  }

  async listByTramite(tramiteId: string): Promise<DocumentoTramite[]> {
    const rows = await this.prisma.documentoTramite.findMany({
      where: { tramiteId },
      orderBy: { fechaCarga: 'asc' },
    });
    return rows.map(DocumentoTramiteMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.documentoTramite.delete({ where: { id } });
  }
}
