import { Module } from '@nestjs/common';
import { BlockChainModule } from './blockchain/block.chain.module';
import { GateAwayModule } from './webscoket/gate.away.module';

@Module({
  imports: [
    BlockChainModule,
    GateAwayModule,
    // TypeOrmModule.forRoot({
    //   type: 'better-sqlite3',
    //   database: ':memory:',
    //   dropSchema: true,
    //   entities: [],
    //   synchronize: true,
    // }),
  ],
})
export class ServerBootstrap {}
