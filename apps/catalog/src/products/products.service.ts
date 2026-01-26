import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDument } from './product.schema';
import { isValidObjectId, Model } from 'mongoose';
import {
  CreateProductDto,
  GetProdctByIdDto,
  UpdateProductDto,
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
    if (!name || !description || !price || !createdByClerkUserId) {
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

  // List products
  async listProducts(): Promise<ProductDument[]> {
    return await this.productModel.find().sort({ createdAt: -1 }).exec();
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

    if (!name || !description || !price || !status || !imageUrl) {
      rpcBadRequest('No fields to update');
    }
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        status,
        imageUrl,
      },
      { new: true },
    );
    return updatedProduct;
  }

  //Delete product by Id
  async deleteProductById(
    delectProdctByIdDto: GetProdctByIdDto,
  ): Promise<ProductDument | null> {
    if (!isValidObjectId(delectProdctByIdDto.id)) {
      rpcBadRequest('Invalid product id');
    }

    const deletedProduct = await this.productModel.findByIdAndDelete(
      delectProdctByIdDto.id,
    );
    return deletedProduct;
  }
}
