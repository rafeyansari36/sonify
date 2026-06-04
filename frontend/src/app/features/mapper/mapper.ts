import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SonifyStore } from '../../core/services/sonify.store';
import { MusicalScale, SoundDimension } from '../../core/models/composition.model';

interface DimensionSlot {
  dimension: SoundDimension;
  icon: string;
  description: string;
  preferredType: 'NUMERIC' | 'CATEGORICAL';
}

@Component({
  selector: 'app-mapper',
  imports: [RouterLink],
  templateUrl: './mapper.html',
  styleUrl: './mapper.css',
})
export class Mapper {
  protected readonly store = inject(SonifyStore);
  private readonly router = inject(Router);

  protected readonly hoveredSlot = signal<SoundDimension | null>(null);

  protected readonly scales: MusicalScale[] = [
    'C_MAJOR',
    'A_MINOR',
    'PENTATONIC',
    'BLUES',
    'CHROMATIC',
  ];

  protected readonly dimensionSlots: DimensionSlot[] = [
    {
      dimension: 'PITCH',
      icon: '♪',
      description: 'Which note plays. Higher values → higher notes.',
      preferredType: 'NUMERIC',
    },
    {
      dimension: 'DURATION',
      icon: '⏱',
      description: 'How long each note lasts.',
      preferredType: 'NUMERIC',
    },
    {
      dimension: 'VELOCITY',
      icon: '◉',
      description: 'How loud each note is.',
      preferredType: 'NUMERIC',
    },
    {
      dimension: 'INSTRUMENT',
      icon: '♬',
      description: 'Which synth is used per row.',
      preferredType: 'CATEGORICAL',
    },
  ];

  scaleLabel(scale: MusicalScale): string {
    const labels: Record<MusicalScale, string> = {
      C_MAJOR: 'C Major',
      A_MINOR: 'A Minor',
      PENTATONIC: 'Pentatonic',
      BLUES: 'Blues',
      CHROMATIC: 'Chromatic',
    };
    return labels[scale];
  }

  onBpmChange(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.store.bpm.set(value);
  }

  onChipDragStart(event: DragEvent, columnName: string): void {
    event.dataTransfer?.setData('text/plain', columnName);
    event.dataTransfer!.effectAllowed = 'move';
  }

  onSlotDragOver(event: DragEvent, dimension: SoundDimension): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.hoveredSlot.set(dimension);
  }

  onSlotDragLeave(event: DragEvent, dimension: SoundDimension): void {
    event.preventDefault();
    if (this.hoveredSlot() === dimension) {
      this.hoveredSlot.set(null);
    }
  }

  onSlotDrop(event: DragEvent, dimension: SoundDimension): void {
    event.preventDefault();
    this.hoveredSlot.set(null);

    const columnName = event.dataTransfer?.getData('text/plain');
    if (columnName) {
      this.store.assignMapping(dimension, columnName);
    }
  }

  generate(): void {
    if (this.store.isReadyToGenerate()) {
      this.router.navigate(['/play']);
    }
  }

  protected readonly selectedColumn = signal<string | null>(null);

  selectColumn(columnName: string): void {
    this.selectedColumn.update((curr) => (curr === columnName ? null : columnName));
  }

  onSlotTap(dimension: SoundDimension): void {
    const col = this.selectedColumn();
    if (col) {
      this.store.assignMapping(dimension, col);
      this.selectedColumn.set(null);
    }
  }
}
