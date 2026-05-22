import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  PageResponse,

  CommentaireResponse,
  AnnonceListResponse,
} from '@core/services/models';
import { LocalisationResponse,  AdminDashboardResponse,
  AdminUtilisateurResponse,
  AdminUtilisateurFilters,
  SignalementResponse,
  TraiterSignalementRequest,
  ConfigSystemeResponse,
  LocalisationRequest,
  TypeBienRequest,
 
  AdminAnnonceFilters, TypeBienResponse } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<ApiResponse<AdminDashboardResponse>> {
    return this.http.get<ApiResponse<AdminDashboardResponse>>(`${this.base}/dashboard`);
  }
  getAnnonces(
    filters: AdminAnnonceFilters = {},
  ): Observable<ApiResponse<PageResponse<AnnonceListResponse>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AnnonceListResponse>>>(`${this.base}/annonces`, {
      params,
    });
  }
  supprimerAnnonce(id: number, motif: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/annonces/${id}?motif=${encodeURIComponent(motif)}`);
  }
  pauseAnnonceAdmin(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/annonces/${id}/pause`, {});
  }
  getUtilisateurs(
    filters: AdminUtilisateurFilters = {},
  ): Observable<ApiResponse<PageResponse<AdminUtilisateurResponse>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AdminUtilisateurResponse>>>(
      `${this.base}/utilisateurs`,
      { params },
    );
  }
  suspendreUtilisateur(id: number, motif: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.base}/utilisateurs/${id}/suspendre?motif=${encodeURIComponent(motif)}`,
      {},
    );
  }
  bannirUtilisateur(id: number, motif: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.base}/utilisateurs/${id}/bannir?motif=${encodeURIComponent(motif)}`,
      {},
    );
  }
  activerUtilisateur(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/utilisateurs/${id}/activer`, {});
  }
  getSignalements(
    statut?: string,
    page = 0,
  ): Observable<ApiResponse<PageResponse<SignalementResponse>>> {
    let params = new HttpParams().set('page', page);
    if (statut) params = params.set('statut', statut);
    return this.http.get<ApiResponse<PageResponse<SignalementResponse>>>(
      `${this.base}/signalements`,
      { params },
    );
  }
  traiterSignalement(id: number, req: TraiterSignalementRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.base}/signalements/${id}/traiter?decision=${encodeURIComponent(req.statut)}`,
      {},
    );
  }
getCommentaires(page = 0, taille = 20): Observable<ApiResponse<PageResponse<CommentaireResponse>>> {
  let params = new HttpParams().set('page', page).set('taille', taille);
  return this.http.get<ApiResponse<PageResponse<CommentaireResponse>>>(
    `${this.base}/commentaires`,
    { params }
  );
}

// À ajouter après basculerTypeBienActif()
modifierQuartierAnnonceAdmin(id: number, quartier: string): Observable<ApiResponse<void>> {
  const params = new HttpParams().set('quartier', quartier);
  return this.http.patch<ApiResponse<void>>(
    `${this.base}/annonces/${id}/quartier`,
    null,
    { params }
  );
}
  supprimerCommentaire(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/commentaires/${id}`);
  }
  getConfig(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/config`);
  }
  updateConfigByKey(cle: string, valeur: string | number | boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.base}/config/${encodeURIComponent(cle)}?valeur=${encodeURIComponent(String(valeur))}`,
      {},
    );
  }
  creerVille(ville: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/villes`, { ville });
  }
  ajouterTypeBien(req: TypeBienRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/types-biens`, { libelle: req.libelle });
  }
  creerUtilisateur(req: {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    ville: string;
    motDePasse: string;
    role: string;
  }): Observable<ApiResponse<AdminUtilisateurResponse>> {
    return this.http.post<ApiResponse<AdminUtilisateurResponse>>(`${this.base}/utilisateurs`, req);
  }
  exportAnnoncesCSV(): Observable<Blob> {
    return this.http.get(`${this.base}/rapports/export/annonces`, { responseType: 'blob' });
  }
  exportUtilisateursCSV(): Observable<Blob> {
    return this.http.get(`${this.base}/rapports/export/utilisateurs`, { responseType: 'blob' });
  }


// À ajouter après pauseAnnonceAdmin()
reactiverAnnonceAdmin(id: number): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(`${this.base}/annonces/${id}/reactiver`, {});
}

// À ajouter après activerUtilisateur()
modifierRoleUtilisateur(id: number, role: string): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(`${this.base}/utilisateurs/${id}/role`, { role });
}

// À ajouter après supprimerCommentaire()
modifierVille(id: number, ville: string): Observable<ApiResponse<LocalisationResponse>> {
  return this.http.put<ApiResponse<LocalisationResponse>>(`${this.base}/villes/${id}`, { ville });
}

basculerVilleActive(id: number, active: boolean): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(`${this.base}/villes/${id}/active?active=${active}`, {});
}

modifierTypeBien(id: number, req: TypeBienRequest): Observable<ApiResponse<TypeBienResponse>> {
  return this.http.put<ApiResponse<TypeBienResponse>>(`${this.base}/types-biens/${id}`, { libelle: req.libelle });
}

basculerTypeBienActif(id: number, actif: boolean): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(`${this.base}/types-biens/${id}/actif?actif=${actif}`, {});
}

 
}
