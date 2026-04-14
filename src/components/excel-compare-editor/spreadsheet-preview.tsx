'use client';

import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import { commonStyles } from './styles';

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
    <div style={{ width: '100%', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ border: '1px solid var(--color-separator)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', maxHeight: '12rem' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ backgroundColor: 'var(--color-widget-background-highlight)', position: 'sticky', top: 0 }}>
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'var(--color-widget-background-highlight)' }}>
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                      {row[cIdx]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '12px', marginTop: '8px' }}>
        <label>Sheet:</label>
        <select
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          style={commonStyles.button}
        >
          {loaded.data.SheetNames.map((name) => (
            <option key={name} value={name} style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-base)' }}>
              {name}
            </option>
          ))}
        </select>
        <label>Header line:</label>
        <input
          type="number"
          min={1}
          max={maxHeaderLine}
          value={headerLine}
          onChange={(e) => handleHeaderLineChange(e.target.value)}
          style={{ ...commonStyles.button, width: '4rem', padding: '0.5rem' }}
        />
      </div>
    </div>
  );
};
