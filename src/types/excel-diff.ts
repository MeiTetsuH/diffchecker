/**
 * Types for Excel diff comparison results.
 */

/** A single row of spreadsheet data keyed by column header */
export type RowRecord = Record<string, string | number | boolean | undefined>;

/** Classification of a diff row */
export type DiffRowType = 'same' | 'added' | 'removed' | 'modified';

/** A single diff row with its type and the left/right data */
export interface DiffRow {
  type: DiffRowType;
  lRow?: RowRecord;
  rRow?: RowRecord;
}

/** Header metadata stored as the first element of tableDiff */
export interface DiffHeader {
  /** Union of all headers from both sheets */
  headers: string[];
  /** Headers from the left sheet */
  headersLeft: string[];
  /** Headers from the right sheet */
  headersRight: string[];
}

/** The complete diff result stored in IndexedDB */
export interface DiffData {
  tableDiff: [DiffHeader, ...DiffRow[]];
  csvLeft: string[];
  csvRight: string[];
}
