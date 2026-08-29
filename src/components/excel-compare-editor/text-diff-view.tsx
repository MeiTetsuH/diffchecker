'use client';

import { useMemo, useState } from 'react';
import { alignSequences } from '@/lib/sequence-diff';
import { renderInlineDiff } from './inline-diff';
import styles from './styles.module.css';

interface TextDiffViewProps {
  csvLeft: string[];
  csvRight: string[];
  /** Changes whenever a new result is applied, so pagination can restart. */
  resultVersion: number;
}

const LINES_PER_PAGE = 500;

export function TextDiffView({ csvLeft, csvRight, resultVersion }: TextDiffViewProps) {
  const [page, setPage] = useState(0);
  const [seenVersion, setSeenVersion] = useState(resultVersion);

  if (seenVersion !== resultVersion) {
    setSeenVersion(resultVersion);
    setPage(0);
  }

  const alignment = useMemo(
    () => alignSequences(csvLeft, csvRight),
    [csvLeft, csvRight],
  );
  const lines = alignment.items;
  const pageCount = Math.max(1, Math.ceil(lines.length / LINES_PER_PAGE));
  const activePage = Math.min(page, pageCount - 1);
  const firstLine = activePage * LINES_PER_PAGE;
  const visibleLines = useMemo(
    () => lines.slice(firstLine, firstLine + LINES_PER_PAGE),
    [lines, firstLine],
  );
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
      <div className={styles.textFrame}>
        <div className={styles.textHead}>
          <div className={`${styles.textHeadCell} ${styles.removedHeader}`}>
            <span>{removedCount} removals</span>
            <span>{csvLeft.length} lines</span>
          </div>
          <div className={`${styles.textHeadCell} ${styles.addedHeader}`}>
            <span>{addedCount} additions</span>
            <span>{csvRight.length} lines</span>
          </div>
        </div>
        {/* One scroll container holding paired rows keeps the two sides aligned
            when a long line wraps, and scrolls them together. */}
        <div className={styles.textBody}>
          {visibleLines.map((line, index) => (
            <div className={styles.textRow} key={firstLine + index}>
              <span className={styles.textLineNumber}>
                {line.leftIndex === undefined ? '' : line.leftIndex + 1}
              </span>
              <span className={styles.textContent}>
                {line.left === undefined ? '' : renderInlineDiff(line.left, line.right, 'left')}
              </span>
              <span className={`${styles.textLineNumber} ${styles.textRightGutter}`}>
                {line.rightIndex === undefined ? '' : line.rightIndex + 1}
              </span>
              <span className={styles.textContent}>
                {line.right === undefined ? '' : renderInlineDiff(line.left, line.right, 'right')}
              </span>
            </div>
          ))}
        </div>
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
