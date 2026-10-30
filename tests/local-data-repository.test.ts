import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalRepository, type StorageAdapter } from '../src/services/localDataRepository';

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test('repository writes versioned envelopes and reads them back', () => {
  const storage = new MemoryStorage();
  const repository = createLocalRepository<number[]>('items', [], Array.isArray, storage);
  assert.equal(repository.write([1, 2, 3]), true);
  const stored = JSON.parse(storage.getItem('items') || '{}');
  assert.equal(stored.schemaVersion, 1);
  assert.deepEqual(repository.read(), [1, 2, 3]);
});

test('repository remains compatible with plain legacy JSON', () => {
  const storage = new MemoryStorage();
  storage.setItem('items', JSON.stringify(['legacy']));
  const repository = createLocalRepository<string[]>('items', [], (v): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string'), storage);
  assert.deepEqual(repository.read(), ['legacy']);
});

test('repository safely falls back on corrupt storage and supports clear', () => {
  const storage = new MemoryStorage();
  storage.setItem('items', '{broken');
  const repository = createLocalRepository<number[]>('items', [9], Array.isArray, storage);
  assert.deepEqual(repository.read(), [9]);
  assert.equal(repository.clear(), true);
  assert.equal(storage.getItem('items'), null);
});
