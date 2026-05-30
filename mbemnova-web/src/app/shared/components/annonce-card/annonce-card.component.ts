import {
  Component, Input, Output, EventEmitter,
  inject, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AnnonceListResponse } from '@core/services/models';
import { favoriActions } from '@store/favori/favori.actions';
import { selectFavoriIds } from '@store/favori/favori.selectors';
import { selectIsLoggedIn } from '@store/auth/auth.selectors';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

// cSpell:ignore EXPIREE ARCHIVEE SUPPRIMEE

@Component({
  selector: 'app-annonce-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FcfaPipe, TimeAgoPipe],
  styles: [`
    .card {
      background: #fff;
      border-radius: 16px;
      border: 0.5px solid rgba(0,0,0,0.08);
      overflow: hidden;
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease;
      display: block;
      text-decoration: none;
      color: inherit;
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
    .card:hover .c-img img { transform: scale(1.06); }

    .c-img {
      position: relative; height: 185px; overflow: hidden;
      background: #EEF0FB;
    }
    @media (min-width: 640px) { .c-img { height: 200px; } }
    .c-img img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform .45s cubic-bezier(.22,1,.36,1);
    }
    .img-shimmer {
      position: absolute; inset: 0;
      background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
      background-size: 200% 100%;
      animation: shim 1.4s infinite;
    }
    @keyframes shim { to { background-position: -200% 0; } }
    .img-loaded .img-shimmer { display: none; }

    .no-photo {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px;
    }
    .no-photo svg { width: 34px; height: 34px; }

    .badge-type {
      position: absolute; top: 10px; left: 10px;
      background: rgba(255,255,255,0.93); border: 0.5px solid rgba(0,0,0,0.10);
      border-radius: 6px; padding: 3px 9px;
      font-size: 10.5px; font-weight: 700; color: #0D1B4A; letter-spacing: .02em;
    }
    .badge-statut {
      position: absolute; top: 10px; left: 10px;
      border-radius: 6px; padding: 3px 9px;
      font-size: 10.5px; font-weight: 700;
    }
    .s-pause    { background: #FFF3E0; color: #BF360C; }
    .s-expired  { background: #FFEBEE; color: #B71C1C; }
    .s-archived { background: #ECEFF1; color: #37474F; }

    .price-tag {
      position: absolute; bottom: 10px; left: 10px;
      background: rgba(13,27,74,0.88); color: #fff;
      padding: 5px 13px; border-radius: 20px;
      font-size: 13px; font-weight: 700; letter-spacing: .3px;
    }

    .btn-fav {
      position: absolute; top: 10px; right: 10px;
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,0.93); border: 0.5px solid rgba(0,0,0,0.10);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; padding: 0;
      transition: transform .15s;
    }
    .btn-fav:hover { transform: scale(1.15); }
    .btn-fav svg { width: 13px; height: 13px; transition: fill .2s, stroke .2s; }

    .c-body { padding: 12px 13px 0; }
    .c-title {
      font-size: 14px; font-weight: 800; color: #0D1B2A;
      letter-spacing: -.3px; margin-bottom: 5px; line-height: 1.25;
    }
    .c-loc {
      display: flex; align-items: center; gap: 4px;
      font-size: 11.5px; color: #546E7A; margin-bottom: 10px;
    }
    .c-loc svg { width: 11px; height: 11px; flex-shrink: 0; color: #5C6BC0; }

    .c-sep { height: 0.5px; background: rgba(0,0,0,0.07); }
    .c-foot {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 13px 12px;
    }
    .c-stats { display: flex; align-items: center; gap: 10px; }
    .stat { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #90A4AE; }
    .stat svg { width: 11px; height: 11px; }
    .c-date { font-size: 10.5px; color: #B0BEC5; }
    .btn-detail {
      font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
      color: #1A237E; background: #E8EAF6; border: none;
      border-radius: 20px; padding: 5px 12px;
      cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center; gap: 3px;
      transition: background .15s;
    }
    .btn-detail:hover { background: #C5CAE9; }
    .btn-detail svg { width: 11px; height: 11px; }
  `],
  template: `
    <article class="card" [routerLink]="['/annonces', annonce.id]"
             [attr.aria-label]="annonce.typeBien + ' à ' + annonce.quartier">

      <div class="c-img" [class.img-loaded]="imgLoaded">
        @if (annonce.photoPrincipaleThumb || annonce.photoPrincipale) {
          <img
            [src]="annonce.photoPrincipaleThumb || annonce.photoPrincipale"
            [alt]="annonce.typeBien + ' à ' + annonce.quartier"
            loading="lazy"
            (load)="imgLoaded = true"
            (error)="onImgError($event)"
          />
          <div class="img-shimmer"></div>
        } @else {
          <div class="no-photo">
            <svg fill="none" stroke="#9FA8DA" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="typeIconPath"/>
            </svg>
          </div>
        }

        @if (annonce.statut === 'ACTIVE') {
          <span class="badge-type">{{ annonce.typeBien }}</span>
        } @else {
          <span class="badge-statut" [ngClass]="statusClass">{{ statusLabel }}</span>
        }

        <div class="price-tag">{{ annonce.prixFormate }}</div>

        @if (isLoggedIn()) {
          <button
            class="btn-fav"
            (click)="toggleFavori($event)"
            [attr.aria-label]="isFavori() ? 'Retirer des favoris' : 'Ajouter aux favoris'">
            <svg viewBox="0 0 24 24" stroke-width="2"
              [attr.fill]="isFavori() ? '#e11d48' : 'none'"
              [attr.stroke]="isFavori() ? '#e11d48' : '#9ca3af'">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                   a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                   1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        }
      </div>

      <div class="c-body">
        <div class="c-title">{{ annonce.typeBien }} à {{ annonce.quartier }}</div>
        <div class="c-loc">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {{ annonce.quartier }}, {{ annonce.ville }} · Cameroun
        </div>
      </div>

      <div class="c-sep"></div>

      <div class="c-foot">
        <div class="c-stats">
          <span class="stat">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {{ annonce.nombreVues }}
          </span>
          <span class="stat">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {{ annonce.nombreCommentaires }}
          </span>
          <span class="c-date">{{ annonce.datePublication | timeAgo }}</span>
        </div>
        <a class="btn-detail" [routerLink]="['/annonces', annonce.id]"
           (click)="$event.stopPropagation()">
          Voir
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </article>
  `,
})
export class AnnonceCardComponent {
  @Input({ required: true }) annonce!: AnnonceListResponse;
  @Output() favoriteToggled = new EventEmitter<{ id: number; isFavori: boolean }>();

  private readonly store = inject(Store);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  // ✅ Source de vérité : Set<number> depuis le store favori
  // Ne dépend PAS de annonce.isFavori → cohérent sur toutes les pages
  private readonly favoriIds = this.store.selectSignal(selectFavoriIds);
  readonly isFavori = computed(() => this.favoriIds().has(this.annonce.id));

  imgLoaded = false;

  get typeIconPath(): string {
    const n = (this.annonce.typeBien || '').toLowerCase();
    if (n.includes('terrain')) return 'M4 20h16M7 20V9m5 11V6m5 14v-8M3 10l4-3 5 2 5-4 4 2';
    if (n.includes('bureau'))  return 'M3 7h18v13H3zM8 7V4h8v3M7 12h10M9 16h6';
    return 'M3 10l9-7 9 7v10a1 1 0 01-1 1h-6v-6H10v6H4a1 1 0 01-1-1z';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      EN_PAUSE:  's-pause',
      EXPIREE:   's-expired',
      ARCHIVEE:  's-archived',
    };
    return map[this.annonce.statut] ?? '';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      EN_PAUSE:  'En pause',
      EXPIREE:   'Expirée',
      ARCHIVEE:  'Archivée',
    };
    return map[this.annonce.statut] ?? '';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
    this.imgLoaded = true;
  }

  toggleFavori(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    // Lire l'état ACTUEL depuis le store (pas annonce.isFavori)
    const estFavoriActuellement = this.isFavori();
    if (estFavoriActuellement) {
      this.store.dispatch(favoriActions.remove({ annonceId: this.annonce.id }));
    } else {
      this.store.dispatch(favoriActions.add({ annonceId: this.annonce.id }));
    }
    // Émettre pour le parent si besoin, mais NE PAS recharger la liste
    this.favoriteToggled.emit({ id: this.annonce.id, isFavori: !estFavoriActuellement });
  }
}