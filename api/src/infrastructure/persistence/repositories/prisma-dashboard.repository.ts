import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MovimientoTramite } from '../../../domain/tramites/entities/movimiento-tramite.entity';
import {
  ConteoPorClave,
  DashboardRepository,
  DashboardScope,
} from '../../../domain/repositories/dashboard.repository';
import { MovimientoTramiteMapper } from '../mappers/movimiento-tramite.mapper';

/**
 * Implementación Prisma del puerto DashboardRepository.
 * Toda la agregación ocurre en PostgreSQL (groupBy / SQL con now()).
 */
@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  private tramiteWhere(scope: DashboardScope): Prisma.TramiteWhereInput {
    // Los soft-deleted nunca cuentan en las métricas.
    return scope.areaId ? { eliminadoEn: null, areaActualId: scope.areaId } : { eliminadoEn: null };
  }

  /** Fragmento SQL del filtro de área (o vacío para alcance global). */
  private areaSql(scope: DashboardScope): Prisma.Sql {
    return scope.areaId ? Prisma.sql`AND t."areaActualId" = ${scope.areaId}` : Prisma.empty;
  }

  async contarPorEstado(scope: DashboardScope): Promise<ConteoPorClave[]> {
    const rows = await this.prisma.tramite.groupBy({
      by: ['estado'],
      _count: { _all: true },
      where: this.tramiteWhere(scope),
    });
    return rows.map((r) => ({ clave: r.estado, cantidad: r._count._all }));
  }

  async contarPorOrigen(scope: DashboardScope): Promise<ConteoPorClave[]> {
    const rows = await this.prisma.tramite.groupBy({
      by: ['origen'],
      _count: { _all: true },
      where: this.tramiteWhere(scope),
    });
    return rows.map((r) => ({ clave: r.origen, cantidad: r._count._all }));
  }

  async contarPorArea(scope: DashboardScope): Promise<ConteoPorClave[]> {
    const rows = await this.prisma.tramite.groupBy({
      by: ['areaActualId'],
      _count: { _all: true },
      where: this.tramiteWhere(scope),
    });
    return rows.map((r) => ({ clave: r.areaActualId ?? 'SIN_AREA', cantidad: r._count._all }));
  }

  async contarVencidosSla(scope: DashboardScope): Promise<number> {
    // Activo (no resuelto ni cerrado) y vencido: ahora > fechaCreacion + slaHoras.
    // `fechaCreacion` es TIMESTAMP sin tz (Prisma guarda UTC wall-clock); se
    // compara contra `now() AT TIME ZONE 'UTC'` para que el resultado NO dependa
    // del timezone de la sesión de Postgres.
    const rows = await this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT count(*)::int AS count
      FROM "Tramite" t
      JOIN "TipoTramite" tt ON tt.id = t."tipoTramiteId"
      WHERE t."eliminadoEn" IS NULL
        AND t.estado::text NOT IN ('APROBADO', 'RECHAZADO', 'CANCELADO', 'CERRADO')
        AND (now() AT TIME ZONE 'UTC') > t."fechaCreacion" + (tt."slaHoras" * interval '1 hour')
        ${this.areaSql(scope)}
    `);
    return rows[0]?.count ?? 0;
  }

  async promedioResolucionHoras(scope: DashboardScope): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ horas: number | null }[]>(Prisma.sql`
      SELECT avg(extract(epoch FROM (t."fechaCierre" - t."fechaCreacion")) / 3600.0)::float AS horas
      FROM "Tramite" t
      WHERE t."eliminadoEn" IS NULL
        AND t."fechaCierre" IS NOT NULL
        ${this.areaSql(scope)}
    `);
    return rows[0]?.horas ?? null;
  }

  async ultimosMovimientos(scope: DashboardScope, limite: number): Promise<MovimientoTramite[]> {
    const rows = await this.prisma.movimientoTramite.findMany({
      // Excluye movimientos de trámites soft-deleted (y filtra por área si aplica).
      where: {
        tramite: { eliminadoEn: null, ...(scope.areaId ? { areaActualId: scope.areaId } : {}) },
      },
      orderBy: { fecha: 'desc' },
      take: limite,
    });
    return rows.map(MovimientoTramiteMapper.toDomain);
  }
}
