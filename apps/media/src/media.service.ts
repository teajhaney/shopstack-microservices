import { Injectable } from '@nestjs/common';
import { initCloudinary } from './cloudinary/cloudinary.client';
import { InjectModel } from '@nestjs/mongoose';
import { Media, MediaDocument } from './media/media.schema';
import { Model } from 'mongoose';
import { uploadProductImageDto, AttachedToProductDto } from './media/media.dto';
import { rpcBadRequest } from '@app/rpc';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class MediaService {
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
    return { mediaId: String(media._id), url, publicId };
  }

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
      rpcBadRequest('Media not found');
    }

    return {
      mediaId: String(updatedMedia?._id),
      productId: updatedMedia?.productId,
      url: updatedMedia?.url,
      publicId: updatedMedia?.publicId,
    };
  }
  ping() {
    return {
      status: 'Ok',
      service: 'media',
      now: new Date().toLocaleDateString(),
    };
  }
}
