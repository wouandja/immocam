import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '@core/services/api/admin.api';
import { AdminDashboardResponse } from '@core/services/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; font-family: 'DM Sans', sans-serif; }

    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    .dash {
      --navy:   #0F1E45;
      --navy2:  #162454;
      --blue:   #2563EB;
      --blue-l: #EFF4FF;
      --green:  #059669;
      --green-l:#ECFDF5;
      --amber:  #D97706;
      --amber-l:#FFFBEB;
      --red:    #DC2626;
      --red-l:  #FEF2F2;
      --slate:  #64748B;
      --muted:  #94A3B8;
      --border: #E8EDF5;
      --surface:#F7F9FC;
      --white:  #FFFFFF;
      --text:   #0F172A;
      --text2:  #334155;

      background: var(--surface);
      min-height: 100vh;
      padding: 28px 32px 48px;
    }

    /* ── Header ── */
    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .header-left h1 {
      font-size: 22px; font-weight: 700; color: var(--text);
      letter-spacing: -0.5px; margin: 0 0 3px;
    }
    .header-left p { font-size: 13px; color: var(--muted); margin: 0; font-weight: 400; }
    .header-date {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 500; color: var(--slate);
      background: var(--white); border: 1px solid var(--border);
      border-radius: 8px; padding: 6px 12px;
    }
    .header-date svg { opacity: .5; }

    /* ── Alert ── */
    .alert-banner {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; background: var(--white);
      border: 1px solid #FCA5A5; border-left: 4px solid var(--red);
      border-radius: 12px; padding: 12px 16px; margin-bottom: 24px;
    }
    .alert-inner { display: flex; align-items: center; gap: 10px; }
    .alert-dot {
      width: 8px; height: 8px; background: var(--red);
      border-radius: 50%; flex-shrink: 0;
      animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,.4); }
      50%       { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
    }
    .alert-text strong { font-size: 13px; font-weight: 600; color: #991B1B; display: block; }
    .alert-text span   { font-size: 12px; color: #B91C1C; }
    .btn-alert {
      flex-shrink: 0; padding: 6px 14px; background: var(--red); color: #fff;
      border: none; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background .15s;
    }
    .btn-alert:hover { background: #B91C1C; }

    /* ── KPI Grid ── */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 14px; margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--white); border: 1px solid var(--border);
      border-radius: 14px; padding: 18px 20px 16px;
      position: relative; overflow: hidden;
      transition: box-shadow .15s, border-color .15s;
    }
    .kpi-card:hover { box-shadow: 0 4px 20px rgba(15,30,69,.07); border-color: #CBD5E1; }
    .kpi-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      border-radius: 14px 14px 0 0; background: var(--kpi-color, var(--blue));
    }
    .kpi-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
    .kpi-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: var(--kpi-bg, var(--blue-l));
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon svg { width: 18px; height: 18px; color: var(--kpi-color, var(--blue)); }
    .kpi-badge { font-size: 11px; font-weight: 600; font-family: 'DM Mono', monospace; padding: 3px 7px; border-radius: 20px; }
    .badge-up      { background: var(--green-l); color: var(--green); }
    .badge-down    { background: var(--red-l);   color: var(--red); }
    .badge-warn    { background: var(--amber-l); color: var(--amber); }
    .badge-neutral { background: var(--surface); color: var(--slate); }
    .kpi-value { font-size: 28px; font-weight: 700; color: var(--text); letter-spacing: -1px; line-height: 1; margin: 0 0 4px; }
    .kpi-label { font-size: 12px; color: var(--muted); font-weight: 500; margin: 0 0 8px; }
    .kpi-sub { font-size: 11px; color: var(--slate); padding-top: 8px; border-top: 1px solid var(--border); }
    .kpi-sub strong { color: var(--text2); font-weight: 600; }

    /* ── Section title ── */
    .section-title {
      font-size: 13px; font-weight: 600; color: var(--text2);
      letter-spacing: .04em; text-transform: uppercase; margin: 0 0 14px;
    }

    /* ── Metrics bottom ── */
    .bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
    .metric-card { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .metric-item { padding: 14px; background: var(--surface); border-radius: 10px; }
    .metric-val { font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -.5px; margin-bottom: 2px; }
    .metric-lbl { font-size: 11px; color: var(--muted); font-weight: 500; }
    .metric-trend { font-size: 11px; font-weight: 600; margin-top: 4px; }
    .trend-up   { color: var(--green); }
    .trend-down { color: var(--red); }
    .trend-neu  { color: var(--slate); }

    /* ── Utilisateurs card ── */
    .users-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
    .stat-row-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .stat-mini {
      padding: 12px 14px; background: var(--surface); border-radius: 10px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .stat-mini-val { font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -.4px; }
    .stat-mini-lbl { font-size: 11px; color: var(--muted); font-weight: 500; }

    /* ── State ── */
    .state-center {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 80px 24px; gap: 14px;
      background: var(--white); border: 1px solid var(--border); border-radius: 14px;
    }
    .spinner {
      width: 28px; height: 28px; border: 2.5px solid var(--border);
      border-top-color: var(--blue); border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .state-title { font-size: 15px; font-weight: 600; color: var(--text); margin: 0; }
    .state-sub   { font-size: 13px; color: var(--muted); margin: 0; text-align: center; max-width: 320px; }
    .state-err   { font-size: 12px; color: var(--red); font-family: 'DM Mono', monospace; background: var(--red-l); padding: 8px 14px; border-radius: 8px; }
    .btn-retry {
      padding: 8px 20px; background: var(--navy); color: #fff; border: none;
      border-radius: 9px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background .15s;
    }
    .btn-retry:hover { background: var(--blue); }

    /* ── Responsive ── */
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .dash { padding: 16px; }
      .kpi-grid    { grid-template-columns: 1fr 1fr; gap: 10px; }
      .bottom-row  { grid-template-columns: 1fr; }
      .users-row   { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }
  `],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

    <div class="dash">

      @if (loading()) {
        <div class="state-center">
          <div class="spinner"></div>
          <p class="state-title">Chargement du tableau de bord…</p>
        </div>

      } @else if (error()) {
        <div class="state-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          <p class="state-title">Impossible de charger le tableau de bord</p>
          <p class="state-err">{{ error() }}</p>
          <button class="btn-retry" (click)="reload()">Réessayer</button>
        </div>

      } @else if (data(); as d) {

        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <h1>Tableau de bord</h1>
            <p>Vue d'ensemble de la plateforme · mise à jour en temps réel</p>
          </div>
          <div class="header-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            {{ today() }}
          </div>
        </div>

        <!-- Alert signalements -->
        @if (d.signalementsEnAttente > 0) {
          <div class="alert-banner">
            <div class="alert-inner">
              <div class="alert-dot"></div>
              <div class="alert-text">
                <strong>{{ d.signalementsEnAttente }} signalement(s) en attente de traitement</strong>
                <span>Ces signalements nécessitent une action manuelle</span>
              </div>
            </div>
            <button class="btn-alert">Voir les signalements →</button>
          </div>
        }

        <!-- KPI Cards -->
        <div class="kpi-grid">

          <!-- Annonces actives -->
          <div class="kpi-card" style="--kpi-color:#2563EB; --kpi-bg:#EFF4FF">
            <div class="kpi-top">
              <div class="kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span class="kpi-badge badge-up">+{{ d.annoncesPubliees7j }} /7j</span>
            </div>
            <p class="kpi-value">{{ fmt(d.annoncesActives) }}</p>
            <p class="kpi-label">Annonces actives</p>
            <div class="kpi-sub">
              <strong>{{ d.annoncesPublieesAujourdhui }}</strong> publiées aujourd'hui ·
              <strong>{{ d.annoncesPubliees7j }}</strong> cette semaine
            </div>
          </div>

          <!-- Contacts WhatsApp -->
          <div class="kpi-card" style="--kpi-color:#16A34A; --kpi-bg:#F0FDF4">
            <div class="kpi-top">
              <div class="kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
                           A19.5 19.5 0 0 1 5 12.84 19.79 19.79 0 0 1 2.12 4.18
                           2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81
                           a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27
                           a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <span class="kpi-badge badge-neutral">{{ d.contactsWhatsApp7j }} /7j</span>
            </div>
            <p class="kpi-value">{{ fmt(d.contactsWhatsAppTotal) }}</p>
            <p class="kpi-label">Contacts WhatsApp</p>
            <div class="kpi-sub">
              <strong>{{ d.contactsWhatsAppAujourdhui }}</strong> aujourd'hui ·
              <strong>{{ d.contactsWhatsApp7j }}</strong> cette semaine
            </div>
          </div>

          <!-- Inscrits -->
          <div class="kpi-card" style="--kpi-color:#7C3AED; --kpi-bg:#F5F3FF">
            <div class="kpi-top">
              <div class="kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#7C3AED">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <span class="kpi-badge" style="background:#F5F3FF;color:#7C3AED">
                +{{ d.nouveauxInscrits7j }} /7j
              </span>
            </div>
            <p class="kpi-value">{{ fmt(d.utilisateursTotal) }}</p>
            <p class="kpi-label">Utilisateurs inscrits</p>
            <div class="kpi-sub">
              <strong>{{ d.nouveauxInscritsAujourdhui }}</strong> aujourd'hui ·
              <strong>{{ d.utilisateursActifs }}</strong> actifs
            </div>
          </div>

          <!-- Signalements -->
          <div class="kpi-card"
            [style]="d.signalementsEnAttente > 0
              ? '--kpi-color:#DC2626; --kpi-bg:#FEF2F2'
              : '--kpi-color:#059669; --kpi-bg:#ECFDF5'">
            <div class="kpi-top">
              <div class="kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94
                       a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
              </div>
              <span class="kpi-badge"
                [class.badge-down]="d.signalementsEnAttente > 0"
                [class.badge-up]="d.signalementsEnAttente === 0">
                {{ d.signalementsEnAttente > 0 ? 'En attente' : 'OK' }}
              </span>
            </div>
            <p class="kpi-value">{{ d.signalementsEnAttente }}</p>
            <p class="kpi-label">Signalements en attente</p>
            <div class="kpi-sub">
              <strong>{{ d.commentairesAujourdhui }}</strong> commentaires aujourd'hui
            </div>
          </div>

        </div>

        <!-- Activité détaillée + Utilisateurs -->
        <div class="bottom-row">

          <!-- Activité détaillée -->
          <div class="metric-card">
            <p class="section-title">Activité détaillée</p>
            <div class="metric-grid">
              <div class="metric-item">
                <p class="metric-val">{{ d.annoncesPublieesAujourdhui }}</p>
                <p class="metric-lbl">Annonces publiées aujourd'hui</p>
                <p class="metric-trend trend-up">↑ {{ d.annoncesPubliees7j }} cette semaine</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.contactsWhatsAppAujourdhui }}</p>
                <p class="metric-lbl">Contacts WA aujourd'hui</p>
                <p class="metric-trend trend-up">↑ {{ d.contactsWhatsApp7j }} cette semaine</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.nouveauxInscritsAujourdhui }}</p>
                <p class="metric-lbl">Inscrits aujourd'hui</p>
                <p class="metric-trend trend-up">↑ {{ d.nouveauxInscrits7j }} cette semaine</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.commentairesAujourdhui }}</p>
                <p class="metric-lbl">Commentaires aujourd'hui</p>
                <p class="metric-trend trend-neu">activité du jour</p>
              </div>
            </div>
          </div>

          <!-- Utilisateurs -->
          <div class="metric-card">
            <p class="section-title">Utilisateurs</p>
            <div class="stat-row-grid">
              <div class="stat-mini">
                <span class="stat-mini-val">{{ fmt(d.utilisateursTotal) }}</span>
                <span class="stat-mini-lbl">Total inscrits</span>
              </div>
              <div class="stat-mini">
                <span class="stat-mini-val" style="color:#059669">{{ fmt(d.utilisateursActifs) }}</span>
                <span class="stat-mini-lbl">Actifs</span>
              </div>
              <div class="stat-mini">
                <span class="stat-mini-val"
                  [style.color]="d.utilisateursSuspendus > 0 ? '#D97706' : '#64748B'">
                  {{ d.utilisateursSuspendus }}
                </span>
                <span class="stat-mini-lbl">Suspendus</span>
              </div>
            </div>
          </div>

        </div>

      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  loading = signal(true);
  data    = signal<AdminDashboardResponse | null>(null);
  error   = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.load();
  }

  private load(): void {
    this.adminApi.getDashboard().subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ??
          `HTTP ${err?.status ?? '?'} — ${err?.statusText ?? 'Erreur inconnue'}`
        );
        this.loading.set(false);
      },
    });
  }

  today(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  fmt(n: number): string {
    return n?.toLocaleString('fr-FR') ?? '0';
  }
}