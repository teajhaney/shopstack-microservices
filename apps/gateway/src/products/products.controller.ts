//This controller is for the gateway to handle requests from the client to the catalog microservice which contains the business logic for products

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentUser } from '../auth/current.user.decorator';
import type { UserContext } from '../auth/auth.types';
import {
  CreateProductDto,
  PaginatedProductsResponse,
  UpdateProductDto,
} from './product.dto';
import { mapRpcErrorToHttp } from '@app/rpc';
import { firstValueFrom } from 'rxjs';
import { AdminOnly } from '../auth/admin.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AttachedToProductResponse,
  Product,
  UploadProductResponse,
} from './product.type';

@Controller('products')
export class ProductsHttpController {
  private readonly logger = new Logger(ProductsHttpController.name);
  constructor(
    @Inject('CATALOG_CLIENT') private readonly catalogClient: ClientProxy,
    @Inject('MEDIA_CLIENT') private readonly mediaClient: ClientProxy,
  ) {}

  @Post()
  @AdminOnly()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
  )
  async createProduct(
    @CurrentUser() user: UserContext,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() createProductDto: CreateProductDto,
  ) {
    this.logger.log(
      `Creating product: ${createProductDto.name} by user: ${user.clerkUserId}`,
    );
    const { name, description, price, status } = createProductDto;
    let imageUrl = createProductDto.imageUrl;
    let mediaId: string | undefined = undefined;

    if (file) {
      const base64 = file.buffer.toString('base64');

      //upload image to cloudinary and add to db
      try {
        const uploadResult: { url: string; mediaId: string } =
          await firstValueFrom(
            this.mediaClient.send<UploadProductResponse>(
              'media.uploadProductImage',
              {
                fileName: file.originalname,
                mimeType: file.mimetype,
                base64,
                uploadByUserId: user.clerkUserId,
              },
            ),
          );
        imageUrl = uploadResult.url;
        mediaId = uploadResult.mediaId;
      } catch (error) {
        mapRpcErrorToHttp(error);
      }
    }

    let product: Product;

    const payload = {
      name,
      description,
      price,
      imageUrl,
      status,
      createdByClerkUserId: user.clerkUserId,
    };

    // RMQ request and response pattern, create product with or without image
    try {
      product = await firstValueFrom(
        this.catalogClient.send<Product>('product.create', payload),
      );
    } catch (error) {
      this.logger.error(`Failed to create product in Catalog: ${error.message}`, error.stack);
      mapRpcErrorToHttp(error);
    }

    //add product Id to image
    if (mediaId && product) {
      try {
        await firstValueFrom(
          this.mediaClient.send<AttachedToProductResponse>(
            'media.attachToProduct',
            {
              mediaId,
              productId: String(product._id),
              attchedByUserId: user.clerkUserId,
            },
          ),
        );
      } catch (error) {
        mapRpcErrorToHttp(error);
      }
    }
    return product;
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
    this.logger.log(`Updating product: ${id}`);
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
    this.logger.log(`Deleting product: ${id}`);
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
