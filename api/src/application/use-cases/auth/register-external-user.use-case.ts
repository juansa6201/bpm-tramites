import { UsuarioExternoRepository } from '../../../domain/usuarios/repositories/usuario-externo.repository';
import { PasswordHasher } from '../../ports/password-hasher.port';
import { RegisterExternalInput } from '../../dto/auth/register-external.input';
import { RegisteredExternalResult } from '../../dto/auth/auth-result';
import {
  DocumentoEnUsoError,
  EmailEnUsoError,
} from '../../../domain/usuarios/errors/usuario-externo.errors';

/**
 * Registro de un usuario externo (email + password).
 * Clase plana: no conoce Nest. Recibe sus dependencias por constructor.
 */
export class RegisterExternalUserUseCase {
  constructor(
    private readonly usuarios: UsuarioExternoRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterExternalInput): Promise<RegisteredExternalResult> {
    // Reglas de unicidad
    if (await this.usuarios.findByEmail(input.email)) {
      throw new EmailEnUsoError(input.email);
    }
    if (await this.usuarios.findByDocumento(input.documento)) {
      throw new DocumentoEnUsoError(input.documento);
    }

    // Nunca persistimos el password en claro
    const passwordHash = await this.hasher.hash(input.password);

    const usuario = await this.usuarios.create({
      nombre: input.nombre,
      email: input.email,
      documento: input.documento,
      organizacion: input.organizacion,
      passwordHash,
    });

    // Arranca en PENDIENTE_VERIFICACION (default del schema): aún no puede loguear.
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      estado: usuario.estado,
    };
  }
}
