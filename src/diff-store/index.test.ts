import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SavedDiff } from './types';

const record: SavedDiff = {
  id: 'existing-history', name: 'Original history', leftFileName: 'a.xlsx', rightFileName: 'b.xlsx', createdAt: 100,
  diffData: { tableDiff: [{ headers: [], headersLeft: [], headersRight: [] }], csvLeft: ['original'], csvRight: ['changed'], alignmentLimited: true },
};

beforeEach(() => {
  vi.resetModules();
  const indexedDB = new IDBFactory();
  vi.stubGlobal('indexedDB', indexedDB);
  vi.stubGlobal('window', { indexedDB });
});
afterEach(() => vi.unstubAllGlobals());

async function seed(version: number) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('diffchecker-guest', version);
    request.onupgradeneeded = () => {
      const db = request.result;
      const summaries = db.createObjectStore('diffs', { keyPath: 'id' });
      summaries.createIndex('idx_createdAt', 'createdAt');
      summaries.createIndex('idx_name', 'name');
      if (version === 1) summaries.put(record);
      else {
        const { diffData, ...summary } = record;
        summaries.put(summary);
        db.createObjectStore('diff-content').put(diffData, record.id);
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { request.result.close(); resolve(); };
  });
}

it.each([1, 2])('migrates version %s history without losing data or timestamps', async (version) => {
  await seed(version);
  const store = await import('./index');
  expect(await store.loadDiff(record.id)).toEqual(record);
  const summaries = await store.getAllDiffs();
  expect(summaries).toEqual([expect.objectContaining({ id: record.id, name: record.name, createdAt: record.createdAt })]);
  expect(summaries[0]).not.toHaveProperty('diffData');
  const db = await new Promise<IDBDatabase>((resolve) => {
    const request = indexedDB.open('diffchecker-guest');
    request.onsuccess = () => resolve(request.result);
  });
  expect(db.version).toBe(3);
  expect(db.transaction('diffs').objectStore('diffs').indexNames.contains('idx_name')).toBe(false);
  db.close();
  await store.deleteDiff(record.id);
  expect(await store.loadDiff(record.id)).toBeNull();
});

it('saves and reloads new comparisons after creating the database', async () => {
  const { saveDiff, loadDiff } = await import('./index');
  const saved = await saveDiff({ name: record.name, leftFileName: record.leftFileName, rightFileName: record.rightFileName, diffData: record.diffData });
  expect(await loadDiff(saved.id)).toEqual({ ...saved, diffData: record.diffData });
});
