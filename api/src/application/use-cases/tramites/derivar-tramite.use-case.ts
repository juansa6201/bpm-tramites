import { UnitOfWork } from '../../ports/unit-of-work';
import { WorkflowStateMachine } from '../../../domain/services/workflow-state-machine';
import { DerivarTramiteInput } from '../../dto/tramites/derivar-tramite.input';
import { TramiteTransicionResult } from '../../dto/tramites/tramite-transicion.result';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { TramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';
import { autorizarActor, resolverTransicion, rolDe } from './workflow-helpers';

const ACCION = AccionMovimiento.DERIVAR;

/**
 * Acción del INTERNO (supervisor/admin): deriva a otra área.
 * Efecto colateral: cambia el área actual; el movimiento registra área
 * anterior y nueva (el historial muestra todas las áreas intervinientes).
 * No cambia de estado (sigue EN_REVISION).
 */
export class DerivarTramiteUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly transiciones: WorkflowStateMachine,
  ) {}

  async execute(input: DerivarTramiteInput): Promise<TramiteTransicionResult> {
    return this.uow.runInTransaction(async (repos) => {
      const tramite = await repos.tramites.findById(input.tramiteId);
      if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

      const estadoAnterior = tramite.estado;
      const areaAnteriorId = tramite.areaActualId;
      const resultado = this.transiciones.evaluar({
        origen: tramite.origen,
        estadoActual: tramite.estado,
        accion: ACCION,
        tipoUsuario: input.actor.tipo,
        rolUsuario: rolDe(input.actor),
      });
      const estadoNuevo = resolverTransicion(resultado, ACCION, tramite.estado);
      autorizarActor(tramite, input.actor);

      tramite.moverAArea(input.areaNuevaId);
      tramite.cambiarEstado(estadoNuevo);
      await repos.tramites.update(tramite);
      await repos.movimientos.create({
        tramiteId: tramite.id,
        estadoAnterior,
        estadoNuevo,
        areaAnteriorId,
        areaNuevaId: input.areaNuevaId,
        usuarioTipo: input.actor.tipo,
        usuarioId: input.actor.id,
        accion: ACCION,
        comentario: input.comentario ?? null,
      });

      return { id: tramite.id, numero: tramite.numero, estadoAnterior, estadoNuevo };
    });
  }
}
