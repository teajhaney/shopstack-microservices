import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './product.schema';
import type { ProductDocument } from './product.schema';
import { isValidObjectId, Model } from 'mongoose';
import {
  CreateProductDto,
  GetProductByIdDto,
  UpdateProductDto,
  ListProductsDto,
  PaginatedProductsResponse,
} from './product.dto';
import { rpcBadRequest } from '@app/rpc';
import { ProductEventsPublisher } from '../events/product-events.publisher';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly event: ProductEventsPublisher,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Create a new product
  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    const { name, description, price, status, imageUrl, createdByClerkUserId } =
      createProductDto;
    if (!name || !description || !price) {
      rpcBadRequest('Missing required fields');
    }

    if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
      rpcBadRequest('Price must be a valid number >= 0');
    }

    if (status && !['DRAFT', 'ACTIVE'].includes(status)) {
      rpcBadRequest('Status must be either DRAFT or ACTIVE');
    }

    const createdProduct = await this.productModel.create({
      name,
      description,
      price,
      status: status || 'DRAFT',
      imageUrl: imageUrl || '',
      createdByClerkUserId,
    });

    this.logger.log(`Product created successfully: ${createdProduct._id}`);

    //emit event to search microservice
    this.event.productCreated({
      productId: String(createdProduct._id),
      name: createdProduct.name,
      description: createdProduct.description,
      status: createdProduct.status,
      price: createdProduct.price,
      imageUrl: createdProduct.imageUrl,
      createdByClerkUserId: createdProduct.createdByClerkUserId,
    });

    //invalidate list cache (simple approach: clear all product related cache)
    await this.cacheManager.del('products_list');

    return createdProduct;
  }

  // List products with pagination
  async listProducts(
    listProductsDto: ListProductsDto,
  ): Promise<PaginatedProductsResponse> {
    const { page = 1, limit = 10 } = listProductsDto;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const total = await this.productModel.countDocuments().exec();

    // Get paginated products
    const products = await this.productModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  // Get product by id
  async getProductById(
    getProductByIdDto: GetProductByIdDto,
  ): Promise<ProductDocument | null> {
    const { id } = getProductByIdDto;
    if (!isValidObjectId(id)) {
      rpcBadRequest('Invalid product id');
    }

    const cacheKey = `product_${id}`;
    const cachedProduct =
      await this.cacheManager.get<ProductDocument>(cacheKey);
    if (cachedProduct) {
      this.logger.log(`Cache hit for product: ${id}`);
      return cachedProduct;
    }

    const product = await this.productModel.findById(id).exec();

    if (!product) rpcBadRequest('Product not found');

    this.logger.log(`Cache miss for product: ${id}`);
    await this.cacheManager.set(cacheKey, product, 60000); // cache for 1 minute

    return product;
  }

  //Update product by Id
  async updateProductById(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDocument | null> {
    if (!isValidObjectId(id)) {
      rpcBadRequest('Invalid product id');
    }
    const { name, description, price, status, imageUrl } = updateProductDto;

    const update: Partial<CreateProductDto> = {};

    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (price !== undefined) update.price = price;
    if (status !== undefined) update.status = status;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;

    if (Object.keys(update).length === 0) {
      rpcBadRequest('No fields to update');
    }

    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    if (!updatedProduct) {
      this.logger.warn(`Update failed: Product not found ${id}`);
      rpcBadRequest('Product not found');
    }

    // Invalidate cache
    await this.cacheManager.del(`product_${id}`);
    await this.cacheManager.del('products_list');

    this.logger.log(`Product updated successfully: ${id}`);
    return updatedProduct.toObject();
  }

  //Delete product by Id
  async deleteProductById(deleteProductByIdDto: GetProductByIdDto) {
    if (!isValidObjectId(deleteProductByIdDto.id)) {
      rpcBadRequest('Invalid product id');
    }
    await this.productModel.findByIdAndDelete(deleteProductByIdDto.id);
    this.logger.log(`Product deleted from DB: ${deleteProductByIdDto.id}`);

    // Invalidate cache
    await this.cacheManager.del(`product_${deleteProductByIdDto.id}`);
    await this.cacheManager.del('products_list');

    //emit event to search and media microservices for cleanup
    this.event.productDeleted(deleteProductByIdDto.id);

    return {
      message: 'Product deleted successfully',
    };
  }
}
