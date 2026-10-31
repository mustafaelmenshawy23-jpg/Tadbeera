export type InventoryUnit = 'قطعة' | 'كيلو' | 'جرام' | 'لتر' | 'عبوة' | 'علبة' | 'رغيف' | 'كوب' | 'حبة' | 'بيضة' | 'كيس' | 'فص';

export const INVENTORY_UNITS: InventoryUnit[] = ['قطعة', 'كيلو', 'جرام', 'لتر', 'عبوة', 'علبة', 'رغيف', 'كوب', 'حبة', 'بيضة', 'كيس', 'فص'];

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  minimumQuantity: number;
  updatedAt: string;
  expiresOn: string | null;
}

export function isInventoryItem(value: unknown): value is InventoryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<InventoryItem>;
  return typeof item.id === 'string' && typeof item.name === 'string' && item.name.trim().length > 0
    && typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity >= 0
    && typeof item.minimumQuantity === 'number' && Number.isFinite(item.minimumQuantity) && item.minimumQuantity >= 0
    && typeof item.unit === 'string' && typeof item.updatedAt === 'string'
    && (item.expiresOn === null || (typeof item.expiresOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.expiresOn)));
}

export function getLowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(item => item.quantity <= item.minimumQuantity);
}

export function getExpiringInventoryItems(items: InventoryItem[], withinDays = 7, today = new Date()): InventoryItem[] {
  const end = new Date(today);
  end.setDate(end.getDate() + Math.max(0, withinDays));
  const toLocalDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const todayKey = toLocalDateKey(today);
  const endKey = toLocalDateKey(end);
  return items.filter(item => item.expiresOn !== null && item.expiresOn >= todayKey && item.expiresOn <= endKey);
}
