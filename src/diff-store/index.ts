import { idb, Collection, Selector } from 'async-idb-orm';
import type { SavedDiff, SavedDiffDTO } from './types';

/**
 * Database configuration
 */
const DB_NAME = 'diffchecker-guest';
const DB_VERSION = 1;
const MAX_DIFFS = 100; // automatic cleanup cap


// collection for saved diffs
const diffs = Collection.create<SavedDiff, SavedDiffDTO>()
  .withIndexes([
    { key: 'createdAt', name: 'idx_createdAt' },
    { key: 'name', name: 'idx_name' },
  ])
  .withTransformers({
    create: (dto: SavedDiffDTO): SavedDiff => ({
      ...dto,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }),
    update: (record: SavedDiff): SavedDiff => ({
      ...record,
      updatedAt: Date.now(),
    }),
  });

// Bundle schema separately for typings
const schema = { diffs } as const;

// @ts-ignore
export const db = idb(DB_NAME, {
  schema,
  version: DB_VERSION,
});

async function enforceQuota() {
  const count = (await db.collections.diffs.all()).length;
  if (count <= MAX_DIFFS) return;
  const overflow = count - MAX_DIFFS;
  const oldest = await db.collections.diffs.getIndexRange(
    'idx_createdAt',
    IDBKeyRange.lowerBound(0),
  );
  const toDelete = oldest.slice(0, overflow);
  await db.collections.diffs.deleteMany((d) => toDelete.some((o) => o.id === d.id));
}

export async function saveDiff(dto: SavedDiffDTO): Promise<SavedDiff> {
  try {
    const saved = await db.collections.diffs.create(dto);
    await enforceQuota();
    return saved;
  } catch (e) {
    handleError(e);
    throw e;
  }
}

export async function loadDiff(id: string): Promise<SavedDiff | null> {
  try {
    return await db.collections.diffs.find(id);
  } catch (e) {
    handleError(e);
    return null;
  }
}

export async function getAllDiffs(): Promise<SavedDiff[]> {
  try {
    return await db.collections.diffs.all();
  } catch (e) {
    handleError(e);
    return [];
  }
}

export async function deleteDiff(id: string): Promise<void> {
  try {
    await db.collections.diffs.delete(id);
  } catch (e) {
    handleError(e);
  }
}

export async function updateDiff(id: string, updates: Partial<SavedDiffDTO>): Promise<SavedDiff> {
  try {
    const existing = await db.collections.diffs.find(id);
    if (!existing) throw new Error('Diff not found');
    return await db.collections.diffs.update({ ...existing, ...updates });
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
    await db.collections.diffs.upsert(...records);
    await enforceQuota();
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

const recentDiffsSelector = Selector.create<typeof schema, {}>()
  .as(async (ctx) => {
    const all = await ctx.diffs.getIndexRange('idx_createdAt', IDBKeyRange.lowerBound(0));
    return all.sort((a: SavedDiff, b: SavedDiff) => b.createdAt - a.createdAt).slice(0, 10);
  });

const diffCountSelector = Selector.create<typeof schema, {}>()
  .as(async (ctx) => (await ctx.diffs.all()).length);

export const diffSelectors = {
  recent: recentDiffsSelector,
  diffCount: diffCountSelector,
};


function handleError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('diff-storage-error', { detail: msg }));
  }
  // eslint-disable-next-line no-console
  console.error('diff-store error', err);
}
