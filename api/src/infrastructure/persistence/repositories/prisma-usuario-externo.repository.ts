import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsuarioExterno } from '../../../domain/usuarios/entities/usuario-externo.entity';
import {
  CrearUsuarioExternoData,
  ListarUsuariosExternosFiltros,
  UsuarioExternoRepository,
} from '../../../domain/usuarios/repositories/usuario-externo.repository';
import { EstadoUsuarioExterno } from '../../../domain/usuarios/enums/estado-usuario-externo.enum';
import { UsuarioExternoMapper } from '../mappers/usuario-externo.mapper';

/**
 * Implementación Prisma del puerto UsuarioExternoRepository (definido en domain).
 * Devuelve SIEMPRE entidades de dominio, nunca filas de Prisma.
 */
@Injectable()
export class PrismaUsuarioExternoRepository implements UsuarioExternoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UsuarioExterno | null> {
    const row = await this.prisma.usuarioExterno.findUnique({ where: { id } });
    return row ? UsuarioExternoMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UsuarioExterno | null> {
    const row = await this.prisma.usuarioExterno.findUnique({ where: { email } });
    return row ? UsuarioExternoMapper.toDomain(row) : null;
  }

  async findByDocumento(documento: string): Promise<UsuarioExterno | null> {
    const row = await this.prisma.usuarioExterno.findUnique({ where: { documento } });
    return row ? UsuarioExternoMapper.toDomain(row) : null;
  }

  async create(data: CrearUsuarioExternoData): Promise<UsuarioExterno> {
    // estado y fechaAlta los asigna la DB (defaults del schema).
    const row = await this.prisma.usuarioExterno.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        documento: data.documento,
        organizacion: data.organizacion,
        passwordHash: data.passwordHash,
      },
    });
    return UsuarioExternoMapper.toDomain(row);
  }

  async list(filtros: ListarUsuariosExternosFiltros = {}): Promise<UsuarioExterno[]> {
    const rows = await this.prisma.usuarioExterno.findMany({
      where: filtros.soloActivos ? { estado: EstadoUsuarioExterno.ACTIVO } : {},
      orderBy: { nombre: 'asc' },
    });
    return rows.map(UsuarioExternoMapper.toDomain);
  }
}
