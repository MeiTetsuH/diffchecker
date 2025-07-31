'use client';

import dynamic from 'next/dynamic';

const ExcelCompareEditor = dynamic(() => import('@/components/excel-compare-editor'), {
  ssr: false,
});

export default function ExcelComparePage() {
  return (
    <ExcelCompareEditor />
  );
}