import { BlockChain } from './block.chain';
import { BadRequestException, Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { retrieveSigningKeys } from 'jwks-rsa/src/utils';
import * as jsonwebtoken from 'jsonwebtoken';
import * as fs from 'fs';

class Transaction {
  senderHash: string;
  receiverId: string;
  amount: string;
}

const keysData = fs.readFileSync(process.cwd() + '/keys.json');
const keys = JSON.parse(keysData.toString());
const SECRET_KEY = retrieveSigningKeys([keys['privateKey']])[0].getPublicKey();

@Controller('blockchain')
export class BlockChainController {
  constructor(private readonly blockChain: BlockChain, @Inject('transactions') private readonly transactions: any[]) {}

  @Get('/')
  index() {
    return this.blockChain.chain;
  }

  @Post('/transaction')
  async addTransaction(@Body() transaction: Transaction) {
    let decodedClient: { id: number } = null;
    const isValid = await new Promise((resolve) => {
      jsonwebtoken.verify(transaction.senderHash, SECRET_KEY, { ignoreExpiration: true, algorithms: ['RS256'] }, (err, decoded: { id: number }) => {
        decodedClient = decoded;
        return err ? resolve(false) : resolve(true);
      });
    });
    if (!isValid) throw new BadRequestException('Not valid token');

    const userBalance = this.blockChain.getUserBalance(decodedClient.id.toString());
    if (userBalance < Number(transaction.amount)) {
      throw new BadRequestException('Balance is lower then requested');
    }
    this.transactions.push({
      senderId: decodedClient.id,
      getterId: Number(transaction.receiverId),
      amount: Number(transaction.amount),
    });
  }
}
