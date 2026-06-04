import { ColumnInfo } from './column-info.model';

export interface ParsedCsvResponse {
  filename: string;
  totalRows: number;
  columns: ColumnInfo[];
  dataPoints: Record<string, string>[];
}
