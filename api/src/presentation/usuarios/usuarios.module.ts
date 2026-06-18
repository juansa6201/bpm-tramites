import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { SecurityModule } from '../security/security.module';
import { USUARIO_EXTERNO_REPOSITORY } from '../../application/tokens';
import { UsuarioExternoRepository } from '../../domain/usuarios/repositories/usuario-externo.repository';
import { PrismaUsuarioExternoRepository } from '../../infrastructure/persistence/repositories/prisma-usuario-externo.repository';
import { ListarUsuariosExternosUseCase } from '../../application/use-cases/usuarios/listar-usuarios-externos.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';

@Module({
  imports: [SecurityModule],
  controllers: [UsuariosController],
  providers: [
    { provide: USUARIO_EXTERNO_REPOSITORY, useClass: PrismaUsuarioExternoRepository },
    {
      provide: ListarUsuariosExternosUseCase,
      useFactory: (usuarios: UsuarioExternoRepository) =>
        new ListarUsuariosExternosUseCase(usuarios),
      inject: [USUARIO_EXTERNO_REPOSITORY],
    },
    // El guard se construye en este módulo; sus deps vienen de SecurityModule.
    WorkflowAuthGuard,
  ],
})
export class UsuariosModule {}
