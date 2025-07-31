'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface LoadedFile {
  file: File;
  data: XLSX.WorkBook;
}

export default function ExcelCompareEditor() {
  const [leftFile, setLeftFile] = useState<LoadedFile | null>(null);
  const [rightFile, setRightFile] = useState<LoadedFile | null>(null);
  const [diffResult, setDiffResult] = useState<any[] | null>(null);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, side: 'left' | 'right') => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const loadedFile = { file, data: wb };
      if (side === 'left') {
        setLeftFile(loadedFile);
      } else {
        setRightFile(loadedFile);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read the spreadsheet file.');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file, side);
    }
  };

  const compareFiles = () => {
    if (!leftFile || !rightFile) {
      alert('Please select both files to compare.');
      return;
    }

    const leftSheet = leftFile.data.Sheets[leftFile.data.SheetNames[0]];
    const rightSheet = rightFile.data.Sheets[rightFile.data.SheetNames[0]];

    const leftData: any[][] = XLSX.utils.sheet_to_json(leftSheet, { header: 1 });
    const rightData: any[][] = XLSX.utils.sheet_to_json(rightSheet, { header: 1 });

    const headers = Array.from(new Set([...(leftData[0] || []), ...(rightData[0] || [])]));
    const leftBody = leftData.slice(1);
    const rightBody = rightData.slice(1);

    const result = [];
    const maxLength = Math.max(leftBody.length, rightBody.length);

    for (let i = 0; i < maxLength; i++) {
      const rowA = leftBody[i] || [];
      const rowB = rightBody[i] || [];
      const rowAStr = JSON.stringify(rowA);
      const rowBStr = JSON.stringify(rowB);

      if (rowAStr === rowBStr) {
        result.push({ type: 'same', data: rowA });
      } else if (!rowA.length) {
        result.push({ type: 'added', data: rowB });
      } else if (!rowB.length) {
        result.push({ type: 'removed', data: rowA });
      } else {
        result.push({ type: 'modified', dataA: rowA, dataB: rowB });
      }
    }
    setDiffResult([{ headers }, ...result]);
  };

  const renderFileInput = (side: 'left' | 'right', file: LoadedFile | null, ref: React.RefObject<HTMLInputElement>) => (
    <div style={{ backgroundColor: 'var(--color-widget-background-highlight)', padding: '1rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-separator)' }}>
      <h3 style={{ color: 'var(--color-text-highlight)', marginBottom: '1rem' }}>{side === 'left' ? 'Original File' : 'Changed File'}</h3>
      <button 
        onClick={() => ref.current?.click()} 
        style={{ 
          width: '100%', 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          border: '1px dashed var(--color-separator)', 
          borderRadius: 'var(--border-radius)', 
          backgroundColor: 'var(--color-widget-background)', 
          color: 'var(--color-text-base)', 
          cursor: 'pointer' 
        }}
      >
        {file ? file.file.name : 'Click to select a file'}
      </button>
      <input type="file" ref={ref} onChange={(e) => onFileChange(e, side)} style={{ display: 'none' }} accept=".xlsx,.xls,.csv" />
    </div>
  );

  const renderDiffTable = () => {
    if (!diffResult) return null;
    const headers = diffResult[0].headers;

    return (
      <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-widget-background-highlight)' }}>
              {headers.map((h: string, i: number) => (
                <th key={i} style={{ border: '1px solid var(--color-separator)', padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--color-text-highlight)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diffResult.slice(1).map((row, i) => {
              let style = {};
              let data = [];
              if (row.type === 'same') {
                data = row.data;
              } else if (row.type === 'added') {
                style = { backgroundColor: 'rgba(0, 255, 0, 0.1)' };
                data = row.data;
              } else if (row.type === 'removed') {
                style = { backgroundColor: 'rgba(255, 0, 0, 0.1)' };
                data = row.data;
              } else if (row.type === 'modified') {
                return (
                  <React.Fragment key={i}>
                    <tr style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}>
                      {headers.map((h: any, j: number) => <td key={j} style={{ border: '1px solid var(--color-separator)', padding: '0.5rem 1rem' }}>{row.dataA[j]}</td>)}
                    </tr>
                    <tr style={{ backgroundColor: 'rgba(0, 255, 0, 0.1)' }}>
                      {headers.map((h: any, j: number) => <td key={j} style={{ border: '1px solid var(--color-separator)', padding: '0.5rem 1rem' }}>{row.dataB[j]}</td>)}
                    </tr>
                  </React.Fragment>
                );
              }
              return (
                <tr key={i} style={style}>
                  {headers.map((h: any, j: number) => <td key={j} style={{ border: '1px solid var(--color-separator)', padding: '0.5rem 1rem' }}>{data[j]}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {renderFileInput('left', leftFile, leftInputRef)}
        {renderFileInput('right', rightFile, rightInputRef)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <button 
          onClick={compareFiles} 
          disabled={!leftFile || !rightFile}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-widget-background)',
            cursor: 'pointer',
            opacity: (!leftFile || !rightFile) ? 0.5 : 1
          }}
        >
          Compare Files
        </button>
      </div>
      {renderDiffTable()}
    </div>
  );
}