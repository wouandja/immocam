import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';

import { annonceActions } from '@store/annonce/annonce.actions';
import { favoriActions } from '@store/favori/favori.actions';
import {
  selectAnnonces,
  selectAnnonceLoading,
  selectLoadingMore,
  selectHasMore,
} from '@store/annonce/annonce.selectors';
import { selectIsLoggedIn } from '@store/auth/auth.selectors';

import { AnnonceCardComponent } from '@shared/components/annonce-card/annonce-card.component';
import { AnnonceCardSkeletonComponent } from '@shared/components/annonce-card-skeleton/annonce-card-skeleton.component';
import { InfiniteScrollComponent } from '@shared/components/infinite-scroll/infinite-scroll.component';

import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { AnnonceFilters, TypeBienResponse } from '@core/services/models'; // ✅ LocalisationResponse retiré

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const PRIX_MAX_DEFAULT = 2_000_000;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    AnnonceCardComponent,
    AnnonceCardSkeletonComponent,
    InfiniteScrollComponent,
  ],
  styles: [
    `
      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .fade-up {
        animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .hero-wrap {
        position: relative;
        min-height: clamp(420px, 55vh, 620px);
        display: flex;
        align-items: center;
      }
      .hero-img {
        position: absolute;
        inset: 0;
        background-image: url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80&auto=format&fit=crop');
        background-size: cover;
        background-position: center 40%;
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          160deg,
          rgba(0, 0, 0, 0.55) 0%,
          rgba(0, 0, 0, 0.35) 50%,
          rgba(0, 0, 0, 0.6) 100%
        );
      }
      .hero-content {
        position: relative;
        z-index: 2;
        width: 100%;
      }

      /* Search card */
      .search-card {
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
      }

      /* Type pills */
      .pill {
        transition: all 0.15s ease;
      }
      .pill-on {
        background: #1d4ed8;
        color: #fff;
        border-color: #1d4ed8;
      }
      .pill-off {
        background: #fff;
        color: #374151;
        border-color: #e5e7eb;
      }
      .pill-off:hover {
        border-color: #93c5fd;
        color: #1d4ed8;
      }

      /* Range */
      input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        height: 3px;
        background: #e2e8f0;
        border-radius: 99px;
        outline: none;
        width: 100%;
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #1d4ed8;
        cursor: pointer;
      }
      input[type='range']::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #1d4ed8;
        cursor: pointer;
        border: none;
      }

      /* Card hover */
      .card-hover {
        transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .card-hover:hover {
        transform: translateY(-2px);
      }

      /* Select arrow custom */
      select {
        appearance: none;
        -webkit-appearance: none;
        background-image: none;
      }

      /* Spinner mini */
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .spin-sm {
        width: 14px;
        height: 14px;
        border: 2px solid #dbeafe;
        border-top-color: #1d4ed8;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        display: inline-block;
      }
    `,
  ],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly locApi = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // ── Signals Store ──────────────────────────────────────────────────────────
  readonly annonces = this.store.selectSignal(selectAnnonces);
  readonly loading = this.store.selectSignal(selectAnnonceLoading);
  readonly loadingMore = this.store.selectSignal(selectLoadingMore);
  readonly hasMore = this.store.selectSignal(selectHasMore);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];

  // ── Données référentiel (depuis l'API) ────────────────────────────────────
  readonly typesBiens = signal<TypeBienResponse[]>([]);
  readonly villes = signal<string[]>([]);
  readonly quartiers = signal<string[]>([]); // ✅ string[] — issus des annonces
  readonly loadingTypesBiens = signal(true);
  readonly loadingQuartiers = signal(false);

  // ── État filtres ───────────────────────────────────────────────────────────
  readonly selectedTypeBienId = signal<number | null>(null);
  searchVille = '';
  searchQuartier = ''; // ✅ remplace searchLocalisationId
  prixMinVal = 0;
  prixMaxVal = PRIX_MAX_DEFAULT;
  readonly PRIX_MAX = PRIX_MAX_DEFAULT;

  // ── État UI ────────────────────────────────────────────────────────────────
  readonly serverError = signal(false);
  readonly isOffline = signal(!navigator.onLine);
  readonly totalElements = signal(0);

  // ── Pagination interne ─────────────────────────────────────────────────────
  private currentPage = 0;
  private activeFilters: AnnonceFilters = { page: 0, taille: 12 };

  // ── Computed ───────────────────────────────────────────────────────────────

  /** SC-02 exception A: prix min > max */
  readonly prixError = computed(
    () => this.prixMinVal > 0 && this.prixMaxVal > 0 && this.prixMinVal > this.prixMaxVal,
  );

  /** Indique si au moins un filtre est actif */
  readonly hasActiveFilters = computed(
    () =>
      !!this.searchVille ||
      !!this.searchQuartier || // ✅
      this.selectedTypeBienId() !== null ||
      this.prixMinVal > 0 ||
      this.prixMaxVal < this.PRIX_MAX,
  );

  /** Label du type de bien sélectionné */
  readonly selectedTypeBienLabel = computed(
    () => this.typesBiens().find((t) => t.id === this.selectedTypeBienId())?.libelle ?? '',
  );

  /** Label du quartier sélectionné */
  readonly selectedQuartierLabel = computed(
    () => this.quartiers().find((q) => q === this.searchQuartier) ?? '', // ✅ comparaison string directe
  );

  // ── Cycle de vie ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    this._loadReferentiel();
    this._loadAnnonces({ page: 0, taille: 12 });

    if (this.isLoggedIn()) {
      this.store.dispatch(favoriActions.load());
    }

    // SC-01 exception B: surveillance hors connexion
    window.addEventListener('offline', () => this.isOffline.set(true));
    window.addEventListener('online', () => {
      this.isOffline.set(false);
      this._loadAnnonces(this.activeFilters);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Référentiel ────────────────────────────────────────────────────────────

  private _loadReferentiel(): void {
    // Types de biens → pills dynamiques
    this.loadingTypesBiens.set(true);
    this.typeBienApi
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.typesBiens.set(res.data ?? []);
          this.loadingTypesBiens.set(false);
        },
        error: () => this.loadingTypesBiens.set(false),
      });

    // Villes → dropdown ville
    this.locApi
      .getVilles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.villes.set(res.data ?? []),
        error: () => {},
      });
  }

  // ── Gestion des filtres ────────────────────────────────────────────────────

  selectType(id: number | null): void {
    this.selectedTypeBienId.set(id);
  }

  /** SC-02 nominal: changement de ville → charge les quartiers dynamiquement */
  onVilleChange(ville: string): void {
    this.searchVille = ville;
    this.searchQuartier = ''; // ✅ reset
    this.quartiers.set([]);

    if (!ville) return;

    // GET /localisations/quartiers?ville=... (SC-02 step 3)
    this.loadingQuartiers.set(true);
    this.locApi
      .getQuartiers(ville)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.quartiers.set(res.data ?? []);
          this.loadingQuartiers.set(false);
        },
        error: () => this.loadingQuartiers.set(false),
      });
  }

  /** SC-02 exception A: validation prix min/max */
  onPrixMinChange(val: number): void {
    this.prixMinVal = Number(val);
  }
  onPrixMaxChange(val: number): void {
    this.prixMaxVal = Number(val);
  }

  /** SC-02 nominal: lancer la recherche */
  onSearch(): void {
    if (this.prixError()) return;

    const params: Record<string, string | number> = {};

    if (this.searchVille) params['ville'] = this.searchVille;
    if (this.searchQuartier) params['quartier'] = this.searchQuartier; // ✅
    if (this.selectedTypeBienId() !== null) params['typeBienId'] = this.selectedTypeBienId()!;
    if (this.prixMinVal > 0) params['prixMin'] = this.prixMinVal;
    if (this.prixMaxVal < this.PRIX_MAX) params['prixMax'] = this.prixMaxVal;

    // Naviguer vers /annonces avec tous les filtres en queryParams
    // → La page annonces.component.ts lira ces params via ActivatedRoute
    this.router.navigate(['/annonces'], { queryParams: params });
  }

  /** SC-02 alt C: réinitialiser tous les filtres */
  onReset(): void {
    this.selectedTypeBienId.set(null);
    this.searchVille = '';
    this.searchQuartier = ''; // ✅
    this.prixMinVal = 0;
    this.prixMaxVal = this.PRIX_MAX;
    this.quartiers.set([]);
    this.activeFilters = { page: 0, taille: 12 };
    this.currentPage = 0;
    this._loadAnnonces({ page: 0, taille: 12 });
  }

  /** SC-01 exception A: réessayer après erreur serveur */
  reload(): void {
    this.serverError.set(false);
    this._loadAnnonces(this.activeFilters);
  }

  /** SC-02 alt D: scroll infini — charger la page suivante */
  loadMore(): void {
    if (this.loadingMore()) return;
    this.currentPage++;
    this.store.dispatch(
      annonceActions.loadAnnonces({
        filters: { ...this.activeFilters, page: this.currentPage },
        append: true,
      }),
    );
  }

  // ── Chargement annonces ────────────────────────────────────────────────────

  private _loadAnnonces(filters: AnnonceFilters): void {
    this.serverError.set(false);

    // Dispatch NgRx → Effect → AnnonceApi.getAnnonces()
    // L'effect catch les erreurs et dispatch loadAnnoncesFailure
    this.store.dispatch(annonceActions.loadAnnonces({ filters }));
  }
}
