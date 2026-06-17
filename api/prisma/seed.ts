/**
 * Seed de datos para desarrollo.
 *
 * Crea:
 *  - 3 áreas
 *  - 5 usuarios internos (uno por rol)
 *  - 3 usuarios externos (uno por estado)
 *  - 4 tipos de trámite
 *  - 10 trámites (uno por cada estado) con sus MovimientoTramite,
 *    comentarios (internos y externos) y documentos simulados.
 *
 * Es idempotente: limpia las tablas antes de insertar.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Fecha base para ordenar cronológicamente los movimientos.
const BASE = new Date('2026-05-01T09:00:00.000Z');
const addH = (h: number) => new Date(BASE.getTime() + h * 3600_000);

const numero = (prefix: string, n: number) => `${prefix}-2026-${String(n).padStart(5, '0')}`;

async function main() {
  // ---- Limpieza (respetando orden de FKs) ----
  await prisma.comentarioTramite.deleteMany();
  await prisma.documentoTramite.deleteMany();
  await prisma.movimientoTramite.deleteMany();
  await prisma.tramite.deleteMany();
  await prisma.tipoTramite.deleteMany();
  await prisma.usuarioInterno.deleteMany();
  await prisma.usuarioExterno.deleteMany();
  await prisma.area.deleteMany();

  // ============================ ÁREAS ============================
  const mesaArea = await prisma.area.create({
    data: { nombre: 'Mesa de Entrada', codigo: 'MESA', activa: true },
  });
  const legal = await prisma.area.create({
    data: { nombre: 'Legal', codigo: 'LEGAL', activa: true },
  });
  const compras = await prisma.area.create({
    data: { nombre: 'Compras', codigo: 'COMPRAS', activa: true },
  });

  // ====================== USUARIOS INTERNOS ======================
  const admin = await prisma.usuarioInterno.create({
    data: {
      nombre: 'Ana Admin',
      email: 'admin@bpm.local',
      azureObjectId: 'azure-admin-0001',
      rol: 'ADMIN',
      areaId: legal.id,
    },
  });
  const mesa = await prisma.usuarioInterno.create({
    data: {
      nombre: 'Marta Mesa',
      email: 'mesa@bpm.local',
      azureObjectId: 'azure-mesa-0002',
      rol: 'MESA_ENTRADA',
      areaId: mesaArea.id,
    },
  });
  const operador = await prisma.usuarioInterno.create({
    data: {
      nombre: 'Oscar Operador',
      email: 'operador@bpm.local',
      azureObjectId: 'azure-oper-0003',
      rol: 'OPERADOR',
      areaId: legal.id,
    },
  });
  const supervisor = await prisma.usuarioInterno.create({
    data: {
      nombre: 'Sofía Supervisora',
      email: 'supervisor@bpm.local',
      azureObjectId: 'azure-supe-0004',
      rol: 'SUPERVISOR',
      areaId: compras.id,
    },
  });
  const auditor = await prisma.usuarioInterno.create({
    data: {
      nombre: 'Aldo Auditor',
      email: 'auditor@bpm.local',
      azureObjectId: 'azure-audi-0005',
      rol: 'AUDITOR',
      areaId: legal.id,
    },
  });

  // ====================== USUARIOS EXTERNOS ======================
  const passwordHash = await bcrypt.hash('Externo123!', 10);
  const extActivo = await prisma.usuarioExterno.create({
    data: {
      nombre: 'Carlos Cliente',
      email: 'carlos@proveedor.com',
      documento: '30111222',
      organizacion: 'Proveedor SA',
      estado: 'ACTIVO',
      passwordHash,
    },
  });
  const extPendiente = await prisma.usuarioExterno.create({
    data: {
      nombre: 'Paula Pendiente',
      email: 'paula@empresa.com',
      documento: '28999888',
      organizacion: 'Empresa SRL',
      estado: 'PENDIENTE_VERIFICACION',
      passwordHash,
    },
  });
  const extBloqueado = await prisma.usuarioExterno.create({
    data: {
      nombre: 'Beto Bloqueado',
      email: 'beto@externo.com',
      documento: '27555444',
      organizacion: null,
      estado: 'BLOQUEADO',
      passwordHash,
    },
  });

  // ======================= TIPOS DE TRÁMITE =======================
  const altaProv = await prisma.tipoTramite.create({
    data: {
      codigo: 'ALTA_PROVEEDOR',
      nombre: 'Solicitud de alta de proveedor',
      descripcion: 'Alta de un nuevo proveedor en el sistema',
      requiereExterno: false,
      permiteInicioExterno: true,
      slaHoras: 72,
      areaInicialId: mesaArea.id,
    },
  });
  const solicitudDoc = await prisma.tipoTramite.create({
    data: {
      codigo: 'SOLICITUD_DOC',
      nombre: 'Solicitud de documentación',
      descripcion: 'Pedido de documentación a un usuario externo',
      requiereExterno: true,
      permiteInicioExterno: false,
      slaHoras: 48,
      areaInicialId: legal.id,
    },
  });
  const autorizacion = await prisma.tipoTramite.create({
    data: {
      codigo: 'AUTORIZACION',
      nombre: 'Pedido de autorización',
      descripcion: 'Autorización interna entre áreas',
      requiereExterno: false,
      permiteInicioExterno: false,
      slaHoras: 24,
      areaInicialId: compras.id,
    },
  });
  const revisionLegal = await prisma.tipoTramite.create({
    data: {
      codigo: 'REVISION_LEGAL',
      nombre: 'Revisión legal',
      descripcion: 'Revisión de un documento por el área legal',
      requiereExterno: false,
      permiteInicioExterno: false,
      slaHoras: 96,
      areaInicialId: legal.id,
    },
  });

  // ============================ TRÁMITES ============================
  // Helper para construir un movimiento (usa connect para las áreas).
  type MovInput = {
    accion: string;
    estadoAnterior?: string | null;
    estadoNuevo: string;
    areaAnteriorId?: string;
    areaNuevaId?: string;
    usuarioTipo: 'INTERNO' | 'EXTERNO';
    usuarioId: string;
    comentario?: string;
    fecha: Date;
  };
  const mov = (m: MovInput) => ({
    accion: m.accion as never,
    estadoAnterior: (m.estadoAnterior ?? null) as never,
    estadoNuevo: m.estadoNuevo as never,
    usuarioTipo: m.usuarioTipo as never,
    usuarioId: m.usuarioId,
    comentario: m.comentario,
    fecha: m.fecha,
    ...(m.areaAnteriorId ? { areaAnterior: { connect: { id: m.areaAnteriorId } } } : {}),
    ...(m.areaNuevaId ? { areaNueva: { connect: { id: m.areaNuevaId } } } : {}),
  });

  // 1) BORRADOR — Interno→Interno recién creado
  await prisma.tramite.create({
    data: {
      numero: numero('INT', 1),
      titulo: 'Autorización de compra de notebooks',
      descripcion: 'Solicito autorización para comprar 10 notebooks.',
      origen: 'INTERNO_INTERNO',
      estado: 'BORRADOR',
      prioridad: 'MEDIA',
      tipoTramiteId: autorizacion.id,
      areaActualId: compras.id,
      creadoPorTipo: 'INTERNO',
      creadoPorId: supervisor.id,
      fechaCreacion: addH(0),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            areaNuevaId: compras.id,
            usuarioTipo: 'INTERNO',
            usuarioId: supervisor.id,
            fecha: addH(0),
          }),
        ],
      },
    },
  });

  // 2) INGRESADO — Externo→Interno
  await prisma.tramite.create({
    data: {
      numero: numero('EXT', 2),
      titulo: 'Alta como proveedor de insumos',
      descripcion: 'Quiero registrarme como proveedor.',
      origen: 'EXTERNO_INTERNO',
      estado: 'INGRESADO',
      prioridad: 'ALTA',
      tipoTramiteId: altaProv.id,
      areaActualId: mesaArea.id,
      usuarioExternoId: extActivo.id,
      creadoPorTipo: 'EXTERNO',
      creadoPorId: extActivo.id,
      fechaCreacion: addH(1),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(1),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: mesaArea.id,
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(2),
          }),
        ],
      },
      comentarios: {
        create: [
          {
            mensaje: 'Adjunto datos de mi empresa.',
            visibilidad: 'TODOS',
            autorTipo: 'EXTERNO',
            autorId: extActivo.id,
            fecha: addH(2),
          },
        ],
      },
    },
  });

  // 3) EN_REVISION — Externo→Interno, tomado por operador
  await prisma.tramite.create({
    data: {
      numero: numero('EXT', 3),
      titulo: 'Alta de proveedor de servicios',
      descripcion: 'Solicitud de alta para servicios de limpieza.',
      origen: 'EXTERNO_INTERNO',
      estado: 'EN_REVISION',
      prioridad: 'MEDIA',
      tipoTramiteId: altaProv.id,
      areaActualId: mesaArea.id,
      usuarioExternoId: extActivo.id,
      usuarioAsignadoId: operador.id,
      creadoPorTipo: 'EXTERNO',
      creadoPorId: extActivo.id,
      fechaCreacion: addH(3),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(3),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: mesaArea.id,
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(4),
          }),
          mov({
            accion: 'TOMAR',
            estadoAnterior: 'INGRESADO',
            estadoNuevo: 'EN_REVISION',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(5),
          }),
        ],
      },
      comentarios: {
        create: [
          {
            mensaje: 'Revisando la documentación presentada.',
            visibilidad: 'INTERNA',
            autorTipo: 'INTERNO',
            autorId: operador.id,
            fecha: addH(5),
          },
        ],
      },
    },
  });

  // 4) OBSERVADO — Externo→Interno, con observación
  await prisma.tramite.create({
    data: {
      numero: numero('EXT', 4),
      titulo: 'Alta de proveedor — datos incompletos',
      descripcion: 'Solicitud con documentación faltante.',
      origen: 'EXTERNO_INTERNO',
      estado: 'OBSERVADO',
      prioridad: 'MEDIA',
      tipoTramiteId: altaProv.id,
      areaActualId: mesaArea.id,
      usuarioExternoId: extActivo.id,
      usuarioAsignadoId: operador.id,
      creadoPorTipo: 'EXTERNO',
      creadoPorId: extActivo.id,
      fechaCreacion: addH(6),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(6),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: mesaArea.id,
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(7),
          }),
          mov({
            accion: 'TOMAR',
            estadoAnterior: 'INGRESADO',
            estadoNuevo: 'EN_REVISION',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(8),
          }),
          mov({
            accion: 'OBSERVAR',
            estadoAnterior: 'EN_REVISION',
            estadoNuevo: 'OBSERVADO',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            comentario: 'Falta el comprobante de CUIT.',
            fecha: addH(9),
          }),
        ],
      },
      comentarios: {
        create: [
          {
            mensaje: 'Por favor adjunte el comprobante de CUIT.',
            visibilidad: 'EXTERNA',
            autorTipo: 'INTERNO',
            autorId: operador.id,
            fecha: addH(9),
          },
          {
            mensaje: 'Nota interna: verificar antecedentes.',
            visibilidad: 'INTERNA',
            autorTipo: 'INTERNO',
            autorId: supervisor.id,
            fecha: addH(9),
          },
        ],
      },
    },
  });

  // 5) ESPERANDO_EXTERNO — Interno→Externo
  await prisma.tramite.create({
    data: {
      numero: numero('INT', 5),
      titulo: 'Solicitud de documentación contractual',
      descripcion: 'Necesitamos que el proveedor envíe el contrato firmado.',
      origen: 'INTERNO_EXTERNO',
      estado: 'ESPERANDO_EXTERNO',
      prioridad: 'ALTA',
      tipoTramiteId: solicitudDoc.id,
      areaActualId: legal.id,
      usuarioExternoId: extActivo.id,
      usuarioAsignadoId: operador.id,
      creadoPorTipo: 'INTERNO',
      creadoPorId: operador.id,
      fechaCreacion: addH(10),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            areaNuevaId: legal.id,
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(10),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: legal.id,
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(11),
          }),
          mov({
            accion: 'SOLICITAR_INTERVENCION_EXTERNA',
            estadoAnterior: 'INGRESADO',
            estadoNuevo: 'ESPERANDO_EXTERNO',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            comentario: 'Se solicita contrato firmado.',
            fecha: addH(12),
          }),
        ],
      },
      comentarios: {
        create: [
          {
            mensaje: 'Aguardamos el contrato firmado.',
            visibilidad: 'EXTERNA',
            autorTipo: 'INTERNO',
            autorId: operador.id,
            fecha: addH(12),
          },
        ],
      },
    },
  });

  // 6) ESPERANDO_INTERNO — Interno→Externo, externo respondió con documento
  await prisma.tramite.create({
    data: {
      numero: numero('INT', 6),
      titulo: 'Documentación recibida del proveedor',
      descripcion: 'El proveedor respondió la solicitud de documentación.',
      origen: 'INTERNO_EXTERNO',
      estado: 'ESPERANDO_INTERNO',
      prioridad: 'MEDIA',
      tipoTramiteId: solicitudDoc.id,
      areaActualId: legal.id,
      usuarioExternoId: extActivo.id,
      usuarioAsignadoId: operador.id,
      creadoPorTipo: 'INTERNO',
      creadoPorId: operador.id,
      fechaCreacion: addH(13),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            areaNuevaId: legal.id,
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(13),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: legal.id,
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(14),
          }),
          mov({
            accion: 'SOLICITAR_INTERVENCION_EXTERNA',
            estadoAnterior: 'INGRESADO',
            estadoNuevo: 'ESPERANDO_EXTERNO',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(15),
          }),
          mov({
            accion: 'RESPONDER_INTERVENCION_EXTERNA',
            estadoAnterior: 'ESPERANDO_EXTERNO',
            estadoNuevo: 'ESPERANDO_INTERNO',
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            comentario: 'Adjunto el contrato firmado.',
            fecha: addH(16),
          }),
        ],
      },
      documentos: {
        create: [
          {
            nombreArchivo: 'contrato-firmado.pdf',
            mimeType: 'application/pdf',
            size: 248000,
            storageKey: 'seed/contrato-firmado.pdf',
            visibilidad: 'TODOS',
            subidoPorTipo: 'EXTERNO',
            subidoPorId: extActivo.id,
            fechaCarga: addH(16),
          },
        ],
      },
      comentarios: {
        create: [
          {
            mensaje: 'Documento recibido, en análisis.',
            visibilidad: 'INTERNA',
            autorTipo: 'INTERNO',
            autorId: operador.id,
            fecha: addH(17),
          },
        ],
      },
    },
  });

  // 7) APROBADO — Externo→Interno
  await prisma.tramite.create({
    data: {
      numero: numero('EXT', 7),
      titulo: 'Alta de proveedor aprobada',
      descripcion: 'Solicitud de alta correcta y completa.',
      origen: 'EXTERNO_INTERNO',
      estado: 'APROBADO',
      prioridad: 'MEDIA',
      tipoTramiteId: altaProv.id,
      areaActualId: legal.id,
      usuarioExternoId: extActivo.id,
      usuarioAsignadoId: operador.id,
      creadoPorTipo: 'EXTERNO',
      creadoPorId: extActivo.id,
      fechaCreacion: addH(18),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(18),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: mesaArea.id,
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(19),
          }),
          mov({
            accion: 'TOMAR',
            estadoAnterior: 'INGRESADO',
            estadoNuevo: 'EN_REVISION',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(20),
          }),
          mov({
            accion: 'DERIVAR',
            estadoAnterior: 'EN_REVISION',
            estadoNuevo: 'EN_REVISION',
            areaAnteriorId: mesaArea.id,
            areaNuevaId: legal.id,
            usuarioTipo: 'INTERNO',
            usuarioId: supervisor.id,
            comentario: 'Derivado a Legal para validación final.',
            fecha: addH(21),
          }),
          mov({
            accion: 'APROBAR',
            estadoAnterior: 'EN_REVISION',
            estadoNuevo: 'APROBADO',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(22),
          }),
        ],
      },
      comentarios: {
        create: [
          {
            mensaje: 'Alta aprobada. Bienvenido.',
            visibilidad: 'EXTERNA',
            autorTipo: 'INTERNO',
            autorId: operador.id,
            fecha: addH(22),
          },
        ],
      },
    },
  });

  // 8) RECHAZADO — Interno→Interno
  await prisma.tramite.create({
    data: {
      numero: numero('INT', 8),
      titulo: 'Autorización de compra rechazada',
      descripcion: 'Compra fuera de presupuesto.',
      origen: 'INTERNO_INTERNO',
      estado: 'RECHAZADO',
      prioridad: 'BAJA',
      tipoTramiteId: autorizacion.id,
      areaActualId: compras.id,
      usuarioAsignadoId: supervisor.id,
      creadoPorTipo: 'INTERNO',
      creadoPorId: mesa.id,
      fechaCreacion: addH(23),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            areaNuevaId: compras.id,
            usuarioTipo: 'INTERNO',
            usuarioId: mesa.id,
            fecha: addH(23),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: compras.id,
            usuarioTipo: 'INTERNO',
            usuarioId: mesa.id,
            fecha: addH(24),
          }),
          mov({
            accion: 'TOMAR',
            estadoAnterior: 'INGRESADO',
            estadoNuevo: 'EN_REVISION',
            usuarioTipo: 'INTERNO',
            usuarioId: supervisor.id,
            fecha: addH(25),
          }),
          mov({
            accion: 'RECHAZAR',
            estadoAnterior: 'EN_REVISION',
            estadoNuevo: 'RECHAZADO',
            usuarioTipo: 'INTERNO',
            usuarioId: supervisor.id,
            comentario: 'Excede el presupuesto anual.',
            fecha: addH(26),
          }),
        ],
      },
    },
  });

  // 9) CANCELADO — Interno→Interno
  await prisma.tramite.create({
    data: {
      numero: numero('INT', 9),
      titulo: 'Pedido de autorización cancelado',
      descripcion: 'Se canceló por duplicado.',
      origen: 'INTERNO_INTERNO',
      estado: 'CANCELADO',
      prioridad: 'BAJA',
      tipoTramiteId: autorizacion.id,
      areaActualId: compras.id,
      creadoPorTipo: 'INTERNO',
      creadoPorId: supervisor.id,
      fechaCreacion: addH(27),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            areaNuevaId: compras.id,
            usuarioTipo: 'INTERNO',
            usuarioId: supervisor.id,
            fecha: addH(27),
          }),
          mov({
            accion: 'CANCELAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'CANCELADO',
            usuarioTipo: 'INTERNO',
            usuarioId: supervisor.id,
            comentario: 'Trámite duplicado.',
            fecha: addH(28),
          }),
        ],
      },
    },
  });

  // 10) CERRADO — Externo→Interno (aprobado y luego cerrado)
  await prisma.tramite.create({
    data: {
      numero: numero('EXT', 10),
      titulo: 'Alta de proveedor finalizada',
      descripcion: 'Trámite completo y cerrado.',
      origen: 'EXTERNO_INTERNO',
      estado: 'CERRADO',
      prioridad: 'MEDIA',
      tipoTramiteId: altaProv.id,
      areaActualId: legal.id,
      usuarioExternoId: extActivo.id,
      usuarioAsignadoId: operador.id,
      creadoPorTipo: 'EXTERNO',
      creadoPorId: extActivo.id,
      fechaCreacion: addH(29),
      fechaCierre: addH(34),
      movimientos: {
        create: [
          mov({
            accion: 'CREAR',
            estadoNuevo: 'BORRADOR',
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(29),
          }),
          mov({
            accion: 'INGRESAR',
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'INGRESADO',
            areaNuevaId: mesaArea.id,
            usuarioTipo: 'EXTERNO',
            usuarioId: extActivo.id,
            fecha: addH(30),
          }),
          mov({
            accion: 'TOMAR',
            estadoAnterior: 'INGRESADO',
            estadoNuevo: 'EN_REVISION',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(31),
          }),
          mov({
            accion: 'APROBAR',
            estadoAnterior: 'EN_REVISION',
            estadoNuevo: 'APROBADO',
            usuarioTipo: 'INTERNO',
            usuarioId: operador.id,
            fecha: addH(32),
          }),
          mov({
            accion: 'CERRAR',
            estadoAnterior: 'APROBADO',
            estadoNuevo: 'CERRADO',
            usuarioTipo: 'INTERNO',
            usuarioId: supervisor.id,
            fecha: addH(34),
          }),
        ],
      },
      documentos: {
        create: [
          {
            nombreArchivo: 'constancia-alta.pdf',
            mimeType: 'application/pdf',
            size: 102400,
            storageKey: 'seed/constancia-alta.pdf',
            visibilidad: 'TODOS',
            subidoPorTipo: 'INTERNO',
            subidoPorId: operador.id,
            fechaCarga: addH(33),
          },
        ],
      },
      comentarios: {
        create: [
          {
            mensaje: 'Trámite finalizado correctamente.',
            visibilidad: 'TODOS',
            autorTipo: 'INTERNO',
            autorId: supervisor.id,
            fecha: addH(34),
          },
        ],
      },
    },
  });

  // ---- Resumen ----
  const [areas, internos, externos, tipos, tramites, movs, coms, docs] = await Promise.all([
    prisma.area.count(),
    prisma.usuarioInterno.count(),
    prisma.usuarioExterno.count(),
    prisma.tipoTramite.count(),
    prisma.tramite.count(),
    prisma.movimientoTramite.count(),
    prisma.comentarioTramite.count(),
    prisma.documentoTramite.count(),
  ]);
  console.log('Seed completado:');
  console.table({
    areas,
    internos,
    externos,
    tipos,
    tramites,
    movimientos: movs,
    comentarios: coms,
    documentos: docs,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
