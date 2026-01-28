import { Controller, Logger } from '@nestjs/common';
import { MediaService } from './media.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AttachedToProductDto, uploadProductImageDto } from './media/media.dto';

@Controller()
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @MessagePattern('media.uploadProductImage')
  uploadProductImage(@Payload() payload: uploadProductImageDto) {
    return this.mediaService.uploadProductImage(payload);
  }

  @MessagePattern('media.attachToProduct')
  attachToProduct(@Payload() payload: AttachedToProductDto) {
    return this.mediaService.attachToProduct(payload);
  }

  @EventPattern('product.deleted')
  productDeleted(@Payload() data: { productId: string }) {
    this.logger.log(`Received product.deleted event: ${data.productId}`);
    return this.mediaService.deleteMediaByProductId(data.productId);
  }

  @MessagePattern('service.ping')
  ping() {
    return this.mediaService.ping();
  }
}
