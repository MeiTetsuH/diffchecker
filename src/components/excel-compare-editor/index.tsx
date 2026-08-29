'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { deleteDiff, getAllDiffs, loadDiff, saveDiff } from '@/diff-store';
import type { SavedDiffSummary } from '@/diff-store/types';
import type { DiffData, DiffHeader, DiffRow } from '@/types/excel-diff';
import { DropZone, type LoadedFile } from './drop-zone';
import { TableDiffView } from './table-diff-view';
import { TextDiffView } from './text-diff-view';
import styles from './styles.module.css';

const ACCEPTED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/tab-separated-values',
]);

/**
 * Parsing happens on the main thread, so an oversized workbook would freeze the
 * tab with no way out. Refuse it up front with an explanation instead.
 */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

type Side = 'left' | 'right';
type Notice = { tone: 'error' | 'info'; message: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Local history is full. Delete older saved diffs and try again.';
  }
  return fallback;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Yields one frame so the "Comparing…" state can paint before the main thread
 * blocks. requestAnimationFrame alone never fires in a background tab, which
 * would strand the button in its disabled state, so race it against a timer.
 */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    requestAnimationFrame(finish);
    setTimeout(finish, 50);
  });
}

export default function ExcelCompareEditor() {
  const [left, setLeft] = useState<LoadedFile | null>(null);
  const [right, setRight] = useState<LoadedFile | null>(null);
  const [leftSheet, setLeftSheet] = useState('');
  const [rightSheet, setRightSheet] = useState('');
  const [leftHeaderLine, setLeftHeaderLine] = useState(1);
  const [rightHeaderLine, setRightHeaderLine] = useState(1);
  const [loading, setLoading] = useState<Record<Side, boolean>>({ left: false, right: false });
  const [isComparing, setIsComparing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'text'>('table');
  const [tableDiff, setTableDiff] = useState<[DiffHeader, ...DiffRow[]] | null>(null);
  const [csvLeft, setCsvLeft] = useState<string[]>([]);
  const [csvRight, setCsvRight] = useState<string[]>([]);
  // Bumped on every new result so the views can drop their pagination state.
  const [resultVersion, setResultVersion] = useState(0);
  const [savedDiffs, setSavedDiffs] = useState<SavedDiffSummary[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);
  const fileRequest = useRef<Record<Side, number>>({ left: 0, right: 0 });
  const tabRefs = useRef<Record<'table' | 'text', HTMLButtonElement | null>>({
    table: null,
    text: null,
  });

  useEffect(() => {
    let active = true;
    getAllDiffs()
      .then((diffs) => {
        if (active) setSavedDiffs([...diffs].sort((a, b) => b.createdAt - a.createdAt));
      })
      .catch(() => {
        if (active) {
          setNotice({ tone: 'error', message: 'Local diff history is unavailable in this browser.' });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const invalidateResult = () => {
    setShowDiff(false);
    setTableDiff(null);
    setCsvLeft([]);
    setCsvRight([]);
  };

  const clearSide = (side: Side) => {
    fileRequest.current[side] += 1;
    const inputRef = side === 'left' ? leftInputRef : rightInputRef;
    if (inputRef.current) inputRef.current.value = '';

    if (side === 'left') {
      setLeft(null);
      setLeftSheet('');
      setLeftHeaderLine(1);
    } else {
      setRight(null);
      setRightSheet('');
      setRightHeaderLine(1);
    }
    setNotice(null);
    invalidateResult();
  };

  const handleFiles = async (files: FileList | null, side: Side) => {
    if (!files?.length) return;
    const file = files[0];
    const inputRef = side === 'left' ? leftInputRef : rightInputRef;

    // Clearing the input lets the user re-pick the same path after editing it
    // on disk; otherwise the browser fires no change event the second time.
    if (inputRef.current) inputRef.current.value = '';

    if (!ACCEPTED_MIME.has(file.type) && !/\.(xlsx|xls|csv|tsv)$/i.test(file.name)) {
      setNotice({ tone: 'error', message: 'Unsupported file type. Choose XLSX, XLS, CSV, or TSV.' });
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setNotice({
        tone: 'error',
        message: `That file is ${formatBytes(file.size)}. Spreadsheets are parsed in this tab, so the limit is ${formatBytes(MAX_FILE_BYTES)}. Split the sheet and compare it in parts.`,
      });
      return;
    }

    const requestId = fileRequest.current[side] + 1;
    fileRequest.current[side] = requestId;

    setLoading((current) => ({ ...current, [side]: true }));
    setNotice(null);

    try {
      const [arrayBuffer, XLSX] = await Promise.all([
        file.arrayBuffer(),
        import('xlsx'),
      ]);
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        dense: true,
        cellFormula: false,
        cellHTML: false,
        cellStyles: false,
      });

      if (fileRequest.current[side] !== requestId) return;
      if (workbook.SheetNames.length === 0) {
        throw new Error('The workbook has no worksheets.');
      }

      const loaded: LoadedFile = { file, data: workbook };
      if (side === 'left') {
        setLeft(loaded);
        setLeftSheet(workbook.SheetNames[0]);
        setLeftHeaderLine(1);
      } else {
        setRight(loaded);
        setRightSheet(workbook.SheetNames[0]);
        setRightHeaderLine(1);
      }
      invalidateResult();
    } catch (error) {
      if (fileRequest.current[side] === requestId) {
        setNotice({
          tone: 'error',
          message: errorMessage(error, 'Could not read this spreadsheet. The file may be damaged or unsupported.'),
        });
      }
    } finally {
      if (fileRequest.current[side] === requestId) {
        setLoading((current) => ({ ...current, [side]: false }));
      }
    }
  };

  const applyDiff = (result: DiffData) => {
    setTableDiff(result.tableDiff);
    setCsvLeft(result.csvLeft);
    setCsvRight(result.csvRight);
    setActiveTab('table');
    setShowDiff(true);
    setResultVersion((version) => version + 1);
  };

  const findDifferences = async () => {
    if (!left || !right || isComparing) return;
    if (!left.data.SheetNames.includes(leftSheet) || !right.data.SheetNames.includes(rightSheet)) {
      setNotice({ tone: 'error', message: 'Select a valid worksheet on both sides.' });
      return;
    }

    setIsComparing(true);
    setNotice(null);

    try {
      await nextFrame();
      const { computeDiff } = await import('./diff-engine');
      const result = computeDiff({
        leftWorkbook: left.data,
        rightWorkbook: right.data,
        leftSheet,
        rightSheet,
        leftHeaderLine,
        rightHeaderLine,
      });
      applyDiff(result);

      if (result.alignmentLimited) {
        setNotice({
          tone: 'info',
          message: 'These sheets differ heavily, so rows were aligned by position to keep the browser responsive.',
        });
      }

      // Re-running the same pair refreshes its history entry rather than piling
      // up identical copies of the diff.
      const existing = savedDiffs.find(
        (diff) => diff.leftFileName === left.file.name && diff.rightFileName === right.file.name,
      );

      saveDiff(
        {
          name: `${left.file.name} vs ${right.file.name}`,
          leftFileName: left.file.name,
          rightFileName: right.file.name,
          diffData: result,
        },
        existing?.id,
      )
        .then((saved) => {
          setSavedDiffs((current) => [saved, ...current.filter((diff) => diff.id !== saved.id)]);
        })
        .catch((error) => {
          setNotice({
            tone: 'error',
            message: errorMessage(error, 'Comparison finished, but it could not be saved to local history.'),
          });
        });
    } catch {
      setNotice({ tone: 'error', message: 'Could not compare these worksheets.' });
    } finally {
      setIsComparing(false);
    }
  };

  const loadSavedDiff = async (id: string) => {
    try {
      const record = await loadDiff(id);
      if (!record) {
        setNotice({ tone: 'error', message: 'This saved diff is no longer available.' });
        return;
      }
      applyDiff(record.diffData);
      setNotice(null);
    } catch {
      setNotice({ tone: 'error', message: 'Could not load this saved diff.' });
    }
  };

  const removeSavedDiff = async (id: string) => {
    try {
      await deleteDiff(id);
      setSavedDiffs((current) => current.filter((diff) => diff.id !== id));
    } catch {
      setNotice({ tone: 'error', message: 'Could not delete this saved diff.' });
    }
  };

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = activeTab === 'table' ? 'text' : 'table';
    setActiveTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={styles.editor}>
      {notice && (
        <div
          className={`${styles.notice} ${notice.tone === 'error' ? styles.noticeError : styles.noticeInfo}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.message}
        </div>
      )}

      <div className={styles.uploadGrid}>
        <DropZone
          side="left"
          loadedFile={left}
          inputRef={leftInputRef}
          isLoading={loading.left}
          onFiles={handleFiles}
          onClear={() => clearSide('left')}
          sheetName={leftSheet}
          setSheetName={(sheet) => {
            setLeftSheet(sheet);
            setLeftHeaderLine(1);
            invalidateResult();
          }}
          headerLine={leftHeaderLine}
          setHeaderLine={(line) => {
            setLeftHeaderLine(line);
            invalidateResult();
          }}
        />
        <DropZone
          side="right"
          loadedFile={right}
          inputRef={rightInputRef}
          isLoading={loading.right}
          onFiles={handleFiles}
          onClear={() => clearSide('right')}
          sheetName={rightSheet}
          setSheetName={(sheet) => {
            setRightSheet(sheet);
            setRightHeaderLine(1);
            invalidateResult();
          }}
          headerLine={rightHeaderLine}
          setHeaderLine={(line) => {
            setRightHeaderLine(line);
            invalidateResult();
          }}
        />
      </div>

      <div className={styles.actionRow}>
        <button
          type="button"
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={() => void findDifferences()}
          disabled={!left || !right || isComparing || loading.left || loading.right}
        >
          {isComparing ? 'Comparing locally…' : 'Find differences'}
        </button>
      </div>

      {/* The history sidebar is independent of the current result, so saved
          diffs stay reachable on a fresh page load. */}
      <div className={styles.resultsLayout}>
        <aside className={styles.history} aria-label="Saved diff history">
          <h2 className={styles.historyTitle}>Saved diffs</h2>
          {savedDiffs.length === 0 ? (
            <span className={styles.emptyHistory}>No local history yet.</span>
          ) : (
            <ul className={styles.historyList}>
              {savedDiffs.map((diff) => (
                <li key={diff.id} className={styles.historyItem}>
                  <button
                    type="button"
                    className={styles.historyButton}
                    onClick={() => void loadSavedDiff(diff.id)}
                  >
                    <span className={styles.historyName} title={diff.name}>{diff.name}</span>
                    <time className={styles.historyDate} dateTime={new Date(diff.createdAt).toISOString()}>
                      {new Date(diff.createdAt).toLocaleString()}
                    </time>
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteHistory}`}
                    onClick={() => void removeSavedDiff(diff.id)}
                    aria-label={`Delete ${diff.name}`}
                    title="Delete saved diff"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={styles.diffSection} aria-label="Comparison result">
          {showDiff && tableDiff ? (
            <>
              <div className={styles.tabs} role="tablist" aria-label="Result format" onKeyDown={onTabKeyDown}>
                {(['table', 'text'] as const).map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    id={`result-tab-${tab}`}
                    ref={(node) => {
                      tabRefs.current[tab] = node;
                    }}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`result-panel-${tab}`}
                    tabIndex={activeTab === tab ? 0 : -1}
                    className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'table' ? 'Table' : 'CSV text'}
                  </button>
                ))}
              </div>
              {/* Both panels stay mounted so switching tabs neither recomputes the
                  CSV alignment nor throws away the current page. */}
              <div className={styles.view}>
                <div
                  id="result-panel-table"
                  role="tabpanel"
                  aria-labelledby="result-tab-table"
                  className={activeTab === 'table' ? styles.panelActive : styles.panelHidden}
                >
                  <TableDiffView tableDiff={tableDiff} resultVersion={resultVersion} />
                </div>
                <div
                  id="result-panel-text"
                  role="tabpanel"
                  aria-labelledby="result-tab-text"
                  className={activeTab === 'text' ? styles.panelActive : styles.panelHidden}
                >
                  <TextDiffView csvLeft={csvLeft} csvRight={csvRight} resultVersion={resultVersion} />
                </div>
              </div>
            </>
          ) : (
            <p className={styles.resultPlaceholder}>
              Load a spreadsheet on each side, then run a comparison — or open one
              of your saved diffs.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
