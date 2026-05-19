#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 07 : INTERFACE ADMIN COMPLÈTE
# =============================================================================
# Rôle     : Génère toute l'interface d'administration :
#            - Dashboard admin: stats temps réel + graphiques
#            - Gestion annonces: tableau + filtres + export CSV
#            - Gestion utilisateurs: recherche + actions
#            - Signalements: file de traitement
#            - Commentaires: modération
#            - Configuration: villes, quartiers, types biens, paramètres
#
# Exécuter : bash ../ng-07-admin.sh
# =============================================================================
set -euo pipefail
GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || { echo "Lancez depuis la racine Angular"; exit 1; }
SECTION "SCRIPT 07 — INTERFACE ADMIN"

ADMIN="src/app/features/admin"

# =============================================================================
# ADMIN DASHBOARD
# =============================================================================
SECTION "1/6 — Admin Dashboard (stats + graphiques)"

cat > "$ADMIN/dashboard/admin-dashboard.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '@core/services/api/admin.api';
import { AdminDashboardResponse, ChartDataPoint } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    @if (loading()) { <app-loading-spinner/> }
    @else if (data()) {
      <div class="space-y-6 fade-in">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (kpi of kpis(); track kpi.label) {
            <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">{{ kpi.icon }}</span>
                @if (kpi.change !== undefined) {
                  <span class="text-xs font-semibold px-2 py-1 rounded-full"
                        [class]="kpi.change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'">
                    {{ kpi.change >= 0 ? '+' : '' }}{{ kpi.change }}
                  </span>
                }
              </div>
              <p class="text-2xl font-bold text-slate-800">{{ kpi.value }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ kpi.label }}</p>
              @if (kpi.sub) {
                <p class="text-xs text-blue-600 font-medium mt-1">{{ kpi.sub }} aujourd'hui</p>
              }
            </div>
          }
        </div>

        <!-- Signalements non traités (alert) -->
        @if (data()!.signalEmentsNonTraites > 0) {
          <div class="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🚨</span>
              <div>
                <p class="font-semibold text-red-800">
                  {{ data()!.signalEmentsNonTraites }} signalement(s) en attente
                </p>
                <p class="text-red-600 text-sm">Nécessitent votre attention</p>
              </div>
            </div>
            <a href="/admin/signalements"
               class="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-xl
                      hover:bg-red-700 transition-all">
              Traiter
            </a>
          </div>
        }

        <!-- Graphiques -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Visites 7j -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Visites — 7 derniers jours</h3>
            <div class="flex items-end gap-1 h-32">
              @for (pt of data()!.evolutionVisites; track pt.date) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full bg-blue-900 rounded-t-sm transition-all hover:bg-blue-700"
                       [style.height.%]="barHeight(pt.valeur, data()!.evolutionVisites)"
                       [title]="pt.valeur + ' visites'">
                  </div>
                  <span class="text-xs text-slate-400 rotate-45 origin-bottom-left">
                    {{ formatDay(pt.date) }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Contacts 7j -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Contacts WhatsApp — 7 jours</h3>
            <div class="flex items-end gap-1 h-32">
              @for (pt of data()!.evolutionContacts; track pt.date) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full bg-green-500 rounded-t-sm transition-all hover:bg-green-400"
                       [style.height.%]="barHeight(pt.valeur, data()!.evolutionContacts)"
                       [title]="pt.valeur + ' contacts'">
                  </div>
                  <span class="text-xs text-slate-400">{{ formatDay(pt.date) }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Rankings -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Top villes -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">🏆 Villes les plus actives</h3>
            <div class="space-y-3">
              @for (v of data()!.villesActives; track v.ville; let i = $index) {
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 bg-blue-50 text-blue-900 rounded-full flex items-center
                               justify-center text-xs font-bold shrink-0">{{ i + 1 }}</span>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="text-sm font-medium text-slate-700">{{ v.ville }}</span>
                      <span class="text-xs text-slate-500">{{ v.nombreAnnonces }} annonces</span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-900 rounded-full transition-all"
                           [style.width.%]="rankPct(v.nombreAnnonces, data()!.villesActives[0].nombreAnnonces)">
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Top types biens -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">🏠 Types de biens populaires</h3>
            <div class="space-y-3">
              @for (t of data()!.typesBiensPopulaires; track t.typeBien; let i = $index) {
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 bg-emerald-50 text-emerald-700 rounded-full flex items-center
                               justify-center text-xs font-bold shrink-0">{{ i + 1 }}</span>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="text-sm font-medium text-slate-700">{{ t.typeBien }}</span>
                      <span class="text-xs text-slate-500">{{ t.nombreAnnonces }}</span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full"
                           [style.width.%]="rankPct(t.nombreAnnonces, data()!.typesBiensPopulaires[0].nombreAnnonces)">
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  loading = signal(true);
  data    = signal<AdminDashboardResponse | null>(null);

  kpis = () => {
    const d = this.data();
    if (!d) return [];
    return [
      { icon: '👥', label: 'Visites totales',       value: d.visitesTotales.toLocaleString('fr'), sub: d.visitesTotales7j, change: undefined },
      { icon: '🏠', label: 'Annonces actives',       value: d.annoncesActives, sub: d.nouvellesAnnonces, change: d.nouvellesAnnonces },
      { icon: '📱', label: 'Contacts WhatsApp',      value: d.contactsWhatsapp.toLocaleString('fr'), sub: d.contactsWhatsapp7j, change: undefined },
      { icon: '🔴', label: 'Signalements en attente',value: d.signalEmentsNonTraites, sub: undefined, change: d.signalEmentsNonTraites > 0 ? -d.signalEmentsNonTraites : 0 },
    ];
  };

  ngOnInit(): void {
    this.adminApi.getDashboard().subscribe({
      next: r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  barHeight(val: number, pts: ChartDataPoint[]): number {
    const max = Math.max(...pts.map(p => p.valeur), 1);
    return Math.max((val / max) * 100, 4);
  }

  rankPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  formatDay(date: string): string {
    return new Date(date).toLocaleDateString('fr-CM', { weekday: 'short' }).slice(0, 2);
  }
}
EOF
OK "Admin Dashboard"

# =============================================================================
# ADMIN ANNONCES
# =============================================================================
SECTION "2/6 — Admin Annonces"

cat > "$ADMIN/annonces/admin-annonces.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '@core/services/api/admin.api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AnnonceListResponse, StatutAnnonce } from '@core/models';

@Component({
  selector: 'app-admin-annonces',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent, ConfirmDialogComponent, FcfaPipe, TimeAgoPipe],
  template: `
    <app-confirm-dialog
      [open]="confirmOpen()" [title]="confirmTitle()" [message]="confirmMsg()"
      confirmLabel="Supprimer" [danger]="true"
      (confirmed)="executeDelete()" (cancelled)="confirmOpen.set(false)"
    />

    <div class="space-y-4">
      <!-- Header + Export -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Gestion des annonces</h2>
          <p class="text-slate-500 text-sm">{{ total() }} annonce(s) au total</p>
        </div>
        <button (click)="exportCSV()"
          class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm
                 font-semibold rounded-xl hover:bg-emerald-700 transition-all active:scale-95">
          ⬇️ Export CSV
        </button>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select [(ngModel)]="filters.statut" (change)="load()"
          class="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="EN_PAUSE">En pause</option>
          <option value="EXPIREE">Expirée</option>
          <option value="ARCHIVEE">Archivée</option>
          <option value="SUPPRIMEE">Supprimée</option>
        </select>
        <select [(ngModel)]="filters.ville" (change)="load()"
          class="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none">
          <option value="">Toutes les villes</option>
          @for (v of villes; track v) { <option [value]="v">{{ v }}</option> }
        </select>
        <input [(ngModel)]="searchTerm" (keyup.enter)="load()" placeholder="🔍 Propriétaire, ville..."
          class="col-span-2 h-10 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none"/>
      </div>

      <!-- Tableau -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-16">
            <div class="spinner"></div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                  @for (h of headers; track h) {
                    <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{{ h }}</th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (a of annonces(); track a.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img [src]="a.photoPrincipaleThumb || '/assets/images/no-photo.svg'"
                               class="w-full h-full object-cover"/>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-slate-800 leading-tight">{{ a.typeBien }}</p>
                          <p class="text-xs text-slate-500">{{ a.quartier }}, {{ a.ville }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm font-bold text-blue-900">{{ a.prix | fcfa }}</span>
                    </td>
                    <td class="px-4 py-3"><app-status-badge [statut]="a.statut"/></td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ a.datePublication | timeAgo }}</td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ a.nombreVues }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1">
                        <a [routerLink]="['/annonces', a.id]" target="_blank"
                           class="px-2.5 py-1.5 text-xs border border-slate-200 text-slate-600
                                  rounded-lg hover:bg-slate-50 transition-all">
                          Voir
                        </a>
                        @if (a.statut === 'ACTIVE') {
                          <button (click)="pauseAnnonce(a.id)"
                            class="px-2.5 py-1.5 text-xs border border-amber-200 text-amber-600
                                   rounded-lg hover:bg-amber-50 transition-all">
                            Pause
                          </button>
                        }
                        <button (click)="confirmDelete(a)"
                          class="px-2.5 py-1.5 text-xs border border-red-200 text-red-600
                                 rounded-lg hover:bg-red-50 transition-all">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p class="text-xs text-slate-500">Page {{ currentPage() + 1 }} / {{ totalPages() }}</p>
              <div class="flex gap-2">
                <button (click)="prevPage()" [disabled]="currentPage() === 0"
                  class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40
                         hover:bg-slate-50 transition-all">
                  ← Préc.
                </button>
                <button (click)="nextPage()" [disabled]="currentPage() >= totalPages() - 1"
                  class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40
                         hover:bg-slate-50 transition-all">
                  Suiv. →
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class AdminAnnoncesComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  annonces     = signal<AnnonceListResponse[]>([]);
  total        = signal(0);
  totalPages   = signal(0);
  currentPage  = signal(0);
  loading      = signal(false);
  confirmOpen  = signal(false);
  confirmTitle = signal('');
  confirmMsg   = signal('');
  private pendingId?: number;

  filters    = { statut: '', ville: '' };
  searchTerm = '';
  headers    = ['Annonce', 'Prix', 'Statut', 'Publiée', 'Vues', 'Actions'];
  villes     = ['Douala','Yaoundé','Bafoussam','Kribi','Limbé','Bamenda'];

  ngOnInit(): void { this.load(); }

  load(page = 0): void {
    this.loading.set(true);
    this.adminApi.getAnnonces({ ...this.filters, page }).subscribe({
      next: r => {
        this.annonces.set(r.data.content);
        this.total.set(r.data.totalElements);
        this.totalPages.set(r.data.totalPages);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  confirmDelete(a: AnnonceListResponse): void {
    this.pendingId = a.id;
    this.confirmTitle.set('Supprimer cette annonce ?');
    this.confirmMsg.set(`"${a.typeBien} à ${a.quartier}" sera supprimée définitivement. Le propriétaire sera notifié.`);
    this.confirmOpen.set(true);
  }

  executeDelete(): void {
    if (!this.pendingId) return;
    this.confirmOpen.set(false);
    this.adminApi.supprimerAnnonce(this.pendingId, 'Suppression administrative').subscribe({
      next: () => this.load(this.currentPage()),
    });
    this.pendingId = undefined;
  }

  pauseAnnonce(id: number): void {
    this.adminApi.pauseAnnonceAdmin(id).subscribe({ next: () => this.load(this.currentPage()) });
  }

  exportCSV(): void {
    this.adminApi.exportAnnoncesCSV().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `immocam-annonces-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    });
  }

  prevPage(): void { if (this.currentPage() > 0) this.load(this.currentPage() - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages() - 1) this.load(this.currentPage() + 1); }
}
EOF
OK "Admin Annonces"

# =============================================================================
# ADMIN UTILISATEURS
# =============================================================================
SECTION "3/6 — Admin Utilisateurs"

cat > "$ADMIN/utilisateurs/admin-utilisateurs.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AdminUtilisateurResponse } from '@core/models';

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, TimeAgoPipe],
  template: `
    <app-confirm-dialog
      [open]="confirmOpen()" [title]="confirmTitle()" [message]="confirmMsg()"
      [confirmLabel]="confirmLabel()" [danger]="true"
      (confirmed)="executeAction()" (cancelled)="confirmOpen.set(false)"
    />

    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Gestion des utilisateurs</h2>
          <p class="text-slate-500 text-sm">{{ total() }} utilisateur(s)</p>
        </div>
        <button (click)="exportCSV()"
          class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm
                 font-semibold rounded-xl hover:bg-emerald-700 transition-all">
          ⬇️ Export CSV
        </button>
      </div>

      <!-- Recherche -->
      <div class="bg-white rounded-2xl border border-slate-100 p-4">
        <input [(ngModel)]="searchTerm" (keyup.enter)="load()"
          placeholder="🔍 Rechercher par nom, email, téléphone..."
          class="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm
                 bg-slate-50 focus:border-blue-500 outline-none"/>
      </div>

      <!-- Tableau -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">Utilisateur</th>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">Ville</th>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">Statut</th>
                <th class="text-right text-xs font-semibold text-slate-500 px-4 py-3">Annonces</th>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">Inscrit</th>
                <th class="text-right text-xs font-semibold text-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (u of users(); track u.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center
                                  justify-center text-blue-700 font-semibold text-xs shrink-0">
                        {{ u.prenom[0] }}{{ u.nom[0] }}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-slate-800">{{ u.nomComplet }}</p>
                        <p class="text-xs text-slate-500">{{ u.email }}</p>
                        <p class="text-xs text-slate-400">{{ u.telephone }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{{ u.ville }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                          [class]="statusClass(u.statut)">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [class]="statusDot(u.statut)"></span>
                      {{ u.statut }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                    {{ u.nombreAnnonces }}
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500">{{ u.dateInscription | timeAgo }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      @if (u.statut === 'ACTIF') {
                        <button (click)="doSuspendre(u)"
                          class="px-2.5 py-1.5 text-xs border border-amber-200 text-amber-600
                                 rounded-lg hover:bg-amber-50 transition-all">
                          Suspendre
                        </button>
                        <button (click)="doBannir(u)"
                          class="px-2.5 py-1.5 text-xs border border-red-200 text-red-600
                                 rounded-lg hover:bg-red-50 transition-all">
                          Bannir
                        </button>
                      }
                      @if (u.statut !== 'ACTIF') {
                        <button (click)="doActiver(u.id)"
                          class="px-2.5 py-1.5 text-xs border border-emerald-200 text-emerald-600
                                 rounded-lg hover:bg-emerald-50 transition-all">
                          Activer
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p class="text-xs text-slate-500">Page {{ page() + 1 }} / {{ totalPages() }}</p>
            <div class="flex gap-2">
              <button (click)="load(page() - 1)" [disabled]="page() === 0"
                class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40">← Préc.</button>
              <button (click)="load(page() + 1)" [disabled]="page() >= totalPages() - 1"
                class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40">Suiv. →</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminUtilisateursComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  users        = signal<AdminUtilisateurResponse[]>([]);
  total        = signal(0);
  totalPages   = signal(0);
  page         = signal(0);
  loading      = signal(false);
  confirmOpen  = signal(false);
  confirmTitle = signal('');
  confirmMsg   = signal('');
  confirmLabel = signal('Confirmer');
  searchTerm   = '';
  private pendingFn?: () => void;

  ngOnInit(): void { this.load(); }

  load(p = 0): void {
    this.loading.set(true);
    const filters = this.searchTerm ? { recherche: this.searchTerm, page: p } : { page: p };
    this.adminApi.getUtilisateurs(filters).subscribe({
      next: r => {
        this.users.set(r.data.content);
        this.total.set(r.data.totalElements);
        this.totalPages.set(r.data.totalPages);
        this.page.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  doSuspendre(u: AdminUtilisateurResponse): void {
    this.confirmTitle.set('Suspendre le compte ?');
    this.confirmMsg.set(`${u.nomComplet} ne pourra plus se connecter. Ses annonces seront masquées.`);
    this.confirmLabel.set('Suspendre');
    this.pendingFn = () => this.adminApi.suspendreUtilisateur(u.id, 'Suspension administrative').subscribe({ next: () => this.load() });
    this.confirmOpen.set(true);
  }

  doBannir(u: AdminUtilisateurResponse): void {
    this.confirmTitle.set('Bannir définitivement ?');
    this.confirmMsg.set(`${u.nomComplet} sera banni définitivement. Toutes ses annonces seront supprimées.`);
    this.confirmLabel.set('Bannir');
    this.pendingFn = () => this.adminApi.bannirUtilisateur(u.id, 'Bannissement administratif').subscribe({ next: () => this.load() });
    this.confirmOpen.set(true);
  }

  doActiver(id: number): void {
    this.adminApi.activerUtilisateur(id).subscribe({ next: () => this.load() });
  }

  executeAction(): void {
    this.confirmOpen.set(false);
    this.pendingFn?.();
    this.pendingFn = undefined;
  }

  exportCSV(): void {
    this.adminApi.exportUtilisateursCSV().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `immocam-utilisateurs-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    });
  }

  statusClass(s: string): string {
    return { ACTIF: 'bg-emerald-50 text-emerald-700', SUSPENDU: 'bg-amber-50 text-amber-700', BANNI: 'bg-red-50 text-red-700' }[s] ?? 'bg-slate-100 text-slate-600';
  }
  statusDot(s: string): string {
    return { ACTIF: 'bg-emerald-500', SUSPENDU: 'bg-amber-500', BANNI: 'bg-red-500' }[s] ?? 'bg-slate-400';
  }
}
EOF
OK "Admin Utilisateurs"

# =============================================================================
# ADMIN SIGNALEMENTS
# =============================================================================
SECTION "4/6 — Admin Signalements"

cat > "$ADMIN/signalements/admin-signalements.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { SignalementResponse } from '@core/models';
import { ToastService } from '@core/services/toast.service';
import { MOTIF_SIGNALEMENT_LABELS } from '@core/models';

@Component({
  selector: 'app-admin-signalements',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Signalements</h2>
          <p class="text-slate-500 text-sm">{{ pending() }} en attente de traitement</p>
        </div>
        <!-- Filtre statut -->
        <select [(ngModel)]="filterStatut" (change)="load()"
          class="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 outline-none">
          <option value="EN_ATTENTE">En attente</option>
          <option value="TRAITE">Traités</option>
          <option value="IGNORE">Ignorés</option>
          <option value="">Tous</option>
        </select>
      </div>

      @if (signalements().length === 0) {
        <div class="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p class="text-4xl mb-3">✅</p>
          <p class="text-slate-600 font-medium">Aucun signalement en attente</p>
          <p class="text-slate-400 text-sm mt-1">La plateforme est propre !</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (s of signalements(); track s.id) {
            <div class="bg-white rounded-2xl border shadow-sm p-5"
                 [class]="s.statut === 'EN_ATTENTE' ? 'border-red-100' : 'border-slate-100'">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     [class]="s.statut === 'EN_ATTENTE' ? 'bg-red-50' : 'bg-slate-100'">
                  <span class="text-xl">{{ s.statut === 'EN_ATTENTE' ? '🚨' : '✅' }}</span>
                </div>
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                          [class]="motifColor(s.motif)">
                      {{ motifLabel(s.motif) }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                          [class]="s.statut === 'EN_ATTENTE' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'">
                      {{ s.statut === 'EN_ATTENTE' ? 'En attente' : s.statut }}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-slate-800">
                    Annonce: <span class="text-blue-700">{{ s.annonceTitre }}</span>
                  </p>
                  <p class="text-xs text-slate-500">
                    Signalé par <strong>{{ s.auteurPrenom }}</strong>
                    ({{ s.auteurEmail }}) — {{ s.dateSignalement | timeAgo }}
                  </p>
                  @if (s.description) {
                    <p class="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg p-2">
                      "{{ s.description }}"
                    </p>
                  }
                </div>
              </div>

              @if (s.statut === 'EN_ATTENTE') {
                <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button (click)="traiter(s.id, 'IGNORE', 'IGNORER')"
                    class="px-3 py-2 text-xs border border-slate-200 text-slate-600 font-medium
                           rounded-xl hover:bg-slate-50 transition-all">
                    Ignorer
                  </button>
                  <button (click)="traiter(s.id, 'TRAITE', 'SUPPRIMER_ANNONCE')"
                    class="px-3 py-2 text-xs border border-amber-200 text-amber-700 font-medium
                           rounded-xl hover:bg-amber-50 transition-all">
                    Supprimer l'annonce
                  </button>
                  <button (click)="traiter(s.id, 'TRAITE', 'SUSPENDRE_PROPRIETAIRE')"
                    class="px-3 py-2 text-xs border border-red-200 text-red-600 font-medium
                           rounded-xl hover:bg-red-50 transition-all">
                    Suspendre le propriétaire
                  </button>
                  <button (click)="traiter(s.id, 'TRAITE', 'BANNIR_PROPRIETAIRE')"
                    class="px-3 py-2 text-xs bg-red-600 text-white font-medium
                           rounded-xl hover:bg-red-700 transition-all">
                    Bannir
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminSignalementsComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast    = inject(ToastService);

  signalements = signal<SignalementResponse[]>([]);
  pending      = signal(0);
  filterStatut = 'EN_ATTENTE';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.adminApi.getSignalements(this.filterStatut || undefined).subscribe({
      next: r => {
        this.signalements.set(r.data.content);
        this.pending.set(r.data.content.filter((s: any) => s.statut === 'EN_ATTENTE').length);
      },
    });
  }

  traiter(id: number, statut: any, action: any): void {
    this.adminApi.traiterSignalement(id, { statut, action }).subscribe({
      next: () => { this.toast.success('Signalement traité'); this.load(); },
    });
  }

  motifLabel(m: string): string {
    return (MOTIF_SIGNALEMENT_LABELS as any)[m] ?? m;
  }

  motifColor(m: string): string {
    if (m === 'ANNONCE_FRAUDULEUSE') return 'bg-red-100 text-red-700';
    if (m === 'CONTENU_INAPPROPRIE') return 'bg-purple-100 text-purple-700';
    return 'bg-amber-100 text-amber-700';
  }
}
EOF
OK "Admin Signalements"

# =============================================================================
# ADMIN COMMENTAIRES
# =============================================================================
cat > "$ADMIN/commentaires/admin-commentaires.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '@core/services/api/admin.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { ToastService } from '@core/services/toast.service';
import { CommentaireResponse } from '@core/models';

@Component({
  selector: 'app-admin-commentaires',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  template: `
    <div class="space-y-4">
      <h2 class="text-lg font-bold text-slate-800">Modération des commentaires</h2>

      @if (commentaires().length === 0) {
        <div class="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p class="text-4xl mb-3">💬</p>
          <p class="text-slate-600 font-medium">Aucun commentaire signalé</p>
        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          @for (c of commentaires(); track c.id) {
            <div class="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
              <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center
                          justify-center text-slate-600 font-semibold text-xs shrink-0">
                {{ c.auteurPrenom[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-semibold text-slate-800">{{ c.auteurPrenom }}</p>
                  <span class="text-xs text-slate-400">{{ c.dateCreation | timeAgo }}</span>
                </div>
                <p class="text-sm text-slate-600">{{ c.contenu }}</p>
              </div>
              <button (click)="supprimer(c.id)"
                class="shrink-0 px-3 py-1.5 text-xs border border-red-200 text-red-600
                       rounded-lg hover:bg-red-50 transition-all font-medium">
                Supprimer
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminCommentairesComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast    = inject(ToastService);
  commentaires = signal<CommentaireResponse[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.adminApi.getCommentaires().subscribe({ next: r => this.commentaires.set(r.data.content) });
  }

  supprimer(id: number): void {
    this.adminApi.supprimerCommentaire(id).subscribe({
      next: () => { this.toast.success('Commentaire supprimé'); this.load(); },
    });
  }
}
EOF
OK "Admin Commentaires"

# =============================================================================
# ADMIN CONFIG
# =============================================================================
SECTION "5/6 — Admin Configuration"

cat > "$ADMIN/config/admin-config.component.ts" << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { ToastService } from '@core/services/toast.service';
import { ConfigSystemeResponse, LocalisationResponse, TypeBienResponse } from '@core/models';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-3xl">
      <h2 class="text-lg font-bold text-slate-800">Configuration système</h2>

      @if (config()) {
        <!-- Paramètres annonces -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="font-semibold text-slate-800 mb-5">⚙️ Paramètres des annonces</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            @for (field of configFields; track field.key) {
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{ field.label }}</label>
                @if (field.type === 'textarea') {
                  <textarea [(ngModel)]="config()![field.key]" rows="3"
                    class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none">
                  </textarea>
                } @else {
                  <input [type]="field.type" [(ngModel)]="config()![field.key]"
                    class="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
                }
                @if (field.hint) {
                  <p class="text-xs text-slate-400 mt-1">{{ field.hint }}</p>
                }
              </div>
            }
          </div>
          <button (click)="saveConfig()" [disabled]="saving()"
            class="mt-5 px-6 py-2.5 bg-blue-900 text-white font-semibold text-sm rounded-xl
                   hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-95">
            {{ saving() ? 'Enregistrement...' : '💾 Enregistrer' }}
          </button>
        </div>

        <!-- Villes & Quartiers -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="font-semibold text-slate-800 mb-4">📍 Ajouter une localisation</h3>
          <div class="flex gap-3">
            <input [(ngModel)]="newVille" placeholder="Ville" type="text"
              class="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"/>
            <input [(ngModel)]="newQuartier" placeholder="Quartier" type="text"
              class="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"/>
            <button (click)="addLocalisation()" [disabled]="!newVille || !newQuartier"
              class="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl
                     hover:bg-blue-800 disabled:opacity-50 transition-all">
              + Ajouter
            </button>
          </div>
          <div class="mt-4 space-y-1 max-h-40 overflow-y-auto">
            @for (l of localisations(); track l.id) {
              <div class="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                <span class="text-slate-700">{{ l.ville }} — {{ l.quartier }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full"
                      [class]="l.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'">
                  {{ l.active ? 'Actif' : 'Inactif' }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Types de biens -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="font-semibold text-slate-800 mb-4">🏠 Ajouter un type de bien</h3>
          <div class="flex gap-3">
            <input [(ngModel)]="newTypeBienNom" placeholder="Nom (ex: Duplex)" type="text"
              class="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"/>
            <input [(ngModel)]="newTypeBienIcone" placeholder="Icône (ex: 🏠)" type="text"
              class="w-24 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"/>
            <button (click)="addTypeBien()" [disabled]="!newTypeBienNom"
              class="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl
                     hover:bg-blue-800 disabled:opacity-50 transition-all">
              + Ajouter
            </button>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            @for (t of typesBiens(); track t.id) {
              <span class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-700">
                {{ t.icone ?? '🏠' }} {{ t.nom }}
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminConfigComponent implements OnInit {
  private readonly adminApi    = inject(AdminApi);
  private readonly locApi      = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly toast       = inject(ToastService);

  config       = signal<ConfigSystemeResponse | null>(null);
  localisations = signal<LocalisationResponse[]>([]);
  typesBiens   = signal<TypeBienResponse[]>([]);
  saving       = signal(false);
  newVille     = ''; newQuartier = '';
  newTypeBienNom = ''; newTypeBienIcone = '';

  configFields = [
    { key: 'dureeVieAnnonce',           label: 'Durée de vie annonce (jours)',   type: 'number', hint: 'Affiché publiquement' },
    { key: 'maxAnnoncesParProprietaire',label: 'Max annonces par propriétaire',  type: 'number', hint: '' },
    { key: 'maxPhotosParAnnonce',        label: 'Max photos par annonce',         type: 'number', hint: '' },
    { key: 'joursRappelExpiration',      label: 'Rappel avant expiration (jours)',type: 'number', hint: 'J-X' },
    { key: 'joursSuppressionDefinitive', label: 'Suppression définitive (jours après expiration)', type: 'number', hint: 'J+X' },
    { key: 'rateLimit',                  label: 'Rate limit (req/min)',           type: 'number', hint: '' },
    { key: 'messageWhatsappDefaut',      label: 'Message WhatsApp par défaut',    type: 'textarea', hint: 'Variables: {type} {quartier} {ville} {prix}' },
  ] as const;

  ngOnInit(): void {
    this.adminApi.getConfig().subscribe({ next: r => this.config.set(r.data) });
    this.locApi.getAll(false).subscribe({ next: r => this.localisations.set(r.data) });
    this.typeBienApi.getAll(false).subscribe({ next: r => this.typesBiens.set(r.data) });
  }

  saveConfig(): void {
    if (!this.config()) return;
    this.saving.set(true);
    this.adminApi.updateConfig(this.config()!).subscribe({
      next: r => { this.config.set(r.data); this.saving.set(false); this.toast.success('Configuration sauvegardée !'); },
      error: () => this.saving.set(false),
    });
  }

  addLocalisation(): void {
    if (!this.newVille || !this.newQuartier) return;
    this.adminApi.ajouterLocalisation({ ville: this.newVille, quartier: this.newQuartier }).subscribe({
      next: () => {
        this.toast.success('Localisation ajoutée');
        this.newVille = ''; this.newQuartier = '';
        this.locApi.getAll(false).subscribe({ next: r => this.localisations.set(r.data) });
      },
    });
  }

  addTypeBien(): void {
    if (!this.newTypeBienNom) return;
    this.adminApi.ajouterTypeBien({ nom: this.newTypeBienNom, icone: this.newTypeBienIcone || undefined }).subscribe({
      next: () => {
        this.toast.success('Type de bien ajouté');
        this.newTypeBienNom = ''; this.newTypeBienIcone = '';
        this.typeBienApi.getAll(false).subscribe({ next: r => this.typesBiens.set(r.data) });
      },
    });
  }
}
EOF
OK "Admin Config"

# Admin routes
SECTION "6/6 — Admin routes"
cat > "$ADMIN/admin.routes.ts" << 'EOF'
import { Routes } from '@angular/router';
import { roleAdminGuard } from '@core/guards/role.guard';
import { AdminLayoutComponent } from '@layout/admin-layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [roleAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'annonces',     loadComponent: () => import('./annonces/admin-annonces.component').then(m => m.AdminAnnoncesComponent) },
      { path: 'utilisateurs', loadComponent: () => import('./utilisateurs/admin-utilisateurs.component').then(m => m.AdminUtilisateursComponent) },
      { path: 'signalements', loadComponent: () => import('./signalements/admin-signalements.component').then(m => m.AdminSignalementsComponent) },
      { path: 'commentaires', loadComponent: () => import('./commentaires/admin-commentaires.component').then(m => m.AdminCommentairesComponent) },
      { path: 'config',       loadComponent: () => import('./config/admin-config.component').then(m => m.AdminConfigComponent) },
    ]
  }
];
EOF
OK "Admin routes"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 07 TERMINÉ — INTERFACE ADMIN${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}[i]${NC} Prochaine étape: bash ../ng-08-finalize.sh"
