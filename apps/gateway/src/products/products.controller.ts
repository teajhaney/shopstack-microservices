import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentUser } from '../auth/current.user.decorator';
import type { UserContext } from '../auth/auth.types';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { mapRpcErrorToHttp } from '@app/rpc';
import { firstValueFrom } from 'rxjs';
import { AdminOnly } from '../auth/admin.decorator';

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  status: 'DRAFT' | 'ACTIVE';
  imageUrl: string;
  createdByClerkUserId: string;
};

export class PaginatedProductsResponse {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Controller('products')
export class ProductsHttpController {
  constructor(
    @Inject('CATALOG_CLIENT') private readonly catalogClient: ClientProxy,
  ) {}

  @Post()
  @AdminOnly()
  async createProduct(
    @CurrentUser() user: UserContext,
    @Body() createProductDto: CreateProductDto,
  ) {
    const { name, description, price, imageUrl, status } = createProductDto;

    let prodduct: Product;

    const payload = {
      name,
      description,
      price,
      imageUrl,
      status,
      createdByClerkUserId: user.clerkUserId,
    };

    // RMQ request and response pattern
    try {
      prodduct = await firstValueFrom(
        this.catalogClient.send<Product>('product.create', payload),
      );
      return prodduct;
    } catch (error) {
      mapRpcErrorToHttp(error);
    }
  }

  @Get('list')
  async listProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const payload = {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      };

      const result = await firstValueFrom(
        this.catalogClient.send<PaginatedProductsResponse>(
          'product.list',
          payload,
        ),
      );
      return result;
    } catch (error) {
      mapRpcErrorToHttp(error);
    }
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    let product: Product;
    const payload = { id };
    try {
      product = await firstValueFrom(
        this.catalogClient.send<Product>('product.get', payload),
      );
      return product;
    } catch (error) {
      mapRpcErrorToHttp(error);
    }
  }

  @Patch(':id')
  @AdminOnly()
  async updateProductById(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const { name, description, price, imageUrl, status } = updateProductDto;
    let updatedProduct: Product;
    const payload = {
      id,
      data: {
        name,
        description,
        price,
        imageUrl,
        status,
      },
    };

    try {
      updatedProduct = await firstValueFrom(
        this.catalogClient.send<Product>('product.update', payload),
      );
      return updatedProduct;
    } catch (error) {
      mapRpcErrorToHttp(error);
    }
  }
  @Delete(':id')
  @AdminOnly()
  async delectProductById(@Param('id') id: string) {
    const payload = {
      id,
    };

    try {
      return await firstValueFrom(
        this.catalogClient.send<Product>('product.delete', payload),
      );
    } catch (error) {
      mapRpcErrorToHttp(error);
    }
  }
}
