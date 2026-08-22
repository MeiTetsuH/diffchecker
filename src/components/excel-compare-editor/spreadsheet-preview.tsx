'use client';

import React, { useMemo } from 'react';
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
    () => (sheet ? (XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as (string | number | boolean)[][]) : []),
    [sheet],
  );
  const headers = rows[headerLine - 1] || [];
  const body = rows.slice(headerLine, headerLine + 15);
  const maxHeaderLine = Math.max(rows.length, 1);

  const handleHeaderLineChange = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setHeaderLine(1);
      return;
    }
    const clamped = Math.min(Math.max(parsed, 1), maxHeaderLine);
    setHeaderLine(clamped);
  };

  return (
    <div className={styles.preview}>
      <div className={styles.tableFrame}>
          <table className={styles.previewTable}>
            <thead>
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className={styles.previewHeader}>
                    {h || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className={styles.previewRow}>
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className={styles.previewCell}>
                      {row[cIdx]}
                    </td>
                  ))}
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
            min={1}
            max={maxHeaderLine}
            value={headerLine}
            onChange={(event) => handleHeaderLineChange(event.target.value)}
            className={styles.numberInput}
          />
        </label>
      </div>
    </div>
  );
};
