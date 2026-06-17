import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;

  const EXT_EMAIL = 'e2e-ext@test.com';
  const EXT_PASSWORD = 'Externo123!';
  const INT_EMAIL = 'e2e-int@test.com';

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

    // Datos de prueba idempotentes, aislados del seed general.
    const area = await prisma.area.upsert({
      where: { codigo: 'E2E' },
      update: {},
      create: { nombre: 'E2E Area', codigo: 'E2E' },
    });
    const passwordHash = await bcrypt.hash(EXT_PASSWORD, 10);
    await prisma.usuarioExterno.upsert({
      where: { email: EXT_EMAIL },
      update: { estado: 'ACTIVO', passwordHash },
      create: {
        nombre: 'E2E Externo',
        email: EXT_EMAIL,
        documento: 'E2E-DOC-1',
        estado: 'ACTIVO',
        passwordHash,
      },
    });
    await prisma.usuarioInterno.upsert({
      where: { email: INT_EMAIL },
      update: { activo: true, areaId: area.id, azureObjectId: 'azure-e2e-int', rol: 'OPERADOR' },
      create: {
        nombre: 'E2E Interno',
        email: INT_EMAIL,
        azureObjectId: 'azure-e2e-int',
        rol: 'OPERADOR',
        areaId: area.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.usuarioInterno.deleteMany({ where: { email: INT_EMAIL } });
    await prisma.usuarioExterno.deleteMany({ where: { email: EXT_EMAIL } });
    await prisma.area.deleteMany({ where: { codigo: 'E2E' } });
    await app.close();
  });

  it('login externo OK → 200 + accessToken', async () => {
    const res = await request(server)
      .post('/api/auth/external/login')
      .send({ email: EXT_EMAIL, password: EXT_PASSWORD })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.usuario.tipo).toBe('EXTERNO');
    expect(res.body.usuario.email).toBe(EXT_EMAIL);
  });

  it('login externo con credenciales inválidas → 401', async () => {
    await request(server)
      .post('/api/auth/external/login')
      .send({ email: EXT_EMAIL, password: 'incorrecta' })
      .expect(401);
  });

  it('acceso a ruta interna con token externo → 403', async () => {
    const login = await request(server)
      .post('/api/auth/external/login')
      .send({ email: EXT_EMAIL, password: EXT_PASSWORD })
      .expect(200);

    await request(server)
      .get('/api/auth/internal/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(403);
  });

  it('mapeo de identidad interna → /auth/internal/me devuelve el interno mapeado', async () => {
    const login = await request(server)
      .post('/api/auth/internal/login')
      .send({ email: INT_EMAIL })
      .expect(200);

    const me = await request(server)
      .get('/api/auth/internal/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(me.body.tipo).toBe('INTERNO');
    expect(me.body.email).toBe(INT_EMAIL);
    expect(me.body.rol).toBe('OPERADOR');
    expect(me.body.areaId).toEqual(expect.any(String));
  });
});
