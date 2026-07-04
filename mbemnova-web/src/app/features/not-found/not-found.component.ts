import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f8fafc;
      font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
    }

    .wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      text-align: center;
    }

    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(15,23,42,0.06);
    }

    .icon-wrap {
      width: 80px;
      height: 80px;
      background: #eff6ff;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .code {
      font-size: 72px;
      font-weight: 800;
      color: #1e3a8a;
      line-height: 1;
      margin: 0 0 12px;
      letter-spacing: -4px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px;
    }

    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 32px;
    }

    .btn-home {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #1e3a8a;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 13px 28px;
      border-radius: 14px;
      transition: background 0.15s, transform 0.1s;
      border: none;
      cursor: pointer;
    }
    .btn-home:hover { background: #162d4d; }
    .btn-home:active { transform: scale(0.97); }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      margin-top: 16px;
      transition: color 0.12s;
    }
    .btn-secondary:hover { color: #1e293b; }
  `],
  template: `
    <div class="wrapper">
      <div class="card">
        <div class="icon-wrap">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
               stroke="#1e3a8a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12L12 3L21 12V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1z"/>
            <line x1="9" y1="21" x2="9" y2="12"/>
            <line x1="15" y1="12" x2="15" y2="21"/>
            <line x1="12" y1="7" x2="12" y2="7.01"/>
          </svg>
        </div>

        <p class="code">404</p>
        <h1 class="title">Page introuvable</h1>
        <p class="subtitle">
          Ce bien ou cette page n'existe pas.<br>
          Il a peut-être expiré, été supprimé ou l'adresse est incorrecte.
        </p>

        <a routerLink="/" class="btn-home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12L12 3L21 12V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1z"/>
          </svg>
          Retour à l'accueil
        </a>

        <br/>

        <a routerLink="/annonces" class="btn-secondary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Voir toutes les annonces
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
