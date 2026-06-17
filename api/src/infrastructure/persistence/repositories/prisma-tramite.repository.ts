import { Prisma } from '@prisma/client';
import { PrismaClientLike } from '../../prisma/prisma-client.type';
import { Tramite } from '../../../domain/tramites/entities/tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import {
  CrearTramiteData,
  TramiteFilters,
  TramiteRepository,
} from '../../../domain/repositories/tramite.repository';
import { PaginatedResult } from '../../../domain/shared/pagination';
import {
  ConflictoDeConcurrenciaError,
  NumeroDuplicadoError,
} from '../../../domain/tramites/errors/tramite.errors';
import { TramiteMapper } from '../mappers/tramite.mapper';

/**
 * Implementación Prisma del puerto TramiteRepository.
 * El cliente puede ser el PrismaService o un cliente transaccional (UoW).
 */
export class PrismaTramiteRepository implements TramiteRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  async findById(id: string): Promise<Tramite | null> {
    const row = await this.prisma.tramite.findUnique({ where: { id } });
    return row ? TramiteMapper.toDomain(row) : null;
  }

  async findByNumero(numero: string): Promise<Tramite | null> {
    const row = await this.prisma.tramite.findUnique({ where: { numero } });
    return row ? TramiteMapper.toDomain(row) : null;
  }

  async list(filters: TramiteFilters): Promise<PaginatedResult<Tramite>> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20;

    const where: Prisma.TramiteWhereInput = {
      ...(filters.estado ? { estado: filters.estado as never } : {}),
      ...(filters.origen ? { origen: filters.origen as never } : {}),
      ...(filters.prioridad ? { prioridad: filters.prioridad as never } : {}),
      ...(filters.areaActualId ? { areaActualId: filters.areaActualId } : {}),
      ...(filters.usuarioAsignadoId ? { usuarioAsignadoId: filters.usuarioAsignadoId } : {}),
      ...(filters.usuarioExternoId ? { usuarioExternoId: filters.usuarioExternoId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.tramite.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { fechaCreacion: 'desc' },
      }),
      this.prisma.tramite.count({ where }),
    ]);

    return { items: rows.map(TramiteMapper.toDomain), total, page, pageSize };
  }

  async create(data: CrearTramiteData): Promise<Tramite> {
    try {
      const row = await this.prisma.tramite.create({
        data: {
          numero: data.numero,
          titulo: data.titulo,
          descripcion: data.descripcion,
          origen: data.origen as never,
          prioridad: data.prioridad as never,
          tipoTramiteId: data.tipoTramiteId,
          areaActualId: data.areaActualId,
          usuarioAsignadoId: data.usuarioAsignadoId,
          usuarioExternoId: data.usuarioExternoId,
          creadoPorTipo: data.creadoPorTipo as never,
          creadoPorId: data.creadoPorId,
        },
      });
      return TramiteMapper.toDomain(row);
    } catch (e) {
      // Colisión del número único (carrera en la numeración) → reintenta el caso de uso.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new NumeroDuplicadoError();
      }
      throw e;
    }
  }

  async ultimoNumeroConPrefijo(prefijo: string): Promise<string | null> {
    // El número es de ancho fijo con padding, así que orden lexicográfico = numérico.
    const row = await this.prisma.tramite.findFirst({
      where: { numero: { startsWith: prefijo } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    return row?.numero ?? null;
  }

  /**
   * Bloqueo optimista: solo actualiza si `version` sigue siendo la leída.
   * updateMany devuelve count=0 si otra operación ya incrementó la versión.
   */
  async update(tramite: Tramite): Promise<void> {
    const res = await this.prisma.tramite.updateMany({
      where: { id: tramite.id, version: tramite.version },
      data: {
        estado: tramite.estado as never,
        prioridad: tramite.prioridad as never,
        areaActualId: tramite.areaActualId,
        usuarioAsignadoId: tramite.usuarioAsignadoId,
        usuarioExternoId: tramite.usuarioExternoId,
        fechaCierre: tramite.fechaCierre,
        version: { increment: 1 },
      },
    });
    if (res.count === 0) {
      throw new ConflictoDeConcurrenciaError();
    }
  }

  async tomarAtomico(params: {
    id: string;
    estadoEsperado: EstadoTramite;
    usuarioAsignadoEsperado: string | null;
    estadoNuevo: EstadoTramite;
    usuarioAsignadoId: string;
  }): Promise<boolean> {
    // El WHERE incluye el estado y el asignado ESPERADOS (los que leímos):
    // es un compare-and-swap. La DB ejecuta este UPDATE como una sola sentencia
    // atómica con lock de fila, así que solo una operación concurrente matchea.
    const res = await this.prisma.tramite.updateMany({
      where: {
        id: params.id,
        estado: params.estadoEsperado as never,
        usuarioAsignadoId: params.usuarioAsignadoEsperado,
      },
      data: {
        estado: params.estadoNuevo as never,
        usuarioAsignadoId: params.usuarioAsignadoId,
        version: { increment: 1 },
      },
    });
    return res.count === 1;
  }
}
