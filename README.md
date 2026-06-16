# BPM de Trámites de Oficina

Plataforma BPM interna/externa para gestionar trámites entre áreas, empleados
internos y usuarios externos. Soporta tres circuitos:

- **Interno → Interno**
- **Interno → Externo**
- **Externo → Interno**

## Stack

| Capa | Tecnologías |
|------|-------------|
| Backend | NestJS · Fastify · Prisma · PostgreSQL · Jest |
| Frontend | Next.js · React 19 · TypeScript · Material UI · Formik · Yup · Vitest |
| Arquitectura | Clean Architecture + DDD (domain / application / infrastructure / presentation) |
| Infra | Docker Compose · ESLint · Prettier · Husky · Lint-Staged · Conventional Commits |

## Estructura del repo

```
.
├── api/                 # Backend NestJS (Clean Architecture + DDD)
├── web/                 # Frontend Next.js (portales interno y externo)
├── docs/
│   ├── DECISION_LOG.md
│   ├── PRODUCTION_NOTES.md
│   └── AWS_DEPLOYMENT.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## Cómo levantar con Docker

```bash
cp .env.example .env      # completá las variables si hace falta
docker compose up -d --build
```

URLs esperadas:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend (API) | http://localhost:3001/api |
| Swagger / OpenAPI | http://localhost:3001/api/docs |
| Healthcheck | http://localhost:3001/api/health |

## Migraciones Prisma

```bash
docker compose exec api npx prisma migrate deploy   # aplicar migraciones
docker compose exec api npx prisma migrate dev      # crear/aplicar en desarrollo
```

## Seeds

```bash
docker compose exec api npm run seed
```

Carga: 3 áreas, 5 usuarios internos, 3 usuarios externos, 4 tipos de trámite,
10 trámites en distintos estados, historial de movimientos, comentarios
(internos y externos) y documentos simulados.

## Tests

```bash
# Backend (Jest)
docker compose exec api npm run test          # unit
docker compose exec api npm run test:e2e      # integración

# Frontend (Vitest)
docker compose exec web npm run test
```

## Acceso a los portales

- **Portal interno:** http://localhost:3000/interno
- **Portal externo:** http://localhost:3000/externo

### Credenciales seed

> _Pendiente de completar al generar los seeds._

| Tipo | Email | Password / método | Rol |
|------|-------|-------------------|-----|
| Interno | _por definir_ | mock Azure | ADMIN |
| Externo | _por definir_ | email + password | — |

## Endpoints principales

> Documentación completa en Swagger: `http://localhost:3001/api/docs`

- `POST /api/auth/external/register` · `POST /api/auth/external/login` · `GET /api/auth/me`
- `GET /api/auth/internal/me`
- `GET|POST /api/tramites` · `GET|PUT|DELETE /api/tramites/:id`
- Workflow: `POST /api/tramites/:id/{ingresar|tomar|asignar|derivar|observar|responder-observacion|solicitar-intervencion-externa|responder-intervencion-externa|aprobar|rechazar|cerrar|cancelar}`
- `GET|POST /api/tramites/:id/documentos` · `GET|POST /api/tramites/:id/comentarios`
- `GET|POST|PUT /api/tipos-tramite` · `GET|POST|PUT /api/areas`
- `GET /api/dashboard`

## Supuestos funcionales

## Documentación técnica

- [Decision Log](docs/DECISION_LOG.md) — diseño de dominio, agregados, Clean Architecture/DDD, auth, trade-offs.
- [Production Notes](docs/PRODUCTION_NOTES.md) — validación en prod, métricas, logs, alertas, rollback.
- [AWS Deployment](docs/AWS_DEPLOYMENT.md) — propuesta de despliegue en AWS.
