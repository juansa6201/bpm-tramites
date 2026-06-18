import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';

async function bootstrap() {
  // Creamos la app usando el adapter de Fastify (en lugar del de Express).
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Subida de archivos (documentos): habilita req.file() en los controllers.
  await app.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB, un archivo por request
  });

  // Todas las rutas quedan bajo /api (ej: /api/health, /api/auth/...).
  app.setGlobalPrefix('api');

  // Validación de DTOs de request (whitelist + transform).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Mapea los errores de dominio a códigos HTTP (401/403/404/422).
  app.useGlobalFilters(new DomainExceptionFilter());

  // Documentación OpenAPI en /api/docs (JSON en /api/docs-json).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BPM Trámites API')
    .setDescription('Gestión de trámites de oficina entre áreas internas, empleados y externos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.API_PORT ?? 3001);

  // '0.0.0.0' es necesario para aceptar conexiones desde fuera del contenedor.
  await app.listen(port, '0.0.0.0');
}

bootstrap();
