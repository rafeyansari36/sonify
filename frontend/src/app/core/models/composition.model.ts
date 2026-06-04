import { ColumnInfo } from './column-info.model';

export type SoundDimension = 'PITCH' | 'DURATION' | 'VELOCITY' | 'INSTRUMENT';
export type MusicalScale = 'C_MAJOR' | 'A_MINOR' | 'PENTATONIC' | 'BLUES' | 'CHROMATIC';

export interface DimensionMapping {
  dimension: SoundDimension;
  columnName: string;
}

export interface Composition {
  id: string;
  name: string;
  filename: string;
  createdAt: string;
  bpm: number;
  scale: MusicalScale;
  mappings: DimensionMapping[];
  columns: ColumnInfo[];
  dataPoints: Record<string, string>[];
}

export interface CreateCompositionRequest {
  name: string;
  filename: string;
  bpm: number;
  scale: MusicalScale;
  mappings: DimensionMapping[];
  columns: ColumnInfo[];
  dataPoints: Record<string, string>[];
}
