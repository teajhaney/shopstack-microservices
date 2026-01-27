/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { ProductStatus } from './product.schema';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  status?: ProductStatus;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  createdByClerkUserId: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  status?: ProductStatus;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class GetProductByIdDto {
  @IsString()
  id: string;
}

export class ListProductsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

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
