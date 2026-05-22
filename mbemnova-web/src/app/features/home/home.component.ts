import {
  Component, OnInit, OnDestroy,
  inject, signal, computed, effect,
} from '@angular/core';
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

import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { AnnonceFilters, TypeBienResponse } from '@core/services/models';

const PRIX_MAX_DEFAULT = 2_000_000;
const PAGE_SIZE        = 8;

/** Mélange un tableau en place (Fisher-Yates) et le retourne. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    AnnonceCardComponent,
    AnnonceCardSkeletonComponent,
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

    /* ── HERO ── */
    .hero-wrap {
      position: relative;
      min-height: clamp(480px, 60vh, 680px);
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .hero-img {
      position: absolute;
      inset: 0;
      background-image: url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80&auto=format&fit=crop');
      background-size: cover;
      background-position: center 40%;
      transform: scale(1.03);
      transition: transform 8s ease-out;
    }
    .hero-img.loaded { transform: scale(1); }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        170deg,
        rgba(5,20,45,0.78) 0%,
        rgba(5,20,45,0.48) 45%,
        rgba(5,20,45,0.82) 100%
      );
    }
    .hero-content {
      position: relative;
      z-index: 2;
      width: 100%;
      padding: 24px 16px 48px;
    }

    /* ── SEARCH CARD ── */
    .search-card {
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(5,20,45,0.4), 0 4px 20px rgba(5,20,45,0.15);
    }

    /* ── PILLS ── */
    .pills-track {
      padding: 14px 16px 0;
      border-bottom: 1px solid #f1f5f9;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      -webkit-overflow-scrolling: touch;
    }
    .pills-track::-webkit-scrollbar { display: none; }
    .pills-inner {
      display: inline-flex;
      gap: 6px;
      padding-bottom: 12px;
      flex-wrap: nowrap;
    }
    .pill {
      flex-shrink: 0;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
      border: 1.5px solid;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      font-family: 'Inter', sans-serif;
      line-height: 1.4;
    }
    .pill-skeleton {
      flex-shrink: 0;
      width: 72px;
      height: 28px;
      border-radius: 20px;
      background: #f1f5f9;
      animation: pulse 1.5s ease-in-out infinite;
    }

    /* ── GRID FIELDS ── */
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .field-cell { padding: 14px 16px; }
    .field-label {
      display: block;
      font-size: 9.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #94a3b8;
      margin-bottom: 6px;
      font-family: 'Inter', sans-serif;
    }
    .field-select {
      width: 100%;
      font-size: 13px;
      color: #1e293b;
      background: transparent;
      border: none;
      outline: none;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      appearance: none;
      -webkit-appearance: none;
      padding-right: 20px;
    }
    .field-number {
      width: 100%;
      font-size: 13px;
      color: #1e293b;
      background: transparent;
      border: none;
      outline: none;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .field-number::-webkit-inner-spin-button,
    .field-number::-webkit-outer-spin-button { -webkit-appearance: none; }
    .field-number { -moz-appearance: textfield; }
    .field-hint {
      font-size: 9px;
      color: #94a3b8;
      font-family: 'Inter', sans-serif;
      margin-top: 3px;
      display: block;
    }

    /* ── RANGE SLIDER ── */
    input[type='range'] {
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      background: #e2e8f0;
      border-radius: 99px;
      outline: none;
      width: 100%;
      cursor: pointer;
    }
    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #1e3a5f;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(30,58,95,0.35);
    }
    input[type='range']::-moz-range-thumb {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #1e3a5f;
      cursor: pointer;
      border: none;
    }

    /* ── SEARCH BTN ── */
    .btn-search {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #1e3a5f;
      color: #fff;
      font-size: 13.5px;
      font-weight: 600;
      padding: 15px 24px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.02em;
      box-shadow: 0 4px 16px rgba(30,58,95,0.3);
    }
    .btn-search:hover:not(:disabled) {
      background: #162d4d;
      box-shadow: 0 6px 24px rgba(30,58,95,0.4);
      transform: translateY(-1px);
    }
    .btn-search:active:not(:disabled) { transform: scale(0.99); }
    .btn-search:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── ACTIVE FILTERS TAGS ── */
    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #1e3a5f;
      background: #e8eef6;
      padding: 4px 10px;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
    }

    /* ── STATS BAR ── */
    .stats-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .stat-item {
      color: rgba(255,255,255,0.5);
      font-size: 12px;
      padding: 4px 14px;
      font-family: 'Inter', sans-serif;
    }
    .stat-sep {
      width: 1px; height: 12px;
      background: rgba(255,255,255,0.15);
    }

    /* ── SECTION TITRE ── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 28px 0 18px;
    }
    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(18px, 3vw, 24px);
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .section-count {
      font-size: 11.5px;
      color: #94a3b8;
      font-family: 'Inter', sans-serif;
    }

    /* ── GRID ANNONCES ── */
    .annonces-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 14px;
    }
    @media (min-width: 480px)  { .annonces-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 768px)  { .annonces-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1024px) { .annonces-grid { grid-template-columns: repeat(4, 1fr); } }

    /* ── BOUTON VOIR PLUS ── */
    .btn-load-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 32px auto 0;
      padding: 13px 32px;
      background: #fff;
      color: #1e3a5f;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 2px 8px rgba(30,58,95,0.08);
    }
    .btn-load-more:hover:not(:disabled) {
      border-color: #1e3a5f;
      box-shadow: 0 4px 16px rgba(30,58,95,0.15);
      transform: translateY(-1px);
    }
    .btn-load-more:active:not(:disabled) { transform: scale(0.99); }
    .btn-load-more:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── SPINNER ── */
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid #e2e8f0;
      border-top-color: #1e3a5f;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    /* ── FIN DE LISTE ── */
    .end-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 40px 0 0;
    }
    .end-line-bar { flex: 1; height: 1px; background: #e2e8f0; }
    .end-line-text {
      font-size: 11px;
      color: #cbd5e1;
      white-space: nowrap;
      font-family: 'Inter', sans-serif;
    }

    /* ── EMPTY STATE ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      gap: 12px;
    }
    .empty-icon {
      width: 64px; height: 64px;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    /* ── ERREUR / OFFLINE ── */
    .alert-offline {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* ── ANIMATIONS ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

    /* ── CARD HOVER ── */
    .card-wrap { transition: transform 0.2s cubic-bezier(0.22,1,0.36,1); }
    .card-wrap:hover { transform: translateY(-3px); }

    /* ── CHEVRON ── */
    .chevron-wrap {
      position: absolute;
      right: 0; top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #94a3b8;
    }

    /* ── SKELETONS LOAD MORE ── */
    .skeletons-more {
      margin-top: 14px;
    }
  `],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly store       = inject(Store);
  private readonly locApi      = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly router      = inject(Router);
  private readonly destroy$    = new Subject<void>();

  // ── Store signals ──────────────────────────────────────────────────────────
  readonly annonces    = this.store.selectSignal(selectAnnonces);
  readonly loading     = this.store.selectSignal(selectAnnonceLoading);
  readonly loadingMore = this.store.selectSignal(selectLoadingMore);
  readonly hasMore     = this.store.selectSignal(selectHasMore);
  readonly isLoggedIn  = this.store.selectSignal(selectIsLoggedIn);
  readonly skeletons      = [1,2,3,4,5,6,7,8];
  readonly skeletonsMore  = [1,2,3,4,5,6,7,8];

  // ── Referentiel ────────────────────────────────────────────────────────────
  readonly typesBiens        = signal<TypeBienResponse[]>([]);
  readonly villes            = signal<string[]>([]);
  readonly quartiers         = signal<string[]>([]);
  readonly loadingTypesBiens = signal(true);
  readonly loadingQuartiers  = signal(false);

  // ── Filtres ────────────────────────────────────────────────────────────────
  readonly selectedTypeBienId = signal<number | null>(null);
  searchVille    = '';
  searchQuartier = '';
  prixMinVal     = 0;
  prixMaxVal     = PRIX_MAX_DEFAULT;
  readonly PRIX_MAX = PRIX_MAX_DEFAULT;

  // ── UI ─────────────────────────────────────────────────────────────────────
  readonly serverError = signal(false);
  readonly isOffline   = signal(!navigator.onLine);

  // ── Pagination ─────────────────────────────────────────────────────────────
  private currentPage   = 0;
  private activeFilters: AnnonceFilters = { page: 0, taille: PAGE_SIZE };

  /**
   * Verrou principal contre les appels API successifs.
   *
   * Il est mis à TRUE dès le dispatch et remis à FALSE uniquement
   * lorsque le signal `loadingMore` repasse à false (via l'effect ci-dessous).
   * Ainsi, même un clic ultrarapide ne peut pas déclencher deux requêtes.
   */
  private _loadMoreLocked = false;

  // ── Effect : libère le verrou dès que le store a fini de charger ───────────
  constructor() {
    effect(() => {
      // Cet effect se ré-évalue à chaque changement de loadingMore().
      // Quand il passe de true → false, on déverrouille.
      if (!this.loadingMore()) {
        this._loadMoreLocked = false;
      }
    });
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly prixError = computed(
    () => this.prixMinVal > 0 && this.prixMaxVal > 0 && this.prixMinVal > this.prixMaxVal,
  );

  readonly hasActiveFilters = computed(
    () => !!this.searchVille || !!this.searchQuartier
       || this.selectedTypeBienId() !== null
       || this.prixMinVal > 0 || this.prixMaxVal < this.PRIX_MAX,
  );

  readonly selectedTypeBienLabel = computed(
    () => this.typesBiens().find(t => t.id === this.selectedTypeBienId())?.libelle ?? '',
  );

  readonly selectedQuartierLabel = computed(
    () => this.quartiers().find(q => q === this.searchQuartier) ?? '',
  );

  /**
   * Expose un signal booléen utilisable directement dans le template
   * pour désactiver le bouton "Voir plus" de façon fiable.
   */
  readonly canLoadMore = computed(
    () => this.hasMore() && !this.loadingMore() && !this._loadMoreLocked,
  );

  /**
   * Annonces mélangées aléatoirement (Fisher-Yates).
   * Recalculé à chaque émission du store (chargement initial + append).
   */
  readonly annoncesShuffled = computed(() => shuffle([...this.annonces()]));

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadReferentiel();
    this.activeFilters = { page: 0, taille: PAGE_SIZE };
    this._loadAnnonces(this.activeFilters);

    if (this.isLoggedIn()) this.store.dispatch(favoriActions.load());

    window.addEventListener('offline', () => this.isOffline.set(true));
    window.addEventListener('online',  () => {
      this.isOffline.set(false);
      this._loadAnnonces(this.activeFilters);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Referentiel ────────────────────────────────────────────────────────────
  private _loadReferentiel(): void {
    this.loadingTypesBiens.set(true);
    this.typeBienApi.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next:  res => { this.typesBiens.set(res.data ?? []); this.loadingTypesBiens.set(false); },
      error: ()  => this.loadingTypesBiens.set(false),
    });
    this.locApi.getVilles().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => this.villes.set(res.data ?? []),
    });
  }

  // ── Filtres ────────────────────────────────────────────────────────────────
  selectType(id: number | null): void {
    this.selectedTypeBienId.set(id);
  }

  onVilleChange(ville: string): void {
    this.searchVille    = ville;
    this.searchQuartier = '';
    this.quartiers.set([]);
    if (!ville) return;
    this.loadingQuartiers.set(true);
    this.locApi.getQuartiers(ville).pipe(takeUntil(this.destroy$)).subscribe({
      next:  res => { this.quartiers.set(res.data ?? []); this.loadingQuartiers.set(false); },
      error: ()  => this.loadingQuartiers.set(false),
    });
  }

  onPrixMinChange(val: number): void { this.prixMinVal = Number(val); }
  onPrixMaxChange(val: number): void { this.prixMaxVal = Number(val); }

  onSearch(): void {
    if (this.prixError()) return;
    const params: Record<string, string | number> = {};
    if (this.searchVille)                   params['ville']      = this.searchVille;
    if (this.searchQuartier)                params['quartier']   = this.searchQuartier;
    if (this.selectedTypeBienId() !== null) params['typeBienId'] = this.selectedTypeBienId()!;
    if (this.prixMinVal > 0)                params['prixMin']    = this.prixMinVal;
    if (this.prixMaxVal < this.PRIX_MAX)    params['prixMax']    = this.prixMaxVal;
    this.router.navigate(['/annonces'], { queryParams: params });
  }

  onReset(): void {
    this.selectedTypeBienId.set(null);
    this.searchVille    = '';
    this.searchQuartier = '';
    this.prixMinVal     = 0;
    this.prixMaxVal     = this.PRIX_MAX;
    this.quartiers.set([]);
    this.currentPage      = 0;
    this._loadMoreLocked  = false;
    this.activeFilters    = { page: 0, taille: PAGE_SIZE };
    this._loadAnnonces(this.activeFilters);
  }

  reload(): void {
    this.serverError.set(false);
    this._loadAnnonces(this.activeFilters);
  }

  // ── Bouton "Voir plus" ────────────────────────────────────────────────────
  /**
   * Protection triple couche :
   *  1. `_loadMoreLocked`  — verrou posé dès le dispatch, levé par l'effect
   *                          quand loadingMore() repasse à false
   *  2. `loadingMore()`    — signal NgRx (doublon de sécurité)
   *  3. `hasMore()`        — inutile de charger s'il n'y a plus de pages
   */
  loadMore(): void {
    if (this._loadMoreLocked || this.loadingMore() || !this.hasMore()) return;

    // Pose le verrou AVANT le dispatch pour bloquer tout clic simultané
    this._loadMoreLocked = true;

    this.currentPage++;
    this.activeFilters = { ...this.activeFilters, page: this.currentPage };
    this.store.dispatch(annonceActions.loadAnnonces({
      filters: this.activeFilters,
      append: true,
    }));
    // Le verrou est levé par l'effect dès que loadingMore() → false
  }

  // ── Chargement initial ─────────────────────────────────────────────────────
  private _loadAnnonces(filters: AnnonceFilters): void {
    this.serverError.set(false);
    this.currentPage     = 0;
    this._loadMoreLocked = false;
    this.activeFilters   = { ...filters, page: 0 };
    this.store.dispatch(annonceActions.loadAnnonces({ filters: this.activeFilters }));
  }
}