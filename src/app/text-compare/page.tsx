import type { Metadata } from 'next';
import TextCompareEditor from '@/components/text-compare-editor';

/** Same view as the home page, so `/` is the canonical URL for both. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function TextComparePage() {
  return <TextCompareEditor />;
}
