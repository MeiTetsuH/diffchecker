'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload } from 'lucide-react';
import { commonStyles } from './styles';
import { SpreadsheetPreview } from './spreadsheet-preview';

export interface LoadedFile {
  file: File;
  data: XLSX.WorkBook;
}

interface DropZoneProps {
  side: 'left' | 'right';
  loadedFile: LoadedFile | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null, side: 'left' | 'right') => void;
  onClear: () => void;
  sheetName: string;
  setSheetName: (s: string) => void;
  headerLine: number;
  setHeaderLine: (n: number) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  side,
  loadedFile,
  inputRef,
  onFiles,
  onClear,
  sheetName,
  setSheetName,
  headerLine,
  setHeaderLine,
}) => {
  const [isHover, setIsHover] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHover(false);
    onFiles(e.dataTransfer.files, side);
  };

  return (
    <div
      style={{ ...commonStyles.dropZone, ...(isHover && { borderColor: 'var(--color-primary)' }) }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsHover(true); }}
      onDragLeave={() => setIsHover(false)}
      onDrop={handleDrop}
    >
      {loadedFile ? (
        <>
          <button
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >
            <X size={20} color="var(--color-text-subdue)" />
          </button>
          <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>
                {loadedFile.file.name}
              </p>
              <span style={{ fontSize: '12px', color: 'var(--color-text-subdue)' }}>
                {(loadedFile.file.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <SpreadsheetPreview
              loaded={loadedFile}
              sheetName={sheetName}
              setSheetName={setSheetName}
              headerLine={headerLine}
              setHeaderLine={setHeaderLine}
            />
          </div>
        </>
      ) : (
        <>
          <Upload size={32} color="var(--color-text-subdue)" style={{ marginBottom: '1rem' }} />
          <p style={{ fontWeight: 500 }}>Drop Excel file here</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-subdue)', marginBottom: '1rem' }}>.xlsx, .xls, .csv</p>
          <button style={commonStyles.button} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
            Browse
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv"
            style={{ display: 'none' }}
            onChange={(e) => onFiles(e.target.files, side)}
          />
        </>
      )}
    </div>
  );
};
