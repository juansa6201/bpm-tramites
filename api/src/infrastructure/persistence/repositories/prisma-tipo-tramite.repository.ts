import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoTramite } from '../../../domain/tramites/entities/tipo-tramite.entity';
import {
  ActualizarTipoTramiteData,
  CrearTipoTramiteData,
  TipoTramiteRepository,
} from '../../../domain/repositories/tipo-tramite.repository';
import { CodigoTipoTramiteEnUsoError } from '../../../domain/tramites/errors/config.errors';
import { TipoTramiteMapper } from '../mappers/tipo-tramite.mapper';

/** Implementación Prisma del puerto TipoTramiteRepository. */
@Injectable()
export class PrismaTipoTramiteRepository implements TipoTramiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TipoTramite | null> {
    const row = await this.prisma.tipoTramite.findUnique({ where: { id } });
    return row ? TipoTramiteMapper.toDomain(row) : null;
  }

  async findByCodigo(codigo: string): Promise<TipoTramite | null> {
    const row = await this.prisma.tipoTramite.findUnique({ where: { codigo } });
    return row ? TipoTramiteMapper.toDomain(row) : null;
  }

  async list(): Promise<TipoTramite[]> {
    const rows = await this.prisma.tipoTramite.findMany({ orderBy: { codigo: 'asc' } });
    return rows.map(TipoTramiteMapper.toDomain);
  }

  async create(data: CrearTipoTramiteData): Promise<TipoTramite> {
    try {
      const row = await this.prisma.tipoTramite.create({
        data: {
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion,
          activo: data.activo,
          requiereExterno: data.requiereExterno,
          permiteInicioExterno: data.permiteInicioExterno,
          slaHoras: data.slaHoras,
          areaInicialId: data.areaInicialId,
        },
      });
      return TipoTramiteMapper.toDomain(row);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new CodigoTipoTramiteEnUsoError(data.codigo);
      }
      throw e;
    }
  }

  async update(id: string, data: ActualizarTipoTramiteData): Promise<TipoTramite> {
    const row = await this.prisma.tipoTramite.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo,
        requiereExterno: data.requiereExterno,
        permiteInicioExterno: data.permiteInicioExterno,
        slaHoras: data.slaHoras,
        areaInicialId: data.areaInicialId,
      },
    });
    return TipoTramiteMapper.toDomain(row);
  }
}
