import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParsedCsvResponse } from '../models/parsed-csv.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CsvService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/csv`;

  uploadCsv(file: File): Observable<ParsedCsvResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ParsedCsvResponse>(`${this.apiUrl}/upload`, formData);
  }
}
