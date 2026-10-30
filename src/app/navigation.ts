/** Shared navigation types for the Tadbeera application.
 * Keep tab identifiers stable: they are used by persisted UI state and screen routing.
 */
export type ActiveTab = 'food' | 'budget' | 'daily' | 'saved';
export type ViewMode = 'emulator' | 'code' | 'tests';
export type SavedSubTab = 'shopping' | 'recipes' | 'tips' | 'budgets' | 'household';
export type MealTypeFilter = 'all' | 'breakfast' | 'lunch' | 'dinner';

/** Human-readable labels for the current primary tabs.
 * This is a single source of truth for navigation labels; screen content remains
 * in App.tsx until each feature is extracted in its own focused change.
 */
export const PRIMARY_TABS: ReadonlyArray<{ id: ActiveTab; label: string }> = [
  { id: 'food', label: 'المطبخ' },
  { id: 'budget', label: 'الميزانية' },
  { id: 'daily', label: 'يوميات' },
  { id: 'saved', label: 'المحفوظات' }
];
