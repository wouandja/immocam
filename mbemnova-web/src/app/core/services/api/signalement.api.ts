import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, SignalementRequest } from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class SignalementApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/signalements`;

  signaler(req: SignalementRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(this.base, req);
  }
}
