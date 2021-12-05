import { NestFactory } from '@nestjs/core';
import { ServerBootstrap } from './server/bootstrap.server';
import { ClientBootstrap } from './client/bootstrap.client';
import { urlencoded, json, raw } from 'body-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  if (process.env.ENV === 'client') {
    const app = await NestFactory.createApplicationContext(ClientBootstrap);
    await app.init();
  } else {
    const app = await NestFactory.create(ServerBootstrap, {
      bodyParser: true,
    });
    app.use(raw());
    app.use(urlencoded({ extended: true }));
    app.use(json());
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(3000);
  }
}
bootstrap();
