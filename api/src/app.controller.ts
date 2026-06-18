import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /api/health -> usado por el healthcheck de docker-compose.
  @Get('health')
  health() {
    return this.appService.health();
  }
}
