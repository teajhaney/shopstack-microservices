import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  ping() {
    return {
      status: 'Ok',
      service: 'search',
      now: new Date().toLocaleDateString(),
    };
  }
}
