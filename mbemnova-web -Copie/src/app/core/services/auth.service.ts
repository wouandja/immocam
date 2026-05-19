import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { AuthApi } from './api/auth.api';
import { StorageService } from './storage.service';
import { ToastService } from './toast.service';
import {
  LoginRequest,
  UtilisateurProfil,
  RoleUtilisateur,
  RegisterRequest,
  VerifyEmailRequest,
} from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly currentUser = signal<UtilisateurProfil | null>(
    this.storage.getUser<UtilisateurProfil>(),
  );
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === RoleUtilisateur.ADMINISTRATEUR);
  readonly isVerified = computed(() => this.currentUser()?.emailVerifie === true);

  // ==================== Authentification ====================

  register(req: RegisterRequest): Observable<any> {
    return this.authApi.register(req);
  }

  verifyEmail(req: VerifyEmailRequest): Observable<any> {
    return this.authApi.verifyEmail(req).pipe(tap((res) => this._handleAuthSuccess(res.data)));
  }

  resendCode(email: string, typeCode?: string): Observable<any> {
    return this.authApi.resendCode({ email, typeCode });
  }

  login(req: LoginRequest): Observable<any> {
    return this.authApi.login(req).pipe(tap((res) => this._handleAuthSuccess(res.data)));
  }

  refreshToken(): Observable<any> {
    const rt = this.storage.getRefreshToken();
    if (!rt) return throwError(() => new Error('No refresh token'));
    return this.authApi
      .refresh({ refreshToken: rt })
      .pipe(tap((res) => this._handleAuthSuccess(res.data)));
  }

  forgotPassword(email: string): Observable<any> {
    return this.authApi.forgotPassword({ email });
  }

  resetPassword(
    token: string,
    nouveauMotDePasse: string,
    confirmationMotDePasse: string,
  ): Observable<any> {
    return this.authApi.resetPassword({ token, nouveauMotDePasse, confirmationMotDePasse });
  }

  logout(): void {
    this.storage.clearTokens();
    this.currentUser.set(null);
    this.toast.success('Déconnexion réussie');
    this.router.navigate(['/']);
  }

  // ==================== État utilisateur ====================

  initFromStorage(): void {
    const user = this.storage.getUser<UtilisateurProfil>();
    if (user) this.currentUser.set(user);
  }

  updateUser(user: UtilisateurProfil): void {
    this.currentUser.set(user);
    this.storage.setUser(user);
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.storage.clearTokens();
  }

  // ==================== Privé ====================

  private _handleAuthSuccess(user: UtilisateurProfil): void {
    // Les tokens sont déjà sauvegardés par auth.api._handleAuthResponse
    this.storage.setUser(user);
    this.currentUser.set(user);
  }
}
