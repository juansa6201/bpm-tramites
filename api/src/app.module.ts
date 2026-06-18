import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './presentation/auth/auth.module';
import { TramitesModule } from './presentation/tramites/tramites.module';
import { ConfiguracionModule } from './presentation/config/configuracion.module';
import { DashboardModule } from './presentation/dashboard/dashboard.module';
import { DocumentosModule } from './presentation/documentos/documentos.module';
import { UsuariosModule } from './presentation/usuarios/usuarios.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TramitesModule,
    ConfiguracionModule,
    DashboardModule,
    DocumentosModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
