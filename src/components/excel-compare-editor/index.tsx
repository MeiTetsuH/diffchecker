'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { saveDiff, loadDiff, getAllDiffs, deleteDiff } from '@/diff-store';
import { X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { SavedDiff } from '@/diff-store/types';

const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/tab-separated-values',
];

interface LoadedFile {
  file: File;
  data: XLSX.WorkBook;
}

const commonStyles = {
  button: {
    padding: '0.5rem 1rem',
    border: '1px solid var(--color-separator)',
    borderRadius: 'var(--border-radius)',
    backgroundColor: 'var(--color-widget-background)',
    color: 'var(--color-text-highlight)',
    cursor: 'pointer' as const,
  },
  buttonDisabled: {
    cursor: 'not-allowed' as const,
    backgroundColor: 'var(--color-widget-background-highlight)',
    color: 'var(--color-text-subdue)',
  },
  dropZone: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed var(--color-separator)',
    borderRadius: 'var(--border-radius)',
    padding: '1rem',
    height: '20rem', // 减少高度
    textAlign: 'center' as const,
    transition: 'background-color 0.2s',
    cursor: 'pointer' as const,
    position: 'relative' as const,
  },
};

const SpreadsheetPreview: React.FC<{
  loaded: LoadedFile;
  sheetName: string;
  setSheetName: (s: string) => void;
  headerLine: number;
  setHeaderLine: (n: number) => void;
  side: 'left' | 'right';
}> = ({ loaded, sheetName, setSheetName, headerLine, setHeaderLine, side }) => {
  const sheet = loaded.data.Sheets[sheetName];
  const rows: any[][] = useMemo(() => (sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as any[][] : []), [sheet]);
  const headers = rows[headerLine - 1] || [];
  const body = rows.slice(headerLine, headerLine + 15); // 减少预览行数

  return (
    <div style={{ width: '100%', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ border: '1px solid var(--color-separator)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', maxHeight: '12rem' }}> {/* 减少预览高度 */}
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ backgroundColor: 'var(--color-widget-background-highlight)', position: 'sticky', top: 0 }}>
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', fontWeight: 500, whiteSpace: 'nowrap' }}>{h || `Column ${idx + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'var(--color-widget-background-highlight)'}}>
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', whiteSpace: 'nowrap' }}>{row[cIdx]}</td>
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
            <option key={name} value={name} style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-base)' }}>{name}</option>
          ))}
        </select>
        <label>Header line:</label>
        <input
          type="number"
          min={1}
          max={rows.length || 1}
          value={headerLine}
          onChange={(e) => setHeaderLine(Number(e.target.value))}
          style={{ ...commonStyles.button, width: '4rem', padding: '0.5rem' }}
        />
      </div>
    </div>
  );
};


export default function ExcelCompareEditor() {
  const [showDiff, setShowDiff] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'text'>('table');
  const [tableDiff, setTableDiff] = useState<any[]>([]);
  const [csvLeft, setCsvLeft] = useState<string[]>([]);
  const [csvRight, setCsvRight] = useState<string[]>([]);
  const [savedDiffs, setSavedDiffs] = useState<SavedDiff[]>([]);

  useEffect(() => {
    getAllDiffs().then(diffs => setSavedDiffs(diffs.sort((a,b) => b.createdAt - a.createdAt)));
  }, []);
  
  const [left, setLeft] = useState<LoadedFile | null>(null);
  const [right, setRight] = useState<LoadedFile | null>(null);
  const [leftSheet, setLeftSheet] = useState<string>('');
  const [rightSheet, setRightSheet] = useState<string>('');
  const [leftHeaderLine, setLeftHeaderLine] = useState<number>(1);
  const [rightHeaderLine, setRightHeaderLine] = useState<number>(1);

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
    const lSheet = left.data.Sheets[leftSheet];
    const rSheet = right.data.Sheets[rightSheet];
    const lRows: any[][] = XLSX.utils.sheet_to_json(lSheet, { header: 1, blankrows: false }) as any[][];
    const rRows: any[][] = XLSX.utils.sheet_to_json(rSheet, { header: 1, blankrows: false }) as any[][];
    
    const headersLeft = lRows[leftHeaderLine - 1] || [];
    const headersRight = rRows[rightHeaderLine - 1] || [];
    const combinedHeaders: string[] = Array.from(new Set([...headersLeft.map(String), ...headersRight.map(String)]));
    
    const lBody = lRows.slice(leftHeaderLine);
    const rBody = rRows.slice(rightHeaderLine);
    
    const max = Math.max(lBody.length, rBody.length);
    const diffArr: any[] = [];
    
    for (let i = 0; i < max; i++) {
        const lRowRaw = lBody[i] || [];
        const rRowRaw = rBody[i] || [];

        const lRow = headersLeft.reduce((acc, header, index) => ({ ...acc, [String(header)]: lRowRaw[index] }), {});
        const rRow = headersRight.reduce((acc, header, index) => ({ ...acc, [String(header)]: rRowRaw[index] }), {});

        if (JSON.stringify(lRowRaw) === JSON.stringify(rRowRaw) && JSON.stringify(headersLeft) === JSON.stringify(headersRight)) {
            diffArr.push({ type: 'same', lRow, rRow });
        } else if (lBody[i] === undefined) {
            diffArr.push({ type: 'added', rRow });
        } else if (rBody[i] === undefined) {
            diffArr.push({ type: 'removed', lRow });
        } else {
            diffArr.push({ type: 'modified', lRow, rRow });
        }
    }

    const newTableDiff = [{ headers: combinedHeaders, headersLeft, headersRight }, ...diffArr];
    setTableDiff(newTableDiff);
    
    const lCsv = XLSX.utils.sheet_to_csv(lSheet);
    const rCsv = XLSX.utils.sheet_to_csv(rSheet);
    setCsvLeft(lCsv.split('\n'));
    setCsvRight(rCsv.split('\n'));
    
    setActiveTab('table');
    setShowDiff(true);

    const newDiff = {
      name: `${left.file.name} vs ${right.file.name}`,
      leftFileName: left.file.name,
      rightFileName: right.file.name,
      diffData: {
        tableDiff: newTableDiff,
        csvLeft: lCsv.split('\n'),
        csvRight: rCsv.split('\n'),
      },
    };

    saveDiff(newDiff).then((saved) => {
        setSavedDiffs(prev => [saved, ...prev.filter(d => d.id !== saved.id)].sort((a,b) => b.createdAt - a.createdAt));
    });
  };
  
  const loadSavedDiff = async (id: string) => {
    const rec = await loadDiff(id);
    if (!rec || !rec.diffData) return;
    const data = rec.diffData;
    setTableDiff(data.tableDiff || []);
    setCsvLeft(data.csvLeft || []);
    setCsvRight(data.csvRight || []);
    setActiveTab('table');
    setShowDiff(true);
  };


  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '0.75rem',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1rem',
        flexShrink: 0
      }}>
        <DropZone side="left" loadedFile={left} inputRef={leftInputRef} onFiles={handleFiles} onClear={() => setLeft(null)} 
          sheetName={leftSheet} setSheetName={setLeftSheet}
          headerLine={leftHeaderLine} setHeaderLine={setLeftHeaderLine}
        />
        <DropZone side="right" loadedFile={right} inputRef={rightInputRef} onFiles={handleFiles} onClear={() => setRight(null)}
          sheetName={rightSheet} setSheetName={setRightSheet}
          headerLine={rightHeaderLine} setHeaderLine={setRightHeaderLine}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <button
          onClick={findDifferences}
          disabled={!left || !right}
          style={{ ...commonStyles.button, backgroundColor: 'var(--color-primary)', ...( (!left || !right) && commonStyles.buttonDisabled) }}
        >
          Find differences
        </button>
      </div>

      {showDiff && (
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <aside style={{ 
            width: '224px', 
            borderRight: '1px solid var(--color-separator)', 
            paddingRight: '1rem', 
            fontSize: '12px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '1rem', flexShrink: 0 }}>Saved Diffs</h3>
            <ul style={{ 
              listStyle: 'none', 
              flex: 1,
              overflow: 'auto', 
              marginRight: '0.5rem' 
            }}>
              {savedDiffs.map((d) => (
                <li key={d.id} style={{ position: 'relative', marginBottom: '0.5rem' }}>
                   <button
                    onClick={() => loadSavedDiff(d.id)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', width: '100%', paddingRight: '2rem' }}
                  >
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-highlight)' }}>{d.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-subdue)' }}>{new Date(d.createdAt).toLocaleString()}</span>
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

          <section style={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              borderBottom: '1px solid var(--color-separator)', 
              marginBottom: '1rem', 
              fontSize: '14px',
              flexShrink: 0
            }}>
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
                  cursor: 'pointer'
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
                  cursor: 'pointer'
                }} 
                onClick={() => setActiveTab('text')}
              >
                Text
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {activeTab === 'table' ? (
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

// Helper components
const DropZone: React.FC<{
  side: 'left' | 'right';
  loadedFile: LoadedFile | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null, side: 'left' | 'right') => void;
  onClear: () => void;
  sheetName: string;
  setSheetName: (s: string) => void;
  headerLine: number;
  setHeaderLine: (n: number) => void;
}> = ({ side, loadedFile, inputRef, onFiles, onClear, sheetName, setSheetName, headerLine, setHeaderLine }) => {
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
            <button style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onClear(); }}>
              <X size={20} color="var(--color-text-subdue)" />
            </button>
            <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>{loadedFile.file.name}</p>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subdue)' }}>{(loadedFile.file.size / 1024).toFixed(1)} KB</span>
              </div>
              <SpreadsheetPreview
                loaded={loadedFile}
                sheetName={sheetName}
                setSheetName={setSheetName}
                headerLine={headerLine}
                setHeaderLine={setHeaderLine}
                side={side}
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
  )
}

const TableDiffView: React.FC<{ tableDiff: any[] }> = ({ tableDiff }) => {
  if (!tableDiff || tableDiff.length < 1) return null;

  const { headers, headersLeft, headersRight } = tableDiff[0] || {};
  const diffRows = tableDiff.slice(1);

  const getHeaderStyle = (h: string): React.CSSProperties => {
    const onlyInLeft = headersLeft.includes(h) && !headersRight.includes(h);
    const onlyInRight = !headersLeft.includes(h) && headersRight.includes(h);
    if (onlyInLeft) return { backgroundColor: 'rgba(255, 0, 0, 0.1)', color: 'var(--color-text-highlight)' };
    if (onlyInRight) return { backgroundColor: 'rgba(0, 255, 0, 0.1)', color: 'var(--color-text-highlight)' };
    return { backgroundColor: 'var(--color-widget-background-highlight)' };
  };

  const getRowStyle = (type: string): React.CSSProperties => {
    if (type === 'added') return { backgroundColor: 'rgba(0, 255, 0, 0.05)' };
    if (type === 'removed') return { backgroundColor: 'rgba(255, 0, 0, 0.05)' };
    return {};
  };

  return (
    <div style={{ 
      height: '100%',
      overflow: 'auto', 
      fontSize: '12px'
    }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ position: 'sticky', top: 0 }}>
          <tr>
            <th style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', userSelect: 'none', color: 'var(--color-text-subdue)', backgroundColor: 'var(--color-widget-background-highlight)' }}>#</th>
            {(headers || []).map((h: any, idx: number) => (
              <th key={idx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', whiteSpace: 'nowrap', fontWeight: 500, ...getHeaderStyle(h) }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diffRows.map((row: any, idx: number) => (
            <tr key={idx} style={getRowStyle(row.type)}>
              <td style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', textAlign: 'right', userSelect: 'none', color: 'var(--color-text-subdue)', backgroundColor: 'var(--color-widget-background-highlight)' }}>{idx + 1}</td>
              {(headers || []).map((h: any, cIdx: number) => {
                const lVal = row.lRow ? row.lRow[h] : undefined;
                const rVal = row.rRow ? row.rRow[h] : undefined;
                
                let cellContent: React.ReactNode;

                switch (row.type) {
                  case 'same':
                    cellContent = lVal !== undefined ? lVal : '';
                    break;
                  case 'added':
                    cellContent = <span style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)', padding: '1px 3px', borderRadius: '3px' }}>{rVal}</span>;
                    break;
                  case 'removed':
                    cellContent = <span style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)', padding: '1px 3px', borderRadius: '3px', textDecoration: 'line-through' }}>{lVal}</span>;
                    break;
                  case 'modified':
                    if (lVal !== rVal) {
                      cellContent = (
                        <>
                          {lVal !== undefined && <span style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)', padding: '1px 3px', borderRadius: '3px', textDecoration: 'line-through', marginRight: '4px' }}>{lVal}</span>}
                          {rVal !== undefined && <span style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)', padding: '1px 3px', borderRadius: '3px' }}>{rVal}</span>}
                        </>
                      );
                    } else {
                      cellContent = lVal !== undefined ? lVal : '';
                    }
                    break;
                  default:
                    cellContent = lVal !== undefined ? lVal : '';
                }
                
                return <td key={cIdx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', whiteSpace: 'nowrap' }}>{cellContent}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const TextDiffView: React.FC<{ csvLeft: string[], csvRight: string[] }> = ({ csvLeft, csvRight }) => {
    const maxLines = Math.max(csvLeft.length, csvRight.length);
    const lines = Array.from({ length: maxLines }, (_, i) => ({
        left: csvLeft[i],
        right: csvRight[i],
    }));

    const { removedCount, addedCount } = useMemo(() => {
        let added = 0;
        let removed = 0;
        lines.forEach(line => {
            if (line.left !== line.right) {
                if (line.left !== undefined) removed++;
                if (line.right !== undefined) added++;
            }
        });
        return { removedCount: removed, addedCount: added };
      }, [lines]);

    return (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem', 
          fontSize: '12px',
          height: '100%'
        }}>
            <div style={{ 
              border: '1px solid var(--color-separator)', 
              borderRadius: 'var(--border-radius)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
                <div style={{ 
                  padding: '0.5rem 0.75rem', 
                  backgroundColor: 'rgba(255, 0, 0, 0.05)', 
                  borderBottom: '1px solid var(--color-separator)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-highlight)' }}>{removedCount} removals</span>
                    <span style={{ color: 'var(--color-text-subdue)' }}>{csvLeft.length} lines</span>
                </div>
                <div style={{ 
                  fontFamily: 'var(--font-family)', 
                  overflow: 'auto', 
                  flex: 1,
                  padding: '0.75rem' 
                }}>
                    {lines.map((line, i) => {
                        const isChanged = line.left !== line.right;
                        return (
                        <div key={i} style={{ display: 'flex', backgroundColor: isChanged && line.left !== undefined ? 'rgba(255, 0, 0, 0.1)' : 'transparent' }}>
                            <span style={{ width: '2.5rem', textAlign: 'right', paddingRight: '0.75rem', color: 'var(--color-text-subdue)', userSelect: 'none' }}>{line.left !== undefined ? i + 1 : ''}</span>
                            <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.left}</span>
                        </div>
                        );
                    })}
                </div>
            </div>
            <div style={{ 
              border: '1px solid var(--color-separator)', 
              borderRadius: 'var(--border-radius)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
                <div style={{ 
                  padding: '0.5rem 0.75rem', 
                  backgroundColor: 'rgba(0, 255, 0, 0.05)', 
                  borderBottom: '1px solid var(--color-separator)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-highlight)' }}>{addedCount} additions</span>
                    <span style={{ color: 'var(--color-text-subdue)' }}>{csvRight.length} lines</span>
                </div>
                <div style={{ 
                  fontFamily: 'var(--font-family)', 
                  overflow: 'auto', 
                  flex: 1,
                  padding: '0.75rem' 
                }}>
                    {lines.map((line, i) => {
                        const isChanged = line.left !== line.right;
                        return (
                        <div key={i} style={{ display: 'flex', backgroundColor: isChanged && line.right !== undefined ? 'rgba(0, 255, 0, 0.1)' : 'transparent' }}>
                            <span style={{ width: '2.5rem', textAlign: 'right', paddingRight: '0.75rem', color: 'var(--color-text-subdue)', userSelect: 'none' }}>{line.right !== undefined ? i + 1 : ''}</span>
                            <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.right}</span>
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};