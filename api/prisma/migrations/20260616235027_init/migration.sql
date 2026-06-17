-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('INTERNO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "RolInterno" AS ENUM ('ADMIN', 'MESA_ENTRADA', 'OPERADOR', 'SUPERVISOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "EstadoUsuarioExterno" AS ENUM ('PENDIENTE_VERIFICACION', 'ACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "OrigenTramite" AS ENUM ('INTERNO_INTERNO', 'INTERNO_EXTERNO', 'EXTERNO_INTERNO');

-- CreateEnum
CREATE TYPE "EstadoTramite" AS ENUM ('BORRADOR', 'INGRESADO', 'EN_REVISION', 'OBSERVADO', 'ESPERANDO_EXTERNO', 'ESPERANDO_INTERNO', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "PrioridadTramite" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "AccionMovimiento" AS ENUM ('CREAR', 'INGRESAR', 'TOMAR', 'ASIGNAR', 'DERIVAR', 'OBSERVAR', 'RESPONDER_OBSERVACION', 'SOLICITAR_INTERVENCION_EXTERNA', 'RESPONDER_INTERVENCION_EXTERNA', 'APROBAR', 'RECHAZAR', 'CANCELAR', 'CERRAR');

-- CreateEnum
CREATE TYPE "Visibilidad" AS ENUM ('INTERNA', 'EXTERNA', 'TODOS');

-- CreateTable
CREATE TABLE "UsuarioInterno" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "azureObjectId" TEXT NOT NULL,
    "rol" "RolInterno" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "UsuarioInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioExterno" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "organizacion" TEXT,
    "estado" "EstadoUsuarioExterno" NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" TEXT,

    CONSTRAINT "UsuarioExterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTramite" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "requiereExterno" BOOLEAN NOT NULL DEFAULT false,
    "permiteInicioExterno" BOOLEAN NOT NULL DEFAULT false,
    "slaHoras" INTEGER NOT NULL,
    "areaInicialId" TEXT,

    CONSTRAINT "TipoTramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tramite" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "origen" "OrigenTramite" NOT NULL,
    "estado" "EstadoTramite" NOT NULL DEFAULT 'BORRADOR',
    "prioridad" "PrioridadTramite" NOT NULL DEFAULT 'MEDIA',
    "tipoTramiteId" TEXT NOT NULL,
    "areaActualId" TEXT,
    "usuarioAsignadoId" TEXT,
    "usuarioExternoId" TEXT,
    "creadoPorTipo" "TipoUsuario" NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3),

    CONSTRAINT "Tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoTramite" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "estadoAnterior" "EstadoTramite",
    "estadoNuevo" "EstadoTramite" NOT NULL,
    "areaAnteriorId" TEXT,
    "areaNuevaId" TEXT,
    "usuarioTipo" "TipoUsuario" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" "AccionMovimiento" NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoTramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoTramite" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "visibilidad" "Visibilidad" NOT NULL DEFAULT 'TODOS',
    "subidoPorTipo" "TipoUsuario" NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "fechaCarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoTramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioTramite" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "visibilidad" "Visibilidad" NOT NULL,
    "autorTipo" "TipoUsuario" NOT NULL,
    "autorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioTramite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioInterno_email_key" ON "UsuarioInterno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioInterno_azureObjectId_key" ON "UsuarioInterno"("azureObjectId");

-- CreateIndex
CREATE INDEX "UsuarioInterno_areaId_idx" ON "UsuarioInterno"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioExterno_email_key" ON "UsuarioExterno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioExterno_documento_key" ON "UsuarioExterno"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Area_codigo_key" ON "Area"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTramite_codigo_key" ON "TipoTramite"("codigo");

-- CreateIndex
CREATE INDEX "TipoTramite_areaInicialId_idx" ON "TipoTramite"("areaInicialId");

-- CreateIndex
CREATE UNIQUE INDEX "Tramite_numero_key" ON "Tramite"("numero");

-- CreateIndex
CREATE INDEX "Tramite_estado_idx" ON "Tramite"("estado");

-- CreateIndex
CREATE INDEX "Tramite_origen_idx" ON "Tramite"("origen");

-- CreateIndex
CREATE INDEX "Tramite_areaActualId_idx" ON "Tramite"("areaActualId");

-- CreateIndex
CREATE INDEX "Tramite_usuarioAsignadoId_idx" ON "Tramite"("usuarioAsignadoId");

-- CreateIndex
CREATE INDEX "Tramite_usuarioExternoId_idx" ON "Tramite"("usuarioExternoId");

-- CreateIndex
CREATE INDEX "Tramite_tipoTramiteId_idx" ON "Tramite"("tipoTramiteId");

-- CreateIndex
CREATE INDEX "MovimientoTramite_tramiteId_idx" ON "MovimientoTramite"("tramiteId");

-- CreateIndex
CREATE INDEX "MovimientoTramite_tramiteId_fecha_idx" ON "MovimientoTramite"("tramiteId", "fecha");

-- CreateIndex
CREATE INDEX "DocumentoTramite_tramiteId_idx" ON "DocumentoTramite"("tramiteId");

-- CreateIndex
CREATE INDEX "ComentarioTramite_tramiteId_idx" ON "ComentarioTramite"("tramiteId");

-- AddForeignKey
ALTER TABLE "UsuarioInterno" ADD CONSTRAINT "UsuarioInterno_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTramite" ADD CONSTRAINT "TipoTramite_areaInicialId_fkey" FOREIGN KEY ("areaInicialId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_tipoTramiteId_fkey" FOREIGN KEY ("tipoTramiteId") REFERENCES "TipoTramite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_areaActualId_fkey" FOREIGN KEY ("areaActualId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_usuarioAsignadoId_fkey" FOREIGN KEY ("usuarioAsignadoId") REFERENCES "UsuarioInterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_usuarioExternoId_fkey" FOREIGN KEY ("usuarioExternoId") REFERENCES "UsuarioExterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoTramite" ADD CONSTRAINT "MovimientoTramite_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoTramite" ADD CONSTRAINT "MovimientoTramite_areaAnteriorId_fkey" FOREIGN KEY ("areaAnteriorId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoTramite" ADD CONSTRAINT "MovimientoTramite_areaNuevaId_fkey" FOREIGN KEY ("areaNuevaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoTramite" ADD CONSTRAINT "DocumentoTramite_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioTramite" ADD CONSTRAINT "ComentarioTramite_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
