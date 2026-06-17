import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './presentation/auth/auth.module';
import { TramitesModule } from './presentation/tramites/tramites.module';

@Module({
  imports: [PrismaModule, AuthModule, TramitesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
