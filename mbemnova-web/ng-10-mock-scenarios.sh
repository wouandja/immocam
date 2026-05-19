#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 10 : MOCK SCENARIOS ENRICHIS
# =============================================================================
# Rôle     : Enrichit le système mock avec :
#            - Tous les scénarios d'erreur (compte bloqué, OTP expiré, etc.)
#            - Service mock complet avec état persistant en mémoire
#            - Données mock réalistes (photos picsum, descriptions camerounaises)
#            - Scénario dupplication d'annonce
#            - Scénario limite annonces dépassée
#            - Mock admin avec graphiques enrichis
#            - MockStateService : gestion d'état cross-composants
#            - DevTools overlay (indicateur mock/api visible)
#
# Exécuter : bash ../ng-10-mock-scenarios.sh (depuis racine Angular)
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || { echo "Lancez depuis la racine Angular"; exit 1; }
SECTION "SCRIPT 10 — MOCK SCENARIOS ENRICHIS"

MOCK="src/app/core/mock"
mkdir -p "$MOCK"

# =============================================================================
# 1. MOCK STATE SERVICE — état persistant en mémoire
# =============================================================================
SECTION "1/4 — MockStateService (état en mémoire)"

cat > "$MOCK/mock-state.service.ts" << 'EOF'
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
EOF
OK "MockStateService"

# =============================================================================
# 2. MOCK INTERCEPTOR V2 — avec état et scénarios d'erreur
# =============================================================================
SECTION "2/4 — Mock Interceptor V2 (état + erreurs)"

cat > "$MOCK/mock.interceptor.ts" << 'EOF'
// =============================================================================
// IMMOCAM — Mock Interceptor V2
// Intercept HTTP → données simulées avec état persistant + scénarios erreur
// Activé si environment.useMock === true
// =============================================================================

import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError, delay } from 'rxjs';
import { environment } from '@environments/environment';
import { MockStateService } from './mock-state.service';
import {
  MOCK_AUTH_RESPONSE, MOCK_ADMIN_USER, MOCK_USER,
  MOCK_LOCALISATIONS, MOCK_TYPE_BIENS, MOCK_VILLES,
} from './mock-data.factory';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ok(data: any, message = 'Succès') {
  return new HttpResponse({ status: 200, body: { success: true, message, data } });
}

function err(status: number, message: string, code?: string) {
  return new HttpErrorResponse({
    status,
    error: { success: false, message, code },
    statusText: message,
  });
}

function page<T>(items: T[], p = 0, size = 12) {
  const start = p * size;
  const content = items.slice(start, start + size);
  return { content, page: p, size, totalElements: items.length,
    totalPages: Math.ceil(items.length / size), first: p === 0,
    last: start + size >= items.length, empty: content.length === 0,
    numberOfElements: content.length };
}

function params(url: string) {
  return new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
}

// ─── Intercepteur principal ───────────────────────────────────────────────────

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock) return next(req);

  const state  = inject(MockStateService);
  const url    = req.url.replace(environment.apiUrl, '');
  const method = req.method;
  const qp     = params(req.url);
  const body   = req.body as any ?? {};
  const d      = environment.mockDelay ?? 600;

  let response: HttpResponse<any> | null = null;
  let errorResponse: HttpErrorResponse | null = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════════

  // POST /auth/register
  if (url.includes('/auth/register') && method === 'POST') {
    // Simuler email déjà existant
    if (body.email?.includes('exist')) {
      errorResponse = err(409, 'Un compte avec cet email existe déjà');
    } else {
      state.generateOTP(body.email);
      response = ok({ email: body.email }, 'Compte créé. Vérifiez votre email.');
    }
  }

  // POST /auth/verify-email
  else if (url.includes('/auth/verify-email') && method === 'POST') {
    const result = state.verifyOTP(body.email, body.code);
    if (result === 'expired') {
      errorResponse = err(400, 'Code expiré. Cliquez pour en recevoir un nouveau.', 'OTP_EXPIRED');
    } else if (result === 'invalid') {
      errorResponse = err(400, 'Code incorrect. Vérifiez votre email.', 'OTP_INVALID');
    } else {
      const user = body.email?.includes('admin') ? MOCK_ADMIN_USER : MOCK_USER;
      state.loginSuccess(user as any, {
        access: MOCK_AUTH_RESPONSE.accessToken,
        refresh: MOCK_AUTH_RESPONSE.refreshToken,
      });
      response = ok({ ...MOCK_AUTH_RESPONSE, utilisateur: user });
    }
  }

  // POST /auth/resend-code
  else if (url.includes('/auth/resend-code') && method === 'POST') {
    if (!state.canResend()) {
      errorResponse = err(429, 'Limite d\'envois atteinte. Contactez le support.', 'RESEND_LIMIT');
    } else {
      state.recordResend();
      response = ok(null, 'Code renvoyé avec succès');
    }
  }

  // POST /auth/login
  else if (url.includes('/auth/login') && method === 'POST') {
    // SC-09.2: Compte bloqué
    if (state.isBlocked()) {
      const mins = state.getBlockedMinutes();
      errorResponse = err(423, `Compte temporairement bloqué. Réessayez dans ${mins} minute(s).`, 'ACCOUNT_LOCKED');
    }
    // Mauvais mot de passe (simulé si password = 'wrong')
    else if (body.motDePasse === 'wrong') {
      state.recordLoginAttempt();
      const sess = state.getSession();
      const remaining = 5 - sess.loginAttempts;
      errorResponse = err(401,
        remaining > 0
          ? `Identifiants incorrects. ${remaining} tentative(s) restante(s) avant blocage.`
          : 'Compte bloqué 30 minutes.',
        'INVALID_CREDENTIALS'
      );
    }
    // Compte non vérifié (simulé si email contient 'unverified')
    else if (body.email?.includes('unverified')) {
      errorResponse = err(403, 'Email non vérifié. Vérifiez votre boîte mail.', 'EMAIL_NOT_VERIFIED');
    }
    // Compte suspendu (simulé si email contient 'suspended')
    else if (body.email?.includes('suspended')) {
      errorResponse = err(403, 'Votre compte a été suspendu. Contactez le support.', 'ACCOUNT_SUSPENDED');
    }
    // Connexion réussie
    else {
      const user = body.email?.includes('admin') ? MOCK_ADMIN_USER : MOCK_USER;
      state.loginSuccess(user as any, {
        access: MOCK_AUTH_RESPONSE.accessToken,
        refresh: MOCK_AUTH_RESPONSE.refreshToken,
      });
      response = ok({ ...MOCK_AUTH_RESPONSE, utilisateur: user });
    }
  }

  // POST /auth/refresh
  else if (url.includes('/auth/refresh') && method === 'POST') {
    if (body.refreshToken === 'invalid_token') {
      errorResponse = err(401, 'Session expirée. Veuillez vous reconnecter.', 'TOKEN_EXPIRED');
    } else {
      response = ok(MOCK_AUTH_RESPONSE);
    }
  }

  // POST /auth/logout
  else if (url.includes('/auth/logout') && method === 'POST') {
    state.logout();
    response = ok(null, 'Déconnexion réussie');
  }

  // POST /auth/forgot-password
  else if (url.includes('/auth/forgot-password') && method === 'POST') {
    if (!body.email?.includes('@')) {
      errorResponse = err(400, 'Format email invalide');
    } else {
      // Simuler email introuvable
      if (body.email?.includes('notfound')) {
        // On répond quand même OK (sécurité : ne pas révéler si l'email existe)
      }
      response = ok(null, 'Email de réinitialisation envoyé si le compte existe');
    }
  }

  // POST /auth/reset-password
  else if (url.includes('/auth/reset-password') && method === 'POST') {
    if (body.token === 'expired_token') {
      errorResponse = err(400, 'Lien expiré. Demandez un nouveau lien.', 'TOKEN_EXPIRED');
    } else {
      response = ok(null, 'Mot de passe modifié avec succès');
    }
  }

  // GET /auth/me
  else if ((url.includes('/auth/me') || (url.includes('/utilisateurs/me') && method === 'GET')) && method === 'GET') {
    const sess = state.getSession();
    response = ok(sess.user ?? MOCK_USER);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANNONCES
  // ═══════════════════════════════════════════════════════════════════════════

  // Actions PATCH (ordre important : avant la route générale)
  else if (url.match(/\/annonces\/(\d+)\/pause$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'EN_PAUSE' });
    response = ok(null, 'Annonce mise en pause');
  }
  else if (url.match(/\/annonces\/(\d+)\/reactiver$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'ACTIVE' });
    response = ok(null, 'Annonce réactivée');
  }
  else if (url.match(/\/annonces\/(\d+)\/renouveler$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    const newExp = new Date(Date.now() + 30 * 86400000).toISOString();
    state.updateAnnonce(id, { dateExpiration: newExp, statut: 'ACTIVE' });
    response = ok(null, 'Annonce renouvelée pour 30 jours');
  }
  else if (url.match(/\/annonces\/(\d+)\/archiver$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'ARCHIVEE' });
    response = ok(null, 'Annonce archivée');
  }

  // Photos
  else if (url.match(/\/annonces\/(\d+)\/photos$/) && method === 'POST') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    const photos = [{ id: Date.now(), url: `https://picsum.photos/seed/new${id}/800/500`,
      urlThumb: `https://picsum.photos/seed/new${id}/400/250`, ordre: 0, principale: true }];
    state.updateAnnonce(id, { photos, hasPhotos: true, photoPrincipale: photos[0].url, photoPrincipaleThumb: photos[0].urlThumb });
    response = ok(photos, 'Photos uploadées');
  }
  else if (url.match(/\/annonces\/\d+\/photos\/\d+$/) && method === 'DELETE') {
    response = ok(null, 'Photo supprimée');
  }

  // Mes annonces
  else if (url.includes('/annonces/mes-annonces') && method === 'GET') {
    const p = parseInt(qp.get('page') ?? '0');
    const s = parseInt(qp.get('size') ?? '12');
    response = ok(page(state.getMesAnnonces(), p, s));
  }

  // Dashboard stats
  else if (url.includes('/annonces/dashboard-stats') && method === 'GET') {
    const mes = state.getMesAnnonces();
    response = ok({
      nombreAnnoncesActives: mes.filter(a => a.statut === 'ACTIVE').length,
      nombreAnnoncesTotal: mes.length,
      nombreContactsTotal: mes.reduce((s, a) => s + (a.nombreContacts ?? 0), 0),
      nombreFavorisTotal: state.getFavoris().length,
      nombreVuesTotal: mes.reduce((s, a) => s + (a.nombreVues ?? 0), 0),
      annoncesExpirantBientot: mes.filter(a => {
        const exp = new Date(a.dateExpiration);
        const diff = (exp.getTime() - Date.now()) / 86400000;
        return diff <= 5 && diff >= 0 && a.statut === 'ACTIVE';
      }),
    });
  }

  // DELETE annonce
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'DELETE') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.deleteAnnonce(id);
    response = ok(null, 'Annonce supprimée');
  }

  // GET annonce detail
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'GET') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    const annonce = state.getAnnonce(id);
    if (!annonce) {
      errorResponse = err(404, 'Annonce introuvable ou supprimée');
    } else {
      // Incrémenter les vues
      state.updateAnnonce(id, { nombreVues: (annonce.nombreVues ?? 0) + 1 });
      const isFav = state.isFavori(id);
      response = ok({ ...state.getAnnonce(id), isFavori: isFav });
    }
  }

  // PUT /annonces/:id (modifier)
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'PUT') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, body);
    response = ok(state.getAnnonce(id), 'Annonce modifiée');
  }

  // GET /annonces (liste publique avec filtres)
  else if (url.startsWith('/annonces') && !url.includes('/mes-') && !url.includes('/dashboard') && method === 'GET') {
    let all = state.getAnnonces().filter(a => a.statut === 'ACTIVE');

    // Filtres
    const ville    = qp.get('ville');
    const typeId   = qp.get('typeBienId');
    const prixMin  = qp.get('prixMin');
    const prixMax  = qp.get('prixMax');
    const motCle   = qp.get('motCle');

    if (ville)   all = all.filter(a => a.ville.toLowerCase() === ville.toLowerCase());
    if (typeId)  all = all.filter(a => a.typeBienId === parseInt(typeId));
    if (prixMin) all = all.filter(a => a.prix >= parseInt(prixMin));
    if (prixMax) all = all.filter(a => a.prix <= parseInt(prixMax));
    if (motCle)  all = all.filter(a =>
      a.description.toLowerCase().includes(motCle.toLowerCase()) ||
      a.quartier.toLowerCase().includes(motCle.toLowerCase()) ||
      a.typeBien.toLowerCase().includes(motCle.toLowerCase())
    );

    // Marquer les favoris si connecté
    const sess = state.getSession();
    if (sess.user) {
      all = all.map(a => ({ ...a, isFavori: state.isFavori(a.id) }));
    }

    const p = parseInt(qp.get('page') ?? '0');
    const s = parseInt(qp.get('size') ?? '12');
    response = ok(page(all, p, s));
  }

  // POST /annonces (publier)
  else if (url === '/annonces' && method === 'POST') {
    // SC-09.1: Vérifier limite annonces actives
    const activeCount = state.getActiveCount();
    if (activeCount >= 5) {
      errorResponse = err(422,
        'Vous avez atteint votre limite de 5 annonces actives. Archivez ou supprimez une annonce existante.',
        'MAX_ANNONCES_REACHED'
      );
    }
    // SC-09.1: Vérifier doublon
    else if (state.checkDuplicate(body.typeBienId, body.localisationId, body.prix)) {
      // On laisse passer mais on avertit (le frontend affiche une alerte non bloquante)
      const loc = MOCK_LOCALISATIONS.find(l => l.id === body.localisationId);
      const type = MOCK_TYPE_BIENS.find(t => t.id === body.typeBienId);
      const newAnnonce = {
        id: Date.now(),
        typeBien: type?.nom ?? 'Bien',
        typeBienId: body.typeBienId,
        ville: loc?.ville ?? 'Douala',
        quartier: loc?.quartier ?? 'Centre',
        prix: body.prix,
        prixFormate: new Intl.NumberFormat('fr-CM').format(body.prix) + ' FCFA',
        statut: 'ACTIVE',
        hasPhotos: false,
        datePublication: new Date().toISOString(),
        dateExpiration: new Date(Date.now() + 30 * 86400000).toISOString(),
        nombreVues: 0, nombreCommentaires: 0, nombreContacts: 0,
        photos: [], commentaires: [],
        proprietairePrenom: state.getSession().user?.prenom ?? 'Propriétaire',
        description: body.description,
        localisationId: body.localisationId,
        isFavori: false,
        photoPrincipale: null, photoPrincipaleThumb: null,
        _duplicateWarning: true,
      };
      state.addAnnonce(newAnnonce);
      response = ok(newAnnonce, 'Annonce publiée (annonce similaire détectée)');
    } else {
      const loc = MOCK_LOCALISATIONS.find(l => l.id === body.localisationId);
      const type = MOCK_TYPE_BIENS.find(t => t.id === body.typeBienId);
      const newAnnonce = {
        id: Date.now(),
        typeBien: type?.nom ?? 'Bien',
        typeBienId: body.typeBienId,
        ville: loc?.ville ?? 'Douala',
        quartier: loc?.quartier ?? 'Centre',
        prix: body.prix,
        prixFormate: new Intl.NumberFormat('fr-CM').format(body.prix) + ' FCFA',
        statut: 'ACTIVE',
        hasPhotos: false,
        datePublication: new Date().toISOString(),
        dateExpiration: new Date(Date.now() + 30 * 86400000).toISOString(),
        nombreVues: 0, nombreCommentaires: 0, nombreContacts: 0,
        photos: [], commentaires: [],
        proprietairePrenom: state.getSession().user?.prenom ?? 'Propriétaire',
        description: body.description,
        localisationId: body.localisationId,
        isFavori: false,
        photoPrincipale: null, photoPrincipaleThumb: null,
      };
      state.addAnnonce(newAnnonce);
      response = ok(newAnnonce, 'Annonce publiée avec succès');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAVORIS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.match(/\/favoris\/check\/(\d+)/) && method === 'GET') {
    const id = parseInt(url.match(/\/favoris\/check\/(\d+)/)![1]);
    response = ok({ isFavori: state.isFavori(id) });
  }
  else if (url === '/favoris' && method === 'GET') {
    response = ok(state.getFavorisData());
  }
  else if (url === '/favoris' && method === 'POST') {
    state.addFavori(body.annonceId);
    response = ok(null, 'Ajouté aux favoris');
  }
  else if (url.match(/\/favoris\/(\d+)$/) && method === 'DELETE') {
    const id = parseInt(url.match(/\/favoris\/(\d+)/)![1]);
    state.removeFavori(id);
    response = ok(null, 'Retiré des favoris');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENTAIRES
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url === '/commentaires' && method === 'POST') {
    // Validation contenu
    if (!body.contenu || body.contenu.trim().length < 5) {
      errorResponse = err(400, 'Le commentaire doit contenir au moins 5 caractères');
    } else if (body.contenu.length > 500) {
      errorResponse = err(400, 'Le commentaire ne peut pas dépasser 500 caractères');
    } else {
      const comment = state.addComment(body.annonceId, body.contenu.trim());
      response = ok(comment, 'Commentaire publié');
    }
  }
  else if (url.match(/\/commentaires\/(\d+)\/reponse$/) && method === 'POST') {
    const id = parseInt(url.match(/\/commentaires\/(\d+)/)![1]);
    response = ok({
      id: Date.now(), contenu: body.contenu,
      dateCreation: new Date().toISOString(),
    });
  }
  else if (url.match(/\/commentaires\/(\d+)$/) && method === 'DELETE') {
    const id = parseInt(url.match(/\/commentaires\/(\d+)/)![1]);
    state.deleteComment(id);
    response = ok(null, 'Commentaire supprimé');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url === '/contacts' && method === 'POST') {
    const annonce = state.getAnnonce(body.annonceId);
    if (!annonce) {
      errorResponse = err(404, 'Annonce introuvable');
    } else {
      state.updateAnnonce(body.annonceId, {
        nombreContacts: (annonce.nombreContacts ?? 0) + 1
      });
      const phone = '237691877527';
      const msg = encodeURIComponent(
        `Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : ` +
        `${annonce.typeBien} à ${annonce.quartier}, ${annonce.ville} — ` +
        `${annonce.prixFormate}. Est-il toujours disponible ?`
      );
      response = ok({ whatsappUrl: `https://wa.me/${phone}?text=${msg}` });
    }
  }
  else if (url.includes('/contacts/mes-contacts')) {
    const mes = state.getMesAnnonces().slice(0, 3).flatMap((a, i) => [
      { id: i * 10 + 1, utilisateurTelephone: `+2376912345${i}7`, utilisateurPrenom: ['Jean','Marie','Paul'][i % 3],
        annonceId: a.id, annonceTitre: `${a.typeBien} à ${a.quartier}`,
        dateContact: new Date(Date.now() - i * 3600000).toISOString() },
    ]);
    response = ok(page(mes, 0, 20));
  }
  else if (url.includes('/contacts/annonce/')) {
    const id = parseInt(url.split('/').pop() ?? '0');
    response = ok([
      { id: 1, utilisateurTelephone: '+237691234567', utilisateurPrenom: 'Jean',
        annonceId: id, annonceTitre: 'Annonce', dateContact: new Date().toISOString() },
      { id: 2, utilisateurTelephone: '+237698765432', utilisateurPrenom: 'Marie',
        annonceId: id, annonceTitre: 'Annonce', dateContact: new Date(Date.now() - 86400000).toISOString() },
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNALEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url === '/signalements' && method === 'POST') {
    if (!body.motif) {
      errorResponse = err(400, 'Le motif est obligatoire');
    } else {
      response = ok(null, 'Signalement enregistré. Notre équipe va examiner cette annonce.');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCALISATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/localisations/villes')) {
    response = ok(MOCK_VILLES);
  }
  else if (url.includes('/localisations/quartiers')) {
    const ville = qp.get('ville') ?? 'Douala';
    const quartiers = MOCK_LOCALISATIONS.filter(
      l => l.ville.toLowerCase() === ville.toLowerCase()
    );
    response = ok(quartiers);
  }
  else if (url.includes('/localisations') && method === 'GET') {
    response = ok(MOCK_LOCALISATIONS);
  }
  else if (url.includes('/localisations') && method === 'POST') {
    response = ok({ id: Date.now(), ...body, active: true }, 'Localisation ajoutée');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE BIENS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/typebien') && method === 'GET') {
    response = ok(MOCK_TYPE_BIENS);
  }
  else if (url.includes('/typebien') && method === 'POST') {
    response = ok({ id: Date.now(), ...body, active: true }, 'Type de bien ajouté');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILISATEUR (profil)
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/utilisateurs/me') && method === 'PUT') {
    const sess = state.getSession();
    const updated = { ...(sess.user ?? MOCK_USER), ...body };
    response = ok(updated, 'Profil mis à jour');
  }
  else if (url.includes('/utilisateurs/me/password') && method === 'PUT') {
    if (body.ancienMotDePasse === 'wrongpassword') {
      errorResponse = err(400, 'Mot de passe actuel incorrect');
    } else {
      response = ok(null, 'Mot de passe modifié avec succès');
    }
  }
  else if (url.includes('/utilisateurs/me') && method === 'DELETE') {
    state.logout();
    response = ok(null, 'Compte supprimé. Vos données seront anonymisées sous 30 jours.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/admin/dashboard')) {
    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().split('T')[0],
        valeur: Math.floor(Math.random() * 150) + 30,
      };
    });
    response = ok({
      visitesTotales: 15840, visitesTotales7j: 2340, visitesTotales30j: 9200,
      annoncesActives: state.getAnnonces().filter(a => a.statut === 'ACTIVE').length,
      nouvellesAnnonces: 8, nouvellesAnnonces7j: 27,
      nouveauxInscrits: 5, nouveauxInscrits7j: 21,
      contactsWhatsapp: 89, contactsWhatsapp7j: 312,
      commentairesPublies: 15, commentairesPublies7j: 58,
      signalEmentsNonTraites: 3,
      evolutionVisites: days7,
      evolutionContacts: days7.map(d => ({ ...d, valeur: Math.floor(d.valeur * 0.35) })),
      evolutionPublications: days7.map(d => ({ ...d, valeur: Math.floor(d.valeur * 0.12) })),
      villesActives: [
        { ville: 'Douala', nombreAnnonces: 31 },
        { ville: 'Yaoundé', nombreAnnonces: 22 },
        { ville: 'Bafoussam', nombreAnnonces: 8 },
        { ville: 'Kribi', nombreAnnonces: 5 },
      ],
      typesBiensPopulaires: [
        { typeBien: 'Appartement', nombreAnnonces: 28 },
        { typeBien: 'Studio', nombreAnnonces: 18 },
        { typeBien: 'Maison', nombreAnnonces: 10 },
        { typeBien: 'Bureau', nombreAnnonces: 6 },
      ],
    });
  }
  else if (url.includes('/admin/annonces') && method === 'GET') {
    let all = state.getAnnonces();
    const statut = qp.get('statut');
    const ville  = qp.get('ville');
    if (statut) all = all.filter(a => a.statut === statut);
    if (ville)  all = all.filter(a => a.ville === ville);
    const p = parseInt(qp.get('page') ?? '0');
    response = ok(page(all, p, 20));
  }
  else if (url.match(/\/admin\/annonces\/\d+$/) && method === 'DELETE') {
    const id = parseInt(url.split('/').pop() ?? '0');
    state.deleteAnnonce(id);
    response = ok(null, 'Annonce supprimée par administration');
  }
  else if (url.match(/\/admin\/annonces\/\d+\/pause$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/admin\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'EN_PAUSE' });
    response = ok(null, 'Annonce mise en pause par administration');
  }
  else if (url.includes('/admin/utilisateurs') && method === 'GET') {
    const mockUsers = Array.from({ length: 30 }, (_, i) => ({
      id: i + 2, prenom: ['Aimé','Marie','Jean','Grace','Paul','Bertrand'][i % 6],
      nom: ['Talla','Fotso','Ngono','Essomba','Biya','Kamga'][i % 6],
      nomComplet: `Utilisateur ${i + 2}`,
      email: `user${i + 2}@immocam.cm`,
      telephone: `+2376${String(i).padStart(8, '0')}`,
      ville: MOCK_VILLES[i % MOCK_VILLES.length],
      role: 'UTILISATEUR',
      statut: i % 8 === 0 ? 'SUSPENDU' : i % 15 === 0 ? 'BANNI' : 'ACTIF',
      emailVerifie: i % 5 !== 0,
      dateInscription: new Date(Date.now() - i * 86400000 * 4).toISOString(),
      nombreAnnonces: Math.floor(Math.random() * 5),
      nombreConnexions: Math.floor(Math.random() * 80) + 5,
      derniereConnexion: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    }));
    const recherche = qp.get('recherche') ?? '';
    const filtered = recherche
      ? mockUsers.filter(u => u.nomComplet.toLowerCase().includes(recherche.toLowerCase()) ||
          u.email.toLowerCase().includes(recherche.toLowerCase()))
      : mockUsers;
    const p = parseInt(qp.get('page') ?? '0');
    response = ok(page(filtered, p, 20));
  }
  else if (url.match(/\/admin\/utilisateurs\/\d+\/(suspendre|bannir|activer)$/)) {
    response = ok(null, 'Action effectuée sur l\'utilisateur');
  }
  else if (url.includes('/admin/signalements') && method === 'GET') {
    const signalements = [
      { id: 1, annonceId: 3, annonceTitre: 'Appartement Akwa — Douala',
        auteurPrenom: 'Jean', auteurEmail: 'jean@test.cm',
        motif: 'ANNONCE_FRAUDULEUSE', description: 'Le prix affiché ne correspond pas à la réalité',
        statut: 'EN_ATTENTE', dateSignalement: new Date().toISOString() },
      { id: 2, annonceId: 7, annonceTitre: 'Studio Bastos — Yaoundé',
        auteurPrenom: 'Marie', auteurEmail: 'marie@test.cm',
        motif: 'PRIX_INCORRECT', description: null,
        statut: 'EN_ATTENTE', dateSignalement: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, annonceId: 12, annonceTitre: 'Maison Bonanjo — Douala',
        auteurPrenom: 'Paul', auteurEmail: 'paul@test.cm',
        motif: 'BIEN_DEJA_LOUE', description: 'Le bien est loué depuis 2 mois',
        statut: 'EN_ATTENTE', dateSignalement: new Date(Date.now() - 7200000).toISOString() },
      { id: 4, annonceId: 5, annonceTitre: 'Bureau Centre-ville — Yaoundé',
        auteurPrenom: 'Grace', auteurEmail: 'grace@test.cm',
        motif: 'PHOTOS_NON_CONFORMES', description: null,
        statut: 'TRAITE', dateSignalement: new Date(Date.now() - 86400000).toISOString(),
        dateTraitement: new Date(Date.now() - 43200000).toISOString() },
    ];
    const statutFilter = qp.get('statut');
    const filtered = statutFilter ? signalements.filter(s => s.statut === statutFilter) : signalements;
    const p = parseInt(qp.get('page') ?? '0');
    response = ok(page(filtered, p, 20));
  }
  else if (url.match(/\/admin\/signalements\/\d+$/) && method === 'PUT') {
    response = ok(null, 'Signalement traité');
  }
  else if (url.includes('/admin/commentaires') && method === 'GET') {
    response = ok(page([], 0));
  }
  else if (url.match(/\/admin\/commentaires\/\d+$/) && method === 'DELETE') {
    response = ok(null, 'Commentaire supprimé');
  }
  else if (url.includes('/admin/config') && method === 'GET') {
    response = ok({
      dureeVieAnnonce: 30, joursRappelExpiration: 5, joursSuppressionDefinitive: 7,
      maxPhotosParAnnonce: 4, maxAnnoncesParProprietaire: 5,
      messageWhatsappDefaut: 'Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : {type} à {quartier}, {ville} — {prix} FCFA. Est-il toujours disponible ?',
      rateLimit: 100, schedulerEnabled: true,
    });
  }
  else if (url.includes('/admin/config') && method === 'PUT') {
    response = ok(body, 'Configuration mise à jour');
  }
  else if (url.includes('/admin/exports/')) {
    const type = url.includes('utilisateurs') ? 'utilisateurs' : 'annonces';
    const csvContent = type === 'annonces'
      ? 'id,type,ville,quartier,prix,statut,vues\n' +
        state.getAnnonces().slice(0, 10).map(a =>
          `${a.id},${a.typeBien},${a.ville},${a.quartier},${a.prix},${a.statut},${a.nombreVues}`
        ).join('\n')
      : 'id,prenom,nom,email,ville,statut\n1,Franck,Tchinda,franck@mbemnova.com,Douala,ACTIF';
    response = new HttpResponse({
      status: 200,
      body: new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
    });
  }

  // ─── Route non couverte → API réelle ─────────────────────────────────────
  if (!response && !errorResponse) {
    console.warn(`[MOCK] Route non couverte: ${method} ${url}`);
    return next(req);
  }

  // Retourner la réponse (ok ou erreur) avec délai simulé
  if (errorResponse) {
    return throwError(() => errorResponse).pipe(delay(d));
  }
  return of(response!).pipe(delay(d));
};
EOF
OK "Mock Interceptor V2 (scénarios d'erreur + état persistant)"

# =============================================================================
# 3. DEV TOOLS OVERLAY — indicateur mock/api visible
# =============================================================================
SECTION "3/4 — DevTools Overlay"

mkdir -p src/app/shared/components/dev-tools
cat > src/app/shared/components/dev-tools/dev-tools.component.ts << 'EOF'
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '@environments/environment';
import { MockStateService } from '@core/mock/mock-state.service';

@Component({
  selector: 'app-dev-tools',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!environment.production) {
      <!-- Badge flottant -->
      <div
        (click)="toggleExpanded()"
        class="fixed bottom-20 right-3 z-50 sm:bottom-4 cursor-pointer select-none"
        [attr.title]="'Cliquer pour détails dev'"
      >
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg
                    transition-all"
             [class]="environment.useMock
               ? 'bg-amber-400 text-amber-900'
               : 'bg-emerald-500 text-white'">
          <span class="w-2 h-2 rounded-full animate-pulse"
                [class]="environment.useMock ? 'bg-amber-600' : 'bg-white'"></span>
          {{ environment.useMock ? 'MOCK' : 'API' }}
        </div>
      </div>

      <!-- Panel étendu -->
      @if (expanded()) {
        <div class="fixed bottom-32 right-3 sm:bottom-14 z-50 w-64 bg-slate-900 text-white
                    rounded-2xl shadow-2xl p-4 text-xs fade-in">
          <div class="flex items-center justify-between mb-3">
            <span class="font-bold text-slate-200">🛠 ImmoCam DevTools</span>
            <button (click)="toggleExpanded()" class="text-slate-400 hover:text-white">✕</button>
          </div>

          <div class="space-y-2">
            <!-- Mode -->
            <div class="flex items-center justify-between py-1.5 border-b border-slate-700">
              <span class="text-slate-400">Mode</span>
              <span class="font-semibold" [class]="environment.useMock ? 'text-amber-400' : 'text-emerald-400'">
                {{ environment.useMock ? '🎭 Mock' : '🔌 API réelle' }}
              </span>
            </div>
            <!-- API URL -->
            <div class="flex items-center justify-between py-1.5 border-b border-slate-700">
              <span class="text-slate-400">API URL</span>
              <span class="text-slate-300 truncate max-w-32">{{ environment.apiUrl }}</span>
            </div>
            <!-- Délai mock -->
            @if (environment.useMock) {
              <div class="flex items-center justify-between py-1.5 border-b border-slate-700">
                <span class="text-slate-400">Délai mock</span>
                <span class="text-slate-300">{{ environment.mockDelay }}ms</span>
              </div>
              <!-- Session mock -->
              <div class="py-1.5 border-b border-slate-700">
                <span class="text-slate-400">Session mock</span>
                @if (mockSession()) {
                  <p class="text-emerald-400 font-medium mt-0.5">
                    ✅ {{ mockSession()?.prenom }} ({{ mockSession()?.role }})
                  </p>
                } @else {
                  <p class="text-slate-500 mt-0.5">Non connecté</p>
                }
              </div>
            }
            <!-- Comptes test -->
            <div class="pt-1">
              <p class="text-slate-500 mb-1">Comptes de test :</p>
              <p class="text-slate-400">user@test.cm → Utilisateur</p>
              <p class="text-slate-400">admin@test.cm → Admin</p>
              <p class="text-slate-500 mt-1">Code OTP universel: <span class="text-amber-400 font-mono">123456</span></p>
            </div>
          </div>

          <!-- Lien basculement -->
          <div class="mt-3 pt-3 border-t border-slate-700">
            <p class="text-slate-500 text-center text-xs leading-relaxed">
              Pour basculer mock/api:<br/>
              <code class="text-amber-400">environment.ts → useMock</code>
            </p>
          </div>
        </div>
      }
    }
  `,
})
export class DevToolsComponent {
  private readonly mockState = inject(MockStateService);
  readonly environment = environment;
  expanded = signal(false);

  toggleExpanded(): void { this.expanded.update(v => !v); }

  mockSession() {
    return this.mockState.getSession().user;
  }
}
EOF
OK "DevToolsComponent"

# Mettre à jour app.component pour inclure DevTools
cat > src/app/app.component.ts << 'EOF'
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DevToolsComponent } from './shared/components/dev-tools/dev-tools.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DevToolsComponent],
  template: `
    <router-outlet/>
    <app-dev-tools/>
  `,
})
export class AppComponent {}
EOF
OK "app.component.ts avec DevTools"

# =============================================================================
# 4. MOCK DATA FACTORY V2 — données plus réalistes
# =============================================================================
SECTION "4/4 — Mock Data Factory V2"

cat > "$MOCK/mock-data.factory.ts" << 'EOF'
// =============================================================================
// IMMOCAM — Mock Data Factory V2
// Données réalistes camerounaises avec descriptions authentiques
// =============================================================================

import { StatutAnnonce } from '@core/models';

// ─── Villes et quartiers ───────────────────────────────────────────────────

export const VILLES_QUARTIERS: Record<string, string[]> = {
  'Douala':     ['Bonanjo', 'Akwa', 'Deido', 'Bali', 'New Bell', 'Bonabéri', 'Makepe', 'Kotto', 'Logpom', 'Ndogpassi'],
  'Yaoundé':   ['Bastos', 'Centre-ville', 'Nlongkak', 'Messa', 'Biyem-Assi', 'Mendong', 'Omnisport', 'Mfandena', 'Essos'],
  'Bafoussam': ['Quartier Commercial', 'Djeleng', 'Tamdja', 'Kouoté', 'Tougang'],
  'Kribi':     ['Plage', 'Centre', 'Grand Batanga', 'Mboa Ma Mbock'],
  'Limbé':     ['Down Beach', 'Mile 4', 'Bota', 'Church Street'],
  'Bamenda':   ['Commercial Avenue', 'Old Town', 'Ntarikon', 'Small Mankon'],
  'Buea':      ['Molyko', 'Great Soppo', 'Bonduma', 'Mile 17'],
  'Garoua':    ['Yelwa', 'Poumpoumré', 'Foulbéré'],
  'Ngaoundéré':['Baladji', 'Centre administratif', 'Mbideng'],
};

export const MOCK_VILLES = Object.keys(VILLES_QUARTIERS);

// ─── Types de biens ────────────────────────────────────────────────────────

export const MOCK_TYPE_BIENS = [
  { id: 1, nom: 'Appartement', icone: '🏢', active: true },
  { id: 2, nom: 'Studio',      icone: '🏠', active: true },
  { id: 3, nom: 'Villa',       icone: '🏡', active: true },
  { id: 4, nom: 'Maison',      icone: '🏘️', active: true },
  { id: 5, nom: 'Bureau',      icone: '💼', active: true },
  { id: 6, nom: 'Boutique',    icone: '🏪', active: true },
  { id: 7, nom: 'Chambre',     icone: '🛏️', active: true },
  { id: 8, nom: 'Terrain',     icone: '🌱', active: true },
];

// ─── Localisations ─────────────────────────────────────────────────────────

let _locId = 1;
export const MOCK_LOCALISATIONS = Object.entries(VILLES_QUARTIERS).flatMap(
  ([ville, quartiers]) =>
    quartiers.map(quartier => ({ id: _locId++, ville, quartier, active: true }))
);

// ─── Descriptions réalistes ────────────────────────────────────────────────

const DESCRIPTIONS: Record<string, string[]> = {
  'Appartement': [
    'Bel appartement moderne de 2 chambres entièrement rénové en 2025. Cuisine équipée (réfrigérateur, plaques électriques, évier inox), salon spacieux avec ventilateur, 2 chambres climatisées, salle de bain avec chauffe-eau. Eau et électricité disponibles 24h/24. Gardiennage 24h, parking sécurisé. Idéal couple ou jeune professionnel.',
    'Appartement F3 au 2ème étage d\'un immeuble sécurisé. 3 chambres, 2 salles de bain, grand salon, cuisine équipée, balcon avec vue dégagée. Groupe électrogène en cas de coupure. Gardien permanent. Connexion internet fibre disponible dans le bâtiment.',
    'Grand appartement lumineux en rez-de-chaussée surélevé. 4 pièces dont 2 chambres, salon-salle à manger séparé, cuisine aménagée, WC invité séparé. Résidence sécurisée avec portail automatique. Parking 2 voitures. Quartier calme et prisé.',
  ],
  'Studio': [
    'Studio meublé idéal pour étudiant ou jeune professionnel. Pièce principale avec lit 2 places, table de travail, armoire. Kitchenette équipée. Salle de bain avec douche. WiFi inclus. Eau chaude, électricité stable. Immeuble sécurisé, proche université et transports en commun.',
    'Studio cosy entièrement meublé au 3ème étage. Vue agréable, lumière naturelle. Lit, bureau, TV, réfrigérateur, plaque de cuisson, vaisselle fournis. Eau et électricité incluses dans le loyer. Accès 24h/24. Bail flexible (mensuel ou annuel).',
  ],
  'Villa': [
    'Somptueuse villa 5 chambres dans résidence fermée et gardée 24h. Piscine privée 8m x 4m, jardin paysagé, garage 3 voitures, générateur 20 KVA, fosse sceptique, citerne 10 000L. Cuisine moderne entièrement équipée. Salle de jeux, bureau. Idéale famille expatriée ou diplomatique.',
    'Villa contemporaine 4 chambres avec jardin clos. 3 salles de bains, salon-salle à manger séparé, cuisine US, dressing maître, buanderie. Groupe électrogène, citerne eau, climatisation centrale. Quartier résidentiel prisé, proximité écoles internationales.',
  ],
  'Maison': [
    'Maison de ville sur 2 niveaux, 4 chambres, 2 salles de bain. Grande cour clôturée pouvant accueillir 3 véhicules. Cuisine avec garde-manger, séjour spacieux. Eau de la SNEC, électricité AES (compteur propre). Connexion internet MTN disponible.',
    'Belle maison standalone avec cour, 3 chambres, salon, cuisine équipée. Jardin potager, poulailler possible, espace pour petit commerce en façade. Titre foncier disponible pour consultation. Quartier accessible, desservi par taxis-motos.',
  ],
  'Bureau': [
    'Bureau professionnel au rez-de-chaussée commercial, surface 50m², climatisé. Salle d\'attente, bureau principal, salle de réunion pour 8 personnes. WC séparé. Groupe électrogène automatique, connexion fibre optique. Parking clients devant le local. Idéal cabinet médical, cabinet juridique, agence.',
    'Espace bureau open space 80m² au 2ème étage. 6 postes de travail, salle de réunion vitrée 10 places, kitchenette, 2 WC. Sécurité 24h, badge magnétique. Accès internet très haut débit. Électricité triphasée disponible. Bail 1 an minimum.',
  ],
  'Boutique': [
    'Local commercial en rez-de-chaussée sur axe très fréquenté. 35m² au sol, hauteur sous plafond 4m. Vitrine 6m, arrière-boutique, WC. Électricité triphasée, branchement eau. Idéal alimentation, pharmacie, boutique vêtements. Loyer charges comprises.',
    'Boutique angle 2 rues dans zone commerciale animée. 45m² + réserve 15m². Climatisé, alarme, rideau métallique. Fort passage piéton et vehicules. Proximité parking municipal. Droit au bail négociable.',
  ],
  'Chambre': [
    'Chambre meublée chez particulier dans maison calme. Lit 2 places, matelas neuf, armoire, table de nuit, ventilateur. Salle de bain et WC partagés (2 locataires max). Cuisine partagée avec réfrigérateur. WiFi, eau, électricité inclus. Ambiance familiale, quartier sécurisé.',
    'Chambre indépendante avec entrée privée, salle de bain privée. Lit, bureau, armoire, TV, réfrigérateur mini. Eau et électricité incluses. Accès illimité. Jardin partagé. Idéal pour étudiant ou travailleur en déplacement. Caution 1 mois.',
  ],
  'Terrain': [
    'Terrain de 500m² titré dans quartier résidentiel en plein développement. Forme régulière 20m x 25m, terrain plat. Accès route goudronnée, eau et électricité en bordure. Documents en règle (titre foncier, plan topographique). Idéal construction villa ou immeuble R+2.',
    'Parcelle 300m² en zone résidentielle, tous documents disponibles. Voisinage bâti, quartier sécurisé. Eau SNEC et électricité accessibles depuis la rue. Possibilité financement étalé sur 12 mois.',
  ],
};

function getDescription(typeBien: string): string {
  const descs = DESCRIPTIONS[typeBien] ?? DESCRIPTIONS['Appartement'];
  return descs[Math.floor(Math.random() * descs.length)];
}

// ─── Prénoms camerounais ───────────────────────────────────────────────────

const PRENOMS = ['Jean-Pierre', 'Marie-Claire', 'Emmanuel', 'Fatima', 'Christian',
  'Grâce', 'Bertrand', 'Aïcha', 'Rodrigue', 'Cécile', 'Thierry', 'Sandrine',
  'Alain', 'Nathalie', 'Serge', 'Pascale', 'Hervé', 'Monique', 'Franck', 'Sylvie'];

// ─── Générateur d'annonces ─────────────────────────────────────────────────

export function generateAnnonces(count = 50): any[] {
  const annonces = [];
  const villes = Object.keys(VILLES_QUARTIERS);
  const prixParType: Record<string, [number, number]> = {
    'Appartement': [60000, 300000], 'Studio': [25000, 100000],
    'Villa': [300000, 1200000],    'Maison': [80000, 400000],
    'Bureau': [100000, 600000],    'Boutique': [50000, 350000],
    'Chambre': [15000, 60000],     'Terrain': [50000, 800000],
  };

  const statuts = [
    ...Array(40).fill(StatutAnnonce.ACTIVE),
    ...Array(4).fill(StatutAnnonce.EN_PAUSE),
    ...Array(4).fill(StatutAnnonce.EXPIREE),
    ...Array(2).fill(StatutAnnonce.ARCHIVEE),
  ];

  for (let i = 1; i <= count; i++) {
    const ville    = villes[i % villes.length];
    const quartiers = VILLES_QUARTIERS[ville];
    const quartier = quartiers[i % quartiers.length];
    const type     = MOCK_TYPE_BIENS[(i - 1) % MOCK_TYPE_BIENS.length];
    const [pMin, pMax] = prixParType[type.nom] ?? [30000, 200000];
    const step     = 5000;
    const prix     = Math.round((pMin + Math.random() * (pMax - pMin)) / step) * step;

    const pubDaysAgo = Math.floor(Math.random() * 25);
    const pubDate  = new Date(Date.now() - pubDaysAgo * 86400000);
    const expDate  = new Date(pubDate.getTime() + 30 * 86400000);
    const statut   = statuts[i - 1] ?? StatutAnnonce.ACTIVE;

    const loc = MOCK_LOCALISATIONS.find(l => l.ville === ville && l.quartier === quartier);

    annonces.push({
      id: i,
      typeBien:            type.nom,
      typeBienId:          type.id,
      ville,
      quartier,
      prix,
      prixFormate:         new Intl.NumberFormat('fr-CM').format(prix) + ' FCFA',
      statut,
      photoPrincipale:     `https://picsum.photos/seed/${type.nom}${i}/800/500`,
      photoPrincipaleThumb:`https://picsum.photos/seed/${type.nom}${i}/400/250`,
      hasPhotos:           i % 4 !== 0, // 75% ont des photos
      datePublication:     pubDate.toISOString(),
      dateExpiration:      expDate.toISOString(),
      nombreVues:          Math.floor(Math.random() * 850) + 5,
      nombreCommentaires:  Math.floor(Math.random() * 8),
      nombreContacts:      Math.floor(Math.random() * 35),
      isFavori:            false,
      description:         getDescription(type.nom),
      proprietairePrenom:  PRENOMS[i % PRENOMS.length],
      localisationId:      loc?.id ?? i,
      photos:              i % 4 !== 0 ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
        id: i * 10 + j,
        url: `https://picsum.photos/seed/${type.nom}${i}${j}/800/500`,
        urlThumb: `https://picsum.photos/seed/${type.nom}${i}${j}/400/250`,
        ordre: j,
        principale: j === 0,
      })) : [],
      commentaires: i % 5 === 0 ? [
        {
          id: i * 100,
          auteurPrenom: PRENOMS[(i + 1) % PRENOMS.length],
          contenu: 'Bonjour, est-ce que le bien est encore disponible ? Peut-on visiter ce week-end ?',
          dateCreation: new Date(Date.now() - 2 * 86400000).toISOString(),
          estProprietaire: false, estMien: false,
          reponse: i % 10 === 0 ? {
            id: i * 100 + 1,
            contenu: 'Oui, toujours disponible ! Contactez-moi sur WhatsApp pour organiser une visite.',
            dateCreation: new Date(Date.now() - 86400000).toISOString(),
          } : null,
        }
      ] : [],
    });
  }
  return annonces;
}

// ─── Utilisateurs mock ─────────────────────────────────────────────────────

export const MOCK_USER = {
  id: 1,
  prenom: 'Franck',
  nom: 'Tchinda',
  nomComplet: 'Franck Tchinda',
  email: 'franck@mbemnova.com',
  telephone: '+237691877527',
  ville: 'Douala',
  role: 'UTILISATEUR' as const,
  statut: 'ACTIF' as const,
  emailVerifie: true,
  dateInscription: '2026-01-15T10:00:00Z',
  nombreAnnoncesActives: 3,
  nombreFavoris: 7,
};

export const MOCK_ADMIN_USER = {
  ...MOCK_USER,
  id: 99,
  prenom: 'Admin',
  nom: 'ImmoCam',
  nomComplet: 'Admin ImmoCam',
  email: 'admin@immocam.cm',
  role: 'ADMINISTRATEUR' as const,
};

export const MOCK_AUTH_RESPONSE = {
  accessToken:  'mock_access_token_immocam_2026',
  refreshToken: 'mock_refresh_token_immocam_2026',
  tokenType:    'Bearer',
  expiresIn:    3600,
  utilisateur:  MOCK_USER,
};

// Index
export { VILLES_QUARTIERS as MOCK_VILLES_QUARTIERS };
EOF
OK "Mock Data Factory V2 (données camerounaises authentiques)"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 10 TERMINÉ — MOCK SCENARIOS ENRICHIS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}[i]${NC} MockStateService: état persistant en mémoire"
echo -e "${BLUE}[i]${NC} Mock Interceptor V2: 50+ routes, scénarios erreur"
echo -e "${BLUE}[i]${NC} Scénarios couverts: compte bloqué, OTP expiré, limite annonces, doublon"
echo -e "${BLUE}[i]${NC} DevTools overlay: badge mock/api + panel développeur"
echo -e "${BLUE}[i]${NC} Code OTP universel: 123456"
echo -e "${BLUE}[i]${NC} Prochaine étape: bash ../ng-11-tests.sh"
