import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';

describe('Infra: healthcheck + Swagger (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainExceptionFilter());

    // Mismo montaje de Swagger que main.ts.
    const config = new DocumentBuilder()
      .setTitle('BPM Trámites API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.get(PrismaService).$disconnect();
    await app.close();
  });

  it('GET /api/health → 200 con status ok y db up', async () => {
    const res = await request(server).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'up' });
  });

  it('GET /api/docs-json → documento OpenAPI con rutas', async () => {
    const res = await request(server).get('/api/docs-json').expect(200);
    expect(res.body.openapi).toEqual(expect.any(String));
    const paths = Object.keys(res.body.paths);
    expect(paths.some((p) => p.includes('/tramites'))).toBe(true);
    expect(paths.some((p) => p.includes('/health'))).toBe(true);
  });
});
