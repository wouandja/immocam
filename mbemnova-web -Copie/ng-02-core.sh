#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 02 : CORE MODULE
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || ERROR "Lancez depuis la racine du projet Angular"

SECTION "SCRIPT 02 — CORE MODULE COMPLET"
INFO "Répertoire : $(pwd)"

CORE="src/app/core"
MODELS="$CORE/models"
SERVICES="$CORE/services"
API_SVC="$CORE/services/api"
INTERCEPTORS="$CORE/interceptors"
GUARDS="$CORE/guards"

# =============================================================================
# CRÉATION DES DOSSIERS (correction : manquait dans la version originale)
# =============================================================================
mkdir -p "$MODELS" "$SERVICES" "$API_SVC" "$INTERCEPTORS" "$GUARDS"
mkdir -p "src/app/store/ui"
OK "Dossiers créés"

# =============================================================================
# 1. MODÈLES TYPESCRIPT
# =============================================================================
SECTION "1/5 — Modèles TypeScript"

cat > "$MODELS/api-response.model.ts" << 'EOF'
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  errors?: string[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  timestamp: string;
}
EOF
OK "api-response.model.ts"

cat > "$MODELS/enums.model.ts" << 'EOF'
export enum StatutAnnonce {
  ACTIVE    = 'ACTIVE',
  EN_PAUSE  = 'EN_PAUSE',
  EXPIREE   = 'EXPIREE',
  ARCHIVEE  = 'ARCHIVEE',
  SUPPRIMEE = 'SUPPRIMEE',
}

export enum RoleUtilisateur {
  UTILISATEUR    = 'UTILISATEUR',
  ADMINISTRATEUR = 'ADMINISTRATEUR',
}

export enum StatutCompte {
  ACTIF    = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  BANNI    = 'BANNI',
}

export enum MotifSignalement {
  ANNONCE_FRAUDULEUSE  = 'ANNONCE_FRAUDULEUSE',
  PHOTOS_NON_CONFORMES = 'PHOTOS_NON_CONFORMES',
  PRIX_INCORRECT       = 'PRIX_INCORRECT',
  BIEN_DEJA_LOUE       = 'BIEN_DEJA_LOUE',
  CONTENU_INAPPROPRIE  = 'CONTENU_INAPPROPRIE',
  AUTRE                = 'AUTRE',
}

export enum StatutSignalement {
  EN_ATTENTE = 'EN_ATTENTE',
  TRAITE     = 'TRAITE',
  IGNORE     = 'IGNORE',
}

export const STATUT_ANNONCE_LABELS: Record<StatutAnnonce, string> = {
  [StatutAnnonce.ACTIVE]:    'Active',
  [StatutAnnonce.EN_PAUSE]:  'En pause',
  [StatutAnnonce.EXPIREE]:   'Expirée',
  [StatutAnnonce.ARCHIVEE]:  'Archivée',
  [StatutAnnonce.SUPPRIMEE]: 'Supprimée',
};

export const MOTIF_SIGNALEMENT_LABELS: Record<MotifSignalement, string> = {
  [MotifSignalement.ANNONCE_FRAUDULEUSE]:  'Annonce frauduleuse ou arnaque',
  [MotifSignalement.PHOTOS_NON_CONFORMES]: 'Photos non conformes au bien réel',
  [MotifSignalement.PRIX_INCORRECT]:       'Prix incorrect ou trompeur',
  [MotifSignalement.BIEN_DEJA_LOUE]:       'Bien déjà loué ou vendu',
  [MotifSignalement.CONTENU_INAPPROPRIE]:  'Contenu inapproprié',
  [MotifSignalement.AUTRE]:                'Autre',
};

export const STATUT_ANNONCE_COLORS: Record<StatutAnnonce, string> = {
  [StatutAnnonce.ACTIVE]:    'badge-active',
  [StatutAnnonce.EN_PAUSE]:  'badge-pause',
  [StatutAnnonce.EXPIREE]:   'badge-expired',
  [StatutAnnonce.ARCHIVEE]:  'badge-archived',
  [StatutAnnonce.SUPPRIMEE]: 'badge-deleted',
};
EOF
OK "enums.model.ts"

cat > "$MODELS/auth.model.ts" << 'EOF'
import { RoleUtilisateur, StatutCompte } from './enums.model';

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RegisterRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  motDePasse: string;
  confirmationMotDePasse: string;
  politiqueAcceptee: boolean;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  utilisateur: UtilisateurProfil;
}

export interface UtilisateurProfil {
  id: number;
  prenom: string;
  nom: string;
  nomComplet: string;
  email: string;
  telephone: string;
  ville: string;
  role: RoleUtilisateur;
  statut: StatutCompte;
  emailVerifie: boolean;
  dateInscription: string;
  nombreAnnoncesActives: number;
  nombreFavoris: number;
}
EOF
OK "auth.model.ts"

cat > "$MODELS/annonce.model.ts" << 'EOF'
import { StatutAnnonce } from './enums.model';

export interface PhotoResponse {
  id: number;
  url: string;
  urlThumb: string;
  ordre: number;
  principale: boolean;
}

export interface LocalisationResponse {
  id: number;
  ville: string;
  quartier: string;
  active: boolean;
}

export interface TypeBienResponse {
  id: number;
  nom: string;
  icone?: string;
  active: boolean;
}

export interface AnnonceListResponse {
  id: number;
  typeBien: string;
  ville: string;
  quartier: string;
  prix: number;
  prixFormate: string;
  statut: StatutAnnonce;
  photoPrincipale?: string;
  photoPrincipaleThumb?: string;
  hasPhotos: boolean;
  datePublication: string;
  dateExpiration: string;
  nombreVues: number;
  isFavori?: boolean;
}

export interface AnnonceDetailResponse extends AnnonceListResponse {
  description: string;
  photos: PhotoResponse[];
  nombreCommentaires: number;
  nombreContacts: number;
  proprietairePrenom: string;
  commentaires: CommentaireResponse[];
  annoncesSimiliaires?: AnnonceListResponse[];
}

export interface PublierAnnonceRequest {
  typeBienId: number;
  localisationId: number;
  description: string;
  prix: number;
  numeroWhatsapp: string;
}

export interface ModifierAnnonceRequest extends Partial<PublierAnnonceRequest> {}

export interface AnnonceFilters {
  ville?: string;
  quartier?: string;
  typeBienId?: number;
  prixMin?: number;
  prixMax?: number;
  motCle?: string;
  statut?: StatutAnnonce;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AnnonceStats {
  nombreVues: number;
  nombreContacts: number;
  nombreCommentaires: number;
  nombreFavoris: number;
}

export interface DashboardStatsResponse {
  nombreAnnoncesActives: number;
  nombreAnnoncesTotal: number;
  nombreContactsTotal: number;
  nombreFavorisTotal: number;
  nombreVuesTotal: number;
  annoncesExpirantBientot: AnnonceListResponse[];
}

export interface ContactResponse {
  id: number;
  utilisateurTelephone: string;
  utilisateurPrenom: string;
  annonceId: number;
  annonceTitre: string;
  dateContact: string;
}

export interface CommentaireResponse {
  id: number;
  auteurPrenom: string;
  contenu: string;
  dateCreation: string;
  estProprietaire: boolean;
  estMien?: boolean;
  reponse?: {
    id: number;
    contenu: string;
    dateCreation: string;
  };
}

export interface CommentaireRequest {
  contenu: string;
  annonceId: number;
}

export interface RepondreCommentaireRequest {
  contenu: string;
}

export interface SignalementRequest {
  annonceId: number;
  motif: string;
  description?: string;
}
EOF
OK "annonce.model.ts"

cat > "$MODELS/utilisateur.model.ts" << 'EOF'
import { RoleUtilisateur, StatutCompte } from './enums.model';

export interface ModifierProfilRequest {
  prenom?: string;
  nom?: string;
  telephone?: string;
  ville?: string;
}

export interface ModifierMotDePasseRequest {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

export interface FavoriResponse {
  id: number;
  annonceId: number;
  typeBien: string;
  ville: string;
  quartier: string;
  prix: number;
  prixFormate: string;
  photoPrincipaleThumb?: string;
  statut: string;
  dateAjout: string;
}
EOF
OK "utilisateur.model.ts"

cat > "$MODELS/admin.model.ts" << 'EOF'
import { RoleUtilisateur, StatutCompte, StatutSignalement } from './enums.model';
import { AnnonceListResponse } from './annonce.model';

export interface AdminDashboardResponse {
  visitesTotales: number;
  visitesTotales7j: number;
  visitesTotales30j: number;
  annoncesActives: number;
  nouvellesAnnonces: number;
  nouvellesAnnonces7j: number;
  nouveauxInscrits: number;
  nouveauxInscrits7j: number;
  contactsWhatsapp: number;
  contactsWhatsapp7j: number;
  commentairesPublies: number;
  commentairesPublies7j: number;
  signalEmentsNonTraites: number;
  evolutionVisites: ChartDataPoint[];
  evolutionContacts: ChartDataPoint[];
  evolutionPublications: ChartDataPoint[];
  villesActives: VilleRanking[];
  typesBiensPopulaires: TypeBienRanking[];
}

export interface ChartDataPoint {
  date: string;
  valeur: number;
}

export interface VilleRanking {
  ville: string;
  nombreAnnonces: number;
}

export interface TypeBienRanking {
  typeBien: string;
  nombreAnnonces: number;
}

export interface AdminUtilisateurResponse {
  id: number;
  prenom: string;
  nom: string;
  nomComplet: string;
  email: string;
  telephone: string;
  ville: string;
  role: RoleUtilisateur;
  statut: StatutCompte;
  emailVerifie: boolean;
  dateInscription: string;
  nombreAnnonces: number;
  nombreConnexions: number;
  derniereConnexion?: string;
}

export interface AdminUtilisateurFilters {
  recherche?: string;
  statut?: StatutCompte;
  role?: RoleUtilisateur;
  ville?: string;
  page?: number;
  size?: number;
}

export interface SignalementResponse {
  id: number;
  annonceId: number;
  annonceTitre: string;
  auteurPrenom: string;
  auteurEmail: string;
  motif: string;
  description?: string;
  statut: StatutSignalement;
  dateSignalement: string;
  dateTraitement?: string;
  administrateurNote?: string;
}

export interface TraiterSignalementRequest {
  statut: StatutSignalement;
  note?: string;
  action?: 'SUPPRIMER_ANNONCE' | 'SUSPENDRE_PROPRIETAIRE' | 'BANNIR_PROPRIETAIRE' | 'IGNORER';
}

export interface ConfigSystemeResponse {
  dureeVieAnnonce: number;
  joursRappelExpiration: number;
  joursSuppressionDefinitive: number;
  maxPhotosParAnnonce: number;
  maxAnnoncesParProprietaire: number;
  messageWhatsappDefaut: string;
  rateLimit: number;
  schedulerEnabled: boolean;
}

export interface LocalisationRequest {
  ville: string;
  quartier: string;
}

export interface TypeBienRequest {
  nom: string;
  icone?: string;
}

export interface AdminAnnonceFilters {
  ville?: string;
  typeBienId?: number;
  statut?: string;
  proprietaireId?: number;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  size?: number;
}
EOF
OK "admin.model.ts"

cat > "$MODELS/index.ts" << 'EOF'
export * from './api-response.model';
export * from './enums.model';
export * from './auth.model';
export * from './annonce.model';
export * from './utilisateur.model';
export * from './admin.model';
EOF
OK "index.ts modèles"

# =============================================================================
# 2. SERVICES API
# =============================================================================
SECTION "2/5 — Services API (11 services)"

cat > "$API_SVC/auth.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResponse, LoginRequest, RegisterRequest, VerifyEmailRequest,
  ResendCodeRequest, ForgotPasswordRequest, ResetPasswordRequest,
  AuthResponse, RefreshTokenRequest, UtilisateurProfil
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  register(req: RegisterRequest): Observable<ApiResponse<{ email: string }>> {
    return this.http.post<ApiResponse<{ email: string }>>(`${this.base}/register`, req);
  }
  verifyEmail(req: VerifyEmailRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/verify-email`, req);
  }
  resendCode(req: ResendCodeRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/resend-code`, req);
  }
  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req);
  }
  refresh(req: RefreshTokenRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/refresh`, req);
  }
  logout(refreshToken: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/logout`, { refreshToken });
  }
  forgotPassword(req: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/forgot-password`, req);
  }
  resetPassword(req: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/reset-password`, req);
  }
  getMe(): Observable<ApiResponse<UtilisateurProfil>> {
    return this.http.get<ApiResponse<UtilisateurProfil>>(`${this.base}/me`);
  }
}
EOF
OK "auth.api.ts"

cat > "$API_SVC/annonce.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResponse, PageResponse, AnnonceListResponse, AnnonceDetailResponse,
  PublierAnnonceRequest, ModifierAnnonceRequest, AnnonceFilters, DashboardStatsResponse
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class AnnonceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/annonces`;

  getAnnonces(filters: AnnonceFilters = {}): Observable<ApiResponse<PageResponse<AnnonceListResponse>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AnnonceListResponse>>>(this.base, { params });
  }
  getAnnonce(id: number): Observable<ApiResponse<AnnonceDetailResponse>> {
    return this.http.get<ApiResponse<AnnonceDetailResponse>>(`${this.base}/${id}`);
  }
  publier(req: PublierAnnonceRequest): Observable<ApiResponse<AnnonceDetailResponse>> {
    return this.http.post<ApiResponse<AnnonceDetailResponse>>(this.base, req);
  }
  modifier(id: number, req: ModifierAnnonceRequest): Observable<ApiResponse<AnnonceDetailResponse>> {
    return this.http.put<ApiResponse<AnnonceDetailResponse>>(`${this.base}/${id}`, req);
  }
  mettreEnPause(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/pause`, {});
  }
  reactiver(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/reactiver`, {});
  }
  renouveler(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/renouveler`, {});
  }
  archiver(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/archiver`, {});
  }
  supprimer(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
  getMesAnnonces(filters: AnnonceFilters = {}): Observable<ApiResponse<PageResponse<AnnonceListResponse>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AnnonceListResponse>>>(`${this.base}/mes-annonces`, { params });
  }
  getDashboardStats(): Observable<ApiResponse<DashboardStatsResponse>> {
    return this.http.get<ApiResponse<DashboardStatsResponse>>(`${this.base}/dashboard-stats`);
  }
}
EOF
OK "annonce.api.ts"

cat > "$API_SVC/photo.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PhotoResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class PhotoApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/annonces`;

  uploadPhotos(annonceId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    return this.http.request(new HttpRequest('POST', `${this.base}/${annonceId}/photos`, formData, { reportProgress: true }));
  }
  supprimerPhoto(annonceId: number, photoId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${annonceId}/photos/${photoId}`);
  }
  reordonner(annonceId: number, photoIds: number[]): Observable<ApiResponse<PhotoResponse[]>> {
    return this.http.put<ApiResponse<PhotoResponse[]>>(`${this.base}/${annonceId}/photos/ordre`, { photoIds });
  }
}
EOF
OK "photo.api.ts"

cat > "$API_SVC/commentaire.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, CommentaireRequest, CommentaireResponse, RepondreCommentaireRequest } from '@core/models';

@Injectable({ providedIn: 'root' })
export class CommentaireApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/commentaires`;

  poster(req: CommentaireRequest): Observable<ApiResponse<CommentaireResponse>> {
    return this.http.post<ApiResponse<CommentaireResponse>>(this.base, req);
  }
  supprimer(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
  repondre(id: number, req: RepondreCommentaireRequest): Observable<ApiResponse<CommentaireResponse>> {
    return this.http.post<ApiResponse<CommentaireResponse>>(`${this.base}/${id}/reponse`, req);
  }
}
EOF
OK "commentaire.api.ts"

cat > "$API_SVC/favori.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, FavoriResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class FavoriApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/favoris`;

  getMesFavoris(): Observable<ApiResponse<FavoriResponse[]>> {
    return this.http.get<ApiResponse<FavoriResponse[]>>(this.base);
  }
  ajouter(annonceId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(this.base, { annonceId });
  }
  retirer(annonceId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${annonceId}`);
  }
  verifier(annonceId: number): Observable<ApiResponse<{ isFavori: boolean }>> {
    return this.http.get<ApiResponse<{ isFavori: boolean }>>(`${this.base}/check/${annonceId}`);
  }
}
EOF
OK "favori.api.ts"

cat > "$API_SVC/contact.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, ContactResponse, PageResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/contacts`;

  enregistrer(annonceId: number): Observable<ApiResponse<{ whatsappUrl: string }>> {
    return this.http.post<ApiResponse<{ whatsappUrl: string }>>(this.base, { annonceId });
  }
  getMesContacts(page = 0, size = 20): Observable<ApiResponse<PageResponse<ContactResponse>>> {
    return this.http.get<ApiResponse<PageResponse<ContactResponse>>>(`${this.base}/mes-contacts?page=${page}&size=${size}`);
  }
  getContactsParAnnonce(annonceId: number): Observable<ApiResponse<ContactResponse[]>> {
    return this.http.get<ApiResponse<ContactResponse[]>>(`${this.base}/annonce/${annonceId}`);
  }
}
EOF
OK "contact.api.ts"

cat > "$API_SVC/signalement.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, SignalementRequest } from '@core/models';

@Injectable({ providedIn: 'root' })
export class SignalementApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/signalements`;

  signaler(req: SignalementRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(this.base, req);
  }
}
EOF
OK "signalement.api.ts"

cat > "$API_SVC/localisation.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, LocalisationResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class LocalisationApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/localisations`;

  getVilles(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/villes`);
  }
  getQuartiers(ville: string): Observable<ApiResponse<LocalisationResponse[]>> {
    return this.http.get<ApiResponse<LocalisationResponse[]>>(`${this.base}/quartiers?ville=${encodeURIComponent(ville)}`);
  }
  getAll(active = true): Observable<ApiResponse<LocalisationResponse[]>> {
    return this.http.get<ApiResponse<LocalisationResponse[]>>(`${this.base}?active=${active}`);
  }
}
EOF
OK "localisation.api.ts"

cat > "$API_SVC/typebien.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, TypeBienResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class TypeBienApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/typebien`;

  getAll(activeOnly = true): Observable<ApiResponse<TypeBienResponse[]>> {
    return this.http.get<ApiResponse<TypeBienResponse[]>>(`${this.base}?active=${activeOnly}`);
  }
}
EOF
OK "typebien.api.ts"

cat > "$API_SVC/utilisateur.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, UtilisateurProfil, ModifierProfilRequest, ModifierMotDePasseRequest } from '@core/models';

@Injectable({ providedIn: 'root' })
export class UtilisateurApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/utilisateurs`;

  getMonProfil(): Observable<ApiResponse<UtilisateurProfil>> {
    return this.http.get<ApiResponse<UtilisateurProfil>>(`${this.base}/me`);
  }
  modifierProfil(req: ModifierProfilRequest): Observable<ApiResponse<UtilisateurProfil>> {
    return this.http.put<ApiResponse<UtilisateurProfil>>(`${this.base}/me`, req);
  }
  modifierMotDePasse(req: ModifierMotDePasseRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.base}/me/password`, req);
  }
  supprimerCompte(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/me`);
  }
}
EOF
OK "utilisateur.api.ts"

cat > "$API_SVC/admin.api.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResponse, PageResponse,
  AdminDashboardResponse, AdminUtilisateurResponse, AdminUtilisateurFilters,
  SignalementResponse, TraiterSignalementRequest, ConfigSystemeResponse,
  LocalisationRequest, TypeBienRequest, AnnonceListResponse, AdminAnnonceFilters,
  CommentaireResponse
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<ApiResponse<AdminDashboardResponse>> {
    return this.http.get<ApiResponse<AdminDashboardResponse>>(`${this.base}/dashboard`);
  }
  getAnnonces(filters: AdminAnnonceFilters = {}): Observable<ApiResponse<PageResponse<AnnonceListResponse>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AnnonceListResponse>>>(`${this.base}/annonces`, { params });
  }
  supprimerAnnonce(id: number, motif: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/annonces/${id}`, { body: { motif } });
  }
  pauseAnnonceAdmin(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/annonces/${id}/pause`, {});
  }
  getUtilisateurs(filters: AdminUtilisateurFilters = {}): Observable<ApiResponse<PageResponse<AdminUtilisateurResponse>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<PageResponse<AdminUtilisateurResponse>>>(`${this.base}/utilisateurs`, { params });
  }
  suspendreUtilisateur(id: number, motif: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/utilisateurs/${id}/suspendre`, { motif });
  }
  bannirUtilisateur(id: number, motif: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/utilisateurs/${id}/bannir`, { motif });
  }
  activerUtilisateur(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/utilisateurs/${id}/activer`, {});
  }
  getSignalements(statut?: string, page = 0): Observable<ApiResponse<PageResponse<SignalementResponse>>> {
    let params = new HttpParams().set('page', page);
    if (statut) params = params.set('statut', statut);
    return this.http.get<ApiResponse<PageResponse<SignalementResponse>>>(`${this.base}/signalements`, { params });
  }
  traiterSignalement(id: number, req: TraiterSignalementRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.base}/signalements/${id}`, req);
  }
  getCommentaires(page = 0): Observable<ApiResponse<PageResponse<CommentaireResponse>>> {
    return this.http.get<ApiResponse<PageResponse<CommentaireResponse>>>(`${this.base}/commentaires?page=${page}`);
  }
  supprimerCommentaire(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/commentaires/${id}`);
  }
  getConfig(): Observable<ApiResponse<ConfigSystemeResponse>> {
    return this.http.get<ApiResponse<ConfigSystemeResponse>>(`${this.base}/config`);
  }
  updateConfig(config: Partial<ConfigSystemeResponse>): Observable<ApiResponse<ConfigSystemeResponse>> {
    return this.http.put<ApiResponse<ConfigSystemeResponse>>(`${this.base}/config`, config);
  }
  ajouterLocalisation(req: LocalisationRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/localisations`, req);
  }
  ajouterTypeBien(req: TypeBienRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/typebien`, req);
  }
  exportAnnoncesCSV(): Observable<Blob> {
    return this.http.get(`${this.base}/exports/annonces`, { responseType: 'blob' });
  }
  exportUtilisateursCSV(): Observable<Blob> {
    return this.http.get(`${this.base}/exports/utilisateurs`, { responseType: 'blob' });
  }
}
EOF
OK "admin.api.ts"

# =============================================================================
# 3. SERVICES MÉTIER
# =============================================================================
SECTION "3/5 — Services métier"

cat > "$SERVICES/storage.service.ts" << 'EOF'
import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY  = 'immocam_access_token';
const REFRESH_TOKEN_KEY = 'immocam_refresh_token';
const USER_KEY          = 'immocam_user';
const DRAFT_KEY         = 'immocam_annonce_draft';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getAccessToken(): string | null  { return localStorage.getItem(ACCESS_TOKEN_KEY); }
  getRefreshToken(): string | null { return localStorage.getItem(REFRESH_TOKEN_KEY); }
  setTokens(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  setUser(user: any): void { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as T : null;
  }
  saveDraft(data: any): void { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); }
  getDraft<T>(): T | null {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) as T : null;
  }
  clearDraft(): void { localStorage.removeItem(DRAFT_KEY); }
  hasDraft(): boolean { return !!localStorage.getItem(DRAFT_KEY); }
  isLoggedIn(): boolean { return !!this.getAccessToken() && !!this.getUser(); }
  clear(): void { this.clearTokens(); }
}
EOF
OK "storage.service.ts"

cat > "$SERVICES/auth.service.ts" << 'EOF'
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { AuthApi } from './api/auth.api';
import { StorageService } from './storage.service';
import { ToastService } from './toast.service';
import { AuthResponse, LoginRequest, UtilisateurProfil, RoleUtilisateur } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly storage = inject(StorageService);
  private readonly router  = inject(Router);
  private readonly toast   = inject(ToastService);

  readonly currentUser = signal<UtilisateurProfil | null>(this.storage.getUser<UtilisateurProfil>());
  readonly isLoggedIn  = computed(() => !!this.currentUser());
  readonly isAdmin     = computed(() => this.currentUser()?.role === RoleUtilisateur.ADMINISTRATEUR);
  readonly isVerified  = computed(() => this.currentUser()?.emailVerifie === true);

  login(req: LoginRequest): Observable<any> {
    return this.authApi.login(req).pipe(tap(res => this._handleAuthSuccess(res.data)));
  }
  logout(): void {
    const rt = this.storage.getRefreshToken();
    if (rt) this.authApi.logout(rt).subscribe({ error: () => {} });
    this.storage.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }
  refreshToken(): Observable<any> {
    const rt = this.storage.getRefreshToken();
    if (!rt) return throwError(() => new Error('No refresh token'));
    return this.authApi.refresh({ refreshToken: rt }).pipe(tap(res => this._handleAuthSuccess(res.data)));
  }
  initFromStorage(): void {
    const user = this.storage.getUser<UtilisateurProfil>();
    if (user) this.currentUser.set(user);
  }
  updateUser(user: UtilisateurProfil): void {
    this.currentUser.set(user);
    this.storage.setUser(user);
  }
  private _handleAuthSuccess(data: AuthResponse): void {
    this.storage.setTokens(data.accessToken, data.refreshToken);
    this.storage.setUser(data.utilisateur);
    this.currentUser.set(data.utilisateur);
  }
}
EOF
OK "auth.service.ts"

cat > "$SERVICES/toast.service.ts" << 'EOF'
import { Injectable } from '@angular/core';

export interface ToastOptions { duration?: number; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private container: HTMLElement | null = null;

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:90vw;min-width:280px;`;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show(message: string, type: 'success'|'error'|'info'|'warning', opts: ToastOptions = {}): void {
    const colors = { success:'#10B981', error:'#EF4444', info:'#3B82F6', warning:'#F59E0B' };
    const el = document.createElement('div');
    el.style.cssText = `background:${colors[type]};color:white;padding:12px 16px;border-radius:12px;
      font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15);pointer-events:all;`;
    el.textContent = message;
    this.getContainer().appendChild(el);
    setTimeout(() => el.remove(), opts.duration ?? 4000);
  }

  success(msg: string, opts?: ToastOptions): void { this.show(msg, 'success', opts); }
  error(msg: string, opts?: ToastOptions): void   { this.show(msg, 'error', opts); }
  info(msg: string, opts?: ToastOptions): void    { this.show(msg, 'info', opts); }
  warning(msg: string, opts?: ToastOptions): void { this.show(msg, 'warning', opts); }
}
EOF
OK "toast.service.ts"

cat > "$SERVICES/scroll.service.ts" << 'EOF'
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  observeElement(element: Element, threshold = 0.1): Observable<void> {
    return new Observable(subscriber => {
      const observer = new IntersectionObserver(
        entries => { if (entries[0].isIntersecting) subscriber.next(); },
        { threshold, rootMargin: '200px' }
      );
      observer.observe(element);
      return () => observer.disconnect();
    });
  }
  scrollToTop(smooth = true): void {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
  }
  scrollToElement(el: Element, offset = 80): void {
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}
EOF
OK "scroll.service.ts"

# =============================================================================
# 4. INTERCEPTORS
# =============================================================================
SECTION "4/5 — Interceptors HTTP"

cat > "$INTERCEPTORS/auth.interceptor.ts" << 'EOF'
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '@core/services/storage.service';
import { environment } from '@environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password',
    '/auth/reset-password', '/auth/refresh'];
  const isPublic = publicRoutes.some(r => req.url.includes(r));
  if (isPublic || !req.url.startsWith(environment.apiUrl)) return next(req);
  const token = inject(StorageService).getAccessToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
EOF
OK "auth.interceptor.ts"

cat > "$INTERCEPTORS/refresh.interceptor.ts" << 'EOF'
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, BehaviorSubject, catchError, filter, take, switchMap } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || req.url.includes('/auth/refresh')) return throwError(() => err);
      if (isRefreshing) {
        return refreshSubject.pipe(
          filter(t => t !== null), take(1),
          switchMap(t => next(req.clone({ setHeaders: { Authorization: `Bearer ${t}` } })))
        );
      }
      isRefreshing = true;
      refreshSubject.next(null);
      return authService.refreshToken().pipe(
        switchMap(res => {
          isRefreshing = false;
          refreshSubject.next(res.data.accessToken);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${res.data.accessToken}` } }));
        }),
        catchError(e => { isRefreshing = false; authService.logout(); return throwError(() => e); })
      );
    })
  );
};
EOF
OK "refresh.interceptor.ts"

cat > "$INTERCEPTORS/loading.interceptor.ts" << 'EOF'
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { Store } from '@ngrx/store';
import { uiActions } from '@store/ui/ui.actions';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/refresh') || req.reportProgress) return next(req);
  const store = inject(Store);
  activeRequests++;
  if (activeRequests === 1) store.dispatch(uiActions.setLoading({ loading: true }));
  return next(req).pipe(
    finalize(() => {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) store.dispatch(uiActions.setLoading({ loading: false }));
    })
  );
};
EOF
OK "loading.interceptor.ts"

cat > "$INTERCEPTORS/error.interceptor.ts" << 'EOF'
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError } from 'rxjs';
import { ToastService } from '@core/services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.url.includes('/auth/refresh')) return throwError(() => err);
      let msg = 'Une erreur s\'est produite';
      if (!navigator.onLine) {
        msg = 'Vous êtes hors connexion.';
      } else {
        switch (err.status) {
          case 0:   msg = 'Impossible de contacter le serveur.'; break;
          case 400: msg = err.error?.message || 'Données invalides'; break;
          case 401: return throwError(() => err);
          case 403: msg = 'Accès non autorisé'; break;
          case 404: msg = 'Ressource introuvable'; break;
          case 429: msg = 'Trop de requêtes. Attendez quelques instants.'; break;
          case 500: msg = 'Erreur serveur. Réessayez plus tard.'; break;
          default:  msg = err.error?.message || msg;
        }
      }
      if (!req.headers.has('X-Silent')) toast.error(msg);
      return throwError(() => err);
    })
  );
};
EOF
OK "error.interceptor.ts"

# =============================================================================
# 5. GUARDS
# =============================================================================
SECTION "5/5 — Guards de navigation"

cat > "$GUARDS/auth.guard.ts" << 'EOF'
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (auth.isLoggedIn()) return true;
  toast.info('Connectez-vous pour accéder à cette page');
  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
EOF
OK "auth.guard.ts"

cat > "$GUARDS/guest.guard.ts" << 'EOF'
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  return router.createUrlTree(['/dashboard']);
};
EOF
OK "guest.guard.ts"

cat > "$GUARDS/role.guard.ts" << 'EOF'
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

export const roleAdminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (auth.isAdmin()) return true;
  toast.error('Accès réservé aux administrateurs');
  return router.createUrlTree(['/']);
};
EOF
OK "role.guard.ts"

cat > "$GUARDS/verified.guard.ts" << 'EOF'
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const verifiedGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/auth/login']);
  if (auth.isVerified()) return true;
  return router.createUrlTree(['/auth/verify-email']);
};
EOF
OK "verified.guard.ts"

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 02 TERMINÉ — CORE MODULE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Modèles TypeScript : 6 fichiers"
INFO "Services API       : 11 services"
INFO "Services métier    : AuthService, StorageService, ToastService, ScrollService"
INFO "Interceptors       : auth, refresh, loading, error"
INFO "Guards             : auth, guest, roleAdmin, verified"
echo ""
WARN "Prochaine étape : bash ng-03-store.sh"