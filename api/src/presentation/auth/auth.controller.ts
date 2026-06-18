import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegisterExternalUserUseCase } from '../../application/use-cases/auth/register-external-user.use-case';
import { LoginExternalUserUseCase } from '../../application/use-cases/auth/login-external-user.use-case';
import { LoginInternalMockUseCase } from '../../application/use-cases/auth/login-internal-mock.use-case';
import { RegisterExternalRequest } from './dto/register-external.request';
import { LoginExternalRequest } from './dto/login-external.request';
import { LoginInternalRequest } from './dto/login-internal.request';
import { ExternalAuthGuard } from '../guards/external-auth.guard';
import { InternalAuthGuard } from '../guards/internal-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerExternal: RegisterExternalUserUseCase,
    private readonly loginExternal: LoginExternalUserUseCase,
    private readonly loginInternalMock: LoginInternalMockUseCase,
  ) {}

  // ----------------------------- EXTERNOS -----------------------------

  @Post('external/register')
  register(@Body() body: RegisterExternalRequest) {
    return this.registerExternal.execute({
      nombre: body.nombre,
      email: body.email,
      documento: body.documento,
      organizacion: body.organizacion ?? null,
      password: body.password,
    });
  }

  @Post('external/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginExternalRequest) {
    return this.loginExternal.execute({ email: body.email, password: body.password });
  }

  @Post('external/logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    // JWT stateless: el logout se resuelve descartando el token en el cliente.
    return { message: 'Sesión finalizada. Descartá el token en el cliente.' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard)
  me(@CurrentUser() user: CurrentUserData) {
    return user;
  }

  // ----------------------------- INTERNOS -----------------------------

  // MOCK de login interno (con Entra ID real esto lo hace Microsoft via MSAL).
  @Post('internal/login')
  @HttpCode(HttpStatus.OK)
  loginInternal(@Body() body: LoginInternalRequest) {
    return this.loginInternalMock.execute({ email: body.email });
  }

  @Get('internal/me')
  @ApiBearerAuth()
  @UseGuards(InternalAuthGuard)
  internalMe(@CurrentUser() user: CurrentUserData) {
    return user;
  }
}
