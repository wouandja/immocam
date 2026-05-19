import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, FavoriResponse, PageResponse } from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class FavoriApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/favoris`;

  // favori.api.ts
getMesFavoris(): Observable<ApiResponse<PageResponse<FavoriResponse>>> {
  //                                     
  return this.http.get<ApiResponse<PageResponse<FavoriResponse>>>(this.base);
}
 ajouter(annonceId: number): Observable<ApiResponse<void>> {
  // ❌ était : POST /favoris  avec body {annonceId}
  // ✅ devient : POST /favoris/{annonceId}  sans body
  return this.http.post<ApiResponse<void>>(`${this.base}/${annonceId}`, null);
}
  retirer(annonceId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${annonceId}`);
  }
  verifier(annonceId: number): Observable<ApiResponse<{ isFavori: boolean }>> {
    return this.http.get<ApiResponse<{ isFavori: boolean }>>(`${this.base}/check/${annonceId}`);
  }
}
