import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '@core/services/api/admin.api';
import { AdminDashboardResponse, ChartDataPoint, VilleRanking, TypeBienRanking } from '@core/services/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; font-family: 'DM Sans', sans-serif; }

    /* ── Fonts ─────────────────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    /* ── Tokens ─────────────────────────────────────────────── */
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

    /* ── Header ─────────────────────────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-left h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.5px;
      margin: 0 0 3px;
    }
    .header-left p {
      font-size: 13px;
      color: var(--muted);
      margin: 0;
      font-weight: 400;
    }
    .header-date {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--slate);
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 12px;
    }
    .header-date svg { opacity: .5; }

    /* ── Alert banner ───────────────────────────────────────── */
    .alert-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: var(--white);
      border: 1px solid #FCA5A5;
      border-left: 4px solid var(--red);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 24px;
    }
    .alert-inner { display: flex; align-items: center; gap: 10px; }
    .alert-dot {
      width: 8px; height: 8px;
      background: var(--red);
      border-radius: 50%;
      flex-shrink: 0;
      animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,.4); }
      50%       { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
    }
    .alert-text strong { font-size: 13px; font-weight: 600; color: #991B1B; display: block; }
    .alert-text span   { font-size: 12px; color: #B91C1C; }
    .btn-alert {
      flex-shrink: 0;
      padding: 6px 14px;
      background: var(--red);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s;
    }
    .btn-alert:hover { background: #B91C1C; }

    /* ── KPI Grid ───────────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 20px 16px;
      position: relative;
      overflow: hidden;
      transition: box-shadow .15s, border-color .15s;
    }
    .kpi-card:hover {
      box-shadow: 0 4px 20px rgba(15,30,69,.07);
      border-color: #CBD5E1;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: 14px 14px 0 0;
      background: var(--kpi-color, var(--blue));
    }
    .kpi-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .kpi-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: var(--kpi-bg, var(--blue-l));
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon svg { width: 18px; height: 18px; color: var(--kpi-color, var(--blue)); }
    .kpi-badge {
      font-size: 11px;
      font-weight: 600;
      font-family: 'DM Mono', monospace;
      padding: 3px 7px;
      border-radius: 20px;
    }
    .badge-up   { background: var(--green-l); color: var(--green); }
    .badge-down { background: var(--red-l);   color: var(--red); }
    .badge-warn { background: var(--amber-l); color: var(--amber); }
    .badge-neutral { background: var(--surface); color: var(--slate); }
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -1px;
      line-height: 1;
      margin: 0 0 4px;
    }
    .kpi-label {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
      margin: 0 0 8px;
    }
    .kpi-sub {
      font-size: 11px;
      color: var(--slate);
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }
    .kpi-sub strong { color: var(--text2); font-weight: 600; }

    /* ── Section title ──────────────────────────────────────── */
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text2);
      letter-spacing: .04em;
      text-transform: uppercase;
      margin: 0 0 14px;
    }

    /* ── Charts row ─────────────────────────────────────────── */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
      margin-bottom: 24px;
    }
    .chart-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 20px 16px;
    }
    .chart-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .chart-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 2px;
    }
    .chart-sub {
      font-size: 11px;
      color: var(--muted);
    }
    .chart-total {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -.5px;
      text-align: right;
    }
    .chart-total-label {
      font-size: 10px;
      color: var(--muted);
      text-align: right;
    }

    /* Bar chart */
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 80px;
    }
    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      height: 100%;
      justify-content: flex-end;
    }
    .bar {
      width: 100%;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: opacity .15s;
      cursor: default;
    }
    .bar:hover { opacity: .75; }
    .bar-label {
      font-size: 10px;
      color: var(--muted);
      font-weight: 500;
      white-space: nowrap;
      font-family: 'DM Mono', monospace;
    }

    /* ── Rankings row ───────────────────────────────────────── */
    .rankings-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 24px;
    }
    .rank-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 20px;
    }
    .rank-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .rank-list { display: flex; flex-direction: column; gap: 11px; }
    .rank-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .rank-num {
      width: 22px; height: 22px;
      border-radius: 6px;
      background: var(--surface);
      border: 1px solid var(--border);
      font-size: 11px;
      font-weight: 700;
      color: var(--slate);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-family: 'DM Mono', monospace;
    }
    .rank-num.top { background: var(--navy); border-color: var(--navy); color: #fff; }
    .rank-body { flex: 1; min-width: 0; }
    .rank-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .rank-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rank-count {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      font-family: 'DM Mono', monospace;
      flex-shrink: 0;
    }
    .rank-bar-track {
      height: 4px;
      background: var(--surface);
      border-radius: 4px;
      overflow: hidden;
    }
    .rank-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width .4s ease;
    }

    /* ── Bottom row ─────────────────────────────────────────── */
    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .metric-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 20px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .metric-item {
      padding: 14px;
      background: var(--surface);
      border-radius: 10px;
    }
    .metric-val {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -.5px;
      margin-bottom: 2px;
    }
    .metric-lbl {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
    }
    .metric-trend {
      font-size: 11px;
      font-weight: 600;
      margin-top: 4px;
    }
    .trend-up   { color: var(--green); }
    .trend-down { color: var(--red); }
    .trend-neu  { color: var(--slate); }

    /* ── Loading / Error ────────────────────────────────────── */
    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      gap: 14px;
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
    }
    .spinner {
      width: 28px; height: 28px;
      border: 2.5px solid var(--border);
      border-top-color: var(--blue);
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .state-title { font-size: 15px; font-weight: 600; color: var(--text); margin: 0; }
    .state-sub   { font-size: 13px; color: var(--muted); margin: 0; text-align: center; max-width: 320px; }
    .state-err   { font-size: 12px; color: var(--red); font-family: 'DM Mono', monospace; background: var(--red-l); padding: 8px 14px; border-radius: 8px; }
    .btn-retry {
      padding: 8px 20px;
      background: var(--navy);
      color: #fff;
      border: none;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s;
    }
    .btn-retry:hover { background: var(--blue); }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 1100px) {
      .kpi-grid    { grid-template-columns: repeat(2, 1fr); }
      .charts-row  { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) {
      .dash        { padding: 16px; }
      .kpi-grid    { grid-template-columns: 1fr 1fr; gap: 10px; }
      .charts-row  { grid-template-columns: 1fr; }
      .rankings-row{ grid-template-columns: 1fr; }
      .bottom-row  { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .kpi-grid    { grid-template-columns: 1fr; }
    }
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
        @if (d.signalEmentsNonTraites > 0) {
          <div class="alert-banner">
            <div class="alert-inner">
              <div class="alert-dot"></div>
              <div class="alert-text">
                <strong>{{ d.signalEmentsNonTraites }} signalement(s) en attente de traitement</strong>
                <span>Ces signalements nécessitent une action manuelle</span>
              </div>
            </div>
            <button class="btn-alert">Voir les signalements →</button>
          </div>
        }

        <!-- KPI Cards -->
        <div class="kpi-grid">

          <!-- Visites -->
          <div class="kpi-card" style="--kpi-color:#2563EB; --kpi-bg:#EFF4FF">
            <div class="kpi-top">
              <div class="kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span class="kpi-badge badge-up">+{{ d.visitesTotales7j }} /7j</span>
            </div>
            <p class="kpi-value">{{ fmt(d.visitesTotales) }}</p>
            <p class="kpi-label">Visites totales</p>
            <div class="kpi-sub">
              <strong>{{ d.visitesTotales7j }}</strong> cette semaine ·
              <strong>{{ d.visitesTotales30j }}</strong> ce mois
            </div>
          </div>

          <!-- Annonces -->
          <div class="kpi-card" style="--kpi-color:#059669; --kpi-bg:#ECFDF5">
            <div class="kpi-top">
              <div class="kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span class="kpi-badge badge-up">+{{ d.nouvellesAnnonces7j }} /7j</span>
            </div>
            <p class="kpi-value">{{ d.annoncesActives }}</p>
            <p class="kpi-label">Annonces actives</p>
            <div class="kpi-sub">
              <strong>{{ d.nouvellesAnnonces }}</strong> nouvelles aujourd'hui ·
              <strong>{{ d.nouvellesAnnonces7j }}</strong> cette semaine
            </div>
          </div>

          <!-- Contacts WhatsApp -->
          <div class="kpi-card" style="--kpi-color:#16A34A; --kpi-bg:#F0FDF4">
            <div class="kpi-top">
              <div class="kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <span class="kpi-badge badge-neutral">{{ d.contactsWhatsapp7j }} /7j</span>
            </div>
            <p class="kpi-value">{{ fmt(d.contactsWhatsapp) }}</p>
            <p class="kpi-label">Contacts WhatsApp</p>
            <div class="kpi-sub">
              <strong>{{ d.contactsWhatsapp7j }}</strong> cette semaine
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
              <span class="kpi-badge" style="background:#F5F3FF;color:#7C3AED">+{{ d.nouveauxInscrits7j }} /7j</span>
            </div>
            <p class="kpi-value">{{ d.nouveauxInscrits }}</p>
            <p class="kpi-label">Nouveaux inscrits</p>
            <div class="kpi-sub">
              <strong>{{ d.nouveauxInscrits7j }}</strong> cette semaine ·
              <strong>{{ d.commentairesPublies }}</strong> commentaires
            </div>
          </div>

        </div>

        <!-- Charts -->
        <div class="charts-row">

          <!-- Visites 7j -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <p class="chart-title">Visites</p>
                <p class="chart-sub">7 derniers jours</p>
              </div>
              <div>
                <p class="chart-total">{{ maxVal(d.evolutionVisites) }}</p>
                <p class="chart-total-label">pic</p>
              </div>
            </div>
            <div class="bar-chart">
              @for (pt of d.evolutionVisites; track pt.date) {
                <div class="bar-col">
                  <div
                    class="bar"
                    style="background: #2563EB"
                    [style.height.%]="barPct(pt.valeur, d.evolutionVisites)"
                    [title]="pt.valeur + ' visites · ' + pt.date"
                  ></div>
                  <span class="bar-label">{{ dayLabel(pt.date) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Contacts 7j -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <p class="chart-title">Contacts WhatsApp</p>
                <p class="chart-sub">7 derniers jours</p>
              </div>
              <div>
                <p class="chart-total">{{ maxVal(d.evolutionContacts) }}</p>
                <p class="chart-total-label">pic</p>
              </div>
            </div>
            <div class="bar-chart">
              @for (pt of d.evolutionContacts; track pt.date) {
                <div class="bar-col">
                  <div
                    class="bar"
                    style="background: #16A34A"
                    [style.height.%]="barPct(pt.valeur, d.evolutionContacts)"
                    [title]="pt.valeur + ' contacts · ' + pt.date"
                  ></div>
                  <span class="bar-label">{{ dayLabel(pt.date) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Publications 7j -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <p class="chart-title">Publications</p>
                <p class="chart-sub">7 derniers jours</p>
              </div>
              <div>
                <p class="chart-total">{{ maxVal(d.evolutionPublications) }}</p>
                <p class="chart-total-label">pic</p>
              </div>
            </div>
            <div class="bar-chart">
              @for (pt of d.evolutionPublications; track pt.date) {
                <div class="bar-col">
                  <div
                    class="bar"
                    style="background: #7C3AED"
                    [style.height.%]="barPct(pt.valeur, d.evolutionPublications)"
                    [title]="pt.valeur + ' publications · ' + pt.date"
                  ></div>
                  <span class="bar-label">{{ dayLabel(pt.date) }}</span>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Rankings -->
        <div class="rankings-row">

          <!-- Villes actives -->
          <div class="rank-card">
            <div class="rank-header">
              <p class="section-title" style="margin:0">Villes les plus actives</p>
              <span style="font-size:11px;color:var(--muted)">par nb d'annonces</span>
            </div>
            <div class="rank-list">
              @for (v of d.villesActives; track v.ville; let i = $index) {
                <div class="rank-item">
                  <div class="rank-num" [class.top]="i === 0">{{ i + 1 }}</div>
                  <div class="rank-body">
                    <div class="rank-row">
                      <span class="rank-name">{{ v.ville }}</span>
                      <span class="rank-count">{{ v.nombreAnnonces }}</span>
                    </div>
                    <div class="rank-bar-track">
                      <div
                        class="rank-bar-fill"
                        style="background: #2563EB"
                        [style.width.%]="rankPct(v.nombreAnnonces, d.villesActives[0].nombreAnnonces)"
                      ></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Types de biens -->
          <div class="rank-card">
            <div class="rank-header">
              <p class="section-title" style="margin:0">Types de biens populaires</p>
              <span style="font-size:11px;color:var(--muted)">par nb d'annonces</span>
            </div>
            <div class="rank-list">
              @for (t of d.typesBiensPopulaires; track t.typeBien; let i = $index) {
                <div class="rank-item">
                  <div class="rank-num" [class.top]="i === 0">{{ i + 1 }}</div>
                  <div class="rank-body">
                    <div class="rank-row">
                      <span class="rank-name">{{ t.typeBien }}</span>
                      <span class="rank-count">{{ t.nombreAnnonces }}</span>
                    </div>
                    <div class="rank-bar-track">
                      <div
                        class="rank-bar-fill"
                        style="background: #059669"
                        [style.width.%]="rankPct(t.nombreAnnonces, d.typesBiensPopulaires[0].nombreAnnonces)"
                      ></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Bottom metrics -->
        <div class="bottom-row">

          <!-- Activité plateforme -->
          <div class="metric-card">
            <p class="section-title">Activité détaillée</p>
            <div class="metric-grid">
              <div class="metric-item">
                <p class="metric-val">{{ fmt(d.visitesTotales30j) }}</p>
                <p class="metric-lbl">Visites — 30 jours</p>
                <p class="metric-trend trend-up">↑ {{ d.visitesTotales7j }} cette semaine</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.nouvellesAnnonces7j }}</p>
                <p class="metric-lbl">Nouvelles annonces /7j</p>
                <p class="metric-trend trend-up">↑ {{ d.nouvellesAnnonces }} aujourd'hui</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.commentairesPublies }}</p>
                <p class="metric-lbl">Commentaires publiés</p>
                <p class="metric-trend trend-neu">{{ d.commentairesPublies7j }} cette semaine</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.nouveauxInscrits7j }}</p>
                <p class="metric-lbl">Inscrits — 7 jours</p>
                <p class="metric-trend trend-up">↑ vs semaine passée</p>
              </div>
            </div>
          </div>

          <!-- Signalements + Santé -->
          <div class="metric-card">
            <p class="section-title">Signalements & santé système</p>
            <div class="metric-grid">
              <div class="metric-item" [style.border-left]="d.signalEmentsNonTraites > 0 ? '3px solid #DC2626' : '3px solid #059669'">
                <p class="metric-val" [style.color]="d.signalEmentsNonTraites > 0 ? '#DC2626' : '#059669'">
                  {{ d.signalEmentsNonTraites }}
                </p>
                <p class="metric-lbl">Signalements en attente</p>
                <p class="metric-trend" [class]="d.signalEmentsNonTraites > 0 ? 'trend-down' : 'trend-up'">
                  {{ d.signalEmentsNonTraites > 0 ? '⚠ Action requise' : '✓ Aucun en attente' }}
                </p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.annoncesActives }}</p>
                <p class="metric-lbl">Annonces publiées</p>
                <p class="metric-trend trend-up">↑ plateforme active</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.contactsWhatsapp7j }}</p>
                <p class="metric-lbl">Contacts WA /7j</p>
                <p class="metric-trend trend-up">↑ engagement élevé</p>
              </div>
              <div class="metric-item">
                <p class="metric-val">{{ d.nouveauxInscrits }}</p>
                <p class="metric-lbl">Total inscrits</p>
                <p class="metric-trend trend-neu">base utilisateurs</p>
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

  // ── Helpers ──────────────────────────────────────────────────────────

  today(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  fmt(n: number): string {
    return n?.toLocaleString('fr-FR') ?? '0';
  }

  barPct(val: number, pts: ChartDataPoint[]): number {
    const max = Math.max(...pts.map(p => p.valeur), 1);
    return Math.max((val / max) * 100, 5);
  }

  maxVal(pts: ChartDataPoint[]): number {
    return Math.max(...(pts ?? []).map(p => p.valeur), 0);
  }

  rankPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  dayLabel(date: string): string {
    return new Date(date)
      .toLocaleDateString('fr-FR', { weekday: 'short' })
      .slice(0, 2)
      .toUpperCase();
  }
}