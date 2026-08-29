import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Excel Compare — DiffChecker',
  description: 'Compare XLSX, XLS, CSV, and TSV spreadsheets locally in your browser. Nothing is uploaded.',
  alternates: { canonical: '/excel-compare' },
};

export default function ExcelCompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
