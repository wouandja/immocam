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
