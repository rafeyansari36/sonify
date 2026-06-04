import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Composition, CreateCompositionRequest } from '../models/composition.model';

@Injectable({ providedIn: 'root' })
export class CompositionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/compositions`;

  create(request: CreateCompositionRequest): Observable<Composition> {
    return this.http.post<Composition>(this.apiUrl, request);
  }

  list(): Observable<Composition[]> {
    return this.http.get<Composition[]>(this.apiUrl);
  }

  getById(id: string): Observable<Composition> {
    return this.http.get<Composition>(`${this.apiUrl}/${id}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
