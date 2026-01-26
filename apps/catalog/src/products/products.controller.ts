import { Controller } from '@nestjs/common';
import { ProductService } from './products.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProductDto, GetProdctByIdDto } from './product.dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern('product.create')
  create(@Payload() payload: CreateProductDto) {
    return this.productService.create(payload);
  }

  @MessagePattern('product.list')
  list() {
    return this.productService.listProducts();
  }

  @MessagePattern('product.get')
  getById(@Payload() payload: GetProdctByIdDto) {
    return this.productService.getProductById(payload);
  }

  @MessagePattern('product.update')
  update(@Payload() payload: { id: string; data: CreateProductDto }) {
    return this.productService.updateProductById(payload.id, payload.data);
  }

  @MessagePattern('product.delete')
  delete(@Payload() payload: GetProdctByIdDto) {
    return this.productService.deleteProductById(payload);
  }
}
