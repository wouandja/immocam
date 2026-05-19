import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of, tap, map, switchMap, catchError } from 'rxjs';
import { authActions } from './auth.actions';
import { AuthApi } from '@core/services/api/auth.api';
import { StorageService } from '@core/services/storage.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { RoleUtilisateur } from '@core/services/models';
import { environment } from '@environments/environment';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi = inject(AuthApi);
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private log(msg: string, data?: any) {
    const env = environment as any;
    if (env.logApiCalls) {
      console.log(`[AuthEffects] ${msg}`, data);
    }
  }

  // ===================== REGISTER =====================
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.register),
      tap(({ req }) => this.log('📤 register$ triggered', req)),
      switchMap(({ req }) =>
        this.authApi.register(req).pipe(
          tap(() => this.log('✅ register$ success')),
          map((res) => authActions.registerSuccess({ email: req.email })),
          catchError((err) => {
            this.log('❌ register$ error', err);
            return of(
              authActions.registerFailure({
                error: err.error?.message ?? "Erreur lors de l'inscription",
              }),
            );
          }),
        ),
      ),
    ),
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.registerSuccess),
        tap(({ email }) => {
          this.log('📲 registerSuccess$ triggered', email);
          this.toast.success('Compte créé ! Vérifiez votre email.');
          this.router.navigate(['/auth/verify-email'], { queryParams: { email } });
        }),
      ),
    { dispatch: false },
  );

  // ===================== VERIFY EMAIL =====================
  verifyEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.verifyEmail),
      tap(({ req }) => this.log('📤 verifyEmail$ triggered', req)),
      switchMap(({ req }) =>
        this.authApi.verifyEmail(req).pipe(
          tap(() => this.log('✅ verifyEmail$ success')),
          map((res) => authActions.verifyEmailSuccess({ user: res.data })),
          catchError((err) => {
            this.log('❌ verifyEmail$ error', err);
            return of(
              authActions.verifyEmailFailure({
                error: err.error?.message ?? 'Code invalide ou expiré',
              }),
            );
          }),
        ),
      ),
    ),
  );

  verifyEmailSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.verifyEmailSuccess),
        tap(({ user }) => {
          this.log('📲 verifyEmailSuccess$ triggered', user);
          this.auth.updateUser(user);
          this.toast.success(`Bienvenue ${user.prenom} ! Email vérifié.`);
          this.router.navigate(['/dashboard']);
        }),
      ),
    { dispatch: false },
  );

  // ===================== RESEND CODE =====================
  resendCode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.resendCode),
      tap(({ req }) => this.log('📤 resendCode$ triggered', req)),
      switchMap(({ req }) =>
        this.authApi.resendCode(req).pipe(
          tap(() => this.log('✅ resendCode$ success')),
          map(() => authActions.resendCodeSuccess()),
          catchError((err) => {
            this.log('❌ resendCode$ error', err);
            return of(
              authActions.resendCodeFailure({
                error: err.error?.message ?? 'Erreur lors du renvoi du code',
              }),
            );
          }),
        ),
      ),
    ),
  );

  resendCodeSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.resendCodeSuccess),
        tap(() => {
          this.log('📲 resendCodeSuccess$ triggered');
          this.toast.success('Code renvoyé à votre email.');
        }),
      ),
    { dispatch: false },
  );

  // ===================== LOGIN =====================
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.login),
      tap(({ req }) => this.log('📤 login$ triggered', { email: req.email })),
      switchMap(({ req }) =>
        this.authApi.login(req).pipe(
          tap(() => this.log('✅ login$ success')),
          map((res) => {
            this.log('✅ login$ mapping response', res.data);
            return authActions.loginSuccess({ user: res.data });
          }),
          catchError((err) => {
            this.log('❌ login$ error', err);
            return of(
              authActions.loginFailure({
                error: err.error?.message ?? 'Identifiants incorrects',
              }),
            );
          }),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.loginSuccess),
        tap(({ user }) => {
          this.log('📲 loginSuccess$ triggered', user);
          this.auth.updateUser(user);
          this.toast.success(`Bienvenue ${user.prenom} !`);
          // IMPORTANT: en cas d’échec login, on ne doit pas naviguer.
          // Ici on est dans le cas loginSuccess => navigation autorisée.
          const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
          const isAdmin = user.role === RoleUtilisateur.ADMINISTRATEUR;
          const target = isAdmin
            ? returnUrl?.startsWith('/admin')
              ? returnUrl
              : '/admin/dashboard'
            : (returnUrl ?? '/dashboard');
          this.log('🔄 Navigation vers', target);
          this.router.navigate([target]);
        }),
      ),
    { dispatch: false },
  );

  // ===================== FORGOT PASSWORD =====================
  forgotPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.forgotPassword),
      tap(({ req }) => this.log('📤 forgotPassword$ triggered', req)),
      switchMap(({ req }) =>
        this.authApi.forgotPassword(req).pipe(
          tap(() => this.log('✅ forgotPassword$ success')),
          map(() => authActions.forgotPasswordSuccess()),
          catchError((err) => {
            this.log('❌ forgotPassword$ error', err);
            return of(
              authActions.forgotPasswordFailure({
                error: err.error?.message ?? 'Erreur lors de la demande',
              }),
            );
          }),
        ),
      ),
    ),
  );

  forgotPasswordSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.forgotPasswordSuccess),
        tap(() => {
          this.log('📲 forgotPasswordSuccess$ triggered');
          this.toast.success('Si un compte existe, un lien a été envoyé.');
          this.router.navigate(['/auth/login']);
        }),
      ),
    { dispatch: false },
  );

  // ===================== RESET PASSWORD =====================
  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.resetPassword),
      tap(({ req }) => this.log('📤 resetPassword$ triggered', req)),
      switchMap(({ req }) =>
        this.authApi.resetPassword(req).pipe(
          tap(() => this.log('✅ resetPassword$ success')),
          map(() => authActions.resetPasswordSuccess()),
          catchError((err) => {
            this.log('❌ resetPassword$ error', err);
            return of(
              authActions.resetPasswordFailure({
                error: err.error?.message ?? 'Erreur lors de la réinitialisation',
              }),
            );
          }),
        ),
      ),
    ),
  );

  resetPasswordSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.resetPasswordSuccess),
        tap(() => {
          this.log('📲 resetPasswordSuccess$ triggered');
          this.toast.success('Mot de passe modifié. Connectez-vous.');
          this.router.navigate(['/auth/login']);
        }),
      ),
    { dispatch: false },
  );

  // ===================== LOGOUT =====================
  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.logout),
        tap(() => {
          this.log('📲 logout$ triggered');
          this.auth.clearSession();
          this.toast.info('À bientôt !');
          this.router.navigate(['/']);
        }),
      ),
    { dispatch: false },
  );

  // ===================== INIT =====================
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.init),
      tap(() => this.log('📤 init$ triggered')),
      map(() => {
        const user = this.storage.getUser<any>();
        this.log(user ? '✅ init$ user found' : '❌ init$ no user', user);
        if (user) this.auth.updateUser(user);
        return user ? authActions.initSuccess({ user }) : authActions.initFailure();
      }),
    ),
  );
}
