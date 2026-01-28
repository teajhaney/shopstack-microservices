import { Controller, Logger } from '@nestjs/common';
import { SearchService } from './search.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ProductCreatedDto } from './events/product-events.dto';
import { SearchQueryDto } from './search/search-query.dto';

@Controller()
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @EventPattern('product.created')
  async onProductCreated(@Payload() payload: ProductCreatedDto) {
    this.logger.log(`Received product.created event: ${payload.productId}`);
    await this.searchService.upsertFromProductCreation(payload);
  }

  @MessagePattern('search.query')
  async query(@Payload() payload: SearchQueryDto) {
    return this.searchService.query(payload);
  }

  @EventPattern('product.deleted')
  productDeleted(@Payload() data: { productId: string }) {
    this.logger.log(`Received product.deleted event: ${data.productId}`);
    return this.searchService.deleteByProductId(data.productId);
  }

  @MessagePattern('service.ping')
  ping() {
    return this.searchService.ping();
  }
}
