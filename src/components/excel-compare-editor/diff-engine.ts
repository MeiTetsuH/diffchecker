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

/**
 * Compute the structured diff between two spreadsheet sheets.
 */
export function computeDiff(input: DiffInput): DiffData {
  const lSheet = input.leftWorkbook.Sheets[input.leftSheet];
  const rSheet = input.rightWorkbook.Sheets[input.rightSheet];

  const lRows = (
    lSheet ? XLSX.utils.sheet_to_json<(string | number | boolean)[]>(lSheet, { header: 1, blankrows: false }) : []
  ) as (string | number | boolean)[][];

  const rRows = (
    rSheet ? XLSX.utils.sheet_to_json<(string | number | boolean)[]>(rSheet, { header: 1, blankrows: false }) : []
  ) as (string | number | boolean)[][];

  const headersLeft = (lRows[input.leftHeaderLine - 1] || []).map(String);
  const headersRight = (rRows[input.rightHeaderLine - 1] || []).map(String);
  const combinedHeaders = Array.from(new Set([...headersLeft, ...headersRight]));

  const lBody = lRows.slice(input.leftHeaderLine);
  const rBody = rRows.slice(input.rightHeaderLine);
  const max = Math.max(lBody.length, rBody.length);

  const diffRows: DiffRow[] = [];

  for (let i = 0; i < max; i++) {
    const lRowRaw = lBody[i] || [];
    const rRowRaw = rBody[i] || [];

    const lRow: RowRecord = headersLeft.reduce<RowRecord>(
      (acc, header, index) => ({ ...acc, [header]: lRowRaw[index] }),
      {},
    );
    const rRow: RowRecord = headersRight.reduce<RowRecord>(
      (acc, header, index) => ({ ...acc, [header]: rRowRaw[index] }),
      {},
    );

    if (
      JSON.stringify(lRowRaw) === JSON.stringify(rRowRaw) &&
      JSON.stringify(headersLeft) === JSON.stringify(headersRight)
    ) {
      diffRows.push({ type: 'same', lRow, rRow });
    } else if (lBody[i] === undefined) {
      diffRows.push({ type: 'added', rRow });
    } else if (rBody[i] === undefined) {
      diffRows.push({ type: 'removed', lRow });
    } else {
      diffRows.push({ type: 'modified', lRow, rRow });
    }
  }

  const header: DiffHeader = { headers: combinedHeaders, headersLeft, headersRight };

  const lCsv = lSheet ? XLSX.utils.sheet_to_csv(lSheet) : '';
  const rCsv = rSheet ? XLSX.utils.sheet_to_csv(rSheet) : '';

  return {
    tableDiff: [header, ...diffRows],
    csvLeft: lCsv.split('\n'),
    csvRight: rCsv.split('\n'),
  };
}
