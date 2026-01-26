import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentUser } from '../auth/current.user.decorator';
import type { UserContext } from '../auth/auth.types';
import { CreateProductDto } from './product.dto';
import { mapRpcErrorToHttp } from '@app/rpc';
import { firstValueFrom } from 'rxjs';

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  status: 'DRAFT' | 'ACTIVE';
  imageUrl: string;
  createdByClerkUserId: string;
};
@Controller('products')
export class ProductsHttpController {
  constructor(
    @Inject('CATALOG_CLIENT') private readonly catalogClient: ClientProxy,
  ) {}

  @Post()
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
    } catch (error) {
      mapRpcErrorToHttp(error);
    }
    return prodduct;
  }
}
