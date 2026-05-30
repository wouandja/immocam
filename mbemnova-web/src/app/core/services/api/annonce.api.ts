import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  PageResponse,
  AnnonceListResponse,
  AnnonceDetailResponse,
  PublierAnnonceRequest,
  ModifierAnnonceRequest,
  AnnonceFilters,
  DashboardStatsResponse,
  AnnonceDashboardResponse,
} from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class AnnonceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/annonces`;

  getAnnonces(
    filters: AnnonceFilters = {},
  ): Observable<ApiResponse<PageResponse<AnnonceListResponse>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AnnonceListResponse>>>(this.base, { params });
  }
  getAnnonce(id: number): Observable<ApiResponse<AnnonceDetailResponse>> {
    return this.http.get<ApiResponse<AnnonceDetailResponse>>(`${this.base}/${id}`);
  }

  publier(req: PublierAnnonceRequest): Observable<ApiResponse<AnnonceDashboardResponse>> {
    return this.http.post<ApiResponse<AnnonceDashboardResponse>>(this.base, req);
  }

// Dans annonce.api.ts — ajouter :
desarchiver(id: number): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/desarchiver`, {});
}

  modifier(
    id: number,
    req: ModifierAnnonceRequest,
  ): Observable<ApiResponse<AnnonceDashboardResponse>> {
    return this.http.put<ApiResponse<AnnonceDashboardResponse>>(`${this.base}/${id}`, req);
  }
  mettreEnPause(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/pause`, {});
  }
  reactiver(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/reactiver`, {});
  }
  renouveler(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/renouveler`, {});
  }
  archiver(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/archiver`, {});
  }
  supprimer(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
  getMesAnnonces(
    filters: AnnonceFilters = {},
  ): Observable<ApiResponse<PageResponse<AnnonceDashboardResponse >>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AnnonceDashboardResponse >>>(
      `${this.base}/mes-annonces`,
      { params },
    );
  }
  getDashboardStats(): Observable<ApiResponse<DashboardStatsResponse>> {
    return this.http.get<ApiResponse<DashboardStatsResponse>>(`${this.base}/dashboard-stats`);
  }
}
