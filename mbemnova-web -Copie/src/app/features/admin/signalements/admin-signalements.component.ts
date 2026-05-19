import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { SignalementResponse } from '@core/services/models';
import { ToastService } from '@core/services/toast.service';
import { MOTIF_SIGNALEMENT_LABELS } from '@core/services/models';

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
        <select
          [(ngModel)]="filterStatut"
          (change)="load()"
          class="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 outline-none"
        >
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
            <div
              class="bg-white rounded-2xl border shadow-sm p-5"
              [class]="s.statut === 'EN_ATTENTE' ? 'border-red-100' : 'border-slate-100'"
            >
              <div class="flex items-start gap-4">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  [class]="s.statut === 'EN_ATTENTE' ? 'bg-red-50' : 'bg-slate-100'"
                >
                  <span class="text-xl">{{ s.statut === 'EN_ATTENTE' ? '🚨' : '✅' }}</span>
                </div>
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      class="text-xs font-bold px-2 py-0.5 rounded-full"
                      [class]="motifColor(s.motif)"
                    >
                      {{ motifLabel(s.motif) }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class]="
                        s.statut === 'EN_ATTENTE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      "
                    >
                      {{ s.statut === 'EN_ATTENTE' ? 'En attente' : s.statut }}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-slate-800">
                    Annonce: <span class="text-blue-700">{{ s.annonceTitre }}</span>
                  </p>
                  <p class="text-xs text-slate-500">
                    Signalé par <strong>{{ s.auteurPrenom }}</strong> ({{ s.auteurEmail }}) —
                    {{ s.dateSignalement | timeAgo }}
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
                  <button
                    (click)="traiter(s.id, 'IGNORE', 'IGNORER')"
                    class="px-3 py-2 text-xs border border-slate-200 text-slate-600 font-medium
                           rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Ignorer
                  </button>
                  <button
                    (click)="traiter(s.id, 'TRAITE', 'SUPPRIMER_ANNONCE')"
                    class="px-3 py-2 text-xs border border-amber-200 text-amber-700 font-medium
                           rounded-xl hover:bg-amber-50 transition-all"
                  >
                    Supprimer l'annonce
                  </button>
                  <button
                    (click)="traiter(s.id, 'TRAITE', 'SUSPENDRE_PROPRIETAIRE')"
                    class="px-3 py-2 text-xs border border-red-200 text-red-600 font-medium
                           rounded-xl hover:bg-red-50 transition-all"
                  >
                    Suspendre le propriétaire
                  </button>
                  <button
                    (click)="traiter(s.id, 'TRAITE', 'BANNIR_PROPRIETAIRE')"
                    class="px-3 py-2 text-xs bg-red-600 text-white font-medium
                           rounded-xl hover:bg-red-700 transition-all"
                  >
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
  private readonly toast = inject(ToastService);

  signalements = signal<SignalementResponse[]>([]);
  pending = signal(0);
  filterStatut = 'EN_ATTENTE';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminApi.getSignalements(this.filterStatut || undefined).subscribe({
      next: (r) => {
        this.signalements.set(r.data.contenu);
        this.pending.set(r.data.contenu.filter((s: any) => s.statut === 'EN_ATTENTE').length);
      },
    });
  }

  traiter(id: number, statut: any, action: any): void {
    this.adminApi.traiterSignalement(id, { statut, action }).subscribe({
      next: () => {
        this.toast.success('Signalement traité');
        this.load();
      },
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
