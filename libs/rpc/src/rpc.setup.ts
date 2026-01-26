import { INestMicroservice, ValidationPipe } from '@nestjs/common';
import { RpcAllExceptionsFilter } from './rpc-exception.filter';

export function applyToMicroservicelayer(app: INestMicroservice) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new RpcAllExceptionsFilter());
}
