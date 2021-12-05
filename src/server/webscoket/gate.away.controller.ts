import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Socket } from 'socket.io-client/build/esm/socket';
import { BlockChain } from '../blockchain/block.chain';
import { Cron } from '@nestjs/schedule';
import { Inject, Logger } from '@nestjs/common';
import * as jsonwebtoken from 'jsonwebtoken';
import * as fs from 'fs';
import { retrieveSigningKeys } from 'jwks-rsa/src/utils';
import { Transaction } from '../../entity/transaction.entity';

const keysData = fs.readFileSync(process.cwd() + '/keys.json');
const keys = JSON.parse(keysData.toString());
const SECRET_KEY = retrieveSigningKeys([keys['privateKey']])[0].getPublicKey();

const currentId = (timestamp: number = Date.now()) => {
  return Math.floor((timestamp / 120000) % 3);
};

@WebSocketGateway({ transports: ['websocket'] })
export class GateAwayController implements OnGatewayConnection {
  private currentAuthorityResult: { id: number; hash: string | null } = { id: currentId(), hash: null };
  private readonly logger = new Logger(GateAwayController.name);
  private hashMap: Record<number, Record<string, number>> = {};
  private iteration = 0;

  @WebSocketServer() private readonly server: Server;
  constructor(
    private readonly blockChain: BlockChain,
    @Inject('transactions') private readonly transactions: { senderId: number; getterId: number; amount: number }[],
  ) {}

  handleConnection(client: Socket | any): any {
    const context = {
      iteration: this.iteration,
      hashMap: this.hashMap,
      currentAuthority: this.currentAuthorityResult,
      currentId: currentId(),
      timestamp: Date.now(),
    };
    this.logger.log(`HANDLE CONNECTION`, context);
    client.emit('task', {
      transaction: this.blockChain.currentTransaction,
      iteration: this.iteration,
    });
    client.secret = client.handshake.query.secret;
  }

  private getTransaction(): Transaction {
    const hasTransaction = !!this.transactions[0];
    if (Math.random() > 1 || !hasTransaction) {
      const getter = this.currentAuthorityResult.id.toString();
      return {
        hashPreviousTransaction: this.blockChain.currentTransaction.hash,
        iteration: this.iteration,
        timestamp: Date.now(),
        mainData: {
          userGetter: getter,
          userSender: 'SYSTEM',
          userSenderAfterBalance: Number.NaN,
          userGetterAfterBalance: this.blockChain.getUserBalance(getter) + 1,
          userSenderCurrentBalance: Number.NaN,
          userGetterCurrentBalance: this.blockChain.getUserBalance(getter),
          cashToTransmit: 1,
        },
        hash: null,
      };
    } else {
      const trx = this.transactions.pop();
      const userSenderBalance = this.blockChain.getUserBalance(trx.senderId.toString());
      const userGetterBalance = this.blockChain.getUserBalance(trx.getterId.toString());
      return {
        hashPreviousTransaction: this.blockChain.currentTransaction.hash,
        iteration: this.iteration,
        timestamp: Date.now(),
        mainData: {
          userGetter: trx.getterId.toString(),
          userSender: trx.senderId.toString(),
          userSenderAfterBalance: userSenderBalance - trx.amount,
          userGetterAfterBalance: userGetterBalance + trx.amount,
          userSenderCurrentBalance: userSenderBalance,
          userGetterCurrentBalance: userGetterBalance,
          cashToTransmit: trx.amount,
        },
        hash: null,
      };
    }
  }

  @Cron('* * * * *')
  async handleCron() {
    this.logger.log(`handleCron`);
    const context = {
      iteration: this.iteration,
      hashMap: this.hashMap,
      currentAuthority: this.currentAuthorityResult,
      currentId: currentId(),
      timestamp: Date.now(),
    };
    this.logger.log(`HANDLE CRON`, context);

    if (this.currentAuthorityResult.id === currentId()) {
      this.logger.log(`ADD TRANSACTION TO BLOCKCHAIN`);
      const verifies = this.hashMap[this.iteration][this.currentAuthorityResult.hash];
      if (verifies >= 3) {
        this.blockChain.currentTransaction.hash = this.currentAuthorityResult.hash;
        this.iteration += 1;

        this.blockChain.addTransactionBlock(this.getTransaction());
        this.logger.warn(`ADD TRANSACTION`, context);
      } else {
        this.logger.warn(`NOT enough verifies`, context);
      }
    } else {
      this.currentAuthorityResult.id = currentId();
      this.currentAuthorityResult.hash = null;
      this.logger.warn(`NO RESPONSE FROM AUTHORITY`, context);
    }

    const sockets = await this.server.fetchSockets();
    for (const socket of sockets) {
      socket.emit('task', {
        transaction: this.blockChain.currentTransaction,
        iteration: this.iteration,
      });
    }
  }

  @SubscribeMessage('transaction-hash')
  async transactionHash(@MessageBody() data: { hash: string; iteration: string }, @ConnectedSocket() client: Socket | any) {
    let decodedClient: { id: number } = null;
    const isValid = await new Promise((resolve) => {
      jsonwebtoken.verify(client.secret, SECRET_KEY, { ignoreExpiration: true, algorithms: ['RS256'] }, (err, decoded: { id: number }) => {
        decodedClient = decoded;
        return err ? resolve(false) : resolve(true);
      });
    });
    if (!isValid) return this.logger.warn('TRANSACTION WITH UNKNOWN SECRET', client.secret);

    const context = {
      iteration: this.iteration,
      hashMap: this.hashMap,
      data,
      currentAuthority: this.currentAuthorityResult,
      currentId: currentId(),
      timestamp: Date.now(),
      decodedClient,
    };
    this.logger.log(`HANDLE TRANSACTION-hash`, context);

    if (!this.hashMap[data.iteration]) this.hashMap[data.iteration] = {};
    if (!this.hashMap[data.iteration][data.hash]) {
      this.hashMap[data.iteration][data.hash] = 0;
    }
    this.hashMap[data.iteration][data.hash] += 1;

    if (decodedClient.id === currentId()) {
      this.currentAuthorityResult.id = decodedClient.id;
      this.currentAuthorityResult.hash = data.hash;
    }
  }
}
