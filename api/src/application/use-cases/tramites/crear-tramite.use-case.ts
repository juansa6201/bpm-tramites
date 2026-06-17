import { UnitOfWork } from '../../ports/unit-of-work';
import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { TipoTramiteRepository } from '../../../domain/repositories/tipo-tramite.repository';
import { TipoTramite } from '../../../domain/tramites/entities/tipo-tramite.entity';
import { CrearTramiteInput } from '../../dto/tramites/crear-tramite.input';
import { CrearTramiteResult } from '../../dto/tramites/crear-tramite.result';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import {
  NumeroDuplicadoError,
  OrigenNoPermitidoParaActorError,
  TipoNoPermiteInicioExternoError,
  TipoTramiteInactivoError,
  TipoTramiteNoEncontradoError,
  TramiteRequiereExternoError,
} from '../../../domain/tramites/errors/tramite.errors';

interface DatosCreador {
  creadoPorTipo: TipoUsuario;
  creadoPorId: string;
  usuarioExternoId: string | null;
}

const MAX_INTENTOS_NUMERO = 3;

/**
 * Crea un trámite (no es una transición: arranca en BORRADOR y genera su número).
 * Valida la matriz creador↔origen y, para externos, que el tipo permita inicio
 * externo. Crea el trámite + el MovimientoTramite de CREAR de forma atómica.
 */
export class CrearTramiteUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tipos: TipoTramiteRepository,
  ) {}

  async execute(input: CrearTramiteInput): Promise<CrearTramiteResult> {
    // 1) Validar tipo (config; lectura fuera de la transacción).
    const tipo = await this.tipos.findById(input.tipoTramiteId);
    if (!tipo) throw new TipoTramiteNoEncontradoError(input.tipoTramiteId);
    if (!tipo.estaActivo()) throw new TipoTramiteInactivoError();

    // 2) Resolver creador + origen + externo vinculado.
    const creador = this.resolverCreador(input, tipo);
    const prioridad = input.prioridad ?? PrioridadTramite.MEDIA;
    const areaActualId = input.areaActualId ?? tipo.areaInicialId;

    // 3) Crear con reintento ante colisión del número (carrera en la numeración).
    for (let intento = 0; intento < MAX_INTENTOS_NUMERO; intento++) {
      try {
        return await this.uow.runInTransaction(async (repos) => {
          const numero = await this.generarNumero(repos.tramites, input.origen);
          const tramite = await repos.tramites.create({
            numero,
            titulo: input.titulo,
            descripcion: input.descripcion,
            origen: input.origen,
            prioridad,
            tipoTramiteId: tipo.id,
            areaActualId,
            usuarioAsignadoId: null,
            usuarioExternoId: creador.usuarioExternoId,
            creadoPorTipo: creador.creadoPorTipo,
            creadoPorId: creador.creadoPorId,
          });

          await repos.movimientos.create({
            tramiteId: tramite.id,
            estadoAnterior: null,
            estadoNuevo: tramite.estado, // BORRADOR
            areaAnteriorId: null,
            areaNuevaId: areaActualId,
            usuarioTipo: creador.creadoPorTipo,
            usuarioId: creador.creadoPorId,
            accion: AccionMovimiento.CREAR,
            comentario: null,
          });

          return { id: tramite.id, numero: tramite.numero, estado: tramite.estado };
        });
      } catch (e) {
        if (e instanceof NumeroDuplicadoError && intento < MAX_INTENTOS_NUMERO - 1) {
          continue; // recomputa el número y reintenta
        }
        throw e;
      }
    }
    throw new NumeroDuplicadoError();
  }

  /** Matriz creador↔origen del enunciado. */
  private resolverCreador(input: CrearTramiteInput, tipo: TipoTramite): DatosCreador {
    if (input.actor.tipo === TipoUsuario.EXTERNO) {
      // El externo solo inicia el circuito Externo→Interno.
      if (input.origen !== OrigenTramite.EXTERNO_INTERNO) {
        throw new OrigenNoPermitidoParaActorError();
      }
      if (!tipo.permiteInicioExterno()) {
        throw new TipoNoPermiteInicioExternoError();
      }
      return {
        creadoPorTipo: TipoUsuario.EXTERNO,
        creadoPorId: input.actor.id,
        usuarioExternoId: input.actor.id,
      };
    }

    // Interno: solo Interno→Interno o Interno→Externo.
    if (input.origen === OrigenTramite.EXTERNO_INTERNO) {
      throw new OrigenNoPermitidoParaActorError();
    }
    if (input.origen === OrigenTramite.INTERNO_EXTERNO) {
      if (!input.usuarioExternoId) {
        throw new TramiteRequiereExternoError();
      }
      return {
        creadoPorTipo: TipoUsuario.INTERNO,
        creadoPorId: input.actor.id,
        usuarioExternoId: input.usuarioExternoId,
      };
    }
    // INTERNO_INTERNO
    return {
      creadoPorTipo: TipoUsuario.INTERNO,
      creadoPorId: input.actor.id,
      usuarioExternoId: null,
    };
  }

  /** Número legible: EXT-2026-00042 / INT-2026-00043 (con red de seguridad @unique). */
  private async generarNumero(tramites: TramiteRepository, origen: OrigenTramite): Promise<string> {
    const anio = new Date().getFullYear();
    const prefijo = `${origen === OrigenTramite.EXTERNO_INTERNO ? 'EXT' : 'INT'}-${anio}-`;
    // Numeramos a partir del MÁXIMO existente (tolera huecos en los datos);
    // el @unique + el reintento cubren la concurrencia.
    const ultimo = await tramites.ultimoNumeroConPrefijo(prefijo);
    const ultimoSeq = ultimo ? Number(ultimo.slice(prefijo.length)) : 0;
    const seq = (Number.isFinite(ultimoSeq) ? ultimoSeq : 0) + 1;
    return `${prefijo}${String(seq).padStart(5, '0')}`;
  }
}
