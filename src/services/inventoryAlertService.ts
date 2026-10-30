import { getExpiringInventoryItems, getLowStockItems, type InventoryItem } from '../features/inventory/inventoryModels';

const INVENTORY_ALERT_ID = 202;
const INVENTORY_ALERT_CHANNEL = 'tedbeera_inventory_alerts';

export async function refreshInventoryAlerts(items: InventoryItem[]): Promise<void> {
  if (typeof window === 'undefined') return;
  const capacitor = (window as any).Capacitor;
  if (!capacitor?.isPluginAvailable?.('LocalNotifications')) return;
  const notifications = capacitor?.Plugins?.LocalNotifications;
  if (!notifications) return;

  try {
    const permission = await notifications.checkPermissions();
    if (permission?.display !== 'granted') return;

    const lowStock = getLowStockItems(items);
    const expiring = getExpiringInventoryItems(items, 7);
    const messages: string[] = [];
    if (lowStock.length) messages.push('نواقص: ' + lowStock.slice(0, 5).map(item => item.name).join('، '));
    if (expiring.length) messages.push('صلاحية قريبة: ' + expiring.slice(0, 5).map(item => item.name).join('، '));

    await notifications.cancel({ notifications: [{ id: INVENTORY_ALERT_ID }] });
    if (!messages.length) return;

    try {
      await notifications.createChannel({
        id: INVENTORY_ALERT_CHANNEL,
        name: 'تنبيهات مخزون تدبيرة',
        description: 'تذكير بنواقص البيت والأصناف قريبة انتهاء الصلاحية',
        importance: 4,
        visibility: 1
      });
    } catch {}

    const nextMorning = new Date();
    nextMorning.setHours(9, 0, 0, 0);
    if (nextMorning <= new Date()) nextMorning.setDate(nextMorning.getDate() + 1);

    await notifications.schedule({
      notifications: [{
        id: INVENTORY_ALERT_ID,
        title: 'مراجعة مخزون البيت 🧺',
        body: messages.join(' | ').slice(0, 220),
        schedule: { at: nextMorning, repeats: true, every: 'day' },
        channelId: INVENTORY_ALERT_CHANNEL
      }]
    });
  } catch {
    // Keep inventory usable even when the OS notification service is unavailable.
  }
}
