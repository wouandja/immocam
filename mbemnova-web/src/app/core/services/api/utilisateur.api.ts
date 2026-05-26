import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  UtilisateurProfil,
  ModifierProfilRequest,
  ModifierMotDePasseRequest,
} from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class UtilisateurApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/utilisateurs`;

  getMonProfil(): Observable<ApiResponse<UtilisateurProfil >> {
    return this.http.get<ApiResponse<UtilisateurProfil >>(`${this.base}/profil`);
  }

  modifierProfil(req: ModifierProfilRequest): Observable<ApiResponse<UtilisateurProfil>> {
    return this.http.put<ApiResponse<UtilisateurProfil >>(`${this.base}/profil`, req);
  }

 modifierMotDePasse(req: ModifierMotDePasseRequest): Observable<ApiResponse<void>> {
  // était : /me/password  ← n'existait pas
  return this.http.put<ApiResponse<void>>(`${this.base}/profil/password`, req);
}

  supprimerCompte(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/compte`);
  }
}