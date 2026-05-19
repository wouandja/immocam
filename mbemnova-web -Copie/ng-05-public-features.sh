#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 05 : FEATURES PUBLIQUES + AUTH
# =============================================================================
# Rôle     : Génère toutes les pages publiques et auth :
#            - Home: hero + scroll infini + filtres
#            - Annonce List: liste filtrée paginée
#            - Annonce Detail: galerie + WhatsApp + commentaires
#            - Auth: Register, VerifyEmail, Login, ForgotPassword, ResetPassword
#            - Pages légales: Politique, CGU, Mentions, Contact, 404
#
# Exécuter : bash ../ng-05-public-features.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || { echo "Lancez depuis la racine Angular"; exit 1; }
SECTION "SCRIPT 05 — FEATURES PUBLIQUES + AUTH"

FEAT="src/app/features"

# =============================================================================
# 1. HOME
# =============================================================================
SECTION "1/4 — Page Home"
mkdir -p "$FEAT/home"

cat > "$FEAT/home/home.component.ts" << 'EOF'
import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { favoriActions } from '@store/favori/favori.actions';
import {
  selectAnnonces, selectAnnonceLoading, selectLoadingMore,
  selectHasMore, selectFilters
} from '@store/annonce/annonce.selectors';
import { selectIsLoggedIn } from '@store/auth/auth.selectors';
import { AnnonceCardComponent } from '@shared/components/annonce-card/annonce-card.component';
import { AnnonceCardSkeletonComponent } from '@shared/components/annonce-card-skeleton/annonce-card-skeleton.component';
import { FilterBarComponent } from '@shared/components/filter-bar/filter-bar.component';
import { InfiniteScrollComponent } from '@shared/components/infinite-scroll/infinite-scroll.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { AnnonceFilters } from '@core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    AnnonceCardComponent, AnnonceCardSkeletonComponent,
    FilterBarComponent, InfiniteScrollComponent, EmptyStateComponent,
  ],
  template: `
    <!-- HERO -->
    <section class="hero-gradient px-4 pt-10 pb-12 text-white">
      <div class="max-w-2xl mx-auto text-center">
        <h1 class="text-3xl sm:text-4xl font-bold mb-3 leading-tight fade-in">
          Trouvez votre bien idéal<br class="hidden sm:block"/> au Cameroun
        </h1>
        <p class="text-blue-200 text-base mb-6 fade-in" style="animation-delay:100ms">
          Appartements, maisons, bureaux — Douala, Yaoundé et 18 autres villes
        </p>
        <!-- Stats rapides -->
        <div class="flex items-center justify-center gap-6 text-sm text-blue-200 mb-8 fade-in"
             style="animation-delay:200ms">
          <span>🏠 {{ (annonces()?.length ?? 0) + 40 }} annonces actives</span>
          <span>📍 20 villes</span>
          <span>✅ Publication gratuite</span>
        </div>
        <!-- CTA publier -->
        <a routerLink="/annonces/creer"
           class="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900
                  font-bold rounded-2xl hover:bg-blue-50 transition-all active:scale-95
                  shadow-lg shadow-blue-950/30 fade-in"
           style="animation-delay:300ms">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4v16m8-8H4"/>
          </svg>
          Publier une annonce gratuitement
        </a>
      </div>
    </section>

    <!-- BANDEAU INFO -->
    <div class="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
      <p class="text-center text-xs text-blue-700 max-w-2xl mx-auto">
        💡 Les annonces sont publiées directement par les propriétaires et restent visibles 30 jours.
        Passé ce délai, elles sont automatiquement suspendues si non renouvelées.
      </p>
    </div>

    <!-- FILTRES -->
    <div class="max-w-6xl mx-auto px-4 py-6">
      <app-filter-bar
        (filtersChanged)="onFiltersChanged($event)"
        (filtersReset)="onFiltersReset()"
      />
    </div>

    <!-- LISTE ANNONCES -->
    <section class="max-w-6xl mx-auto px-4 pb-16">
      <!-- Compteur résultats -->
      @if (!loading() && annonces().length > 0) {
        <p class="text-sm text-slate-500 mb-4">
          {{ annonces().length }} annonce{{ annonces().length > 1 ? 's' : '' }} affichée{{ annonces().length > 1 ? 's' : '' }}
        </p>
      }

      <!-- Skeletons initial -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (i of skeletons; track i) {
            <app-annonce-card-skeleton/>
          }
        </div>
      }

      <!-- Grille annonces -->
      @if (!loading()) {
        @if (annonces().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (annonce of annonces(); track annonce.id; let i = $index) {
              <div class="fade-in" [style]="'animation-delay:' + (i % 8 * 50) + 'ms'">
                <app-annonce-card [annonce]="annonce"/>
              </div>
            }
          </div>

          <!-- Skeleton "load more" -->
          @if (loadingMore()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              @for (i of [1,2,3,4]; track i) {
                <app-annonce-card-skeleton/>
              }
            </div>
          }

          <!-- Message fin de liste -->
          @if (!hasMore() && !loadingMore()) {
            <p class="text-center text-slate-400 text-sm py-8">
              ✓ Vous avez vu toutes les annonces disponibles
            </p>
          }

          <!-- Sentinelle scroll infini -->
          @if (hasMore()) {
            <app-infinite-scroll
              [disabled]="loadingMore()"
              (scrolled)="loadMore()"
            />
          }
        } @else {
          <app-empty-state
            icon="search"
            title="Aucune annonce disponible"
            subtitle="Soyez le premier à publier une annonce dans cette zone de recherche."
          />
        }
      }
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private readonly store = inject(Store);

  readonly annonces    = this.store.selectSignal(selectAnnonces);
  readonly loading     = this.store.selectSignal(selectAnnonceLoading);
  readonly loadingMore = this.store.selectSignal(selectLoadingMore);
  readonly hasMore     = this.store.selectSignal(selectHasMore);
  readonly isLoggedIn  = this.store.selectSignal(selectIsLoggedIn);
  readonly filters     = this.store.selectSignal(selectFilters);
  readonly skeletons   = [1,2,3,4,5,6,7,8];

  ngOnInit(): void {
    this.store.dispatch(annonceActions.loadAnnonces({ filters: { page: 0, size: 12 } }));
    if (this.isLoggedIn()) {
      this.store.dispatch(favoriActions.load());
    }
  }

  onFiltersChanged(filters: AnnonceFilters): void {
    this.store.dispatch(annonceActions.loadAnnonces({ filters: { ...filters, page: 0 } }));
  }

  onFiltersReset(): void {
    this.store.dispatch(annonceActions.resetFilters());
    this.store.dispatch(annonceActions.loadAnnonces({ filters: { page: 0, size: 12 } }));
  }

  loadMore(): void {
    const currentFilters = this.filters();
    const nextPage = (currentFilters.page ?? 0) + 1;
    this.store.dispatch(annonceActions.loadAnnonces({
      filters: { ...currentFilters, page: nextPage },
      append: true,
    }));
  }
}
EOF
OK "HomeComponent"

cat > "$FEAT/home/home.routes.ts" << 'EOF'
import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./home.component').then(m => m.HomeComponent) },
];
EOF

# =============================================================================
# 2. ANNONCE LIST
# =============================================================================
SECTION "2/4 — Annonce List & Detail"
mkdir -p "$FEAT/annonce/list" "$FEAT/annonce/detail" "$FEAT/annonce/create" "$FEAT/annonce/edit"

cat > "$FEAT/annonce/list/annonce-list.component.ts" << 'EOF'
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import {
  selectAnnonces, selectAnnonceLoading, selectLoadingMore, selectHasMore
} from '@store/annonce/annonce.selectors';
import { AnnonceCardComponent } from '@shared/components/annonce-card/annonce-card.component';
import { AnnonceCardSkeletonComponent } from '@shared/components/annonce-card-skeleton/annonce-card-skeleton.component';
import { FilterBarComponent } from '@shared/components/filter-bar/filter-bar.component';
import { InfiniteScrollComponent } from '@shared/components/infinite-scroll/infinite-scroll.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AnnonceFilters } from '@core/models';

@Component({
  selector: 'app-annonce-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    AnnonceCardComponent, AnnonceCardSkeletonComponent,
    FilterBarComponent, InfiniteScrollComponent, EmptyStateComponent, BackButtonComponent,
  ],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <app-back-button/>
        <h1 class="text-xl font-bold text-slate-800">Toutes les annonces</h1>
        <a routerLink="/annonces/creer"
           class="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl
                  hover:bg-blue-800 transition-all active:scale-95">
          + Publier
        </a>
      </div>

      <app-filter-bar
        [initialFilters]="initialFilters"
        (filtersChanged)="onFiltersChanged($event)"
        (filtersReset)="onFiltersReset()"
      />

      <div class="mt-6">
        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <app-annonce-card-skeleton/>
            }
          </div>
        } @else if (annonces().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (a of annonces(); track a.id) {
              <app-annonce-card [annonce]="a"/>
            }
          </div>
          @if (hasMore()) {
            <app-infinite-scroll [disabled]="loadingMore()" (scrolled)="loadMore()"/>
          }
          @if (loadingMore()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              @for (i of [1,2,3,4]; track i) { <app-annonce-card-skeleton/> }
            </div>
          }
        } @else {
          <app-empty-state
            icon="search" title="Aucune annonce trouvée"
            subtitle="Essayez de modifier vos filtres ou de rechercher dans une autre ville."
          />
        }
      </div>
    </div>
  `,
})
export class AnnonceListComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  readonly annonces    = this.store.selectSignal(selectAnnonces);
  readonly loading     = this.store.selectSignal(selectAnnonceLoading);
  readonly loadingMore = this.store.selectSignal(selectLoadingMore);
  readonly hasMore     = this.store.selectSignal(selectHasMore);

  initialFilters: AnnonceFilters = {};
  private currentFilters: AnnonceFilters = { page: 0, size: 12 };

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['ville'])    this.initialFilters.ville = params['ville'];
    if (params['motCle'])   this.initialFilters.motCle = params['motCle'];
    if (params['typeBienId']) this.initialFilters.typeBienId = +params['typeBienId'];
    this.currentFilters = { ...this.initialFilters, page: 0, size: 12 };
    this.store.dispatch(annonceActions.loadAnnonces({ filters: this.currentFilters }));
  }

  onFiltersChanged(filters: AnnonceFilters): void {
    this.currentFilters = { ...filters, page: 0, size: 12 };
    this.store.dispatch(annonceActions.loadAnnonces({ filters: this.currentFilters }));
  }

  onFiltersReset(): void {
    this.currentFilters = { page: 0, size: 12 };
    this.store.dispatch(annonceActions.resetFilters());
    this.store.dispatch(annonceActions.loadAnnonces({ filters: this.currentFilters }));
  }

  loadMore(): void {
    const nextPage = (this.currentFilters.page ?? 0) + 1;
    this.currentFilters = { ...this.currentFilters, page: nextPage };
    this.store.dispatch(annonceActions.loadAnnonces({ filters: this.currentFilters, append: true }));
  }
}
EOF
OK "AnnonceList"

# --- ANNONCE DETAIL ---
cat > "$FEAT/annonce/detail/annonce-detail.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { favoriActions } from '@store/favori/favori.actions';
import { selectAnnonceDetail, selectDetailLoading } from '@store/annonce/annonce.selectors';
import { selectIsLoggedIn, selectCurrentUser } from '@store/auth/auth.selectors';
import { isFavori } from '@store/favori/favori.selectors';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { StatutAnnonce, CommentaireRequest } from '@core/models';
import { ContactApi } from '@core/services/api/contact.api';
import { CommentaireApi } from '@core/services/api/commentaire.api';
import { SignalementApi } from '@core/services/api/signalement.api';
import { ToastService } from '@core/services/toast.service';
import { MOTIF_SIGNALEMENT_LABELS, MotifSignalement } from '@core/models';

@Component({
  selector: 'app-annonce-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    BackButtonComponent, StatusBadgeComponent, LoadingSpinnerComponent,
    FcfaPipe, TimeAgoPipe,
  ],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <app-back-button/>

      @if (loading()) {
        <app-loading-spinner/>
      } @else if (annonce()) {
        <!-- Photos galerie -->
        <div class="mt-4 mb-6 rounded-2xl overflow-hidden bg-slate-100 relative">
          <div class="relative aspect-video">
            <img
              [src]="currentPhoto()"
              [alt]="annonce()!.typeBien"
              class="w-full h-full object-cover"
              (error)="onImgError($event)"
            />
            <!-- Navigation photos -->
            @if (annonce()!.photos?.length > 1) {
              <button (click)="prevPhoto()"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50
                       text-white rounded-full flex items-center justify-center hover:bg-black/70
                       backdrop-blur-sm transition-all active:scale-90">
                ‹
              </button>
              <button (click)="nextPhoto()"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50
                       text-white rounded-full flex items-center justify-center hover:bg-black/70
                       backdrop-blur-sm transition-all active:scale-90">
                ›
              </button>
              <!-- Indicateur -->
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                @for (p of annonce()!.photos; track p.id; let i = $index) {
                  <button
                    (click)="photoIndex.set(i)"
                    class="w-2 h-2 rounded-full transition-all"
                    [class]="i === photoIndex() ? 'bg-white' : 'bg-white/50'"
                  ></button>
                }
              </div>
            }
          </div>
          <!-- Miniatures -->
          @if (annonce()!.photos?.length > 1) {
            <div class="flex gap-2 p-2 overflow-x-auto">
              @for (p of annonce()!.photos; track p.id; let i = $index) {
                <button (click)="photoIndex.set(i)"
                  class="shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all"
                  [class]="i === photoIndex() ? 'ring-2 ring-blue-900' : 'opacity-60'">
                  <img [src]="p.urlThumb" class="w-full h-full object-cover"/>
                </button>
              }
            </div>
          }
        </div>

        <!-- Info principale -->
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Colonne principale -->
          <div class="md:col-span-2 space-y-6">
            <!-- Titre + statut -->
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <app-status-badge [statut]="annonce()!.statut"/>
                </div>
                <h1 class="text-2xl font-bold text-slate-800">
                  {{ annonce()!.typeBien }}
                </h1>
                <p class="text-slate-500 flex items-center gap-1 mt-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                  {{ annonce()!.quartier }}, {{ annonce()!.ville }}
                </p>
              </div>
              <!-- Partager -->
              <button (click)="share()" class="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              </button>
            </div>

            <!-- Description -->
            <div class="bg-white rounded-2xl p-5 border border-slate-100">
              <h2 class="font-semibold text-slate-800 mb-3">Description</h2>
              <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {{ annonce()!.description }}
              </p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white rounded-xl p-4 text-center border border-slate-100">
                <p class="text-2xl font-bold text-blue-900">{{ annonce()!.nombreVues }}</p>
                <p class="text-xs text-slate-500 mt-1">Vues</p>
              </div>
              <div class="bg-white rounded-xl p-4 text-center border border-slate-100">
                <p class="text-2xl font-bold text-blue-900">{{ annonce()!.nombreContacts }}</p>
                <p class="text-xs text-slate-500 mt-1">Contacts</p>
              </div>
              <div class="bg-white rounded-xl p-4 text-center border border-slate-100">
                <p class="text-2xl font-bold text-blue-900">{{ annonce()!.nombreCommentaires }}</p>
                <p class="text-xs text-slate-500 mt-1">Commentaires</p>
              </div>
            </div>

            <!-- Commentaires -->
            <div class="bg-white rounded-2xl p-5 border border-slate-100">
              <h2 class="font-semibold text-slate-800 mb-4">
                Commentaires ({{ annonce()!.commentaires?.length ?? 0 }})
              </h2>

              @if (annonce()!.commentaires?.length > 0) {
                <div class="space-y-4 mb-6">
                  @for (c of annonce()!.commentaires; track c.id) {
                    <div class="flex gap-3">
                      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <span class="text-blue-700 font-semibold text-xs">{{ c.auteurPrenom[0] }}</span>
                      </div>
                      <div class="flex-1">
                        <div class="bg-slate-50 rounded-2xl rounded-tl-none p-3">
                          <p class="text-xs font-semibold text-slate-700 mb-1">
                            {{ c.auteurPrenom }}
                            @if (c.estProprietaire) { <span class="text-blue-600">(Propriétaire)</span> }
                          </p>
                          <p class="text-sm text-slate-600">{{ c.contenu }}</p>
                        </div>
                        <p class="text-xs text-slate-400 mt-1 ml-3">{{ c.dateCreation | timeAgo }}</p>
                        <!-- Réponse propriétaire -->
                        @if (c.reponse) {
                          <div class="ml-4 mt-2">
                            <div class="bg-blue-50 rounded-2xl rounded-tl-none p-3 border border-blue-100">
                              <p class="text-xs font-semibold text-blue-700 mb-1">Propriétaire</p>
                              <p class="text-sm text-slate-700">{{ c.reponse.contenu }}</p>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-slate-400 text-center py-4">
                  Aucun commentaire. Soyez le premier à poser une question !
                </p>
              }

              <!-- Formulaire commentaire -->
              @if (isLoggedIn()) {
                <div class="flex gap-3 mt-4">
                  <div class="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                    <span class="text-white font-semibold text-xs">{{ userInitial() }}</span>
                  </div>
                  <div class="flex-1">
                    <textarea
                      [(ngModel)]="newComment"
                      placeholder="Poser une question sur cette annonce..."
                      rows="2"
                      maxlength="500"
                      class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50
                             text-sm resize-none focus:border-blue-500 focus:ring-2
                             focus:ring-blue-100 focus:bg-white transition-all outline-none"
                    ></textarea>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-xs text-slate-400">{{ newComment.length }}/500</span>
                      <button
                        (click)="postComment()"
                        [disabled]="newComment.trim().length < 5 || postingComment()"
                        class="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl
                               hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all active:scale-95">
                        {{ postingComment() ? 'Envoi...' : 'Commenter' }}
                      </button>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="text-center py-4 border-t border-slate-100 mt-4">
                  <p class="text-sm text-slate-500 mb-3">
                    Connectez-vous pour laisser un commentaire
                  </p>
                  <a routerLink="/auth/login"
                     class="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl
                            hover:bg-blue-800 transition-all">
                    Se connecter
                  </a>
                </div>
              }
            </div>
          </div>

          <!-- Colonne actions (sticky) -->
          <div class="md:col-span-1">
            <div class="sticky top-20 space-y-4">
              <!-- Prix -->
              <div class="bg-white rounded-2xl p-5 border border-slate-100">
                <p class="text-3xl font-bold text-blue-900">
                  {{ annonce()!.prix | fcfa }}
                </p>
                <p class="text-xs text-slate-400 mt-1">
                  Publié {{ annonce()!.datePublication | timeAgo }}
                </p>
                <p class="text-xs text-slate-400">
                  Expire le {{ formatExpiry(annonce()!.dateExpiration) }}
                </p>
              </div>

              <!-- CTA WhatsApp -->
              @if (annonce()!.statut === 'ACTIVE') {
                @if (isLoggedIn()) {
                  <button
                    (click)="contactWhatsApp()"
                    [disabled]="contactLoading()"
                    class="w-full flex items-center justify-center gap-3 py-4 bg-green-500
                           text-white font-bold rounded-2xl hover:bg-green-600 transition-all
                           active:scale-95 shadow-lg shadow-green-200 disabled:opacity-70">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    {{ contactLoading() ? 'Ouverture...' : 'Contacter via WhatsApp' }}
                  </button>
                } @else {
                  <a routerLink="/auth/login"
                     class="flex items-center justify-center gap-2 w-full py-4 bg-green-500
                            text-white font-bold rounded-2xl hover:bg-green-600 transition-all">
                    🔒 Se connecter pour contacter
                  </a>
                }
              }

              <!-- Favori -->
              @if (isLoggedIn()) {
                <button
                  (click)="toggleFavori()"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                         border transition-all font-medium text-sm active:scale-95"
                  [class]="isFavori() ?
                    'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' :
                    'border-slate-200 text-slate-600 hover:bg-slate-50'">
                  <svg class="w-5 h-5" [class]="isFavori() ? 'fill-red-500' : 'fill-none'"
                       stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  {{ isFavori() ? 'Retiré des favoris' : 'Ajouter aux favoris' }}
                </button>
              }

              <!-- Signaler -->
              @if (isLoggedIn()) {
                <button (click)="openSignalement()"
                  class="w-full py-2 text-sm text-slate-400 hover:text-red-500
                         transition-colors text-center">
                  ⚑ Signaler cette annonce
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Modal signalement -->
        @if (showSignalement()) {
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
               (click)="showSignalement.set(false)">
            <div class="absolute inset-0 bg-black/40"></div>
            <div class="relative w-full max-w-sm bg-white rounded-3xl p-6 slide-up"
                 (click)="$event.stopPropagation()">
              <h3 class="font-bold text-slate-800 mb-4">Signaler cette annonce</h3>
              <div class="space-y-2 mb-4">
                @for (motif of motifs; track motif.value) {
                  <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <input type="radio" name="motif" [value]="motif.value"
                           [(ngModel)]="selectedMotif" class="accent-blue-900"/>
                    <span class="text-sm text-slate-700">{{ motif.label }}</span>
                  </label>
                }
              </div>
              @if (selectedMotif === 'AUTRE') {
                <textarea [(ngModel)]="signalementDesc" placeholder="Précisez le motif..."
                  rows="3" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm
                                   resize-none focus:border-blue-500 outline-none mb-4"></textarea>
              }
              <div class="flex gap-3">
                <button (click)="showSignalement.set(false)"
                  class="flex-1 py-3 rounded-xl border border-slate-200 text-sm text-slate-600">
                  Annuler
                </button>
                <button (click)="submitSignalement()" [disabled]="!selectedMotif"
                  class="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold
                         disabled:opacity-50 hover:bg-red-700 transition-colors">
                  Signaler
                </button>
              </div>
            </div>
          </div>
        }

      } @else if (!loading()) {
        <div class="text-center py-16">
          <p class="text-slate-500 mb-4">Cette annonce n'est plus disponible.</p>
          <a routerLink="/annonces"
             class="px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800">
            Voir des annonces similaires
          </a>
        </div>
      }
    </div>
  `,
})
export class AnnonceDetailComponent implements OnInit {
  private readonly store       = inject(Store);
  private readonly route       = inject(ActivatedRoute);
  private readonly contactApi  = inject(ContactApi);
  private readonly commentApi  = inject(CommentaireApi);
  private readonly signalApi   = inject(SignalementApi);
  private readonly toast       = inject(ToastService);

  readonly annonce     = this.store.selectSignal(selectAnnonceDetail);
  readonly loading     = this.store.selectSignal(selectDetailLoading);
  readonly isLoggedIn  = this.store.selectSignal(selectIsLoggedIn);
  readonly user        = this.store.selectSignal(selectCurrentUser);

  photoIndex     = signal(0);
  contactLoading = signal(false);
  postingComment = signal(false);
  showSignalement = signal(false);
  newComment = '';
  selectedMotif = '';
  signalementDesc = '';

  readonly motifs = Object.entries(MOTIF_SIGNALEMENT_LABELS).map(([value, label]) => ({ value, label }));

  get userInitial(): () => string {
    return () => this.user()?.prenom?.[0]?.toUpperCase() ?? 'U';
  }

  readonly isFavori = (() => {
    const id = signal(0);
    return this.store.selectSignal(isFavori(id()));
  })();

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(annonceActions.loadDetail({ id }));
    if (this.isLoggedIn()) this.store.dispatch(favoriActions.load());
  }

  currentPhoto(): string {
    const a = this.annonce();
    if (!a) return '/assets/images/no-photo.svg';
    if (a.photos?.length > 0) return a.photos[this.photoIndex()].url;
    return a.photoPrincipale ?? '/assets/images/no-photo.svg';
  }

  prevPhoto(): void {
    const len = this.annonce()!.photos?.length ?? 0;
    this.photoIndex.update(i => (i - 1 + len) % len);
  }
  nextPhoto(): void {
    const len = this.annonce()!.photos?.length ?? 0;
    this.photoIndex.update(i => (i + 1) % len);
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = '/assets/images/no-photo.svg';
  }

  formatExpiry(date: string): string {
    return new Date(date).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  contactWhatsApp(): void {
    const a = this.annonce();
    if (!a) return;
    this.contactLoading.set(true);
    this.contactApi.enregistrer(a.id).subscribe({
      next: res => {
        this.contactLoading.set(false);
        window.open(res.data.whatsappUrl, '_blank', 'noopener');
      },
      error: () => this.contactLoading.set(false),
    });
  }

  toggleFavori(): void {
    const a = this.annonce();
    if (!a) return;
    if (a.isFavori) {
      this.store.dispatch(favoriActions.remove({ annonceId: a.id }));
    } else {
      this.store.dispatch(favoriActions.add({ annonceId: a.id }));
    }
  }

  postComment(): void {
    const a = this.annonce();
    if (!a || this.newComment.trim().length < 5) return;
    this.postingComment.set(true);
    this.commentApi.poster({ contenu: this.newComment.trim(), annonceId: a.id }).subscribe({
      next: () => {
        this.toast.success('Commentaire publié !');
        this.newComment = '';
        this.postingComment.set(false);
        this.store.dispatch(annonceActions.loadDetail({ id: a.id }));
      },
      error: () => this.postingComment.set(false),
    });
  }

  openSignalement(): void { this.showSignalement.set(true); }

  submitSignalement(): void {
    const a = this.annonce();
    if (!a || !this.selectedMotif) return;
    this.signalApi.signaler({
      annonceId: a.id,
      motif: this.selectedMotif,
      description: this.signalementDesc || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Signalement envoyé. Merci !');
        this.showSignalement.set(false);
        this.selectedMotif = '';
        this.signalementDesc = '';
      },
    });
  }

  share(): void {
    if (navigator.share) {
      navigator.share({ title: this.annonce()?.typeBien, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      this.toast.success('Lien copié !');
    }
  }
}
EOF
OK "AnnonceDetail"

cat > "$FEAT/annonce/annonce.routes.ts" << 'EOF'
import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { verifiedGuard } from '@core/guards/verified.guard';

export const ANNONCE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./list/annonce-list.component').then(m => m.AnnonceListComponent) },
  { path: 'creer', loadComponent: () => import('./create/annonce-create.component').then(m => m.AnnonceCreateComponent), canActivate: [authGuard, verifiedGuard] },
  { path: ':id/modifier', loadComponent: () => import('./edit/annonce-edit.component').then(m => m.AnnonceEditComponent), canActivate: [authGuard] },
  { path: ':id', loadComponent: () => import('./detail/annonce-detail.component').then(m => m.AnnonceDetailComponent) },
];
EOF

# Placeholder create/edit (sera complet dans script 06)
cat > "$FEAT/annonce/create/annonce-create.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({ selector: 'app-annonce-create', standalone: true, imports: [RouterLink], template: `<div class="max-w-2xl mx-auto px-4 py-8"><p class="text-center text-slate-500">Formulaire de création — généré dans ng-06-dashboard.sh</p></div>` })
export class AnnonceCreateComponent {}
EOF

cat > "$FEAT/annonce/edit/annonce-edit.component.ts" << 'EOF'
import { Component } from '@angular/core';
@Component({ selector: 'app-annonce-edit', standalone: true, template: `<div class="p-8 text-center text-slate-500">Édition — ng-06</div>` })
export class AnnonceEditComponent {}
EOF

# =============================================================================
# 3. AUTH FEATURES
# =============================================================================
SECTION "3/4 — Auth (Register, Login, OTP, ForgotPassword)"
mkdir -p "$FEAT/auth/register" "$FEAT/auth/verify-email" "$FEAT/auth/login" "$FEAT/auth/forgot-password" "$FEAT/auth/reset-password"

# --- REGISTER ---
cat > "$FEAT/auth/register/register.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/auth/auth.selectors';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';

function passwordMatch(ctrl: AbstractControl) {
  const p = ctrl.get('motDePasse')?.value;
  const c = ctrl.get('confirmationMotDePasse')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PhoneInputComponent],
  template: `
    <div class="bg-white rounded-3xl shadow-2xl shadow-blue-950/20 p-7 fade-in">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-slate-800">Créer un compte</h1>
        <p class="text-slate-500 text-sm mt-1">Rejoignez ImmoCam gratuitement</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Prénom + Nom -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Prénom *</label>
            <input formControlName="prenom" type="text" placeholder="Jean"
              class="form-input" [class.border-red-300]="hasError('prenom')"/>
            @if (hasError('prenom')) {
              <p class="text-red-500 text-xs mt-1">Minimum 2 caractères</p>
            }
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nom *</label>
            <input formControlName="nom" type="text" placeholder="Kamga"
              class="form-input" [class.border-red-300]="hasError('nom')"/>
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
          <input formControlName="email" type="email" placeholder="jean@exemple.cm"
            class="form-input" [class.border-red-300]="hasError('email')"/>
          @if (hasError('email')) {
            <p class="text-red-500 text-xs mt-1">Email invalide</p>
          }
        </div>

        <!-- Téléphone -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone *</label>
          <app-phone-input formControlName="telephone"/>
          @if (hasError('telephone')) {
            <p class="text-red-500 text-xs mt-1">Format: +237 6XX XX XX XX</p>
          }
        </div>

        <!-- Ville -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Ville *</label>
          <select formControlName="ville" class="form-input bg-slate-50">
            <option value="">Sélectionnez votre ville</option>
            @for (v of villes; track v) { <option [value]="v">{{ v }}</option> }
          </select>
        </div>

        <!-- Mot de passe -->
        <div formGroupName="passwords">
          <div class="mb-3">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe *</label>
            <div class="relative">
              <input formControlName="motDePasse" [type]="showPwd() ? 'text' : 'password'"
                placeholder="Minimum 8 caractères" class="form-input pr-10"/>
              <button type="button" (click)="showPwd.update(v => !v)"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {{ showPwd() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Confirmation *</label>
            <input formControlName="confirmationMotDePasse" [type]="showPwd() ? 'text' : 'password'"
              placeholder="Répétez le mot de passe" class="form-input"
              [class.border-red-300]="form.get('passwords')?.hasError('mismatch') && form.get('passwords')?.touched"/>
            @if (form.get('passwords')?.hasError('mismatch') && form.get('passwords')?.touched) {
              <p class="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
            }
          </div>
        </div>

        <!-- Politique -->
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <label class="flex items-start gap-3 cursor-pointer">
            <input formControlName="politiqueAcceptee" type="checkbox"
              class="mt-0.5 accent-blue-900 w-4 h-4 rounded shrink-0"/>
            <span class="text-xs text-slate-600 leading-relaxed">
              J'ai lu et j'accepte la
              <a routerLink="/politique-confidentialite" target="_blank"
                 class="text-blue-700 underline hover:text-blue-900 font-medium">
                Politique de confidentialité
              </a>
              et les
              <a routerLink="/conditions-utilisation" target="_blank"
                 class="text-blue-700 underline hover:text-blue-900 font-medium">
                Conditions d'utilisation
              </a>
              d'ImmoCam.
            </span>
          </label>
        </div>

        @if (error()) {
          <div class="bg-red-50 border border-red-100 rounded-xl p-3">
            <p class="text-red-600 text-sm">{{ error() }}</p>
          </div>
        }

        <button type="submit"
          [disabled]="form.invalid || !form.get('politiqueAcceptee')?.value || loading()"
          class="w-full py-3.5 bg-blue-900 text-white font-bold rounded-2xl
                 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all active:scale-98 shadow-lg shadow-blue-900/20">
          {{ loading() ? 'Création...' : 'Créer mon compte' }}
        </button>

        <p class="text-center text-sm text-slate-500">
          Déjà un compte ?
          <a routerLink="/auth/login" class="text-blue-700 font-semibold hover:text-blue-900">
            Se connecter
          </a>
        </p>
      </form>
    </div>
  `,
  styles: [`
    .form-input {
      @apply w-full h-12 px-4 rounded-xl border border-slate-200 text-sm text-slate-800
             focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none;
    }
  `],
})
export class RegisterComponent {
  private readonly store = inject(Store);
  private readonly fb    = inject(FormBuilder);

  readonly loading = this.store.selectSignal(selectAuthLoading);
  readonly error   = this.store.selectSignal(selectAuthError);
  readonly showPwd = signal(false);

  readonly villes = [
    'Yaoundé','Douala','Maroua','Garoua','Ngaoundéré','Bertoua',
    'Mbalmayo','Bafia','Nkongsamba','Edéa','Bafoussam','Dschang',
    'Foumban','Bamenda','Buea','Kumba','Limbé','Ebolowa','Kribi','Sangmélima'
  ];

  form = this.fb.group({
    prenom:    ['', [Validators.required, Validators.minLength(2)]],
    nom:       ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(/^\+237[0-9]{9}$/)]],
    ville:     ['', Validators.required],
    passwords: this.fb.group({
      motDePasse:             ['', [Validators.required, Validators.minLength(8)]],
      confirmationMotDePasse: ['', Validators.required],
    }, { validators: passwordMatch }),
    politiqueAcceptee: [false, Validators.requiredTrue],
  });

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.store.dispatch(authActions.register({
      req: {
        prenom:   v.prenom!,
        nom:      v.nom!,
        email:    v.email!,
        telephone: v.telephone!,
        ville:    v.ville!,
        motDePasse: v.passwords.motDePasse!,
        confirmationMotDePasse: v.passwords.confirmationMotDePasse!,
        politiqueAcceptee: true,
      }
    }));
  }
}
EOF
OK "Register"

# --- VERIFY EMAIL OTP ---
cat > "$FEAT/auth/verify-email/verify-email.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError, selectPendingEmail } from '@store/auth/auth.selectors';
import { OtpInputComponent } from '@shared/components/otp-input/otp-input.component';
import { AuthApi } from '@core/services/api/auth.api';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, OtpInputComponent],
  template: `
    <div class="bg-white rounded-3xl shadow-2xl shadow-blue-950/20 p-7 text-center fade-in">
      <!-- Icône -->
      <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>

      <h1 class="text-xl font-bold text-slate-800 mb-2">Vérifiez votre email</h1>
      <p class="text-slate-500 text-sm mb-1">
        Un code à 6 chiffres a été envoyé à
      </p>
      <p class="font-semibold text-blue-900 text-sm mb-6">{{ email() }}</p>

      <!-- OTP Input -->
      <div class="mb-6">
        <app-otp-input
          [length]="6"
          [error]="otpError()"
          (completed)="onCodeComplete($event)"
          (changed)="onCodeChanged($event)"
        />
      </div>

      <!-- Bouton valider -->
      <button
        (click)="verify()"
        [disabled]="code.length < 6 || loading()"
        class="w-full py-3.5 bg-blue-900 text-white font-bold rounded-2xl
               hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-98
               shadow-lg shadow-blue-900/20 mb-4">
        {{ loading() ? 'Vérification...' : 'Valider le code' }}
      </button>

      <!-- Renvoi code -->
      <div class="space-y-2">
        <p class="text-sm text-slate-500">Vous n'avez pas reçu le code ?</p>
        @if (canResend()) {
          <button
            (click)="resend()"
            [disabled]="resending()"
            class="text-blue-700 font-semibold text-sm hover:text-blue-900 transition-colors">
            {{ resending() ? 'Envoi...' : '↺ Renvoyer le code' }}
          </button>
        } @else {
          <p class="text-sm text-slate-400">
            Renvoyer dans {{ countdown() }}s
            ({{ 3 - resendCount() }} envoi{{ resendCount() < 2 ? 's' : '' }} restant{{ resendCount() < 2 ? 's' : '' }})
          </p>
        }
      </div>

      @if (resendCount() >= 3) {
        <div class="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p class="text-xs text-amber-700">
            Limite d'envois atteinte.
            <a href="https://wa.me/237697847396" target="_blank" class="underline font-semibold">
              Contacter le support WhatsApp
            </a>
          </p>
        </div>
      }
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly store   = inject(Store);
  private readonly route   = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApi);
  private readonly toast   = inject(ToastService);

  readonly loading     = this.store.selectSignal(selectAuthLoading);
  readonly storeError  = this.store.selectSignal(selectAuthError);
  readonly pendingEmail = this.store.selectSignal(selectPendingEmail);

  email      = signal('');
  code       = '';
  otpError   = signal<string | undefined>(undefined);
  resending  = signal(false);
  resendCount = signal(0);
  canResend  = signal(false);
  countdown  = signal(60);

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const queryEmail = this.route.snapshot.queryParamMap.get('email');
    this.email.set(queryEmail ?? this.pendingEmail() ?? '');
    this.startCountdown();
  }

  startCountdown(): void {
    this.canResend.set(false);
    this.countdown.set(60);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown.update(v => v - 1);
      if (this.countdown() <= 0) {
        clearInterval(this.timer);
        this.canResend.set(true);
      }
    }, 1000);
  }

  onCodeChanged(code: string): void  { this.code = code; this.otpError.set(undefined); }
  onCodeComplete(code: string): void { this.code = code; this.verify(); }

  verify(): void {
    if (this.code.length < 6) return;
    this.otpError.set(undefined);
    this.store.dispatch(authActions.verifyEmail({ req: { email: this.email(), code: this.code } }));
  }

  resend(): void {
    if (this.resendCount() >= 3) return;
    this.resending.set(true);
    this.authApi.resendCode({ email: this.email() }).subscribe({
      next: () => {
        this.resending.set(false);
        this.resendCount.update(v => v + 1);
        this.toast.success('Code renvoyé ! Vérifiez votre boîte mail.');
        this.startCountdown();
      },
      error: () => this.resending.set(false),
    });
  }
}
EOF
OK "VerifyEmail OTP"

# --- LOGIN ---
cat > "$FEAT/auth/login/login.component.ts" << 'EOF'
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-3xl shadow-2xl shadow-blue-950/20 p-7 fade-in">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-slate-800">Connexion</h1>
        <p class="text-slate-500 text-sm mt-1">Accédez à votre espace ImmoCam</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
          <input formControlName="email" type="email" placeholder="votre@email.cm"
            class="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            autocomplete="email"/>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe</label>
          <div class="relative">
            <input formControlName="motDePasse" [type]="showPwd() ? 'text' : 'password'"
              placeholder="Votre mot de passe" autocomplete="current-password"
              class="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"/>
            <button type="button" (click)="showPwd.update(v => !v)"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1">
              {{ showPwd() ? '🙈' : '👁️' }}
            </button>
          </div>
          <div class="text-right mt-1">
            <a routerLink="/auth/forgot-password"
               class="text-xs text-blue-700 hover:text-blue-900 font-medium">
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        @if (error()) {
          <div class="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
            <span class="text-red-500 text-sm shrink-0">⚠️</span>
            <p class="text-red-600 text-sm">{{ error() }}</p>
          </div>
        }

        <button type="submit" [disabled]="form.invalid || loading()"
          class="w-full py-3.5 bg-blue-900 text-white font-bold rounded-2xl
                 hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-98
                 shadow-lg shadow-blue-900/20">
          {{ loading() ? 'Connexion...' : 'Se connecter' }}
        </button>

        <p class="text-center text-sm text-slate-500">
          Pas encore de compte ?
          <a routerLink="/auth/register" class="text-blue-700 font-semibold hover:text-blue-900">
            Créer un compte
          </a>
        </p>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly store = inject(Store);
  private readonly fb    = inject(FormBuilder);

  readonly loading = this.store.selectSignal(selectAuthLoading);
  readonly error   = this.store.selectSignal(selectAuthError);
  readonly showPwd = signal(false);

  form = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, motDePasse } = this.form.getRawValue();
    this.store.dispatch(authActions.login({ req: { email: email!, motDePasse: motDePasse! } }));
  }
}
EOF
OK "Login"

# --- FORGOT PASSWORD ---
cat > "$FEAT/auth/forgot-password/forgot-password.component.ts" << 'EOF'
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthApi } from '@core/services/api/auth.api';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-3xl shadow-2xl shadow-blue-950/20 p-7 fade-in">
      <app-back-button-inline (click)="history.back()"/>
      <div class="text-center mb-6">
        <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          🔑
        </div>
        <h1 class="text-xl font-bold text-slate-800">Mot de passe oublié ?</h1>
        <p class="text-slate-500 text-sm mt-1">
          Entrez votre email pour recevoir un lien de réinitialisation (valable 30 min).
        </p>
      </div>

      @if (!sent()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
            <input formControlName="email" type="email" placeholder="votre@email.cm"
              class="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
          </div>
          <button type="submit" [disabled]="form.invalid || loading()"
            class="w-full py-3.5 bg-blue-900 text-white font-bold rounded-2xl
                   hover:bg-blue-800 disabled:opacity-50 transition-all">
            {{ loading() ? 'Envoi...' : 'Envoyer le lien' }}
          </button>
          <p class="text-center">
            <a routerLink="/auth/login" class="text-sm text-blue-700 hover:text-blue-900 font-medium">
              ← Retour à la connexion
            </a>
          </p>
        </form>
      } @else {
        <div class="text-center space-y-4">
          <div class="text-4xl">📬</div>
          <p class="text-slate-700 font-medium">Email envoyé !</p>
          <p class="text-slate-500 text-sm">
            Vérifiez votre boîte mail (et les spams). Le lien est valable 30 minutes.
          </p>
          <a routerLink="/auth/login"
             class="inline-block px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl
                    hover:bg-blue-800 transition-all">
            Retour à la connexion
          </a>
        </div>
      }
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly authApi = inject(AuthApi);
  private readonly fb      = inject(FormBuilder);

  loading = signal(false);
  sent    = signal(false);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.authApi.forgotPassword({ email: this.form.value.email! }).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => this.loading.set(false),
    });
  }
}
EOF
OK "ForgotPassword"

# --- RESET PASSWORD ---
cat > "$FEAT/auth/reset-password/reset-password.component.ts" << 'EOF'
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AuthApi } from '@core/services/api/auth.api';
import { ToastService } from '@core/services/toast.service';

function matchPwd(c: AbstractControl) {
  const a = c.get('nouveauMotDePasse')?.value;
  const b = c.get('confirmationMotDePasse')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-3xl shadow-2xl p-7 fade-in">
      <div class="text-center mb-6">
        <h1 class="text-xl font-bold text-slate-800">Nouveau mot de passe</h1>
        <p class="text-slate-500 text-sm mt-1">Choisissez un mot de passe sécurisé</p>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nouveau mot de passe</label>
          <input formControlName="nouveauMotDePasse" type="password" placeholder="Minimum 8 caractères"
            class="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Confirmation</label>
          <input formControlName="confirmationMotDePasse" type="password" placeholder="Répétez le mot de passe"
            class="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
          @if (form.hasError('mismatch') && form.touched) {
            <p class="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
          }
        </div>
        <button type="submit" [disabled]="form.invalid || loading()"
          class="w-full py-3.5 bg-blue-900 text-white font-bold rounded-2xl hover:bg-blue-800 disabled:opacity-50 transition-all">
          {{ loading() ? 'Modification...' : 'Modifier le mot de passe' }}
        </button>
      </form>
    </div>
  `,
})
export class ResetPasswordComponent {
  private readonly authApi = inject(AuthApi);
  private readonly fb      = inject(FormBuilder);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly toast   = inject(ToastService);

  loading = signal(false);

  form = this.fb.group({
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(8)]],
    confirmationMotDePasse: ['', Validators.required],
  }, { validators: matchPwd });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    const { nouveauMotDePasse, confirmationMotDePasse } = this.form.getRawValue();
    this.authApi.resetPassword({ token, nouveauMotDePasse: nouveauMotDePasse!, confirmationMotDePasse: confirmationMotDePasse! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Mot de passe modifié ! Connectez-vous.');
        this.router.navigate(['/auth/login']);
      },
      error: () => this.loading.set(false),
    });
  }
}
EOF
OK "ResetPassword"

cat > "$FEAT/auth/auth.routes.ts" << 'EOF'
import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  { path: 'login',           loadComponent: () => import('./login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register',        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'verify-email',    loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },
  { path: 'reset-password',  loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
];
EOF
OK "Auth routes"

# =============================================================================
# 4. PAGES LÉGALES + 404
# =============================================================================
SECTION "4/4 — Pages légales + 404"
mkdir -p "$FEAT/politique-confidentialite" "$FEAT/conditions-utilisation" "$FEAT/not-found" "$FEAT/contact"

cat > "$FEAT/politique-confidentialite/politique.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
@Component({
  selector: 'app-politique',
  standalone: true,
  imports: [BackButtonComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4 prose prose-slate max-w-none">
        <h1 class="text-2xl font-bold text-blue-900 mb-2">Politique de confidentialité</h1>
        <p class="text-slate-400 text-sm mb-6">En vigueur depuis le 1er janvier 2026 — par MBEMNOVA</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">1. Données collectées</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">ImmoCam collecte : prénom, nom, email, numéro de téléphone, ville. Ces données sont utilisées pour la création et gestion du compte, ainsi que pour le contact entre utilisateurs.</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">2. Protection de vos données</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">ImmoCam ne vend jamais vos données à des tiers. Le numéro WhatsApp des propriétaires n'est jamais affiché en clair — il est uniquement intégré dans le lien de contact. Vos données personnelles ne sont pas partagées avec des partenaires commerciaux.</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">3. Durée de conservation</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">Données du compte : conservées tant que le compte est actif. Après suppression : données anonymisées sous 30 jours. Logs de sécurité : conservés 12 mois.</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">4. Vos droits</h2>
        <p class="text-slate-600 text-sm leading-relaxed">Vous avez le droit d'accès, de modification et de suppression de vos données à tout moment depuis votre profil.</p>
      </div>
    </div>
  `,
})
export class PolitiqueComponent {}
EOF

cat > "$FEAT/conditions-utilisation/conditions.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [BackButtonComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4">
        <h1 class="text-2xl font-bold text-blue-900 mb-2">Conditions d'utilisation</h1>
        <p class="text-slate-400 text-sm mb-6">Dernière mise à jour : janvier 2026</p>
        <div class="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>En utilisant ImmoCam, vous acceptez les présentes conditions. La plateforme est un service de mise en relation entre propriétaires et locataires. Les annonces sont publiées sous la responsabilité exclusive des propriétaires.</p>
          <p>Limite : 5 annonces actives par compte (configurable). Publication immédiate, sans modération préalable. L'administration se réserve le droit de supprimer toute annonce à tout moment.</p>
          <p>ImmoCam est développé et opéré par MBEMNOVA — Douala, Cameroun.</p>
        </div>
      </div>
    </div>
  `,
})
export class ConditionsComponent {}
EOF

cat > "$FEAT/not-found/not-found.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div class="text-8xl mb-6">🏚️</div>
      <h1 class="text-4xl font-bold text-blue-900 mb-3">404</h1>
      <p class="text-slate-600 text-lg mb-2">Cette page n'existe pas</p>
      <p class="text-slate-400 text-sm mb-8">Le bien que vous cherchez a peut-être expiré ou été supprimé.</p>
      <a routerLink="/"
         class="px-8 py-3.5 bg-blue-900 text-white font-bold rounded-2xl
                hover:bg-blue-800 transition-all active:scale-95 shadow-lg">
        Retour à l'accueil
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
EOF

cat > "$FEAT/contact/contact.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [BackButtonComponent],
  template: `
    <div class="max-w-lg mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4 text-center">
        <div class="text-4xl mb-4">👋</div>
        <h1 class="text-xl font-bold text-blue-900 mb-2">Contacter MBEMNOVA</h1>
        <p class="text-slate-500 text-sm mb-6">Support disponible du lundi au samedi, 8h-18h</p>
        <div class="space-y-3">
          <a href="https://wa.me/237697847396" target="_blank"
             class="flex items-center justify-center gap-3 w-full py-3.5 bg-green-500
                    text-white font-semibold rounded-2xl hover:bg-green-600 transition-all">
            📱 WhatsApp: +237 697 847 396
          </a>
          <a href="mailto:mbemnova25@gmail.com"
             class="flex items-center justify-center gap-3 w-full py-3.5 border border-slate-200
                    text-slate-700 font-medium rounded-2xl hover:bg-slate-50 transition-all">
            ✉️ mbemnova25@gmail.com
          </a>
          <a href="https://mbemnova.com" target="_blank"
             class="flex items-center justify-center gap-3 w-full py-3.5 border border-blue-200
                    text-blue-700 font-medium rounded-2xl hover:bg-blue-50 transition-all">
            🌐 mbemnova.com
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ContactComponent {}
EOF

OK "Pages légales + 404 + Contact"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 05 TERMINÉ — FEATURES PUBLIQUES + AUTH${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Home: scroll infini + filtres + hero"
INFO "Annonce: List (filtres) + Detail (gallery + WhatsApp + commentaires)"
INFO "Auth: Register + VerifyEmail OTP + Login + ForgotPassword + ResetPassword"
INFO "Pages: Politique, CGU, 404, Contact"
echo ""
WARN "Prochaine étape: bash ../ng-06-dashboard.sh"
