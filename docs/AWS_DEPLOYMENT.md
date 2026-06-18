# AWS Deployment

Propuesta de despliegue de la plataforma en AWS: **ECS Fargate + RDS PostgreSQL +
ALB + Secrets Manager + CloudWatch + S3/CloudFront + WAF**, con estrategia de
migraciones y rollback. Complementa [PRODUCTION_NOTES.md](PRODUCTION_NOTES.md).

---

## Arquitectura propuesta

```
                         Internet
                            │
                      ┌─────▼─────┐
                      │ Route 53  │  DNS
                      └─────┬─────┘
                  ┌─────────▼──────────┐
                  │ CloudFront  + WAF  │  TLS (ACM), caché de estáticos
                  └───┬────────────┬───┘
        /_next/static,│            │  /*  y  /api/*
         documentos   │            │
                ┌─────▼────┐   ┌───▼──────────────┐
                │   S3     │   │       ALB        │  HTTPS (ACM)
                │ docs +   │   └───┬──────────┬───┘
                │ assets   │   /api/*        /*  (default)
                └──────────┘   ┌───▼───┐   ┌──▼────┐
                               │ ECS   │   │ ECS   │  Fargate · subredes privadas
                               │ api   │   │ web   │  (autoscaling)
                               │ :3001 │   │ :3000 │
                               └───┬───┘   └───────┘
                                   │ (security group)
                            ┌──────▼───────┐
                            │ RDS Postgres │  Multi-AZ · subred privada
                            └──────────────┘

   Soporte: ECR (imágenes) · Secrets Manager · CloudWatch (logs/metrics/alarms)
            · KMS (cifrado) · NAT Gateway (egress privado)
```

**Mismo origen, sin CORS en prod.** El ALB enruta por path: `/api/*` al servicio
`api` y el resto al `web`. Así el navegador habla con la API en el **mismo
dominio** (`https://app.example.com/api`), eliminando CORS. `NEXT_PUBLIC_API_URL`
se hornea en build con ese valor; `WEB_ORIGIN` se mantiene por defensa en
profundidad.

**Nota sobre `web`.** El front es **Next standalone (SSR)**, así que corre como
contenedor en Fargate detrás del ALB; CloudFront va adelante para TLS, WAF y caché
de `/_next/static`. (Si fuera export estático, sería solo S3 + CloudFront.)

---

## Componentes

| Componente          | Rol                  | Notas de configuración                                                                                                                           |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Route 53**        | DNS                  | Registros A/AAAA alias a CloudFront.                                                                                                             |
| **CloudFront**      | CDN / borde          | TLS (ACM en us-east-1), caché de estáticos, OAC hacia S3. WAF asociado.                                                                          |
| **WAF**             | Protección de borde  | Managed rules (OWASP), rate-limiting, bloqueo por reputación/geo si aplica.                                                                      |
| **ALB**             | Balanceo + routing   | Listener HTTPS (ACM). Reglas: `/api/*` → TG api (health `/api/health`), default → TG web (health `/`).                                           |
| **ECS Fargate**     | Cómputo              | Cluster con servicios `api` (3001) y `web` (3000) en subredes privadas; autoscaling por CPU/requests; imágenes de ECR.                           |
| **RDS PostgreSQL**  | Base de datos        | Multi-AZ, subred privada, cifrado en reposo (KMS), backups automáticos + PITR. SG que solo admite a las tasks de ECS.                            |
| **Secrets Manager** | Secretos             | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AZURE_*`, `MAIL_*`. Inyectados a la task con `secrets` (`valueFrom`).                       |
| **S3**              | Archivos             | Bucket privado para documentos subidos (adaptador S3 del `StoragePort`) y, opcionalmente, assets. Acceso por CloudFront (OAC) y/o URLs firmadas. |
| **CloudWatch**      | Observabilidad       | Logs (driver `awslogs`), métricas, alarmas, Container Insights, dashboards.                                                                      |
| **ECR**             | Registro de imágenes | Imágenes `api` y `web` versionadas por SHA; scan on push.                                                                                        |
| **VPC**             | Red                  | 2+ AZ; subredes públicas (ALB, NAT) y privadas (ECS, RDS).                                                                                       |

---

## Configuración y secretos

- **Secretos** (Secrets Manager) → se montan como variables de entorno de la task
  vía `secrets[].valueFrom`, nunca en la imagen ni en el repo.
- **Config no sensible** (p. ej. `AUTH_INTERNAL_MODE`, `API_PORT`, `NODE_ENV`,
  `WEB_ORIGIN`) → SSM Parameter Store o `environment` de la task.
- **`NEXT_PUBLIC_API_URL`** es build-time (se inlinea): la imagen de `web` es
  específica por entorno; se construye con la URL pública correspondiente.
- **Storage:** reemplazar el adaptador local por uno de **S3** detrás del mismo
  `StoragePort` (sin cambios en dominio/aplicación, por la inversión de
  dependencias).

---

## CI/CD (pipeline sugerido)

1. **Build & test:** lint, unit (Jest/Vitest), build de ambas imágenes.
2. **Push a ECR** con tag = SHA de git.
3. **Migraciones:** ejecutar la **task migradora** (`prisma migrate deploy`) y
   abortar el pipeline si falla.
4. **Deploy:** actualizar las task definitions de `api` y `web` (rolling update con
   health checks).
5. **Smoke tests** post-deploy (ver Production Notes); si fallan, rollback
   automático.

---

## Estrategia de migraciones

La imagen de runtime es **slim y no incluye la CLI de Prisma** (solo el cliente
generado), así que las migraciones **no** corren en el contenedor de la app. Se
usa una **task migradora dedicada**:

- Una imagen de _tooling_ (o el **stage builder** del `api/Dockerfile`, que sí
  tiene `prisma` + `prisma/migrations`) se ejecuta como **ECS RunTask one-off**
  (o un step de CodeBuild) que corre `prisma migrate deploy` contra RDS.
- Se ejecuta **antes** de desplegar la versión nueva de la app, y el deploy queda
  **condicionado** a que las migraciones terminen OK.
- Las migraciones son **expand-contract / retrocompatibles**, de modo que la
  versión vieja sigue funcionando mientras el rolling update reemplaza tasks.

Flujo: `build → push ECR → RunTask(migrate deploy) → update servicios ECS →
smoke tests`.

---

## Estrategia de rollback

**Servicios (ECS).** Imágenes inmutables por tag (SHA). El rollback es actualizar
el servicio a la **revisión de task definition anterior**; ECS hace el rolling
update inverso. Se conservan las imágenes previas en ECR. Para `web`, invalidar la
caché de CloudFront si cambiaron estáticos.

**Base de datos.** Gracias al **expand-contract**, revertir la app a la versión
anterior **no requiere revertir la DB** (el esquema nuevo es compatible con la
versión vieja). Los cambios destructivos (_contract_: drop/rename) se hacen en un
release posterior, ya estable. Para incidentes de datos: **PITR**/snapshot de RDS
como último recurso.

---

## Observabilidad

- **CloudWatch Logs** (JSON estructurado de Fastify/pino vía `awslogs`),
  **métricas** y **alarmas** (ver Production Notes), **Container Insights** para
  recursos por task.
- **Tracing** con AWS X-Ray / OpenTelemetry (controller → caso de uso → DB).
- **Canaries** sintéticos (CloudWatch Synthetics) sobre `/api/health` y la home.

---

## Seguridad

- **Red:** ECS y RDS en **subredes privadas**; solo el ALB y CloudFront están
  expuestos. Security groups de menor privilegio (ALB→ECS, ECS→RDS).
- **Identidad/permisos:** **IAM task roles** acotados (acceso solo a sus secretos y
  a su bucket S3); sin credenciales estáticas.
- **Cifrado:** en reposo (KMS en RDS y S3) y en tránsito (TLS de punta a punta con
  ACM). HSTS en CloudFront.
- **Secretos:** Secrets Manager con rotación; nada en la imagen ni en el repo.
- **Borde:** WAF (OWASP managed rules + rate limiting); S3 privado con OAC (sin
  acceso público), documentos vía URLs firmadas.
- **Cadena de suministro:** ECR scan on push; imágenes mínimas (multi-stage slim).

---

## Costos / escalado

- **Fargate:** autoscaling _target tracking_ (CPU/requests). Posible **Fargate
  Spot** para tareas tolerantes (p. ej. `web`) y bajar costo.
- **RDS:** dimensionar según carga; **read replica** si las lecturas (bandeja,
  dashboard) lo justifican; pausar/escalar entornos no productivos.
- **CloudFront:** la caché de estáticos reduce carga de origen y costo de egress.
- **Logs:** retención acotada y filtros para controlar el costo de CloudWatch.
