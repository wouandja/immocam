import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AnnonceListResponse } from '@core/services/models';
import { favoriActions } from '@store/favori/favori.actions';
import { selectIsLoggedIn } from '@store/auth/auth.selectors';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { LazyImgDirective } from '@shared/directives/lazy-img.directive';

@Component({
  selector: 'app-annonce-card',
  standalone: true,
  imports: [CommonModule, RouterLink, FcfaPipe, TimeAgoPipe, LazyImgDirective],
  styles: [`
    

    .card {
      background: #fff;
      border-radius: 14px;
      border: 0.5px solid rgba(0,0,0,0.08);
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .card:hover {
      border-color: rgba(0,0,0,0.16);
      transform: translateY(-2px);
    }
    .card:hover .card-img img { transform: scale(1.05); }

    /* ── Image ── */
    .card-img {
      position: relative;
      height: 160px;
      overflow: hidden;
      background: #f3f4f6;
    }
    @media (min-width: 640px) { .card-img { height: 180px; } }

    .card-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }

    /* Skeleton shimmer while image loads */
    .img-skeleton {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    .card-img img.loaded + .img-skeleton { display: none; }

    /* Fallback placeholder quand aucune image */
    .no-photo {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
    }

    /* ── Badges ── */
    .badge-type {
      position: absolute;
      top: 9px;
      left: 9px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 0.5px solid rgba(0,0,0,0.08);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.025em;
      color: #111827;
    }
    .badge-statut {
      position: absolute;
      top: 9px;
      left: 9px;
      border-radius: 6px;
      padding: 3px 9px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .badge-pause   { background: #FEF9C3; color: #92400E; }
    .badge-expired { background: #FEE2E2; color: #991B1B; }
    .badge-archived{ background: #F3F4F6; color: #374151; }
    .badge-deleted { background: #FEE2E2; color: #7F1D1D; }

    /* ── Favori ── */
    .btn-favori {
      position: absolute;
      top: 9px;
      right: 9px;
      width: 28px;
      height: 28px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 0.5px solid rgba(0,0,0,0.08);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease;
      padding: 0;
    }
    .btn-favori:hover { transform: scale(1.12); }

    /* ── Body ── */
    .card-body { padding: 11px 12px 13px; }
    @media (min-width: 640px) { .card-body { padding: 13px 14px 14px; } }

    .card-prix {
 
      font-size: 15px;
      font-weight: 500;
      color: #0f172a;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    @media (min-width: 640px) { .card-prix { font-size: 17px; } }

    .card-loc {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .card-loc svg { width: 10px; height: 10px; flex-shrink: 0; color: #9ca3af; }
    .card-loc span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .card-sep { height: 0.5px; background: rgba(0,0,0,0.07); margin-bottom: 10px; }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .card-stats { display: flex; align-items: center; gap: 8px; }
    .stat { display: flex; align-items: center; gap: 3px; font-size: 10px; color: #9ca3af; }
    .stat svg { width: 10px; height: 10px; }
    .card-date { font-size: 10px; color: #9ca3af; }

    .btn-detail {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #111827;
      background: #f9fafb;
      border: 0.5px solid rgba(0,0,0,0.14);
      border-radius: 20px;
      padding: 4px 11px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    .btn-detail:hover { background: #f1f5f9; border-color: rgba(0,0,0,0.22); }
  `],
  template: `
    <article
      class="card"
      [routerLink]="['/annonces', annonce.id]"
      [attr.aria-label]="'Annonce: ' + annonce.typeBien + ' à ' + annonce.quartier"
    >
      <!-- Photo -->
      <div class="card-img">
        @if (annonce.photoPrincipaleThumb || annonce.photoPrincipale) {
          <img
            [src]="annonce.photoPrincipaleThumb || annonce.photoPrincipale"
            [alt]="annonce.typeBien + ' à ' + annonce.quartier"
            loading="lazy"
            (load)="onImgLoad($event)"
            (error)="onImgError($event)"
          />
          <div class="img-skeleton"></div>
        } @else {
          <div class="no-photo">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.6">
              <path [attr.d]="getTypeIconPath(annonce.typeBien)"/>
            </svg>
          </div>
        }

        <!-- Badge type ou statut -->
        @if (annonce.statut === 'ACTIVE') {
          <span class="badge-type">{{ annonce.typeBien }}</span>
        } @else {
          <span class="badge-statut" [class]="statusClass">{{ statusLabel }}</span>
        }

        <!-- Favori -->
        @if (isLoggedIn()) {
          <button
            class="btn-favori"
            (click)="toggleFavori($event)"
            [attr.aria-label]="annonce.isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" stroke-width="1.8"
              [attr.fill]="annonce.isFavori ? '#e11d48' : 'none'"
              [attr.stroke]="annonce.isFavori ? '#e11d48' : '#9ca3af'">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                   a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                   1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        }
      </div>

      <!-- Body -->
      <div class="card-body">
        <p class="card-prix">{{ annonce.prixFormate }}</p>

        <div class="card-loc">
          <!-- Pin icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0
                 l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
          </svg>
          <span>{{ annonce.quartier }} · {{ annonce.ville }}</span>
        </div>

        <div class="card-sep"></div>

        <div class="card-footer">
          <div class="card-stats">
            <!-- Vues -->
            <span class="stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {{ annonce.nombreVues }}
            </span>
            <!-- Commentaires -->
            <span class="stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ annonce.nombreCommentaires }}
            </span>
            <span class="card-date">{{ annonce.datePublication | timeAgo }}</span>
          </div>

          <a class="btn-detail"
            [routerLink]="['/annonces', annonce.id]"
            (click)="$event.stopPropagation()">
            Détails
          </a>
        </div>
      </div>
    </article>
  `,
})
export class AnnonceCardComponent {
  @Input({ required: true }) annonce!: AnnonceListResponse;
  @Output() favoriteToggled = new EventEmitter<{ id: number; isFavori: boolean }>();

  private readonly store = inject(Store);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  /** Révèle l'image et masque le skeleton */
  onImgLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('loaded');
  }

  /** Si l'image échoue à charger, on remplace par le SVG placeholder */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const icon = encodeURIComponent(this.getTypeIconPath(this.annonce.typeBien));
    img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 160'%3E%3Crect width='200' height='160' fill='%23f3f4f6'/%3E%3Cg transform='translate(72 52)'%3E%3Csvg width='56' height='56' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.6'%3E%3Cpath d='${icon}'/%3E%3C/svg%3E%3C/g%3E%3C/svg%3E`;
    img.classList.add('loaded'); // masque le skeleton
  }

  getTypeIconPath(typeBien: string): string {
    const n = (typeBien || '').toLowerCase();
    if (n.includes('terrain')) return 'M4 20h16M7 20V9m5 11V6m5 14v-8M3 10l4-3 5 2 5-4 4 2';
    if (n.includes('bureau')) return 'M3 7h18v13H3zM8 7V4h8v3M7 12h10M9 16h6';
    return 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1-1z';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      EN_PAUSE:  'badge-pause',
      EXPIREE:   'badge-expired',
      ARCHIVEE:  'badge-archived',
      SUPPRIMEE: 'badge-deleted',
    };
    return map[this.annonce.statut] ?? '';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      EN_PAUSE:  'En pause',
      EXPIREE:   'Expirée',
      ARCHIVEE:  'Archivée',
      SUPPRIMEE: 'Supprimée',
    };
    return map[this.annonce.statut] ?? '';
  }

  toggleFavori(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.annonce.isFavori) {
      this.store.dispatch(favoriActions.remove({ annonceId: this.annonce.id }));
    } else {
      this.store.dispatch(favoriActions.add({ annonceId: this.annonce.id }));
    }
    this.favoriteToggled.emit({ id: this.annonce.id, isFavori: !this.annonce.isFavori });
  }
}
