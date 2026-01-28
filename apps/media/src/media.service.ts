import { Injectable, Logger } from '@nestjs/common';
import { initCloudinary } from './cloudinary/cloudinary.client';
import { InjectModel } from '@nestjs/mongoose';
import { Media, MediaDocument } from './media/media.schema';
import { Model } from 'mongoose';
import { uploadProductImageDto, AttachedToProductDto } from './media/media.dto';
import { rpcBadRequest } from '@app/rpc';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly cloudinary = initCloudinary();
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
  ) {}

  //upload image to cloudianry and database
  async uploadProductImage(uploadProductImageDto: uploadProductImageDto) {
    const { mimeType, base64, uploadByUserId } = uploadProductImageDto;

    if (!base64) {
      rpcBadRequest('Image base64 is required');
    }

    if (!mimeType.startsWith('image/')) {
      rpcBadRequest('Invalid image type, Only image are allowed');
    }

    const buffer = Buffer.from(base64, 'base64');

    if (!buffer.length) {
      rpcBadRequest('Invalid image data');
    }
    const uploadResponse = await new Promise<UploadApiResponse | undefined>(
      (resolve, reject) => {
        const stream = this.cloudinary.uploader.upload_stream(
          {
            folder: 'ecommerce-microservices/products',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              const errorMessage =
                error && typeof error === 'object' && 'message' in error
                  ? String(error.message)
                  : String(error || 'Unknown error');
              reject(new Error(`Cloudinary upload failed: ${errorMessage}`));
              return;
            }
            resolve(result);
          },
        );
        stream.end(buffer);
      },
    );

    const url = uploadResponse?.secure_url || uploadResponse?.url;
    const publicId = uploadResponse?.public_id;

    if (!url || !publicId) {
      rpcBadRequest(
        'Image upload failed, cloudinary did not return proper response!1',
      );
    }
    const media = await this.mediaModel.create({
      url,
      publicId,
      uploadByUserId,
      productId: undefined,
    });
    this.logger.log(`Image uploaded and saved: ${media._id} (URL: ${url})`);
    return { mediaId: String(media._id), url, publicId };
  }

  //attach media to product
  async attachToProduct(attachedToProductDto: AttachedToProductDto) {
    const { mediaId, productId } = attachedToProductDto;

    const updatedMedia = await this.mediaModel
      .findByIdAndUpdate(
        mediaId,
        {
          $set: { productId },
        },
        {
          new: true,
        },
      )
      .exec();
    if (!updatedMedia) {
      this.logger.warn(`Attach failed: Media not found ${mediaId}`);
      rpcBadRequest('Media not found');
    }

    this.logger.log(`Media ${mediaId} attached to product ${productId}`);

    return {
      mediaId: String(updatedMedia?._id),
      productId: updatedMedia?.productId,
      url: updatedMedia?.url,
      publicId: updatedMedia?.publicId,
    };
  }

  //delete media by product id
  async deleteMediaByProductId(productId: string) {
    // 1. Find all media for this product
    const medias = await this.mediaModel.find({ productId }).exec();

    if (medias.length === 0) {
      return;
    }

    // 2. Delete each from Cloudinary
    const deletionPromises = medias.map(async (media) => {
      try {
        await new Promise((resolve, reject) => {
          this.cloudinary.uploader.destroy(media.publicId, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
      } catch (error) {
        this.logger.error(
          `Failed to delete image ${media.publicId} from Cloudinary`,
          error,
        );
        // We continue even if one fails
      }
    });

    await Promise.all(deletionPromises);

    // 3. Delete from database
    await this.mediaModel.deleteMany({ productId }).exec();
    this.logger.log(`All media for product ${productId} deleted from DB and Cloudinary`);
  }

  ping() {
    return {
      status: 'Ok',
      service: 'media',
      now: new Date().toLocaleDateString(),
    };
  }
}
