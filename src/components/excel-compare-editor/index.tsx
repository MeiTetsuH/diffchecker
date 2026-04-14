'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X } from 'lucide-react';
import { saveDiff, loadDiff, getAllDiffs, deleteDiff } from '@/diff-store';
import type { SavedDiff } from '@/diff-store/types';
import type { DiffHeader, DiffRow, DiffData } from '@/types/excel-diff';
import { computeDiff } from './diff-engine';
import { DropZone, type LoadedFile } from './drop-zone';
import { TableDiffView } from './table-diff-view';
import { TextDiffView } from './text-diff-view';
import { commonStyles } from './styles';

const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/tab-separated-values',
];

export default function ExcelCompareEditor() {
  const [showDiff, setShowDiff] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'text'>('table');
  const [tableDiff, setTableDiff] = useState<[DiffHeader, ...DiffRow[]] | null>(null);
  const [csvLeft, setCsvLeft] = useState<string[]>([]);
  const [csvRight, setCsvRight] = useState<string[]>([]);
  const [savedDiffs, setSavedDiffs] = useState<SavedDiff[]>([]);

  useEffect(() => {
    getAllDiffs().then((diffs) =>
      setSavedDiffs(diffs.sort((a, b) => b.createdAt - a.createdAt)),
    );
  }, []);

  const [left, setLeft] = useState<LoadedFile | null>(null);
  const [right, setRight] = useState<LoadedFile | null>(null);
  const [leftSheet, setLeftSheet] = useState('');
  const [rightSheet, setRightSheet] = useState('');
  const [leftHeaderLine, setLeftHeaderLine] = useState(1);
  const [rightHeaderLine, setRightHeaderLine] = useState(1);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null, side: 'left' | 'right') => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!ACCEPTED_MIME.includes(file.type) && !/\.(xlsx|xls|csv|tsv)$/i.test(file.name)) {
      alert('Unsupported file type');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const loaded: LoadedFile = { file, data: wb };
      if (side === 'left') {
        setLeft(loaded);
        setLeftSheet(wb.SheetNames[0]);
        setLeftHeaderLine(1);
      } else {
        setRight(loaded);
        setRightSheet(wb.SheetNames[0]);
        setRightHeaderLine(1);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to read spreadsheet');
    }
  };

  const findDifferences = () => {
    if (!left || !right) return;

    const result: DiffData = computeDiff({
      leftWorkbook: left.data,
      rightWorkbook: right.data,
      leftSheet,
      rightSheet,
      leftHeaderLine,
      rightHeaderLine,
    });

    setTableDiff(result.tableDiff);
    setCsvLeft(result.csvLeft);
    setCsvRight(result.csvRight);
    setActiveTab('table');
    setShowDiff(true);

    saveDiff({
      name: `${left.file.name} vs ${right.file.name}`,
      leftFileName: left.file.name,
      rightFileName: right.file.name,
      diffData: result,
    }).then((saved) => {
      setSavedDiffs((prev) =>
        [saved, ...prev.filter((d) => d.id !== saved.id)].sort(
          (a, b) => b.createdAt - a.createdAt,
        ),
      );
    });
  };

  const loadSavedDiff = async (id: string) => {
    const rec = await loadDiff(id);
    if (!rec?.diffData) return;
    const data = rec.diffData;
    setTableDiff(data.tableDiff || null);
    setCsvLeft(data.csvLeft || []);
    setCsvRight(data.csvRight || []);
    setActiveTab('table');
    setShowDiff(true);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '0.75rem', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginBottom: '1rem', flexShrink: 0 }}>
        <DropZone
          side="left"
          loadedFile={left}
          inputRef={leftInputRef}
          onFiles={handleFiles}
          onClear={() => setLeft(null)}
          sheetName={leftSheet}
          setSheetName={setLeftSheet}
          headerLine={leftHeaderLine}
          setHeaderLine={setLeftHeaderLine}
        />
        <DropZone
          side="right"
          loadedFile={right}
          inputRef={rightInputRef}
          onFiles={handleFiles}
          onClear={() => setRight(null)}
          sheetName={rightSheet}
          setSheetName={setRightSheet}
          headerLine={rightHeaderLine}
          setHeaderLine={setRightHeaderLine}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <button
          onClick={findDifferences}
          disabled={!left || !right}
          style={{ ...commonStyles.button, backgroundColor: 'var(--color-primary)', ...(!left || !right ? commonStyles.buttonDisabled : {}) }}
        >
          Find differences
        </button>
      </div>

      {showDiff && (
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Saved Diffs Sidebar */}
          <aside style={{ width: '224px', borderRight: '1px solid var(--color-separator)', paddingRight: '1rem', fontSize: '12px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '1rem', flexShrink: 0 }}>Saved Diffs</h3>
            <ul style={{ listStyle: 'none', flex: 1, overflow: 'auto', marginRight: '0.5rem' }}>
              {savedDiffs.map((d) => (
                <li key={d.id} style={{ position: 'relative', marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => loadSavedDiff(d.id)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', width: '100%', paddingRight: '2rem' }}
                  >
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-highlight)' }}>
                      {d.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-subdue)' }}>
                      {new Date(d.createdAt).toLocaleString()}
                    </span>
                  </button>
                  <button
                    style={{ position: 'absolute', top: '50%', right: '0', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={async () => {
                      await deleteDiff(d.id);
                      setSavedDiffs((prev) => prev.filter((sd) => sd.id !== d.id));
                    }}
                  >
                    <X size={16} color="var(--color-text-subdue)" />
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Diff Result Area */}
          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-separator)', marginBottom: '1rem', fontSize: '14px', flexShrink: 0 }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: activeTab === 'table' ? 600 : 500,
                  color: activeTab === 'table' ? 'var(--color-primary)' : 'inherit',
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: activeTab === 'table' ? 'var(--color-primary)' : 'transparent',
                  paddingBottom: '0.5rem',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTab('table')}
              >
                Table
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: activeTab === 'text' ? 600 : 500,
                  color: activeTab === 'text' ? 'var(--color-primary)' : 'inherit',
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: activeTab === 'text' ? 'var(--color-primary)' : 'transparent',
                  paddingBottom: '0.5rem',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTab('text')}
              >
                Text
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {activeTab === 'table' && tableDiff ? (
                <TableDiffView tableDiff={tableDiff} />
              ) : (
                <TextDiffView csvLeft={csvLeft} csvRight={csvRight} />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}