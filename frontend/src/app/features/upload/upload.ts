import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CsvService } from '../../core/services/csv.service';
import { SonifyStore } from '../../core/services/sonify.store';
import { ExamplesService, ExampleDataset } from '../../core/services/examples.service';

@Component({
  selector: 'app-upload',
  imports: [],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload {
  protected readonly store = inject(SonifyStore);
  private readonly csvService = inject(CsvService);
  private readonly examplesService = inject(ExamplesService);
  private readonly router = inject(Router);

  protected readonly isDragging = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loadingExample = signal<string | null>(null);

  protected get examples(): ExampleDataset[] {
    return this.examplesService.examples;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.error.set(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.error.set('Only .csv files are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('File too large (max 10MB)');
      return;
    }

    this.isLoading.set(true);
    this.csvService.uploadCsv(file).subscribe({
      next: (response) => {
        this.store.setParsedCsv(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.error ?? 'Failed to parse CSV. Is the backend running?');
      }
    });
  }

  async loadExample(example: ExampleDataset): Promise<void> {
    this.error.set(null);
    this.loadingExample.set(example.slug);

    try {
      const file = await this.examplesService.fetchAsFile(example);
      this.csvService.uploadCsv(file).subscribe({
        next: (response) => {
          this.store.setParsedCsv(response);
          this.store.applySuggestion({
            bpm: example.suggestedBpm,
            scale: example.suggestedScale,
            mappings: example.suggestedMappings
          });
          this.loadingExample.set(null);
          this.router.navigate(['/map']);
        },
        error: (err) => {
          this.loadingExample.set(null);
          this.error.set(err.error?.error ?? 'Failed to load example.');
        }
      });
    } catch {
      this.loadingExample.set(null);
      this.error.set('Could not fetch example file.');
    }
  }

  reset(): void {
    this.store.reset();
    this.error.set(null);
  }

  continueToMapper(): void {
    this.router.navigate(['/map']);
  }
}
