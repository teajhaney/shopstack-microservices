//This controller is for the gateway to handle requests from the client to the search microservice which contains the business logic for search

import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { PaginatedProductsResponse } from './product.dto';
import { mapRpcErrorToHttp } from '@app/rpc';
import { firstValueFrom } from 'rxjs';
import { Public } from '../auth/public.decorator';

@Controller('search')
export class SearchHttpController {
  constructor(
    @Inject('SEARCH_CLIENT') private readonly searchClient: ClientProxy,
  ) {}

  @Get()
  @Public()
  async searchProducts(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const payload = {
        query,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      };
      const result = await firstValueFrom(
        this.searchClient.send<PaginatedProductsResponse>(
          'search.query',
          payload,
        ),
      );
      return result;
    } catch (error) {
      mapRpcErrorToHttp(error);
    }
  }
}
