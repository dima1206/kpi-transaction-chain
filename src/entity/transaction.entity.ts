import { User } from './user.entity';

export class Transaction {
  private constructor(data: Omit<Transaction, 'hash'>) {
    this.mainData = {
      userSender: data.mainData.userSender,
      userGetter: data.mainData.userGetter,
      userSenderCurrentBalance: data.mainData.userSenderCurrentBalance,
      userGetterCurrentBalance: data.mainData.userGetterCurrentBalance,
      cashToTransmit: data.mainData.cashToTransmit,
      userSenderAfterBalance: data.mainData.userSenderAfterBalance,
      userGetterAfterBalance: data.mainData.userGetterAfterBalance,
    };
    this.iteration = data.iteration;
    this.timestamp = data.timestamp;
    this.hashPreviousTransaction = data.hashPreviousTransaction;
  }

  mainData: {
    readonly userSender: string;
    readonly userGetter: string;
    readonly userSenderCurrentBalance: number;
    readonly userGetterCurrentBalance: number;
    readonly cashToTransmit: number;
    readonly userSenderAfterBalance: number;
    readonly userGetterAfterBalance: number;
  };

  readonly iteration: number;
  readonly hashPreviousTransaction: string;
  readonly timestamp: number;
  hash: string;

  static of(from: User, to: User, amount: number, iteration = 0, previousTransaction = '0') {
    const mainData = {
      userSender: from.name,
      userGetter: to.name,
      userSenderCurrentBalance: from.balance,
      userGetterCurrentBalance: to.balance,
      cashToTransmit: amount,
      userSenderAfterBalance: from.balance - amount,
      userGetterAfterBalance: to.balance + amount,
    };
    const hashData = {
      iteration,
      timestamp: Date.now(),
      hashPreviousTransaction: previousTransaction,
    };
    return new Transaction({
      mainData,
      ...hashData,
    });
  }

  static ofTemplate(iteration = 0, previousTransaction = '0') {
    const firstUser = {
      name: 'random' + Math.random(),
      balance: 1000000 * Math.random(),
    };
    const secondUser = {
      name: 'random' + Math.random(),
      balance: 1000000 * Math.random(),
    };
    return Transaction.of(firstUser, secondUser, 100000 * Math.random(), iteration, previousTransaction);
  }
}
