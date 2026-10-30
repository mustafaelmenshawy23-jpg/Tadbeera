export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  description: string;
  date: string;
}

export interface MonthlyFinanceSummary {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export function isFinanceTransaction(value: unknown): value is FinanceTransaction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FinanceTransaction>;
  return typeof item.id === 'string' && (item.type === 'income' || item.type === 'expense')
    && typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount >= 0
    && typeof item.categoryId === 'string' && typeof item.description === 'string'
    && typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date);
}

export function summarizeMonthlyFinance(
  transactions: FinanceTransaction[],
  month: string
): MonthlyFinanceSummary {
  const valid = transactions.filter(item => isFinanceTransaction(item) && item.date.startsWith(month));
  const income = valid.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = valid.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  return {
    income,
    expenses,
    balance: income - expenses,
    savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 1000) / 10 : 0
  };
}

export function createFinanceTransaction(
  input: Omit<FinanceTransaction, 'id'>
): FinanceTransaction {
  return { ...input, id: `txn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}` };
}
