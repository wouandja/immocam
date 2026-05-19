import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, TypeBienResponse } from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class TypeBienApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/types-biens`; // ✅ corrigé : /typebien → /types-biens

  getAll(): Observable<ApiResponse<TypeBienResponse[]>> {
    // Le backend filtre déjà sur estActif=true côté SQL (findByEstActifTrueOrderByLibelleAsc)
    // Aucun paramètre ?active= nécessaire
    return this.http.get<ApiResponse<TypeBienResponse[]>>(this.base);
  }
}
