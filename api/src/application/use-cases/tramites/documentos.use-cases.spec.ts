import { SubirDocumentoUseCase } from './subir-documento.use-case';
import { ListarDocumentosUseCase } from './listar-documentos.use-case';
import { DescargarDocumentoUseCase } from './descargar-documento.use-case';
import { EliminarDocumentoUseCase } from './eliminar-documento.use-case';
import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import {
  DocumentoTramiteRepository,
  NuevoDocumentoData,
} from '../../../domain/repositories/documento-tramite.repository';
import { StoragePort, ArchivoParaGuardar } from '../../ports/storage.port';
import { Tramite, TramiteProps } from '../../../domain/tramites/entities/tramite.entity';
import { DocumentoTramite } from '../../../domain/tramites/entities/documento-tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import {
  TramiteNoEncontradoError,
  ExternoNoParticipaError,
  VisibilidadNoPermitidaError,
  DocumentoNoEncontradoError,
  SinPermisoSobreDocumentoError,
} from '../../../domain/tramites/errors/tramite.errors';

function tramite(over: Partial<TramiteProps> = {}): Tramite {
  return new Tramite({
    id: 't1',
    numero: 'EXT-2026-00001',
    titulo: 'x',
    descripcion: 'y',
    origen: OrigenTramite.EXTERNO_INTERNO,
    estado: EstadoTramite.EN_REVISION,
    prioridad: PrioridadTramite.MEDIA,
    tipoTramiteId: 'tt1',
    areaActualId: 'areaA',
    usuarioAsignadoId: null,
    usuarioExternoId: 'ext1',
    creadoPorTipo: TipoUsuario.EXTERNO,
    creadoPorId: 'ext1',
    version: 0,
    fechaCreacion: new Date('2026-01-01'),
    fechaActualizacion: new Date('2026-01-02'),
    fechaCierre: null,
    ...over,
  });
}

function doc(
  over: Partial<ConstructorParameters<typeof DocumentoTramite>[0]> = {},
): DocumentoTramite {
  return new DocumentoTramite({
    id: 'd1',
    tramiteId: 't1',
    nombreArchivo: 'f.pdf',
    mimeType: 'application/pdf',
    size: 10,
    storageKey: 'key-1',
    visibilidad: Visibilidad.TODOS,
    subidoPorTipo: TipoUsuario.EXTERNO,
    subidoPorId: 'ext1',
    fechaCarga: new Date('2026-02-01'),
    ...over,
  });
}

class FakeDocRepo implements DocumentoTramiteRepository {
  creado?: NuevoDocumentoData;
  borrado?: string;
  porId: DocumentoTramite | null = null;
  lista: DocumentoTramite[] = [];
  create(data: NuevoDocumentoData): Promise<DocumentoTramite> {
    this.creado = data;
    return Promise.resolve(doc({ ...data }));
  }
  findById(): Promise<DocumentoTramite | null> {
    return Promise.resolve(this.porId);
  }
  listByTramite(): Promise<DocumentoTramite[]> {
    return Promise.resolve(this.lista);
  }
  delete(id: string): Promise<void> {
    this.borrado = id;
    return Promise.resolve();
  }
}

class FakeStorage implements StoragePort {
  guardado?: ArchivoParaGuardar;
  removido?: string;
  contenido: Buffer | null = Buffer.from('contenido');
  save(a: ArchivoParaGuardar): Promise<string> {
    this.guardado = a;
    return Promise.resolve('key-generada');
  }
  read(): Promise<Buffer | null> {
    return Promise.resolve(this.contenido);
  }
  remove(key: string): Promise<void> {
    this.removido = key;
    return Promise.resolve();
  }
}

const tramitesRepo = (t: Tramite | null) =>
  ({ findById: () => Promise.resolve(t) }) as unknown as TramiteRepository;

const externo = (id: string): Actor => ({ tipo: TipoUsuario.EXTERNO, id });
const interno = (rol: RolInterno, areaId: string, id = 'int1'): Actor => ({
  tipo: TipoUsuario.INTERNO,
  id,
  rol,
  areaId,
});

describe('SubirDocumentoUseCase', () => {
  it('404 si el trámite no existe', async () => {
    const uc = new SubirDocumentoUseCase(tramitesRepo(null), new FakeDocRepo(), new FakeStorage());
    await expect(
      uc.execute({
        tramiteId: 'x',
        actor: externo('ext1'),
        nombreArchivo: 'a',
        mimeType: 'text/plain',
        contenido: Buffer.from('a'),
      }),
    ).rejects.toBeInstanceOf(TramiteNoEncontradoError);
  });

  it('un externo ajeno no puede subir (403)', async () => {
    const uc = new SubirDocumentoUseCase(
      tramitesRepo(tramite()),
      new FakeDocRepo(),
      new FakeStorage(),
    );
    await expect(
      uc.execute({
        tramiteId: 't1',
        actor: externo('otro'),
        nombreArchivo: 'a',
        mimeType: 'text/plain',
        contenido: Buffer.from('a'),
      }),
    ).rejects.toBeInstanceOf(ExternoNoParticipaError);
  });

  it('un externo no puede subir un documento INTERNA (403)', async () => {
    const uc = new SubirDocumentoUseCase(
      tramitesRepo(tramite()),
      new FakeDocRepo(),
      new FakeStorage(),
    );
    await expect(
      uc.execute({
        tramiteId: 't1',
        actor: externo('ext1'),
        nombreArchivo: 'a',
        mimeType: 'text/plain',
        contenido: Buffer.from('a'),
        visibilidad: Visibilidad.INTERNA,
      }),
    ).rejects.toBeInstanceOf(VisibilidadNoPermitidaError);
  });

  it('guarda en storage, calcula size del buffer, default TODOS y NO expone storageKey', async () => {
    const docs = new FakeDocRepo();
    const storage = new FakeStorage();
    const uc = new SubirDocumentoUseCase(tramitesRepo(tramite()), docs, storage);
    const res = await uc.execute({
      tramiteId: 't1',
      actor: externo('ext1'),
      nombreArchivo: 'foto.png',
      mimeType: 'image/png',
      contenido: Buffer.from('hello'),
    });
    expect(storage.guardado?.nombreArchivo).toBe('foto.png');
    expect(docs.creado).toMatchObject({
      storageKey: 'key-generada',
      size: 5,
      visibilidad: Visibilidad.TODOS,
    });
    expect(res).not.toHaveProperty('storageKey');
    expect(res).not.toHaveProperty('props');
    expect(res).toMatchObject({ nombreArchivo: 'foto.png', size: 5 });
  });
});

describe('ListarDocumentosUseCase', () => {
  it('un externo no ve los documentos INTERNA', async () => {
    const docs = new FakeDocRepo();
    docs.lista = [
      doc({ id: 'd1', visibilidad: Visibilidad.TODOS }),
      doc({ id: 'd2', visibilidad: Visibilidad.INTERNA }),
      doc({ id: 'd3', visibilidad: Visibilidad.EXTERNA }),
    ];
    const uc = new ListarDocumentosUseCase(tramitesRepo(tramite()), docs);
    const res = await uc.execute({ tramiteId: 't1', actor: externo('ext1') });
    expect(res.map((d) => d.id)).toEqual(['d1', 'd3']);
    expect(res[0]).not.toHaveProperty('storageKey');
  });

  it('un interno ve todos los documentos', async () => {
    const docs = new FakeDocRepo();
    docs.lista = [
      doc({ id: 'd1', visibilidad: Visibilidad.TODOS }),
      doc({ id: 'd2', visibilidad: Visibilidad.INTERNA }),
    ];
    const uc = new ListarDocumentosUseCase(tramitesRepo(tramite()), docs);
    const res = await uc.execute({ tramiteId: 't1', actor: interno(RolInterno.OPERADOR, 'areaA') });
    expect(res.map((d) => d.id)).toEqual(['d1', 'd2']);
  });
});

describe('DescargarDocumentoUseCase', () => {
  it('404 si el documento no existe', async () => {
    const docs = new FakeDocRepo();
    docs.porId = null;
    const uc = new DescargarDocumentoUseCase(tramitesRepo(tramite()), docs, new FakeStorage());
    await expect(
      uc.execute({
        tramiteId: 't1',
        documentoId: 'nope',
        actor: interno(RolInterno.ADMIN, 'areaA'),
      }),
    ).rejects.toBeInstanceOf(DocumentoNoEncontradoError);
  });

  it('404 si el documento pertenece a otro trámite', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc({ tramiteId: 'otro' });
    const uc = new DescargarDocumentoUseCase(tramitesRepo(tramite()), docs, new FakeStorage());
    await expect(
      uc.execute({ tramiteId: 't1', documentoId: 'd1', actor: interno(RolInterno.ADMIN, 'areaA') }),
    ).rejects.toBeInstanceOf(DocumentoNoEncontradoError);
  });

  it('un externo no puede descargar un documento INTERNA (404, sin filtrar existencia)', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc({ visibilidad: Visibilidad.INTERNA });
    const uc = new DescargarDocumentoUseCase(tramitesRepo(tramite()), docs, new FakeStorage());
    await expect(
      uc.execute({ tramiteId: 't1', documentoId: 'd1', actor: externo('ext1') }),
    ).rejects.toBeInstanceOf(DocumentoNoEncontradoError);
  });

  it('devuelve metadatos + contenido', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc();
    const storage = new FakeStorage();
    storage.contenido = Buffer.from('PDFDATA');
    const uc = new DescargarDocumentoUseCase(tramitesRepo(tramite()), docs, storage);
    const res = await uc.execute({ tramiteId: 't1', documentoId: 'd1', actor: externo('ext1') });
    expect(res.documento).toMatchObject({ id: 'd1', mimeType: 'application/pdf' });
    expect(res.contenido.toString()).toBe('PDFDATA');
  });

  it('404 si el binario no está en el storage', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc();
    const storage = new FakeStorage();
    storage.contenido = null;
    const uc = new DescargarDocumentoUseCase(tramitesRepo(tramite()), docs, storage);
    await expect(
      uc.execute({ tramiteId: 't1', documentoId: 'd1', actor: externo('ext1') }),
    ).rejects.toBeInstanceOf(DocumentoNoEncontradoError);
  });
});

describe('EliminarDocumentoUseCase', () => {
  it('el que lo subió puede eliminarlo (borra registro y binario)', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc({
      subidoPorTipo: TipoUsuario.EXTERNO,
      subidoPorId: 'ext1',
      storageKey: 'key-1',
    });
    const storage = new FakeStorage();
    const uc = new EliminarDocumentoUseCase(tramitesRepo(tramite()), docs, storage);
    await uc.execute({ tramiteId: 't1', documentoId: 'd1', actor: externo('ext1') });
    expect(docs.borrado).toBe('d1');
    expect(storage.removido).toBe('key-1');
  });

  it('un ADMIN puede eliminar un documento ajeno', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc({ subidoPorTipo: TipoUsuario.EXTERNO, subidoPorId: 'ext1' });
    const storage = new FakeStorage();
    const uc = new EliminarDocumentoUseCase(tramitesRepo(tramite()), docs, storage);
    await uc.execute({
      tramiteId: 't1',
      documentoId: 'd1',
      actor: interno(RolInterno.ADMIN, 'areaA'),
    });
    expect(docs.borrado).toBe('d1');
  });

  it('un operador no-admin que no lo subió NO puede eliminarlo (403)', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc({ subidoPorTipo: TipoUsuario.EXTERNO, subidoPorId: 'ext1' });
    const uc = new EliminarDocumentoUseCase(tramitesRepo(tramite()), docs, new FakeStorage());
    await expect(
      uc.execute({
        tramiteId: 't1',
        documentoId: 'd1',
        actor: interno(RolInterno.OPERADOR, 'areaA'),
      }),
    ).rejects.toBeInstanceOf(SinPermisoSobreDocumentoError);
  });

  it('el externo participante NO puede eliminar un documento que subió un interno (403)', async () => {
    // ext1 participa (pasa la visibilidad) pero no subió el doc ni es admin.
    const docs = new FakeDocRepo();
    docs.porId = doc({ subidoPorTipo: TipoUsuario.INTERNO, subidoPorId: 'int1' });
    const uc = new EliminarDocumentoUseCase(tramitesRepo(tramite()), docs, new FakeStorage());
    await expect(
      uc.execute({ tramiteId: 't1', documentoId: 'd1', actor: externo('ext1') }),
    ).rejects.toBeInstanceOf(SinPermisoSobreDocumentoError);
  });

  it('404 si el documento no existe', async () => {
    const docs = new FakeDocRepo();
    docs.porId = null;
    const uc = new EliminarDocumentoUseCase(tramitesRepo(tramite()), docs, new FakeStorage());
    await expect(
      uc.execute({
        tramiteId: 't1',
        documentoId: 'nope',
        actor: interno(RolInterno.ADMIN, 'areaA'),
      }),
    ).rejects.toBeInstanceOf(DocumentoNoEncontradoError);
  });

  it('un externo NO puede sondear un documento INTERNA vía DELETE: 404, no 403 (no filtra existencia)', async () => {
    const docs = new FakeDocRepo();
    docs.porId = doc({
      visibilidad: Visibilidad.INTERNA,
      subidoPorTipo: TipoUsuario.INTERNO,
      subidoPorId: 'int1',
    });
    const uc = new EliminarDocumentoUseCase(tramitesRepo(tramite()), docs, new FakeStorage());
    await expect(
      uc.execute({ tramiteId: 't1', documentoId: 'd1', actor: externo('ext1') }),
    ).rejects.toBeInstanceOf(DocumentoNoEncontradoError);
  });
});
