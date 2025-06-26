export type SavedDiff = {
  /** Primary key – UUID */
  id: string;
  /** A friendly name chosen by the user */
  name: string;
  /** Name of the left-hand file */
  leftFileName: string;
  /** Name of the right-hand file */
  rightFileName: string;
  /** Raw diff results – implementation defined */
  diffData: any;
  /** Creation timestamp (ms since epoch) */
  createdAt: number;
  /** Updated timestamp (ms since epoch) */
  updatedAt?: number;
};

/**
 * Data required to create a new SavedDiff.
 * The id / timestamps are generated automatically.
 */
export type SavedDiffDTO = Omit<SavedDiff, 'id' | 'createdAt' | 'updatedAt'>;
