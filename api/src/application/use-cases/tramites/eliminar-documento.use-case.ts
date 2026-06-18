import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { DocumentoTramiteRepository } from '../../../domain/repositories/documento-tramite.repository';
import { DocumentoTramite } from '../../../domain/tramites/entities/documento-tramite.entity';
import { StoragePort } from '../../ports/storage.port';
import { Actor } from '../../dto/actor';
import { EliminarDocumentoInput } from '../../dto/tramites/documento.input';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import {
  DocumentoNoEncontradoError,
  SinPermisoSobreDocumentoError,
  TramiteNoEncontradoError,
} from '../../../domain/tramites/errors/tramite.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Elimina un documento (metadatos + binario). Permiso: quien lo subió, o un
 * ADMIN interno. Borra primero el registro y luego el binario (best-effort), de
 * modo que un fallo del storage no deje un registro apuntando a un archivo vivo.
 */
export class EliminarDocumentoUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly documentos: DocumentoTramiteRepository,
    private readonly storage: StoragePort,
  ) {}

  async execute(input: EliminarDocumentoInput): Promise<void> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);

    const documento = await this.documentos.findById(input.documentoId);
    // Un documento ajeno al trámite o no visible para el actor se trata como
    // inexistente (404), para no filtrar su existencia (igual que la descarga).
    if (
      !documento ||
      documento.tramiteId !== tramite.id ||
      !documento.esVisiblePara(input.actor.tipo)
    ) {
      throw new DocumentoNoEncontradoError(input.documentoId);
    }
    if (!this.puedeEliminar(documento, input.actor)) {
      throw new SinPermisoSobreDocumentoError();
    }

    // El registro es la fuente de verdad: se borra primero. El binario se borra
    // best-effort; si el storage falla, queda un huérfano (mal menor) y no se
    // revierte el borrado del registro.
    await this.documentos.delete(documento.id);
    try {
      await this.storage.remove(documento.storageKey);
    } catch {
      // best-effort: el archivo huérfano se puede limpiar luego.
    }
  }

  private puedeEliminar(documento: DocumentoTramite, actor: Actor): boolean {
    if (documento.fueSubidoPor(actor.tipo, actor.id)) return true;
    return actor.tipo === TipoUsuario.INTERNO && actor.rol === RolInterno.ADMIN;
  }
}
