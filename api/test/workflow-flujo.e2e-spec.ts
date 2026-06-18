import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';

/**
 * Suite de integración del flujo Externo→Interno y de las reglas de autorización.
 * Cubre los tests obligatorios del enunciado (la concurrencia vive en
 * tramites-concurrency.e2e-spec.ts). Corre contra el esquema de TEST aislado.
 */
describe('Workflow flujo completo (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;

  const EXT_EMAIL = 'flujo-ext@test.com';
  const AJENO_EMAIL = 'flujo-ajeno@test.com';
  const INT_EMAIL = 'flujo-int@test.com';
  const PASSWORD = 'Externo123!';

  let extToken: string;
  let ajenoToken: string;
  let intToken: string;
  let tipoId: string;
  let tramiteId: string;

  async function loginExterno(email: string): Promise<string> {
    const res = await request(server)
      .post('/api/auth/external/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return res.body.accessToken;
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
      where: { codigo: 'FLUJO' },
      update: {},
      create: { nombre: 'Flujo Area', codigo: 'FLUJO' },
    });
    const tipo = await prisma.tipoTramite.upsert({
      where: { codigo: 'FLUJO-TIPO' },
      update: { permiteInicioExterno: true, areaInicialId: area.id },
      create: {
        codigo: 'FLUJO-TIPO',
        nombre: 'Flujo Tipo',
        slaHoras: 48,
        permiteInicioExterno: true,
        areaInicialId: area.id,
      },
    });
    tipoId = tipo.id;

    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await prisma.usuarioExterno.upsert({
      where: { email: EXT_EMAIL },
      update: { estado: 'ACTIVO', passwordHash },
      create: {
        nombre: 'Flujo Externo',
        email: EXT_EMAIL,
        documento: 'FLUJO-1',
        estado: 'ACTIVO',
        passwordHash,
      },
    });
    await prisma.usuarioExterno.upsert({
      where: { email: AJENO_EMAIL },
      update: { estado: 'ACTIVO', passwordHash },
      create: {
        nombre: 'Flujo Ajeno',
        email: AJENO_EMAIL,
        documento: 'FLUJO-2',
        estado: 'ACTIVO',
        passwordHash,
      },
    });
    await prisma.usuarioInterno.upsert({
      where: { email: INT_EMAIL },
      update: { activo: true, areaId: area.id, azureObjectId: 'azure-flujo-int', rol: 'OPERADOR' },
      create: {
        nombre: 'Flujo Interno',
        email: INT_EMAIL,
        azureObjectId: 'azure-flujo-int',
        rol: 'OPERADOR',
        areaId: area.id,
      },
    });

    ajenoToken = await loginExterno(AJENO_EMAIL);
    const intLogin = await request(server)
      .post('/api/auth/internal/login')
      .send({ email: INT_EMAIL })
      .expect(200);
    intToken = intLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.movimientoTramite.deleteMany({ where: { tramite: { tipoTramiteId: tipoId } } });
    await prisma.comentarioTramite.deleteMany({ where: { tramite: { tipoTramiteId: tipoId } } });
    await prisma.tramite.deleteMany({ where: { tipoTramiteId: tipoId } });
    await prisma.tipoTramite.deleteMany({ where: { codigo: 'FLUJO-TIPO' } });
    await prisma.usuarioInterno.deleteMany({ where: { email: INT_EMAIL } });
    await prisma.usuarioExterno.deleteMany({ where: { email: { in: [EXT_EMAIL, AJENO_EMAIL] } } });
    await prisma.area.deleteMany({ where: { codigo: 'FLUJO' } });
    await app.close();
  });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('1. login externo → 200 + accessToken', async () => {
    extToken = await loginExterno(EXT_EMAIL);
    expect(extToken).toEqual(expect.any(String));
  });

  it('2. crear trámite externo → 201, estado BORRADOR', async () => {
    const res = await request(server)
      .post('/api/tramites')
      .set(auth(extToken))
      .send({
        tipoTramiteId: tipoId,
        titulo: 'Solicitud externa',
        descripcion: 'Necesito un trámite',
        origen: 'EXTERNO_INTERNO',
      })
      .expect(201);
    tramiteId = res.body.id;
    expect(res.body.estado).toBe('BORRADOR');
  });

  it('3. ingresar (externo) → INGRESADO', async () => {
    const res = await request(server)
      .post(`/api/tramites/${tramiteId}/ingresar`)
      .set(auth(extToken))
      .send({})
      .expect(200);
    expect(res.body.estadoNuevo).toBe('INGRESADO');
  });

  it('4. tomar trámite interno → EN_REVISION', async () => {
    const res = await request(server)
      .post(`/api/tramites/${tramiteId}/tomar`)
      .set(auth(intToken))
      .send({})
      .expect(200);
    expect(res.body.estadoNuevo).toBe('EN_REVISION');
  });

  it('5. observar trámite → OBSERVADO', async () => {
    const res = await request(server)
      .post(`/api/tramites/${tramiteId}/observar`)
      .set(auth(intToken))
      .send({ comentario: 'Falta documentación' })
      .expect(200);
    expect(res.body.estadoNuevo).toBe('OBSERVADO');
  });

  it('6. responder observación como externo → INGRESADO', async () => {
    const res = await request(server)
      .post(`/api/tramites/${tramiteId}/responder-observacion`)
      .set(auth(extToken))
      .send({ comentario: 'Adjunto lo solicitado' })
      .expect(200);
    expect(res.body.estadoNuevo).toBe('INGRESADO');
  });

  it('7. aprobar trámite (tomar de nuevo y aprobar) → APROBADO', async () => {
    await request(server)
      .post(`/api/tramites/${tramiteId}/tomar`)
      .set(auth(intToken))
      .send({})
      .expect(200);
    const res = await request(server)
      .post(`/api/tramites/${tramiteId}/aprobar`)
      .set(auth(intToken))
      .send({})
      .expect(200);
    expect(res.body.estadoNuevo).toBe('APROBADO');
  });

  it('8. consultar historial → timeline con la secuencia del workflow', async () => {
    const res = await request(server)
      .get(`/api/tramites/${tramiteId}`)
      .set(auth(intToken))
      .expect(200);
    expect(res.body.estado).toBe('APROBADO');
    const acciones = res.body.movimientos.map((m: { accion: string }) => m.accion);
    expect(acciones).toEqual([
      'CREAR',
      'INGRESAR',
      'TOMAR',
      'OBSERVAR',
      'RESPONDER_OBSERVACION',
      'TOMAR',
      'APROBAR',
    ]);
  });

  it('9. un externo NO ve trámites ajenos (403 en detalle, su lista solo tiene los propios)', async () => {
    // Detalle del trámite del otro externo → 403.
    await request(server).get(`/api/tramites/${tramiteId}`).set(auth(ajenoToken)).expect(403);

    // El ajeno crea uno propio: así su lista NO es vacía y la aserción no es vacua.
    const propio = await request(server)
      .post('/api/tramites')
      .set(auth(ajenoToken))
      .send({
        tipoTramiteId: tipoId,
        titulo: 'Del ajeno',
        descripcion: 'x',
        origen: 'EXTERNO_INTERNO',
      })
      .expect(201);

    const lista = await request(server).get('/api/tramites').set(auth(ajenoToken)).expect(200);
    const ids = lista.body.items.map((t: { id: string }) => t.id);
    expect(ids).toContain(propio.body.id); // ve el suyo
    expect(ids).not.toContain(tramiteId); // no ve el ajeno
  });

  it('10. 403 en acción no permitida (un externo intenta TOMAR, acción interna)', async () => {
    // Trámite fresco en INGRESADO para que TOMAR exista pero sea solo de internos.
    const creado = await request(server)
      .post('/api/tramites')
      .set(auth(extToken))
      .send({ tipoTramiteId: tipoId, titulo: 'Otro', descripcion: 'x', origen: 'EXTERNO_INTERNO' })
      .expect(201);
    await request(server)
      .post(`/api/tramites/${creado.body.id}/ingresar`)
      .set(auth(extToken))
      .send({})
      .expect(200);

    await request(server)
      .post(`/api/tramites/${creado.body.id}/tomar`)
      .set(auth(extToken))
      .send({})
      .expect(403);
  });
});
