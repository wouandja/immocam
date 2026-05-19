import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  CommentaireRequest,
  CommentaireResponse,
  RepondreCommentaireRequest,
} from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class CommentaireApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

 
  poster(req: CommentaireRequest): Observable<ApiResponse<CommentaireResponse>> {
    // ❌ était : POST /commentaires
    // ✅ devient : POST /annonces/{id}/commentaires
    return this.http.post<ApiResponse<CommentaireResponse>>(
      `${this.base}/annonces/${req.annonceId}/commentaires`,
      { contenu: req.contenu }
    );
  }

  supprimer(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.base}/commentaires/${id}`
    );
  }

  repondre(id: number, req: RepondreCommentaireRequest): Observable<ApiResponse<CommentaireResponse>> {
    // ❌ était : POST /commentaires/{id}/reponse
    // ✅ devient : POST /commentaires/{id}/repondre
    return this.http.post<ApiResponse<CommentaireResponse>>(
      `${this.base}/commentaires/${id}/repondre`,
      { contenu: req.contenu }
    );
  }
}