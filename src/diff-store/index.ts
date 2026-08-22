import type { DiffData } from '@/types/excel-diff';
import type { SavedDiff, SavedDiffDTO, SavedDiffSummary } from './types';

const DB_NAME = 'diffchecker-guest';
const DB_VERSION = 2;
const SUMMARY_STORE = 'diffs';
const CONTENT_STORE = 'diff-content';
const MAX_DIFFS = 100;

let dbPromise: Promise<IDBDatabase> | null = null;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}

function migrateVersionOne(
  transaction: IDBTransaction,
  contentStore: IDBObjectStore,
): void {
  const summaryStore = transaction.objectStore(SUMMARY_STORE);
  const cursorRequest = summaryStore.openCursor();

  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;

    const legacy = cursor.value as SavedDiff;
    if (legacy.diffData) {
      const { diffData, ...summary } = legacy;
      contentStore.put(diffData, legacy.id);
      cursor.update(summary);
    }
    cursor.continue();
  };
}

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('Local diff history is not supported in this browser.'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let openingFailed = false;

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (!db.objectStoreNames.contains(SUMMARY_STORE)) {
        const summaryStore = db.createObjectStore(SUMMARY_STORE, { keyPath: 'id' });
        summaryStore.createIndex('idx_createdAt', 'createdAt', { unique: false });
        summaryStore.createIndex('idx_name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        const contentStore = db.createObjectStore(CONTENT_STORE);
        if (oldVersion === 1 && request.transaction) {
          migrateVersionOne(request.transaction, contentStore);
        }
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (openingFailed) {
        db.close();
        return;
      }
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      openingFailed = true;
      dbPromise = null;
      reject(request.error ?? new Error('Failed to open local diff history.'));
    };
    request.onblocked = () => {
      openingFailed = true;
      dbPromise = null;
      reject(new Error('Close other DiffChecker tabs to update local history.'));
    };
  });

  return dbPromise;
}

async function enforceQuota(db: IDBDatabase): Promise<void> {
  const readTransaction = db.transaction(SUMMARY_STORE, 'readonly');
  const summaries = await requestResult<SavedDiffSummary[]>(
    readTransaction.objectStore(SUMMARY_STORE).index('idx_createdAt').getAll(),
  );

  if (summaries.length <= MAX_DIFFS) return;

  const expired = summaries.slice(0, summaries.length - MAX_DIFFS);
  const writeTransaction = db.transaction([SUMMARY_STORE, CONTENT_STORE], 'readwrite');
  const completion = transactionComplete(writeTransaction);
  const summaryStore = writeTransaction.objectStore(SUMMARY_STORE);
  const contentStore = writeTransaction.objectStore(CONTENT_STORE);

  for (const record of expired) {
    summaryStore.delete(record.id);
    contentStore.delete(record.id);
  }
  await completion;
}

export async function saveDiff(dto: SavedDiffDTO): Promise<SavedDiffSummary> {
  const db = await getDB();
  const { diffData, ...metadata } = dto;
  const summary: SavedDiffSummary = {
    ...metadata,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const transaction = db.transaction([SUMMARY_STORE, CONTENT_STORE], 'readwrite');
  const completion = transactionComplete(transaction);
  transaction.objectStore(SUMMARY_STORE).put(summary);
  transaction.objectStore(CONTENT_STORE).put(diffData, summary.id);
  await completion;
  await enforceQuota(db);
  return summary;
}

export async function loadDiff(id: string): Promise<SavedDiff | null> {
  const db = await getDB();
  const transaction = db.transaction([SUMMARY_STORE, CONTENT_STORE], 'readonly');
  const summaryRequest = transaction.objectStore(SUMMARY_STORE).get(id);
  const contentRequest = transaction.objectStore(CONTENT_STORE).get(id);
  const [summary, diffData] = await Promise.all([
    requestResult<SavedDiffSummary | undefined>(summaryRequest),
    requestResult<DiffData | undefined>(contentRequest),
  ]);

  return summary && diffData ? { ...summary, diffData } : null;
}

export async function getAllDiffs(): Promise<SavedDiffSummary[]> {
  const db = await getDB();
  const transaction = db.transaction(SUMMARY_STORE, 'readonly');
  return requestResult<SavedDiffSummary[]>(
    transaction.objectStore(SUMMARY_STORE).index('idx_createdAt').getAll(),
  );
}

export async function deleteDiff(id: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([SUMMARY_STORE, CONTENT_STORE], 'readwrite');
  const completion = transactionComplete(transaction);
  transaction.objectStore(SUMMARY_STORE).delete(id);
  transaction.objectStore(CONTENT_STORE).delete(id);
  await completion;
}

export async function updateDiff(
  id: string,
  updates: Partial<SavedDiffDTO>,
): Promise<SavedDiff> {
  const existing = await loadDiff(id);
  if (!existing) throw new Error('Diff not found.');

  const updated: SavedDiff = {
    ...existing,
    ...updates,
    id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  const { diffData, ...summary } = updated;
  const db = await getDB();
  const transaction = db.transaction([SUMMARY_STORE, CONTENT_STORE], 'readwrite');
  const completion = transactionComplete(transaction);
  transaction.objectStore(SUMMARY_STORE).put(summary);
  transaction.objectStore(CONTENT_STORE).put(diffData, id);
  await completion;
  return updated;
}

export async function exportDiffs(): Promise<SavedDiff[]> {
  const summaries = await getAllDiffs();
  const records = await Promise.all(summaries.map((summary) => loadDiff(summary.id)));
  return records.filter((record): record is SavedDiff => record !== null);
}

export async function importDiffs(records: SavedDiff[]): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([SUMMARY_STORE, CONTENT_STORE], 'readwrite');
  const completion = transactionComplete(transaction);
  const summaryStore = transaction.objectStore(SUMMARY_STORE);
  const contentStore = transaction.objectStore(CONTENT_STORE);

  for (const record of records) {
    const { diffData, ...summary } = record;
    summaryStore.put(summary);
    contentStore.put(diffData, record.id);
  }
  await completion;
  await enforceQuota(db);
}

export async function searchDiffsByName(term: string): Promise<SavedDiffSummary[]> {
  const query = term.trim().toLowerCase();
  if (!query) return [];
  const summaries = await getAllDiffs();
  return summaries.filter((diff) => diff.name.toLowerCase().includes(query));
}
