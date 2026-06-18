import { PrismaClientLike } from '../../prisma/prisma-client.type';
import { ComentarioTramite } from '../../../domain/tramites/entities/comentario-tramite.entity';
import {
  ComentarioTramiteRepository,
  NuevoComentarioData,
} from '../../../domain/repositories/comentario-tramite.repository';
import { ComentarioTramiteMapper } from '../mappers/comentario-tramite.mapper';

/** Implementación Prisma del puerto ComentarioTramiteRepository. */
export class PrismaComentarioTramiteRepository implements ComentarioTramiteRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  async create(data: NuevoComentarioData): Promise<ComentarioTramite> {
    const row = await this.prisma.comentarioTramite.create({
      data: {
        tramiteId: data.tramiteId,
        mensaje: data.mensaje,
        visibilidad: data.visibilidad as never,
        autorTipo: data.autorTipo as never,
        autorId: data.autorId,
      },
    });
    return ComentarioTramiteMapper.toDomain(row);
  }

  async listByTramite(tramiteId: string): Promise<ComentarioTramite[]> {
    const rows = await this.prisma.comentarioTramite.findMany({
      where: { tramiteId },
      orderBy: { fecha: 'asc' },
    });
    return rows.map(ComentarioTramiteMapper.toDomain);
  }
}
