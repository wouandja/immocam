import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { favoriActions } from '@store/favori/favori.actions';
import { selectFavoris, selectFavoriLoading } from '@store/favori/favori.selectors';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { AnnonceCardSkeletonComponent } from '@shared/components/annonce-card-skeleton/annonce-card-skeleton.component';
import { LazyImgDirective } from '@shared/directives/lazy-img.directive';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-mes-favoris',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, FcfaPipe,
            AnnonceCardSkeletonComponent, LazyImgDirective, TimeAgoPipe],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500&display=swap');

    .card {
      background: #fff;
      border-radius: 14px;
      border: 0.5px solid rgba(0,0,0,0.08);
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .card:hover { border-color: rgba(0,0,0,0.16); transform: translateY(-2px); }
    .card:hover .card-img img { transform: scale(1.05); }

    .card-img {
      position: relative;
      height: 172px;
      overflow: hidden;
      background: #f3f4f6;
    }
    .card-img img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }

    .no-photo {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #f8f9fa;
    }

    .badge-type {
      position: absolute; top: 10px; left: 10px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      border: 0.5px solid rgba(0,0,0,0.08);
      border-radius: 6px; padding: 3px 9px;
      font-size: 11px; font-weight: 600;
      letter-spacing: 0.025em; color: #111827;
    }

    .badge-statut {
      position: absolute; top: 10px; left: 10px;
      background: rgba(0,0,0,0.55); color: #fff;
      border-radius: 6px; padding: 3px 9px;
      font-size: 11px; font-weight: 600;
    }

    .btn-retirer {
      position: absolute; top: 10px; right: 10px;
      width: 30px; height: 30px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      border: 0.5px solid rgba(0,0,0,0.08);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; padding: 0;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .btn-retirer:hover { transform: scale(1.12); background: rgba(254,226,226,0.95); }

    .overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    }
    .overlay span {
      background: rgba(255,255,255,0.92);
      border-radius: 20px; padding: 4px 12px;
      font-size: 11px; font-weight: 600; color: #374151;
    }

    .card-body { padding: 13px 14px 14px; }

    .card-prix {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 17px; font-weight: 500;
      color: #0f172a; letter-spacing: -0.01em;
      margin-bottom: 4px; line-height: 1.3;
    }

    .card-loc {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #6b7280; margin-bottom: 12px;
    }
    .card-loc svg { width: 11px; height: 11px; flex-shrink: 0; color: #9ca3af; }
    .card-loc span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .card-sep { height: 0.5px; background: rgba(0,0,0,0.07); margin-bottom: 11px; }

    .card-footer {
      display: flex; align-items: center;
      justify-content: space-between; gap: 8px;
    }

    .card-date { font-size: 11px; color: #9ca3af; }

    .btn-detail {
      font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
      color: #111827; background: #f9fafb;
      border: 0.5px solid rgba(0,0,0,0.14);
      border-radius: 20px; padding: 5px 13px;
      white-space: nowrap; text-decoration: none;
      display: inline-flex; align-items: center;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-detail:hover { background: #f1f5f9; border-color: rgba(0,0,0,0.22); }
  `],
  template: `
    @if (loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (_ of skeletons; track $index) {
          <app-annonce-card-skeleton />
        }
      </div>

    } @else if (favoris().length === 0) {
      <app-empty-state
        icon="heart"
        title="Aucun favori"
        subtitle="Ajoutez des annonces à vos favoris pour les retrouver facilement.">
        <a routerLink="/"
           class="mt-4 inline-block px-6 py-3 bg-blue-900 text-white
                  font-semibold rounded-xl hover:bg-blue-800 transition-all">
          Explorer les annonces
        </a>
      </app-empty-state>

    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (f of favoris(); track f.annonceId) {
          <!-- APRÈS -->
<article class="card" [class.opacity-60]="f.statut !== 'ACTIVE'"
         [routerLink]="['/annonces', f.annonceId]">

            <div class="card-img">
              @if (f.photoUrl) {
                <img [lazyImg]="f.photoUrl" [placeholder]="'/assets/images/no-photo.svg'"
                     [alt]="f.typeBien + ' à ' + f.quartier" />
              } @else {
                <div class="no-photo">
                  <svg width="32" height="32" viewBox="0 0 24 24"
                       fill="none" stroke="#d1d5db" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              }

              @if (f.statut === 'ACTIVE') {
                <span class="badge-type">{{ f.typeBien }}</span>
              } @else {
                <span class="badge-statut">{{ statusLabel(f.statut) }}</span>
                <div class="overlay"><span>{{ statusLabel(f.statut) }}</span></div>
              }

              <button class="btn-retirer" (click)="retirer($event, f.annonceId)"
                      aria-label="Retirer des favoris">
                <svg width="13" height="13" viewBox="0 0 24 24"
                     fill="none" stroke="#e11d48" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>

            <div class="card-body">
              <p class="card-prix">{{ f.prixFormate ?? (f.prix | fcfa) }}</p>
              <div class="card-loc">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0
                       l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                </svg>
                <span>{{ f.quartier }} · {{ f.ville }}</span>
              </div>
              <div class="card-sep"></div>
              <div class="card-footer">
                <span class="card-date">Ajouté {{ f.dateAjout | timeAgo }}</span>
                @if (f.statut === 'ACTIVE') {
                  <a class="btn-detail" [routerLink]="['/annonces', f.annonceId]"
                     (click)="$event.stopPropagation()">Détails</a>
                }
              </div>
            </div>

          </article>
        }
      </div>
    }
  `,
})
export class MesFavorisComponent implements OnInit {
  private readonly store = inject(Store);
  readonly favoris  = this.store.selectSignal(selectFavoris);
  readonly loading  = this.store.selectSignal(selectFavoriLoading);
  readonly skeletons = Array(6);

  ngOnInit(): void { this.store.dispatch(favoriActions.load()); }

  retirer(event: Event, annonceId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.dispatch(favoriActions.remove({ annonceId }));
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      EN_PAUSE:  'En pause',
      EXPIREE:   'Expirée',
      SUPPRIMEE: 'Supprimée',
    };
    return m[s] ?? s;
  }
}