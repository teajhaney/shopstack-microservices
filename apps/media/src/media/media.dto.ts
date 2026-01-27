/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsOptional, IsString } from 'class-validator';

export class uploadProductImageDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsString()
  base64: string;

  @IsString()
  uploadByUserId: string;
}

export class AttachedToProductDto {
  @IsString()
  mediaId: string;

  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  attchedByUserId: string;
}
