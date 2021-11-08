import { BlockChain } from './block.chain';
import { Global, Module } from '@nestjs/common';
import { BlockChainController } from './block.chain.controller';
import { Transaction } from '../../entity/transaction.entity';

@Global()
@Module({
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
