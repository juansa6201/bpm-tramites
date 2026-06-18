import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyMultipart from '@fastify/multipart';
import * as request from 'supertest';
import * as os from 'node:os';
import * as path from 'node:path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';

describe('Documentos (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let token: string;
  let tramiteId: string;

  const INT_EMAIL = 'e2e-doc-int@test.com';
  const CONTENIDO = 'contenido-de-prueba-123';

  beforeAll(async () => {
    process.env.STORAGE_DIR = path.join(os.tmpdir(), 'bpm-e2e-storage');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.register(fastifyMultipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    server = app.getHttpServer();
    prisma = app.get(PrismaService);

    const area = await prisma.area.upsert({
      where: { codigo: 'E2EDOC' },
      update: {},
      create: { nombre: 'E2E Doc Area', codigo: 'E2EDOC' },
    });
    const interno = await prisma.usuarioInterno.upsert({
      where: { email: INT_EMAIL },
      update: { activo: true, areaId: area.id, azureObjectId: 'azure-e2e-doc', rol: 'OPERADOR' },
      create: {
        nombre: 'E2E Doc Interno',
        email: INT_EMAIL,
        azureObjectId: 'azure-e2e-doc',
        rol: 'OPERADOR',
        areaId: area.id,
      },
    });
    const tipo = await prisma.tipoTramite.upsert({
      where: { codigo: 'E2EDOC-TIPO' },
      update: {},
      create: {
        codigo: 'E2EDOC-TIPO',
        nombre: 'E2E Doc Tipo',
        slaHoras: 48,
        areaInicialId: area.id,
      },
    });
    const tramite = await prisma.tramite.create({
      data: {
        numero: 'E2E-DOC-0001',
        titulo: 'Trámite doc e2e',
        descripcion: 'x',
        origen: 'INTERNO_INTERNO',
        estado: 'EN_REVISION',
        tipoTramiteId: tipo.id,
        areaActualId: area.id,
        creadoPorTipo: 'INTERNO',
        creadoPorId: interno.id,
      },
    });
    tramiteId = tramite.id;

    const login = await request(server)
      .post('/api/auth/internal/login')
      .send({ email: INT_EMAIL })
      .expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await prisma.documentoTramite.deleteMany({ where: { tramiteId } });
    await prisma.tramite.deleteMany({ where: { numero: 'E2E-DOC-0001' } });
    await prisma.tipoTramite.deleteMany({ where: { codigo: 'E2EDOC-TIPO' } });
    await prisma.usuarioInterno.deleteMany({ where: { email: INT_EMAIL } });
    await prisma.area.deleteMany({ where: { codigo: 'E2EDOC' } });
    await app.close();
  });

  it('roundtrip: subir → listar → descargar → borrar', async () => {
    // Subir
    const subida = await request(server)
      .post(`/api/tramites/${tramiteId}/documentos`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(CONTENIDO), { filename: 'prueba.txt', contentType: 'text/plain' })
      .expect(201);
    expect(subida.body).toMatchObject({ nombreArchivo: 'prueba.txt', size: CONTENIDO.length });
    expect(subida.body).not.toHaveProperty('storageKey');
    const documentoId = subida.body.id;

    // Listar
    const lista = await request(server)
      .get(`/api/tramites/${tramiteId}/documentos`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].id).toBe(documentoId);

    // Descargar
    const descarga = await request(server)
      .get(`/api/tramites/${tramiteId}/documentos/${documentoId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(descarga.headers['content-disposition']).toContain('prueba.txt');
    expect(descarga.text).toBe(CONTENIDO);

    // Borrar
    await request(server)
      .delete(`/api/tramites/${tramiteId}/documentos/${documentoId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Ya no está
    const vacio = await request(server)
      .get(`/api/tramites/${tramiteId}/documentos`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(vacio.body).toHaveLength(0);
  });

  it('subir sin archivo → 400', async () => {
    await request(server)
      .post(`/api/tramites/${tramiteId}/documentos`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('sin token → 401', async () => {
    await request(server).get(`/api/tramites/${tramiteId}/documentos`).expect(401);
  });
});
