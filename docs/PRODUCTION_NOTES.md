# Production Notes

Notas operativas para validar y operar la plataforma en producción. Asumen el
despliegue descrito en [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) (ECS Fargate + RDS +
ALB + CloudWatch), pero la mayoría aplica a cualquier orquestador.

---

## Cómo validar en producción

**Health / readiness.** `GET /api/health` ejecuta `SELECT 1`: devuelve `200`
(`{"status":"ok","db":"up"}`) si la base responde y `503` si no. Sirve como health
check del ALB y de ECS. Conviene distinguir:

- **liveness:** el proceso está vivo (responde el puerto).
- **readiness:** además la DB está accesible (`/api/health` cubre esto).

**Smoke test post-deploy (automatizable).** Tras cada deploy, contra el entorno
real:

1. `GET /api/health` → 200 · `GET /api/docs` → 200 (Swagger).
2. Home web → 200 (carga el shell del portal).
3. Login interno de prueba → token · `GET /api/auth/internal/me` → 200.
4. Login externo (cuenta activa) → token · `GET /api/auth/me` → 200.
5. En **staging** con datos de prueba, un happy-path por circuito:
   - Externo→Interno: crear → ingresar → tomar → aprobar.
   - Interno→Externo: crear → solicitar intervención → responder → aprobar.
   - Interno→Interno: crear → ingresar → tomar → aprobar/rechazar.
6. `prisma migrate status` → sin migraciones pendientes.

**Despliegue gradual.** Rolling update de ECS con health checks; idealmente
canary/blue-green: enrutar un porcentaje a la versión nueva y observar error rate
y latencia antes de pasar al 100%.

---

## Métricas relevantes

**RED por endpoint** (técnicas):

- **Rate** — requests/s por ruta y método.
- **Errors** — % de 4xx y 5xx (separados).
- **Duration** — p50 / p95 / p99 (Fastify ya loguea el `responseTime` por request).

**Negocio** (varias ya las calcula `GET /api/dashboard`; en prod conviene
exponerlas también como métricas, p. ej. CloudWatch EMF):

- Trámites creados / cerrados por hora.
- Trámites por estado (gauge).
- **SLA vencidos** (gauge) y tiempo promedio de resolución.
- Transiciones por acción; tasa de rechazo / cancelación.

**Dominio / errores**:

- Conteo de **409** (conflictos de concurrencia), **422** (reglas de negocio),
  **403** (autorización), **401** (no autenticado).
- Logins exitosos / fallidos, separados por tipo (interno vs externo).

**Infra / DB**:

- Conexiones activas y uso del pool, latencia de queries, locks, almacenamiento.
- CPU/memoria por task, tasks healthy, latencia y 5xx del ALB.

---

## Logs relevantes

- **Formato:** JSON estructurado (Fastify/pino, ya activo con `logger: true`) a
  `stdout`, recolectado por el runtime (CloudWatch Logs).
- **Correlación:** propagar y loguear un request-id (`reqId` de Fastify) para
  seguir una request de punta a punta entre servicios.
- **Qué loguear:** transiciones de workflow (trámite, acción, estado
  anterior→nuevo, tipo de actor, resultado), eventos de auth (éxito/fallo, tipo),
  4xx de negocio con su código y ruta, 5xx con stack, conflictos 409.
- **Qué NO loguear:** contraseñas, tokens/JWT, hashes, ni PII innecesaria. El error
  de login es **genérico a propósito** (no revela si falló el usuario o la
  contraseña).
- **Niveles:** `info` para el flujo normal, `warn` para 4xx de negocio, `error`
  para 5xx y fallos de infraestructura. Definir retención según política de datos.

---

## Alertas mínimas

| Alerta               | Condición sugerida                                    |
| -------------------- | ----------------------------------------------------- |
| API caída            | health falla N checks seguidos / tasks unhealthy      |
| DB sin conexión      | `/api/health` 503 o errores de conexión               |
| Pool saturado        | conexiones cerca del máximo de RDS                    |
| Tasa de 5xx          | 5xx > umbral en ventana móvil                         |
| Latencia degradada   | p99 por encima del SLO                                |
| Posible fuerza bruta | pico de 401 / logins fallidos por IP o usuario        |
| Contención anómala   | pico de 409                                           |
| SLA en riesgo        | salto en la cantidad de SLA vencidos                  |
| Capacidad            | storage de documentos / disco de RDS cerca del límite |
| TLS                  | certificados próximos a expirar                       |
| Deploy               | error al aplicar migraciones                          |

---

## Riesgos conocidos

- **DB como punto único de falla.** Mitigar con Multi-AZ + backups automáticos y
  PITR.
- **Migraciones incompatibles.** Una migración destructiva rompe la versión vieja
  durante el rolling deploy → usar **expand-contract** (ver Rollback).
- **Crecimiento del almacenamiento de documentos.** El adaptador local
  (`StoragePort` → filesystem) no escala; en prod va a S3.
- **Agregación en memoria del dashboard.** Aceptable a baja escala; con volumen
  alto, mover a agregaciones SQL / vistas materializadas.
- **Fuga de secretos.** `JWT_SECRET` o credenciales de DB → rotación + Secrets
  Manager (nunca en el repo; `.env` está ignorado).
- **Entra ID (modo `azure`).** Clock skew, rotación de claves (JWKS) y config de
  `issuer`/`audience`: validar tolerancia y caché de JWKS.
- **CORS mal configurado.** Un `WEB_ORIGIN` incorrecto bloquea el portal o abre de
  más (en prod, mismo origen vía ALB evita el problema, ver AWS doc).
- **Imagen slim sin CLI de Prisma.** Las migraciones/seed no corren dentro del
  contenedor de runtime; se resuelven con una task migradora dedicada.
- **Tokens en `localStorage`** (portales). Expuesto a XSS; endurecer con CSP y, a
  futuro, cookies `httpOnly`.

---

## Rollback

**Aplicación.** Deploy inmutable por **tag de imagen** (idealmente el SHA de git).
El rollback es re-apuntar el servicio ECS a la **task definition anterior**; ECS
hace rolling update inverso. Conservar las imágenes previas en ECR.

**Base de datos — expand / contract.**

1. **Expand:** cada migración es **retrocompatible** (agregar columnas/tablas
   nullable, índices; no renombrar ni eliminar lo que la versión vieja usa). Vieja
   y nueva coexisten.
2. **Migrate + deploy:** correr la migración **antes** de desplegar la app nueva.
3. **Contract:** las eliminaciones/renombres se hacen en un release **posterior**,
   una vez que la versión nueva está estable.

Con migraciones retrocompatibles, **el rollback de la app no requiere rollback de
la DB**. Por eso se evitan cambios destructivos en el mismo release.

**Datos.** Para incidentes de datos, restore por **PITR** de RDS a un punto previo
(último recurso, con downtime).

---

## Monitoreo

- **Dashboards:** RED por servicio (api / web), salud de ECS y RDS, y métricas de
  negocio (trámites por estado, SLA vencidos).
- **Uptime / sintético:** checks externos periódicos a `/api/health` y a la home.
- **Tracing / APM:** instrumentar con OpenTelemetry / AWS X-Ray para ver la
  latencia por capa (controller → caso de uso → DB).
- **Container Insights** para CPU/memoria/red por task.

---

## Seguridad

- **Secretos** fuera del código y del repo, en Secrets Manager, con rotación
  periódica de `JWT_SECRET` y credenciales de DB.
- **Identidades separadas:** internos por Entra ID (modo `azure`), externos por
  JWT propio. El `WorkflowAuthGuard` valida cada tipo y la **autorización fina vive
  en los casos de uso**, no en la UI (que solo recibe `accionesPermitidas` como
  guía y se revalida en el server).
- **Transporte:** TLS extremo a extremo (ACM en CloudFront/ALB), HSTS.
- **Borde:** WAF (rate limiting + reglas OWASP), CORS con allowlist (`WEB_ORIGIN`),
  límite de tamaño de subida (ya hay tope de 10 MB en multipart).
- **Credenciales:** passwords con `bcrypt`, login **sin enumeración de usuarios**;
  sumar lockout / rate-limit de login.
- **Datos:** la visibilidad `INTERNA`/`EXTERNA`/`TODOS` se respeta en el server
  (los externos nunca ven `INTERNA`); los documentos se descargan **autenticados**
  (sin URL pública directa) o vía S3 con URLs firmadas.
- **Menor privilegio:** IAM por servicio, security groups mínimos, DB en subred
  privada sin acceso público.
- **Cadena de suministro:** escaneo de dependencias e imágenes (ECR scan) y sin PII
  en logs.
