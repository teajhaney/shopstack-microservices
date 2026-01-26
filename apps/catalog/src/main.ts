import { NestFactory } from '@nestjs/core';
import { CatalogModule } from './catalog.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { applyToMicroservicelayer } from '@app/rpc';

async function bootstrap() {
  process.title = 'catalog';
  const logger = new Logger('CatalogBootstrap');
  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const queue = process.env.CATALOG_QUEUE || 'catalog_queue';
  //  create a microservice instance
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CatalogModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue,
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  applyToMicroservicelayer(app);
  app.enableShutdownHooks();
  await app.listen();
  logger.log(`Catalog RMQ is listening on queue: ${queue} via ${rmqUrl}`);
}
bootstrap().catch((err) => {
  console.error('Error during catalog bootstrap:', err);
  process.exit(1);
});
