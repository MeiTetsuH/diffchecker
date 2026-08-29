'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { diffChars, diffWords, type Change } from 'diff';
import { alignSequences } from '@/lib/sequence-diff';
import styles from './styles.module.css';

type HighlightMode = 'word' | 'character';

const INITIAL_VISIBLE_LINES = 500;
/** Keeps the per-line diff cache from growing without bound on long sessions. */
const MAX_CACHED_LINES = 4_000;

function fallbackChanges(original: string, changed: string): Change[] {
  const changes: Change[] = [];
  if (original) {
    changes.push({ value: original, removed: true, added: false, count: original.length });
  }
  if (changed) {
    changes.push({ value: changed, removed: false, added: true, count: changed.length });
  }
  return changes;
}

function compareLine(original: string, changed: string, mode: HighlightMode): Change[] {
  if (original === changed) {
    return [{ value: original, removed: false, added: false, count: original.length }];
  }

  const changes = mode === 'word'
    ? diffWords(original, changed, { maxEditLength: 2_000 })
    : diffChars(original, changed, { maxEditLength: 2_000 });

  return changes ?? fallbackChanges(original, changed);
}

/**
 * `compareLine` is pure, so memoising it on all three inputs is sound. The cache
 * lives at module scope: React treats both refs and memo results as off-limits
 * for mutation during render, and a keystroke only ever changes a line or two,
 * so reusing the rest is what keeps typing cheap on large documents.
 * The key is length-prefixed so no pair of lines can collide.
 */
const lineCache = new Map<string, Change[]>();

function cachedCompareLine(left: string, right: string, mode: HighlightMode): Change[] {
  const key = `${mode}:${left.length}:${left}${right}`;
  const cached = lineCache.get(key);
  if (cached) return cached;

  if (lineCache.size > MAX_CACHED_LINES) lineCache.clear();
  const changes = compareLine(left, right, mode);
  lineCache.set(key, changes);
  return changes;
}

function DiffContent({ changes, side }: { changes: Change[]; side: 'left' | 'right' }) {
  return changes.map((part, index) => {
    if ((side === 'left' && part.added) || (side === 'right' && part.removed)) return null;
    const className = part.removed ? styles.removed : part.added ? styles.added : undefined;
    return <span key={`${index}-${part.value.length}`} className={className}>{part.value}</span>;
  });
}

export default function TextCompareEditor() {
  const [originalText, setOriginalText] = useState('');
  const [changedText, setChangedText] = useState('');
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('character');
  const [visibleLines, setVisibleLines] = useState(INITIAL_VISIBLE_LINES);
  const deferredOriginal = useDeferredValue(originalText);
  const deferredChanged = useDeferredValue(changedText);
  const isUpdating = deferredOriginal !== originalText || deferredChanged !== changedText;

  const originalLines = useMemo(() => deferredOriginal.split('\n'), [deferredOriginal]);
  const changedLines = useMemo(() => deferredChanged.split('\n'), [deferredChanged]);
  const alignment = useMemo(
    () => alignSequences(originalLines, changedLines),
    [changedLines, originalLines],
  );
  const lines = alignment.items;
  const visible = useMemo(
    () => lines.slice(0, visibleLines).map((line) => ({
      ...line,
      changes: cachedCompareLine(line.left ?? '', line.right ?? '', highlightMode),
    })),
    [highlightMode, lines, visibleLines],
  );
  const changedLineCount = useMemo(() => lines.reduce(
    (count, line) => count + (line.left !== line.right ? 1 : 0),
    0,
  ), [lines]);

  const hasInput = Boolean(originalText || changedText);

  return (
    <div className={styles.editor} aria-busy={isUpdating}>
      <div className={styles.inputs}>
        <label className={styles.inputGroup}>
          <span className={styles.label}>Original</span>
          <textarea
            value={originalText}
            onChange={(event) => setOriginalText(event.target.value)}
            className={styles.textarea}
            placeholder="Paste original text or code"
            spellCheck={false}
          />
        </label>
        <label className={styles.inputGroup}>
          <span className={styles.label}>Changed</span>
          <textarea
            value={changedText}
            onChange={(event) => setChangedText(event.target.value)}
            className={styles.textarea}
            placeholder="Paste changed text or code"
            spellCheck={false}
          />
        </label>
      </div>
      <div className={styles.controls}>
        <select
          value={highlightMode}
          onChange={(event) => setHighlightMode(event.target.value as HighlightMode)}
          className={styles.select}
          aria-label="Diff granularity"
        >
          <option value="character">Character diff</option>
          <option value="word">Word diff</option>
        </select>
        <span className={styles.status} aria-live="polite" aria-atomic="true">
          {isUpdating ? 'Updating comparison…' : `${changedLineCount} changed ${changedLineCount === 1 ? 'line' : 'lines'}`}
        </span>
      </div>
      {alignment.limited && !isUpdating && (
        <div className={styles.limitedNotice} role="status">
          These texts differ too heavily to align exactly, so lines were paired by
          position. Insertions and deletions may appear shifted.
        </div>
      )}
      {/* One scroll container holding paired rows: the two sides stay aligned
          and scroll together even when a long line wraps. The header sits
          inside it as a sticky row on the same grid, so the divider between
          the two sides cannot drift out of line with the body's. */}
      {hasInput && (
        <div className={styles.results}>
          <div className={styles.resultsBody}>
            <div className={styles.resultsHead}>
              <div className={styles.headCell}>
                <span className={styles.panelTitle}>Original</span>
                <span className={styles.count}>{originalLines.length} lines</span>
              </div>
              <div className={styles.headCell}>
                <span className={styles.panelTitle}>Changed</span>
                <span className={styles.count}>{changedLines.length} lines</span>
              </div>
            </div>
            {visible.map((line, index) => (
              <div className={styles.row} key={index}>
                <span className={styles.lineNumber}>
                  {line.leftIndex === undefined ? '' : line.leftIndex + 1}
                </span>
                <span className={styles.lineContent}>
                  <DiffContent changes={line.changes} side="left" />
                </span>
                <span className={`${styles.lineNumber} ${styles.rightGutter}`}>
                  {line.rightIndex === undefined ? '' : line.rightIndex + 1}
                </span>
                <span className={styles.lineContent}>
                  <DiffContent changes={line.changes} side="right" />
                </span>
              </div>
            ))}
            {visibleLines < lines.length && (
              <div className={styles.more}>
                <button
                  type="button"
                  className={styles.moreButton}
                  onClick={() => setVisibleLines((count) => count + INITIAL_VISIBLE_LINES)}
                >
                  Show more lines ({lines.length - visibleLines} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
