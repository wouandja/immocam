import { RoleUtilisateur, StatutCompte, StatutSignalement } from './enums.model';
import { AnnonceListResponse } from './annonce.model';

export interface AdminDashboardResponse {
  // Aujourd'hui
  annoncesPublieesAujourdhui: number;
  nouveauxInscritsAujourdhui: number;
  contactsWhatsAppAujourdhui: number;
  commentairesAujourdhui: number;
  // 7 derniers jours
  annoncesPubliees7j: number;
  nouveauxInscrits7j: number;
  contactsWhatsApp7j: number;
  // Temps réel
  annoncesActives: number;
  signalementsEnAttente: number;
  utilisateursActifs: number;
  utilisateursSuspendus: number;
  utilisateursTotal: number;
  contactsWhatsAppTotal: number;
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

// ============================================
// admin.utilisateur.model.ts
// ============================================
export interface AdminUtilisateurResponse {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephoneMasque: string;  // ← backend envoie telephoneMasque
  ville: string;
  role: string;              // ← backend envoie string, pas RoleUtilisateur enum
  statut: string;            // ← backend envoie string, pas StatutCompte enum
  dateInscription: string;
  dernierLogin: string;      // ← backend: dernierLogin
  nombreAnnoncesActives: number;
  nombreAnnoncesTotal: number;
}

export interface AdminUtilisateurFilters {
  terme?: string;
  statut?: StatutCompte;
  role?: RoleUtilisateur;
  ville?: string;
  page?: number;
  taille?: number;
}

export interface SignalementResponse {
  id: number;
  annonceId: number;
  typeBienAnnonce: string;   // ← backend: typeBienAnnonce
  villeAnnonce: string;       // ← backend: villeAnnonce
  motif: string;
  details: string;            // ← backend: details
  statut: string;             // ← backend: statut (string, pas enum)
  auteurEmail: string;        // ← backend: auteurEmail
  dateSignalement: string;
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
  libelle: string;
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
  search?: string;
}


export interface LocalisationResponse {
  id: number;
  ville: string;
  quartier?: string;  // optionnel selon votre entity
  active: boolean;
  dateCreation?: string;
}

export interface TypeBienResponse {
  id: number;
  libelle: string;
  estActif: boolean;   // ← backend: estActif (pas "actif" ou "active")
  dateCreation?: string;
}