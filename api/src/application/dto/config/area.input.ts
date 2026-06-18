import { Actor } from '../actor';

export interface ListarAreasInput {
  actor: Actor;
}

export interface CrearAreaInput {
  actor: Actor;
  nombre: string;
  codigo: string;
  activa?: boolean;
}

export interface ActualizarAreaInput {
  actor: Actor;
  id: string;
  nombre?: string;
  activa?: boolean;
}
