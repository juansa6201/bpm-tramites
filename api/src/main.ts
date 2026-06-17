import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  // Creamos la app usando el adapter de Fastify (en lugar del de Express).
  // El tipo genérico NestFastifyApplication expone la API tipada de Fastify.
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Todas las rutas quedan bajo /api (ej: /api/health, /api/tramites).
  app.setGlobalPrefix('api');

  const port = Number(process.env.API_PORT ?? 3001);

  // '0.0.0.0' es necesario para que Fastify acepte conexiones desde fuera
  // del contenedor cuando corre en Docker (no solo localhost).
  await app.listen(port, '0.0.0.0');
}

bootstrap();
