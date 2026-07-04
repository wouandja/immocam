// =============================================================================
// IMMOCAM — Configuration applicative complète
// Providers: Router | HTTP | NgRx Store | Animations | APP_INITIALIZER
// =============================================================================
import {
  ApplicationConfig,
  isDevMode,
  APP_INITIALIZER,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withComponentInputBinding,
  withViewTransitions,
  withInMemoryScrolling,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';
import { provideAnimationsAsync }  from '@angular/platform-browser/animations/async';
import { provideStore, Store }            from '@ngrx/store';
import { provideEffects }          from '@ngrx/effects';
import { provideStoreDevtools }    from '@ngrx/store-devtools';
import { provideRouterStore }      from '@ngrx/router-store';

import { routes }         from './app.routes';

// Reducers
import { authReducer }    from './store/auth/auth.reducer';
import { annonceReducer } from './store/annonce/annonce.reducer';
import { favoriReducer }  from './store/favori/favori.reducer';
import { uiReducer }      from './store/ui/ui.reducer';

// Effects
import { AuthEffects }    from './store/auth/auth.effects';
import { AnnonceEffects } from './store/annonce/annonce.effects';
import { FavoriEffects }  from './store/favori/favori.effects';

// Interceptors
import { authInterceptor }    from './core/interceptors/auth.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor }   from './core/interceptors/error.interceptor';
import { mockInterceptor }    from './core/mock/mock.interceptor';

// Services
import { AuthService }    from './core/services/auth.service';

// Environment
import { environment }    from '../environments/environment';
import { authActions } from '@store/auth/auth.actions';

// ─── Initialisation app ───────────────────────────────────────────────────────

// Remettre AuthService, pas Store
function initializeApp(authService: AuthService, store: Store) {
  return (): void => {
    authService.initFromStorage();
    store.dispatch(authActions.init()); // ← dispatch l'init NgRx
  };
}

// ─── Interceptors ordonnés ────────────────────────────────────────────────────
// ORDRE CRITIQUE :
// 1. mockInterceptor  → intercepte en premier si useMock=true
// 2. authInterceptor  → injecte le Bearer token
// 3. refreshInterceptor → rafraîchit le token sur 401
// 4. loadingInterceptor → active/désactive le spinner
// 5. errorInterceptor   → affiche les toasts d'erreur

const httpInterceptors = [
  ...(environment.useMock ? [mockInterceptor] : []),
  authInterceptor,
  refreshInterceptor,
  loadingInterceptor,
  errorInterceptor,
];

// ─── Configuration principale ─────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [

    // Zone detection optimisée
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router avec lazy loading, scroll, view transitions
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),

    // Animations asynchrones (Material + CSS)
    provideAnimationsAsync(),

    // HTTP client avec interceptors ordonnés + fetch API
    provideHttpClient(
      withInterceptors(httpInterceptors),
      withFetch(),
    ),

    // ── NgRx Store ─────────────────────────────────────────────────────────
    provideStore({
      auth:    authReducer,
      annonce: annonceReducer,
      favori:  favoriReducer,
      ui:      uiReducer,
    }),

    // NgRx Effects
    provideEffects([
      AuthEffects,
      AnnonceEffects,
      FavoriEffects,
    ]),

    // NgRx Router Store (synchronise router state avec NgRx)
    provideRouterStore(),

    // NgRx DevTools (dev uniquement)
    provideStoreDevtools({
      maxAge:        25,
      logOnly:       !isDevMode(),
      autoPause:     true,
      trace:         false,
      traceLimit:    75,
      name:          'Bailocam NgRx',
    }),

    // ── Initialisation app ─────────────────────────────────────────────────
    {
      provide:    APP_INITIALIZER,
      useFactory: initializeApp,
    deps:       [AuthService, Store], // ← ajoute Store
      multi:      true,
    },

  ],
};
