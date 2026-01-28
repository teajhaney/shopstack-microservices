import { Controller } from '@nestjs/common';
import { SearchService } from './search.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ProductCreatedDto } from './events/product-events.dto';
import { SearchQueryDto } from './search/search-query.dto';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @EventPattern('product.created')
  async onProductCreated(@Payload() payload: ProductCreatedDto) {
    await this.searchService.upsertFromProductCreation(payload);
  }

  @MessagePattern('search.query')
  async query(@Payload() payload: SearchQueryDto) {
    return this.searchService.query(payload);
  }

  @MessagePattern('service.ping')
  ping() {
    return this.searchService.ping();
  }
}
