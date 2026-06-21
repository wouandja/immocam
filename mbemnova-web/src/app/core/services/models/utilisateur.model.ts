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
  favoriId: number;
  annonceId: number;
  typeBien: string;
  ville: string;
  quartier: string;
  prix: number;
  prixFormate: string;
  photoUrl?: string;
  /** Nom du champ aligné sur FavoriResponse.java (statutAnnonce), pas "statut" */
  statutAnnonce: string;
  dateAjout: string;
}
