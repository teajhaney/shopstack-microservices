import { Controller, Get } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'gateway',
      timestamp: new Date().toLocaleDateString(),
    };
  }
}
