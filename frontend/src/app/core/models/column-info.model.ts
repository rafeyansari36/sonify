export type ColumnType = 'NUMERIC' | 'CATEGORICAL';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  min: number | null;
  max: number | null;
  uniqueValues: string[] | null;
  sampleValues: string[];
}
