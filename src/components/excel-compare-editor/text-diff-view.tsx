'use client';

import { useMemo, useState } from 'react';
import { alignSequences } from '@/lib/sequence-diff';
import { renderInlineDiff } from './inline-diff';
import styles from './styles.module.css';

interface TextDiffViewProps {
  csvLeft: string[];
  csvRight: string[];
}

const LINES_PER_PAGE = 500;

export function TextDiffView({ csvLeft, csvRight }: TextDiffViewProps) {
  const [page, setPage] = useState(0);
  const lines = useMemo(
    () => alignSequences(csvLeft, csvRight).items,
    [csvLeft, csvRight],
  );
  const pageCount = Math.max(1, Math.ceil(lines.length / LINES_PER_PAGE));
  const activePage = Math.min(page, pageCount - 1);
  const firstLine = activePage * LINES_PER_PAGE;
  const visibleLines = lines.slice(firstLine, firstLine + LINES_PER_PAGE);
  const { removedCount, addedCount } = useMemo(() => lines.reduce(
    (counts, line) => ({
      removedCount: counts.removedCount
        + (line.left !== line.right && line.left !== undefined ? 1 : 0),
      addedCount: counts.addedCount
        + (line.left !== line.right && line.right !== undefined ? 1 : 0),
    }),
    { removedCount: 0, addedCount: 0 },
  ), [lines]);

  return (
    <div className={styles.tableView}>
      <div className={styles.textGrid}>
        {(['left', 'right'] as const).map((side) => (
          <section className={styles.textPanel} key={side}>
            <header className={`${styles.textHeader} ${side === 'left' ? styles.removedHeader : styles.addedHeader}`}>
              <span>{side === 'left' ? `${removedCount} removals` : `${addedCount} additions`}</span>
              <span>{side === 'left' ? csvLeft.length : csvRight.length} lines</span>
            </header>
            <div className={styles.textScroller}>
              {visibleLines.map((line, index) => {
                const lineNumber = side === 'left' ? line.leftIndex : line.rightIndex;
                const value = side === 'left' ? line.left : line.right;
                return (
                  <div className={styles.textLine} key={`${side}-${firstLine + index}`}>
                    <span className={styles.textLineNumber}>{lineNumber === undefined ? '' : lineNumber + 1}</span>
                    <span className={styles.textContent}>
                      {value === undefined ? '' : renderInlineDiff(line.left, line.right, side)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className={styles.pagination} aria-label="Text result pages">
        <span className={styles.pageInfo}>
          {lines.length === 0 ? 'No lines' : `${firstLine + 1}–${Math.min(firstLine + LINES_PER_PAGE, lines.length)} of ${lines.length}`}
        </span>
        <button
          type="button"
          className={`${styles.button} ${styles.pageButton}`}
          disabled={activePage === 0}
          onClick={() => setPage(Math.max(0, activePage - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.pageButton}`}
          disabled={activePage >= pageCount - 1}
          onClick={() => setPage(Math.min(pageCount - 1, activePage + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
