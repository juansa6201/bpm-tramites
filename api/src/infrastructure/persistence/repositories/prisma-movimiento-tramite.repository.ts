import { PrismaClientLike } from '../../prisma/prisma-client.type';
import { MovimientoTramite } from '../../../domain/tramites/entities/movimiento-tramite.entity';
import {
  MovimientoTramiteRepository,
  NuevoMovimientoData,
} from '../../../domain/repositories/movimiento-tramite.repository';
import { MovimientoTramiteMapper } from '../mappers/movimiento-tramite.mapper';

/** Implementación Prisma del puerto MovimientoTramiteRepository. */
export class PrismaMovimientoTramiteRepository implements MovimientoTramiteRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  async create(data: NuevoMovimientoData): Promise<MovimientoTramite> {
    const row = await this.prisma.movimientoTramite.create({
      data: {
        tramiteId: data.tramiteId,
        estadoAnterior: data.estadoAnterior as never,
        estadoNuevo: data.estadoNuevo as never,
        areaAnteriorId: data.areaAnteriorId,
        areaNuevaId: data.areaNuevaId,
        usuarioTipo: data.usuarioTipo as never,
        usuarioId: data.usuarioId,
        accion: data.accion as never,
        comentario: data.comentario,
      },
    });
    return MovimientoTramiteMapper.toDomain(row);
  }

  async listByTramite(tramiteId: string): Promise<MovimientoTramite[]> {
    const rows = await this.prisma.movimientoTramite.findMany({
      where: { tramiteId },
      orderBy: { fecha: 'asc' },
    });
    return rows.map(MovimientoTramiteMapper.toDomain);
  }
}
