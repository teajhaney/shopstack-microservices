import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  ping() {
    return {
      status: 'Ok',
      service: 'media',
      now: new Date().toLocaleDateString(),
    };
  }
}
