import { Module } from '@nestjs/common';
import { DocumentosController } from './documentos.controller';
import { SecurityModule } from '../security/security.module';
import {
  DOCUMENTO_TRAMITE_REPOSITORY,
  STORAGE_PORT,
  TRAMITE_REPOSITORY,
} from '../../application/tokens';
import { TramiteRepository } from '../../domain/repositories/tramite.repository';
import { DocumentoTramiteRepository } from '../../domain/repositories/documento-tramite.repository';
import { StoragePort } from '../../application/ports/storage.port';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PrismaTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-tramite.repository';
import { PrismaDocumentoTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-documento-tramite.repository';
import { LocalDiskStorage } from '../../infrastructure/storage/local-disk-storage.adapter';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';

import { SubirDocumentoUseCase } from '../../application/use-cases/tramites/subir-documento.use-case';
import { ListarDocumentosUseCase } from '../../application/use-cases/tramites/listar-documentos.use-case';
import { DescargarDocumentoUseCase } from '../../application/use-cases/tramites/descargar-documento.use-case';
import { EliminarDocumentoUseCase } from '../../application/use-cases/tramites/eliminar-documento.use-case';

@Module({
  imports: [SecurityModule],
  controllers: [DocumentosController],
  providers: [
    {
      provide: TRAMITE_REPOSITORY,
      useFactory: (p: PrismaService) => new PrismaTramiteRepository(p),
      inject: [PrismaService],
    },
    { provide: DOCUMENTO_TRAMITE_REPOSITORY, useClass: PrismaDocumentoTramiteRepository },
    { provide: STORAGE_PORT, useClass: LocalDiskStorage },

    {
      provide: SubirDocumentoUseCase,
      useFactory: (t: TramiteRepository, d: DocumentoTramiteRepository, s: StoragePort) =>
        new SubirDocumentoUseCase(t, d, s),
      inject: [TRAMITE_REPOSITORY, DOCUMENTO_TRAMITE_REPOSITORY, STORAGE_PORT],
    },
    {
      provide: ListarDocumentosUseCase,
      useFactory: (t: TramiteRepository, d: DocumentoTramiteRepository) =>
        new ListarDocumentosUseCase(t, d),
      inject: [TRAMITE_REPOSITORY, DOCUMENTO_TRAMITE_REPOSITORY],
    },
    {
      provide: DescargarDocumentoUseCase,
      useFactory: (t: TramiteRepository, d: DocumentoTramiteRepository, s: StoragePort) =>
        new DescargarDocumentoUseCase(t, d, s),
      inject: [TRAMITE_REPOSITORY, DOCUMENTO_TRAMITE_REPOSITORY, STORAGE_PORT],
    },
    {
      provide: EliminarDocumentoUseCase,
      useFactory: (t: TramiteRepository, d: DocumentoTramiteRepository, s: StoragePort) =>
        new EliminarDocumentoUseCase(t, d, s),
      inject: [TRAMITE_REPOSITORY, DOCUMENTO_TRAMITE_REPOSITORY, STORAGE_PORT],
    },

    // El guard se construye en este módulo; sus deps vienen de SecurityModule.
    WorkflowAuthGuard,
  ],
})
export class DocumentosModule {}
