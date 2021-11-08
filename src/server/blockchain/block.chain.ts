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

  addTransaction(iteration: number) {
    this.currentTransaction = Transaction.ofTemplate(iteration, this.currentTransaction.hash);
    this.chain.push(this.currentTransaction);
  }
}
