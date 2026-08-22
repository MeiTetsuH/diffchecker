/**
 * Pure functions for computing Excel diff results.
 * No React or DOM dependencies — fully testable.
 */

import * as XLSX from 'xlsx';
import { alignSequences } from '@/lib/sequence-diff';
import type { DiffRow, DiffHeader, DiffData, RowRecord } from '@/types/excel-diff';

export interface DiffInput {
  leftWorkbook: XLSX.WorkBook;
  rightWorkbook: XLSX.WorkBook;
  leftSheet: string;
  rightSheet: string;
  leftHeaderLine: number;
  rightHeaderLine: number;
}

type CellValue = string | number | boolean | undefined;

function clampHeaderLine(headerLine: number, rowsLength: number): number {
  const parsed = Number.isFinite(headerLine) ? Math.trunc(headerLine) : 1;
  const max = Math.max(rowsLength, 1);
  if (parsed < 1) return 1;
  if (parsed > max) return max;
  return parsed;
}

function toRows(sheet: XLSX.WorkSheet | undefined): CellValue[][] {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    blankrows: false,
  }) as CellValue[][];
}

function toRowRecord(headers: string[], rowRaw: CellValue[]): RowRecord {
  const row = Object.create(null) as RowRecord;
  for (let i = 0; i < headers.length; i++) {
    row[headers[i]] = rowRaw[i];
  }
  return row;
}

function normalizeHeaders(headerRow: CellValue[]): string[] {
  const used = new Set<string>();
  return headerRow.map((raw, index) => {
    const base = String(raw ?? '').trim() || `Column ${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${base} (${suffix})`;
      suffix += 1;
    }
    used.add(candidate);
    return candidate;
  });
}

function signatureFromRecord(row: RowRecord, headers: string[]): string {
  return headers
    .map((header) => {
      const value = row[header];
      if (value === undefined) return 'u';
      const text = String(value);
      return `v${text.length}:${text}`;
    })
    .join('');
}

/**
 * Compute the structured diff between two spreadsheet sheets.
 */
export function computeDiff(input: DiffInput): DiffData {
  const lSheet = input.leftWorkbook.Sheets[input.leftSheet];
  const rSheet = input.rightWorkbook.Sheets[input.rightSheet];

  const lRows = toRows(lSheet);
  const rRows = toRows(rSheet);

  const leftHeaderLine = clampHeaderLine(input.leftHeaderLine, lRows.length);
  const rightHeaderLine = clampHeaderLine(input.rightHeaderLine, rRows.length);

  const headersLeft = normalizeHeaders(lRows[leftHeaderLine - 1] || []);
  const headersRight = normalizeHeaders(rRows[rightHeaderLine - 1] || []);
  const combinedHeaders = Array.from(new Set([...headersLeft, ...headersRight]));

  const lBody = lRows.slice(leftHeaderLine);
  const rBody = rRows.slice(rightHeaderLine);

  const leftRecords = lBody.map((row) => toRowRecord(headersLeft, row));
  const rightRecords = rBody.map((row) => toRowRecord(headersRight, row));
  const leftSignatures = leftRecords.map((row) => signatureFromRecord(row, combinedHeaders));
  const rightSignatures = rightRecords.map((row) => signatureFromRecord(row, combinedHeaders));
  const alignment = alignSequences(leftSignatures, rightSignatures);

  const diffRows: DiffRow[] = [];

  for (const item of alignment.items) {
    const lRow = item.leftIndex === undefined ? undefined : leftRecords[item.leftIndex];
    const rRow = item.rightIndex === undefined ? undefined : rightRecords[item.rightIndex];

    if (item.leftIndex === undefined) {
      diffRows.push({ type: 'added', rRow });
    } else if (item.rightIndex === undefined) {
      diffRows.push({ type: 'removed', lRow });
    } else {
      diffRows.push({ type: item.left === item.right ? 'same' : 'modified', lRow, rRow });
    }
  }

  const header: DiffHeader = { headers: combinedHeaders, headersLeft, headersRight };

  const lCsv = lSheet ? XLSX.utils.sheet_to_csv(lSheet) : '';
  const rCsv = rSheet ? XLSX.utils.sheet_to_csv(rSheet) : '';

  return {
    tableDiff: [header, ...diffRows],
    csvLeft: lCsv.split('\n'),
    csvRight: rCsv.split('\n'),
    alignmentLimited: alignment.limited || undefined,
  };
}
