import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './product.schema';
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

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly event: ProductEventsPublisher,
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
    if (!isValidObjectId(getProductByIdDto.id)) {
      rpcBadRequest('Invalid product id');
    }
    const product = await this.productModel
      .findById(getProductByIdDto.id)
      .exec();

    if (!product) rpcBadRequest('Product not found');

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
      rpcBadRequest('Product not found');
    }
    return updatedProduct.toObject();
  }

  //Delete product by Id
  async deleteProductById(deleteProductByIdDto: GetProductByIdDto) {
    if (!isValidObjectId(deleteProductByIdDto.id)) {
      rpcBadRequest('Invalid product id');
    }
    await this.productModel.findByIdAndDelete(deleteProductByIdDto.id);
    return {
      message: 'Product deleted successfully',
    };
  }
}
