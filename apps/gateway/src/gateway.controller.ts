import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Public } from './auth/public.decorator';

@Controller()
export class GatewayController {
  constructor(
    @Inject('CATALOG_CLIENT') private readonly catalogClient: ClientProxy,
    @Inject('MEDIA_CLIENT') private readonly mediaClient: ClientProxy,
    @Inject('SEARCH_CLIENT') private readonly searchClient: ClientProxy,
  ) {}

  @Get('health')
  @Public()
  async health() {
    const ping = async (serviceName: string, client: ClientProxy) => {
      try {
        const result = await firstValueFrom(
          client.send<string>('service.ping', { from: 'gateway' }),
        );
        return {
          status: 'Ok',
          service: serviceName,
          result,
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          status: 'Error',
          service: serviceName,
          error: message,
        };
      }
    };

    const [catalog, media, search] = await Promise.all([
      ping('catalog', this.catalogClient),
      ping('media', this.mediaClient),
      ping('search', this.searchClient),
    ]);
    const ok = [catalog, media, search].every((res) => res.status === 'Ok');
    return {
      status: ok ? 'Ok' : 'Error',
      gateway: {
        service: 'gateway',
        now: new Date().toLocaleDateString(),
      },
      services: {
        catalog,
        media,
        search,
      },
    };
  }
}
