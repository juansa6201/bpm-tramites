import { Actor } from '../actor';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { DocumentoView } from './documento.view';

export interface SubirDocumentoInput {
  tramiteId: string;
  actor: Actor;
  nombreArchivo: string;
  mimeType: string;
  contenido: Buffer;
  /** Si se omite, el caso de uso usa TODOS. Un externo no puede usar INTERNA. */
  visibilidad?: Visibilidad;
}

export interface ListarDocumentosInput {
  tramiteId: string;
  actor: Actor;
}

export interface DescargarDocumentoInput {
  tramiteId: string;
  documentoId: string;
  actor: Actor;
}

export interface EliminarDocumentoInput {
  tramiteId: string;
  documentoId: string;
  actor: Actor;
}

/** El binario más los metadatos, para que el controller arme la respuesta. */
export interface DescargarDocumentoResult {
  documento: DocumentoView;
  contenido: Buffer;
}
