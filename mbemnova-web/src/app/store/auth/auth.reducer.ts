import { createReducer, on } from '@ngrx/store';
import { UtilisateurProfil } from '@core/services/models';
import { authActions } from './auth.actions';

export interface AuthState {
  user: UtilisateurProfil | null;
  loading: boolean;
  error: string | null;
  pendingEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  pendingEmail: null,
};

export const authReducer = createReducer(
  initialState,

  // ====== REGISTER ======
  on(authActions.register, (s) => ({ ...s, loading: true, error: null })),
  on(authActions.registerSuccess, (s, { email }) => ({
    ...s,
    loading: false,
    pendingEmail: email,
    error: null,
  })),
  on(authActions.registerFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // ====== VERIFY EMAIL ======
  on(authActions.verifyEmail, (s) => ({ ...s, loading: true, error: null })),
  on(authActions.verifyEmailSuccess, (s, { user }) => ({
    ...s,
    loading: false,
    user,
    pendingEmail: null,
    error: null,
  })),
  on(authActions.verifyEmailFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // ====== RESEND CODE ======
  on(authActions.resendCode, (s) => ({ ...s, loading: true, error: null })),
  on(authActions.resendCodeSuccess, (s) => ({ ...s, loading: false, error: null })),
  on(authActions.resendCodeFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // ====== LOGIN ======
  on(authActions.login, (s) => ({ ...s, loading: true, error: null })),
  on(authActions.loginSuccess, (s, { user }) => ({
    ...s,
    loading: false,
    user,
    error: null,
  })),
  on(authActions.loginFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // ====== FORGOT PASSWORD ======
  on(authActions.forgotPassword, (s) => ({ ...s, loading: true, error: null })),
  on(authActions.forgotPasswordSuccess, (s) => ({ ...s, loading: false, error: null })),
  on(authActions.forgotPasswordFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // ====== RESET PASSWORD ======
  on(authActions.resetPassword, (s) => ({ ...s, loading: true, error: null })),
  on(authActions.resetPasswordSuccess, (s) => ({ ...s, loading: false, error: null })),
  on(authActions.resetPasswordFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // ====== LOGOUT ======
  on(authActions.logout, () => initialState),
 on(authActions.logoutSuccess, () => initialState),

  // ====== UPDATE USER ======
  on(authActions.updateUser, (s, { user }) => ({ ...s, user })),

  // ====== INIT ======
  on(authActions.initSuccess, (s, { user }) => ({ ...s, user })),
  on(authActions.initFailure, () => initialState),
);
