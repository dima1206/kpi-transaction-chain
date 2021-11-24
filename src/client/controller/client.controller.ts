import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { Transaction } from '../../entity/transaction.entity';
import Utils from '../../utils/crypto.util';
import { Socket } from 'socket.io-client';

@Controller()
export class ClientController implements OnModuleInit {
  private readonly logger = new Logger(ClientController.name);
  constructor(private readonly socket: Socket) {}

  async onModuleInit() {
    this.socket.io.on('error', (error) => this.logger.error(error));
    this.socket.io.on('ping', () => this.logger.log('PING'));
    this.socket.on('task', (data: { transaction: Omit<Transaction, 'hash'>; iteration: number }) => {
      this.logger.log('HANDLE TASK');
      this.socket.emit('transaction-hash', {
        iteration: data.iteration,
        hash: Math.random() > 0 ? Utils.hash(JSON.stringify(data.transaction)) : Utils.hash(Math.random().toString()),
      });
    });
  }
}
