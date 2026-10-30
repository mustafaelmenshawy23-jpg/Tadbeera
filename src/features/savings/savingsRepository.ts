import { createLocalRepository } from '../../services/localDataRepository';
import { isSavingsGoal, type SavingsGoal } from './savingsModels';

export const SAVINGS_GOALS_STORAGE_KEY = 'tedbeera_savings_goals_v1';
const isSavingsGoalList = (value: unknown): value is SavingsGoal[] =>
  Array.isArray(value) && value.every(isSavingsGoal);

export const savingsGoalsRepository = createLocalRepository<SavingsGoal[]>(
  SAVINGS_GOALS_STORAGE_KEY, [], isSavingsGoalList
);
