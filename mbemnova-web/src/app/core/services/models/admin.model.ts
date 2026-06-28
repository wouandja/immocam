import { RoleUtilisateur, StatutCompte } from './enums.model';

// ─────────────────────────────────────────────
// Valeurs EXACTES de l'enum Java StatutSignalement
// ─────────────────────────────────────────────
export type StatutSignalementType =
  | 'EN_ATTENTE'
  | 'IGNORE'
  | 'TRAITE_INFO'
  | 'TRAITE_PAUSE'
  | 'TRAITE_SUPPRESSION'
  | 'TRAITE_SUSPENSION'
  | 'TRAITE_BANNISSEMENT';

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

export interface AdminUtilisateurResponse {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephoneMasque: string;
  ville: string;
  role: string;
  statut: string;
  dateInscription: string;
  dernierLogin: string;
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

  // Annonce
  typeBienAnnonce: string;
  villeAnnonce: string;
  quartierAnnonce?: string;
  prixAnnonce?: number;
  statutAnnonce?: string;
  proprietaireId?: number;
  proprietaireNom?: string;
  proprietaireEmail?: string;
  proprietaireTelephone?: string;

  // Signalement
  motif: string;
  details?: string;
  statut: StatutSignalementType;  // ← typé strictement

  // Auteur du signalement
  auteurId?: number;
  auteurEmail?: string;
  auteurPrenom?: string;
  auteurNom?: string;
  auteurVille?: string;
  auteurTelephone?: string;

  dateSignalement: string;
}

export interface TraiterSignalementRequest {
  statut: StatutSignalementType;  // ← plus d'import StatutSignalement externe
  note?: string;
}

export interface ConfigSystemeResponse {
  dureeVieAnnonce: number;
  joursRappelExpiration: number;
  joursSuppressionDefinitive: number;
  maxPhotosParAnnonce: number;
  maxAnnoncesParProprietaire: number;
  messageWhatsappDefaut: string;
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
  quartier?: string;
  typeBienId?: number;
  statut?: string;
  proprietaireId?: number;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  size?: number;
  recherche?: string;
}

export interface LocalisationResponse {
  id: number;
  ville: string;
  quartier?: string;
  active: boolean;
  dateCreation?: string;
}

export interface TypeBienResponse {
  id: number;
  libelle: string;
  estActif: boolean;
  dateCreation?: string;
}