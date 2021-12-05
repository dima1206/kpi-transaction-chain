import { BlockChain } from './block.chain';
import { Global, Module } from '@nestjs/common';
import { BlockChainController } from './block.chain.controller';
import { Transaction } from '../../entity/transaction.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

console.log(join(__dirname, '..', '..', '..', 'asset'));
@Global()
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'asset'),
    }),
  ],
  controllers: [BlockChainController],
  providers: [
    {
      provide: BlockChain,
      useValue: BlockChain.initFirstTransaction(Transaction.ofTemplate()),
    },
  ],
  exports: [BlockChain],
})
export class BlockChainModule {}
