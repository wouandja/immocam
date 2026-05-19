import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  styles: [`
    :host { display: block; }

    .shell {
      max-width: 960px;
      margin: 0 auto;
      padding: 34px 16px 40px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .header-greeting {
      font-size: 18px;
      font-weight: 500;
      color: var(--color-text-primary);
      line-height: 1.2;
    }
    .header-sub {
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-top: 3px;
    }

    .btn-publish {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #1e3a5f;
      color: #fff !important;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: opacity .15s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .btn-publish:hover { opacity: .85; }
    .btn-publish svg { width: 14px; height: 14px; flex-shrink: 0; }

    .tab-nav {
      display: flex;
      gap: 2px;
      background: var(--color-background-secondary, #f5f5f3);
      border: 0.5px solid var(--color-border-tertiary);
      border-radius: 10px;
      padding: 3px;
      margin-bottom: 20px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tab-nav::-webkit-scrollbar { display: none; }

    .tab-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 400;
      color: var(--color-text-secondary);
      text-decoration: none;
      white-space: nowrap;
      flex: 1;
      transition: color .15s;
      border: 0.5px solid transparent;
    }
    .tab-item:hover { color: var(--color-text-primary); }

    .tab-item svg {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    .tab-item.active {
      background: var(--color-background-primary, #fff);
      border-color: var(--color-border-tertiary);
      color: #1e3a5f;
      font-weight: 500;
    }

    .tab-label { display: none; }
    @media (min-width: 400px) { .tab-label { display: inline; } }
  `],
  template: `
    <div class="shell">

      <!-- Header -->
      <div class="header">
        <div>
          <div class="header-greeting">Bonjour, {{ user()?.prenom }}</div>
          <div class="header-sub">Gérez vos annonces et votre profil</div>
        </div>
        <!-- <a routerLink="/annonces/creer" class="btn-publish">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4v16M4 12h16"/>
          </svg>
          <span class="tab-label">Publier</span>
        </a> -->
      </div>

      <!-- Nav -->
      <nav class="tab-nav">

        <a routerLink="/dashboard/overview" routerLinkActive="active" class="tab-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span class="tab-label">Aperçu</span>
        </a>

        <a routerLink="/dashboard/mes-annonces" routerLinkActive="active" class="tab-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
          <span class="tab-label">Annonces</span>
        </a>

        <a routerLink="/dashboard/mes-favoris" routerLinkActive="active" class="tab-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <span class="tab-label">Favoris</span>
        </a>

        <a routerLink="/dashboard/mes-contacts" routerLinkActive="active" class="tab-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span class="tab-label">Contacts</span>
        </a>

        <a routerLink="/dashboard/profil" routerLinkActive="active" class="tab-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="tab-label">Profil</span>
        </a>

      </nav>

      <router-outlet/>
    </div>
  `,
})
export class DashboardShellComponent implements OnInit {
  private readonly store = inject(Store);
  readonly user          = this.store.selectSignal(selectCurrentUser);
  readonly prenom        = signal<string>('');

  ngOnInit(): void {
    // 1. Store déjà hydraté
    const fromStore = this.user()?.prenom;
    if (fromStore) {
      this.prenom.set(fromStore);
      return;
    }

    // 2. Lecture directe localStorage — clé immocam_user, prenom à la racine
    try {
      const raw = localStorage.getItem('immocam_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.prenom) {
          this.prenom.set(parsed.prenom);
          return;
        }
      }
    } catch {}

    // 3. Hydratation async du store (arrive après)
    const interval = setInterval(() => {
      const p = this.user()?.prenom;
      if (p) {
        this.prenom.set(p);
        clearInterval(interval);
      }
    }, 100);
    setTimeout(() => clearInterval(interval), 3000);
  }
}