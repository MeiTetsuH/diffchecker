import { utils, type CellObject, type WorkSheet } from 'xlsx';

export type DisplayRow = Array<string | undefined>;

/** Read displayed values, including error cells that sheet_to_json discards. */
export function sheetToRows(sheet: WorkSheet | undefined): DisplayRow[] {
  if (!sheet?.['!ref']) return [];

  const range = utils.decode_range(sheet['!ref']);
  const dense = sheet['!data'] as CellObject[][] | undefined;
  const columns = Array.from(
    { length: range.e.c - range.s.c + 1 },
    (_, index) => utils.encode_col(range.s.c + index),
  );
  const rows: DisplayRow[] = [];

  for (let r = range.s.r; r <= range.e.r; r += 1) {
    const row: DisplayRow = [];
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cell: CellObject | undefined = dense
        ? dense[r]?.[c]
        : sheet[`${columns[c - range.s.c]}${r + 1}`];
      if (!cell || cell.t === 'z' || cell.v == null) continue;
      row[c - range.s.c] = utils.format_cell(cell);
    }
    // Preserve a row containing an error or an explicit empty string.
    if (row.length > 0) rows.push(row);
  }
  return rows;
}
