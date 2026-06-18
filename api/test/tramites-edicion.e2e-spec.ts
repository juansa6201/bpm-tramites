import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';

describe('Tramites edición / borrado (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let token: string;
  let areaId: string;
  let tipoId: string;
  let adminId: string;

  const ADMIN_EMAIL = 'e2e-edit-admin@test.com';

  async function nuevoTramite(estado: 'BORRADOR' | 'EN_REVISION', numero: string) {
    const t = await prisma.tramite.create({
      data: {
        numero,
        titulo: 'orig',
        descripcion: 'orig',
        origen: 'INTERNO_INTERNO',
        estado,
        tipoTramiteId: tipoId,
        areaActualId: areaId,
        creadoPorTipo: 'INTERNO',
        creadoPorId: adminId,
      },
    });
    return t.id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    server = app.getHttpServer();
    prisma = app.get(PrismaService);

    const area = await prisma.area.upsert({
      where: { codigo: 'E2EEDIT' },
      update: {},
      create: { nombre: 'E2E Edit Area', codigo: 'E2EEDIT' },
    });
    areaId = area.id;
    const admin = await prisma.usuarioInterno.upsert({
      where: { email: ADMIN_EMAIL },
      update: { activo: true, areaId, azureObjectId: 'azure-e2e-edit-admin', rol: 'ADMIN' },
      create: {
        nombre: 'E2E Edit Admin',
        email: ADMIN_EMAIL,
        azureObjectId: 'azure-e2e-edit-admin',
        rol: 'ADMIN',
        areaId,
      },
    });
    adminId = admin.id;
    const tipo = await prisma.tipoTramite.upsert({
      where: { codigo: 'E2EEDIT-TIPO' },
      update: {},
      create: {
        codigo: 'E2EEDIT-TIPO',
        nombre: 'E2E Edit Tipo',
        slaHoras: 48,
        areaInicialId: areaId,
      },
    });
    tipoId = tipo.id;

    const login = await request(server)
      .post('/api/auth/internal/login')
      .send({ email: ADMIN_EMAIL })
      .expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await prisma.tramite.deleteMany({ where: { tipoTramiteId: tipoId } });
    await prisma.tipoTramite.deleteMany({ where: { codigo: 'E2EEDIT-TIPO' } });
    await prisma.usuarioInterno.deleteMany({ where: { email: ADMIN_EMAIL } });
    await prisma.area.deleteMany({ where: { codigo: 'E2EEDIT' } });
    await app.close();
  });

  it('PUT edita titulo/descripcion/prioridad de un BORRADOR', async () => {
    const id = await nuevoTramite('BORRADOR', 'E2E-EDIT-0001');
    const res = await request(server)
      .put(`/api/tramites/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'nuevo', descripcion: 'nueva', prioridad: 'ALTA' })
      .expect(200);
    expect(res.body).toMatchObject({ titulo: 'nuevo', descripcion: 'nueva', prioridad: 'ALTA' });
  });

  it('PUT titulo en EN_REVISION → 422, pero prioridad → 200', async () => {
    const id = await nuevoTramite('EN_REVISION', 'E2E-EDIT-0002');
    await request(server)
      .put(`/api/tramites/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'no permitido' })
      .expect(422);
    await request(server)
      .put(`/api/tramites/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ prioridad: 'BAJA' })
      .expect(200);
  });

  it('DELETE de un no-BORRADOR (admin) → soft delete: 204 y luego 404', async () => {
    const id = await nuevoTramite('EN_REVISION', 'E2E-EDIT-0003');
    await request(server)
      .delete(`/api/tramites/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    // Soft-deleted → invisible en las lecturas.
    await request(server)
      .get(`/api/tramites/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    // La fila se conserva (auditoría).
    const fila = await prisma.tramite.findUnique({ where: { id } });
    expect(fila?.eliminadoEn).toBeInstanceOf(Date);
  });

  it('DELETE de un BORRADOR → hard delete: 204, fila borrada', async () => {
    const id = await nuevoTramite('BORRADOR', 'E2E-EDIT-0004');
    await request(server)
      .delete(`/api/tramites/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    await request(server)
      .get(`/api/tramites/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    const fila = await prisma.tramite.findUnique({ where: { id } });
    expect(fila).toBeNull();
  });
});
