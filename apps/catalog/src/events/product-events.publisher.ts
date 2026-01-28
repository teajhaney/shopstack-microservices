import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ProductCreatedEvent } from '../products/product.events';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductEventsPublisher implements OnModuleInit {
  private readonly logger = new Logger(ProductEventsPublisher.name);

  constructor(
    @Inject('SEARCH_EVENT_CLIENT')
    private readonly searchEventClient: ClientProxy,
    @Inject('MEDIA_EVENT_CLIENT')
    private readonly mediaEventClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await Promise.all([
      this.searchEventClient.connect(),
      this.mediaEventClient.connect(),
    ]);
    this.logger.log('Search and Media event clients connected');
  }

  async productCreated(event: ProductCreatedEvent) {
    try {
      this.logger.log(
        `Publishing product created event to search: ${event.productId}`,
      );
      await firstValueFrom(
        this.searchEventClient.emit('product.created', event),
      );
    } catch (error) {
      this.logger.warn('Failed to publish product created event', error);
    }
  }

  async productDeleted(productId: string) {
    try {
      const event = { productId };
      this.logger.log(`Publishing product deleted event: ${productId}`);
      await Promise.all([
        firstValueFrom(this.searchEventClient.emit('product.deleted', event)),
        firstValueFrom(this.mediaEventClient.emit('product.deleted', event)),
      ]);
    } catch (error) {
      this.logger.warn('Failed to publish product deleted event', error);
    }
  }
}
