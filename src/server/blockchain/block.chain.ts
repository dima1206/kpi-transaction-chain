import { Transaction } from '../../entity/transaction.entity';

export class BlockChain {
  readonly chain: Transaction[];
  readonly firstTransaction: Transaction;
  currentTransaction: Transaction;

  constructor(firstBlock: Transaction, currentBlock: Transaction, chain: Transaction[]) {
    this.firstTransaction = firstBlock;
    this.currentTransaction = currentBlock;
    this.chain = chain;
  }

  static initFirstTransaction(firstTransaction: Transaction) {
    return new BlockChain(firstTransaction, firstTransaction, [firstTransaction]);
  }

  addTransactionBlock(transaction: Transaction) {
    this.currentTransaction = transaction;
    this.chain.push(this.currentTransaction);
  }

  addTransaction(iteration: number) {
    this.currentTransaction = Transaction.ofTemplate(iteration, this.currentTransaction.hash);
    this.chain.push(this.currentTransaction);
  }

  getUserBalance(userId: string) {
    let balance = 0;
    for (const transaction of this.chain) {
      if (transaction.mainData.userGetter === userId) {
        balance += transaction.mainData.cashToTransmit;
      }
      if (transaction.mainData.userSender === userId) {
        balance -= transaction.mainData.cashToTransmit;
      }
    }
    return balance;
  }
}
