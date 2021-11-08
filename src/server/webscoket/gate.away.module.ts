import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GateAwayController } from './gate.away.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [GateAwayController],
})
export class GateAwayModule {}
