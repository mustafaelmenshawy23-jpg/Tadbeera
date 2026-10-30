export interface HouseholdTask {
  id: string;
  title: string;
  notes: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
}

export function isHouseholdTask(value: unknown): value is HouseholdTask {
  if (!value || typeof value !== 'object') return false;
  const task = value as Partial<HouseholdTask>;
  return typeof task.id === 'string' && typeof task.title === 'string' && task.title.trim().length > 0
    && typeof task.notes === 'string' && typeof task.completed === 'boolean'
    && typeof task.createdAt === 'string'
    && (task.dueDate === null || (typeof task.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)));
}

export function sortHouseholdTasks(tasks: HouseholdTask[]): HouseholdTask[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}
