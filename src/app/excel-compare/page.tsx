'use client';

import { BaseLayout } from '@/layout/base-layout';
import dynamic from 'next/dynamic';

const ExcelCompareEditor = dynamic(() => import('@/components/excel-compare-editor'), {
  ssr: false,
});

export default function ExcelComparePage() {
  return (
    <BaseLayout>
        <ExcelCompareEditor />
    </BaseLayout>
  );
}