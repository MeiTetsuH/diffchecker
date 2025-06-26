'use client';

import { BaseLayout } from '@/layout/base-layout';
import ExcelCompareEditor from '@/components/excel-compare-editor';

export default function ExcelComparePage() {
  return (
    <BaseLayout>
        <ExcelCompareEditor />
    </BaseLayout>
  );
}