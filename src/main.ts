import { NestFactory } from '@nestjs/core';
import { ServerBootstrap } from './server/bootstrap.server';
import { ClientBootstrap } from './client/bootstrap.client';

async function bootstrap() {
  if (process.env.ENV === 'client') {
    const app = await NestFactory.createApplicationContext(ClientBootstrap);
    await app.init();
  } else {
    const app = await NestFactory.create(ServerBootstrap);
    await app.listen(3000);
  }
}
bootstrap();
