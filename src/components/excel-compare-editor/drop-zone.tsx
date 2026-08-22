'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { WorkBook } from 'xlsx';
import { Upload, X } from 'lucide-react';
import styles from './styles.module.css';

const SpreadsheetPreview = dynamic(
  () => import('./spreadsheet-preview').then((module) => module.SpreadsheetPreview),
  { ssr: false },
);

export interface LoadedFile {
  file: File;
  data: WorkBook;
}

interface DropZoneProps {
  side: 'left' | 'right';
  loadedFile: LoadedFile | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  onFiles: (files: FileList | null, side: 'left' | 'right') => Promise<void>;
  onClear: () => void;
  sheetName: string;
  setSheetName: (sheet: string) => void;
  headerLine: number;
  setHeaderLine: (line: number) => void;
}

export function DropZone({
  side,
  loadedFile,
  inputRef,
  isLoading,
  onFiles,
  onClear,
  sheetName,
  setSheetName,
  headerLine,
  setHeaderLine,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const label = side === 'left' ? 'original' : 'changed';

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx,.xls,.csv,.tsv"
      className={styles.hiddenInput}
      aria-label={`Choose ${label} spreadsheet`}
      onChange={(event) => void onFiles(event.target.files, side)}
    />
  );

  if (!loadedFile) {
    return (
      <>
        <button
          type="button"
          className={`${styles.dropZone} ${isDragging ? styles.dropActive : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void onFiles(event.dataTransfer.files, side);
          }}
          disabled={isLoading}
        >
          <Upload className={styles.dropIcon} size={28} aria-hidden="true" />
          <p className={styles.dropTitle}>{isLoading ? 'Reading locally…' : `Choose ${label} file`}</p>
          <p className={styles.dropHint}>XLSX, XLS, CSV, or TSV · never uploaded</p>
          <span className={styles.button}>{isLoading ? 'Please wait' : 'Browse files'}</span>
        </button>
        {input}
      </>
    );
  }

  return (
    <section className={`${styles.dropZone} ${styles.dropLoaded}`} aria-label={`${label} spreadsheet`}>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.clearButton}`}
        onClick={onClear}
        aria-label={`Remove ${loadedFile.file.name}`}
        title="Remove file"
      >
        <X size={16} aria-hidden="true" />
      </button>
      <div className={styles.fileHeader}>
        <p className={styles.fileName} title={loadedFile.file.name}>{loadedFile.file.name}</p>
        <span className={styles.fileSize}>{(loadedFile.file.size / 1024).toFixed(1)} KB</span>
      </div>
      <SpreadsheetPreview
        loaded={loadedFile}
        sheetName={sheetName}
        setSheetName={setSheetName}
        headerLine={headerLine}
        setHeaderLine={setHeaderLine}
      />
      {input}
    </section>
  );
}
