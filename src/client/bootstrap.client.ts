import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { ClientControllerModule } from './controller/client.controller.module';

@Module({
  imports: [ClientModule, ClientControllerModule],
})
export class ClientBootstrap {}
