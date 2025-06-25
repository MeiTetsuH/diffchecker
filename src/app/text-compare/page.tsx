'use client';

import TextDiffEditor from '@/components/text-compare-editor';
import { BaseLayout } from '@/layout/base-layout';

export default function TextComparePage() {
  return (
    <BaseLayout>
      <TextDiffEditor />
    </BaseLayout>
  );
}