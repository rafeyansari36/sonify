import { Injectable, signal } from '@angular/core';
import * as Tone from 'tone';
import { ParsedCsvResponse } from '../models/parsed-csv.model';
import { DimensionMapping, MusicalScale, SoundDimension } from '../models/composition.model';

interface SonifiedNote {
  time: number;
  pitch: string;
  midi: number;
  duration: number;
  velocity: number;
  synthKey: string;
  rowIndex: number;
}

const SCALE_SEMITONES: Record<MusicalScale, number[]> = {
  C_MAJOR: [0, 2, 4, 5, 7, 9, 11],
  A_MINOR: [0, 2, 3, 5, 7, 8, 10],
  PENTATONIC: [0, 2, 4, 7, 9],
  BLUES: [0, 3, 5, 6, 7, 10],
  CHROMATIC: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const SCALE_ROOT_MIDI: Record<MusicalScale, number> = {
  C_MAJOR: 48,
  A_MINOR: 45,
  PENTATONIC: 48,
  BLUES: 48,
  CHROMATIC: 48,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = 3;

@Injectable({ providedIn: 'root' })
export class MusicEngineService {
  readonly isPlaying = signal(false);
  readonly currentNoteIndex = signal<number>(-1);
  readonly totalNotes = signal(0);
  readonly notes = signal<SonifiedNote[]>([]);

  private synths: Map<string, Tone.PolySynth> = new Map();
  private scheduledIds: number[] = [];
  private totalDuration = 0;

  async prepare(
    csv: ParsedCsvResponse,
    mappings: DimensionMapping[],
    bpm: number,
    scale: MusicalScale,
  ): Promise<void> {
    await Tone.start();
    this.stop();
    this.disposeSynths();

    Tone.getTransport().bpm.value = bpm;

    const scaleNotes = this.buildScaleMidiList(scale);
    const mappingMap = this.toDimensionMap(mappings);
    const beatSeconds = 60 / bpm;

    const instrumentColumn = mappingMap.get('INSTRUMENT');
    const instrumentValues = this.uniqueCategoryValues(csv, instrumentColumn);
    this.createSynthsFor(instrumentValues);

    const notes: SonifiedNote[] = csv.dataPoints.map((row, idx) => {
      const midi = this.computePitch(row, mappingMap.get('PITCH'), csv, scaleNotes, idx);
      const duration = this.computeDuration(row, mappingMap.get('DURATION'), csv, beatSeconds);
      const velocity = this.computeVelocity(row, mappingMap.get('VELOCITY'), csv);
      const synthKey = this.computeSynthKey(row, instrumentColumn, instrumentValues);

      return {
        time: idx * beatSeconds,
        pitch: this.midiToNoteName(midi),
        midi,
        duration,
        velocity,
        synthKey,
        rowIndex: idx,
      };
    });

    this.notes.set(notes);
    this.totalNotes.set(notes.length);
    this.totalDuration = notes.length * beatSeconds;
  }

  async play(): Promise<void> {
    if (this.notes().length === 0) return;
    await Tone.start();

    this.clearScheduled();
    const notes = this.notes();

    notes.forEach((note, idx) => {
      const id = Tone.getTransport().schedule((time) => {
        const synth = this.synths.get(note.synthKey);
        synth?.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
        Tone.getDraw().schedule(() => this.currentNoteIndex.set(idx), time);
      }, note.time);
      this.scheduledIds.push(id);
    });

    const endId = Tone.getTransport().schedule(() => {
      Tone.getDraw().schedule(() => {
        this.currentNoteIndex.set(-1);
        this.isPlaying.set(false);
      }, Tone.now());
      Tone.getTransport().stop();
    }, this.totalDuration + 0.1);
    this.scheduledIds.push(endId);

    Tone.getTransport().start();
    this.isPlaying.set(true);
  }

  pause(): void {
    Tone.getTransport().pause();
    this.isPlaying.set(false);
  }

  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this.clearScheduled();
    this.currentNoteIndex.set(-1);
    this.isPlaying.set(false);
  }

  private clearScheduled(): void {
    this.scheduledIds.forEach((id) => Tone.getTransport().clear(id));
    this.scheduledIds = [];
  }

  private disposeSynths(): void {
    this.synths.forEach((s) => s.dispose());
    this.synths.clear();
  }

  private buildScaleMidiList(scale: MusicalScale): number[] {
    const semis = SCALE_SEMITONES[scale];
    const root = SCALE_ROOT_MIDI[scale];
    const out: number[] = [];
    for (let oct = 0; oct < OCTAVES; oct++) {
      for (const s of semis) {
        out.push(root + oct * 12 + s);
      }
    }
    return out;
  }

  private toDimensionMap(mappings: DimensionMapping[]): Map<SoundDimension, string> {
    return new Map(mappings.map((m) => [m.dimension, m.columnName]));
  }

  private getColumn(csv: ParsedCsvResponse, name: string | undefined) {
    if (!name) return undefined;
    return csv.columns.find((c) => c.name === name);
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private computePitch(
    row: Record<string, string>,
    columnName: string | undefined,
    csv: ParsedCsvResponse,
    scaleNotes: number[],
    rowIndex: number,
  ): number {
    const col = this.getColumn(csv, columnName);
    if (col && col.type === 'NUMERIC' && col.min !== null && col.max !== null) {
      const raw = parseFloat(row[col.name]);
      if (!isNaN(raw)) {
        const norm = this.normalize(raw, col.min, col.max);
        const idx = Math.round(norm * (scaleNotes.length - 1));
        return scaleNotes[idx];
      }
    }
    return scaleNotes[rowIndex % scaleNotes.length];
  }

  private computeDuration(
    row: Record<string, string>,
    columnName: string | undefined,
    csv: ParsedCsvResponse,
    beatSeconds: number,
  ): number {
    const col = this.getColumn(csv, columnName);
    const minDur = 0.05;
    const maxDur = beatSeconds * 0.9;
    if (col && col.type === 'NUMERIC' && col.min !== null && col.max !== null) {
      const raw = parseFloat(row[col.name]);
      if (!isNaN(raw)) {
        const norm = this.normalize(raw, col.min, col.max);
        return minDur + norm * (maxDur - minDur);
      }
    }
    return beatSeconds * 0.6;
  }

  private computeVelocity(
    row: Record<string, string>,
    columnName: string | undefined,
    csv: ParsedCsvResponse,
  ): number {
    const col = this.getColumn(csv, columnName);
    if (col && col.type === 'NUMERIC' && col.min !== null && col.max !== null) {
      const raw = parseFloat(row[col.name]);
      if (!isNaN(raw)) {
        return 0.2 + this.normalize(raw, col.min, col.max) * 0.8;
      }
    }
    return 0.7;
  }

  private uniqueCategoryValues(csv: ParsedCsvResponse, columnName: string | undefined): string[] {
    if (!columnName) return ['default'];
    const col = this.getColumn(csv, columnName);
    if (!col) return ['default'];
    return col.uniqueValues && col.uniqueValues.length > 0 ? col.uniqueValues : ['default'];
  }

  private computeSynthKey(
    row: Record<string, string>,
    columnName: string | undefined,
    values: string[],
  ): string {
    if (!columnName) return values[0];
    const v = row[columnName];
    return values.includes(v) ? v : values[0];
  }

  private createSynthsFor(keys: string[]): void {
    this.synths = this.buildSynthsInCurrentContext(keys);
  }

  private midiToNoteName(midi: number): string {
    const octave = Math.floor(midi / 12) - 1;
    return `${NOTE_NAMES[midi % 12]}${octave}`;
  }

  async renderToWav(filename: string): Promise<Blob | null> {
    const notes = this.notes();
    if (notes.length === 0) return null;

    const bpm = Tone.getTransport().bpm.value;
    const beatSeconds = 60 / bpm;
    const totalDuration = notes.length * beatSeconds + 1;

    const synthKeys = Array.from(new Set(notes.map((n) => n.synthKey)));

    const renderedBuffer = await Tone.Offline(() => {
      const offlineSynths = this.buildSynthsInCurrentContext(synthKeys);
      notes.forEach((note) => {
        const synth = offlineSynths.get(note.synthKey);
        synth?.triggerAttackRelease(note.pitch, note.duration, note.time, note.velocity);
      });
    }, totalDuration);

    const audioBuffer = renderedBuffer.get();
    if (!audioBuffer) return null;

    const { audioBufferToWav } = await import('../utils/wav-encoder');
    const bytes = audioBufferToWav(audioBuffer);
    return new Blob([bytes], { type: 'audio/wav' });
  }

  private buildSynthsInCurrentContext(keys: string[]): Map<string, Tone.PolySynth> {
    const presets = [
      {
        oscillator: { type: 'triangle' as const },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.4 },
      },
      {
        oscillator: { type: 'sawtooth' as const },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
      },
      {
        oscillator: { type: 'square' as const },
        envelope: { attack: 0.04, decay: 0.1, sustain: 0.4, release: 0.3 },
      },
      {
        oscillator: { type: 'sine' as const },
        envelope: { attack: 0.05, decay: 0.4, sustain: 0.5, release: 0.6 },
      },
      {
        oscillator: { type: 'fmsine' as const },
        envelope: { attack: 0.03, decay: 0.25, sustain: 0.3, release: 0.5 },
      },
    ];

    const synths = new Map<string, Tone.PolySynth>();
    keys.forEach((key, idx) => {
      const preset = presets[idx % presets.length];
      const synth = new Tone.PolySynth(Tone.Synth, preset).toDestination();
      synth.volume.value = -8;
      synths.set(key, synth);
    });
    return synths;
  }
}
