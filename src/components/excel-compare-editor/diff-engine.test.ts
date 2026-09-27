import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { sheetToRows } from '@/lib/sheet-rows';
import { computeDiff } from './diff-engine';

function workbook(error: number | undefined, dense: boolean, errorOnly = false) {
  const sheet = XLSX.utils.aoa_to_sheet(errorOnly ? [['value']] : [['id', 'value'], ['A']]);
  if (error !== undefined) sheet[errorOnly ? 'A2' : 'B2'] = { t: 'e', v: error };
  sheet['!ref'] = errorOnly ? 'A1:A2' : 'A1:B2';
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1');
  return XLSX.read(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), {
    type: 'array', dense, cellFormula: false, cellHTML: false, cellStyles: false,
  });
}

function compare(leftWorkbook: XLSX.WorkBook, rightWorkbook: XLSX.WorkBook) {
  return computeDiff({ leftWorkbook, rightWorkbook, leftSheet: 'Sheet1', rightSheet: 'Sheet1', leftHeaderLine: 1, rightHeaderLine: 1 });
}

describe.each([true, false])('displayed spreadsheet values (dense=%s)', (dense) => {
  it('reports changes between error cells in both result views', () => {
    const result = compare(workbook(7, dense), workbook(42, dense));
    expect(result.tableDiff[1]).toEqual({
      type: 'modified', lRow: { id: 'A', value: '#DIV/0!' }, rRow: { id: 'A', value: '#N/A' },
    });
    expect(result.csvLeft[1]).toBe('A,#DIV/0!');
    expect(result.csvRight[1]).toBe('A,#N/A');
  });

  it('distinguishes an error from an empty cell', () => {
    const result = compare(workbook(23, dense), workbook(undefined, dense));
    expect(result.tableDiff[1]).toMatchObject({ type: 'modified', lRow: { value: '#REF!' } });
  });

  it('keeps error-only rows, including the zero-valued #NULL! error', () => {
    const result = compare(workbook(0, dense, true), workbook(42, dense, true));
    expect(result.tableDiff).toHaveLength(2);
    expect(result.tableDiff[1]).toEqual({ type: 'modified', lRow: { value: '#NULL!' }, rRow: { value: '#N/A' } });
  });

  it('preserves formats, booleans and zero while skipping genuinely blank rows', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['date', 'percentage', 'code', 'zero', 'boolean'],
      [45658, 0.25, 7, 0, false],
      [],
      ['end'],
    ]);
    sheet.A2.z = 'yyyy-mm-dd'; sheet.B2.z = '0%'; sheet.C2.z = '000';
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Sheet1');
    const parsed = XLSX.read(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), { dense });
    const rows = sheetToRows(parsed.Sheets.Sheet1);
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(['2025-01-01', '25%', '007', '0', 'FALSE']);
  });
});

it('retains CSV codes as displayed text', () => {
  const book = XLSX.read('code\n007\n9007199254740993', { type: 'string', dense: true });
  expect(sheetToRows(book.Sheets[book.SheetNames[0]])).toEqual([['code'], ['007'], ['9007199254740993']]);
});

it('reads sparse ranges that do not start at A1 without shifting columns', () => {
  expect(sheetToRows({ '!ref': 'C4:D5', C4: { t: 's', v: 'id' }, D4: { t: 's', v: 'value' }, C5: { t: 's', v: 'A' }, D5: { t: 'e', v: 42 } })).toEqual([['id', 'value'], ['A', '#N/A']]);
});
