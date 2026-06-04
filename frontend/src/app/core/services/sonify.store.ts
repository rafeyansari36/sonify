import { Injectable, signal, computed } from '@angular/core';
import { ParsedCsvResponse } from '../models/parsed-csv.model';
import {
  Composition,
  DimensionMapping,
  MusicalScale,
  SoundDimension,
} from '../models/composition.model';

@Injectable({ providedIn: 'root' })
export class SonifyStore {
  readonly parsedCsv = signal<ParsedCsvResponse | null>(null);
  readonly mappings = signal<DimensionMapping[]>([]);
  readonly bpm = signal<number>(120);
  readonly scale = signal<MusicalScale>('C_MAJOR');

  readonly hasData = computed(() => this.parsedCsv() !== null);

  readonly numericColumns = computed(
    () => this.parsedCsv()?.columns.filter((c) => c.type === 'NUMERIC') ?? [],
  );
  readonly categoricalColumns = computed(
    () => this.parsedCsv()?.columns.filter((c) => c.type === 'CATEGORICAL') ?? [],
  );

  readonly mappedColumnNames = computed(() => new Set(this.mappings().map((m) => m.columnName)));

  readonly isReadyToGenerate = computed(() => this.mappings().some((m) => m.dimension === 'PITCH'));

  setParsedCsv(csv: ParsedCsvResponse): void {
    this.parsedCsv.set(csv);
    this.mappings.set([]);
  }

  assignMapping(dimension: SoundDimension, columnName: string): void {
    const next = this.mappings().filter(
      (m) => m.dimension !== dimension && m.columnName !== columnName,
    );
    next.push({ dimension, columnName });
    this.mappings.set(next);
  }

  removeMapping(dimension: SoundDimension): void {
    this.mappings.set(this.mappings().filter((m) => m.dimension !== dimension));
  }

  getMappingFor(dimension: SoundDimension): string | null {
    return this.mappings().find((m) => m.dimension === dimension)?.columnName ?? null;
  }

  reset(): void {
    this.parsedCsv.set(null);
    this.mappings.set([]);
    this.bpm.set(120);
    this.scale.set('C_MAJOR');
  }

  loadComposition(composition: Composition): void {
    this.parsedCsv.set({
      filename: composition.filename,
      totalRows: composition.dataPoints.length,
      columns: composition.columns,
      dataPoints: composition.dataPoints,
    });
    this.mappings.set(composition.mappings);
    this.bpm.set(composition.bpm);
    this.scale.set(composition.scale);
  }

  applySuggestion(suggestion: {
    bpm: number;
    scale: MusicalScale;
    mappings: DimensionMapping[];
  }): void {
    this.bpm.set(suggestion.bpm);
    this.scale.set(suggestion.scale);
    this.mappings.set(suggestion.mappings);
  }
}
