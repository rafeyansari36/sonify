import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CompositionService } from '../../core/services/composition.service';
import { SonifyStore } from '../../core/services/sonify.store';
import { Composition } from '../../core/models/composition.model';

@Component({
  selector: 'app-library',
  imports: [RouterLink, DatePipe],
  templateUrl: './library.html',
  styleUrl: './library.css'
})
export class Library implements OnInit {
  private readonly service = inject(CompositionService);
  private readonly store = inject(SonifyStore);
  private readonly router = inject(Router);

  protected readonly compositions = signal<Composition[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly confirmDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (list) => {
        this.compositions.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load library. Is the backend running?');
        this.loading.set(false);
      }
    });
  }

  open(composition: Composition): void {
    this.store.loadComposition(composition);
    this.router.navigate(['/play']);
  }

  askDelete(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDeleteId.set(id);
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDeleteId.set(null);
  }

  confirmDelete(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.deletingId.set(id);
    this.service.delete(id).subscribe({
      next: () => {
        this.compositions.set(this.compositions().filter(c => c.id !== id));
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      },
      error: () => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      }
    });
  }
}
