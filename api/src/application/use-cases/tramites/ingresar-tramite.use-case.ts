import { UnitOfWork } from '../../ports/unit-of-work';
import { WorkflowStateMachine } from '../../../domain/services/workflow-state-machine';
import { AccionTramiteInput } from '../../dto/tramites/accion-tramite.input';
import { TramiteTransicionResult } from '../../dto/tramites/tramite-transicion.result';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { TramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';
import { autorizarActor, resolverTransicion, rolDe } from './workflow-helpers';

const ACCION = AccionMovimiento.INGRESAR;

export class IngresarTramiteUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly transiciones: WorkflowStateMachine,
  ) {}

  async execute(input: AccionTramiteInput): Promise<TramiteTransicionResult> {
    return this.uow.runInTransaction(async (repos) => {
      const tramite = await repos.tramites.findById(input.tramiteId);
      if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

      const estadoAnterior = tramite.estado;
      const resultado = this.transiciones.evaluar({
        origen: tramite.origen,
        estadoActual: tramite.estado,
        accion: ACCION,
        tipoUsuario: input.actor.tipo,
        rolUsuario: rolDe(input.actor),
      });
      const estadoNuevo = resolverTransicion(resultado, ACCION, tramite.estado);
      autorizarActor(tramite, input.actor);

      tramite.cambiarEstado(estadoNuevo);
      await repos.tramites.update(tramite);
      await repos.movimientos.create({
        tramiteId: tramite.id,
        estadoAnterior,
        estadoNuevo,
        areaAnteriorId: null,
        areaNuevaId: null,
        usuarioTipo: input.actor.tipo,
        usuarioId: input.actor.id,
        accion: ACCION,
        comentario: input.comentario ?? null,
      });

      return { id: tramite.id, numero: tramite.numero, estadoAnterior, estadoNuevo };
    });
  }
}
