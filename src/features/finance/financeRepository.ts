import { createLocalRepository } from '../../services/localDataRepository';
import { isFinanceTransaction, type FinanceTransaction } from './financeModels';

export const FINANCE_TRANSACTIONS_STORAGE_KEY = 'tedbeera_finance_transactions_v1';

function isFinanceTransactionList(value: unknown): value is FinanceTransaction[] {
  return Array.isArray(value) && value.every(isFinanceTransaction);
}

export const financeTransactionsRepository = createLocalRepository<FinanceTransaction[]>(
  FINANCE_TRANSACTIONS_STORAGE_KEY,
  [],
  isFinanceTransactionList
);
