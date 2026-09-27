import { diffChars, diffWordsWithSpace, type Change } from 'diff';

export type HighlightMode = 'word' | 'character';
export interface InlineDiff {
  changes: Change[];
  limited: boolean;
}

export const INLINE_LIMIT_MESSAGE =
  'Some changes are highlighted as whole values to keep the page responsive. All text is preserved.';

const MAX_INPUT_LENGTH = 20_000;
const MAX_CACHE_ENTRIES = 4_000;
const MAX_CACHE_CHARACTERS = 1_000_000;
const cache = new Map<string, Change[]>();
let cacheCharacters = 0;

function wholeValueChanges(left: string, right: string): Change[] {
  return [
    ...(left ? [{ value: left, removed: true, added: false, count: left.length }] : []),
    ...(right ? [{ value: right, removed: false, added: true, count: right.length }] : []),
  ];
}

/** One budget for the entire visible page, not a fresh timeout for each cell. */
export function createInlineDiffer(mode: HighlightMode = 'character', budgetMs = 16) {
  let remaining = budgetMs;

  return (leftValue: unknown, rightValue: unknown): InlineDiff => {
    const left = leftValue == null ? '' : String(leftValue);
    const right = rightValue == null ? '' : String(rightValue);
    if (left === right) {
      return { changes: [{ value: left, added: false, removed: false, count: left.length }], limited: false };
    }
    if (!left || !right) {
      return { changes: wholeValueChanges(left, right), limited: false };
    }
    if (left.length + right.length > MAX_INPUT_LENGTH) {
      return { changes: wholeValueChanges(left, right), limited: true };
    }

    // Length-prefixing prevents ambiguous pairs; only exact results are cached.
    const key = `${mode}:${left.length}:${left}${right}`;
    const cached = cache.get(key);
    if (cached) return { changes: cached, limited: false };
    if (remaining <= 0) {
      return { changes: wholeValueChanges(left, right), limited: true };
    }

    const start = performance.now();
    const options = { maxEditLength: 256, timeout: Math.max(1, Math.floor(remaining)) };
    const changes = mode === 'word'
      ? diffWordsWithSpace(left, right, options)
      : diffChars(left, right, options);
    remaining -= performance.now() - start;
    if (!changes) return { changes: wholeValueChanges(left, right), limited: true };

    // Bound both the number of entries and retained text, including cache keys.
    const size = key.length + changes.reduce((sum, part) => sum + part.value.length, 0);
    while (cache.size >= MAX_CACHE_ENTRIES || cacheCharacters + size > MAX_CACHE_CHARACTERS) {
      const oldest = cache.entries().next().value;
      if (!oldest) break;
      cacheCharacters -= oldest[0].length + oldest[1].reduce((sum, part) => sum + part.value.length, 0);
      cache.delete(oldest[0]);
    }
    cache.set(key, changes);
    cacheCharacters += size;
    return { changes, limited: false };
  };
}
