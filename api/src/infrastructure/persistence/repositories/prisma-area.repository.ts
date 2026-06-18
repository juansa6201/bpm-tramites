import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Area } from '../../../domain/tramites/entities/area.entity';
import {
  ActualizarAreaData,
  AreaRepository,
  CrearAreaData,
} from '../../../domain/repositories/area.repository';
import { CodigoAreaEnUsoError } from '../../../domain/tramites/errors/config.errors';
import { AreaMapper } from '../mappers/area.mapper';

/** Implementación Prisma del puerto AreaRepository. */
@Injectable()
export class PrismaAreaRepository implements AreaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Area | null> {
    const row = await this.prisma.area.findUnique({ where: { id } });
    return row ? AreaMapper.toDomain(row) : null;
  }

  async findByCodigo(codigo: string): Promise<Area | null> {
    const row = await this.prisma.area.findUnique({ where: { codigo } });
    return row ? AreaMapper.toDomain(row) : null;
  }

  async list(): Promise<Area[]> {
    const rows = await this.prisma.area.findMany({ orderBy: { codigo: 'asc' } });
    return rows.map(AreaMapper.toDomain);
  }

  async create(data: CrearAreaData): Promise<Area> {
    try {
      const row = await this.prisma.area.create({
        data: { nombre: data.nombre, codigo: data.codigo, activa: data.activa },
      });
      return AreaMapper.toDomain(row);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new CodigoAreaEnUsoError(data.codigo);
      }
      throw e;
    }
  }

  async update(id: string, data: ActualizarAreaData): Promise<Area> {
    const row = await this.prisma.area.update({
      where: { id },
      data: { nombre: data.nombre, activa: data.activa },
    });
    return AreaMapper.toDomain(row);
  }
}
