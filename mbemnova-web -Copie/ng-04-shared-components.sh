#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 04 : COMPOSANTS PARTAGÉS
# =============================================================================
# Rôle     : Génère tous les composants réutilisables :
#            - AnnonceCard (carte annonce + skeleton shimmer Facebook-style)
#            - PhotoGallery (carrousel photos)
#            - PriceDisplay (formatage FCFA)
#            - StatusBadge (badge statut coloré)
#            - EmptyState (illustration vide)
#            - ConfirmDialog (modale de confirmation)
#            - LoadingSpinner (overlay global)
#            - InfiniteScroll (IntersectionObserver)
#            - OtpInput (6 cases OTP animé)
#            - PhoneInput (+237 camerounais)
#            - ImageUpload (Drag & Drop photos)
#            - FilterBar (barre recherche/filtres)
#            - BackButton + PageHeader
#            - Layout: MainLayout, AuthLayout, AdminLayout
#
# Exécuter : bash ../bash ng-04-shared-components.sh
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
SECTION "SCRIPT 04 — COMPOSANTS PARTAGÉS"

SHARED="src/app/shared"
LAYOUT="src/app/layout"

# =============================================================================
# 1. PIPES
# =============================================================================
SECTION "1/5 — Pipes"
mkdir -p "$SHARED/pipes"

cat > "$SHARED/pipes/fcfa.pipe.ts" << 'EOF'
import { Pipe, PipeTransform } from '@angular/core';

/** Transforme 150000 → "150 000 FCFA" */
@Pipe({ name: 'fcfa', standalone: true })
export class FcfaPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showCurrency = true): string {
    if (value === null || value === undefined || value === '') return showCurrency ? '— FCFA' : '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return showCurrency ? '— FCFA' : '—';
    const formatted = new Intl.NumberFormat('fr-CM', { maximumFractionDigits: 0 }).format(num);
    return showCurrency ? `${formatted} FCFA` : formatted;
  }
}
EOF
OK "fcfa.pipe.ts"

cat > "$SHARED/pipes/time-ago.pipe.ts" << 'EOF'
import { Pipe, PipeTransform } from '@angular/core';

/** Transforme une date ISO en "Il y a 2 heures" */
@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'À l\'instant';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days}j`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
    return `Il y a ${Math.floor(days / 365)} an(s)`;
  }
}
EOF
OK "time-ago.pipe.ts"

cat > "$SHARED/pipes/phone-mask.pipe.ts" << 'EOF'
import { Pipe, PipeTransform } from '@angular/core';

/** Masque: "+237 691 *** ***" */
@Pipe({ name: 'phoneMask', standalone: true })
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (clean.startsWith('237') && clean.length >= 11) {
      return `+237 ${clean.slice(3, 6)} *** ***`;
    }
    if (clean.length >= 9) {
      return `+237 ${clean.slice(0, 3)} *** ***`;
    }
    return value;
  }
}
EOF
OK "phone-mask.pipe.ts"

cat > "$SHARED/pipes/truncate.pipe.ts" << 'EOF'
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 100, trail = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
EOF
OK "truncate.pipe.ts"

# Index pipes
cat > "$SHARED/pipes/index.ts" << 'EOF'
export * from './fcfa.pipe';
export * from './time-ago.pipe';
export * from './phone-mask.pipe';
export * from './truncate.pipe';
EOF

# =============================================================================
# 2. DIRECTIVES
# =============================================================================
SECTION "2/5 — Directives"
mkdir -p "$SHARED/directives"

cat > "$SHARED/directives/lazy-img.directive.ts" << 'EOF'
import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({ selector: 'img[lazyImg]', standalone: true })
export class LazyImgDirective implements OnInit {
  @Input('lazyImg') src!: string;
  @Input() placeholder = '/assets/images/no-photo.svg';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    const img = this.el.nativeElement;
    img.src = this.placeholder;
    img.classList.add('opacity-0', 'transition-opacity', 'duration-300');

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const realImg = new Image();
        realImg.onload = () => {
          img.src = this.src;
          img.classList.remove('opacity-0');
          img.classList.add('opacity-100');
        };
        realImg.src = this.src;
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(img);
  }
}
EOF

cat > "$SHARED/directives/click-stop.directive.ts" << 'EOF'
import { Directive, HostListener } from '@angular/core';

@Directive({ selector: '[clickStop]', standalone: true })
export class ClickStopDirective {
  @HostListener('click', ['$event'])
  onClick(event: Event): void { event.stopPropagation(); }
}
EOF

cat > "$SHARED/directives/index.ts" << 'EOF'
export * from './lazy-img.directive';
export * from './click-stop.directive';
EOF
OK "Directives"

# =============================================================================
# 3. COMPOSANTS PARTAGÉS
# =============================================================================
SECTION "3/5 — Composants"

# Créer tous les répertoires des composants
mkdir -p \
  "$SHARED/components/annonce-card-skeleton" \
  "$SHARED/components/annonce-card" \
  "$SHARED/components/photo-gallery" \
  "$SHARED/components/price-display" \
  "$SHARED/components/status-badge" \
  "$SHARED/components/empty-state" \
  "$SHARED/components/confirm-dialog" \
  "$SHARED/components/loading-spinner" \
  "$SHARED/components/infinite-scroll" \
  "$SHARED/components/otp-input" \
  "$SHARED/components/phone-input" \
  "$SHARED/components/image-upload" \
  "$SHARED/components/filter-bar" \
  "$SHARED/components/back-button" \
  "$SHARED/components/page-header"

# --- ANNONCE CARD SKELETON ---
cat > "$SHARED/components/annonce-card-skeleton/annonce-card-skeleton.component.ts" << 'EOF'
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-annonce-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
      <!-- Image skeleton -->
      <div class="skeleton h-48 w-full bg-slate-200"></div>
      <!-- Content -->
      <div class="p-4 space-y-3">
        <div class="skeleton h-4 w-2/3 rounded-full bg-slate-200"></div>
        <div class="skeleton h-3 w-1/2 rounded-full bg-slate-200"></div>
        <div class="flex items-center justify-between pt-1">
          <div class="skeleton h-6 w-1/3 rounded-full bg-slate-200"></div>
          <div class="skeleton h-8 w-8 rounded-full bg-slate-200"></div>
        </div>
        <div class="skeleton h-3 w-1/4 rounded-full bg-slate-200"></div>
      </div>
    </div>
  `,
})
export class AnnonceCardSkeletonComponent {
  @Input() count = 1;
}
EOF
OK "AnnonceCardSkeleton"

# --- ANNONCE CARD ---
cat > "$SHARED/components/annonce-card/annonce-card.component.ts" << 'EOF'
import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AnnonceListResponse } from '@core/models';
import { favoriActions } from '@store/favori/favori.actions';
import { selectIsLoggedIn } from '@store/auth/auth.selectors';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { LazyImgDirective } from '@shared/directives/lazy-img.directive';

@Component({
  selector: 'app-annonce-card',
  standalone: true,
  imports: [CommonModule, RouterLink, FcfaPipe, TimeAgoPipe, LazyImgDirective],
  template: `
    <article
      class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100
             hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer
             fade-in group"
      [routerLink]="['/annonces', annonce.id]"
      [attr.aria-label]="'Annonce: ' + annonce.typeBien + ' à ' + annonce.quartier"
    >
      <!-- Photo -->
      <div class="relative overflow-hidden h-48 bg-slate-100">
        <img
          [lazyImg]="annonce.photoPrincipaleThumb || annonce.photoPrincipale || ''"
          [placeholder]="'/assets/images/no-photo.svg'"
          [alt]="annonce.typeBien + ' à ' + annonce.quartier"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <!-- Badge statut -->
        @if (annonce.statut !== 'ACTIVE') {
          <span class="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-lg"
                [class]="statusClass">
            {{ statusLabel }}
          </span>
        }
        <!-- Favori -->
        @if (isLoggedIn()) {
          <button
            (click)="toggleFavori($event)"
            class="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full
                   flex items-center justify-center hover:bg-white hover:scale-110
                   transition-all duration-200 shadow-sm"
            [attr.aria-label]="annonce.isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            <svg class="w-4 h-4 transition-colors" [class]="annonce.isFavori ? 'text-red-500 fill-red-500' : 'text-slate-400'"
                 viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        }
        <!-- Nombre de photos -->
        @if (annonce.hasPhotos) {
          <span class="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
            Photos
          </span>
        }
      </div>

      <!-- Contenu -->
      <div class="p-4">
        <!-- Type + Localisation -->
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 class="font-semibold text-slate-800 text-sm leading-tight">
              {{ annonce.typeBien }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              {{ annonce.quartier }}, {{ annonce.ville }}
            </p>
          </div>
          <!-- Vues -->
          <span class="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1 mt-0.5">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            {{ annonce.nombreVues }}
          </span>
        </div>

        <!-- Prix -->
        <div class="flex items-center justify-between">
          <p class="text-lg font-bold text-blue-900">
            {{ annonce.prix | fcfa }}
          </p>
        </div>

        <!-- Date -->
        <p class="text-xs text-slate-400 mt-2">
          {{ annonce.datePublication | timeAgo }}
        </p>
      </div>
    </article>
  `,
})
export class AnnonceCardComponent {
  @Input({ required: true }) annonce!: AnnonceListResponse;
  @Output() favoriteToggled = new EventEmitter<{ id: number; isFavori: boolean }>();

  private readonly store = inject(Store);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  get statusClass(): string {
    const map: Record<string, string> = {
      'EN_PAUSE':  'badge-pause',
      'EXPIREE':   'badge-expired',
      'ARCHIVEE':  'badge-archived',
      'SUPPRIMEE': 'badge-deleted',
    };
    return map[this.annonce.statut] ?? '';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      'EN_PAUSE':  'En pause',
      'EXPIREE':   'Expirée',
      'ARCHIVEE':  'Archivée',
      'SUPPRIMEE': 'Supprimée',
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
EOF
OK "AnnonceCard"

# --- STATUS BADGE ---
cat > "$SHARED/components/status-badge/status-badge.component.ts" << 'EOF'
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatutAnnonce, STATUT_ANNONCE_LABELS } from '@core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          [class]="cssClass">
      <span class="w-1.5 h-1.5 rounded-full" [class]="dotClass"></span>
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) statut!: StatutAnnonce;

  get label(): string {
    return STATUT_ANNONCE_LABELS[this.statut] ?? this.statut;
  }
  get cssClass(): string {
    const map: Record<StatutAnnonce, string> = {
      [StatutAnnonce.ACTIVE]:    'bg-emerald-50 text-emerald-700',
      [StatutAnnonce.EN_PAUSE]:  'bg-amber-50 text-amber-700',
      [StatutAnnonce.EXPIREE]:   'bg-red-50 text-red-700',
      [StatutAnnonce.ARCHIVEE]:  'bg-slate-100 text-slate-600',
      [StatutAnnonce.SUPPRIMEE]: 'bg-red-100 text-red-800',
    };
    return map[this.statut] ?? 'bg-slate-100 text-slate-600';
  }
  get dotClass(): string {
    const map: Record<StatutAnnonce, string> = {
      [StatutAnnonce.ACTIVE]:    'bg-emerald-500',
      [StatutAnnonce.EN_PAUSE]:  'bg-amber-500',
      [StatutAnnonce.EXPIREE]:   'bg-red-500',
      [StatutAnnonce.ARCHIVEE]:  'bg-slate-400',
      [StatutAnnonce.SUPPRIMEE]: 'bg-red-700',
    };
    return map[this.statut] ?? 'bg-slate-400';
  }
}
EOF
OK "StatusBadge"

# --- EMPTY STATE ---
cat > "$SHARED/components/empty-state/empty-state.component.ts" << 'EOF'
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div class="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
        @if (icon === 'search') {
          <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        } @else if (icon === 'heart') {
          <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        } @else {
          <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        }
      </div>
      <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ title }}</h3>
      <p class="text-slate-500 text-sm max-w-xs">{{ subtitle }}</p>
      @if (actionLabel) {
        <ng-content></ng-content>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon: 'search' | 'heart' | 'box' = 'box';
  @Input() title = 'Aucun résultat';
  @Input() subtitle = 'Il n\'y a rien à afficher ici pour le moment.';
  @Input() actionLabel?: string;
}
EOF
OK "EmptyState"

# --- LOADING SPINNER ---
cat > "$SHARED/components/loading-spinner/loading-spinner.component.ts" << 'EOF'
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (overlay) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3">
          <div class="spinner"></div>
          @if (message) {
            <p class="text-sm text-slate-500 animate-pulse">{{ message }}</p>
          }
        </div>
      </div>
    } @else {
      <div class="flex items-center justify-center p-8">
        <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      </div>
    }
  `,
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() message?: string;
  @Input() size = 40;
}
EOF
OK "LoadingSpinner"

# --- CONFIRM DIALOG ---
cat > "$SHARED/components/confirm-dialog/confirm-dialog.component.ts" << 'EOF'
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
           (click)="cancel()">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <!-- Dialog -->
        <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 slide-up"
             (click)="$event.stopPropagation()">
          <!-- Icon -->
          <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
               [class]="iconBg">
            <svg class="w-6 h-6" [class]="iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-center font-bold text-slate-800 text-lg mb-2">{{ title }}</h3>
          <p class="text-center text-slate-500 text-sm mb-6">{{ message }}</p>
          <div class="flex gap-3">
            <button
              (click)="cancel()"
              class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600
                     font-medium hover:bg-slate-50 transition-colors active:scale-95">
              Annuler
            </button>
            <button
              (click)="confirm()"
              class="flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
              [class]="confirmBtnClass">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirmer l\'action';
  @Input() message = 'Êtes-vous sûr de vouloir effectuer cette action ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get iconBg(): string { return this.danger ? 'bg-red-100' : 'bg-amber-100'; }
  get iconColor(): string { return this.danger ? 'text-red-600' : 'text-amber-600'; }
  get confirmBtnClass(): string {
    return this.danger
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-900 hover:bg-blue-800';
  }
  confirm(): void { this.confirmed.emit(); }
  cancel(): void  { this.cancelled.emit(); }
}
EOF
OK "ConfirmDialog"

# --- OTP INPUT ---
cat > "$SHARED/components/otp-input/otp-input.component.ts" << 'EOF'
import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex gap-2 justify-center" role="group" [attr.aria-label]="'Code à ' + length + ' chiffres'">
      @for (i of indices; track i) {
        <input
          #otpInput
          type="text"
          inputmode="numeric"
          maxlength="1"
          pattern="[0-9]*"
          [value]="values[i]"
          (input)="onInput($event, i)"
          (keydown)="onKeydown($event, i)"
          (paste)="onPaste($event)"
          (focus)="onFocus($event)"
          class="otp-input"
          [class.filled]="values[i]"
          [attr.aria-label]="'Chiffre ' + (i + 1)"
          autocomplete="one-time-code"
        />
      }
    </div>
    @if (error) {
      <p class="text-center text-red-500 text-sm mt-3 animate-bounce">{{ error }}</p>
    }
  `,
})
export class OtpInputComponent implements OnInit {
  @Input() length = 6;
  @Input() error?: string;
  @Output() completed = new EventEmitter<string>();
  @Output() changed = new EventEmitter<string>();

  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  values: string[] = [];
  indices: number[] = [];

  ngOnInit(): void {
    this.indices = Array.from({ length: this.length }, (_, i) => i);
    this.values = new Array(this.length).fill('');
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.values[index] = val;
    if (val && index < this.length - 1) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
    this.emit();
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.values[index] && index > 0) {
      this.values[index - 1] = '';
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
    if (event.key === 'ArrowRight' && index < this.length - 1) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text').replace(/\D/g, '') ?? '';
    paste.split('').slice(0, this.length).forEach((char, i) => {
      this.values[i] = char;
    });
    const lastIndex = Math.min(paste.length - 1, this.length - 1);
    setTimeout(() => {
      this.inputs.toArray()[lastIndex]?.nativeElement.focus();
    });
    this.emit();
  }

  onFocus(event: Event): void {
    (event.target as HTMLInputElement).select();
  }

  private emit(): void {
    const code = this.values.join('');
    this.changed.emit(code);
    if (code.length === this.length) this.completed.emit(code);
  }

  reset(): void {
    this.values = new Array(this.length).fill('');
    this.inputs.first?.nativeElement.focus();
  }
}
EOF
OK "OtpInput"

# --- INFINITE SCROLL ---
cat > "$SHARED/components/infinite-scroll/infinite-scroll.component.ts" << 'EOF'
import { Component, Output, EventEmitter, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-infinite-scroll',
  standalone: true,
  template: `<div class="scroll-sentinel" aria-hidden="true"></div>`,
})
export class InfiniteScrollComponent implements OnInit, OnDestroy {
  @Input() disabled = false;
  @Output() scrolled = new EventEmitter<void>();

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !this.disabled) {
          this.scrolled.emit();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    this.observer.observe(this.el.nativeElement.querySelector('.scroll-sentinel')!);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
EOF
OK "InfiniteScroll"

# --- IMAGE UPLOAD ---
cat > "$SHARED/components/image-upload/image-upload.component.ts" << 'EOF'
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="dropzone p-6 text-center transition-all"
      [class.dragover]="isDragging"
      (dragover)="onDragOver($event)"
      (dragleave)="isDragging = false"
      (drop)="onDrop($event)"
    >
      <input
        #fileInput type="file" accept="image/jpeg,image/png,image/webp"
        [multiple]="multiple" class="hidden"
        (change)="onFileSelect($event)"
      />
      @if (files.length === 0) {
        <div class="flex flex-col items-center gap-3">
          <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
            <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p class="text-slate-600 font-medium text-sm">
              Glissez vos photos ici
            </p>
            <p class="text-slate-400 text-xs mt-1">ou</p>
          </div>
          <button type="button" (click)="fileInput.click()"
            class="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-xl
                   hover:bg-blue-800 transition-colors active:scale-95">
            Choisir des photos
          </button>
          <p class="text-xs text-slate-400">JPG, PNG, WebP — max {{ maxSizeMb }}Mo par photo — max {{ maxFiles }} photos</p>
        </div>
      } @else {
        <div class="space-y-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            @for (f of files; track f.id; let i = $index) {
              <div class="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img [src]="f.preview" [alt]="'Photo ' + (i+1)"
                     class="w-full h-full object-cover"/>
                @if (i === 0) {
                  <span class="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-900 text-white text-xs rounded-lg">
                    Principale
                  </span>
                }
                <button type="button" (click)="removeFile(f.id)"
                  class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full
                         flex items-center justify-center opacity-0 group-hover:opacity-100
                         transition-opacity text-xs font-bold hover:bg-red-600">
                  ×
                </button>
              </div>
            }
            @if (files.length < maxFiles) {
              <button type="button" (click)="fileInput.click()"
                class="aspect-square rounded-xl border-2 border-dashed border-slate-300
                       flex items-center justify-center text-slate-400 hover:border-blue-400
                       hover:text-blue-400 transition-colors text-2xl">
                +
              </button>
            }
          </div>
          <p class="text-xs text-slate-500">{{ files.length }}/{{ maxFiles }} photos — La première est la photo principale</p>
        </div>
      }
      @for (error of errors; track error) {
        <p class="text-red-500 text-xs mt-2">{{ error }}</p>
      }
    </div>
  `,
})
export class ImageUploadComponent {
  @Input() maxFiles = 4;
  @Input() maxSizeMb = 4;
  @Input() multiple = true;
  @Output() filesChanged = new EventEmitter<File[]>();

  files: UploadedFile[] = [];
  errors: string[] = [];
  isDragging = false;

  onDragOver(e: DragEvent): void {
    e.preventDefault(); this.isDragging = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragging = false;
    const dt = e.dataTransfer?.files;
    if (dt) this.processFiles(Array.from(dt));
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.processFiles(Array.from(input.files));
    input.value = '';
  }

  private processFiles(newFiles: File[]): void {
    this.errors = [];
    for (const file of newFiles) {
      if (this.files.length >= this.maxFiles) {
        this.errors.push(`Maximum ${this.maxFiles} photos autorisées`); break;
      }
      if (file.size > this.maxSizeMb * 1024 * 1024) {
        this.errors.push(`${file.name}: dépasse ${this.maxSizeMb}Mo`); continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.errors.push(`${file.name}: format non supporté`); continue;
      }
      const reader = new FileReader();
      reader.onload = e => {
        this.files.push({ file, preview: e.target?.result as string, id: crypto.randomUUID() });
        this.emit();
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(id: string): void {
    this.files = this.files.filter(f => f.id !== id);
    this.emit();
  }

  private emit(): void {
    this.filesChanged.emit(this.files.map(f => f.file));
  }
}
EOF
OK "ImageUpload"

# --- FILTER BAR ---
cat > "$SHARED/components/filter-bar/filter-bar.component.ts" << 'EOF'
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnonceFilters, LocalisationResponse, TypeBienResponse } from '@core/models';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- Ville -->
        <div class="col-span-2 sm:col-span-1">
          <select [(ngModel)]="filters.ville" (change)="onVilleChange()"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                   focus:ring-blue-100 focus:bg-white transition-all outline-none">
            <option value="">📍 Toutes les villes</option>
            @for (v of villes; track v) {
              <option [value]="v">{{ v }}</option>
            }
          </select>
        </div>
        <!-- Quartier -->
        <div class="col-span-2 sm:col-span-1">
          <select [(ngModel)]="filters.localisationId"
            [disabled]="!filters.ville || loadingQuartiers"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 disabled:opacity-50 focus:border-blue-500
                   focus:ring-2 focus:ring-blue-100 transition-all outline-none">
            <option [value]="undefined">
              {{ loadingQuartiers ? 'Chargement...' : 'Tous les quartiers' }}
            </option>
            @for (q of quartiers; track q.id) {
              <option [value]="q.id">{{ q.quartier }}</option>
            }
          </select>
        </div>
        <!-- Type de bien -->
        <div>
          <select [(ngModel)]="filters.typeBienId"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                   focus:ring-blue-100 transition-all outline-none">
            <option [value]="undefined">🏠 Tous les types</option>
            @for (t of typesBiens; track t.id) {
              <option [value]="t.id">{{ t.nom }}</option>
            }
          </select>
        </div>
        <!-- Prix max -->
        <div>
          <input type="number" [(ngModel)]="filters.prixMax" placeholder="Prix max (FCFA)"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                   focus:ring-blue-100 transition-all outline-none"
            min="0" step="5000"/>
        </div>
      </div>
      <!-- Mot-clé + Boutons -->
      <div class="flex gap-3 mt-3">
        <input type="text" [(ngModel)]="filters.motCle" placeholder="🔍 Mot-clé..."
          class="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50
                 text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                 focus:ring-blue-100 transition-all outline-none"
          (keyup.enter)="search()"/>
        <button (click)="search()"
          class="px-6 h-11 bg-blue-900 text-white text-sm font-semibold rounded-xl
                 hover:bg-blue-800 transition-colors active:scale-95 whitespace-nowrap">
          Rechercher
        </button>
        @if (hasActiveFilters) {
          <button (click)="reset()"
            class="px-4 h-11 border border-slate-200 text-slate-500 text-sm rounded-xl
                   hover:bg-slate-50 transition-colors">
            ✕
          </button>
        }
      </div>
    </div>
  `,
})
export class FilterBarComponent implements OnInit {
  @Input() initialFilters: AnnonceFilters = {};
  @Output() filtersChanged = new EventEmitter<AnnonceFilters>();
  @Output() filtersReset   = new EventEmitter<void>();

  private readonly locApi     = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);

  filters: AnnonceFilters = {};
  villes: string[] = [];
  quartiers: LocalisationResponse[] = [];
  typesBiens: TypeBienResponse[] = [];
  loadingQuartiers = false;

  ngOnInit(): void {
    this.filters = { ...this.initialFilters };
    this.locApi.getVilles().subscribe(r => this.villes = r.data);
    this.typeBienApi.getAll().subscribe(r => this.typesBiens = r.data);
  }

  onVilleChange(): void {
    this.filters.localisationId = undefined;
    this.quartiers = [];
    if (!this.filters.ville) return;
    this.loadingQuartiers = true;
    this.locApi.getQuartiers(this.filters.ville).subscribe(r => {
      this.quartiers = r.data;
      this.loadingQuartiers = false;
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.ville || this.filters.typeBienId ||
              this.filters.prixMax || this.filters.motCle);
  }

  search(): void { this.filtersChanged.emit({ ...this.filters, page: 0 }); }
  reset(): void {
    this.filters = {};
    this.quartiers = [];
    this.filtersReset.emit();
  }
}
EOF
OK "FilterBar"

# --- PRICE DISPLAY ---
cat > "$SHARED/components/price-display/price-display.component.ts" << 'EOF'
import { Component, Input } from '@angular/core';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [FcfaPipe],
  template: `
    <span [class]="sizeClass + ' font-bold text-blue-900'">
      {{ prix | fcfa }}
    </span>
  `,
})
export class PriceDisplayComponent {
  @Input({ required: true }) prix!: number;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get sizeClass(): string {
    return { sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-2xl' }[this.size];
  }
}
EOF
OK "PriceDisplay"

# --- BACK BUTTON ---
cat > "$SHARED/components/back-button/back-button.component.ts" << 'EOF'
import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button (click)="go()"
      class="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-900
             hover:bg-blue-50 rounded-xl transition-all text-sm font-medium active:scale-95">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Retour
    </button>
  `,
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  go(): void { this.location.back(); }
}
EOF
OK "BackButton"

# --- PAGE HEADER ---
cat > "$SHARED/components/page-header/page-header.component.ts" << 'EOF'
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">{{ title }}</h1>
      @if (subtitle) {
        <p class="text-slate-500 text-sm mt-1">{{ subtitle }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
EOF
OK "PageHeader"

# Shared components index
cat > "$SHARED/components/index.ts" << 'EOF'
export * from './annonce-card/annonce-card.component';
export * from './annonce-card-skeleton/annonce-card-skeleton.component';
export * from './status-badge/status-badge.component';
export * from './empty-state/empty-state.component';
export * from './loading-spinner/loading-spinner.component';
export * from './confirm-dialog/confirm-dialog.component';
export * from './otp-input/otp-input.component';
export * from './infinite-scroll/infinite-scroll.component';
export * from './image-upload/image-upload.component';
export * from './filter-bar/filter-bar.component';
export * from './price-display/price-display.component';
export * from './back-button/back-button.component';
export * from './page-header/page-header.component';
EOF

# =============================================================================
# 4. PHONE INPUT
# =============================================================================
cat > "$SHARED/components/phone-input/phone-input.component.ts" << 'EOF'
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PhoneInputComponent),
    multi: true,
  }],
  template: `
    <div class="relative flex items-center">
      <span class="absolute left-3 flex items-center gap-1.5 text-sm font-medium text-slate-500 select-none">
        🇨🇲 +237
      </span>
      <input
        type="tel"
        inputmode="numeric"
        [placeholder]="placeholder"
        [value]="displayValue"
        [disabled]="isDisabled"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="w-full h-12 pl-24 pr-4 rounded-xl border border-slate-200 bg-slate-50
               text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100
               focus:bg-white transition-all outline-none disabled:opacity-50"
      />
    </div>
  `,
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() placeholder = '6 XX XX XX XX';

  displayValue = '';
  isDisabled = false;
  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 9);
    this.displayValue = val;
    this.onChange(`+237${val}`);
  }

  writeValue(val: string): void {
    this.displayValue = (val ?? '').replace(/^\+?237/, '');
  }
  registerOnChange(fn: any): void   { this.onChange = fn; }
  registerOnTouched(fn: any): void  { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }
}
EOF
OK "PhoneInput"

# =============================================================================
# 5. LAYOUTS
# =============================================================================
SECTION "4/5 — Layouts"

# --- HEADER ---
mkdir -p "$LAYOUT/main-layout/header"
cat > "$LAYOUT/main-layout/header/header.component.ts" << 'EOF'
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn, selectCurrentUser, selectIsAdmin } from '@store/auth/auth.selectors';
import { authActions } from '@store/auth/auth.actions';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-2 shrink-0">
          <div class="w-8 h-8 bg-blue-900 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-sm">IC</span>
          </div>
          <span class="font-bold text-blue-900 text-lg hidden sm:block">ImmoCam</span>
        </a>

        <!-- Search bar (desktop) -->
        <div class="hidden md:flex flex-1 max-w-sm">
          <input type="text" placeholder="Rechercher..."
            class="w-full h-9 px-4 rounded-xl bg-slate-100 text-sm text-slate-700
                   border border-transparent focus:border-blue-300 focus:bg-white
                   transition-all outline-none"
            (keyup.enter)="onSearch($event)"
          />
        </div>

        <!-- Nav -->
        <nav class="flex items-center gap-2">
          @if (!isLoggedIn()) {
            <a routerLink="/auth/login"
               class="px-4 py-2 text-sm text-slate-600 hover:text-blue-900 font-medium rounded-xl
                      hover:bg-slate-50 transition-all">
              Connexion
            </a>
            <a routerLink="/annonces/creer"
               class="px-4 py-2 text-sm font-semibold bg-blue-900 text-white rounded-xl
                      hover:bg-blue-800 transition-all active:scale-95 whitespace-nowrap">
              + Publier
            </a>
          } @else {
            <!-- Publier -->
            <a routerLink="/annonces/creer"
               class="hidden sm:flex px-4 py-2 text-sm font-semibold bg-blue-900 text-white rounded-xl
                      hover:bg-blue-800 transition-all active:scale-95">
              + Publier
            </a>
            <!-- Admin link -->
            @if (isAdmin()) {
              <a routerLink="/admin"
                 class="hidden sm:flex px-3 py-2 text-sm text-slate-600 hover:text-blue-900
                        hover:bg-slate-50 rounded-xl transition-all">
                Admin
              </a>
            }
            <!-- Avatar -->
            <div class="relative group">
              <button class="w-9 h-9 bg-blue-900 text-white rounded-full flex items-center
                             justify-center font-semibold text-sm hover:bg-blue-800 transition-colors">
                {{ userInitial }}
              </button>
              <!-- Dropdown -->
              <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl
                          border border-slate-100 py-2 opacity-0 invisible
                          group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div class="px-4 py-2 border-b border-slate-100">
                  <p class="text-xs font-semibold text-slate-800">{{ userName }}</p>
                </div>
                <a routerLink="/dashboard" class="flex items-center gap-3 px-4 py-2.5 text-sm
                   text-slate-600 hover:bg-slate-50 hover:text-blue-900 transition-colors">
                  Mon espace
                </a>
                <a routerLink="/dashboard/profil" class="flex items-center gap-3 px-4 py-2.5 text-sm
                   text-slate-600 hover:bg-slate-50 hover:text-blue-900 transition-colors">
                  Mon profil
                </a>
                <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                   text-red-600 hover:bg-red-50 transition-colors">
                  Déconnexion
                </button>
              </div>
            </div>
          }
        </nav>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  private readonly store = inject(Store);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly isAdmin    = this.store.selectSignal(selectIsAdmin);
  readonly user       = this.store.selectSignal(selectCurrentUser);

  get userInitial(): string { return this.user()?.prenom?.[0]?.toUpperCase() ?? 'U'; }
  get userName(): string    { return this.user()?.nomComplet ?? ''; }

  logout(): void { this.store.dispatch(authActions.logout()); }
  onSearch(e: Event): void {
    const val = (e.target as HTMLInputElement).value.trim();
    if (val) window.location.href = `/annonces?motCle=${encodeURIComponent(val)}`;
  }
}
EOF
OK "HeaderComponent"

# --- FOOTER ---
mkdir -p "$LAYOUT/main-layout/footer"
cat > "$LAYOUT/main-layout/footer/footer.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-blue-950 text-blue-200 mt-16">
      <div class="max-w-6xl mx-auto px-4 py-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <!-- Brand -->
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                <span class="text-blue-900 font-bold text-sm">IC</span>
              </div>
              <span class="text-white font-bold text-lg">ImmoCam</span>
            </div>
            <p class="text-sm text-blue-300 leading-relaxed">
              La plateforme immobilière camerounaise par MBEMNOVA.
            </p>
          </div>
          <!-- Navigation -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Navigation</h4>
            <nav class="space-y-2">
              <a routerLink="/" class="block text-sm hover:text-white transition-colors">Accueil</a>
              <a routerLink="/annonces" class="block text-sm hover:text-white transition-colors">Annonces</a>
              <a routerLink="/annonces/creer" class="block text-sm hover:text-white transition-colors">Publier</a>
            </nav>
          </div>
          <!-- Légal -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Légal</h4>
            <nav class="space-y-2">
              <a routerLink="/politique-confidentialite" class="block text-sm hover:text-white transition-colors">Politique de confidentialité</a>
              <a routerLink="/conditions-utilisation" class="block text-sm hover:text-white transition-colors">Conditions d'utilisation</a>
              <a routerLink="/mentions-legales" class="block text-sm hover:text-white transition-colors">Mentions légales</a>
            </nav>
          </div>
          <!-- Contact -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Contact</h4>
            <nav class="space-y-2">
              <a routerLink="/contact" class="block text-sm hover:text-white transition-colors">Nous contacter</a>
              <a href="https://mbemnova.com" target="_blank" class="block text-sm hover:text-white transition-colors">mbemnova.com</a>
            </nav>
          </div>
        </div>
        <!-- Bottom -->
        <div class="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-xs text-blue-400">© 2026 ImmoCam — Développé par MBEMNOVA. Tous droits réservés.</p>
          <p class="text-xs text-blue-400">Les annonces sont publiées directement par les propriétaires.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
EOF
OK "FooterComponent"

# --- MAIN LAYOUT ---
cat > "$LAYOUT/main-layout/main-layout.component.ts" << 'EOF'
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { selectLoading } from '@store/ui/ui.selectors';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <app-header/>
      @if (loading()) {
        <app-loading-spinner [overlay]="true"/>
      }
      <main class="flex-1 w-full">
        <router-outlet/>
      </main>
      <app-footer/>
    </div>
  `,
})
export class MainLayoutComponent {
  private readonly store = inject(Store);
  readonly loading = this.store.selectSignal(selectLoading);
}
EOF
OK "MainLayout"

# --- AUTH LAYOUT ---
mkdir -p "$LAYOUT/auth-layout"
cat > "$LAYOUT/auth-layout/auth-layout.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen hero-gradient flex flex-col">
      <!-- Header minimal -->
      <div class="px-4 pt-6 pb-2">
        <a routerLink="/" class="inline-flex items-center gap-2">
          <div class="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-sm">IC</span>
          </div>
          <span class="text-white font-bold text-lg">ImmoCam</span>
        </a>
      </div>
      <!-- Content -->
      <div class="flex-1 flex items-center justify-center p-4 pb-8">
        <div class="w-full max-w-md">
          <router-outlet/>
        </div>
      </div>
      <!-- Footer minimal -->
      <div class="text-center text-blue-200 text-xs pb-6 px-4">
        <a routerLink="/politique-confidentialite" class="hover:text-white transition-colors">Politique de confidentialité</a>
        <span class="mx-2">·</span>
        <a routerLink="/conditions-utilisation" class="hover:text-white transition-colors">Conditions d'utilisation</a>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
EOF
OK "AuthLayout"

# --- ADMIN LAYOUT ---
mkdir -p "$LAYOUT/admin-layout/sidebar"
cat > "$LAYOUT/admin-layout/sidebar/sidebar.component.ts" << 'EOF'
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';

interface NavItem {
  label: string; icon: string; route: string; badge?: number;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-blue-950 text-blue-200 min-h-screen flex flex-col fixed left-0 top-0 z-30">
      <!-- Logo -->
      <div class="px-6 py-5 border-b border-blue-900">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
            <span class="text-blue-900 font-bold text-xs">IC</span>
          </div>
          <div>
            <p class="text-white font-bold text-sm">ImmoCam</p>
            <p class="text-blue-400 text-xs">Administration</p>
          </div>
        </div>
      </div>
      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route" routerLinkActive="bg-blue-800 text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    hover:bg-blue-900 hover:text-white transition-all">
            <span class="text-lg leading-none">{{ item.icon }}</span>
            <span class="flex-1">{{ item.label }}</span>
            @if (item.badge) {
              <span class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {{ item.badge }}
              </span>
            }
          </a>
        }
      </nav>
      <!-- Bottom -->
      <div class="px-3 py-4 border-t border-blue-900 space-y-1">
        <a routerLink="/" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                                  hover:bg-blue-900 hover:text-white transition-all">
          🌐 Voir le site
        </a>
        <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
               text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all">
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly store = inject(Store);

  navItems: NavItem[] = [
    { label: 'Dashboard',      icon: '📊', route: '/admin/dashboard' },
    { label: 'Annonces',       icon: '🏠', route: '/admin/annonces' },
    { label: 'Utilisateurs',   icon: '👥', route: '/admin/utilisateurs' },
    { label: 'Signalements',   icon: '🚨', route: '/admin/signalements', badge: 3 },
    { label: 'Commentaires',   icon: '💬', route: '/admin/commentaires' },
    { label: 'Configuration',  icon: '⚙️', route: '/admin/config' },
  ];

  logout(): void { this.store.dispatch(authActions.logout()); }
}
EOF

cat > "$LAYOUT/admin-layout/admin-layout.component.ts" << 'EOF'
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-100">
      <app-admin-sidebar/>
      <main class="flex-1 ml-64 p-6 overflow-auto">
        <router-outlet/>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {}
EOF
OK "AdminLayout"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 04 TERMINÉ — COMPOSANTS PARTAGÉS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Pipes: FCFA, TimeAgo, PhoneMask, Truncate"
INFO "Directives: LazyImg, ClickStop"
INFO "Composants: 13 composants partagés"
INFO "Layouts: Main, Auth, Admin"
echo ""
WARN "Prochaine étape: bash ../ng-05-public-features.sh"
