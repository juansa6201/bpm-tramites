# Decision Log

Registro de decisiones de diseño del proyecto BPM de Trámites.

## 1. Diseño del dominio

> Modelo del dominio BPM: entidades (Tramite, TipoTramite, Area, MovimientoTramite,
> DocumentoTramite, ComentarioTramite, UsuarioInterno, UsuarioExterno), value objects
> y reglas de negocio.

_Pendiente._

## 2. Agregados

> Definición de agregados y raíces de agregado. (p. ej. `Tramite` como raíz que
> controla sus movimientos, comentarios y documentos.)

_Pendiente._

## 3. Casos de uso

> Un caso de uso explícito por acción de workflow. Listado y responsabilidad de cada uno.

_Pendiente._

## 4. Separación Clean Architecture / DDD

> Capas domain / application / infrastructure / presentation. Reglas de dependencia.
> El dominio no importa Prisma. Repositorios como interfaces en domain.

_Pendiente._

## 5. Estrategia de autenticación interna / externa

> Internos: Azure Entra ID / MSAL (o mock seguro documentado). Externos: JWT propio
> (email+password / magic link / OTP). Cómo el backend distingue ambas identidades.

_Pendiente._

## 6. Estrategia de autorización

> Roles internos, permisos externos, reglas por área y por propiedad del trámite.
> Guards separados internos/externos.

_Pendiente._

## 7. Validaciones

> Validaciones de dominio fuera de controllers. Mapeo a códigos HTTP (422/401/403/404).

_Pendiente._

## 8. Transacciones

> Atomicidad de las transiciones de estado. Toda transición genera un MovimientoTramite.

_Pendiente._

## 9. Concurrencia

> Control para que no haya dos usuarios tomando el mismo trámite simultáneamente.

_Pendiente._

## 10. Trade-offs

> Decisiones de compromiso tomadas y alternativas descartadas.

_Pendiente._
