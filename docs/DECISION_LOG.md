# Decision Log

Registro de las decisiones de diseño del BPM de Trámites, con su contexto y el
porqué. Formato por decisión:

> **Decisión** — qué se hizo · **Contexto** — qué la motivó · **Por qué** — el
> razonamiento · **Alternativas** — qué se descartó y por qué.

---

## 1. Contexto y alcance

El sistema gestiona trámites de oficina entre áreas internas, empleados internos
y usuarios externos, con tres circuitos: **Interno→Interno**, **Interno→Externo**
y **Externo→Interno**. El corazón del problema es un **workflow con estados,
transiciones y autorización por rol/área/propiedad**, auditable y consistente.

Las decisiones se ordenan de adentro hacia afuera (dominio → aplicación →
infraestructura → presentación) y cierran con los recortes asumidos.

---

## 2. Diseño del dominio

**Decisión.** Modelar el dominio con **entidades ricas + enums + servicios de
dominio puros**, sin clases de Value Object explícitas. Las piezas:

- **Entidades:** `Tramite` (raíz), `MovimientoTramite`, `ComentarioTramite`,
  `DocumentoTramite`, `TipoTramite`, `Area`, `UsuarioInterno`, `UsuarioExterno`.
- **Enums:** `EstadoTramite` (10 estados), `AccionMovimiento` (12 acciones),
  `OrigenTramite` (3 circuitos), `PrioridadTramite`, `Visibilidad`, `TipoUsuario`,
  `RolInterno`, `EstadoUsuarioExterno`.
- **Servicios de dominio (puros):** `WorkflowStateMachine` (matriz de
  transiciones), `SlaPolicy` (vencimiento de SLA), `TramiteVisibilidadService`
  (quién puede ver qué).
- **Interfaces de repositorio** declaradas en `domain/repositories`.
- **Jerarquía de errores** de negocio (`DomainError` y subtipos).

**Contexto.** Las reglas de transición y de visibilidad son el activo principal
y deben ser testeables de forma aislada, sin base ni framework.

**Por qué.** Mantener el dominio puro (sin Nest ni Prisma) permite cubrir cada
regla con tests unitarios rápidos y deja el "qué" del negocio separado del "cómo"
de la infraestructura. La lógica de transición se concentra en un servicio
declarativo en vez de dispersarse por la entidad o los controllers.

**Alternativas.** (a) Lógica de estado dentro de `Tramite`: se descartó porque la
matriz crece y conviene leerla declarativa y testearla sola. (b) Value Objects
para `Email`, `Numero`, etc.: se pospusieron (ver §12); para el alcance actual los
enums + invariantes en las entidades alcanzan.

---

## 3. Agregados

**Decisión.** `Tramite` es la **raíz de agregado**; su límite de consistencia
incluye al `MovimientoTramite`. Cada transición de estado persiste el cambio del
trámite **y** su movimiento en la misma transacción. `ComentarioTramite` y
`DocumentoTramite` cuelgan del trámite pero **no** son transiciones (no generan
movimiento) y se manejan por separado.

**Contexto.** El enunciado exige trazabilidad: toda transición debe quedar
registrada y nunca puede existir un cambio de estado sin su movimiento (ni
viceversa).

**Por qué.** Definir el agregado como `Tramite + movimientos` hace que esa
invariante sea natural: ambos se escriben atómicamente bajo la misma raíz (ver
§10). La entidad expone **mutaciones controladas** (`cambiarEstado`, `asignarA`,
`moverAArea`, `vincularExterno`, `registrarCierre`) y **reglas de lectura**
(`esTerminal`, `participaElExterno`, `perteneceAlArea`, `fueCreadoPor`), de modo
que el estado no se modifica "a mano" desde afuera.

**Alternativas.** Tratar comentarios/documentos como parte del mismo agregado
transaccional: se descartó porque no afectan la invariante de estado y agregarlos
al límite encarecería las operaciones sin beneficio.

---

## 4. Casos de uso

**Decisión.** **Un caso de uso explícito por acción de workflow**: `ingresar`,
`tomar`, `asignar`, `derivar`, `observar`, `responder-observacion`,
`solicitar-intervencion-externa`, `responder-intervencion-externa`, `aprobar`,
`rechazar`, `cerrar`, `cancelar`; más `crear`, `editar`, `eliminar`, `ver`,
`listar`, y los de comentarios, documentos, configuración, auth, dashboard y
usuarios externos.

**Contexto.** Cada acción tiene precondiciones, autorización y efectos distintos,
pero comparten una coreografía común.

**Por qué.** Un caso de uso por acción deja cada regla aislada, nombrada y
testeable, y evita un "servicio de trámites" gigante con flags. Todos son clases
planas (sin Nest) que reciben sus dependencias (puertos/repos) por constructor y
siguen el mismo patrón: **cargar → evaluar transición (`WorkflowStateMachine`) →
autorizar al actor → persistir atómicamente → registrar `MovimientoTramite`**. La
lógica repetida (resolver transición, autorizar actor, derivar rol, autorizar
visibilidad) vive en `workflow-helpers`.

**Alternativas.** Un único `TramiteService.transicionar(accion)` con `switch`: se
descartó por baja cohesión y por mezclar autorizaciones heterogéneas en un solo
punto.

---

## 5. Separación Clean Architecture / DDD

**Decisión.** Cuatro capas con dependencias en una sola dirección:

```
presentation → application → domain
infrastructure → domain   (implementa las interfaces)
domain → (nada externo)
```

- **domain:** entidades, enums, servicios de dominio, interfaces de repositorio,
  errores. Sin Nest, sin Prisma.
- **application:** casos de uso, DTOs de aplicación, **puertos** (`UnitOfWork`,
  `Clock`, `StoragePort`, `TokenService`, `PasswordHasher`,
  `InternalTokenIssuer/Verifier`).
- **infrastructure:** repos Prisma, `SystemClock`, storage, hashers, emisores/
  verificadores de token.
- **presentation:** controllers Nest, guards, exception filter, DTOs de request
  (class-validator).

**Contexto.** Requisito no negociable del proyecto: el dominio nunca conoce
infraestructura, y los repositorios son interfaces en `domain` implementadas en
`infrastructure`.

**Por qué.** La inversión de dependencias (la aplicación depende de la **interfaz**
del repositorio, no de la implementación Prisma) permite testear casos de uso con
fakes y cambiar la persistencia sin tocar el dominio. El cableado se hace en los
módulos Nest con **tokens `Symbol`** y providers `useFactory`, que es el único
lugar donde se eligen las implementaciones concretas.

**Alternativas.** Repositorios concretos inyectados directamente: se descartó
porque ataría la aplicación a Prisma y rompería la regla de dependencias.

---

## 6. Autenticación interna (mock de Entra ID)

**Decisión.** Modelar la identidad interna como **Azure Entra ID**, con un **mock
local** que emite un token con los **mismos claims** (`oid`, `email`, `roles`).
Un switch `AUTH_INTERNAL_MODE=mock|azure` elige entre validar el token mockeado o
tokens reales de Entra ID. El `LoginInternalMockUseCase` busca al interno por
email (seed) y emite el token vía el puerto `InternalTokenIssuer`; el guard lo
valida vía `InternalTokenVerifier` y re-mapea el claim `oid` al usuario interno.

**Contexto.** En una organización los empleados se autentican con su identidad
corporativa (Entra ID/MSAL), no con usuario/contraseña propios. Pero el entorno de
evaluación no tiene un tenant real.

**Por qué.** Poner la costura en los **puertos** `issuer`/`verifier` hace que pasar
a Entra ID real sea **configuración + otra implementación del verifier**, sin tocar
dominio ni casos de uso: el resto del stack ya trabaja con claims con la forma de
Entra ID. Con Entra ID real, el `LoginInternalMockUseCase` directamente desaparece
(el token lo emite Microsoft).

**Alternativas.** Login interno con contraseña propia: se descartó por no reflejar
el escenario real y por duplicar gestión de credenciales que la organización ya
resuelve con SSO.

---

## 7. Autenticación externa

**Decisión.** Los usuarios externos tienen **credenciales propias**: registro con
email + password (hash `bcrypt`) y login que emite un **JWT propio** (puerto
`TokenService`) con `{ sub, email, tipo: EXTERNO }`. El registro crea la cuenta en
estado `PENDIENTE_VERIFICACION`.

**Contexto.** Los externos no pertenecen a la organización, así que no entran por
Entra ID; el sistema debe gestionar su identidad.

**Por qué.** Un JWT propio mantiene a los externos completamente separados de la
identidad corporativa. En el login, **se devuelve el mismo error para "no existe"
y "password incorrecto"** (no se filtra cuál falló, evita enumeración de usuarios)
y **recién después** se evalúa el estado de la cuenta (bloqueado / no activo). El
backend distingue ambas identidades en un único guard de workflow
(`WorkflowAuthGuard`): intenta verificar el token como interno (claim `oid`) y, si
no, como externo, dejando `request.user` con el `tipo` correcto.

**Alternativas.** Magic link / OTP por email: se dejó fuera (ver §12); la costura
(estado `PENDIENTE_VERIFICACION`) queda lista para sumarlo. Un guard distinto por
tipo en cada endpoint de trámites: se descartó porque trámites es un terreno
compartido y un solo guard que normaliza la identidad simplifica los controllers.

---

## 8. Autorización por roles

**Decisión.** Autorización en **dos planos**, ambos en el servidor:

1. **Transición permitida** — `WorkflowStateMachine` codifica, por regla, qué
   `(tipoUsuario, rol)` puede ejecutar cada acción desde cada estado/origen
   (`rolesPermitidos`). Los externos no tienen rol; los internos se evalúan contra
   conjuntos (`OPERATIVOS`, `INGRESO`, `REASIGNADORES`).
2. **Alcance/visibilidad** — en los casos de uso y `TramiteVisibilidadService`:
   - Un **externo** solo ve y opera **sus** trámites (`usuarioExternoId` forzado
     en el filtro; `participaElExterno`).
   - Un **operador/mesa** ve los de **su área** (`perteneceAlArea`).
   - **Admin** y **auditor** ven todo; el **auditor es de solo lectura**.
   - Un **supervisor** puede reasignar/derivar en su área.
   - La configuración (tipos/áreas) exige interno (`requireInterno`) o admin
     (`requireAdmin`).

**Contexto.** Las reglas de "quién puede hacer qué" y "quién ve qué" son
distintas: una transición puede ser válida para el rol pero el trámite no ser de su
incumbencia (otra área / otro externo).

**Por qué.** Separar "transición válida" de "alcance" evita colar permisos en la
máquina de estados y permite el patrón **fail-closed** en el listado (si el alcance
no se puede acotar de forma segura, se devuelve vacío en vez de filtrar de más).
El front recibe `accionesPermitidas` calculadas por el server **solo como guía de
UI** (qué botones dibujar); **la autorización real se revalida al ejecutar**, así
la UI nunca es la fuente de verdad.

**Alternativas.** Autorizar en guards/decorators de Nest: se descartó porque las
reglas dependen de datos del trámite (área, externo asociado, estado), que el guard
no tiene; viven mejor en el caso de uso.

---

## 9. Validaciones

**Decisión.** Validación en **tres niveles**, cada uno con su responsabilidad:

1. **Forma/HTTP** en presentation: DTOs con `class-validator` + `ValidationPipe`
   (`whitelist` + `transform`) → **400** ante input mal formado.
2. **Reglas de negocio** en domain/application: máquina de estados, políticas y
   entidades lanzan `DomainError` → **422/403/404/409**.
3. **Integridad de datos:** unicidad (email/documento en uso, `numero` único)
   chequeada en los casos de uso y respaldada por constraints de la base.

El `DomainExceptionFilter` traduce cada categoría de error a su código HTTP
(`BusinessRuleError`→422, `NotFoundError`→404, `UnauthorizedError`→401,
`ForbiddenError`→403, `ConflictError`→409). Es el **único** lugar donde el dominio
"toca" HTTP, indirectamente.

**Contexto.** Mezclar validación de forma con reglas de negocio en los controllers
es la fuente típica de lógica duplicada y de errores con códigos inconsistentes.

**Por qué.** Cada nivel valida lo suyo: el pipe rechaza basura antes de llegar al
dominio; el dominio expresa las reglas sin saber de HTTP; un filtro central
garantiza el mapeo de códigos uniforme. Así las **validaciones de negocio quedan
fuera de los controllers**, como pide el proyecto.

**Alternativas.** Validar todo con `class-validator` en los DTOs: se descartó
porque las reglas de negocio dependen de estado y de la base, no solo del payload.

---

## 10. Transacciones

**Decisión.** Un puerto **`UnitOfWork`** (`runInTransaction`) implementado sobre
`prisma.$transaction`. Cada transición ejecuta, dentro de **una** transacción:
cargar el trámite → persistir el cambio de estado → crear el `MovimientoTramite`.
Si algo lanza, **rollback**.

**Contexto.** La invariante "toda transición genera un `MovimientoTramite`" solo
se sostiene si ambos cambios son atómicos: nunca un estado nuevo sin su rastro, ni
un movimiento sin el cambio.

**Por qué.** El `UnitOfWork` entrega **repositorios transaccionales** (las mismas
interfaces de dominio, ligadas a la transacción en curso), así el caso de uso
**coordina la transacción sin conocer Prisma**. La regla de negocio (atomicidad)
se cumple en la capa correcta y el detalle (`$transaction`) queda en
infraestructura.

**Alternativas.** Llamar a `prisma.$transaction` desde el caso de uso: se descartó
porque acoplaría la aplicación a Prisma, violando la dirección de dependencias.

---

## 11. Concurrencia

**Decisión.** Garantías **a nivel de base de datos**, sin locks de aplicación, con
tres mecanismos según el caso:

- **Compare-and-swap para `tomar`** (`tomarAtomico`): el `UPDATE` lleva en su
  `WHERE` el estado y el asignado **esperados** (los que se leyeron). La base lo
  ejecuta como una sola sentencia atómica con lock de fila, así que entre dos
  internos que toman a la vez **solo una matchea** (`count === 1` gana); el
  perdedor recibe `ConflictoDeConcurrenciaError` → **409**.
- **Bloqueo optimista por `version`** para el resto de updates: `updateMany`
  con `where: { id, version }` y `version: { increment: 1 }`; si otra operación ya
  cambió la versión, `count === 0` → **409**.
- **Reintento en la numeración:** `crear-tramite` deriva el `numero` del máximo
  existente y **reintenta hasta 3 veces** ante `NumeroDuplicadoError`, respaldado
  por un `@unique` en la base.

**Contexto.** El caso clásico del enunciado es "dos usuarios tomando el mismo
trámite a la vez". Y al numerar por máximo+1 hay una carrera natural.

**Por qué.** Delegar la atomicidad a la base (CAS / `version` / `unique`) evita
locks distribuidos y condiciones de carrera de tipo read-then-write. El conflicto
se hace explícito (409) y el cliente puede reintentar. Hay un test de concurrencia
para `tomar` que ejercita el CAS.

**Alternativas.** `SELECT ... FOR UPDATE` o un lock aplicativo: más costoso y
propenso a deadlocks; el CAS/optimista cubre el escenario con menos complejidad.

---

## 12. Trade-offs (qué recorté y por qué)

- **Sin Value Objects explícitos.** Se usaron enums + invariantes en entidades.
  _Por qué:_ alcanza para este tamaño de dominio. _Costo:_ validaciones como
  formato de email viven en DTOs, no en un tipo del dominio. En un dominio más
  grande agregaría VOs (`Email`, `Numero`).
- **`asignar` sin UI interna.** El endpoint existe, pero el portal interno expone
  `tomar` (autoasignación) y no el reasignar manual. _Por qué:_ cubre los tres
  circuitos con menos superficie; la reasignación por supervisor es el caso raro.
- **Verificación de externos no implementada.** El registro deja la cuenta en
  `PENDIENTE_VERIFICACION` y se activa **a mano** en la base. _Por qué:_ el flujo
  de email/OTP excede el alcance; la costura (estado + chequeo en login) ya está.
- **Tokens en `localStorage`** en los portales, en vez de cookies `httpOnly`.
  _Por qué:_ simplicidad para portales de muestra. _Costo:_ expuesto a XSS; en
  producción usaría cookies `httpOnly` + CSRF.
- **Guards de ruta client-side** (el token vive en el cliente), no middleware SSR.
- **Storage de documentos en filesystem** (`StoragePort` + adaptador local), no
  S3. _Por qué:_ el puerto abstrae el detalle; cambiar a S3 es otra implementación.
- **Email/notificaciones mockeadas** (`MAIL_MODE=mock`, log por consola).
- **Runtime Docker slim sin CLI de Prisma ni ts-node.** _Costo:_ migraciones y
  seeds se corren desde el host contra la DB dockerizada, no con `docker exec`.
- **`@mui/x-charts` fijado en su línea v7** por compatibilidad con MUI v6.
- **Métricas del dashboard con parte de agregación en memoria.** Aceptable para la
  escala esperada; con grandes volúmenes pasaría a agregaciones en SQL.

---

## 13. Verificación del checklist de aceptación

Verificado el **2026-06-18** levantando el entorno con `docker compose up -d
--build` (db + api + web _healthy_) y ejercitando el API en vivo, además de las
suites de test. Resultado: **22/23 ítems OK + 1 parcial**. Tests: **174 backend
(Jest)** y **22 frontend (Vitest)** en verde. Se recorrieron los tres circuitos
de punta a punta (crear → ingresar → tomar → observar/derivar → responder →
aprobar/rechazar → cerrar) confirmando que **cada transición generó su
`MovimientoTramite`** (p. ej. un trámite externo→interno cerró con 8 movimientos:
CREAR + 7 acciones).

### Parcial — códigos HTTP (matiz 422 vs 403)

Los cuatro códigos se manejan: **401** (sin token), **403** (externo sobre
endpoint interno), **404** (trámite inexistente) y **422** (transición inválida,
p. ej. `DERIVAR` sobre un `EXTERNO_INTERNO` → `TransicionInvalidaError`). El
matiz: que un **externo intente crear con un origen que no le corresponde**
(`INTERNO_INTERNO`) devuelve **403** (`OrigenNoPermitidoParaActorError`), no 422.
**Decisión:** el 422 se reserva para reglas de negocio / transiciones inválidas, y
"este actor no puede hacer esto" es **403**. Es consistente con el resto de la
autorización; no es un error de manejo.

### Caveat de datos (seed) — cobertura de roles por área

El recorrido expuso que **el seed no incluye un operador/supervisor en el área
"Mesa de Entrada"**, donde nacen los trámites `EXTERNO_INTERNO`. Como la
autorización exige rol **y** pertenencia al área, las acciones operativas
(`tomar`/`observar`/`aprobar`/`cerrar`) sobre esos trámites se ejecutaron con un
**ADMIN** (acceso cross-área); el operador (Legal) y el supervisor (Compras)
sembrados reciben **403 `SinPermisoSobreAreaError`** hasta que el trámite se
**deriva** a su área. **Es correcto a nivel de código** (la autorización por área
funciona); es un hueco de **datos de prueba**. _Mitigación:_ sumar al seed un
operador y un supervisor con área "Mesa de Entrada", o derivar a Legal antes de
operar.

---

## Documentación relacionada

- [Production Notes](PRODUCTION_NOTES.md) — validación en prod, métricas, logs, rollback.
- [AWS Deployment](AWS_DEPLOYMENT.md) — propuesta de despliegue.
