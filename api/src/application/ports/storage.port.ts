/** Archivo a persistir en el almacenamiento de binarios. */
export interface ArchivoParaGuardar {
  contenido: Buffer;
  nombreArchivo: string;
  mimeType: string;
}

/**
 * Puerto de almacenamiento de binarios (INTERFACE en application).
 * La implementación (disco local, S3, ...) vive en infrastructure. El dominio
 * y los casos de uso solo manejan un `storageKey` opaco.
 */
export interface StoragePort {
  /** Guarda el contenido y devuelve la clave opaca para recuperarlo. */
  save(archivo: ArchivoParaGuardar): Promise<string>;
  /** Lee el contenido por su clave; null si no existe. */
  read(storageKey: string): Promise<Buffer | null>;
  /** Elimina el binario; no falla si ya no existe. */
  remove(storageKey: string): Promise<void>;
}
