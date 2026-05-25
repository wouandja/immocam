import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AnnonceCardComponent } from '@shared/components/annonce-card/annonce-card.component';
import { AnnonceCardSkeletonComponent } from '@shared/components/annonce-card-skeleton/annonce-card-skeleton.component';
import { InfiniteScrollComponent } from '@shared/components/infinite-scroll/infinite-scroll.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

import { LocalisationApi } from '@core/services/api/localisation.api';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { AnnonceListResponse, LocalisationResponse, TypeBienResponse } from '@core/services/models';

@Component({
  selector: 'app-annonce-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    AnnonceCardComponent,
    AnnonceCardSkeletonComponent,
    InfiniteScrollComponent,
    EmptyStateComponent,
  ],
  styles: [`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }

    select { appearance: none; -webkit-appearance: none; }

    /* Double range slider */
    .range-wrap { position: relative; height: 20px; }
    .range-wrap input[type=range] {
      position: absolute;
      width: 100%;
      height: 4px;
      background: transparent;
      -webkit-appearance: none;
      appearance: none;
      pointer-events: none;
      top: 50%;
      transform: translateY(-50%);
      margin: 0;
    }
    .range-wrap input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #1E3A8A;
      border: 2.5px solid #fff;
      box-shadow: 0 0 0 1.5px #1E3A8A40;
      cursor: pointer;
      pointer-events: all;
    }
    .range-wrap input[type=range]::-moz-range-thumb {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #1E3A8A;
      border: 2.5px solid #fff;
      cursor: pointer;
      pointer-events: all;
    }
    .range-track {
      position: absolute;
      top: 50%; transform: translateY(-50%);
      height: 4px; width: 100%;
      border-radius: 99px;
      background: #e2e8f0;
      pointer-events: none;
    }
    .range-fill {
      position: absolute;
      height: 4px;
      background: #1E3A8A;
      border-radius: 99px;
      pointer-events: none;
      top: 50%; transform: translateY(-50%);
    }

    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
  `],
  template: `
    <!-- ══ FILTER BAR ══ -->
    <div class="bg-white border-b border-slate-100 sticky top-[59px] sm:top-[100px] z-30">
      <div class="max-w-screen-xl mx-auto px-3 sm:px-6 py-3">

        <!-- Pills type de bien -->
        <div class="overflow-x-auto pb-2.5 border-b border-slate-100 mb-3"
             style="scrollbar-width:none;-ms-overflow-style:none;">
          <div class="inline-flex gap-1.5">

            <button
              (click)="selectType(null)"
              class="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-medium border-[1.5px]
                     cursor-pointer transition-all duration-150 whitespace-nowrap"
              style="font-family:'DM Sans',sans-serif;"
              [style.background]="filterTypeBienId === null ? '#1E3A8A' : 'transparent'"
              [style.color]="filterTypeBienId === null ? '#fff' : '#64748b'"
              [style.borderColor]="filterTypeBienId === null ? '#1E3A8A' : '#e2e8f0'"
            >Tout</button>

            @if (loadingTypesBiens()) {
              @for (i of [1,2,3,4,5]; track i) {
                <div class="shrink-0 w-20 h-[30px] rounded-full bg-slate-100 animate-pulse"></div>
              }
            } @else {
              @for (t of typesBiens(); track t.id) {
                <button
                  (click)="selectType(t.id)"
                  class="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-medium border-[1.5px]
                         cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style="font-family:'DM Sans',sans-serif;"
                  [style.background]="filterTypeBienId === t.id ? '#1E3A8A' : 'transparent'"
                  [style.color]="filterTypeBienId === t.id ? '#fff' : '#64748b'"
                  [style.borderColor]="filterTypeBienId === t.id ? '#1E3A8A' : '#e2e8f0'"
                >{{ t.libelle }}</button>
              }
            }
          </div>
        </div>

        <!-- Grille filtres -->
        <div class="grid grid-cols-2 sm:grid-cols-[1fr_1fr_2fr] rounded-xl overflow-hidden"
             style="border:1px solid #f1f5f9;">

          <!-- VILLE -->
          <div class="p-3 border-b border-r border-slate-50 sm:border-b-0">
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1.5"
               style="font-family:'DM Sans',sans-serif;">Ville</p>
            <div class="relative">
              <select
                [(ngModel)]="filterVille"
                (ngModelChange)="onVilleChange($event)"
                class="w-full text-[12.5px] font-medium text-slate-800 bg-transparent
                       border-none outline-none cursor-pointer pr-4"
                style="font-family:'DM Sans',sans-serif;"
              >
                <option value="">Toutes</option>
                @for (v of villes(); track v) {
                  <option [value]="v">{{ v }}</option>
                }
              </select>
              <svg class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          <!-- QUARTIER -->
          <div class="p-3 border-b border-r border-slate-50 sm:border-b-0">
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] mb-1.5 transition-colors"
               [class]="filterVille ? 'text-slate-400' : 'text-slate-300'"
               style="font-family:'DM Sans',sans-serif;">Quartier</p>
            @if (loadingQuartiers()) {
              <span class="text-[12.5px] text-slate-400" style="font-family:'DM Sans',sans-serif;">
                Chargement…
              </span>
            } @else if (!filterVille) {
              <span class="text-[12.5px] text-slate-300 select-none"
                    style="font-family:'DM Sans',sans-serif;">Choisissez une ville</span>
            } @else {
              <div class="relative">
                <select
                  [(ngModel)]="filterLocalisationId"
                  (ngModelChange)="applyFilters()"
                  class="w-full text-[12.5px] font-medium text-slate-800 bg-transparent
                         border-none outline-none cursor-pointer pr-4"
                  style="font-family:'DM Sans',sans-serif;"
                >
                  <option [ngValue]="null">Tous</option>
                  @for (q of quartiers(); track q.id) {
                    <option [ngValue]="q.id">{{ q.quartier }}</option>
                  }
                </select>
                <svg class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            }
          </div>

          <!-- PRIX — double slider sur toute la colonne restante -->
          <div class="p-3 col-span-2 sm:col-span-1 border-t border-slate-50 sm:border-t-0">
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2"
               style="font-family:'DM Sans',sans-serif;">Fourchette de prix</p>

            <!-- Affichage min / max -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-[14.5px] font-medium text-slate-800"
                    style="font-family:'DM Sans',sans-serif;">
                {{ formatPrix(filterPrixMin) }} FCFA
              </span>
              <span class="text-[10px] text-slate-300 mx-1">—</span>
              <span class="text-[14.5px] font-medium text-slate-800"
                    style="font-family:'DM Sans',sans-serif;">
                {{ filterPrixMax >= PRIX_MAX ? 'Illimité' : formatPrix(filterPrixMax) + ' FCFA' }}
              </span>
            </div>

            <!-- Double slider -->
            <div class="relative px-0">
              <div class="range-track"></div>
              <div class="range-fill"
                   [style.left.%]="(filterPrixMin / PRIX_MAX) * 100"
                   [style.width.%]="((filterPrixMax - filterPrixMin) / PRIX_MAX) * 100">
              </div>
              <div class="range-wrap">
                <input
                  type="range"
                  [value]="filterPrixMin"
                  (input)="onRangeMinInput($event)"
                  min="0" [max]="PRIX_MAX" step="10000"
                />
                <input
                  type="range"
                  [value]="filterPrixMax"
                  (input)="onRangeMaxInput($event)"
                  min="0" [max]="PRIX_MAX" step="10000"
                />
              </div>
            </div>

            <!-- Bornes lisibles -->
            <div class="flex justify-between mt-1">
              <span class="text-[9px] text-slate-300" style="font-family:'DM Sans',sans-serif;">0</span>
              <span class="text-[9px] text-slate-300" style="font-family:'DM Sans',sans-serif;">
                {{ formatPrixShort(PRIX_MAX) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Erreur prix -->
        @if (prixError()) {
          <div class="mt-2 px-3 py-2"
               style="background:#fef2f2;border-left:3px solid #e11d48;border-radius:0 8px 8px 0;">
            <p class="text-[11px] m-0" style="color:#be123c;font-family:'DM Sans',sans-serif;">
              Le prix minimum ne peut pas dépasser le prix maximum.
            </p>
          </div>
        }

        <!-- Tags filtres actifs -->
        @if (hasActiveFilters()) {
          <div class="flex items-center gap-1.5 flex-wrap mt-2.5">

            @if (filterVille) {
              <span class="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
                    style="color:#1E3A8A;background:#e8eef6;font-family:'DM Sans',sans-serif;">
                <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 21c-4-4.5-6-8-6-11a6 6 0 1 1 12 0c0 3-2 6.5-6 11z"/>
                  <circle cx="12" cy="10" r="2"/>
                </svg>
                {{ filterVille }}{{ filterLocalisationId ? ' · ' + quartierLabel() : '' }}
              </span>
            }

            @if (filterTypeBienId !== null) {
              <span class="text-[11px] px-2.5 py-1 rounded-full"
                    style="color:#1E3A8A;background:#e8eef6;font-family:'DM Sans',sans-serif;">
                {{ typeBienLabel() }}
              </span>
            }

            @if (filterPrixMin > 0 || filterPrixMax < PRIX_MAX) {
              <span class="text-[11px] px-2.5 py-1 rounded-full"
                    style="color:#1E3A8A;background:#e8eef6;font-family:'DM Sans',sans-serif;">
                {{ formatPrix(filterPrixMin) }} –
                {{ filterPrixMax < PRIX_MAX ? formatPrix(filterPrixMax) + ' FCFA' : '∞ FCFA' }}
              </span>
            }

            <button
              (click)="resetFilters()"
              class="text-[11px] bg-transparent border-none cursor-pointer
                     underline underline-offset-2 p-0 transition-colors"
              style="color:#94a3b8;font-family:'DM Sans',sans-serif;"
              onmouseover="this.style.color='#e11d48'"
              onmouseout="this.style.color='#94a3b8'"
            >Réinitialiser</button>
          </div>
        }

      </div>
    </div>

    <!-- ══ LISTE ══ -->
    <main class="bg-slate-50 min-h-screen">
      <div class="max-w-screen-xl mx-auto px-3 sm:px-6 pt-6 pb-16">

        <!-- Compteur -->
        @if (!loading() && annonces().length > 0) {
          <div class="flex items-center justify-between mb-4 fade-up">
            <p class="text-[11.5px]" style="color:#94a3b8;font-family:'DM Sans',sans-serif;">
              <strong style="color:#1E3A8A;font-weight:600;">{{ annonces().length }}</strong>
              annonce{{ annonces().length > 1 ? 's' : '' }}
              @if (filterVille) {
                à <strong style="color:#0f172a;">{{ filterVille }}</strong>
              }
            </p>
          </div>
        }

        <!-- Skeletons -->
        @if (loading()) {
          <div class="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            @for (i of skeletons; track i) {
              <app-annonce-card-skeleton/>
            }
          </div>
        }

        @if (!loading()) {
          @if (annonces().length > 0) {

            <div class="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              @for (annonce of annonces(); track annonce.id; let i = $index) {
                <div class="fade-up" [style]="'animation-delay:' + (i % 8) * 35 + 'ms'">
                  <app-annonce-card [annonce]="annonce"/>
                </div>
              }
            </div>

            @if (loadingMore()) {
              <div class="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                @for (i of [1,2,3,4]; track i) {
                  <app-annonce-card-skeleton/>
                }
              </div>
            }

            @if (!hasMore() && !loadingMore()) {
              <div class="flex items-center gap-3 mt-12">
                <div class="flex-1 h-px bg-slate-200"></div>
                <p class="text-[11px] text-slate-400 whitespace-nowrap"
                   style="font-family:'DM Sans',sans-serif;">
                  Toutes les annonces affichées
                </p>
                <div class="flex-1 h-px bg-slate-200"></div>
              </div>
            }

            @if (hasMore()) {
              <app-infinite-scroll [disabled]="loadingMore()" (scrolled)="loadMore()"/>
            }

          } @else {

            <app-empty-state
              icon="search"
              title="Aucune annonce trouvée"
              [subtitle]="hasActiveFilters()
                ? 'Essayez de modifier ou supprimer certains filtres.'
                : 'Revenez bientôt ou soyez le premier à publier !'"
            >
              @if (hasActiveFilters()) {
                <button
                  (click)="resetFilters()"
                  class="mt-3 px-5 py-2.5 text-[13px] font-medium rounded-[10px] border-none cursor-pointer"
                  style="background:#1E3A8A;color:#fff!important;font-family:'DM Sans',sans-serif;"
                >Voir toutes les annonces</button>
              } @else {
                <a
                  routerLink="/annonces/creer"
                  class="mt-3 inline-block px-5 py-2.5 text-[13px] font-medium rounded-[10px]"
                  style="background:#1E3A8A;color:#fff!important;text-decoration:none;font-family:'DM Sans',sans-serif;"
                >Publier une annonce</a>
              }
            </app-empty-state>

          }
        }

      </div>
    </main>
  `,
})
export class AnnonceListComponent implements OnInit, OnDestroy {
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly locApi      = inject(LocalisationApi);
  private readonly annonceApi  = inject(AnnonceApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly destroy$    = new Subject<void>();

  readonly annonces          = signal<AnnonceListResponse[]>([]);
  readonly loading           = signal(true);
  readonly loadingMore       = signal(false);
  readonly hasMore           = signal(false);
  readonly skeletons         = [1,2,3,4,5,6,7,8];
  private isLoadingMoreLock  = false;

  readonly typesBiens        = signal<TypeBienResponse[]>([]);
  readonly villes            = signal<string[]>([]);
  readonly quartiers         = signal<LocalisationResponse[]>([]);
  readonly loadingTypesBiens = signal(true);
  readonly loadingQuartiers  = signal(false);

  filterTypeBienId: number | null     = null;
  filterVille                         = '';
  filterLocalisationId: number | null = null;
  filterPrixMin                       = 0;
  filterPrixMax                       = 2_000_000;
  readonly PRIX_MAX                   = 2_000_000;

  searchVille    = '';
  searchQuartier = '';

  private readonly PAGE_SIZE = 8;
  private currentPage        = 0;

  // ── Computed ────────────────────────────────────────────────────────────────

  readonly prixError = computed(() =>
    this.filterPrixMin > 0 && this.filterPrixMax > 0 && this.filterPrixMin > this.filterPrixMax,
  );

  // ── Formatage prix ───────────────────────────────────────────────────────────

  /** Séparateurs de milliers, style fr-FR : 1 500 000 */
  formatPrix(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  /** Version courte pour les bornes du slider : "2 M" */
  formatPrixShort(n: number): string {
    if (n >= 1_000_000) {
      const m = n / 1_000_000;
      return (Number.isInteger(m) ? m : m.toFixed(1)) + ' M';
    }
    if (n >= 1_000) return new Intl.NumberFormat('fr-FR').format(n);
    return String(n);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  hasActiveFilters(): boolean {
    return (
      !!this.filterVille          ||
      this.filterTypeBienId !== null ||
      this.filterPrixMin > 0      ||
      this.filterPrixMax < this.PRIX_MAX ||
      this.filterLocalisationId !== null
    );
  }

  typeBienLabel(): string {
    return this.typesBiens().find(t => t.id === this.filterTypeBienId)?.libelle ?? '';
  }

  quartierLabel(): string {
    return this.quartiers().find(q => q.id === this.filterLocalisationId)?.quartier ?? '';
  }

  // ── Double slider ────────────────────────────────────────────────────────────

  onRangeMinInput(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    // On empêche le curseur min de dépasser le max
    this.filterPrixMin = Math.min(val, this.filterPrixMax - 10_000);
    this.applyFilters();
  }

  onRangeMaxInput(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    // On empêche le curseur max de passer sous le min
    this.filterPrixMax = Math.max(val, this.filterPrixMin + 10_000);
    this.applyFilters();
  }

  // ── Cycle de vie ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.typeBienApi.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next:  r => { this.typesBiens.set(r.data ?? []); this.loadingTypesBiens.set(false); },
      error: ()  => this.loadingTypesBiens.set(false),
    });

    this.locApi.getVilles().pipe(takeUntil(this.destroy$)).subscribe({
      next: r => this.villes.set(r.data ?? []),
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.filterVille          = typeof params['ville'] === 'string' ? params['ville'].trim() : '';
      this.filterTypeBienId     = this._toPositiveInt(params['typeBienId']);
      this.filterLocalisationId = this._toPositiveInt(params['localisationId']);
      this.filterPrixMin        = this._toNonNegativeInt(params['prixMin'])  ?? 0;
      this.filterPrixMax        = this._toNonNegativeInt(params['prixMax'])  ?? this.PRIX_MAX;
      this._normalizePriceRange();

      if (this.filterVille) {
        this.loadingQuartiers.set(true);
        this.locApi.getQuartiers(this.filterVille).pipe(takeUntil(this.destroy$)).subscribe({
          next: r => {
            const qs: LocalisationResponse[] = (r.data ?? []).map((q, i) => ({
              id: i, ville: this.filterVille, quartier: q, active: true,
            }));
            this.quartiers.set(qs);
            if (this.filterLocalisationId !== null && !qs.some(q => q.id === this.filterLocalisationId)) {
              this.filterLocalisationId = null;
            }
            this.loadingQuartiers.set(false);
          },
          error: () => this.loadingQuartiers.set(false),
        });
      } else {
        this.quartiers.set([]);
        this.filterLocalisationId = null;
      }

      this.currentPage = 0;
      this._loadPage(false);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  selectType(id: number | null): void {
    this.filterTypeBienId = id;
    this.applyFilters();
  }

  onVilleChange(ville: string): void {
    this.searchVille    = ville;
    this.searchQuartier = '';
    this.quartiers.set([]);
    this.filterLocalisationId = null;

    if (!ville) { this.applyFilters(); return; }

    this.loadingQuartiers.set(true);
    this.locApi.getQuartiers(ville).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        const mapped: LocalisationResponse[] = (res.data ?? []).map((q, i) => ({
          id: i, ville, quartier: q, active: true,
        }));
        this.quartiers.set(mapped);
        this.loadingQuartiers.set(false);
        this.applyFilters();
      },
      error: () => this.loadingQuartiers.set(false),
    });
  }

  applyFilters(): void {
    this._normalizePriceRange();
    if (this.prixError()) return;
    this.currentPage = 0;
    this._loadPage(false);
    this._syncUrl();
  }

  resetFilters(): void {
    this.filterTypeBienId     = null;
    this.filterVille          = '';
    this.filterLocalisationId = null;
    this.filterPrixMin        = 0;
    this.filterPrixMax        = this.PRIX_MAX;
    this.quartiers.set([]);
    this.currentPage = 0;
    this._loadPage(false);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore() || this.isLoadingMoreLock) return;
    this.isLoadingMoreLock = true;
    this.loadingMore.set(true);
    this.currentPage++;
    this._loadPage(true);
    setTimeout(() => { this.isLoadingMoreLock = false; }, 1000);
  }

  // ── Privé ─────────────────────────────────────────────────────────────────────

  private _loadPage(append: boolean): void {
    if (append) this.loadingMore.set(true);
    else        this.loading.set(true);

    const quartier = this.filterLocalisationId !== null
      ? this.quartiers().find(q => q.id === this.filterLocalisationId)?.quartier
      : undefined;

    this.annonceApi.getAnnonces({
      page:       this.currentPage,
      taille:     this.PAGE_SIZE,
      ville:      this.filterVille     || undefined,
      typeBienId: this.filterTypeBienId ?? undefined,
      quartier:   quartier             || undefined,
      prixMin:    this.filterPrixMin > 0             ? this.filterPrixMin : undefined,
      prixMax:    this.filterPrixMax < this.PRIX_MAX ? this.filterPrixMax : undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        const page     = res.data;
        const incoming = page?.contenu ?? [];
        this.annonces.set(append ? [...this.annonces(), ...incoming] : incoming);
        this.hasMore.set((page?.page ?? 0) < ((page?.totalPages ?? 1) - 1));
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        if (!append) this.annonces.set([]);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.hasMore.set(false);
      },
    });
  }

  private _syncUrl(): void {
    const params: Record<string, string | number> = {};
    const ville = this.filterVille.trim();
    if (ville)                              params['ville']          = ville;
    if (this.filterTypeBienId !== null)     params['typeBienId']     = this.filterTypeBienId;
    if (this.filterLocalisationId !== null) params['localisationId'] = this.filterLocalisationId;
    if (this.filterPrixMin > 0)             params['prixMin']        = this.filterPrixMin;
    if (this.filterPrixMax < this.PRIX_MAX) params['prixMax']        = this.filterPrixMax;
    this.router.navigate([], { queryParams: params, replaceUrl: true });
  }

  private _toPositiveInt(value: unknown): number | null {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  private _toNonNegativeInt(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }

  private _normalizePriceRange(): void {
    this.filterPrixMin = Math.max(0, Math.floor(Number(this.filterPrixMin) || 0));
    this.filterPrixMax = Math.min(
      this.PRIX_MAX,
      Math.max(0, Math.floor(Number(this.filterPrixMax) || this.PRIX_MAX))
    );
    // Garantit que min ≤ max avec un écart d'au moins 10 000
    if (this.filterPrixMin >= this.filterPrixMax && this.filterPrixMax > 0) {
      this.filterPrixMin = Math.max(0, this.filterPrixMax - 10_000);
    }
  }
}