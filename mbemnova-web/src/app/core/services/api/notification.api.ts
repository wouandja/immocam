import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PageResponse } from '@core/services/models';
import { NotificationResponse } from '@core/services/models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/notifications`;

  lister(page = 0, taille = 20): Observable<ApiResponse<PageResponse<NotificationResponse>>> {
    const params = new HttpParams().set('page', page).set('taille', taille);
    return this.http.get<ApiResponse<PageResponse<NotificationResponse>>>(this.base, { params });
  }

  compterNonLues(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.base}/non-lues/compte`);
  }

  marquerCommeLue(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/lue`, {});
  }

  marquerToutesCommeLues(): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/lues`, {});
  }
}
