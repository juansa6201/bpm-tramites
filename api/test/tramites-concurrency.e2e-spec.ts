import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';
import { PrismaTramiteRepository } from '../src/infrastructure/persistence/repositories/prisma-tramite.repository';
import { EstadoTramite } from '../src/domain/tramites/enums/estado-tramite.enum';

describe('Tomar trámite - concurrencia (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;

  const INT_EMAIL = 'cc-admin@test.com';
  const AZURE_OID = 'azure-cc-admin';
  let areaId: string;
  let tipoId: string;
  let externoId: string;
  let adminId: string;
  let numeroSeq = 0;

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
      where: { codigo: 'E2E-CC' },
      update: {},
      create: { nombre: 'E2E Concurrencia', codigo: 'E2E-CC' },
    });
    areaId = area.id;

    const admin = await prisma.usuarioInterno.upsert({
      where: { email: INT_EMAIL },
      update: { activo: true, areaId, azureObjectId: AZURE_OID, rol: 'ADMIN' },
      create: {
        nombre: 'CC Admin',
        email: INT_EMAIL,
        azureObjectId: AZURE_OID,
        rol: 'ADMIN',
        areaId,
      },
    });
    adminId = admin.id;

    const tipo = await prisma.tipoTramite.upsert({
      where: { codigo: 'E2E-CC-TIPO' },
      update: {},
      create: { codigo: 'E2E-CC-TIPO', nombre: 'Tipo CC', slaHoras: 24, areaInicialId: areaId },
    });
    tipoId = tipo.id;

    const externo = await prisma.usuarioExterno.upsert({
      where: { email: 'cc-ext@test.com' },
      update: { estado: 'ACTIVO' },
      create: {
        nombre: 'CC Externo',
        email: 'cc-ext@test.com',
        documento: 'CC-DOC-1',
        estado: 'ACTIVO',
      },
    });
    externoId = externo.id;
  });

  afterAll(async () => {
    await prisma.movimientoTramite.deleteMany({ where: { tramite: { tipoTramiteId: tipoId } } });
    await prisma.tramite.deleteMany({ where: { tipoTramiteId: tipoId } });
    await prisma.tipoTramite.deleteMany({ where: { codigo: 'E2E-CC-TIPO' } });
    await prisma.usuarioInterno.deleteMany({ where: { email: INT_EMAIL } });
    await prisma.usuarioExterno.deleteMany({ where: { email: 'cc-ext@test.com' } });
    await prisma.area.deleteMany({ where: { codigo: 'E2E-CC' } });
    await app.close();
  });

  /** Crea un trámite fresco en INGRESADO (Externo→Interno) y devuelve su id. */
  async function crearTramiteIngresado(): Promise<string> {
    numeroSeq += 1;
    const t = await prisma.tramite.create({
      data: {
        numero: `CC-${numeroSeq}-${externoId.slice(0, 4)}`,
        titulo: 'Trámite concurrencia',
        descripcion: 'test',
        origen: 'EXTERNO_INTERNO',
        estado: 'INGRESADO',
        prioridad: 'MEDIA',
        tipoTramiteId: tipoId,
        areaActualId: areaId,
        usuarioExternoId: externoId,
        creadoPorTipo: 'EXTERNO',
        creadoPorId: externoId,
      },
    });
    return t.id;
  }

  async function loginAdmin(): Promise<string> {
    const res = await request(server)
      .post('/api/auth/internal/login')
      .send({ email: INT_EMAIL })
      .expect(200);
    return res.body.accessToken;
  }

  it('compare-and-swap: solo el primer claim gana (determinista)', async () => {
    const id = await crearTramiteIngresado();
    const repo = new PrismaTramiteRepository(prisma);

    // Dos "racers" leyeron el mismo estado esperado (INGRESADO, sin asignar).
    const primero = await repo.tomarAtomico({
      id,
      estadoEsperado: EstadoTramite.INGRESADO,
      usuarioAsignadoEsperado: null,
      estadoNuevo: EstadoTramite.EN_REVISION,
      usuarioAsignadoId: adminId,
    });
    const segundo = await repo.tomarAtomico({
      id,
      estadoEsperado: EstadoTramite.INGRESADO,
      usuarioAsignadoEsperado: null,
      estadoNuevo: EstadoTramite.EN_REVISION,
      usuarioAsignadoId: 'otro-usuario',
    });

    expect(primero).toBe(true);
    expect(segundo).toBe(false); // el estado ya no es INGRESADO → no matchea

    const row = await prisma.tramite.findUnique({ where: { id } });
    expect(row?.estado).toBe('EN_REVISION');
    expect(row?.usuarioAsignadoId).toBe(adminId); // ganó el primero
  });

  it('carrera HTTP: 5 TOMAR concurrentes → exactamente uno gana', async () => {
    const id = await crearTramiteIngresado();
    const token = await loginAdmin();

    const respuestas = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(server)
          .post(`/api/tramites/${id}/tomar`)
          .set('Authorization', `Bearer ${token}`)
          .send({}),
      ),
    );

    const codigos = respuestas.map((r) => r.status);
    const exitos = codigos.filter((c) => c === 200);
    const conflictos = codigos.filter((c) => c === 409 || c === 422);

    expect(exitos).toHaveLength(1); // un solo ganador
    expect(conflictos).toHaveLength(4); // el resto rechazado (409/422)

    // Estado final consistente: tomado una sola vez.
    const row = await prisma.tramite.findUnique({ where: { id } });
    expect(row?.estado).toBe('EN_REVISION');
    expect(row?.usuarioAsignadoId).toBe(adminId);

    const movs = await prisma.movimientoTramite.count({
      where: { tramiteId: id, accion: 'TOMAR' },
    });
    expect(movs).toBe(1); // exactamente un MovimientoTramite de TOMAR
  });
});
