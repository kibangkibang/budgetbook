export interface CategoryBreakdownEntry {
  categoryId: string;
  name: string;
  color?: string;
  type: 'income' | 'expense';
  amount: number;
  count: number;
  percentage: number;
}

export interface DailyTrendEntry {
  date: string;
  income: number;
  expense: number;
}

export interface TopExpenseEntry {
  categoryId: string;
  name: string;
  color?: string;
  amount: number;
}

export interface MonthlyReport {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdownEntry[];
  dailyTrend: DailyTrendEntry[];
  topExpenses: TopExpenseEntry[];
}

export interface AssetsReport {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentAsset: number;
  transactionCount: number;
}
