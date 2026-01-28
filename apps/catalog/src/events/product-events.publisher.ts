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
  ) {}

  async onModuleInit() {
    await this.searchEventClient.connect();
    this.logger.log('Search event client connected');
  }

  async productCreated(event: ProductCreatedEvent) {
    try {
      this.logger.log('Publishing product created event', event);
      await firstValueFrom(
        this.searchEventClient.emit('product.created', event),
      );
    } catch (error) {
      this.logger.warn('Failed to publish product even', error);
    }
  }
}
