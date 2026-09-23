'use client';

import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './styles.module.css';

interface LoadedFile {
  file: File;
  data: XLSX.WorkBook;
}

interface SpreadsheetPreviewProps {
  loaded: LoadedFile;
  sheetName: string;
  setSheetName: (s: string) => void;
  headerLine: number;
  setHeaderLine: (n: number) => void;
}

export const SpreadsheetPreview: React.FC<SpreadsheetPreviewProps> = ({
  loaded,
  sheetName,
  setSheetName,
  headerLine,
  setHeaderLine,
}) => {
  const sheet = loaded.data.Sheets[sheetName];
  const rows: (string | number | boolean)[][] = useMemo(
    () => (sheet ? (XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, raw: false }) as (string | number | boolean)[][]) : []),
    [sheet],
  );
  // Match the diff engine: columns are counted across the whole sheet, because
  // data rows regularly run past the labelled header cells.
  const width = useMemo(
    () => rows.reduce((widest, row) => Math.max(widest, row.length), 0),
    [rows],
  );
  const columns = useMemo(() => {
    const headerRow = rows[headerLine - 1] || [];
    return Array.from({ length: width }, (_, index) => {
      const label = String(headerRow[index] ?? '').trim();
      return label || `Column ${index + 1}`;
    });
  }, [headerLine, rows, width]);
  const body = rows.slice(headerLine, headerLine + 15);
  const maxHeaderLine = Math.max(rows.length, 1);
  // What the user is typing, kept apart from the committed line so the field
  // can be emptied mid-edit instead of snapping straight back to 1.
  const [draftHeaderLine, setDraftHeaderLine] = useState<string | null>(null);

  const handleHeaderLineChange = (raw: string) => {
    setDraftHeaderLine(raw);
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(Math.max(parsed, 1), maxHeaderLine);
    setHeaderLine(clamped);
  };

  return (
    <div className={styles.preview}>
      <div className={styles.tableFrame}>
          <table className={styles.previewTable}>
            <thead>
              <tr>
                {columns.map((label, idx) => (
                  <th key={idx} className={styles.previewHeader}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className={styles.previewRow}>
                  {columns.map((_, cIdx) => {
                    const cell = row[cIdx];
                    // React renders booleans as nothing, so stringify first.
                    return (
                      <td key={cIdx} className={styles.previewCell}>
                        {cell === undefined || cell === null ? '' : String(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      <div className={styles.options}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Sheet</span>
          <select
            value={sheetName}
            onChange={(event) => setSheetName(event.target.value)}
            className={styles.select}
          >
            {loaded.data.SheetNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Header line</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxHeaderLine}
            value={draftHeaderLine ?? headerLine}
            onChange={(event) => handleHeaderLineChange(event.target.value)}
            onBlur={() => setDraftHeaderLine(null)}
            className={styles.numberInput}
          />
        </label>
      </div>
    </div>
  );
};
