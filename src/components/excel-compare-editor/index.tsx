import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import * as XLSX from 'xlsx';

// accepted mime types
const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'text/tab-separated-values',
];

interface LoadedFile {
  file: File;
  data: any; // parsed workbook/sheet; kept "any" until diff logic is implemented
}

export default function ExcelCompareEditor() {
  const [left, setLeft] = useState<LoadedFile | null>(null);
  const [right, setRight] = useState<LoadedFile | null>(null);

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
      const loaded: LoadedFile = { file, data: wb };
      side === 'left' ? setLeft(loaded) : setRight(loaded);
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
        className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:bg-gray-100 rounded-lg p-6 h-96 text-center transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, side)}
      >
        {loaded ? (
          <>
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
              onClick={() => (side === 'left' ? setLeft(null) : setRight(null))}
            >
              <X className="w-5 h-5" />
            </button>
            <p className="mb-2 text-sm text-gray-500">Loaded file:</p>
            <p className="font-medium text-gray-800 break-all">{loaded.file.name}</p>
          </>
        ) : (
          <>
            <X className="w-6 h-6 text-green-600 mb-4" />
            <p className="font-medium text-gray-800">Drop excel here</p>
            <p className="text-sm text-gray-500 mb-4">xlsx, xls, csv, tsv, etc</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
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
          onClick={() => console.log('TODO: diff logic')}
          className="px-6 py-2 rounded-md text-sm font-medium text-white bg-green-600 disabled:bg-gray-200 disabled:text-gray-40"
        >
          Find differences
        </button>
      </div>
          </div>
    </div>
  );
}