import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, LocalisationResponse } from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class LocalisationApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/localisations`;

  getVilles(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/villes`);
  }
  // localisation.api.ts
  getQuartiers(ville: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(
      `${this.base}/quartiers?ville=${encodeURIComponent(ville)}`,
    );
  }
  getAll(active = true): Observable<ApiResponse<LocalisationResponse[]>> {
    return this.http.get<ApiResponse<LocalisationResponse[]>>(`${this.base}?active=${active}`);
  }

  creerQuartier(req: {
    ville: string;
    quartier: string;
  }): Observable<ApiResponse<LocalisationResponse>> {
    return this.http.post<ApiResponse<LocalisationResponse>>(`${this.base}/quartiers`, req);
  }

  getVillesAvecId(): Observable<ApiResponse<{ id: number; ville: string }[]>> {
    return this.http.get<ApiResponse<{ id: number; ville: string }[]>>(
      `${environment.apiUrl}/localisations/villes-avec-id`,
    );
  }
}
