import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AdminUtilisateurResponse } from '@core/services/models';

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, TimeAgoPipe],
  template: `
    <app-confirm-dialog
      [open]="confirmOpen()"
      [title]="confirmTitle()"
      [message]="confirmMsg()"
      [confirmLabel]="confirmLabel()"
      [danger]="true"
      (confirmed)="executeAction()"
      (cancelled)="confirmOpen.set(false)"
    />

    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Gestion des utilisateurs</h2>
          <p class="text-slate-500 text-sm">{{ total() }} utilisateur(s)</p>
        </div>
        <button
          (click)="exportCSV()"
          class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm
                 font-semibold rounded-xl hover:bg-emerald-700 transition-all"
        >
          ⬇️ Export CSV
        </button>
      </div>

      <!-- Recherche -->
      <div class="bg-white rounded-2xl border border-slate-100 p-4">
        <input
          [(ngModel)]="searchTerm"
          (keyup.enter)="load()"
          placeholder="🔍 Rechercher par nom, email, téléphone..."
          class="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm
                 bg-slate-50 focus:border-blue-500 outline-none"
        />
      </div>

      <!-- Tableau -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                  Utilisateur
                </th>
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
                      <div
                        class="w-8 h-8 bg-blue-100 rounded-full flex items-center
                                  justify-center text-blue-700 font-semibold text-xs shrink-0"
                      >
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
                    <span
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                      [class]="statusClass(u.statut)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" [class]="statusDot(u.statut)"></span>
                      {{ u.statut }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                    {{ u.nombreAnnonces }}
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500">
                    {{ u.dateInscription | timeAgo }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      @if (u.statut === 'ACTIF') {
                        <button
                          (click)="doSuspendre(u)"
                          class="px-2.5 py-1.5 text-xs border border-amber-200 text-amber-600
                                 rounded-lg hover:bg-amber-50 transition-all"
                        >
                          Suspendre
                        </button>
                        <button
                          (click)="doBannir(u)"
                          class="px-2.5 py-1.5 text-xs border border-red-200 text-red-600
                                 rounded-lg hover:bg-red-50 transition-all"
                        >
                          Bannir
                        </button>
                      }
                      @if (u.statut !== 'ACTIF') {
                        <button
                          (click)="doActiver(u.id)"
                          class="px-2.5 py-1.5 text-xs border border-emerald-200 text-emerald-600
                                 rounded-lg hover:bg-emerald-50 transition-all"
                        >
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
              <button
                (click)="load(page() - 1)"
                [disabled]="page() === 0"
                class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40"
              >
                ← Préc.
              </button>
              <button
                (click)="load(page() + 1)"
                [disabled]="page() >= totalPages() - 1"
                class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40"
              >
                Suiv. →
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminUtilisateursComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  users = signal<AdminUtilisateurResponse[]>([]);
  total = signal(0);
  totalPages = signal(0);
  page = signal(0);
  loading = signal(false);
  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMsg = signal('');
  confirmLabel = signal('Confirmer');
  searchTerm = '';
  private pendingFn?: () => void;

  ngOnInit(): void {
    this.load();
  }

  load(p = 0): void {
    this.loading.set(true);
    const filters = this.searchTerm ? { recherche: this.searchTerm, page: p } : { page: p };
    this.adminApi.getUtilisateurs(filters).subscribe({
      next: (r) => {
        this.users.set(r.data.contenu);
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
    this.confirmMsg.set(
      `${u.nomComplet} ne pourra plus se connecter. Ses annonces seront masquées.`,
    );
    this.confirmLabel.set('Suspendre');
    this.pendingFn = () =>
      this.adminApi
        .suspendreUtilisateur(u.id, 'Suspension administrative')
        .subscribe({ next: () => this.load() });
    this.confirmOpen.set(true);
  }

  doBannir(u: AdminUtilisateurResponse): void {
    this.confirmTitle.set('Bannir définitivement ?');
    this.confirmMsg.set(
      `${u.nomComplet} sera banni définitivement. Toutes ses annonces seront supprimées.`,
    );
    this.confirmLabel.set('Bannir');
    this.pendingFn = () =>
      this.adminApi
        .bannirUtilisateur(u.id, 'Bannissement administratif')
        .subscribe({ next: () => this.load() });
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
    this.adminApi.exportUtilisateursCSV().subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `immocam-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  statusClass(s: string): string {
    return (
      {
        ACTIF: 'bg-emerald-50 text-emerald-700',
        SUSPENDU: 'bg-amber-50 text-amber-700',
        BANNI: 'bg-red-50 text-red-700',
      }[s] ?? 'bg-slate-100 text-slate-600'
    );
  }
  statusDot(s: string): string {
    return (
      { ACTIF: 'bg-emerald-500', SUSPENDU: 'bg-amber-500', BANNI: 'bg-red-500' }[s] ??
      'bg-slate-400'
    );
  }
}
