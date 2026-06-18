import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { ArchivoParaGuardar, StoragePort } from '../../application/ports/storage.port';

/**
 * Almacenamiento de binarios en disco local. Implementa StoragePort.
 *
 * El `storageKey` es un nombre opaco (uuid + extensión) bajo STORAGE_DIR.
 *
 * Para producción se reemplazaría por un adapter S3 que implemente el MISMO
 * StoragePort (put/get/delete con @aws-sdk/client-s3), sin tocar dominio,
 * casos de uso ni controllers: solo se cambia el provider en el módulo.
 */
@Injectable()
export class LocalDiskStorage implements StoragePort {
  private readonly baseDir =
    process.env.STORAGE_DIR ?? path.join(process.cwd(), 'storage', 'documentos');

  async save(archivo: ArchivoParaGuardar): Promise<string> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const storageKey = `${randomUUID()}${path.extname(archivo.nombreArchivo)}`;
    await fs.writeFile(this.rutaDe(storageKey), archivo.contenido);
    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.rutaDe(storageKey));
    } catch (e) {
      if (this.esNoExiste(e)) return null;
      throw e;
    }
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await fs.unlink(this.rutaDe(storageKey));
    } catch (e) {
      if (!this.esNoExiste(e)) throw e;
    }
  }

  /** Resuelve la ruta y evita path traversal fuera de baseDir. */
  private rutaDe(storageKey: string): string {
    const dir = path.resolve(this.baseDir);
    const ruta = path.resolve(dir, path.basename(storageKey));
    // basename() ya quita separadores; este guard cubre el borde '..' y deja
    // la ruta siempre como hija directa de baseDir (defensa en profundidad).
    if (path.dirname(ruta) !== dir) {
      throw new Error('storageKey inválido');
    }
    return ruta;
  }

  private esNoExiste(e: unknown): boolean {
    return (e as NodeJS.ErrnoException)?.code === 'ENOENT';
  }
}
