import React, { useRef, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { diffLines } from 'diff';

// accepted mime types
const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'text/tab-separated-values',
];

interface LoadedFile {
  file: File;
  data: XLSX.WorkBook;
}

interface PreviewProps {
  loaded: LoadedFile;
  sheetName: string;
  setSheetName: (s: string) => void;
  headerLine: number;
  setHeaderLine: (n: number) => void;
}

const SpreadsheetPreview: React.FC<PreviewProps> = ({ loaded, sheetName, setSheetName, headerLine, setHeaderLine }) => {
  const sheet = loaded.data.Sheets[sheetName];
  const rows: any[][] = useMemo(() => (sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as any[][] : []), [sheet]);
  const headers = rows[headerLine - 1] || [];
  const body = rows.slice(headerLine).slice(0, 20); // preview first 20 rows

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <div className="border rounded overflow-hidden">
        <div className="overflow-y-auto max-h-64">
        <table className="min-w-full border-collapse text-xs text-left">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="border px-2 py-1 font-medium text-gray-700 whitespace-nowrap">{h || `Column ${idx + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="even:bg-gray-50">
                {headers.map((_, cIdx) => (
                  <td key={cIdx} className="border px-2 py-1 whitespace-nowrap text-gray-600">{row[cIdx]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs mt-2">
        <label className="text-gray-600">Sheet:</label>
        <select
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {loaded.data.SheetNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <label className="text-gray-600">Header line:</label>
        <input
          type="number"
          min={1}
          max={rows.length}
          value={headerLine}
          onChange={(e) => setHeaderLine(Number(e.target.value))}
          className="w-16 border px-2 py-1 rounded"
        />
      </div>
    </div>
  );
};


export default function ExcelCompareEditor() {
  const [showDiff, setShowDiff] = useState(false);
  const [activeTab, setActiveTab] = useState<'table'|'text'>('table');
  const [tableDiff, setTableDiff] = useState<any[]>([]);
  const [textDiffLines, setTextDiffLines] = useState<any[]>([]);

  const [left, setLeft] = useState<LoadedFile | null>(null);
  const [right, setRight] = useState<LoadedFile | null>(null);

  // preview states
  const [leftSheet, setLeftSheet] = useState<string>('');
  const [rightSheet, setRightSheet] = useState<string>('');
  const [leftHeaderLine, setLeftHeaderLine] = useState<number>(1);
  const [rightHeaderLine, setRightHeaderLine] = useState<number>(1);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null, side: 'left' | 'right') => {
    if (!files || files.length === 0) return;
    const file = files[0];
    // simple mime check; allow unknown if extension matches
    if (!ACCEPTED_MIME.includes(file.type) && !/\.(xlsx|xls|csv|tsv)$/i.test(file.name)) {
      alert('Unsupported file type');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const loaded: LoadedFile = { file, data: wb }; // store workbook
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, side: 'left' | 'right') => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files, side);
  };

  const renderDropZone = (loaded: LoadedFile | null, side: 'left' | 'right') => {
    const inputRef = side === 'left' ? leftInputRef : rightInputRef;
    return (
      <div
        className="cursor-pointer relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:bg-gray-100 rounded-lg p-6 h-96 text-center transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, side)}
      >
        {loaded ? (
          <>
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
              onClick={(e) => { e.stopPropagation(); side === 'left' ? setLeft(null) : setRight(null); }}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800 break-all text-sm">{loaded.file.name}</p>
                <span className="text-xs text-gray-500">{(loaded.file.size / 1024).toFixed(1)} KB</span>
              </div>
              <SpreadsheetPreview
                loaded={loaded}
                sheetName={side === 'left' ? leftSheet : rightSheet}
                setSheetName={side === 'left' ? setLeftSheet : setRightSheet}
                headerLine={side === 'left' ? leftHeaderLine : rightHeaderLine}
                setHeaderLine={side === 'left' ? setLeftHeaderLine : setRightHeaderLine}
              />
            </div>
          </>
        ) : (
          <>
            <X className="w-6 h-6 text-green-600 mb-4" />
            <p className="font-medium text-gray-800">Drop excel here</p>
            <p className="text-sm text-gray-500 mb-4">xlsx, xls, csv, tsv, etc</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 cursor-pointer"
            >
              Browse
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files, side)}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full ">
          <div className="mx-auto py-4 px-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {renderDropZone(left, 'left')}
        {renderDropZone(right, 'right')}
      </div>
      <div className="flex justify-center">
        <button
          disabled={!left || !right}
          onClick={() => {
            if (!left || !right) return;
            // build arrays starting from headerLine
            const lSheet = left.data.Sheets[leftSheet];
            const rSheet = right.data.Sheets[rightSheet];
            const lRows: any[][] = XLSX.utils.sheet_to_json(lSheet, { header: 1, blankrows:false }) as any[][];
            const rRows: any[][] = XLSX.utils.sheet_to_json(rSheet, { header: 1, blankrows:false }) as any[][];
            const headersLeft = lRows[leftHeaderLine-1] || [];
            const headersRight = rRows[rightHeaderLine-1] || [];
            const combinedHeaders: string[] = Array.from(new Set([...headersLeft, ...headersRight]));
            const lBody = lRows.slice(leftHeaderLine);
            const rBody = rRows.slice(rightHeaderLine);
            const max = Math.max(lBody.length, rBody.length);
            const diffArr:any[] = [];
            for(let i=0;i<max;i++){
              const lRow = lBody[i] || [];
              const rRow = rBody[i] || [];
              if(JSON.stringify(lRow) === JSON.stringify(rRow)){
                diffArr.push({type:'same', lRow, rRow});
              } else if (lRow.length===0){
                diffArr.push({type:'added', rRow});
              } else if (rRow.length===0){
                diffArr.push({type:'removed', lRow});
              } else {
                diffArr.push({type:'modified', lRow, rRow});
              }
            }
            setTableDiff([{headers: combinedHeaders, headersLeft, headersRight}, ...diffArr]);
            // text diff csv
            const lCsv = XLSX.utils.sheet_to_csv(lSheet);
            const rCsv = XLSX.utils.sheet_to_csv(rSheet);
            const diffLinesArr = diffLines(lCsv, rCsv);
            setTextDiffLines(diffLinesArr);
            setActiveTab('table');
            setShowDiff(true);
          }}
          className="px-6 py-2 rounded-md text-sm font-medium text-white bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
        >
          Find differences
        </button>
      </div>
          </div>

      {showDiff && (
        <div className="mt-8 flex flex-col md:flex-row gap-6" id="diff-viewer">
          {/* Sidebar */}
          <aside className="md:w-56 border-r md:pr-4 text-xs mb-4 md:mb-0">
            <h3 className="font-semibold text-sm mb-4">Comparison Options</h3>
            <ul className="space-y-2">
              <li><label className="flex items-center"><input type="checkbox" disabled className="mr-2"/>Ignore white space</label></li>
              <li><label className="flex items-center"><input type="checkbox" disabled className="mr-2"/>Ignore case changes</label></li>
              <li><label className="flex items-center"><input type="checkbox" disabled className="mr-2"/>Hide unchanged rows</label></li>
              <li><label className="flex items-center"><input type="checkbox" disabled className="mr-2"/>Hide unchanged columns</label></li>
            </ul>
          </aside>
          {/* Main diff area */}
          <section className="flex-1 overflow-auto">
            <div className="flex gap-4 border-b mb-4 text-sm">
              <button className={`${activeTab==='table' ? 'font-semibold text-green-600 border-b-2 border-green-600' : ' font-semibold border-transparent border-b-2'}`} onClick={()=>setActiveTab('table')}>Table</button>
              <button className={`${activeTab==='text' ? 'font-semibold text-green-600 border-b-2 border-green-600' : ' font-semibold border-transparent border-b-2'}`} onClick={()=>setActiveTab('text')}>Text</button>
            </div>
            {activeTab==='table' ? (
              <div className="overflow-x-auto text-xs mr-2">
                <table className="table-auto w-fit border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-1 whitespace-nowrap text-right select-none text-gray-400">#</th>
                      {(tableDiff[0]?.headers || []).map((h:any, idx:number)=>{
                        const onlyLeft = (tableDiff[0]?.headersLeft || []).includes(h) && !(tableDiff[0]?.headersRight || []).includes(h);
                        const onlyRight = (tableDiff[0]?.headersRight || []).includes(h) && !(tableDiff[0]?.headersLeft || []).includes(h);
                        const base = onlyLeft? 'bg-green-50 text-green-700' : onlyRight? 'bg-red-50 text-red-700' : 'bg-gray-50';
                        return <th key={idx} className={`border px-2 py-1 whitespace-nowrap ${base}`}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {tableDiff.slice(1).map((row:any, idx:number)=> (
                      <tr key={idx} className={row.type==='added' ? 'bg-green-50' : row.type==='removed' ? 'bg-red-50' : ''}>
                        <td className="border px-2 py-1 text-right select-none text-gray-400 bg-gray-50">{idx+1}</td>
                        {(tableDiff[0]?.headers||[]).map((_:any,cIdx:number)=>{
                          const lVal = row.lRow?row.lRow[cIdx]:'';
                          const rVal = row.rRow?row.rRow[cIdx]:'';
                          const changed = row.type==='modified' && lVal!==rVal;
                          let cellContent: React.ReactNode = lVal;
                          if(row.type==='added'){
                            cellContent = <span className="bg-green-200 text-green-900 px-0.5 rounded">{rVal}</span>;
                          } else if(row.type==='removed'){
                            cellContent = <span className="bg-red-200 text-red-900 px-0.5 rounded">{lVal}</span>;
                          } else if(changed){
                            cellContent = <>
                              <span className="bg-red-200 text-red-900 px-0.5 rounded mr-1">{lVal}</span>
                              <span className="bg-green-200 text-green-900 px-0.5 rounded">{rVal}</span>
                            </>;
                          }
                          return <td key={cIdx} className={"border px-2 py-1 whitespace-nowrap"}>{cellContent}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="font-mono whitespace-pre-wrap text-xs">
                {textDiffLines.map((part:any, idx:number)=>{
                  const cls = part.added? 'bg-green-200 text-green-900' : part.removed? 'bg-red-200 text-red-900' : '';
                  return <span key={idx} className={cls}>{part.value}</span>;
                })}
              </pre>
            )}
          </section>
        </div>
      )}
    </div>
  );
}