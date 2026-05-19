import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PhotoResponse } from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class PhotoApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/annonces`;

  // uploadPhotos(annonceId: number, files: File[]): Observable<any> {
  //   const formData = new FormData();
  //   files.forEach(f => formData.append('photos', f));
  //   return this.http.request(new HttpRequest('POST', `${this.base}/${annonceId}/photos`, formData, { reportProgress: true }));
  // }

  // ✅ Une requête par photo avec le champ "fichier"
  uploadPhotos(annonceId: number, files: File[]): Observable<any> {
    if (!files.length) return of(null);

    const requests$ = files.map((file) => {
      const fd = new FormData();
      fd.append('fichier', file); // ← nom exact attendu par le backend
      return this.http.post(`${environment.apiUrl}/annonces/${annonceId}/photos`, fd);
    });

    return forkJoin(requests$);
  }

  supprimerPhoto(annonceId: number, photoId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${annonceId}/photos/${photoId}`);
  }
  reordonner(annonceId: number, photoIds: number[]): Observable<ApiResponse<PhotoResponse[]>> {
    return this.http.put<ApiResponse<PhotoResponse[]>>(`${this.base}/${annonceId}/photos/ordre`, {
      photoIds,
    });
  }
}
