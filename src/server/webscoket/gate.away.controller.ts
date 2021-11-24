import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Socket } from 'socket.io-client/build/esm/socket';
import { BlockChain } from '../blockchain/block.chain';
import { Cron } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import * as jsonwebtoken from 'jsonwebtoken';
import * as fs from 'fs';
import { retrieveSigningKeys } from 'jwks-rsa/src/utils';

const keysData = fs.readFileSync(process.cwd() + '/keys.json');
const keys = JSON.parse(keysData.toString());
const SECRET_KEY = retrieveSigningKeys([keys['privateKey']])[0].getPublicKey();

@WebSocketGateway({ transports: ['websocket'] })
export class GateAwayController implements OnGatewayConnection {
  private readonly secrets = new Set(['1', '2', '3']);
  private readonly logger = new Logger(GateAwayController.name);
  private secretToIteration: Record<string, number> = {};
  private currentSuccessVerifies = 0;
  private iteration = 0;
  private hashMap: Record<number, Record<string, number>> = {};

  @WebSocketServer() private readonly server: Server;
  constructor(private readonly blockChain: BlockChain) {}

  handleConnection(client: Socket | any): any {
    const context = {
      currentSuccessVerifies: this.currentSuccessVerifies,
      iteration: this.iteration,
      hashMap: this.hashMap,
    };
    this.logger.log(`HANDLE CONNECTION`, context);
    client.emit('task', {
      transaction: this.blockChain.currentTransaction,
      iteration: this.iteration,
    });
    client.secret = client.handshake.query.secret;
  }

  @Cron('* * * * *')
  async handleCron() {
    const context = {
      currentSuccessVerifies: this.currentSuccessVerifies,
      iteration: this.iteration,
      hashMap: this.hashMap,
    };
    this.logger.log(`HANDLE CRON`, context);

    if (this.currentSuccessVerifies >= 3) {
      this.logger.log(`ADD TRANSACTION TO BLOCKCHAIN`);
      const hashes = Object.entries(this.hashMap[this.iteration])
        .sort((val) => -val[1])
        .map((val) => val[0]);
      this.blockChain.currentTransaction.hash = hashes[0];

      this.iteration += 1;
      this.blockChain.addTransaction(this.iteration);
      this.hashMap = {};
      this.secretToIteration = {};
      this.currentSuccessVerifies = 0;
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
    const isValid = new Promise((resolve) => {
      jsonwebtoken.verify(client.secret, SECRET_KEY, { ignoreExpiration: true, algorithms: ['RS256'] }, (err) => {
        return err ? resolve(false) : resolve(true);
      });
    });
    if (!isValid) {
      return this.logger.warn('TRANSACTION WITH UNKNOWN SECRET', client.secret);
    }
    if (this.secretToIteration[client.secret] === this.iteration) {
      return this.logger.warn('ALREADY GET HASH FROM CLIENT', client.secret);
    }
    this.secretToIteration[client.secret] = this.iteration;

    const context = {
      currentSuccessVerifies: this.currentSuccessVerifies,
      iteration: this.iteration,
      hashMap: this.hashMap,
      data,
    };
    this.logger.log(`HANDLE TRANSACTION-hash`, context);

    if (!this.hashMap[data.iteration]) this.hashMap[data.iteration] = {};
    if (!this.hashMap[data.iteration][data.hash]) {
      this.hashMap[data.iteration][data.hash] = 0;
    }
    this.hashMap[data.iteration][data.hash] += 1;

    this.currentSuccessVerifies = Math.max(...Object.values(this.hashMap[this.iteration] || {}));
  }
}
