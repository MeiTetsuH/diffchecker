import type { SavedDiff, SavedDiffDTO } from './types';

/**
 * IndexedDB storage layer for saved diffs.
 *
 * Uses native IndexedDB API with a lazy-initialized singleton connection.
 * Fully SSR-safe: all operations bail early when `window` is unavailable.
 */

const DB_NAME = 'diffchecker-guest';
const DB_VERSION = 1;
const STORE_NAME = 'diffs';
const MAX_DIFFS = 100;

// ---------------------------------------------------------------------------
// Lazy singleton DB connection
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available on the server.'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('idx_createdAt', 'createdAt', { unique: false });
        store.createIndex('idx_name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null; // allow retry on next call
      reject(request.error);
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode,
): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function wrap<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function wrapTransaction(txn: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    txn.oncomplete = () => resolve();
    txn.onerror = () => reject(txn.error);
    txn.onabort = () => reject(txn.error ?? new Error('Transaction aborted'));
  });
}

// ---------------------------------------------------------------------------
// Quota management
// ---------------------------------------------------------------------------

async function enforceQuota(db: IDBDatabase): Promise<void> {
  const store = tx(db, 'readonly');
  const all = await wrap<SavedDiff[]>(store.index('idx_createdAt').getAll());

  if (all.length <= MAX_DIFFS) return;

  // `all` is sorted by createdAt ascending (index order)
  const toDelete = all.slice(0, all.length - MAX_DIFFS);
  const writeStore = tx(db, 'readwrite');

  for (const record of toDelete) {
    writeStore.delete(record.id);
  }

  await wrapTransaction(writeStore.transaction);
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

function handleError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('diff-storage-error', { detail: msg }));
  }
  console.error('diff-store error', err);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function saveDiff(dto: SavedDiffDTO): Promise<SavedDiff> {
  try {
    const db = await getDB();
    const record: SavedDiff = {
      ...dto,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    const store = tx(db, 'readwrite');
    await wrap(store.put(record));
    await enforceQuota(db);
    return record;
  } catch (e) {
    handleError(e);
    throw e;
  }
}

export async function loadDiff(id: string): Promise<SavedDiff | null> {
  try {
    const db = await getDB();
    const store = tx(db, 'readonly');
    const result = await wrap<SavedDiff | undefined>(store.get(id));
    return result ?? null;
  } catch (e) {
    handleError(e);
    return null;
  }
}

export async function getAllDiffs(): Promise<SavedDiff[]> {
  try {
    const db = await getDB();
    const store = tx(db, 'readonly');
    return await wrap<SavedDiff[]>(store.getAll());
  } catch (e) {
    handleError(e);
    return [];
  }
}

export async function deleteDiff(id: string): Promise<void> {
  try {
    const db = await getDB();
    const store = tx(db, 'readwrite');
    await wrap(store.delete(id));
  } catch (e) {
    handleError(e);
  }
}

export async function updateDiff(
  id: string,
  updates: Partial<SavedDiffDTO>,
): Promise<SavedDiff> {
  try {
    const db = await getDB();
    const readStore = tx(db, 'readonly');
    const existing = await wrap<SavedDiff | undefined>(readStore.get(id));
    if (!existing) throw new Error('Diff not found');

    const updated: SavedDiff = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    const writeStore = tx(db, 'readwrite');
    await wrap(writeStore.put(updated));
    return updated;
  } catch (e) {
    handleError(e);
    throw e;
  }
}

export async function exportDiffs(): Promise<SavedDiff[]> {
  return getAllDiffs();
}

export async function importDiffs(records: SavedDiff[]): Promise<void> {
  try {
    const db = await getDB();
    const store = tx(db, 'readwrite');

    for (const record of records) {
      store.put(record);
    }

    await wrapTransaction(store.transaction);
    await enforceQuota(db);
  } catch (e) {
    handleError(e);
  }
}

export async function searchDiffsByName(term: string): Promise<SavedDiff[]> {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  const all = await getAllDiffs();
  return all.filter((d) => d.name.toLowerCase().includes(q));
}