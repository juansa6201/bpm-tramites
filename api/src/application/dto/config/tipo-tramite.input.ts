import { Actor } from '../actor';

export interface ListarTiposTramiteInput {
  actor: Actor;
}

export interface CrearTipoTramiteInput {
  actor: Actor;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  requiereExterno?: boolean;
  permiteInicioExterno?: boolean;
  slaHoras: number;
  areaInicialId?: string | null;
}

export interface ActualizarTipoTramiteInput {
  actor: Actor;
  id: string;
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
  requiereExterno?: boolean;
  permiteInicioExterno?: boolean;
  slaHoras?: number;
  areaInicialId?: string | null;
}
