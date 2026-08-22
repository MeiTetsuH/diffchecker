'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { diffChars, diffWords, type Change } from 'diff';
import { alignSequences } from '@/lib/sequence-diff';
import styles from './styles.module.css';

type HighlightMode = 'word' | 'character';

const INITIAL_VISIBLE_LINES = 500;

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
  const lines = useMemo(
    () => alignSequences(originalLines, changedLines).items,
    [changedLines, originalLines],
  );
  const visible = useMemo(
    () => lines.slice(0, visibleLines).map((line) => ({
      ...line,
      changes: compareLine(line.left ?? '', line.right ?? '', highlightMode),
    })),
    [highlightMode, lines, visibleLines],
  );
  const changedLineCount = useMemo(() => lines.reduce(
    (count, line) => count + (line.left !== line.right ? 1 : 0),
    0,
  ), [lines]);

  return (
    <div className={styles.editor} aria-busy={isUpdating}>
      <div className={styles.inputs}>
        <label className={styles.inputGroup}>
          <span className={styles.label}>Original</span>
          <textarea
            value={originalText}
            onChange={(event) => {
              setOriginalText(event.target.value);
              setVisibleLines(INITIAL_VISIBLE_LINES);
            }}
            className={styles.textarea}
            placeholder="Paste original text or code"
            spellCheck={false}
          />
        </label>
        <label className={styles.inputGroup}>
          <span className={styles.label}>Changed</span>
          <textarea
            value={changedText}
            onChange={(event) => {
              setChangedText(event.target.value);
              setVisibleLines(INITIAL_VISIBLE_LINES);
            }}
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
        <span className={styles.status} aria-live="polite">
          {isUpdating ? 'Updating comparison…' : `${changedLineCount} changed ${changedLineCount === 1 ? 'line' : 'lines'}`}
        </span>
      </div>
      {(originalText || changedText) && (
        <div className={styles.results}>
          {(['left', 'right'] as const).map((side) => (
            <section className={styles.panel} key={side} aria-label={side === 'left' ? 'Original result' : 'Changed result'}>
              <header className={styles.panelHeader}>
                <span className={styles.panelTitle}>{side === 'left' ? 'Original' : 'Changed'}</span>
                <span className={styles.count}>{side === 'left' ? originalLines.length : changedLines.length} lines</span>
              </header>
              <div className={styles.lines}>
                {visible.map((line, index) => {
                  const lineIndex = side === 'left' ? line.leftIndex : line.rightIndex;
                  return (
                    <div className={styles.line} key={`${side}-${index}`}>
                      <span className={styles.lineNumber}>{lineIndex === undefined ? '' : lineIndex + 1}</span>
                      <span className={styles.lineContent}>
                        <DiffContent changes={line.changes} side={side} />
                      </span>
                    </div>
                  );
                })}
                {visibleLines < lines.length && (
                  <div className={styles.more}>
                    <button
                      type="button"
                      className={styles.moreButton}
                      onClick={() => setVisibleLines((count) => count + INITIAL_VISIBLE_LINES)}
                    >
                      Show more lines
                    </button>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
