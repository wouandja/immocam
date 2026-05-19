import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { DashboardStatsResponse, AnnonceListResponse, AnnonceDashboardResponse } from '@core/services/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    FcfaPipe,
    TimeAgoPipe,
    LoadingSpinnerComponent,
  ],
  styles: [
    `
      :host {
        display: block;
      }

      .dash {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      /* ── KPI grid ── */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      @media (max-width: 640px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .kpi {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px 18px;
        box-shadow: 0 1px 4px rgba(30, 58, 95, 0.04);
        transition:
          box-shadow 0.15s,
          border-color 0.15s;
      }
      .kpi:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 12px rgba(30, 58, 95, 0.08);
      }

      .kpi-icon {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: #f0f4f8;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      }
      .kpi-icon svg {
        width: 17px;
        height: 17px;
        color: #1e3a5f;
      }

      .kpi-val {
        font-size: 26px;
        font-weight: 700;
        color: #111827;
        line-height: 1.1;
        letter-spacing: -0.03em;
      }
      .kpi-label {
        font-size: 12px;
        color: #6b7280;
        margin-top: 3px;
        font-weight: 500;
      }
      .kpi-delta {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        font-weight: 600;
        margin-top: 7px;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .delta-up {
        background: #ecfdf5;
        color: #059669;
      }
      .delta-dn {
        background: #fef2f2;
        color: #dc2626;
      }
      .kpi-delta svg {
        width: 10px;
        height: 10px;
      }

      /* ── Charts row ── */
      .charts-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      @media (max-width: 640px) {
        .charts-row {
          grid-template-columns: 1fr;
        }
      }

      /* ── Card base ── */
      .card {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(30, 58, 95, 0.05);
      }

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .card-title {
        font-size: 13px;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.01em;
      }
      .card-link {
        font-size: 12px;
        font-weight: 600;
        color: #1e3a5f;
        text-decoration: none;
        transition: opacity 0.15s;
      }
      .card-link:hover {
        opacity: 0.75;
      }

      /* ── Sparkline ── */
      .spark-svg {
        width: 100%;
        display: block;
      }
      .trend-label {
        font-size: 12px;
        color: #6b7280;
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .trend-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        background: #ecfdf5;
        color: #059669;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .trend-badge svg {
        width: 10px;
        height: 10px;
      }

      /* ── Bar chart ── */
      .bar-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .bar-row:last-child {
        margin-bottom: 0;
      }
      .bar-name {
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        width: 68px;
        flex-shrink: 0;
      }
      .bar-track {
        flex: 1;
        height: 10px;
        border-radius: 99px;
        background: #f3f4f6;
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 99px;
        transition: width 0.4s ease;
      }
      .bar-fill.active {
        background: #059669;
      }
      .bar-fill.pause {
        background: #f59e0b;
      }
      .bar-fill.expired {
        background: #dc2626;
      }
      .bar-fill.review {
        background: #1e3a5f;
      }
      .bar-count {
        font-size: 11px;
        font-weight: 700;
        color: #374151;
        width: 22px;
        text-align: right;
        flex-shrink: 0;
      }

      /* ── Alerte expiration ── */
      .expiry-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .expiry-item {
        background: #fff9f0;
        border: 1.5px solid #fde68a;
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .expiry-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f59e0b;
        flex-shrink: 0;
      }
      .expiry-name {
        font-size: 13px;
        font-weight: 600;
        color: #111827;
        flex: 1;
      }
      .expiry-date {
        font-size: 11px;
        color: #92400e;
        margin-top: 2px;
      }
      .btn-renew {
        height: 34px;
        padding: 0 14px;
        background: #fff;
        color: #1e3a5f;
        border: 1.5px solid #e5e7eb;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
        flex-shrink: 0;
        transition:
          background 0.15s,
          border-color 0.15s;
      }
      .btn-renew:hover {
        background: #f0f4f8;
        border-color: #d1d5db;
      }

      /* ── Annonces récentes ── */
      .annonce-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
      }
      .annonce-row:last-child {
        border-bottom: none;
      }

      .annonce-thumb {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: #f3f4f6;
        border: 1.5px solid #e5e7eb;
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .annonce-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .annonce-thumb svg {
        width: 18px;
        height: 18px;
        color: #d1d5db;
      }

      .annonce-info {
        flex: 1;
        min-width: 0;
      }
      .annonce-name {
        font-size: 13px;
        font-weight: 600;
        color: #111827;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .annonce-sub {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 2px;
      }

      .annonce-right {
        text-align: right;
        flex-shrink: 0;
      }
      .annonce-price {
        font-size: 13px;
        font-weight: 700;
        color: #1e3a5f;
        margin-bottom: 3px;
      }
      .annonce-views {
        font-size: 11px;
        color: #9ca3af;
        display: flex;
        align-items: center;
        gap: 3px;
        justify-content: flex-end;
      }
      .annonce-views svg {
        width: 11px;
        height: 11px;
      }

      /* ── Empty state ── */
      .empty {
        padding: 40px 20px;
        text-align: center;
      }
      .empty-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: #f0f4f8;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 14px;
      }
      .empty-icon svg {
        width: 24px;
        height: 24px;
        color: #9ca3af;
      }
      .empty p {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
      }
      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 46px;
        padding: 0 22px;
        background: #1e3a5f;
        color: #fff;
        border-radius: 10px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        font-family: inherit;
        transition: background 0.15s;
      }
      .btn-primary:hover {
        background: #162d4a;
      }
      .btn-primary svg {
        width: 16px;
        height: 16px;
      }
    `,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="dash">
        <!-- ── KPIs ── -->
        <div class="kpi-grid">
          @for (s of stats(); track s.label) {
            <div class="kpi">
              <div class="kpi-icon">
                <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="s.icon" />
                </svg>
              </div>
              <div class="kpi-val">{{ s.value | number }}</div>
              <div class="kpi-label">{{ s.label }}</div>
              @if (s.delta) {
                <div class="kpi-delta" [class.delta-up]="s.up" [class.delta-dn]="!s.up">
                  <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      [attr.d]="s.up ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
                    />
                  </svg>
                  {{ s.delta }}
                </div>
              }
            </div>
          }
        </div>

        <!-- ── Charts row ── -->
        <div class="charts-row">
          <!-- Sparkline vues -->
          <div class="card">
            <div class="card-head">
              <span class="card-title">Vues — 30 jours</span>
            </div>
            <svg
              class="spark-svg"
              viewBox="0 0 280 72"
              role="img"
              aria-label="Évolution des vues sur 30 jours"
            >
              <defs>
                <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1e3a5f" stop-opacity=".12" />
                  <stop offset="100%" stop-color="#1e3a5f" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 62 L10 58 L20 54 L30 50 L40 55 L50 48 L60 42 L70 38 L80 44
                       L90 40 L100 35 L110 30 L120 36 L130 28 L140 22 L150 26 L160 20
                       L170 15 L180 18 L190 12 L200 16 L210 10 L220 14 L230 8 L240 11
                       L250 6 L260 9 L270 4 L280 2 L280 72 L0 72 Z"
                fill="url(#spark-fill)"
              />
              <path
                d="M0 62 L10 58 L20 54 L30 50 L40 55 L50 48 L60 42 L70 38 L80 44
                       L90 40 L100 35 L110 30 L120 36 L130 28 L140 22 L150 26 L160 20
                       L170 15 L180 18 L190 12 L200 16 L210 10 L220 14 L230 8 L240 11
                       L250 6 L260 9 L270 4 L280 2"
                fill="none"
                stroke="#1e3a5f"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="280" cy="2" r="3.5" fill="#1e3a5f" />
            </svg>
            <div class="trend-label">
              Tendance ce mois
              <span class="trend-badge">
                <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                +18 %
              </span>
            </div>
          </div>

          <!-- Répartition statuts -->
          <div class="card">
            <div class="card-head">
              <span class="card-title">Répartition des annonces</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">Actives</span>
              <div class="bar-track">
                <div class="bar-fill active" [style.width]="getBarWidth('ACTIVE')"></div>
              </div>
              <span class="bar-count">{{ statuts().actives }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">En pause</span>
              <div class="bar-track">
                <div class="bar-fill pause" [style.width]="getBarWidth('EN_PAUSE')"></div>
              </div>
              <span class="bar-count">{{ statuts().pauses }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">Expirées</span>
              <div class="bar-track">
                <div class="bar-fill expired" [style.width]="getBarWidth('EXPIREE')"></div>
              </div>
              <span class="bar-count">{{ statuts().expirees }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">Révision</span>
              <div class="bar-track">
                <div class="bar-fill review" [style.width]="getBarWidth('EN_ATTENTE')"></div>
              </div>
              <span class="bar-count">{{ statuts().revision }}</span>
            </div>
          </div>
        </div>

        <!-- ── Expirant bientôt ── -->
        @if (expiringAnnonces().length > 0) {
          <div class="card">
            <div class="card-head">
              <span class="card-title">⏰ Expirant bientôt</span>
              <a routerLink="/dashboard/mes-annonces" class="card-link">Voir tout →</a>
            </div>
            <div class="expiry-list">
              @for (a of expiringAnnonces(); track a.id) {
                <div class="expiry-item">
                  <div class="expiry-dot"></div>
                  <div style="flex:1">
                    <div class="expiry-name">
                      {{ a.typeBien }} — {{ a.quartier }}, {{ a.ville }}
                    </div>
                    <div class="expiry-date">Expire le {{ formatDate(a.dateExpiration) }}</div>
                  </div>
                  <button class="btn-renew">Renouveler</button>
                </div>
              }
            </div>
          </div>
        }

        <!-- ── Annonces récentes ── -->
        <div class="card">
          <div class="card-head">
            <span class="card-title">Annonces récentes</span>
            <a routerLink="/dashboard/mes-annonces" class="card-link">Voir tout →</a>
          </div>

          @if (recentAnnonces().length === 0) {
            <div class="empty">
              <div class="empty-icon">
                <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10
                       a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4
                       a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <p>Vous n'avez pas encore d'annonce publiée.</p>
              <a routerLink="/annonces/creer" class="btn-primary">
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Publier une annonce
              </a>
            </div>
          } @else {
            @for (a of recentAnnonces(); track a.id) {
              <div class="annonce-row">
                <div class="annonce-thumb">
                  @if (a.photoUrl) {
                    <img [src]="a.photoUrl" [alt]="a.typeBien" />
                  } @else {
                    <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86
                           a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2
                           H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  }
                </div>
                <div class="annonce-info">
                  <div class="annonce-name">{{ a.typeBien }} — {{ a.quartier }}, {{ a.ville }}</div>
                  <div class="annonce-sub">{{ a.datePublication | timeAgo }}</div>
                </div>
                <div style="flex-shrink:0">
                  <app-status-badge [statut]="a.statut" />
                </div>
                <div class="annonce-right">
                  <div class="annonce-price">{{ a.prix | fcfa }}</div>
                  <div class="annonce-views">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {{ a.nombreVues }} vues
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class DashboardOverviewComponent implements OnInit {
  private readonly annonceApi = inject(AnnonceApi);

  loading = signal(true);
  dashStats = signal<DashboardStatsResponse | null>(null);
recentAnnonces = signal<AnnonceDashboardResponse[]>([]);
  expiringAnnonces = signal<AnnonceListResponse[]>([]);

  stats = () => {
    const d = this.dashStats();
    return [
      {
        label: 'Annonces actives',
        value: d?.nombreAnnoncesActives ?? 0,
        delta: '+2 ce mois',
        up: true,
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
      {
        label: 'Vues totales',
        value: d?.nombreVuesTotal ?? 0,
        delta: '+18 % / mois',
        up: true,
        icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      },
      {
        label: 'Contacts reçus',
        value: d?.nombreContactsTotal ?? 0,
        delta: '−5 / semaine',
        up: false,
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      },
      {
        label: 'Favoris',
        value: d?.nombreFavorisTotal ?? 0,
        delta: '+4 ce mois',
        up: true,
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      },
    ];
  };

  statuts = () => {
    const list = this.recentAnnonces();
    return {
      actives: list.filter((a) => a.statut === 'ACTIVE').length,
      pauses: list.filter((a) => a.statut === 'EN_PAUSE').length,
      expirees: list.filter((a) => a.statut === 'EXPIREE').length,
      revision: list.filter((a) => a.statut === 'EN_ATTENTE').length,
    };
  };

  getBarWidth(statut: string): string {
    const s = this.statuts();
    const total = s.actives + s.pauses + s.expirees + s.revision || 1;
    const map: Record<string, number> = {
      ACTIVE: s.actives,
      EN_PAUSE: s.pauses,
      EXPIREE: s.expirees,
      EN_ATTENTE: s.revision,
    };
    return ((map[statut] ?? 0) / total) * 100 + '%';
  }

  ngOnInit(): void {
    this.annonceApi.getDashboardStats().subscribe({
      next: (res) => {
        this.dashStats.set(res.data);
        this.expiringAnnonces.set(res.data.annoncesExpirantBientot ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.annonceApi.getMesAnnonces({ page: 0, size: 5 }).subscribe({
      next: (res) => this.recentAnnonces.set(res.data.contenu),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short' });
  }
}
