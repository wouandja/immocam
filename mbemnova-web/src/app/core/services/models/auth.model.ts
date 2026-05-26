import { RoleUtilisateur } from './enums.model';

// ==================== Requêtes ====================

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
  typeCode?: string; // EMAIL_VALIDATION ou REINITIALISATION_MDP
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

// ==================== Réponses ====================

/** Réponse d'authentification directe du backend */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // Toujours "Bearer"
  userId: number;
  email: string;
  prenom: string;
  nom: string;
  role: RoleUtilisateur;
}

/** Profil utilisateur converti depuis AuthResponse */
export interface UtilisateurProfil {
  id: number;
  prenom: string;
  nom: string;
  email: string;
   telephone?: string;
  telephoneMasque?: string;   // ← backend retourne telephoneMasque
  ville?: string;
  role: RoleUtilisateur;
  emailVerifie?: boolean;
  statut?: string;
  dateInscription?: string;
  dernierLogin?: string;
  nombreAnnoncesActives?: number;
}
