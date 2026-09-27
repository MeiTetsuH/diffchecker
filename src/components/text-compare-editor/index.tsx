'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { Change } from 'diff';
import { alignSequences } from '@/lib/sequence-diff';
import { createInlineDiffer, INLINE_LIMIT_MESSAGE, type HighlightMode } from '@/lib/inline-diff';
import styles from './styles.module.css';

const INITIAL_VISIBLE_LINES = 500;

/**
 * spellCheck alone only hides the squiggles. On iOS the keyboard would still
 * capitalise the first letter and autocorrect code as it is typed.
 */
const CODE_INPUT_PROPS = {
  spellCheck: false,
  autoCapitalize: 'off',
  autoCorrect: 'off',
  autoComplete: 'off',
} as const;

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
  const { visible, highlightLimited } = useMemo(() => {
    const compare = createInlineDiffer(highlightMode);
    let highlightLimited = false;
    const visible = lines.slice(0, visibleLines).map((line) => {
      const result = compare(line.left, line.right);
      highlightLimited ||= result.limited;
      return { ...line, changes: result.changes };
    });
    return { visible, highlightLimited };
  }, [highlightMode, lines, visibleLines]);
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
            {...CODE_INPUT_PROPS}
          />
        </label>
        <label className={styles.inputGroup}>
          <span className={styles.label}>Changed</span>
          <textarea
            value={changedText}
            onChange={(event) => setChangedText(event.target.value)}
            className={styles.textarea}
            placeholder="Paste changed text or code"
            {...CODE_INPUT_PROPS}
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
      {highlightLimited && !isUpdating && (
        <div className={styles.limitedNotice} role="status">{INLINE_LIMIT_MESSAGE}</div>
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
                <span className={styles.count}>{originalLines.length} {originalLines.length === 1 ? 'line' : 'lines'}</span>
              </div>
              <div className={styles.headCell}>
                <span className={styles.panelTitle}>Changed</span>
                <span className={styles.count}>{changedLines.length} {changedLines.length === 1 ? 'line' : 'lines'}</span>
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
