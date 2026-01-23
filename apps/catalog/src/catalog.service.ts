import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  ping() {
    return {
      status: 'Ok',
      service: 'catalog',
      now: new Date().toLocaleDateString(),
    };
  }
}
