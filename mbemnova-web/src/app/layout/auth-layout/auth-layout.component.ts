import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,500&display=swap');

    :host {
      display: flex;
      min-height: 100vh;
      background: #fff;
    }

    /* ── Colonne gauche ── */
    .col-left {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 48px 52px;
      overflow: hidden;
    }

    .col-left-bg {
      position: absolute;
      inset: 0;
      background-image: url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
    }

    .col-left-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(10,22,40,.25) 0%,
        rgba(10,22,40,.55) 50%,
        rgba(10,22,40,.88) 100%
      );
    }

    .col-left-content {
      position: relative;
      z-index: 2;
    }

    .logo {
      position: absolute;
      top: 40px; left: 52px;
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      z-index: 2;
    }
    .logo-icon {
      width: 44px; height: 44px;
      background: #fff;
      border: 1px solid rgba(255,255,255,.25);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .logo-icon img { width: 100%; height: 100%; object-fit: cover; }
    .logo-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 500;
      color: #fff;
      letter-spacing: -.02em;
    }

    .pitch-title {
      font-size: clamp(28px, 3vw, 42px);
      font-weight: 700;
      color: #fff;
      line-height: 1.15;
      letter-spacing: -.025em;
      margin-bottom: 14px;
    }
    .pitch-title span {
      color: #93c5fd;
    }

    .pitch-sub {
      font-size: 15px;
      color: rgba(255,255,255,.7);
      line-height: 1.65;
      max-width: 380px;
      margin-bottom: 36px;
    }

    .pitch-features {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .feature {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .feature-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: rgba(255,255,255,.12);
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
    }
    .feature-icon svg { width: 16px; height: 16px; color: #93c5fd; }
    .feature-text p {
      font-size: 13px; font-weight: 600;
      color: #fff; margin: 0 0 2px;
    }
    .feature-text span { font-size: 12px; color: rgba(255,255,255,.55); }

    /* ── Colonne droite ── */
    .col-right {
      width: 460px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-left: 1px solid #f3f4f6;
      background: #fff;
      padding: 40px 48px;
    }

    .col-right-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .col-right-inner { width: 100%; max-width: 340px; }

    .footer-links {
      text-align: center;
      font-size: 11px;
      color: #d1d5db;
      padding-top: 24px;
    }
    .footer-links a {
      color: #d1d5db;
      text-decoration: none;
      transition: color .15s;
    }
    .footer-links a:hover { color: #6b7280; }
    .footer-links span { margin: 0 6px; }

    /* ── Responsive mobile ── */
    @media (max-width: 820px) {
      :host {
        flex-direction: column;
        background: #fff;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 0;
      }
      .col-left { display: none; }
      .col-right {
        width: 100%;
        max-width: 420px;
        border-left: none;
        padding: 48px 24px 32px;
        min-height: 100vh;
        justify-content: center;
      }
      .col-right-content {
        align-items: flex-start;
        flex: unset;
      }
      .col-right-inner { max-width: 100%; }
      .footer-links { margin-top: 32px; }
    }

    @media (max-width: 380px) {
      .col-right { padding: 40px 20px 28px; }
    }
  `],
  template: `
    <!-- Colonne gauche — image + pitch -->
    <div class="col-left">
      <div class="col-left-bg"></div>
      <div class="col-left-overlay"></div>

      <a routerLink="/" class="logo">
        <div class="logo-icon">
          <img src="/logo.jpeg?v=2" alt="Bailocam" />
        </div>
        <span class="logo-name">Bailocam</span>
      </a>

      <div class="col-left-content">
        <h1 class="pitch-title">
          L'immobilier au Cameroun,<br>
          <span>simplifié.</span>
        </h1>
        <p class="pitch-sub">
          Des milliers d'annonces à Douala, Yaoundé et partout au Cameroun. Trouvez, contactez, emménagez.
        </p>

        <div class="pitch-features">
          <div class="feature">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <div class="feature-text">
              <p>Recherche précise</p>
              <span>Filtrez par ville, quartier, type et budget</span>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div class="feature-text">
              <p>Annonces publiées par de vraies personnes</p>
              <span>Propriétaires et agents directs, sans intermédiaire</span>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8
                     a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72
                     C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div class="feature-text">
              <p>Contact direct WhatsApp</p>
              <span>Échangez en temps réel avec le propriétaire</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Colonne droite — formulaire -->
    <div class="col-right">
      <div class="col-right-content">
        <div class="col-right-inner">
          <router-outlet/>
        </div>
      </div>
      <div class="footer-links">
        <a routerLink="/politique-confidentialite">Confidentialité</a>
        <span>·</span>
        <a routerLink="/conditions-utilisation">Conditions</a>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}