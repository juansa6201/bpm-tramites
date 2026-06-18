# BPM de Trámites de Oficina

Plataforma BPM interna/externa para gestionar trámites entre áreas, empleados
internos y usuarios externos. Soporta tres circuitos:

- **Interno → Interno**
- **Interno → Externo**
- **Externo → Interno**

## Stack

| Capa         | Tecnologías                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| Backend      | NestJS · Fastify · Prisma · PostgreSQL · Jest                                   |
| Frontend     | Next.js · React 19 · TypeScript · Material UI · Formik · Yup · Vitest           |
| Arquitectura | Clean Architecture + DDD (domain / application / infrastructure / presentation) |
| Infra        | Docker Compose · ESLint · Prettier · Husky · Lint-Staged · Conventional Commits |

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

## Requisitos

- **Docker** y **Docker Compose v2** para levantar el stack.
- **Node 20** (`nvm use 20`) solo si vas a correr migraciones, seeds o tests
  desde el host (las imágenes de runtime son slim y no incluyen las CLIs de dev).

## Cómo levantar con Docker

```bash
cp .env.example .env        # completá las variables si hace falta
docker compose up -d --build
```

Esto construye y levanta tres servicios: `db` (PostgreSQL), `api` (NestJS) y
`web` (Next.js). Las imágenes son **multi-stage**: build completo + runtime slim
(la API genera el cliente Prisma, el front usa `output: standalone`).

URLs esperadas:

| Servicio          | URL                              |
| ----------------- | -------------------------------- |
| Frontend          | http://localhost:3000            |
| Backend (API)     | http://localhost:3001/api        |
| Swagger / OpenAPI | http://localhost:3001/api/docs   |
| Healthcheck       | http://localhost:3001/api/health |

> `NEXT_PUBLIC_API_URL` se **inyecta en build** (el navegador llama a la API
> desde el host), por eso viaja como build-arg en `docker-compose.yml`.

Para frenar todo: `docker compose down` (agregá `-v` para borrar también el
volumen de la base).

## Migraciones

La base corre en Docker y expone el puerto `5432`. Las migraciones se aplican
desde el host (el `.env` de `api/` ya apunta a `localhost:5432`):

```bash
cd api
npm ci                      # solo la primera vez
npm run prisma:generate     # genera el cliente Prisma
npm run prisma:deploy       # aplica las migraciones existentes (prisma migrate deploy)
# en desarrollo, para crear una migración nueva:
npm run prisma:migrate      # prisma migrate dev
```

> El contenedor `api` usa una imagen slim sin la CLI de Prisma, por eso las
> tareas administrativas (migrar/seed) se corren desde el host contra la DB
> dockerizada, no con `docker compose exec`.

## Seeds

```bash
cd api
npm run seed                # prisma db seed (ts-node prisma/seed.ts)
```

Carga: 3 áreas, 5 usuarios internos (uno por rol), 3 usuarios externos (uno por
estado), 4 tipos de trámite y 10 trámites en distintos estados, con su historial
de movimientos, comentarios (internos y externos) y documentos simulados. Es
idempotente: limpia las tablas antes de insertar.

## Tests

```bash
# Backend (Jest)
cd api
npm test                    # unit (dominio + aplicación)
npm run test:e2e            # integración (necesita la DB arriba)

# Frontend (Vitest + Testing Library)
cd web
npm run test:run            # formularios, bandeja, timeline, acciones, guards
```

> Los e2e levantan el `AppModule` real y usan un schema de test sobre la DB de
> Docker. Asegurate de tener `db` arriba (`docker compose up -d db`).

## Acceso a los portales

- **Portal interno:** http://localhost:3000/interno
  Login mock por email (sin contraseña), simula Azure Entra ID.
- **Portal externo:** http://localhost:3000/externo
  Login por email + contraseña, o alta en http://localhost:3000/externo/registro.

Los dos portales tienen layouts diferenciados (el externo con otra paleta y sin
navegación de áreas) y guardan su JWT por separado, así una sesión interna y una
externa pueden convivir.

## Credenciales seed

### Usuarios internos (login solo por email)

| Email                  | Rol          | Área            |
| ---------------------- | ------------ | --------------- |
| `admin@bpm.local`      | ADMIN        | Legal           |
| `supervisor@bpm.local` | SUPERVISOR   | Compras         |
| `operador@bpm.local`   | OPERADOR     | Legal           |
| `mesa@bpm.local`       | MESA_ENTRADA | Mesa de Entrada |
| `auditor@bpm.local`    | AUDITOR      | Legal           |

### Usuarios externos (login por email + contraseña)

Contraseña de los tres: **`Externo123!`**

| Email                  | Estado                 | ¿Puede ingresar?         |
| ---------------------- | ---------------------- | ------------------------ |
| `carlos@proveedor.com` | ACTIVO                 | ✅ Sí                    |
| `paula@empresa.com`    | PENDIENTE_VERIFICACION | ❌ No (cuenta no activa) |
| `beto@externo.com`     | BLOQUEADO              | ❌ No (bloqueado)        |

> Una cuenta externa recién registrada nace en `PENDIENTE_VERIFICACION`. La
> verificación no está implementada: se activa manualmente en la base
> (`estado = 'ACTIVO'`) antes de poder ingresar.

## Endpoints principales

> Documentación completa e interactiva en Swagger: `http://localhost:3001/api/docs`

**Auth**

- `POST /api/auth/internal/login` · `GET /api/auth/internal/me`
- `POST /api/auth/external/register` · `POST /api/auth/external/login` · `POST /api/auth/external/logout` · `GET /api/auth/me`

**Trámites**

- `GET|POST /api/tramites` · `GET|PUT|DELETE /api/tramites/:id`
- Workflow: `POST /api/tramites/:id/{ingresar|tomar|asignar|derivar|observar|responder-observacion|solicitar-intervencion-externa|responder-intervencion-externa|aprobar|rechazar|cerrar|cancelar}`
- `GET|POST /api/tramites/:id/comentarios`
- `GET|POST /api/tramites/:id/documentos` · `GET|DELETE /api/tramites/:id/documentos/:documentoId`

**Configuración y catálogos**

- `GET|POST|PUT /api/tipos-tramite` · `GET /api/tipos-tramite/iniciables-externos`
- `GET|POST|PUT /api/areas`
- `GET /api/usuarios-externos`

**Otros**

- `GET /api/dashboard` · `GET /api/health`

## Supuestos funcionales

- **Auth interna mockeada:** el login interno por email simula Azure Entra ID /
  MSAL y emite un token con la misma forma (claims `oid`/`email`/`roles`). En
  producción el token lo emite Microsoft y este caso de uso desaparece.
- **Alta de externos manual:** el registro crea la cuenta en
  `PENDIENTE_VERIFICACION`. No hay flujo de verificación por email, la activación
  es manual en la base.
- **Tokens en `localStorage`:** decisión deliberada para los portales de muestra.
  En producción se preferirían cookies `httpOnly`.
- **SLA calculado en el server:** a partir de `tipo.slaHoras`. Un trámite está
  vencido si `ahora > fechaCreacion + slaHoras` y no está en un estado terminal.
- **Acciones permitidas calculadas en el server:** el detalle devuelve solo las
  acciones que el actor puede ejecutar según estado, rol y participación. El front
  solo dibuja eso (una sola fuente de verdad).
- **Reglas de visibilidad:**
  - Un externo solo ve y opera sus propios trámites.
  - Un operador/mesa interno ve los trámites de su área.
  - Un admin y un auditor ven todo; el auditor es de solo lectura.
  - Un supervisor puede reasignar trámites de su área.
  - Los comentarios/documentos `INTERNA` nunca se muestran a externos.
- **Toda transición de estado genera un `MovimientoTramite`** y se ejecuta de
  forma atómica (un caso de uso por acción de workflow).
- **Almacenamiento de documentos local:** adaptador de filesystem
  (`api/storage/`), no S3. La visibilidad (`INTERNA`/`EXTERNA`/`TODOS`) define
  quién ve cada comentario o documento.
- **Email/notificaciones mockeadas** (`MAIL_MODE=mock`): se loguean por consola
  en desarrollo.

## Documentación técnica

- [Decision Log](docs/DECISION_LOG.md) — diseño de dominio, agregados, Clean Architecture/DDD, auth, trade-offs.
- [Production Notes](docs/PRODUCTION_NOTES.md) — validación en prod, métricas, logs, alertas, rollback.
- [AWS Deployment](docs/AWS_DEPLOYMENT.md) — propuesta de despliegue en AWS.
