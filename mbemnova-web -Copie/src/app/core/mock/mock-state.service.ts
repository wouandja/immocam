// =============================================================================
// IMMOCAM — Service d'état mock (singleton)
// Simule un vrai backend avec état persistant en mémoire
// =============================================================================
import { Injectable, signal } from '@angular/core';
import { generateAnnonces, MOCK_USER, MOCK_ADMIN_USER, MOCK_AUTH_RESPONSE } from './mock-data.factory';

export interface MockUser {
  id: number;
  prenom: string;
  nom: string;
  nomComplet: string;
  email: string;
  telephone: string;
  ville: string;
  role: 'UTILISATEUR' | 'ADMINISTRATEUR';
  statut: 'ACTIF' | 'SUSPENDU' | 'BANNI';
  emailVerifie: boolean;
  dateInscription: string;
  nombreAnnoncesActives: number;
  nombreFavoris: number;
}

export interface MockSession {
  user: MockUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingEmail: string | null;
  otpCode: string | null;
  otpExpiry: number | null;
  loginAttempts: number;
  blockedUntil: number | null;
  resendCount: number;
  lastResendTime: number | null;
}

@Injectable({ providedIn: 'root' })
export class MockStateService {
  // Annonces en mémoire (modifiables par les actions)
  private _annonces = generateAnnonces(50);

  // Session utilisateur courante
  private _session: MockSession = {
    user: null,
    accessToken: null,
    refreshToken: null,
    pendingEmail: null,
    otpCode: null,
    otpExpiry: null,
    loginAttempts: 0,
    blockedUntil: null,
    resendCount: 0,
    lastResendTime: null,
  };

  // Favoris par utilisateur
  private _favoris: Set<number> = new Set([2, 5, 8]);

  // Commentaires postés dans la session
  private _newComments: any[] = [];

  // Signalements traités
  private _treatedSignalements: Set<number> = new Set();

  // ─── Annonces ─────────────────────────────────────────────────────────────

  getAnnonces(): any[] { return this._annonces; }

  getAnnonce(id: number): any | null {
    return this._annonces.find(a => a.id === id) ?? null;
  }

  addAnnonce(annonce: any): void {
    this._annonces.unshift({ ...annonce, id: Date.now() });
  }

  updateAnnonce(id: number, changes: any): void {
    const idx = this._annonces.findIndex(a => a.id === id);
    if (idx !== -1) this._annonces[idx] = { ...this._annonces[idx], ...changes };
  }

  deleteAnnonce(id: number): void {
    this.updateAnnonce(id, { statut: 'SUPPRIMEE' });
  }

  getMesAnnonces(): any[] {
    // Simule les 5 premières annonces comme appartenant à l'utilisateur connecté
    return this._annonces.slice(0, 5).map(a => ({
      ...a,
      proprietairePrenom: this._session.user?.prenom ?? 'Propriétaire',
    }));
  }

  getActiveCount(): number {
    return this.getMesAnnonces().filter(a => a.statut === 'ACTIVE').length;
  }

  checkDuplicate(typeBienId: number, localisationId: number, prix: number): boolean {
    return this.getMesAnnonces().some(
      a => a.typeBienId === typeBienId &&
           a.localisationId === localisationId &&
           Math.abs(a.prix - prix) < 10000 &&
           a.statut === 'ACTIVE'
    );
  }

  // ─── Session / Auth ───────────────────────────────────────────────────────

  getSession(): MockSession { return this._session; }

  isBlocked(): boolean {
    if (!this._session.blockedUntil) return false;
    return Date.now() < this._session.blockedUntil;
  }

  getBlockedMinutes(): number {
    if (!this._session.blockedUntil) return 0;
    return Math.ceil((this._session.blockedUntil - Date.now()) / 60000);
  }

  recordLoginAttempt(): void {
    this._session.loginAttempts++;
    // SC-09.2: Blocage après 5 tentatives pendant 30 min
    if (this._session.loginAttempts >= 5) {
      this._session.blockedUntil = Date.now() + 30 * 60 * 1000;
      this._session.loginAttempts = 0;
    }
  }

  loginSuccess(user: MockUser, tokens: { access: string; refresh: string }): void {
    this._session.user = user;
    this._session.accessToken = tokens.access;
    this._session.refreshToken = tokens.refresh;
    this._session.loginAttempts = 0;
    this._session.blockedUntil = null;
  }

  logout(): void {
    this._session.user = null;
    this._session.accessToken = null;
    this._session.refreshToken = null;
  }

  // ─── OTP ──────────────────────────────────────────────────────────────────

  generateOTP(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this._session.pendingEmail = email;
    this._session.otpCode = code;
    this._session.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    console.info(`[MOCK OTP] Code pour ${email}: ${code}`);
    return code;
  }

  verifyOTP(email: string, code: string): 'ok' | 'expired' | 'invalid' {
    if (this._session.pendingEmail !== email) return 'invalid';
    if (!this._session.otpExpiry || Date.now() > this._session.otpExpiry) return 'expired';
    if (this._session.otpCode !== code && code !== '123456') return 'invalid'; // 123456 = code universel mock
    return 'ok';
  }

  canResend(): boolean {
    if (this._session.resendCount >= 3) return false;
    if (!this._session.lastResendTime) return true;
    return Date.now() - this._session.lastResendTime > 60000; // 1 min entre renvois
  }

  recordResend(): void {
    this._session.resendCount++;
    this._session.lastResendTime = Date.now();
    // Renouveler l'OTP
    if (this._session.pendingEmail) {
      this.generateOTP(this._session.pendingEmail);
    }
  }

  // ─── Favoris ──────────────────────────────────────────────────────────────

  getFavoris(): number[] { return [...this._favoris]; }
  isFavori(id: number): boolean { return this._favoris.has(id); }
  addFavori(id: number): void { this._favoris.add(id); }
  removeFavori(id: number): void { this._favoris.delete(id); }

  getFavorisData(): any[] {
    return this._annonces
      .filter(a => this._favoris.has(a.id))
      .map(a => ({
        id: a.id * 10,
        annonceId: a.id,
        typeBien: a.typeBien,
        ville: a.ville,
        quartier: a.quartier,
        prix: a.prix,
        prixFormate: a.prixFormate,
        photoPrincipaleThumb: a.photoPrincipaleThumb,
        statut: a.statut,
        dateAjout: new Date().toISOString(),
      }));
  }

  // ─── Commentaires ─────────────────────────────────────────────────────────

  addComment(annonceId: number, contenu: string): any {
    const comment = {
      id: Date.now(),
      auteurPrenom: this._session.user?.prenom ?? 'Anonyme',
      contenu,
      dateCreation: new Date().toISOString(),
      estProprietaire: false,
      estMien: true,
    };
    this._newComments.push({ annonceId, comment });
    const annonce = this.getAnnonce(annonceId);
    if (annonce) {
      annonce.commentaires = [...(annonce.commentaires ?? []), comment];
      annonce.nombreCommentaires = (annonce.nombreCommentaires ?? 0) + 1;
    }
    return comment;
  }

  deleteComment(commentId: number): void {
    this._annonces.forEach(a => {
      if (a.commentaires) {
        a.commentaires = a.commentaires.filter((c: any) => c.id !== commentId);
        a.nombreCommentaires = a.commentaires.length;
      }
    });
  }
}
