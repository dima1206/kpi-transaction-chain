import { BlockChain } from './block.chain';
import { Controller, Get } from '@nestjs/common';

@Controller('blockchain')
export class BlockChainController {
  constructor(private readonly blockChain: BlockChain) {}

  @Get('/')
  index() {
    return this.blockChain.chain;
  }
}
