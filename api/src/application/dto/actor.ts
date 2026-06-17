import { RolInterno } from '../../domain/usuarios/enums/rol-interno.enum';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';

/** Actor interno que ejecuta una acción de workflow. */
export interface ActorInterno {
  tipo: TipoUsuario.INTERNO;
  id: string;
  rol: RolInterno;
  areaId: string;
}

/** Actor externo que ejecuta una acción de workflow. */
export interface ActorExterno {
  tipo: TipoUsuario.EXTERNO;
  id: string;
}

/** Identidad que ejecuta una acción (viene de @CurrentUser). */
export type Actor = ActorInterno | ActorExterno;
