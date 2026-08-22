'use client';

import dynamic from 'next/dynamic';

const ExcelCompareEditor = dynamic(() => import('@/components/excel-compare-editor'), {
  ssr: false,
  loading: () => <div className="route-loading">Loading local spreadsheet tools…</div>,
});

export default function ExcelComparePage() {
  return <ExcelCompareEditor />;
}
