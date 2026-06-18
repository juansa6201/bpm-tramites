import { DocumentoTramite } from '../../../domain/tramites/entities/documento-tramite.entity';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';

/**
 * Vista de salida plana de un documento (metadatos). NO expone storageKey:
 * es un detalle interno del almacenamiento, no del contrato HTTP.
 */
export interface DocumentoView {
  id: string;
  tramiteId: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  visibilidad: Visibilidad;
  subidoPorTipo: TipoUsuario;
  subidoPorId: string;
  fechaCarga: Date;
}

export function toDocumentoView(d: DocumentoTramite): DocumentoView {
  return {
    id: d.id,
    tramiteId: d.tramiteId,
    nombreArchivo: d.nombreArchivo,
    mimeType: d.mimeType,
    size: d.size,
    visibilidad: d.visibilidad,
    subidoPorTipo: d.subidoPorTipo,
    subidoPorId: d.subidoPorId,
    fechaCarga: d.fechaCarga,
  };
}
