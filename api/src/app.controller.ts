import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /api/health -> usado por el healthcheck de docker-compose.
  @Get('health')
  health() {
    return this.appService.health();
  }
}
