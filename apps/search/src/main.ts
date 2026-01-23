import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SearchModule } from './search.module';

async function bootstrap() {
  process.title = 'search';
  const logger = new Logger('SearhBootstrap');
  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const queue = process.env.SEARCH_QUEUE || 'search_queue';
  //  create a microservice instance
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SearchModule,
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
  app.enableShutdownHooks();
  await app.listen();
  logger.log(`Search RMQ is listening on queue: ${queue} via ${rmqUrl}`);
}
bootstrap().catch((err) => {
  console.error('Error during search bootstrap:', err);
  process.exit(1);
});
