import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { StorageService } from '../storage.service';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ResendCodeRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  RefreshTokenRequest,
  UtilisateurProfil,
} from '@core/services/models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly base = `${environment.apiUrl}/auth`;

  private log(msg: string, data?: any) {
    const env = environment as any;
    if (env.logApiCalls) {
      console.log(`[AuthApi] ${msg}`, data);
    }
  }

  /** Inscription - retourne email confirmé */
  register(req: RegisterRequest): Observable<ApiResponse<{ email: string }>> {
    this.log('🚀 POST /register', req);
    return this.http
      .post<ApiResponse<{ email: string }>>(`${this.base}/register`, req)
      .pipe(tap((res) => this.log('✅ Réponse register', res)));
  }

  /** Vérification email - retourne tokens et utilisateur */
  verifyEmail(req: VerifyEmailRequest): Observable<ApiResponse<UtilisateurProfil>> {
    this.log('🚀 POST /verify-email', req);
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/verify-email`, req).pipe(
      tap((res) => this.log('✅ Réponse verify-email', res)),
      map((res) => this._handleAuthResponse(res)),
    );
  }

  /** Renvoyer code OTP */
  resendCode(req: ResendCodeRequest): Observable<ApiResponse<void>> {
    this.log('🚀 POST /resend-code', req);
    return this.http
      .post<ApiResponse<void>>(`${this.base}/resend-code`, req)
      .pipe(tap((res) => this.log('✅ Réponse resend-code', res)));
  }

  /** Connexion - retourne tokens et utilisateur */
  login(req: LoginRequest): Observable<ApiResponse<UtilisateurProfil>> {
    this.log('🚀 POST /login', req);
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req).pipe(
      tap((res) => this.log('✅ Réponse login', res)),
      map((res) => this._handleAuthResponse(res)),
    );
  }

  /** Rafraîchir token */
  refresh(req: RefreshTokenRequest): Observable<ApiResponse<UtilisateurProfil>> {
    this.log('🚀 POST /refresh', req);
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/refresh`, req).pipe(
      tap((res) => this.log('✅ Réponse refresh', res)),
      map((res) => this._handleAuthResponse(res)),
    );
  }

  /** Mot de passe oublié */
  forgotPassword(req: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    this.log('🚀 POST /forgot-password', req);
    return this.http
      .post<ApiResponse<void>>(`${this.base}/forgot-password`, req)
      .pipe(tap((res) => this.log('✅ Réponse forgot-password', res)));
  }

  /** Réinitialiser mot de passe */
  resetPassword(req: ResetPasswordRequest): Observable<ApiResponse<void>> {
    this.log('🚀 POST /reset-password', req);
    return this.http
      .post<ApiResponse<void>>(`${this.base}/reset-password`, req)
      .pipe(tap((res) => this.log('✅ Réponse reset-password', res)));
  }

  /** Traite la réponse auth et sauvegarde les tokens */
  private _handleAuthResponse(res: ApiResponse<AuthResponse>): ApiResponse<UtilisateurProfil> {
    const auth = res.data;
    // Sauvegarde les tokens immédiatement
    this.storage.setTokens(auth.accessToken, auth.refreshToken);
    this.log('💾 Tokens sauvegardés', {
      access: auth.accessToken.substring(0, 20) + '...',
      refresh: auth.refreshToken.substring(0, 20) + '...',
    });

    return {
      ...res,
      data: {
        id: auth.userId,
        prenom: auth.prenom,
        nom: auth.nom,
        email: auth.email,
        role: auth.role,
        emailVerifie: true,
      },
    };
  }
}
