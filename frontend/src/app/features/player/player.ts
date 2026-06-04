import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SonifyStore } from '../../core/services/sonify.store';
import { MusicEngineService } from '../../core/services/music-engine.service';
import { MusicalScale } from '../../core/models/composition.model';
import { CompositionService } from '../../core/services/composition.service';

@Component({
  selector: 'app-player',
  imports: [RouterLink, FormsModule],
  templateUrl: './player.html',
  styleUrl: './player.css',
})
export class Player implements OnInit, OnDestroy {
  protected readonly store = inject(SonifyStore);
  protected readonly engine = inject(MusicEngineService);
  private readonly compositionService = inject(CompositionService);
  private readonly router = inject(Router);

  protected readonly ready = signal(false);
  protected readonly showSaveDialog = signal(false);
  protected readonly saveName = signal('');
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly justSaved = signal(false);

  protected readonly exporting = signal(false);
  protected readonly exportError = signal<string | null>(null);

  protected readonly currentNote = computed(() => {
    const idx = this.engine.currentNoteIndex();
    if (idx < 0) return null;
    return this.engine.notes()[idx] ?? null;
  });

  async ngOnInit(): Promise<void> {
    const csv = this.store.parsedCsv();
    if (!csv) return;
    await this.engine.prepare(csv, this.store.mappings(), this.store.bpm(), this.store.scale());
    this.ready.set(true);

    const defaultName = csv.filename.replace(/\.csv$/i, '');
    this.saveName.set(defaultName);
  }

  ngOnDestroy(): void {
    this.engine.stop();
  }

  async onPlayPause(): Promise<void> {
    if (this.engine.isPlaying()) {
      this.engine.pause();
    } else {
      await this.engine.play();
    }
  }

  onStop(): void {
    this.engine.stop();
  }

  openSaveDialog(): void {
    this.engine.stop();
    this.saveError.set(null);
    this.justSaved.set(false);
    this.showSaveDialog.set(true);
  }

  closeSaveDialog(): void {
    this.showSaveDialog.set(false);
  }

  save(): void {
    const csv = this.store.parsedCsv();
    if (!csv) return;
    const name = this.saveName().trim();
    if (!name) {
      this.saveError.set('Name is required');
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.compositionService
      .create({
        name,
        filename: csv.filename,
        bpm: this.store.bpm(),
        scale: this.store.scale(),
        mappings: this.store.mappings(),
        columns: csv.columns,
        dataPoints: csv.dataPoints,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.justSaved.set(true);
          setTimeout(() => this.showSaveDialog.set(false), 1200);
        },
        error: (err) => {
          this.saving.set(false);
          this.saveError.set(err.error?.error ?? 'Failed to save');
        },
      });
  }

  goToLibrary(): void {
    this.router.navigate(['/library']);
  }

  noteHeight(midi: number): number {
    const notes = this.engine.notes();
    if (notes.length === 0) return 0;
    const midis = notes.map((n) => n.midi);
    const min = Math.min(...midis);
    const max = Math.max(...midis);
    if (max === min) return 50;
    return 10 + ((midi - min) / (max - min)) * 90;
  }

  scaleLabel(scale: MusicalScale): string {
    return {
      C_MAJOR: 'C Major',
      A_MINOR: 'A Minor',
      PENTATONIC: 'Pentatonic',
      BLUES: 'Blues',
      CHROMATIC: 'Chromatic',
    }[scale];
  }

  async exportWav(): Promise<void> {
    const csv = this.store.parsedCsv();
    if (!csv || this.exporting()) return;

    this.engine.stop();
    this.exporting.set(true);
    this.exportError.set(null);

    try {
      const { downloadBlob } = await import('../../core/utils/wav-encoder');
      const baseName = csv.filename.replace(/\.csv$/i, '');
      const blob = await this.engine.renderToWav(baseName);
      if (!blob) {
        this.exportError.set('Nothing to render');
        return;
      }
      downloadBlob(blob, `${baseName}.wav`);
    } catch (err) {
      console.error(err);
      this.exportError.set('Failed to render audio');
    } finally {
      this.exporting.set(false);
    }
  }
}
