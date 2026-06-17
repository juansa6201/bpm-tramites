import { DocumentoTramite } from '../tramites/entities/documento-tramite.entity';
import { Visibilidad } from '../tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';

/** Datos para registrar un documento (metadatos; el binario va a storage). */
export interface NuevoDocumentoData {
  tramiteId: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  storageKey: string;
  visibilidad: Visibilidad;
  subidoPorTipo: TipoUsuario;
  subidoPorId: string;
}

/** Puerto de persistencia de documentos (INTERFACE en el dominio). */
export interface DocumentoTramiteRepository {
  create(data: NuevoDocumentoData): Promise<DocumentoTramite>;
  findById(id: string): Promise<DocumentoTramite | null>;
  listByTramite(tramiteId: string): Promise<DocumentoTramite[]>;
  delete(id: string): Promise<void>;
}
