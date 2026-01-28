import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
