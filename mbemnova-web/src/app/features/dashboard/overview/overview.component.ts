import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import {
  DashboardStatsResponse,
  AnnonceListResponse,
  AnnonceDashboardResponse,
} from '@core/services/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

// cSpell:ignore EXPIREE ARCHIVEE SUPPRIMEE

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
  styles: [`
    :host { display: block; font-family: 'DM Sans', system-ui, sans-serif; }

    .dash { display: flex; flex-direction: column; gap: 16px; }

    /* ── KPI grid ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2,1fr); } }

    .kpi {
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 16px;
      padding: 16px 18px; box-shadow: 0 1px 4px rgba(30,58,95,.04);
      transition: box-shadow .15s, border-color .15s; cursor: default;
    }
    .kpi:hover { border-color: #D1D5DB; box-shadow: 0 4px 12px rgba(30,58,95,.08); }
    .kpi-icon {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
    }
    .kpi-icon svg { width: 18px; height: 18px; }
    .kpi-val { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -.04em; line-height: 1; }
    .kpi-label { font-size: 11.5px; color: #6B7280; margin-top: 4px; font-weight: 500; }
    .kpi-sub {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 10.5px; font-weight: 600; margin-top: 8px;
      padding: 2px 8px; border-radius: 20px;
      background: #F1F5F9; color: #64748B;
    }

    /* ── Charts row ── */
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 640px) { .charts-row { grid-template-columns: 1fr; } }

    /* ── Card ── */
    .card {
      background: #fff; border: 1.5px solid #E5E7EB;
      border-radius: 16px; padding: 20px;
      box-shadow: 0 2px 8px rgba(30,58,95,.05);
    }
    .card-head {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
    }
    .card-title { font-size: 13px; font-weight: 700; color: #111827; letter-spacing: -.01em; }
    .card-link { font-size: 12px; font-weight: 600; color: #1E3A5F; text-decoration: none; transition: opacity .15s; }
    .card-link:hover { opacity: .7; }

    /* ── Sparkline ── */
    .spark-svg { width: 100%; display: block; }
    .trend-label { font-size: 12px; color: #6B7280; margin-top: 10px; display: flex; align-items: center; gap: 6px; }
    .trend-badge { display: inline-flex; align-items: center; gap: 3px; background: #ECFDF5; color: #059669; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .trend-badge svg { width: 10px; height: 10px; }

    /* ── Bar chart ── */
    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-name { font-size: 11px; font-weight: 600; color: #6B7280; width: 70px; flex-shrink: 0; }
    .bar-track { flex: 1; height: 8px; border-radius: 99px; background: #F3F4F6; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 99px; transition: width .45s ease; min-width: 4px; }
    .bf-active   { background: #059669; }
    .bf-pause    { background: #F59E0B; }
    .bf-expired  { background: #DC2626; }
    .bf-archived { background: #64748B; }
    .bar-count { font-size: 11px; font-weight: 700; color: #374151; width: 22px; text-align: right; flex-shrink: 0; }

    /* ── Alerte expiration ── */
    .expiry-list { display: flex; flex-direction: column; gap: 8px; }
    .expiry-item {
      background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 10px;
      padding: 11px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .expiry-dot { width: 8px; height: 8px; border-radius: 50%; background: #F59E0B; flex-shrink: 0; }
    .expiry-name { font-size: 13px; font-weight: 600; color: #111827; }
    .expiry-date { font-size: 11px; color: #92400E; margin-top: 2px; }
    .btn-renew {
      height: 32px; padding: 0 13px; background: #fff; color: #1E3A5F;
      border: 1.5px solid #E5E7EB; border-radius: 8px;
      font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit;
      white-space: nowrap; flex-shrink: 0; transition: background .15s, border-color .15s;
    }
    .btn-renew:hover { background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8; }
    .btn-renew:disabled { opacity: .5; cursor: not-allowed; }

    /* ── TABLE annonces récentes ── */
    .table-outer { border-radius: 12px; overflow: hidden; border: 1px solid #F1F5F9; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #F8FAFC; border-bottom: 1.5px solid #F1F5F9; }
    th {
      padding: 10px 14px; text-align: left;
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: #94A3B8; white-space: nowrap; user-select: none;
    }
    th.r { text-align: right; }
    tbody tr {
      border-top: 1px solid #F8FAFC;
      cursor: pointer; transition: background .1s;
    }
    tbody tr:hover { background: #F0F7FF; }
    tbody tr:hover .td-arr { color: #3B82F6; }
    td { padding: 11px 14px; vertical-align: middle; }
    td.r { text-align: right; }

    .td-ann { display: flex; align-items: center; gap: 10px; }
    .td-thumb {
      width: 40px; height: 40px; border-radius: 9px; overflow: hidden; flex-shrink: 0;
      background: #EEF2FF; border: 1px solid #E0E7FF;
      display: flex; align-items: center; justify-content: center;
    }
    .td-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .td-thumb svg { width: 17px; height: 17px; color: #A5B4FC; }
    .td-name { font-size: 13px; font-weight: 600; color: #111827; line-height: 1.2; }
    .td-loc { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
    .td-price { font-size: 13px; font-weight: 700; color: #1E3A5F; white-space: nowrap; }
    .td-stat { font-size: 12px; color: #6B7280; font-weight: 500; }
    .td-date { font-size: 11px; color: #9CA3AF; white-space: nowrap; }
    .td-arr { color: #D1D5DB; transition: color .1s; }
    .td-arr svg { width: 14px; height: 14px; display: block; }

    /* ── Empty ── */
    .empty { padding: 40px 20px; text-align: center; }
    .empty-icon {
      width: 52px; height: 52px; border-radius: 14px; background: #F0F4F8;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
    }
    .empty-icon svg { width: 24px; height: 24px; color: #9CA3AF; }
    .empty p { font-size: 14px; color: #6B7280; margin-bottom: 16px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      height: 46px; padding: 0 22px; background: #1E3A5F; color: #fff;
      border-radius: 10px; border: none; font-size: 14px; font-weight: 600;
      text-decoration: none; font-family: inherit; transition: background .15s;
    }
    .btn-primary:hover { background: #162D4A; }
    .btn-primary svg { width: 16px; height: 16px; }
  `],
  template: `
    @if (loading()) {
      <app-loading-spinner/>
    } @else {
      <div class="dash">

        <!-- ── KPIs — valeurs réelles du backend ── -->
        <div class="kpi-grid">
          @for (k of kpiList(); track k.label) {
            <div class="kpi">
              <div class="kpi-icon" [style.background]="k.bg">
                <svg fill="none" stroke="currentColor" [style.color]="k.color"
                     stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="k.icon"/>
                </svg>
              </div>
              <div class="kpi-val">{{ k.value | number }}</div>
              <div class="kpi-label">{{ k.label }}</div>
              <div class="kpi-sub">{{ k.sub }}</div>
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
            <svg class="spark-svg" viewBox="0 0 280 72" role="img" aria-label="Évolution des vues">
              <defs>
                <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1E3A5F" stop-opacity=".12"/>
                  <stop offset="100%" stop-color="#1E3A5F" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 62 L10 58 L20 54 L30 50 L40 55 L50 48 L60 42 L70 38 L80 44
                       L90 40 L100 35 L110 30 L120 36 L130 28 L140 22 L150 26 L160 20
                       L170 15 L180 18 L190 12 L200 16 L210 10 L220 14 L230 8 L240 11
                       L250 6 L260 9 L270 4 L280 2 L280 72 L0 72 Z" fill="url(#spark-fill)"/>
              <path d="M0 62 L10 58 L20 54 L30 50 L40 55 L50 48 L60 42 L70 38 L80 44
                       L90 40 L100 35 L110 30 L120 36 L130 28 L140 22 L150 26 L160 20
                       L170 15 L180 18 L190 12 L200 16 L210 10 L220 14 L230 8 L240 11
                       L250 6 L260 9 L270 4 L280 2"
                    fill="none" stroke="#1E3A5F" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="280" cy="2" r="3.5" fill="#1E3A5F"/>
            </svg>
            <div class="trend-label">
              Tendance ce mois
              <span class="trend-badge">
                <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>
                </svg>
                en hausse
              </span>
            </div>
          </div>

          <!-- Répartition statuts — depuis toutes mes annonces ── -->
          <div class="card">
            <div class="card-head">
              <span class="card-title">Répartition des annonces</span>
              <span style="font-size:11px;color:#94A3B8;">{{ totalAnnonces() }} au total</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">Actives</span>
              <div class="bar-track">
                <div class="bar-fill bf-active" [style.width]="barPct('ACTIVE')"></div>
              </div>
              <span class="bar-count">{{ repartition().actives }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">En pause</span>
              <div class="bar-track">
                <div class="bar-fill bf-pause" [style.width]="barPct('EN_PAUSE')"></div>
              </div>
              <span class="bar-count">{{ repartition().pauses }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">Expirées</span>
              <div class="bar-track">
                <div class="bar-fill bf-expired" [style.width]="barPct('EXPIREE')"></div>
              </div>
              <span class="bar-count">{{ repartition().expirees }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-name">Archivées</span>
              <div class="bar-track">
                <div class="bar-fill bf-archived" [style.width]="barPct('ARCHIVEE')"></div>
              </div>
              <span class="bar-count">{{ repartition().archivees }}</span>
            </div>
          </div>
        </div>

        <!-- ── Expirant bientôt ── -->
        @if (expiringAnnonces().length > 0) {
          <div class="card">
            <div class="card-head">
              <span class="card-title">⏰ Expirant dans 7 jours</span>
              <a routerLink="/dashboard/mes-annonces" class="card-link">Voir tout →</a>
            </div>
            <div class="expiry-list">
              @for (a of expiringAnnonces(); track a.id) {
                <div class="expiry-item">
                  <div class="expiry-dot"></div>
                  <div style="flex:1;min-width:0">
                    <div class="expiry-name">{{ a.typeBien }} — {{ a.quartier }}, {{ a.ville }}</div>
                    <div class="expiry-date">Expire le {{ formatDate(a.dateExpiration) }}</div>
                  </div>
                  <button class="btn-renew"
                    [disabled]="renewingId() === a.id"
                    (click)="renouveler(a.id)">
                    {{ renewingId() === a.id ? '…' : 'Renouveler' }}
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- ── Annonces récentes — tableau cliquable ── -->
        <div class="card">
          <div class="card-head">
            <span class="card-title">Mes annonces récentes</span>
            <a routerLink="/dashboard/mes-annonces" class="card-link">Voir tout →</a>
          </div>

          @if (allAnnonces().length === 0) {
            <div class="empty">
              <div class="empty-icon">
                <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10
                       a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4
                       a1 1 0 001 1m-6 0h6"/>
                </svg>
              </div>
              <p>Vous n'avez pas encore d'annonce publiée.</p>
              <a routerLink="/annonces/creer" class="btn-primary">
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Publier une annonce
              </a>
            </div>
          } @else {
            <div class="table-outer">
              <table>
                <thead>
                  <tr>
                    <th>Annonce</th>
                    <th>Statut</th>
                    <th class="r">Prix</th>
                    <th class="r">Vues</th>
                    <th class="r">Contacts</th>
                    <th class="r">Publié</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of allAnnonces(); track a.id) {
                    <tr (click)="goDetail(a.id)" [attr.title]="'Voir annonce ' + a.typeBien">
                      <td>
                        <div class="td-ann">
                          <div class="td-thumb">
                            @if (a.photoUrl) {
                              <img [src]="a.photoUrl" [alt]="a.typeBien" loading="lazy"/>
                            } @else {
                              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2
                                     l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01
                                     M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                            }
                          </div>
                          <div>
                            <div class="td-name">{{ a.typeBien }}</div>
                            <div class="td-loc">{{ a.quartier }}, {{ a.ville }}</div>
                          </div>
                        </div>
                      </td>
                      <td><app-status-badge [statut]="a.statut"/></td>
                      <td class="r"><span class="td-price">{{ a.prix | fcfa }}</span></td>
                      <td class="r"><span class="td-stat">{{ a.nombreVues }}</span></td>
                      <td class="r"><span class="td-stat">{{ a.nombreContacts }}</span></td>
                      <td class="r"><span class="td-date">{{ a.datePublication | timeAgo }}</span></td>
                      <td>
                        <div class="td-arr">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </div>
    }
  `,
})
export class DashboardOverviewComponent implements OnInit {
  private readonly annonceApi = inject(AnnonceApi);
  private readonly router     = inject(Router);

  loading          = signal(true);
  renewingId       = signal<number | null>(null);
  dashStats        = signal<DashboardStatsResponse | null>(null);

  // Toutes les annonces du proprio — pour répartition ET tableau
  // On charge taille=100 pour avoir toutes les annonces (pas juste 5)
  allAnnonces      = signal<AnnonceDashboardResponse[]>([]);
  expiringAnnonces = signal<AnnonceListResponse[]>([]);

  // ── KPI — valeurs RÉELLES depuis getDashboardStats() ─────────────────────
  // NE PAS calculer depuis allAnnonces() : les stats backend sont plus précises
  // (contacts filtrés pour exclure le proprio, vues pareil)
  kpiList = () => {
    const d = this.dashStats();
    return [
      {
        label: 'Annonces actives',
        value: d?.nombreAnnoncesActives ?? 0,
        sub: `sur ${d?.nombreAnnoncesTotal ?? 0} publiées`,
        bg: '#EEF2FF', color: '#4F46E5',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
      {
        label: 'Vues totales',
        value: d?.nombreVuesTotal ?? 0,
        sub: 'hors propriétaire',
        bg: '#ECFDF5', color: '#059669',
        icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      },
      {
        label: 'Contacts reçus',
        value: d?.nombreContactsTotal ?? 0,
        sub: 'clics WhatsApp uniques',
        bg: '#FFF7ED', color: '#EA580C',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      },
      {
        label: 'Mis en favoris',
        value: d?.nombreFavorisTotal ?? 0,
        sub: 'par des visiteurs',
        bg: '#FFF1F2', color: '#E11D48',
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      },
    ];
  };

  // ── Répartition — calculée depuis allAnnonces() ───────────────────────────
  repartition = () => {
    const list = this.allAnnonces();
    return {
      actives:   list.filter(a => a.statut === 'ACTIVE').length,
      pauses:    list.filter(a => a.statut === 'EN_PAUSE').length,
      expirees:  list.filter(a => a.statut === 'EXPIREE').length,
      archivees: list.filter(a => a.statut === 'ARCHIVEE').length,
    };
  };

  totalAnnonces = () => {
    const r = this.repartition();
    return r.actives + r.pauses + r.expirees + r.archivees;
  };

  barPct(statut: string): string {
    const r = this.repartition();
    const total = this.totalAnnonces() || 1;
    const map: Record<string, number> = {
      ACTIVE:   r.actives,
      EN_PAUSE: r.pauses,
      EXPIREE:  r.expirees,
      ARCHIVEE: r.archivees,
    };
    return Math.max((map[statut] ?? 0) / total * 100, 0) + '%';
  }

  ngOnInit(): void {
    // ① Stats globales — KPIs (contacts et favoris exacts depuis le backend)
    this.annonceApi.getDashboardStats().subscribe({
      next: res => {
        this.dashStats.set(res.data);
        this.expiringAnnonces.set(res.data?.annoncesExpirantBientot ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // ② Toutes mes annonces — pour le tableau ET la répartition
    // taille=100 pour charger tout (ou adapter si tu as une pagination infinie)
    this.annonceApi.getMesAnnonces({ page: 0, size: 100 }).subscribe({
      next: res => this.allAnnonces.set(res.data?.contenu ?? []),
    });
  }

  goDetail(id: number): void {
    this.router.navigate(['/annonces', id]);
  }

  renouveler(id: number): void {
    this.renewingId.set(id);
    this.annonceApi.renouveler(id).subscribe({
      next: () => {
        this.renewingId.set(null);
        // Recharger les stats et la liste d'expiration
        this.annonceApi.getDashboardStats().subscribe({
          next: res => {
            this.dashStats.set(res.data);
            this.expiringAnnonces.set(res.data?.annoncesExpirantBientot ?? []);
          },
        });
      },
      error: () => this.renewingId.set(null),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short' });
  }
}