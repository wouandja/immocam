import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, SignalementRequest } from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class SignalementApi {
  private readonly http = inject(HttpClient);

  signaler(req: SignalementRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${environment.apiUrl}/annonces/${req.annonceId}/signaler`,
      { motif: req.motif, details: req.details },
    );
  }
}
