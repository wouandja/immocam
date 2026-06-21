import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { AnnonceListResponse } from '@core/services/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { getExpiryStatus } from '@core/utils/expiry-status.util';

@Component({
  selector: 'app-dashboard-notifications',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, EmptyStateComponent],
  styles: [`
    :host { display: block; font-family: 'DM Sans', system-ui, sans-serif; }

    .page-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 14px; }

    .expiry-list { display: flex; flex-direction: column; gap: 8px; }
    .expiry-item {
      background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 10px;
      padding: 13px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      cursor: pointer; transition: background .12s, border-color .12s, transform .1s;
    }
    .expiry-item:hover  { border-color: #F3C677; background: #FFF6DE; }
    .expiry-item:active { transform: scale(.99); }
    .expiry-dot { width: 9px; height: 9px; border-radius: 50%; background: #F59E0B; flex-shrink: 0; }
    .expiry-name { font-size: 14px; font-weight: 600; color: #111827; }
    .expiry-date { font-size: 12px; color: #92400E; margin-top: 2px; }
    .expiry-go { color: #D1D5DB; flex-shrink: 0; transition: color .12s; }
    .expiry-go svg { width: 14px; height: 14px; display: block; }
    .expiry-item:hover .expiry-go { color: #1E3A5F; }

    .expiry-item.tier-urgent  { background: #FFF3E0; border-color: #FFCC80; }
    .expiry-item.tier-urgent:hover { background: #FFE9C7; border-color: #FFB74D; }
    .expiry-item.tier-urgent  .expiry-dot  { background: #F57C00; }
    .expiry-item.tier-urgent  .expiry-date { color: #BF360C; font-weight: 600; }
    .expiry-item.tier-expired { background: #FFEBEE; border-color: #FFCDD2; }
    .expiry-item.tier-expired:hover { background: #FFDCE0; border-color: #EF9A9A; }
    .expiry-item.tier-expired .expiry-dot  { background: #DC2626; }
    .expiry-item.tier-expired .expiry-date { color: #B71C1C; font-weight: 600; }

    .btn-renew {
      height: 34px; padding: 0 14px; background: #fff; color: #1E3A5F;
      border: 1.5px solid #E5E7EB; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
      white-space: nowrap; flex-shrink: 0; transition: background .15s, border-color .15s;
    }
    .btn-renew:hover { background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8; }
    .btn-renew:disabled { opacity: .5; cursor: not-allowed; }
  `],
  template: `
    <p class="page-title">Notifications</p>

    @if (loading()) {
      <app-loading-spinner/>
    } @else if (notifications().length === 0) {
      <app-empty-state
        icon="box"
        title="Aucune notification"
        subtitle="Vous serez alerté ici quand une de vos annonces approchera de sa date d'expiration." />
    } @else {
      <div class="expiry-list">
        @for (a of notifications(); track a.id) {
          <div class="expiry-item"
            [class.tier-urgent]="expiryTier(a) === 'urgent'"
            [class.tier-expired]="expiryTier(a) === 'expired'"
            (click)="goDetail(a.id)"
            [attr.title]="'Voir l\\'annonce ' + a.typeBien + ' — ' + a.quartier + ', ' + a.ville">
            <div class="expiry-dot"></div>
            <div style="flex:1;min-width:0">
              <div class="expiry-name">{{ a.typeBien }} — {{ a.quartier }}, {{ a.ville }}</div>
              <div class="expiry-date">{{ expiryLabel(a) }} ({{ formatDate(a.dateExpiration) }})</div>
            </div>
            <button class="btn-renew"
              [disabled]="renewingId() === a.id"
              (click)="$event.stopPropagation(); renouveler(a.id)">
              {{ renewingId() === a.id ? '…' : 'Renouveler' }}
            </button>
            <span class="expiry-go" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        }
      </div>
    }
  `,
})
export class DashboardNotificationsComponent implements OnInit {
  private readonly annonceApi = inject(AnnonceApi);
  private readonly router     = inject(Router);

  loading       = signal(true);
  renewingId    = signal<number | null>(null);
  notifications = signal<AnnonceListResponse[]>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.annonceApi.getDashboardStats().subscribe({
      next: res => {
        this.notifications.set(res.data?.annoncesExpirantBientot ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goDetail(id: number): void {
    this.router.navigate(['/annonces', id]);
  }

  renouveler(id: number): void {
    this.renewingId.set(id);
    this.annonceApi.renouveler(id).subscribe({
      next: () => { this.renewingId.set(null); this.load(); },
      error: () => this.renewingId.set(null),
    });
  }

  expiryTier(a: AnnonceListResponse) {
    return getExpiryStatus(a.dateExpiration, a.statut).tier;
  }
  expiryLabel(a: AnnonceListResponse): string {
    return getExpiryStatus(a.dateExpiration, a.statut).label;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
