import { diffArrays } from 'diff';

export interface AlignedItem<T> {
  left?: T;
  right?: T;
  leftIndex?: number;
  rightIndex?: number;
}

export interface AlignmentResult<T> {
  items: AlignedItem<T>[];
  limited: boolean;
}

interface AlignOptions {
  maxEditLength?: number;
}

function alignByPosition<T>(left: T[], right: T[]): AlignedItem<T>[] {
  const length = Math.max(left.length, right.length);
  return Array.from({ length }, (_, index) => ({
    left: left[index],
    right: right[index],
    leftIndex: index < left.length ? index : undefined,
    rightIndex: index < right.length ? index : undefined,
  }));
}

/**
 * Aligns two sequences while keeping insertions and removals on their own side.
 * If the edit distance is extreme, positional alignment avoids an expensive
 * worst-case diff while still returning a useful comparison.
 */
export function alignSequences<T>(
  left: T[],
  right: T[],
  options: AlignOptions = {},
): AlignmentResult<T> {
  const changes = diffArrays(left, right, {
    maxEditLength: options.maxEditLength ?? 2_000,
  });

  if (!changes) {
    return { items: alignByPosition(left, right), limited: true };
  }

  const items: AlignedItem<T>[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  for (let changeIndex = 0; changeIndex < changes.length;) {
    const change = changes[changeIndex];

    if (!change.added && !change.removed) {
      for (const value of change.value) {
        items.push({ left: value, right: value, leftIndex, rightIndex });
        leftIndex += 1;
        rightIndex += 1;
      }
      changeIndex += 1;
      continue;
    }

    const removed: Array<{ value: T; index: number }> = [];
    const added: Array<{ value: T; index: number }> = [];

    while (changeIndex < changes.length) {
      const changed = changes[changeIndex];
      if (!changed.added && !changed.removed) break;

      if (changed.removed) {
        for (const value of changed.value) {
          removed.push({ value, index: leftIndex });
          leftIndex += 1;
        }
      } else {
        for (const value of changed.value) {
          added.push({ value, index: rightIndex });
          rightIndex += 1;
        }
      }
      changeIndex += 1;
    }

    const blockLength = Math.max(removed.length, added.length);
    for (let index = 0; index < blockLength; index += 1) {
      items.push({
        left: removed[index]?.value,
        right: added[index]?.value,
        leftIndex: removed[index]?.index,
        rightIndex: added[index]?.index,
      });
    }
  }

  return { items, limited: false };
}
