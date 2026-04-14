/**
 * Pure functions for computing Excel diff results.
 * No React or DOM dependencies — fully testable.
 */

import * as XLSX from 'xlsx';
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
  const row: RowRecord = {};
  for (let i = 0; i < headers.length; i++) {
    row[headers[i]] = rowRaw[i];
  }
  return row;
}

function normalizeHeaders(headerRow: CellValue[]): string[] {
  const counts = new Map<string, number>();
  return headerRow.map((raw, index) => {
    const base = String(raw ?? '').trim() || `Column ${index + 1}`;
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

function signatureFromRecord(row: RowRecord, headers: string[]): string {
  return headers
    .map((header) => {
      const value = row[header];
      return value === undefined ? '__UNDEFINED__' : String(value);
    })
    .join('\u001f');
}

function buildLcsMatches(left: string[], right: string[]): Array<[number, number]> {
  const m = left.length;
  const n = right.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (left[i] === right[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const matches: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (left[i] === right[j]) {
      matches.push([i, j]);
      i++;
      j++;
      continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  return matches;
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
  const matches = buildLcsMatches(leftSignatures, rightSignatures);

  const diffRows: DiffRow[] = [];
  let leftCursor = 0;
  let rightCursor = 0;

  const pushUnmatchedBlock = (
    leftEnd: number,
    rightEnd: number,
  ) => {
    const leftBlock = leftEnd - leftCursor;
    const rightBlock = rightEnd - rightCursor;
    const pairCount = Math.min(leftBlock, rightBlock);

    for (let i = 0; i < pairCount; i++) {
      const lRow = leftRecords[leftCursor + i];
      const rRow = rightRecords[rightCursor + i];
      const lSig = leftSignatures[leftCursor + i];
      const rSig = rightSignatures[rightCursor + i];
      diffRows.push({ type: lSig === rSig ? 'same' : 'modified', lRow, rRow });
    }

    for (let i = pairCount; i < leftBlock; i++) {
      diffRows.push({ type: 'removed', lRow: leftRecords[leftCursor + i] });
    }
    for (let i = pairCount; i < rightBlock; i++) {
      diffRows.push({ type: 'added', rRow: rightRecords[rightCursor + i] });
    }

    leftCursor = leftEnd;
    rightCursor = rightEnd;
  };

  for (const [leftMatch, rightMatch] of matches) {
    pushUnmatchedBlock(leftMatch, rightMatch);
    diffRows.push({
      type: 'same',
      lRow: leftRecords[leftMatch],
      rRow: rightRecords[rightMatch],
    });
    leftCursor = leftMatch + 1;
    rightCursor = rightMatch + 1;
  }
  pushUnmatchedBlock(leftRecords.length, rightRecords.length);

  const header: DiffHeader = { headers: combinedHeaders, headersLeft, headersRight };

  const lCsv = lSheet ? XLSX.utils.sheet_to_csv(lSheet) : '';
  const rCsv = rSheet ? XLSX.utils.sheet_to_csv(rSheet) : '';

  return {
    tableDiff: [header, ...diffRows],
    csvLeft: lCsv.split('\n'),
    csvRight: rCsv.split('\n'),
  };
}
