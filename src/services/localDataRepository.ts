/**
 * Offline-first persistence boundary for Tadbeera.
 *
 * Legacy keys remain untouched so existing installations keep their data.
 * All new feature records use namespaced keys and defensive JSON parsing.
 */
export const STORAGE_SCHEMA_VERSION = 1;
export const APP_LOCALE = 'ar-EG' as const;
export const APP_CURRENCY = 'EGP' as const;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoredEnvelope<T> {
  schemaVersion: number;
  updatedAt: string;
  data: T;
}

export interface Repository<T> {
  read(): T;
  write(value: T): boolean;
  clear(): boolean;
}

const getDefaultStorage = (): StorageAdapter | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export function createLocalRepository<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
  storage: StorageAdapter | null = getDefaultStorage()
): Repository<T> {
  return {
    read(): T {
      if (!storage) return fallback;
      try {
        const raw = storage.getItem(key);
        if (!raw) return fallback;
        const parsed: unknown = JSON.parse(raw);
        // Read both versioned envelopes and plain legacy JSON values.
        const candidate = parsed && typeof parsed === 'object' && 'schemaVersion' in parsed && 'data' in parsed
          ? (parsed as StoredEnvelope<unknown>).data
          : parsed;
        return validate(candidate) ? candidate : fallback;
      } catch {
        return fallback;
      }
    },
    write(value: T): boolean {
      if (!storage || !validate(value)) return false;
      try {
        const envelope: StoredEnvelope<T> = {
          schemaVersion: STORAGE_SCHEMA_VERSION,
          updatedAt: new Date().toISOString(),
          data: value
        };
        storage.setItem(key, JSON.stringify(envelope));
        return true;
      } catch {
        return false;
      }
    },
    clear(): boolean {
      if (!storage) return false;
      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  };
}

export interface BackupEnvelope<T> {
  app: 'tedbeera-egypt';
  schemaVersion: number;
  exportedAt: string;
  data: T;
}

export function createLocalBackup<T>(data: T): BackupEnvelope<T> {
  return {
    app: 'tedbeera-egypt',
    schemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data
  };
}

export function readLocalBackup<T>(
  value: unknown,
  validate: (candidate: unknown) => candidate is T
): T | null {
  if (!value || typeof value !== 'object') return null;
  const envelope = value as Partial<BackupEnvelope<unknown>>;
  if (envelope.app !== 'tedbeera-egypt' || !Number.isInteger(envelope.schemaVersion)) return null;
  if (envelope.schemaVersion! < 1 || envelope.schemaVersion! > STORAGE_SCHEMA_VERSION) return null;
  return validate(envelope.data) ? envelope.data : null;
}
