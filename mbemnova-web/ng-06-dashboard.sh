#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 06 : DASHBOARD PROPRIÉTAIRE
# =============================================================================
# Rôle     : Dashboard complet du propriétaire :
#            - Overview: stats perso + annonces récentes
#            - Mes Annonces: tableau complet avec toutes les actions
#            - Mes Favoris: liste avec statuts
#            - Mes Contacts WhatsApp reçus
#            - Profil: modification + suppression compte
#            - Annonce Create/Edit: formulaire multi-étapes + drag&drop
#
# Exécuter : bash ../ng-06-dashboard.sh
# =============================================================================
set -euo pipefail
GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || { echo "Lancez depuis la racine Angular"; exit 1; }
SECTION "SCRIPT 06 — DASHBOARD PROPRIÉTAIRE"

DASH="src/app/features/dashboard"

# =============================================================================
# DASHBOARD LAYOUT WRAPPER
# =============================================================================
cat > "$DASH/dashboard-shell.component.ts" << 'EOF'
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <!-- Header dashboard -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-slate-800">
            Bonjour, {{ user()?.prenom }} 👋
          </h1>
          <p class="text-slate-500 text-sm">Gérez vos annonces et votre profil</p>
        </div>
        <a routerLink="/annonces/creer"
           class="flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white
                  font-semibold text-sm rounded-xl hover:bg-blue-800 transition-all active:scale-95">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Publier
        </a>
      </div>

      <!-- Navigation onglets -->
      <nav class="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        @for (tab of tabs; track tab.route) {
          <a [routerLink]="tab.route" routerLinkActive="bg-white text-blue-900 shadow-sm font-semibold"
             class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-slate-600
                    whitespace-nowrap transition-all hover:text-blue-900 flex-1 justify-center">
            <span>{{ tab.icon }}</span>
            <span class="hidden sm:inline">{{ tab.label }}</span>
          </a>
        }
      </nav>

      <router-outlet/>
    </div>
  `,
})
export class DashboardShellComponent {
  private readonly store = inject(Store);
  readonly user = this.store.selectSignal(selectCurrentUser);

  tabs = [
    { label: 'Aperçu',    icon: '📊', route: '/dashboard/overview' },
    { label: 'Annonces',  icon: '🏠', route: '/dashboard/mes-annonces' },
    { label: 'Favoris',   icon: '❤️', route: '/dashboard/mes-favoris' },
    { label: 'Contacts',  icon: '💬', route: '/dashboard/mes-contacts' },
    { label: 'Profil',    icon: '👤', route: '/dashboard/profil' },
  ];
}
EOF
OK "DashboardShell"

# =============================================================================
# OVERVIEW
# =============================================================================
cat > "$DASH/overview/overview.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { DashboardStatsResponse, AnnonceListResponse, StatutAnnonce } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, FcfaPipe, TimeAgoPipe, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner/>
    } @else {
      <!-- Cartes stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p class="text-3xl font-bold text-blue-900">{{ stat.value }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ stat.label }}</p>
          </div>
        }
      </div>

      <!-- Annonces expirant bientôt -->
      @if (expiringAnnonces().length > 0) {
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <h3 class="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            ⏰ Annonces expirant bientôt
          </h3>
          <div class="space-y-2">
            @for (a of expiringAnnonces(); track a.id) {
              <div class="flex items-center justify-between bg-white rounded-xl p-3">
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ a.typeBien }} — {{ a.quartier }}</p>
                  <p class="text-xs text-amber-600">Expire le {{ formatDate(a.dateExpiration) }}</p>
                </div>
                <button class="px-3 py-1.5 bg-blue-900 text-white text-xs font-semibold
                               rounded-lg hover:bg-blue-800 transition-all">
                  Renouveler
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Annonces récentes -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">Mes annonces récentes</h3>
          <a routerLink="/dashboard/mes-annonces"
             class="text-sm text-blue-700 hover:text-blue-900 font-medium">
            Voir tout →
          </a>
        </div>
        @if (recentAnnonces().length === 0) {
          <div class="text-center py-10">
            <p class="text-slate-400 text-sm mb-4">Vous n'avez pas encore d'annonce</p>
            <a routerLink="/annonces/creer"
               class="px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl
                      hover:bg-blue-800 transition-all text-sm">
              Publier ma première annonce
            </a>
          </div>
        } @else {
          <div class="divide-y divide-slate-50">
            @for (a of recentAnnonces(); track a.id) {
              <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img [src]="a.photoPrincipaleThumb || '/assets/images/no-photo.svg'"
                       [alt]="a.typeBien" class="w-full h-full object-cover"/>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-800 text-sm truncate">
                    {{ a.typeBien }} — {{ a.quartier }}, {{ a.ville }}
                  </p>
                  <div class="flex items-center gap-3 mt-0.5">
                    <span class="text-sm font-bold text-blue-900">{{ a.prix | fcfa }}</span>
                    <app-status-badge [statut]="a.statut"/>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs text-slate-400">{{ a.nombreVues }} vues</p>
                  <p class="text-xs text-slate-400">{{ a.datePublication | timeAgo }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class DashboardOverviewComponent implements OnInit {
  private readonly annonceApi = inject(AnnonceApi);

  loading         = signal(true);
  dashStats       = signal<DashboardStatsResponse | null>(null);
  recentAnnonces  = signal<AnnonceListResponse[]>([]);
  expiringAnnonces = signal<AnnonceListResponse[]>([]);

  stats = () => {
    const d = this.dashStats();
    return [
      { label: 'Annonces actives', value: d?.nombreAnnoncesActives ?? 0 },
      { label: 'Vues totales',     value: d?.nombreVuesTotal ?? 0 },
      { label: 'Contacts reçus',   value: d?.nombreContactsTotal ?? 0 },
      { label: 'Favoris',          value: d?.nombreFavorisTotal ?? 0 },
    ];
  };

  ngOnInit(): void {
    this.annonceApi.getDashboardStats().subscribe({
      next: res => {
        this.dashStats.set(res.data);
        this.expiringAnnonces.set(res.data.annoncesExpirantBientot ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.annonceApi.getMesAnnonces({ page: 0, size: 5 }).subscribe({
      next: res => this.recentAnnonces.set(res.data.content),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short' });
  }
}
EOF
OK "Overview"

# =============================================================================
# MES ANNONCES
# =============================================================================
cat > "$DASH/mes-annonces/mes-annonces.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { selectMesAnnonces, selectActionLoading } from '@store/annonce/annonce.selectors';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AnnonceListResponse, StatutAnnonce } from '@core/models';

@Component({
  selector: 'app-mes-annonces',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    StatusBadgeComponent, ConfirmDialogComponent, EmptyStateComponent,
    FcfaPipe, TimeAgoPipe,
  ],
  template: `
    <div>
      <!-- Confirm dialog -->
      <app-confirm-dialog
        [open]="confirmOpen()"
        [title]="confirmTitle()"
        [message]="confirmMessage()"
        [confirmLabel]="confirmLabel()"
        [danger]="confirmDanger()"
        (confirmed)="executeAction()"
        (cancelled)="confirmOpen.set(false)"
      />

      @if (mesAnnonces().length === 0) {
        <app-empty-state
          icon="box" title="Aucune annonce publiée"
          subtitle="Publiez votre première annonce gratuitement en quelques minutes.">
          <a routerLink="/annonces/creer"
             class="mt-4 inline-block px-6 py-3 bg-blue-900 text-white font-semibold
                    rounded-xl hover:bg-blue-800 transition-all">
            + Publier une annonce
          </a>
        </app-empty-state>
      } @else {
        <!-- Mobile: cartes -->
        <div class="sm:hidden space-y-3">
          @for (a of mesAnnonces(); track a.id) {
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div class="flex gap-3 mb-3">
                <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img [src]="a.photoPrincipaleThumb || '/assets/images/no-photo.svg'"
                       class="w-full h-full object-cover"/>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-800 text-sm">{{ a.typeBien }}</p>
                  <p class="text-xs text-slate-500">{{ a.quartier }}, {{ a.ville }}</p>
                  <p class="text-sm font-bold text-blue-900 mt-1">{{ a.prix | fcfa }}</p>
                </div>
                <app-status-badge [statut]="a.statut"/>
              </div>
              <div class="flex gap-2 flex-wrap">
                @for (action of getActions(a); track action.label) {
                  <button (click)="action.fn()"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
                    [class]="action.danger
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'">
                    {{ action.label }}
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Desktop: tableau -->
        <div class="hidden sm:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">Annonce</th>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">Prix</th>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">Statut</th>
                <th class="text-right text-xs font-semibold text-slate-500 px-4 py-3">Stats</th>
                <th class="text-right text-xs font-semibold text-slate-500 px-4 py-3">Expire</th>
                <th class="text-right text-xs font-semibold text-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (a of mesAnnonces(); track a.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img [src]="a.photoPrincipaleThumb || '/assets/images/no-photo.svg'"
                             class="w-full h-full object-cover"/>
                      </div>
                      <div>
                        <p class="font-medium text-slate-800 text-sm">{{ a.typeBien }}</p>
                        <p class="text-xs text-slate-500">{{ a.quartier }}, {{ a.ville }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-bold text-blue-900 text-sm">{{ a.prix | fcfa }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <app-status-badge [statut]="a.statut"/>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="text-xs text-slate-500 space-y-0.5">
                      <p>👁 {{ a.nombreVues }}</p>
                      <p>💬 {{ a.nombreCommentaires }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <p class="text-xs text-slate-500">{{ a.dateExpiration | timeAgo }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1 flex-wrap">
                      @for (action of getActions(a); track action.label) {
                        <button (click)="action.fn()"
                          class="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all"
                          [class]="action.danger
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'">
                          {{ action.label }}
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class MesAnnoncesComponent implements OnInit {
  private readonly store = inject(Store);
  readonly mesAnnonces   = this.store.selectSignal(selectMesAnnonces);
  readonly actionLoading = this.store.selectSignal(selectActionLoading);

  confirmOpen    = signal(false);
  confirmTitle   = signal('');
  confirmMessage = signal('');
  confirmLabel   = signal('Confirmer');
  confirmDanger  = signal(false);
  private pendingAction?: () => void;

  ngOnInit(): void {
    this.store.dispatch(annonceActions.loadMesAnnonces({}));
  }

  getActions(a: AnnonceListResponse): Array<{ label: string; fn: () => void; danger?: boolean }> {
    const actions: any[] = [];
    const s = a.statut;
    if (s !== 'SUPPRIMEE' && s !== 'ARCHIVEE') {
      actions.push({ label: 'Modifier', fn: () => {} });
    }
    if (s === 'ACTIVE') {
      actions.push({ label: 'Pause', fn: () => this.confirm('Mettre en pause ?', '', () =>
        this.store.dispatch(annonceActions.pause({ id: a.id }))) });
      actions.push({ label: 'Renouveler', fn: () => this.store.dispatch(annonceActions.renouveler({ id: a.id })) });
    }
    if (s === 'EN_PAUSE') {
      actions.push({ label: 'Réactiver', fn: () => this.store.dispatch(annonceActions.reactiver({ id: a.id })) });
    }
    if (s === 'EXPIREE' || s === 'ACTIVE') {
      actions.push({ label: 'Archiver', fn: () => this.confirm('Archiver ?', 'Cette annonce ne sera plus visible.', () =>
        this.store.dispatch(annonceActions.archiver({ id: a.id }))) });
    }
    actions.push({
      label: 'Supprimer', danger: true,
      fn: () => this.confirm('Supprimer définitivement ?',
        'Cette action est irréversible.',
        () => this.store.dispatch(annonceActions.supprimer({ id: a.id })),
        true)
    });
    return actions;
  }

  confirm(title: string, message: string, fn: () => void, danger = false): void {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.confirmDanger.set(danger);
    this.confirmLabel.set(danger ? 'Supprimer' : 'Confirmer');
    this.pendingAction = fn;
    this.confirmOpen.set(true);
  }

  executeAction(): void {
    this.confirmOpen.set(false);
    this.pendingAction?.();
    this.pendingAction = undefined;
  }
}
EOF
OK "MesAnnonces"

# =============================================================================
# MES FAVORIS
# =============================================================================
cat > "$DASH/mes-favoris/mes-favoris.component.ts" << 'EOF'
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { favoriActions } from '@store/favori/favori.actions';
import { selectFavoris, selectFavoriLoading } from '@store/favori/favori.selectors';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-mes-favoris',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, FcfaPipe, TimeAgoPipe, LoadingSpinnerComponent],
  template: `
    @if (loading()) { <app-loading-spinner/> }
    @else if (favoris().length === 0) {
      <app-empty-state icon="heart" title="Aucun favori"
        subtitle="Ajoutez des annonces à vos favoris pour les retrouver facilement.">
        <a routerLink="/" class="mt-4 inline-block px-6 py-3 bg-blue-900 text-white
                                  font-semibold rounded-xl hover:bg-blue-800 transition-all">
          Explorer les annonces
        </a>
      </app-empty-state>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (f of favoris(); track f.id) {
          <div class="bg-white rounded-2xl border shadow-sm overflow-hidden"
               [class]="f.statut !== 'ACTIVE' ? 'opacity-70' : ''">
            <div class="relative h-36 bg-slate-100">
              <img [src]="f.photoPrincipaleThumb || '/assets/images/no-photo.svg'"
                   class="w-full h-full object-cover"/>
              @if (f.statut !== 'ACTIVE') {
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span class="bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
                    {{ statusLabel(f.statut) }}
                  </span>
                </div>
              }
            </div>
            <div class="p-4">
              <p class="font-semibold text-slate-800 text-sm">{{ f.typeBien }}</p>
              <p class="text-xs text-slate-500">{{ f.quartier }}, {{ f.ville }}</p>
              <p class="font-bold text-blue-900 mt-2">{{ f.prix | fcfa }}</p>
              <div class="flex gap-2 mt-3">
                @if (f.statut === 'ACTIVE') {
                  <a [routerLink]="['/annonces', f.annonceId]"
                     class="flex-1 py-2 text-center text-sm bg-blue-900 text-white rounded-xl
                            hover:bg-blue-800 transition-all font-medium">
                    Voir
                  </a>
                }
                <button (click)="retirer(f.annonceId)"
                  class="flex-1 py-2 text-center text-sm border border-red-200 text-red-600
                         rounded-xl hover:bg-red-50 transition-all font-medium">
                  Retirer
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class MesFavorisComponent implements OnInit {
  private readonly store = inject(Store);
  readonly favoris = this.store.selectSignal(selectFavoris);
  readonly loading = this.store.selectSignal(selectFavoriLoading);

  ngOnInit(): void { this.store.dispatch(favoriActions.load()); }
  retirer(id: number): void { this.store.dispatch(favoriActions.remove({ annonceId: id })); }
  statusLabel(s: string): string {
    const m: Record<string, string> = { 'EN_PAUSE': 'Temporairement indisponible', 'EXPIREE': 'Expirée', 'SUPPRIMEE': 'Plus disponible' };
    return m[s] ?? s;
  }
}
EOF
OK "MesFavoris"

# =============================================================================
# MES CONTACTS
# =============================================================================
cat > "$DASH/mes-contacts/mes-contacts.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactApi } from '@core/services/api/contact.api';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { PhoneMaskPipe } from '@shared/pipes/phone-mask.pipe';
import { ContactResponse } from '@core/models';

@Component({
  selector: 'app-mes-contacts',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, TimeAgoPipe, PhoneMaskPipe],
  template: `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="font-semibold text-slate-800">Contacts WhatsApp reçus</h2>
        <p class="text-xs text-slate-500 mt-0.5">Utilisateurs ayant cliqué sur votre bouton de contact</p>
      </div>
      @if (contacts().length === 0) {
        <app-empty-state icon="box" title="Aucun contact reçu"
          subtitle="Les personnes qui vous contactent via WhatsApp apparaîtront ici."/>
      } @else {
        <div class="divide-y divide-slate-50">
          @for (c of contacts(); track c.id) {
            <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <span class="text-lg">💬</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-800 text-sm">{{ c.utilisateurPrenom }}</p>
                <p class="text-xs text-slate-500">{{ c.utilisateurTelephone | phoneMask }}</p>
                <p class="text-xs text-slate-400 mt-0.5">Annonce: {{ c.annonceTitre }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs text-slate-400">{{ c.dateContact | timeAgo }}</p>
                <a [href]="'https://wa.me/' + c.utilisateurTelephone.replace('+', '')"
                   target="_blank" class="text-xs text-green-600 font-medium hover:text-green-700">
                  Répondre
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MesContactsComponent implements OnInit {
  private readonly contactApi = inject(ContactApi);
  contacts = signal<ContactResponse[]>([]);

  ngOnInit(): void {
    this.contactApi.getMesContacts().subscribe({
      next: res => this.contacts.set(res.data.content),
    });
  }
}
EOF
OK "MesContacts"

# =============================================================================
# PROFIL
# =============================================================================
cat > "$DASH/profil/profil.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { authActions } from '@store/auth/auth.actions';
import { UtilisateurApi } from '@core/services/api/utilisateur.api';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <app-confirm-dialog
      [open]="confirmDelete()"
      title="Supprimer votre compte ?"
      message="Cette action est irréversible. Toutes vos annonces seront désactivées et vos données anonymisées sous 30 jours."
      confirmLabel="Supprimer mon compte"
      [danger]="true"
      (confirmed)="deleteAccount()"
      (cancelled)="confirmDelete.set(false)"
    />

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Modifier profil -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 class="font-bold text-slate-800 mb-5">Mes informations</h2>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Prénom</label>
              <input formControlName="prenom" type="text"
                class="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nom</label>
              <input formControlName="nom" type="text"
                class="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
            <input formControlName="telephone" type="tel"
              class="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
            <input [value]="user()?.email" type="email" disabled
              class="w-full h-11 px-4 rounded-xl border border-slate-100 text-sm
                     text-slate-400 bg-slate-50"/>
          </div>
          <button type="submit" [disabled]="profileForm.invalid || saving()"
            class="w-full py-3 bg-blue-900 text-white font-semibold rounded-xl
                   hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-98">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </button>
        </form>
      </div>

      <!-- Sécurité + Danger zone -->
      <div class="space-y-6">
        <!-- Changer mot de passe -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 class="font-bold text-slate-800 mb-5">Changer le mot de passe</h2>
          <form [formGroup]="pwdForm" (ngSubmit)="changePwd()" class="space-y-3">
            <input formControlName="ancienMotDePasse" type="password" placeholder="Mot de passe actuel"
              class="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
            <input formControlName="nouveauMotDePasse" type="password" placeholder="Nouveau mot de passe"
              class="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
            <input formControlName="confirmationMotDePasse" type="password" placeholder="Confirmer"
              class="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
            <button type="submit" [disabled]="pwdForm.invalid || changingPwd()"
              class="w-full py-3 bg-slate-800 text-white font-semibold rounded-xl
                     hover:bg-slate-700 disabled:opacity-50 transition-all">
              Modifier le mot de passe
            </button>
          </form>
        </div>

        <!-- Danger zone -->
        <div class="bg-red-50 rounded-2xl border border-red-100 p-6">
          <h2 class="font-bold text-red-800 mb-2">Zone dangereuse</h2>
          <p class="text-sm text-red-600 mb-4">La suppression de votre compte est irréversible.</p>
          <button (click)="confirmDelete.set(true)"
            class="w-full py-3 border border-red-300 text-red-700 font-semibold rounded-xl
                   hover:bg-red-100 transition-all text-sm">
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProfilComponent implements OnInit {
  private readonly store  = inject(Store);
  private readonly api    = inject(UtilisateurApi);
  private readonly toast  = inject(ToastService);
  private readonly fb     = inject(FormBuilder);

  readonly user      = this.store.selectSignal(selectCurrentUser);
  saving      = signal(false);
  changingPwd = signal(false);
  confirmDelete = signal(false);

  profileForm = this.fb.group({
    prenom:    ['', [Validators.required, Validators.minLength(2)]],
    nom:       ['', [Validators.required, Validators.minLength(2)]],
    telephone: ['', Validators.required],
  });

  pwdForm = this.fb.group({
    ancienMotDePasse:      ['', Validators.required],
    nouveauMotDePasse:     ['', [Validators.required, Validators.minLength(8)]],
    confirmationMotDePasse:['', Validators.required],
  });

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.profileForm.patchValue({ prenom: u.prenom, nom: u.nom, telephone: u.telephone });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    this.api.modifierProfil(this.profileForm.getRawValue() as any).subscribe({
      next: res => {
        this.saving.set(false);
        this.store.dispatch(authActions.updateUser({ user: res.data }));
        this.toast.success('Profil mis à jour !');
      },
      error: () => this.saving.set(false),
    });
  }

  changePwd(): void {
    if (this.pwdForm.invalid) return;
    this.changingPwd.set(true);
    this.api.modifierMotDePasse(this.pwdForm.getRawValue() as any).subscribe({
      next: () => { this.changingPwd.set(false); this.toast.success('Mot de passe modifié !'); this.pwdForm.reset(); },
      error: () => this.changingPwd.set(false),
    });
  }

  deleteAccount(): void {
    this.api.supprimerCompte().subscribe({
      next: () => {
        this.toast.info('Compte supprimé. À bientôt !');
        this.store.dispatch(authActions.logout());
      },
    });
  }
}
EOF
OK "Profil"

# =============================================================================
# ANNONCE CREATE (formulaire complet multi-étapes)
# =============================================================================
cat > "src/app/features/annonce/create/annonce-create.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { PhotoApi } from '@core/services/api/photo.api';
import { StorageService } from '@core/services/storage.service';
import { ToastService } from '@core/services/toast.service';
import { ImageUploadComponent } from '@shared/components/image-upload/image-upload.component';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { LocalisationResponse, TypeBienResponse } from '@core/models';
import { selectCurrentUser } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-annonce-create',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ImageUploadComponent, BackButtonComponent, FcfaPipe],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-6">
      <app-back-button/>
      <div class="mt-4 mb-6">
        <h1 class="text-2xl font-bold text-slate-800">Publier une annonce</h1>
        <p class="text-slate-500 text-sm mt-1">Votre annonce sera en ligne immédiatement.</p>
        @if (hasDraft()) {
          <div class="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <p class="text-amber-800 text-sm font-medium">💾 Brouillon récupéré</p>
            <button (click)="clearDraft()" class="text-xs text-amber-600 hover:text-amber-800">Effacer</button>
          </div>
        }
      </div>

      <!-- Étapes -->
      <div class="flex items-center gap-2 mb-8">
        @for (step of steps; track step.n; let i = $index) {
          <div class="flex items-center gap-2 flex-1">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                 [class]="currentStep() >= step.n
                   ? 'bg-blue-900 text-white'
                   : 'bg-slate-100 text-slate-400'">
              @if (currentStep() > step.n) { ✓ } @else { {{ step.n }} }
            </div>
            <span class="text-xs font-medium hidden sm:block"
                  [class]="currentStep() >= step.n ? 'text-blue-900' : 'text-slate-400'">
              {{ step.label }}
            </span>
            @if (i < steps.length - 1) {
              <div class="flex-1 h-px" [class]="currentStep() > step.n ? 'bg-blue-900' : 'bg-slate-200'"></div>
            }
          </div>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- ÉTAPE 1: Bien -->
        @if (currentStep() === 1) {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 fade-in">
            <h2 class="font-bold text-slate-800">Type de bien & localisation</h2>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">Type de bien *</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                @for (t of typesBiens(); track t.id) {
                  <label [class]="form.value.typeBienId === t.id
                    ? 'border-2 border-blue-900 bg-blue-50'
                    : 'border border-slate-200 hover:border-blue-300'"
                    class="flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all">
                    <input type="radio" formControlName="typeBienId" [value]="t.id" class="hidden"/>
                    <span>{{ t.icone ?? '🏠' }}</span>
                    <span class="text-sm font-medium text-slate-700">{{ t.nom }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Ville *</label>
                <select formControlName="ville" (change)="onVilleChange()"
                  class="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50">
                  <option value="">Choisir...</option>
                  @for (v of villes(); track v) { <option [value]="v">{{ v }}</option> }
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Quartier *</label>
                <select formControlName="localisationId" [disabled]="!form.value.ville"
                  class="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 disabled:opacity-50">
                  <option [value]="null">Choisir...</option>
                  @for (q of quartiers(); track q.id) { <option [value]="q.id">{{ q.quartier }}</option> }
                </select>
              </div>
            </div>

            <div class="flex justify-end">
              <button type="button" (click)="nextStep()"
                [disabled]="!form.value.typeBienId || !form.value.localisationId"
                class="px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl
                       hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-95">
                Suivant →
              </button>
            </div>
          </div>
        }

        <!-- ÉTAPE 2: Description + Prix -->
        @if (currentStep() === 2) {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 fade-in">
            <h2 class="font-bold text-slate-800">Description & Prix</h2>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
              <textarea formControlName="description" rows="5"
                placeholder="Décrivez votre bien: superficie, équipements, accès, disponibilité..."
                class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                maxlength="1000"
              ></textarea>
              <div class="flex justify-between mt-1">
                <p class="text-xs text-slate-400">Minimum 30 caractères</p>
                <p class="text-xs text-slate-400">{{ form.value.description?.length ?? 0 }}/1000</p>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Prix mensuel (FCFA) *</label>
              <div class="relative">
                <input formControlName="prix" type="number" placeholder="ex: 75000" min="1000"
                  class="w-full h-11 px-4 pr-16 rounded-xl border border-slate-200 text-sm
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  FCFA
                </span>
              </div>
              @if (form.value.prix && form.value.prix >= 1000) {
                <p class="text-blue-900 font-semibold text-sm mt-1">
                  = {{ form.value.prix | fcfa }}
                </p>
              }
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Numéro WhatsApp *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">🇨🇲 +237</span>
                <input formControlName="whatsappRaw" type="tel" placeholder="6 XX XX XX XX"
                  class="w-full h-11 pl-24 pr-4 rounded-xl border border-slate-200 text-sm
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Le numéro ne sera jamais affiché en clair. Utilisé uniquement dans le lien de contact.
              </p>
            </div>

            <div class="flex gap-3">
              <button type="button" (click)="prevStep()"
                class="px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50">
                ← Retour
              </button>
              <button type="button" (click)="nextStep()"
                [disabled]="!form.value.description || (form.value.description?.length ?? 0) < 30 || !form.value.prix"
                class="flex-1 py-3 bg-blue-900 text-white font-semibold rounded-xl
                       hover:bg-blue-800 disabled:opacity-50 transition-all">
                Suivant →
              </button>
            </div>
          </div>
        }

        <!-- ÉTAPE 3: Photos + Soumettre -->
        @if (currentStep() === 3) {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 fade-in">
            <h2 class="font-bold text-slate-800">Photos (optionnel)</h2>
            <p class="text-slate-500 text-sm -mt-3">
              Les annonces avec photos reçoivent 3× plus de contacts.
            </p>

            <app-image-upload
              [maxFiles]="4" [maxSizeMb]="4"
              (filesChanged)="photos = $event"
            />

            <!-- Récapitulatif -->
            <div class="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <h3 class="font-semibold text-slate-700 mb-3">📋 Récapitulatif</h3>
              @if (selectedTypeBien()) {
                <p class="text-slate-600">🏠 <strong>Type:</strong> {{ selectedTypeBien() }}</p>
              }
              @if (selectedLocalisation()) {
                <p class="text-slate-600">📍 <strong>Lieu:</strong> {{ selectedLocalisation() }}</p>
              }
              @if (form.value.prix) {
                <p class="text-slate-600">💰 <strong>Prix:</strong> {{ form.value.prix | fcfa }}</p>
              }
              <p class="text-slate-600">📷 <strong>Photos:</strong> {{ photos.length }} / 4</p>
            </div>

            @if (submitError()) {
              <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                <p class="text-red-600 text-sm">{{ submitError() }}</p>
              </div>
            }

            <div class="flex gap-3">
              <button type="button" (click)="prevStep()"
                class="px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50">
                ← Retour
              </button>
              <button type="submit" [disabled]="submitting()"
                class="flex-1 py-3 bg-blue-900 text-white font-bold rounded-xl
                       hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-98
                       shadow-lg shadow-blue-900/20">
                {{ submitting() ? '⏳ Publication...' : '🚀 Publier maintenant' }}
              </button>
            </div>
          </div>
        }
      </form>
    </div>
  `,
})
export class AnnonceCreateComponent implements OnInit {
  private readonly locApi     = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly annonceApi = inject(AnnonceApi);
  private readonly photoApi   = inject(PhotoApi);
  private readonly storage    = inject(StorageService);
  private readonly toast      = inject(ToastService);
  private readonly router     = inject(Router);
  private readonly store      = inject(Store);
  private readonly fb         = inject(FormBuilder);

  readonly user = this.store.selectSignal(selectCurrentUser);

  currentStep = signal(1);
  submitting  = signal(false);
  submitError = signal<string | null>(null);
  typesBiens  = signal<TypeBienResponse[]>([]);
  villes      = signal<string[]>([]);
  quartiers   = signal<LocalisationResponse[]>([]);
  photos: File[] = [];

  hasDraft = () => this.storage.hasDraft();

  steps = [
    { n: 1, label: 'Localisation' },
    { n: 2, label: 'Description' },
    { n: 3, label: 'Photos' },
  ];

  form = this.fb.group({
    typeBienId:    [null as number | null, Validators.required],
    ville:         [''],
    localisationId:[null as number | null, Validators.required],
    description:   ['', [Validators.required, Validators.minLength(30), Validators.maxLength(1000)]],
    prix:          [null as number | null, [Validators.required, Validators.min(1000)]],
    whatsappRaw:   [''],
  });

  ngOnInit(): void {
    this.typeBienApi.getAll().subscribe(r => this.typesBiens.set(r.data));
    this.locApi.getVilles().subscribe(r => this.villes.set(r.data));

    // Restaurer brouillon
    const draft = this.storage.getDraft<any>();
    if (draft) { this.form.patchValue(draft); }

    // Pré-remplir WhatsApp avec téléphone du compte
    const phone = this.user()?.telephone?.replace(/^\+?237/, '') ?? '';
    if (phone) this.form.patchValue({ whatsappRaw: phone });

    // Auto-save brouillon
    this.form.valueChanges.subscribe(v => this.storage.saveDraft(v));
  }

  onVilleChange(): void {
    this.form.patchValue({ localisationId: null });
    const ville = this.form.value.ville;
    if (!ville) return;
    this.locApi.getQuartiers(ville).subscribe(r => this.quartiers.set(r.data));
  }

  get selectedTypeBien(): () => string {
    return () => this.typesBiens().find(t => t.id === this.form.value.typeBienId)?.nom ?? '';
  }

  get selectedLocalisation(): () => string {
    return () => {
      const q = this.quartiers().find(q => q.id === this.form.value.localisationId);
      return q ? `${q.quartier}, ${q.ville}` : '';
    };
  }

  nextStep(): void { if (this.currentStep() < 3) this.currentStep.update(v => v + 1); }
  prevStep(): void { if (this.currentStep() > 1) this.currentStep.update(v => v - 1); }

  clearDraft(): void { this.storage.clearDraft(); this.form.reset(); this.toast.info('Brouillon effacé'); }

  onSubmit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const v = this.form.getRawValue();
    const whatsapp = `+237${v.whatsappRaw?.replace(/\D/g, '') ?? ''}`;

    this.annonceApi.publier({
      typeBienId:    v.typeBienId!,
      localisationId: v.localisationId!,
      description:   v.description!,
      prix:          v.prix!,
      numeroWhatsapp: whatsapp,
    }).subscribe({
      next: res => {
        // Upload photos si présentes
        if (this.photos.length > 0) {
          this.photoApi.uploadPhotos(res.data.id, this.photos).subscribe({
            next: () => this._afterPublish(res.data.id),
            error: () => this._afterPublish(res.data.id), // annonce publiée même si upload échoue
          });
        } else {
          this._afterPublish(res.data.id);
        }
      },
      error: err => {
        this.submitting.set(false);
        this.submitError.set(err.error?.message ?? 'Erreur lors de la publication');
      },
    });
  }

  private _afterPublish(id: number): void {
    this.submitting.set(false);
    this.storage.clearDraft();
    this.toast.success('🎉 Annonce publiée avec succès !');
    this.router.navigate(['/annonces', id]);
  }
}
EOF
OK "AnnonceCreate (formulaire multi-étapes)"

# Dashboard routes
cat > "$DASH/dashboard.routes.ts" << 'EOF'
import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { DashboardShellComponent } from './dashboard-shell.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '', component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',      loadComponent: () => import('./overview/overview.component').then(m => m.DashboardOverviewComponent) },
      { path: 'mes-annonces',  loadComponent: () => import('./mes-annonces/mes-annonces.component').then(m => m.MesAnnoncesComponent) },
      { path: 'mes-favoris',   loadComponent: () => import('./mes-favoris/mes-favoris.component').then(m => m.MesFavorisComponent) },
      { path: 'mes-contacts',  loadComponent: () => import('./mes-contacts/mes-contacts.component').then(m => m.MesContactsComponent) },
      { path: 'profil',        loadComponent: () => import('./profil/profil.component').then(m => m.ProfilComponent) },
    ]
  }
];
EOF
OK "Dashboard routes"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 06 TERMINÉ — DASHBOARD PROPRIÉTAIRE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}[i]${NC} Prochaine étape: bash ../ng-07-admin.sh"
