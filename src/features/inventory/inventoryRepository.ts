import { createLocalRepository } from '../../services/localDataRepository';
import { isInventoryItem, type InventoryItem } from './inventoryModels';

export const INVENTORY_STORAGE_KEY = 'tedbeera_inventory_v1';
const isInventoryList = (value: unknown): value is InventoryItem[] =>
  Array.isArray(value) && value.every(isInventoryItem);

export const inventoryRepository = createLocalRepository<InventoryItem[]>(
  INVENTORY_STORAGE_KEY, [], isInventoryList
);
