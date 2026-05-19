import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, ContactResponse, PageResponse } from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/contacts`;

 enregistrer(annonceId: number): Observable<ApiResponse<ContactResponse>> {
  return this.http.post<ApiResponse<ContactResponse>>(
    `${environment.apiUrl}/contacts`, 
    { annonceId }
  );
}
  getMesContacts(page = 0, size = 20): Observable<ApiResponse<PageResponse<ContactResponse>>> {
    return this.http.get<ApiResponse<PageResponse<ContactResponse>>>(
      `${this.base}/mes-contacts?page=${page}&size=${size}`,
    );
  }
  getContactsParAnnonce(annonceId: number): Observable<ApiResponse<ContactResponse[]>> {
    return this.http.get<ApiResponse<ContactResponse[]>>(`${this.base}/annonce/${annonceId}`);
  }
}
