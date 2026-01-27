import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDument } from './product.schema';
import { isValidObjectId, Model } from 'mongoose';
import {
  CreateProductDto,
  GetProdctByIdDto,
  UpdateProductDto,
  ListProductsDto,
  PaginatedProductsResponse,
} from './product.dto';
import { rpcBadRequest } from '@app/rpc';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDument>,
  ) {}

  // Create a new product
  async create(createProductDto: CreateProductDto): Promise<ProductDument> {
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

    const createdProdct = await this.productModel.create({
      name,
      description,
      price,
      status: status || 'DRAFT',
      imageUrl: imageUrl || '',
      createdByClerkUserId,
    });
    return createdProdct;
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
    getProdctByIdDto: GetProdctByIdDto,
  ): Promise<ProductDument | null> {
    if (!isValidObjectId(getProdctByIdDto.id)) {
      rpcBadRequest('Invalid product id');
    }
    const product = await this.productModel
      .findById(getProdctByIdDto.id)
      .exec();

    if (!product) rpcBadRequest('Product not found');

    return product;
  }

  //Update product by Id
  async updateProductById(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDument | null> {
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
      throw new rpcBadRequest('No fields to update');
    }

    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    if (!updatedProduct) {
      throw new rpcBadRequest('Product not found');
    }
    return updatedProduct?.toObject();
  }

  //Delete product by Id
  async deleteProductById(delectProdctByIdDto: GetProdctByIdDto) {
    if (!isValidObjectId(delectProdctByIdDto.id)) {
      rpcBadRequest('Invalid product id');
    }
    await this.productModel.findByIdAndDelete(delectProdctByIdDto.id);
    return {
      message: 'Product deleted successfully',
    };
  }
}
