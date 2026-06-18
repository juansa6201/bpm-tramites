import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  /** Healthcheck: verifica que la API responde y que la base está accesible. */
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      // DB inaccesible → 503 para que el orquestador no enrute tráfico acá.
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    return {
      status: 'ok',
      service: 'bpm-api',
      db: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
