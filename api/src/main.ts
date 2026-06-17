import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';

async function bootstrap() {
  // Creamos la app usando el adapter de Fastify (en lugar del de Express).
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

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

  const port = Number(process.env.API_PORT ?? 3001);

  // '0.0.0.0' es necesario para aceptar conexiones desde fuera del contenedor.
  await app.listen(port, '0.0.0.0');
}

bootstrap();
