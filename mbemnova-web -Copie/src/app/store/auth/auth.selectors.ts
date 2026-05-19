import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';
import { RoleUtilisateur } from '@core/services/models';

const selectAuth = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuth, (s) => s.user);
export const selectAuthLoading = createSelector(selectAuth, (s) => s.loading);
export const selectAuthError = createSelector(selectAuth, (s) => s.error);
export const selectPendingEmail = createSelector(selectAuth, (s) => s.pendingEmail);
export const selectIsLoggedIn = createSelector(selectAuth, (s) => !!s.user);
export const selectIsAdmin = createSelector(
  selectAuth,
  (s) => s.user?.role === RoleUtilisateur.ADMINISTRATEUR,
);
export const selectIsVerified = createSelector(selectAuth, (s) => s.user?.emailVerifie ?? false);
export const selectUserName = createSelector(selectAuth, (s) => s.user?.prenom ?? '');
// export const selectUserFullName  = createSelector(selectAuth, s => s.user?.nomComplet ?? '');
