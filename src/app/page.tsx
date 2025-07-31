'use client';

import { useState } from 'react';
import TextCompareEditor from '@/components/text-compare-editor';
import dynamic from 'next/dynamic';

const ExcelCompareEditor = dynamic(() => import('@/components/excel-compare-editor'), {
  ssr: false,
});

export default function Home() {
  const [activeEditor, setActiveEditor] = useState('text');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-background)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-separator)' }}>
        <button 
          onClick={() => setActiveEditor('text')} 
          style={{
            padding: '0.5rem 1rem',
            marginRight: '1rem',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            backgroundColor: activeEditor === 'text' ? 'var(--color-primary)' : 'var(--color-widget-background)',
            color: activeEditor === 'text' ? 'var(--color-widget-background)' : 'var(--color-text-base)',
            cursor: 'pointer'
          }}
        >
          Text Compare
        </button>
        <button 
          onClick={() => setActiveEditor('excel')} 
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            backgroundColor: activeEditor === 'excel' ? 'var(--color-primary)' : 'var(--color-widget-background)',
            color: activeEditor === 'excel' ? 'var(--color-widget-background)' : 'var(--color-text-base)',
            cursor: 'pointer'
          }}
        >
          Excel Compare
        </button>
      </div>
      <div style={{ flexGrow: 1 }}>
        {activeEditor === 'text' && <TextCompareEditor />}
        {activeEditor === 'excel' && <ExcelCompareEditor />}
      </div>
    </div>
  );
}