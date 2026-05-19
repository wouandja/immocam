import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '@core/services/api/admin.api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AnnonceListResponse, StatutAnnonce } from '@core/services/models';

@Component({
  selector: 'app-admin-annonces',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    FcfaPipe,
    TimeAgoPipe,
  ],
  template: `
    <app-confirm-dialog
      [open]="confirmOpen()"
      [title]="confirmTitle()"
      [message]="confirmMsg()"
      confirmLabel="Supprimer"
      [danger]="true"
      (confirmed)="executeDelete()"
      (cancelled)="confirmOpen.set(false)"
    />

    <div class="space-y-4">
      <!-- Header + Export -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Gestion des annonces</h2>
          <p class="text-slate-500 text-sm">{{ total() }} annonce(s) au total</p>
        </div>
        <button
          (click)="exportCSV()"
          class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm
                 font-semibold rounded-xl hover:bg-emerald-700 transition-all active:scale-95"
        >
          ⬇️ Export CSV
        </button>
      </div>

      <!-- Filtres -->
      <div
        class="bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <select
          [(ngModel)]="filters.statut"
          (change)="load()"
          class="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="EN_PAUSE">En pause</option>
          <option value="EXPIREE">Expirée</option>
          <option value="ARCHIVEE">Archivée</option>
          <option value="SUPPRIMEE">Supprimée</option>
        </select>
        <select
          [(ngModel)]="filters.ville"
          (change)="load()"
          class="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none"
        >
          <option value="">Toutes les villes</option>
          @for (v of villes; track v) {
            <option [value]="v">{{ v }}</option>
          }
        </select>
        <input
          [(ngModel)]="searchTerm"
          (keyup.enter)="load()"
          placeholder="🔍 Propriétaire, ville..."
          class="col-span-2 h-10 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none"
        />
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
                    <th
                      class="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap"
                    >
                      {{ h }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (a of annonces(); track a.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img
                            [src]="a.photoPrincipaleThumb || '/assets/images/no-photo.svg'"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p class="text-sm font-medium text-slate-800 leading-tight">
                            {{ a.typeBien }}
                          </p>
                          <p class="text-xs text-slate-500">{{ a.quartier }}, {{ a.ville }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm font-bold text-blue-900">{{ a.prix | fcfa }}</span>
                    </td>
                    <td class="px-4 py-3"><app-status-badge [statut]="a.statut" /></td>
                    <td class="px-4 py-3 text-xs text-slate-500">
                      {{ a.datePublication | timeAgo }}
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ a.nombreVues }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1">
                        <a
                          [routerLink]="['/annonces', a.id]"
                          target="_blank"
                          class="px-2.5 py-1.5 text-xs border border-slate-200 text-slate-600
                                  rounded-lg hover:bg-slate-50 transition-all"
                        >
                          Voir
                        </a>
                        @if (a.statut === 'ACTIVE') {
                          <button
                            (click)="pauseAnnonce(a.id)"
                            class="px-2.5 py-1.5 text-xs border border-amber-200 text-amber-600
                                   rounded-lg hover:bg-amber-50 transition-all"
                          >
                            Pause
                          </button>
                        }
                        <button
                          (click)="confirmDelete(a)"
                          class="px-2.5 py-1.5 text-xs border border-red-200 text-red-600
                                 rounded-lg hover:bg-red-50 transition-all"
                        >
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
              <p class="text-xs text-slate-500">
                Page {{ currentPage() + 1 }} / {{ totalPages() }}
              </p>
              <div class="flex gap-2">
                <button
                  (click)="prevPage()"
                  [disabled]="currentPage() === 0"
                  class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40
                         hover:bg-slate-50 transition-all"
                >
                  ← Préc.
                </button>
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage() >= totalPages() - 1"
                  class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40
                         hover:bg-slate-50 transition-all"
                >
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

  annonces = signal<AnnonceListResponse[]>([]);
  total = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  loading = signal(false);
  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMsg = signal('');
  private pendingId?: number;

  filters = { statut: '', ville: '' };
  searchTerm = '';
  headers = ['Annonce', 'Prix', 'Statut', 'Publiée', 'Vues', 'Actions'];
  villes = ['Douala', 'Yaoundé', 'Bafoussam', 'Kribi', 'Limbé', 'Bamenda'];

  ngOnInit(): void {
    this.load();
  }

  load(page = 0): void {
    this.loading.set(true);
    this.adminApi.getAnnonces({ ...this.filters, page }).subscribe({
      next: (r) => {
        this.annonces.set(r.data.contenu);
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
    this.confirmMsg.set(
      `"${a.typeBien} à ${a.quartier}" sera supprimée définitivement. Le propriétaire sera notifié.`,
    );
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
    this.adminApi.exportAnnoncesCSV().subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `immocam-annonces-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  prevPage(): void {
    if (this.currentPage() > 0) this.load(this.currentPage() - 1);
  }
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) this.load(this.currentPage() + 1);
  }
}
