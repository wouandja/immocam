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
  libelle: string;       // ✅ champ réel retourné par le backend
  estActif: boolean;     // ✅ champ réel retourné par le backend
  icone?: string;
  dateCreation?: string;
 
  // Alias de compatibilité si d'autres parties du code utilisent encore `nom` / `active`
  // — NE PAS déclarer ici, gérer dans le service ou via un mapper
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
  nombreCommentaires: number;
  isFavori?: boolean;
  /** true si l'annonce a été mise en pause par un admin (vue admin uniquement). */
  misEnPauseParAdmin?: boolean;
}

export interface AnnonceDetailResponse extends AnnonceListResponse {
  description: string;
  nombreContacts: number;
  lienWhatsApp?: string; // null si non connecté
  dateExpirationFormatee: string;
  proprietairePrenom: string; // ✅ backend: "proprietairePrenom"
  estMienne: boolean;
  dejaSignalee: boolean;
  photos: PhotoResponse[];
  commentaires: CommentaireResponse[];
  annoncesSimiliaires?: AnnonceListResponse[];
}

export interface PublierAnnonceRequest {
  typeBienId: number;
  localisationId: number;
  quartier: string; // ✅ Quartier saisi librement par l'utilisateur
  description: string;
  prix: number;
  numeroWhatsApp?: string;
}

export interface ModifierAnnonceRequest extends Partial<PublierAnnonceRequest> {}

export interface AnnonceFilters {
  ville?: string;
  quartier?: string;
  taille?: number;
  typeBienId?: number;
  prixMin?: number;
  prixMax?: number;
  motCle?: string;
  statut?: StatutAnnonce;
  page?: number;
  size?: number;
  sort?: string;
  localisationId?: number;
}

// ✅ AJOUTER dans annonce.model.ts
export interface AnnonceDashboardResponse {
  id: number;
  typeBien: string;
  ville: string;
  quartier: string;
  prix: number;
  statut: StatutAnnonce;
  nombreVues: number;
  nombreContacts: number;
  nombreCommentaires: number;
  photoUrl: string;
  datePublication: string;
  dateExpiration: string;
  dateExpirationFormatee: string;
  /** true si l'annonce a été mise en pause par un admin (réactivation réservée à l'admin). */
  misEnPauseParAdmin?: boolean;
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
  utilisateurPrenom: string;
  telephoneMasque: string;
  lienWhatsApp: string;
  annonceTitre?: string;
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
  details?: string;
}

// ─── Référentiels ─────────────────────────────────────────────────────────────
export interface TypeBienResponse {
  id: number;
  libelle: string;
  icone?: string;
  estActif: boolean;
}
