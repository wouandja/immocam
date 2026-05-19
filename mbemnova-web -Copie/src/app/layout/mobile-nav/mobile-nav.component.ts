import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn, selectIsAdmin } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="immocam-mobile-nav" role="navigation" aria-label="Navigation mobile">

      <!-- Accueil -->
      <a routerLink="/"
         routerLinkActive="nav-active"
         [routerLinkActiveOptions]="{ exact: true }"
         class="nav-tab"
         aria-label="Accueil"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 11L10 4.5L17 11M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
        </svg>
        <span>Accueil</span>
      </a>

      <!-- Annonces -->
      <a routerLink="/annonces"
         routerLinkActive="nav-active"
         class="nav-tab"
         aria-label="Annonces"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7h18M3 12h18M3 17h18"/>
        </svg>
        <span>Annonces</span>
      </a>

      <!-- Publier -->
      <a routerLink="/annonces/creer"
         routerLinkActive="nav-active"
         class="nav-tab"
         aria-label="Publier"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>
        </svg>
        <span>Publier</span>
      </a>

      <!-- Favoris (connecté) | Connexion (non connecté) -->
      @if (isLoggedIn()) {
        <a routerLink="/dashboard/mes-favoris"
           routerLinkActive="nav-active"
           class="nav-tab"
           aria-label="Favoris"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span>Favoris</span>
        </a>

        <a routerLink="/dashboard"
           routerLinkActive="nav-active"
           class="nav-tab"
           aria-label="Mon espace"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>Moi</span>
        </a>

      } @else {
        <a routerLink="/auth/login"
           routerLinkActive="nav-active"
           class="nav-tab"
           aria-label="Connexion"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
          </svg>
          <span>Connexion</span>
        </a>
      }

    </nav>

    <!-- Spacer bas de page -->
    <div class="immocam-mobile-spacer"></div>
  `,
  styles: [`
    /* ─── VISIBLE UNIQUEMENT < 640px ─────────────────── */
    .immocam-mobile-nav {
      display: none !important;
    }
    .immocam-mobile-spacer {
      display: none !important;
    }

    @media (max-width: 639px) {
      .immocam-mobile-nav {
        display: flex !important;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: #ffffff;
        border-top: 1px solid rgba(148, 163, 184, 0.18);
        align-items: center;
        height: 60px;
        padding-bottom: env(safe-area-inset-bottom);
        font-family: 'DM Sans', sans-serif;
      }

      .immocam-mobile-spacer {
        display: block !important;
        height: calc(60px + env(safe-area-inset-bottom));
      }
    }

    /* ─── ITEMS ───────────────────────────────────────── */
    .nav-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 8px 2px;
      text-decoration: none;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      transition: color 0.12s;
      -webkit-tap-highlight-color: transparent;
      min-width: 0;
    }

    .nav-tab span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    .nav-active {
      color: #1e3a5f !important;
    }
  `]
})
export class MobileNavComponent {
  private readonly store = inject(Store);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly isAdmin    = this.store.selectSignal(selectIsAdmin);
}