'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { DiffHeader, DiffRow } from '@/types/excel-diff';
import { createInlineDiffer, INLINE_LIMIT_MESSAGE } from '@/lib/inline-diff';
import { renderInlineDiff } from './inline-diff';
import styles from './styles.module.css';

interface TableDiffViewProps {
  tableDiff: [DiffHeader, ...DiffRow[]];
  /** Changes whenever a new result is applied, so pagination can restart. */
  resultVersion: number;
}

const ROWS_PER_PAGE = 200;

// Memoised because both result tabs stay mounted: without it, every state
// change in the editor (switching tabs included) re-diffs each visible cell.
export const TableDiffView = memo(function TableDiffView({ tableDiff, resultVersion }: TableDiffViewProps) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [seenVersion, setSeenVersion] = useState(resultVersion);

  if (seenVersion !== resultVersion) {
    setSeenVersion(resultVersion);
    setPage(0);
  }

  const { headers, headersLeft, headersRight } = tableDiff[0];
  // Slicing the full result on every render (including every page click) is a
  // whole-array copy, so keep it tied to the identity of the diff itself.
  const diffRows = useMemo(() => tableDiff.slice(1) as DiffRow[], [tableDiff]);
  const pageCount = Math.max(1, Math.ceil(diffRows.length / ROWS_PER_PAGE));
  const activePage = Math.min(page, pageCount - 1);
  const firstRow = activePage * ROWS_PER_PAGE;
  const { visibleRows, highlightLimited } = useMemo(() => {
    const compare = createInlineDiffer();
    let highlightLimited = false;
    const visibleRows = diffRows.slice(firstRow, firstRow + ROWS_PER_PAGE).map((row) => ({
      row,
      changes: headers.map((header) => {
        const left = row.lRow?.[header];
        const right = row.rRow?.[header];
        if (row.type !== 'modified' || left === right) return null;
        const result = compare(left, right);
        highlightLimited ||= result.limited;
        return result.changes;
      }),
    }));
    return { visibleRows, highlightLimited };
  }, [diffRows, firstRow, headers]);
  const leftHeaders = useMemo(() => new Set(headersLeft), [headersLeft]);
  const rightHeaders = useMemo(() => new Set(headersRight), [headersRight]);

  // A new page or result starts at its first row, not wherever the last one
  // was left scrolled to.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [firstRow, tableDiff]);

  return (
    <div className={styles.tableView}>
      {highlightLimited && (
        <div className={`${styles.notice} ${styles.noticeInfo}`} role="status">{INLINE_LIMIT_MESSAGE}</div>
      )}
      <div className={styles.tableScroll} ref={scrollRef}>
        <table className={styles.diffTable}>
          <thead>
            <tr>
              <th className={`${styles.diffHeader} ${styles.lineNumberCell}`}>#</th>
              {headers.map((header) => {
                const onlyLeft = leftHeaders.has(header) && !rightHeaders.has(header);
                const onlyRight = !leftHeaders.has(header) && rightHeaders.has(header);
                const className = onlyLeft ? styles.headerRemoved : onlyRight ? styles.headerAdded : '';
                return (
                  <th key={header} className={`${styles.diffHeader} ${className}`}>{header}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ row, changes }, rowIndex) => {
              const rowClass = row.type === 'added'
                ? styles.rowAdded
                : row.type === 'removed'
                  ? styles.rowRemoved
                  : '';

              return (
                <tr key={firstRow + rowIndex} className={rowClass}>
                  <td className={styles.lineNumberCell}>{firstRow + rowIndex + 1}</td>
                  {headers.map((header, columnIndex) => {
                    const leftValue = row.lRow?.[header];
                    const rightValue = row.rRow?.[header];
                    const parts = changes[columnIndex];
                    let content: React.ReactNode;

                    if (row.type === 'added') {
                      content = <span className={styles.addedValue}>{rightValue === undefined ? '' : String(rightValue)}</span>;
                    } else if (row.type === 'removed') {
                      content = <span className={styles.removedValue}>{leftValue === undefined ? '' : String(leftValue)}</span>;
                    } else if (parts) {
                      content = (
                        <span className={styles.modifiedCell}>
                          <span className={styles.oldValue}>{renderInlineDiff(parts, 'left')}</span>
                          <span className={styles.newValue}>{renderInlineDiff(parts, 'right')}</span>
                        </span>
                      );
                    } else {
                      content = leftValue === undefined ? '' : String(leftValue);
                    }

                    return <td key={header} className={styles.diffCell}>{content}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination} aria-label="Table result pages">
        <span className={styles.pageInfo}>
          {diffRows.length === 0 ? 'No data rows' : `${firstRow + 1}–${Math.min(firstRow + ROWS_PER_PAGE, diffRows.length)} of ${diffRows.length}`}
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
});
