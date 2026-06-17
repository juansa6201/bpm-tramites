import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wrapper de PrismaClient como provider de Nest.
 * Vive en INFRASTRUCTURE: es el único punto que conoce Prisma.
 * Los repositorios concretos lo usan; el dominio jamás lo ve.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
