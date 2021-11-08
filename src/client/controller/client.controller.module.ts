import { Module } from '@nestjs/common';
import { ClientModule } from '../client/client.module';
import { ClientController } from './client.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ClientModule, ScheduleModule.forRoot()],
  providers: [ClientController],
})
export class ClientControllerModule {}
