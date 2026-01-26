/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
export type ProductStatus = 'DRAFT' | 'ACTIVE';

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

export class GetProdctByIdDto {
  @IsString()
  id: string;
}
