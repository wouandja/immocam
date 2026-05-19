#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 03 : NGRX STORE + MOCK DATA
# =============================================================================
# Rôle     : Génère le store NgRx complet + système mock :
#            - app.state.ts (état global)
#            - Store Auth (actions, reducer, effects, selectors)
#            - Store Annonce (actions, reducer, effects, selectors)
#            - Store Favori (actions, reducer, effects, selectors)
#            - Store UI (loading, sidebar, toasts)
#            - Mock Interceptor HTTP (données Faker.js)
#            - Mock Data Factory (50 annonces réalistes)
#
# Exécuter : Depuis la racine du projet immocam-frontend/
#            bash ../ng-03-store.sh
# Prérequis: Scripts 01 + 02 exécutés
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || ERROR "Lancez depuis la racine du projet Angular"

SECTION "SCRIPT 03 — NGRX STORE + MOCK DATA"

STORE="src/app/store"
MOCK="src/app/core/mock"
mkdir -p "$MOCK"

# =============================================================================
# 1. APP STATE GLOBAL
# =============================================================================
SECTION "1/6 — App State"

cat > "$STORE/app.state.ts" << 'EOF'
import { AuthState }   from './auth/auth.reducer';
import { AnnonceState } from './annonce/annonce.reducer';
import { FavoriState }  from './favori/favori.reducer';
import { UiState }      from './ui/ui.reducer';

export interface AppState {
  auth:    AuthState;
  annonce: AnnonceState;
  favori:  FavoriState;
  ui:      UiState;
}
EOF
OK "app.state.ts"

# =============================================================================
# 2. STORE UI
# =============================================================================
SECTION "2/6 — Store UI"

mkdir -p "$STORE/ui"

cat > "$STORE/ui/ui.actions.ts" << 'EOF'
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const uiActions = createActionGroup({
  source: 'UI',
  events: {
    'Set Loading':       props<{ loading: boolean }>(),
    'Toggle Sidebar':    emptyProps(),
    'Close Sidebar':     emptyProps(),
    'Set Mobile':        props<{ isMobile: boolean }>(),
    'Open Modal':        props<{ modal: string; data?: any }>(),
    'Close Modal':       emptyProps(),
  },
});
EOF

cat > "$STORE/ui/ui.reducer.ts" << 'EOF'
import { createReducer, on } from '@ngrx/store';
import { uiActions } from './ui.actions';

export interface UiState {
  loading:     boolean;
  sidebarOpen: boolean;
  isMobile:    boolean;
  modal:       { name: string; data?: any } | null;
}

const initialState: UiState = {
  loading:     false,
  sidebarOpen: false,
  isMobile:    false,
  modal:       null,
};

export const uiReducer = createReducer(
  initialState,
  on(uiActions.setLoading,    (s, { loading }) => ({ ...s, loading })),
  on(uiActions.toggleSidebar, s => ({ ...s, sidebarOpen: !s.sidebarOpen })),
  on(uiActions.closeSidebar,  s => ({ ...s, sidebarOpen: false })),
  on(uiActions.setMobile,     (s, { isMobile }) => ({ ...s, isMobile })),
  on(uiActions.openModal,     (s, { modal, data }) => ({ ...s, modal: { name: modal, data } })),
  on(uiActions.closeModal,    s => ({ ...s, modal: null })),
);
EOF

cat > "$STORE/ui/ui.selectors.ts" << 'EOF'
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UiState } from './ui.reducer';

const selectUi = createFeatureSelector<UiState>('ui');

export const selectLoading     = createSelector(selectUi, s => s.loading);
export const selectSidebarOpen = createSelector(selectUi, s => s.sidebarOpen);
export const selectIsMobile    = createSelector(selectUi, s => s.isMobile);
export const selectModal       = createSelector(selectUi, s => s.modal);
EOF
OK "Store UI"

# =============================================================================
# 3. STORE AUTH
# =============================================================================
SECTION "3/6 — Store Auth"

mkdir -p "$STORE/auth"

cat > "$STORE/auth/auth.actions.ts" << 'EOF'
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  LoginRequest, RegisterRequest, VerifyEmailRequest,
  AuthResponse, UtilisateurProfil
} from '@core/models';

export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    // Login
    'Login':         props<{ req: LoginRequest }>(),
    'Login Success': props<{ data: AuthResponse }>(),
    'Login Failure': props<{ error: string }>(),

    // Register
    'Register':         props<{ req: RegisterRequest }>(),
    'Register Success': props<{ email: string }>(),
    'Register Failure': props<{ error: string }>(),

    // Verify Email
    'Verify Email':         props<{ req: VerifyEmailRequest }>(),
    'Verify Email Success': props<{ data: AuthResponse }>(),
    'Verify Email Failure': props<{ error: string }>(),

    // Logout
    'Logout':         emptyProps(),
    'Logout Success': emptyProps(),

    // Update user
    'Update User': props<{ user: UtilisateurProfil }>(),

    // Init from storage
    'Init': emptyProps(),
    'Init Success': props<{ user: UtilisateurProfil }>(),
    'Init Failure': emptyProps(),
  },
});
EOF

cat > "$STORE/auth/auth.reducer.ts" << 'EOF'
import { createReducer, on } from '@ngrx/store';
import { UtilisateurProfil } from '@core/models';
import { authActions } from './auth.actions';

export interface AuthState {
  user:         UtilisateurProfil | null;
  loading:      boolean;
  error:        string | null;
  pendingEmail: string | null; // email en attente de vérification
}

const initialState: AuthState = {
  user:         null,
  loading:      false,
  error:        null,
  pendingEmail: null,
};

export const authReducer = createReducer(
  initialState,

  // Login
  on(authActions.login,        s => ({ ...s, loading: true, error: null })),
  on(authActions.loginSuccess, (s, { data }) => ({
    ...s, loading: false, user: data.utilisateur, error: null
  })),
  on(authActions.loginFailure, (s, { error }) => ({
    ...s, loading: false, error
  })),

  // Register
  on(authActions.register,        s => ({ ...s, loading: true, error: null })),
  on(authActions.registerSuccess, (s, { email }) => ({
    ...s, loading: false, pendingEmail: email, error: null
  })),
  on(authActions.registerFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // Verify email
  on(authActions.verifyEmail,        s => ({ ...s, loading: true, error: null })),
  on(authActions.verifyEmailSuccess, (s, { data }) => ({
    ...s, loading: false, user: data.utilisateur, pendingEmail: null, error: null
  })),
  on(authActions.verifyEmailFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // Logout
  on(authActions.logoutSuccess, () => initialState),

  // Update
  on(authActions.updateUser, (s, { user }) => ({ ...s, user })),

  // Init
  on(authActions.initSuccess, (s, { user }) => ({ ...s, user })),
  on(authActions.initFailure, () => initialState),
);
EOF

cat > "$STORE/auth/auth.selectors.ts" << 'EOF'
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';
import { RoleUtilisateur } from '@core/models';

const selectAuth = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser   = createSelector(selectAuth, s => s.user);
export const selectAuthLoading   = createSelector(selectAuth, s => s.loading);
export const selectAuthError     = createSelector(selectAuth, s => s.error);
export const selectPendingEmail  = createSelector(selectAuth, s => s.pendingEmail);
export const selectIsLoggedIn    = createSelector(selectAuth, s => !!s.user);
export const selectIsAdmin       = createSelector(selectAuth,
  s => s.user?.role === RoleUtilisateur.ADMINISTRATEUR
);
export const selectIsVerified    = createSelector(selectAuth, s => s.user?.emailVerifie ?? false);
export const selectUserName      = createSelector(selectAuth, s => s.user?.prenom ?? '');
export const selectUserFullName  = createSelector(selectAuth, s => s.user?.nomComplet ?? '');
EOF

cat > "$STORE/auth/auth.effects.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of, tap, map, switchMap, catchError } from 'rxjs';
import { authActions } from './auth.actions';
import { AuthApi } from '@core/services/api/auth.api';
import { StorageService } from '@core/services/storage.service';
import { ToastService } from '@core/services/toast.service';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi  = inject(AuthApi);
  private readonly storage  = inject(StorageService);
  private readonly router   = inject(Router);
  private readonly toast    = inject(ToastService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.login),
      switchMap(({ req }) =>
        this.authApi.login(req).pipe(
          map(res => authActions.loginSuccess({ data: res.data })),
          catchError(err => of(authActions.loginFailure({
            error: err.error?.message ?? 'Identifiants incorrects'
          })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.loginSuccess),
      tap(({ data }) => {
        this.storage.setTokens(data.accessToken, data.refreshToken);
        this.storage.setUser(data.utilisateur);
        this.toast.success(`Bienvenue ${data.utilisateur.prenom} !`);
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        this.router.navigate([returnUrl ?? '/dashboard']);
      })
    ), { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.register),
      switchMap(({ req }) =>
        this.authApi.register(req).pipe(
          map(res => authActions.registerSuccess({ email: req.email })),
          catchError(err => of(authActions.registerFailure({
            error: err.error?.message ?? 'Erreur lors de l\'inscription'
          })))
        )
      )
    )
  );

  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.registerSuccess),
      tap(({ email }) => {
        this.toast.success('Compte créé ! Vérifiez votre email.');
        this.router.navigate(['/auth/verify-email'], { queryParams: { email } });
      })
    ), { dispatch: false }
  );

  verifyEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.verifyEmail),
      switchMap(({ req }) =>
        this.authApi.verifyEmail(req).pipe(
          map(res => authActions.verifyEmailSuccess({ data: res.data })),
          catchError(err => of(authActions.verifyEmailFailure({
            error: err.error?.message ?? 'Code invalide ou expiré'
          })))
        )
      )
    )
  );

  verifyEmailSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.verifyEmailSuccess),
      tap(({ data }) => {
        this.storage.setTokens(data.accessToken, data.refreshToken);
        this.storage.setUser(data.utilisateur);
        this.toast.success('Email vérifié ! Bienvenue sur ImmoCam !');
        this.router.navigate(['/dashboard']);
      })
    ), { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.logout),
      tap(() => {
        const refreshToken = this.storage.getRefreshToken();
        if (refreshToken) this.authApi.logout(refreshToken).subscribe({ error: () => {} });
        this.storage.clearTokens();
        this.router.navigate(['/']);
        this.toast.info('À bientôt !');
      }),
      map(() => authActions.logoutSuccess())
    )
  );

  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.init),
      map(() => {
        const user = this.storage.getUser<any>();
        return user
          ? authActions.initSuccess({ user })
          : authActions.initFailure();
      })
    )
  );
}
EOF
OK "Store Auth (actions + reducer + selectors + effects)"

# =============================================================================
# 4. STORE ANNONCE
# =============================================================================
SECTION "4/6 — Store Annonce"

mkdir -p "$STORE/annonce"

cat > "$STORE/annonce/annonce.actions.ts" << 'EOF'
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AnnonceListResponse, AnnonceDetailResponse,
  AnnonceFilters, PageResponse, PublierAnnonceRequest
} from '@core/models';

export const annonceActions = createActionGroup({
  source: 'Annonce',
  events: {
    // Liste publique
    'Load Annonces':         props<{ filters: AnnonceFilters; append?: boolean }>(),
    'Load Annonces Success': props<{ page: PageResponse<AnnonceListResponse>; append: boolean }>(),
    'Load Annonces Failure': props<{ error: string }>(),

    // Détail
    'Load Detail':         props<{ id: number }>(),
    'Load Detail Success': props<{ annonce: AnnonceDetailResponse }>(),
    'Load Detail Failure': props<{ error: string }>(),

    // Créer
    'Create':         props<{ req: PublierAnnonceRequest }>(),
    'Create Success': props<{ annonce: AnnonceDetailResponse }>(),
    'Create Failure': props<{ error: string }>(),

    // Actions cycle de vie
    'Pause':     props<{ id: number }>(),
    'Reactiver': props<{ id: number }>(),
    'Renouveler':props<{ id: number }>(),
    'Archiver':  props<{ id: number }>(),
    'Supprimer': props<{ id: number }>(),
    'Action Success': props<{ id: number; action: string }>(),
    'Action Failure': props<{ error: string }>(),

    // Mes annonces
    'Load Mes Annonces':         props<{ filters?: AnnonceFilters }>(),
    'Load Mes Annonces Success': props<{ page: PageResponse<AnnonceListResponse> }>(),

    // Filtres
    'Set Filters': props<{ filters: AnnonceFilters }>(),
    'Reset Filters': emptyProps(),

    // Favori toggle local (sans appel API)
    'Toggle Favori Local': props<{ id: number; isFavori: boolean }>(),
  },
});
EOF

cat > "$STORE/annonce/annonce.reducer.ts" << 'EOF'
import { createReducer, on } from '@ngrx/store';
import { AnnonceListResponse, AnnonceDetailResponse, AnnonceFilters } from '@core/models';
import { annonceActions } from './annonce.actions';

export interface AnnonceState {
  items:        AnnonceListResponse[];
  totalElements: number;
  totalPages:   number;
  currentPage:  number;
  loading:      boolean;
  loadingMore:  boolean;
  error:        string | null;
  detail:       AnnonceDetailResponse | null;
  detailLoading: boolean;
  filters:      AnnonceFilters;
  mesAnnonces:  AnnonceListResponse[];
  mesAnnoncesTotal: number;
  actionLoading: boolean;
}

const initialState: AnnonceState = {
  items:        [],
  totalElements: 0,
  totalPages:   0,
  currentPage:  0,
  loading:      false,
  loadingMore:  false,
  error:        null,
  detail:       null,
  detailLoading: false,
  filters:      { page: 0, size: 12 },
  mesAnnonces:  [],
  mesAnnoncesTotal: 0,
  actionLoading: false,
};

export const annonceReducer = createReducer(
  initialState,

  // Liste
  on(annonceActions.loadAnnonces, (s, { append }) => ({
    ...s, loading: !append, loadingMore: !!append, error: null
  })),
  on(annonceActions.loadAnnoncesSuccess, (s, { page, append }) => ({
    ...s,
    loading:      false,
    loadingMore:  false,
    items:        append ? [...s.items, ...page.content] : page.content,
    totalElements: page.totalElements,
    totalPages:   page.totalPages,
    currentPage:  page.page,
  })),
  on(annonceActions.loadAnnoncesFailure, (s, { error }) => ({
    ...s, loading: false, loadingMore: false, error
  })),

  // Détail
  on(annonceActions.loadDetail,        s => ({ ...s, detailLoading: true, error: null })),
  on(annonceActions.loadDetailSuccess, (s, { annonce }) => ({
    ...s, detailLoading: false, detail: annonce
  })),
  on(annonceActions.loadDetailFailure, (s, { error }) => ({
    ...s, detailLoading: false, error
  })),

  // Actions
  on(annonceActions.pause,
     annonceActions.reactiver,
     annonceActions.renouveler,
     annonceActions.archiver,
     annonceActions.supprimer,
     s => ({ ...s, actionLoading: true })),
  on(annonceActions.actionSuccess, s => ({ ...s, actionLoading: false })),
  on(annonceActions.actionFailure, (s, { error }) => ({ ...s, actionLoading: false, error })),

  // Mes annonces
  on(annonceActions.loadMesAnnoncesSuccess, (s, { page }) => ({
    ...s, mesAnnonces: page.content, mesAnnoncesTotal: page.totalElements
  })),

  // Filtres
  on(annonceActions.setFilters,   (s, { filters }) => ({ ...s, filters: { ...s.filters, ...filters } })),
  on(annonceActions.resetFilters, s => ({ ...s, filters: { page: 0, size: 12 }, items: [] })),

  // Favori local
  on(annonceActions.toggleFavoriLocal, (s, { id, isFavori }) => ({
    ...s,
    items: s.items.map(a => a.id === id ? { ...a, isFavori } : a),
    detail: s.detail?.id === id ? { ...s.detail, isFavori } : s.detail,
  })),
);
EOF

cat > "$STORE/annonce/annonce.selectors.ts" << 'EOF'
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnnonceState } from './annonce.reducer';

const selectAnnonceState = createFeatureSelector<AnnonceState>('annonce');

export const selectAnnonces       = createSelector(selectAnnonceState, s => s.items);
export const selectAnnonceLoading = createSelector(selectAnnonceState, s => s.loading);
export const selectLoadingMore    = createSelector(selectAnnonceState, s => s.loadingMore);
export const selectAnnonceError   = createSelector(selectAnnonceState, s => s.error);
export const selectAnnonceDetail  = createSelector(selectAnnonceState, s => s.detail);
export const selectDetailLoading  = createSelector(selectAnnonceState, s => s.detailLoading);
export const selectTotalElements  = createSelector(selectAnnonceState, s => s.totalElements);
export const selectTotalPages     = createSelector(selectAnnonceState, s => s.totalPages);
export const selectCurrentPage    = createSelector(selectAnnonceState, s => s.currentPage);
export const selectHasMore        = createSelector(selectAnnonceState,
  s => s.currentPage < s.totalPages - 1
);
export const selectFilters        = createSelector(selectAnnonceState, s => s.filters);
export const selectMesAnnonces    = createSelector(selectAnnonceState, s => s.mesAnnonces);
export const selectActionLoading  = createSelector(selectAnnonceState, s => s.actionLoading);
EOF

cat > "$STORE/annonce/annonce.effects.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of, map, switchMap, catchError, tap } from 'rxjs';
import { annonceActions } from './annonce.actions';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { ToastService } from '@core/services/toast.service';

@Injectable()
export class AnnonceEffects {
  private readonly actions$   = inject(Actions);
  private readonly annonceApi = inject(AnnonceApi);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);

  loadAnnonces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.loadAnnonces),
      switchMap(({ filters, append }) =>
        this.annonceApi.getAnnonces(filters).pipe(
          map(res => annonceActions.loadAnnoncesSuccess({
            page: res.data, append: !!append
          })),
          catchError(err => of(annonceActions.loadAnnoncesFailure({
            error: err.error?.message ?? 'Erreur de chargement'
          })))
        )
      )
    )
  );

  loadDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.loadDetail),
      switchMap(({ id }) =>
        this.annonceApi.getAnnonce(id).pipe(
          map(res => annonceActions.loadDetailSuccess({ annonce: res.data })),
          catchError(err => of(annonceActions.loadDetailFailure({
            error: err.error?.message ?? 'Annonce introuvable'
          })))
        )
      )
    )
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.create),
      switchMap(({ req }) =>
        this.annonceApi.publier(req).pipe(
          map(res => annonceActions.createSuccess({ annonce: res.data })),
          catchError(err => of(annonceActions.createFailure({
            error: err.error?.message ?? 'Erreur lors de la publication'
          })))
        )
      )
    )
  );

  createSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.createSuccess),
      tap(({ annonce }) => {
        this.toast.success('Annonce publiée avec succès !');
        this.router.navigate(['/annonces', annonce.id]);
      })
    ), { dispatch: false }
  );

  pause$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.pause),
      switchMap(({ id }) =>
        this.annonceApi.mettreEnPause(id).pipe(
          map(() => annonceActions.actionSuccess({ id, action: 'pause' })),
          catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  reactiver$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.reactiver),
      switchMap(({ id }) =>
        this.annonceApi.reactiver(id).pipe(
          map(() => annonceActions.actionSuccess({ id, action: 'reactiver' })),
          catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  renouveler$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.renouveler),
      switchMap(({ id }) =>
        this.annonceApi.renouveler(id).pipe(
          map(() => annonceActions.actionSuccess({ id, action: 'renouveler' })),
          catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  actionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.actionSuccess),
      tap(({ action }) => {
        const messages: Record<string, string> = {
          pause:      'Annonce mise en pause',
          reactiver:  'Annonce réactivée',
          renouveler: 'Annonce renouvelée pour 30 jours',
          archiver:   'Annonce archivée',
          supprimer:  'Annonce supprimée',
        };
        this.toast.success(messages[action] ?? 'Action effectuée');
      })
    ), { dispatch: false }
  );

  loadMesAnnonces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.loadMesAnnonces),
      switchMap(({ filters }) =>
        this.annonceApi.getMesAnnonces(filters).pipe(
          map(res => annonceActions.loadMesAnnoncesSuccess({ page: res.data })),
          catchError(err => of(annonceActions.loadAnnoncesFailure({ error: err.error?.message })))
        )
      )
    )
  );
}
EOF
OK "Store Annonce"

# =============================================================================
# 5. STORE FAVORI
# =============================================================================
SECTION "5/6 — Store Favori"

mkdir -p "$STORE/favori"

cat > "$STORE/favori/favori.actions.ts" << 'EOF'
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FavoriResponse } from '@core/models';

export const favoriActions = createActionGroup({
  source: 'Favori',
  events: {
    'Load':         emptyProps(),
    'Load Success': props<{ favoris: FavoriResponse[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Add':          props<{ annonceId: number }>(),
    'Add Success':  props<{ annonceId: number }>(),
    'Remove':       props<{ annonceId: number }>(),
    'Remove Success': props<{ annonceId: number }>(),
    'Action Failure': props<{ error: string }>(),
    'Clear':        emptyProps(),
  },
});
EOF

cat > "$STORE/favori/favori.reducer.ts" << 'EOF'
import { createReducer, on } from '@ngrx/store';
import { FavoriResponse } from '@core/models';
import { favoriActions } from './favori.actions';

export interface FavoriState {
  items:   FavoriResponse[];
  ids:     Set<number>;
  loading: boolean;
  error:   string | null;
}

const initialState: FavoriState = {
  items:   [],
  ids:     new Set(),
  loading: false,
  error:   null,
};

export const favoriReducer = createReducer(
  initialState,
  on(favoriActions.load,        s => ({ ...s, loading: true })),
  on(favoriActions.loadSuccess, (s, { favoris }) => ({
    ...s, loading: false,
    items: favoris,
    ids: new Set(favoris.map(f => f.annonceId)),
  })),
  on(favoriActions.loadFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(favoriActions.addSuccess, (s, { annonceId }) => ({
    ...s, ids: new Set([...s.ids, annonceId])
  })),
  on(favoriActions.removeSuccess, (s, { annonceId }) => {
    const ids = new Set(s.ids);
    ids.delete(annonceId);
    return { ...s, ids, items: s.items.filter(f => f.annonceId !== annonceId) };
  }),
  on(favoriActions.clear, () => initialState),
);
EOF

cat > "$STORE/favori/favori.selectors.ts" << 'EOF'
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FavoriState } from './favori.reducer';

const selectFavoriState = createFeatureSelector<FavoriState>('favori');

export const selectFavoris        = createSelector(selectFavoriState, s => s.items);
export const selectFavoriIds      = createSelector(selectFavoriState, s => s.ids);
export const selectFavoriLoading  = createSelector(selectFavoriState, s => s.loading);
export const isFavori = (annonceId: number) =>
  createSelector(selectFavoriIds, ids => ids.has(annonceId));
EOF

cat > "$STORE/favori/favori.effects.ts" << 'EOF'
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, map, switchMap, catchError, tap } from 'rxjs';
import { favoriActions } from './favori.actions';
import { annonceActions } from '@store/annonce/annonce.actions';
import { FavoriApi } from '@core/services/api/favori.api';
import { ToastService } from '@core/services/toast.service';

@Injectable()
export class FavoriEffects {
  private readonly actions$  = inject(Actions);
  private readonly favoriApi = inject(FavoriApi);
  private readonly toast     = inject(ToastService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.load),
      switchMap(() =>
        this.favoriApi.getMesFavoris().pipe(
          map(res => favoriActions.loadSuccess({ favoris: res.data })),
          catchError(err => of(favoriActions.loadFailure({ error: err.error?.message })))
        )
      )
    )
  );

  add$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.add),
      switchMap(({ annonceId }) =>
        this.favoriApi.ajouter(annonceId).pipe(
          map(() => favoriActions.addSuccess({ annonceId })),
          catchError(err => of(favoriActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  addSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.addSuccess),
      tap(({ annonceId }) => {
        this.toast.success('Ajouté aux favoris');
      }),
      map(({ annonceId }) => annonceActions.toggleFavoriLocal({ id: annonceId, isFavori: true }))
    )
  );

  remove$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.remove),
      switchMap(({ annonceId }) =>
        this.favoriApi.retirer(annonceId).pipe(
          map(() => favoriActions.removeSuccess({ annonceId })),
          catchError(err => of(favoriActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  removeSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.removeSuccess),
      tap(() => this.toast.info('Retiré des favoris')),
      map(({ annonceId }) => annonceActions.toggleFavoriLocal({ id: annonceId, isFavori: false }))
    )
  );
}
EOF
OK "Store Favori"

# =============================================================================
# 6. MOCK DATA + INTERCEPTOR
# =============================================================================
SECTION "6/6 — Mock Data + Interceptor HTTP"

cat > "$MOCK/mock-data.factory.ts" << 'EOF'
// =============================================================================
// IMMOCAM — Factory de données mock réalistes
// Utilise des données fixes (pas de Faker.js pour éviter la dépendance au build)
// Simule exactement la structure des DTOs Spring Boot
// =============================================================================

import { StatutAnnonce } from '@core/models';

const VILLES_QUARTIERS: Record<string, string[]> = {
  'Douala':    ['Bonanjo', 'Akwa', 'Deido', 'Bali', 'New Bell', 'Bonabéri', 'Makepe', 'Kotto'],
  'Yaoundé':  ['Bastos', 'Centre-ville', 'Nlongkak', 'Messa', 'Biyem-Assi', 'Mendong', 'Omnisport'],
  'Bafoussam':['Quartier Commercial', 'Djeleng', 'Tamdja'],
  'Kribi':    ['Plage', 'Centre', 'Grand Batanga'],
  'Limbé':    ['Down Beach', 'Mile 4', 'Bota'],
};

const TYPE_BIENS = [
  { id: 1, nom: 'Appartement', icone: '🏢' },
  { id: 2, nom: 'Studio',      icone: '🏠' },
  { id: 3, nom: 'Villa',       icone: '🏡' },
  { id: 4, nom: 'Maison',      icone: '🏘️' },
  { id: 5, nom: 'Bureau',      icone: '🏢' },
  { id: 6, nom: 'Boutique',    icone: '🏪' },
  { id: 7, nom: 'Chambre',     icone: '🛏️' },
  { id: 8, nom: 'Terrain',     icone: '🌱' },
];

const DESCRIPTIONS = [
  'Bel appartement moderne entièrement rénové, avec cuisine équipée, salon spacieux, 2 chambres climatisées. Eau et électricité disponibles 24h/24. Gardiennage assuré.',
  'Studio meublé idéal pour étudiant ou jeune professionnel. Situé en face du marché, proche des transports. Cuisine équipée, douche moderne.',
  'Magnifique villa avec piscine, 4 chambres, 3 salles de bains, garage 2 voitures. Jardin sécurisé. Idéale pour famille expatriée.',
  'Maison de ville avec cour, 3 chambres, salon, cuisine équipée. Connexion internet fibre disponible dans le quartier.',
  'Bureau en rez-de-chaussée, surface 45m², climatisé, salle de réunion partagée, parking. Idéal pour petite entreprise ou freelance.',
  'Boutique en bord de rue principale, forte visibilité, 30m², bail 1 an minimum. Électricité triphasée disponible.',
  'Chambre meublée chez particulier, salle de bain privée, wifi inclus, cuisine partagée. Ambiance calme et sécurisée.',
  'Grand appartement 3 chambres avec vue sur le fleuve, terrasse, parking souterrain. Immeuble sécurisé avec gardien.',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function formatPrix(prix: number): string {
  return new Intl.NumberFormat('fr-CM').format(prix) + ' FCFA';
}

export function generateAnnonces(count = 50): any[] {
  const annonces = [];
  const statuts = [
    StatutAnnonce.ACTIVE, StatutAnnonce.ACTIVE, StatutAnnonce.ACTIVE,
    StatutAnnonce.ACTIVE, StatutAnnonce.EN_PAUSE, StatutAnnonce.EXPIREE
  ];

  for (let i = 1; i <= count; i++) {
    const ville    = randomItem(Object.keys(VILLES_QUARTIERS));
    const quartier = randomItem(VILLES_QUARTIERS[ville]);
    const typeBien = randomItem(TYPE_BIENS);
    const prix     = randomInt(25, 500) * 5000;
    const pubDate  = addDays(new Date(), -randomInt(0, 25));
    const expDate  = addDays(pubDate, 30);
    const statut   = i <= 40 ? StatutAnnonce.ACTIVE : randomItem(statuts);

    annonces.push({
      id:                  i,
      typeBien:            typeBien.nom,
      typeBienId:          typeBien.id,
      ville,
      quartier,
      prix,
      prixFormate:         formatPrix(prix),
      statut,
      photoPrincipale:     `https://picsum.photos/seed/annonce${i}/800/500`,
      photoPrincipaleThumb:`https://picsum.photos/seed/annonce${i}/400/250`,
      hasPhotos:           true,
      datePublication:     formatDate(pubDate),
      dateExpiration:      formatDate(expDate),
      nombreVues:          randomInt(5, 890),
      nombreCommentaires:  randomInt(0, 12),
      nombreContacts:      randomInt(0, 45),
      isFavori:            false,
      description:         randomItem(DESCRIPTIONS),
      proprietairePrenom:  randomItem(['Jean', 'Marie', 'Paul', 'Aimé', 'Grace', 'Bertrand']),
      localisationId:      i,
      photos: Array.from({ length: randomInt(1, 4) }, (_, j) => ({
        id:         i * 10 + j,
        url:        `https://picsum.photos/seed/photo${i}${j}/800/500`,
        urlThumb:   `https://picsum.photos/seed/photo${i}${j}/400/250`,
        ordre:      j,
        principale: j === 0,
      })),
      commentaires: i % 3 === 0 ? [
        {
          id: i * 100,
          auteurPrenom: 'Jean',
          contenu: 'Est-ce que l\'appartement est encore disponible ?',
          dateCreation: formatDate(addDays(new Date(), -2)),
          estProprietaire: false,
          estMien: false,
          reponse: {
            id: i * 100 + 1,
            contenu: 'Oui, toujours disponible. Contactez-moi sur WhatsApp.',
            dateCreation: formatDate(addDays(new Date(), -1)),
          }
        }
      ] : [],
    });
  }
  return annonces;
}

export const MOCK_LOCALISATIONS: any[] = Object.entries(VILLES_QUARTIERS).flatMap(
  ([ville, quartiers], vi) =>
    quartiers.map((quartier, qi) => ({
      id: vi * 100 + qi,
      ville, quartier, active: true
    }))
);

export const MOCK_TYPE_BIENS = TYPE_BIENS.map(t => ({ ...t, active: true }));

export const MOCK_VILLES = Object.keys(VILLES_QUARTIERS);

export const MOCK_USER = {
  id: 1,
  prenom: 'Franck',
  nom: 'Tchinda',
  nomComplet: 'Franck Tchinda',
  email: 'franck@mbemnova.com',
  telephone: '+237691877527',
  ville: 'Douala',
  role: 'UTILISATEUR',
  statut: 'ACTIF',
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
  role: 'ADMINISTRATEUR',
};

export const MOCK_AUTH_RESPONSE = {
  accessToken:  'mock_access_token_immocam_2026',
  refreshToken: 'mock_refresh_token_immocam_2026',
  tokenType:    'Bearer',
  expiresIn:    3600,
  utilisateur:  MOCK_USER,
};
EOF
OK "mock-data.factory.ts"

cat > "$MOCK/mock.interceptor.ts" << 'EOF'
// =============================================================================
// IMMOCAM — Intercepteur Mock HTTP
// Intercept toutes les requêtes API et retourne des données simulées
// Activé si environment.useMock === true
// =============================================================================

import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from '@environments/environment';
import {
  generateAnnonces, MOCK_LOCALISATIONS, MOCK_TYPE_BIENS,
  MOCK_VILLES, MOCK_USER, MOCK_AUTH_RESPONSE, MOCK_ADMIN_USER
} from './mock-data.factory';

// Données générées une seule fois (singleton)
let _annonces: any[] | null = null;
function getAnnonces() {
  if (!_annonces) _annonces = generateAnnonces(50);
  return _annonces;
}

function page<T>(items: T[], pageNum = 0, size = 12) {
  const start = pageNum * size;
  const content = items.slice(start, start + size);
  return {
    content,
    page:           pageNum,
    size,
    totalElements:  items.length,
    totalPages:     Math.ceil(items.length / size),
    first:          pageNum === 0,
    last:           start + size >= items.length,
    empty:          content.length === 0,
    numberOfElements: content.length,
  };
}

function ok(data: any, message = 'Succès') {
  return new HttpResponse({
    status: 200,
    body: { success: true, message, data }
  });
}

function parseParams(url: string): URLSearchParams {
  const q = url.includes('?') ? url.split('?')[1] : '';
  return new URLSearchParams(q);
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock) return next(req);

  const url    = req.url.replace(environment.apiUrl, '');
  const method = req.method;
  const params = parseParams(req.url);

  let responseData: any = null;
  const mockDelay = environment.mockDelay ?? 600;

  // ─── AUTH ───────────────────────────────────────────────────────────────
  if (url.includes('/auth/login') && method === 'POST') {
    const body: any = req.body;
    // Admin login
    if (body?.email?.includes('admin')) {
      responseData = ok({ ...MOCK_AUTH_RESPONSE, utilisateur: MOCK_ADMIN_USER });
    } else {
      responseData = ok(MOCK_AUTH_RESPONSE);
    }
  }
  else if (url.includes('/auth/register') && method === 'POST') {
    responseData = ok({ email: (req.body as any)?.email });
  }
  else if (url.includes('/auth/verify-email')) {
    responseData = ok(MOCK_AUTH_RESPONSE);
  }
  else if (url.includes('/auth/resend-code')) {
    responseData = ok(null, 'Code renvoyé');
  }
  else if (url.includes('/auth/refresh')) {
    responseData = ok(MOCK_AUTH_RESPONSE);
  }
  else if (url.includes('/auth/logout')) {
    responseData = ok(null, 'Déconnecté');
  }
  else if (url.includes('/auth/forgot-password')) {
    responseData = ok(null, 'Email envoyé');
  }
  else if (url.includes('/auth/reset-password')) {
    responseData = ok(null, 'Mot de passe modifié');
  }
  else if (url.includes('/auth/me') || url.includes('/utilisateurs/me') && method === 'GET') {
    responseData = ok(MOCK_USER);
  }

  // ─── ANNONCES ───────────────────────────────────────────────────────────
  else if (url.match(/\/annonces\/\d+\/pause/) && method === 'PATCH') {
    responseData = ok(null, 'Annonce mise en pause');
  }
  else if (url.match(/\/annonces\/\d+\/reactiver/) && method === 'PATCH') {
    responseData = ok(null, 'Annonce réactivée');
  }
  else if (url.match(/\/annonces\/\d+\/renouveler/) && method === 'PATCH') {
    responseData = ok(null, 'Annonce renouvelée');
  }
  else if (url.match(/\/annonces\/\d+\/archiver/) && method === 'PATCH') {
    responseData = ok(null, 'Annonce archivée');
  }
  else if (url.match(/\/annonces\/\d+\/photos/) && method === 'POST') {
    responseData = ok([{ id: 999, url: 'https://picsum.photos/800/500', urlThumb: 'https://picsum.photos/400/250', ordre: 0, principale: true }]);
  }
  else if (url.match(/\/annonces\/\d+\/photos\/\d+/) && method === 'DELETE') {
    responseData = ok(null);
  }
  else if (url.includes('/annonces/mes-annonces')) {
    const all = getAnnonces().slice(0, 5);
    responseData = ok(page(all, 0, 12));
  }
  else if (url.includes('/annonces/dashboard-stats')) {
    responseData = ok({
      nombreAnnoncesActives: 3,
      nombreAnnoncesTotal:   5,
      nombreContactsTotal:   47,
      nombreFavorisTotal:    12,
      nombreVuesTotal:       1284,
      annoncesExpirantBientot: getAnnonces().slice(0, 2),
    });
  }
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'GET') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)?.[1] ?? '1');
    const found = getAnnonces().find((a: any) => a.id === id);
    responseData = found ? ok(found) : new HttpResponse({ status: 404, body: { success: false, message: 'Annonce introuvable' } });
  }
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'DELETE') {
    responseData = ok(null, 'Annonce supprimée');
  }
  else if (url.includes('/annonces') && method === 'GET') {
    let all = getAnnonces().filter((a: any) => a.statut === 'ACTIVE');
    const ville = params.get('ville');
    const typeId = params.get('typeBienId');
    const prixMin = params.get('prixMin');
    const prixMax = params.get('prixMax');
    const motCle = params.get('motCle');
    if (ville) all = all.filter((a: any) => a.ville.toLowerCase() === ville.toLowerCase());
    if (typeId) all = all.filter((a: any) => a.typeBienId === parseInt(typeId));
    if (prixMin) all = all.filter((a: any) => a.prix >= parseInt(prixMin));
    if (prixMax) all = all.filter((a: any) => a.prix <= parseInt(prixMax));
    if (motCle) all = all.filter((a: any) =>
      a.description.toLowerCase().includes(motCle.toLowerCase()) ||
      a.quartier.toLowerCase().includes(motCle.toLowerCase())
    );
    const p = parseInt(params.get('page') ?? '0');
    const s = parseInt(params.get('size') ?? '12');
    responseData = ok(page(all, p, s));
  }
  else if (url.includes('/annonces') && method === 'POST') {
    const body: any = req.body;
    const newAnnonce = {
      id: Date.now(),
      ...body,
      typeBien: MOCK_TYPE_BIENS.find(t => t.id === body.typeBienId)?.nom ?? 'Bien',
      ville: MOCK_LOCALISATIONS.find(l => l.id === body.localisationId)?.ville ?? 'Douala',
      quartier: MOCK_LOCALISATIONS.find(l => l.id === body.localisationId)?.quartier ?? 'Centre',
      prixFormate: new Intl.NumberFormat('fr-CM').format(body.prix) + ' FCFA',
      statut: 'ACTIVE',
      hasPhotos: false,
      datePublication: new Date().toISOString(),
      dateExpiration: new Date(Date.now() + 30 * 86400000).toISOString(),
      nombreVues: 0, nombreCommentaires: 0, nombreContacts: 0,
      photos: [], commentaires: [], proprietairePrenom: MOCK_USER.prenom,
    };
    getAnnonces().unshift(newAnnonce);
    responseData = ok(newAnnonce, 'Annonce publiée');
  }

  // ─── FAVORIS ────────────────────────────────────────────────────────────
  else if (url.includes('/favoris/check/')) {
    responseData = ok({ isFavori: false });
  }
  else if (url.includes('/favoris') && method === 'GET') {
    responseData = ok(getAnnonces().slice(0, 4).map((a: any, i: number) => ({
      id: i + 1, annonceId: a.id, typeBien: a.typeBien,
      ville: a.ville, quartier: a.quartier, prix: a.prix,
      prixFormate: a.prixFormate, photoPrincipaleThumb: a.photoPrincipaleThumb,
      statut: a.statut, dateAjout: new Date().toISOString(),
    })));
  }
  else if (url.includes('/favoris') && method === 'POST') {
    responseData = ok(null, 'Ajouté aux favoris');
  }
  else if (url.includes('/favoris') && method === 'DELETE') {
    responseData = ok(null, 'Retiré des favoris');
  }

  // ─── COMMENTAIRES ────────────────────────────────────────────────────────
  else if (url.includes('/commentaires') && method === 'POST') {
    const body: any = req.body;
    responseData = ok({
      id: Date.now(), auteurPrenom: MOCK_USER.prenom,
      contenu: body.contenu ?? '', dateCreation: new Date().toISOString(),
      estProprietaire: false, estMien: true,
    }, 'Commentaire publié');
  }
  else if (url.match(/\/commentaires\/\d+\/reponse/)) {
    responseData = ok({ id: Date.now(), contenu: (req.body as any)?.contenu, dateCreation: new Date().toISOString() });
  }
  else if (url.includes('/commentaires') && method === 'DELETE') {
    responseData = ok(null, 'Commentaire supprimé');
  }

  // ─── CONTACTS ────────────────────────────────────────────────────────────
  else if (url.includes('/contacts/mes-contacts')) {
    responseData = ok(page([], 0));
  }
  else if (url.includes('/contacts/annonce/')) {
    responseData = ok([
      { id: 1, utilisateurTelephone: '+237691234567', utilisateurPrenom: 'Jean', annonceId: 1, annonceTitre: 'Appartement Akwa', dateContact: new Date().toISOString() },
      { id: 2, utilisateurTelephone: '+237698765432', utilisateurPrenom: 'Marie', annonceId: 1, annonceTitre: 'Appartement Akwa', dateContact: new Date(Date.now() - 86400000).toISOString() },
    ]);
  }
  else if (url.includes('/contacts') && method === 'POST') {
    const id = parseInt((req.body as any)?.annonceId ?? '1');
    const annonce = getAnnonces().find((a: any) => a.id === id);
    const phone = '237691877527'; // Mock proprietaire
    const message = encodeURIComponent(
      `Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : ${annonce?.typeBien ?? 'Bien'} à ${annonce?.quartier ?? 'Douala'}, ${annonce?.ville ?? 'Cameroun'} — ${annonce?.prixFormate ?? ''} FCFA. Est-il toujours disponible ?`
    );
    responseData = ok({ whatsappUrl: `https://wa.me/${phone}?text=${message}` });
  }

  // ─── SIGNALEMENTS ────────────────────────────────────────────────────────
  else if (url.includes('/signalements') && method === 'POST') {
    responseData = ok(null, 'Signalement enregistré. Merci !');
  }

  // ─── LOCALISATIONS ────────────────────────────────────────────────────────
  else if (url.includes('/localisations/villes')) {
    responseData = ok(MOCK_VILLES);
  }
  else if (url.includes('/localisations/quartiers')) {
    const ville = params.get('ville') ?? 'Douala';
    responseData = ok(
      MOCK_LOCALISATIONS.filter(l => l.ville.toLowerCase() === ville.toLowerCase())
    );
  }
  else if (url.includes('/localisations') && method === 'GET') {
    responseData = ok(MOCK_LOCALISATIONS);
  }
  else if (url.includes('/localisations') && method === 'POST') {
    responseData = ok(null, 'Localisation ajoutée');
  }

  // ─── TYPE BIENS ───────────────────────────────────────────────────────────
  else if (url.includes('/typebien') && method === 'GET') {
    responseData = ok(MOCK_TYPE_BIENS);
  }

  // ─── UTILISATEUR ──────────────────────────────────────────────────────────
  else if (url.includes('/utilisateurs/me') && method === 'PUT') {
    responseData = ok({ ...MOCK_USER, ...(req.body as any) });
  }
  else if (url.includes('/utilisateurs/me/password')) {
    responseData = ok(null, 'Mot de passe modifié');
  }
  else if (url.includes('/utilisateurs/me') && method === 'DELETE') {
    responseData = ok(null, 'Compte supprimé');
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  else if (url.includes('/admin/dashboard')) {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split('T')[0], valeur: Math.floor(Math.random() * 100) + 20 };
    });
    responseData = ok({
      visitesTotales: 12450, visitesTotales7j: 1830, visitesTotales30j: 7200,
      annoncesActives: 42, nouvellesAnnonces: 8, nouvellesAnnonces7j: 23,
      nouveauxInscrits: 5, nouveauxInscrits7j: 18,
      contactsWhatsapp: 67, contactsWhatsapp7j: 234,
      commentairesPublies: 12, commentairesPublies7j: 45,
      signalEmentsNonTraites: 3,
      evolutionVisites: dates,
      evolutionContacts: dates.map(d => ({ ...d, valeur: Math.floor(d.valeur * 0.4) })),
      evolutionPublications: dates.map(d => ({ ...d, valeur: Math.floor(d.valeur * 0.15) })),
      villesActives: [
        { ville: 'Douala', nombreAnnonces: 28 },
        { ville: 'Yaoundé', nombreAnnonces: 18 },
        { ville: 'Bafoussam', nombreAnnonces: 6 },
      ],
      typesBiensPopulaires: [
        { typeBien: 'Appartement', nombreAnnonces: 22 },
        { typeBien: 'Studio', nombreAnnonces: 14 },
        { typeBien: 'Maison', nombreAnnonces: 8 },
      ],
    });
  }
  else if (url.includes('/admin/annonces') && method === 'GET') {
    const p = parseInt(params.get('page') ?? '0');
    responseData = ok(page(getAnnonces(), p, 20));
  }
  else if (url.includes('/admin/annonces') && method === 'DELETE') {
    responseData = ok(null, 'Annonce supprimée par admin');
  }
  else if (url.includes('/admin/utilisateurs') && method === 'GET') {
    const mockUsers = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      prenom: ['Jean', 'Marie', 'Paul', 'Aimé', 'Grace'][i % 5],
      nom: ['Ngono', 'Talla', 'Fotso', 'Essomba', 'Biya'][i % 5],
      nomComplet: `Utilisateur ${i + 1}`,
      email: `user${i + 1}@example.com`,
      telephone: `+23769${String(i).padStart(7, '0')}`,
      ville: MOCK_VILLES[i % MOCK_VILLES.length],
      role: 'UTILISATEUR', statut: 'ACTIF', emailVerifie: true,
      dateInscription: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      nombreAnnonces: Math.floor(Math.random() * 5),
      nombreConnexions: Math.floor(Math.random() * 50),
    }));
    const p = parseInt(params.get('page') ?? '0');
    responseData = ok(page(mockUsers, p, 20));
  }
  else if (url.includes('/admin/signalements') && method === 'GET') {
    responseData = ok(page([
      { id: 1, annonceId: 3, annonceTitre: 'Appartement Akwa', auteurPrenom: 'Jean', auteurEmail: 'jean@test.cm', motif: 'ANNONCE_FRAUDULEUSE', statut: 'EN_ATTENTE', dateSignalement: new Date().toISOString() },
      { id: 2, annonceId: 7, annonceTitre: 'Studio Bastos', auteurPrenom: 'Marie', auteurEmail: 'marie@test.cm', motif: 'PRIX_INCORRECT', statut: 'EN_ATTENTE', dateSignalement: new Date(Date.now() - 86400000).toISOString() },
    ], 0));
  }
  else if (url.includes('/admin/signalements') && method === 'PUT') {
    responseData = ok(null, 'Signalement traité');
  }
  else if (url.includes('/admin/commentaires') && method === 'GET') {
    responseData = ok(page([], 0));
  }
  else if (url.includes('/admin/config') && method === 'GET') {
    responseData = ok({
      dureeVieAnnonce: 30, joursRappelExpiration: 5, joursSuppressionDefinitive: 7,
      maxPhotosParAnnonce: 4, maxAnnoncesParProprietaire: 5,
      messageWhatsappDefaut: 'Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : {type} à {quartier}, {ville} — {prix} FCFA. Est-il toujours disponible ?',
      rateLimit: 100, schedulerEnabled: true,
    });
  }
  else if (url.includes('/admin/config') && method === 'PUT') {
    responseData = ok(req.body, 'Configuration mise à jour');
  }
  else if (url.includes('/admin/') && (method === 'POST')) {
    responseData = ok(null, 'Action effectuée');
  }
  else if (url.includes('/admin/exports/')) {
    responseData = new HttpResponse({
      status: 200,
      body: new Blob(['id,titre,ville\n1,Appartement,Douala'], { type: 'text/csv' })
    });
  }

  // ─── Route non mockée → passe au vrai HTTP ────────────────────────────────
  if (!responseData) {
    console.warn(`[MOCK] Route non couverte: ${method} ${url} → envoi vers API réelle`);
    return next(req);
  }

  return of(responseData).pipe(delay(mockDelay));
};
EOF
OK "mock.interceptor.ts (toutes routes couvertes)"

# Index mock
cat > "$MOCK/index.ts" << 'EOF'
export * from './mock.interceptor';
export * from './mock-data.factory';
EOF

# =============================================================================
# APP CONFIG (providers NgRx + interceptors)
# =============================================================================
SECTION "— app.config.ts (providers globaux)"

cat > src/app/app.config.ts << 'EOF'
import { ApplicationConfig, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authReducer }   from './store/auth/auth.reducer';
import { annonceReducer } from './store/annonce/annonce.reducer';
import { favoriReducer }  from './store/favori/favori.reducer';
import { uiReducer }      from './store/ui/ui.reducer';
import { AuthEffects }    from './store/auth/auth.effects';
import { AnnonceEffects } from './store/annonce/annonce.effects';
import { FavoriEffects }  from './store/favori/favori.effects';
import { authInterceptor }    from './core/interceptors/auth.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor }   from './core/interceptors/error.interceptor';
import { mockInterceptor }    from './core/mock/mock.interceptor';
import { AuthService }  from './core/services/auth.service';
import { environment }  from '@environments/environment';

function initApp(authService: AuthService) {
  return () => authService.initFromStorage();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
    ),
    provideAnimationsAsync(),

    // HTTP — ordre important: mock en premier si activé
    provideHttpClient(
      withInterceptors([
        ...(environment.useMock ? [mockInterceptor] : []),
        authInterceptor,
        refreshInterceptor,
        loadingInterceptor,
        errorInterceptor,
      ])
    ),

    // NgRx Store
    provideStore({
      auth:    authReducer,
      annonce: annonceReducer,
      favori:  favoriReducer,
      ui:      uiReducer,
    }),

    // NgRx Effects
    provideEffects([AuthEffects, AnnonceEffects, FavoriEffects]),

    // NgRx DevTools (dev uniquement)
    provideStoreDevtools({
      maxAge:   25,
      logOnly:  !isDevMode(),
      autoPause: true,
      trace:    false,
    }),

    // Initialisation app
    {
      provide:    APP_INITIALIZER,
      useFactory: initApp,
      deps:       [AuthService],
      multi:      true,
    },
  ],
};
EOF
OK "app.config.ts"

# Route placeholder (sera complet dans le script 12)
cat > src/app/app.routes.ts << 'EOF'
import { Routes } from '@angular/router';

// Routes complètes générées dans ng-12-finalize.sh
// Placeholder pour permettre la compilation
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home',   loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: '**',     redirectTo: '/home' },
];
EOF
OK "app.routes.ts (placeholder)"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 03 TERMINÉ — STORE + MOCK DATA${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "NgRx Store: Auth + Annonce + Favori + UI"
INFO "Mock Interceptor: 45+ routes couvertes, 50 annonces réalistes"
INFO "Toggle mock/api: environment.ts → useMock: true/false"
INFO "app.config.ts: providers complets"
echo ""
WARN "Prochaine étape: bash ../ng-04-shared-components.sh"
