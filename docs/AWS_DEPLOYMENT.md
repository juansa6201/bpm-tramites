# AWS Deployment

Propuesta de despliegue de la plataforma en AWS.

## Arquitectura propuesta

> Diagrama y componentes:
> - **ECS Fargate** — contenedores de `api` y `web`.
> - **RDS PostgreSQL** — base de datos gestionada.
> - **ALB** — balanceador y enrutamiento (api / web).
> - **Secrets Manager** — secretos (DB, JWT, Azure, SMTP).
> - **CloudWatch Logs** — logs centralizados.
> - **S3 + CloudFront** — assets estáticos / adjuntos.
> - **WAF** — protección de borde.

_Pendiente._

## Estrategia de migraciones

> Cómo ejecutar `prisma migrate deploy` en el despliegue (task one-off / init container).

_Pendiente._

## Estrategia de rollback

> Rollback de servicios ECS (task definition anterior) y de la base de datos.

_Pendiente._

## Seguridad

> IAM, security groups, secretos, cifrado en tránsito y reposo, WAF.

_Pendiente._

## Costos / escalado

_Pendiente._
