import { createLocalRepository } from '../../services/localDataRepository';
import { isHouseholdTask, type HouseholdTask } from './householdTaskModels';

export const HOUSEHOLD_TASKS_STORAGE_KEY = 'tedbeera_household_tasks_v1';
const isTaskList = (value: unknown): value is HouseholdTask[] =>
  Array.isArray(value) && value.every(isHouseholdTask);

export const householdTasksRepository = createLocalRepository<HouseholdTask[]>(
  HOUSEHOLD_TASKS_STORAGE_KEY, [], isTaskList
);
