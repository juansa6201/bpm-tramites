/** Tipo de trámite (GET /tipos-tramite). */
export interface TipoTramite {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  requiereExterno: boolean;
  permiteInicioExterno: boolean;
  slaHoras: number;
  areaInicialId: string | null;
}

/** Usuario externo (GET /usuarios-externos), para el picker de Interno→Externo. */
export interface UsuarioExterno {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  organizacion: string | null;
  estado: 'PENDIENTE_VERIFICACION' | 'ACTIVO' | 'BLOQUEADO';
}

export interface CrearAreaBody {
  nombre: string;
  codigo: string;
  activa?: boolean;
}

export interface ActualizarAreaBody {
  nombre?: string;
  activa?: boolean;
}

export interface CrearTipoTramiteBody {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  requiereExterno?: boolean;
  permiteInicioExterno?: boolean;
  slaHoras: number;
  areaInicialId?: string;
}

export interface ActualizarTipoTramiteBody {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  requiereExterno?: boolean;
  permiteInicioExterno?: boolean;
  slaHoras?: number;
  areaInicialId?: string;
}
