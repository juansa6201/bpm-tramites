import { DocumentoTramite as DocumentoRow } from '@prisma/client';
import { DocumentoTramite } from '../../../domain/tramites/entities/documento-tramite.entity';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';

export class DocumentoTramiteMapper {
  static toDomain(row: DocumentoRow): DocumentoTramite {
    return new DocumentoTramite({
      id: row.id,
      tramiteId: row.tramiteId,
      nombreArchivo: row.nombreArchivo,
      mimeType: row.mimeType,
      size: row.size,
      storageKey: row.storageKey,
      visibilidad: row.visibilidad as Visibilidad,
      subidoPorTipo: row.subidoPorTipo as TipoUsuario,
      subidoPorId: row.subidoPorId,
      fechaCarga: row.fechaCarga,
    });
  }
}
