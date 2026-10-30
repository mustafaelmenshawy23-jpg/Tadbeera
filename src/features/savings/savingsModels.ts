export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  createdAt: string;
}

export function isSavingsGoal(value: unknown): value is SavingsGoal {
  if (!value || typeof value !== 'object') return false;
  const goal = value as Partial<SavingsGoal>;
  return typeof goal.id === 'string' && typeof goal.title === 'string' && goal.title.trim().length > 0
    && typeof goal.targetAmount === 'number' && Number.isFinite(goal.targetAmount) && goal.targetAmount > 0
    && typeof goal.currentAmount === 'number' && Number.isFinite(goal.currentAmount) && goal.currentAmount >= 0
    && typeof goal.createdAt === 'string'
    && (goal.targetDate === null || (typeof goal.targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(goal.targetDate)));
}

export function getSavingsProgress(goal: SavingsGoal): { saved: number; remaining: number; percentage: number; isComplete: boolean } {
  const saved = Math.min(goal.currentAmount, goal.targetAmount);
  return {
    saved,
    remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
    percentage: Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 1000) / 10),
    isComplete: goal.currentAmount >= goal.targetAmount
  };
}
