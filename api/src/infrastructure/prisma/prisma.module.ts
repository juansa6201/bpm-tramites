import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global: el PrismaService queda disponible para inyectar en cualquier
 * módulo sin reimportar. Lo usan las implementaciones de repositorios.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
