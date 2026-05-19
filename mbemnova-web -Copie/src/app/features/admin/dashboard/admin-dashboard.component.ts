import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '@core/services/api/admin.api';
import { AdminDashboardResponse, ChartDataPoint } from '@core/services/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <!-- État erreur — visible pour diagnostiquer -->
      <div class="flex flex-col items-center justify-center py-24 gap-4">
        <span class="text-4xl">⚠️</span>
        <p class="text-slate-700 font-semibold">Impossible de charger le dashboard</p>
        <p class="text-sm text-red-500 font-mono bg-red-50 px-4 py-2 rounded-xl">{{ error() }}</p>
        <button
          (click)="reload()"
          class="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl hover:bg-blue-800"
        >
          Réessayer
        </button>
      </div>
    } @else if (data()) {
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

        <!-- Signalements alert -->
        @if (data()!.signalEmentsNonTraites > 0) {
          <div class="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🚨</span>
              <div>
                <p class="font-semibold text-red-800">{{ data()!.signalEmentsNonTraites }} signalement(s) en attente</p>
                <p class="text-red-600 text-sm">Nécessitent votre attention</p>
              </div>
            </div>
            <a routerLink="/admin/signalements"
               class="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 transition-all">
              Traiter
            </a>
          </div>
        }

        <!-- Graphiques -->
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Visites — 7 derniers jours</h3>
            <div class="flex items-end gap-1 h-32">
              @for (pt of data()!.evolutionVisites; track pt.date) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full bg-blue-900 rounded-t-sm transition-all hover:bg-blue-700"
                       [style.height.%]="barHeight(pt.valeur, data()!.evolutionVisites)"
                       [title]="pt.valeur + ' visites'"></div>
                  <span class="text-xs text-slate-400">{{ formatDay(pt.date) }}</span>
                </div>
              }
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Contacts WhatsApp — 7 jours</h3>
            <div class="flex items-end gap-1 h-32">
              @for (pt of data()!.evolutionContacts; track pt.date) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full bg-green-500 rounded-t-sm transition-all hover:bg-green-400"
                       [style.height.%]="barHeight(pt.valeur, data()!.evolutionContacts)"
                       [title]="pt.valeur + ' contacts'"></div>
                  <span class="text-xs text-slate-400">{{ formatDay(pt.date) }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Rankings -->
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">🏆 Villes les plus actives</h3>
            <div class="space-y-3">
              @for (v of data()!.villesActives; track v.ville; let i = $index) {
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{{ i + 1 }}</span>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="text-sm font-medium text-slate-700">{{ v.ville }}</span>
                      <span class="text-xs text-slate-500">{{ v.nombreAnnonces }} annonces</span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-900 rounded-full transition-all"
                           [style.width.%]="rankPct(v.nombreAnnonces, data()!.villesActives[0].nombreAnnonces)"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">🏠 Types de biens populaires</h3>
            <div class="space-y-3">
              @for (t of data()!.typesBiensPopulaires; track t.typeBien; let i = $index) {
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{{ i + 1 }}</span>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="text-sm font-medium text-slate-700">{{ t.typeBien }}</span>
                      <span class="text-xs text-slate-500">{{ t.nombreAnnonces }}</span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full"
                           [style.width.%]="rankPct(t.nombreAnnonces, data()!.typesBiensPopulaires[0].nombreAnnonces)"></div>
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
  error   = signal<string | null>(null); // ← nouveau

  ngOnInit(): void {
    this.load();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.load();
  }

  private load(): void {
    this.adminApi.getDashboard().subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.loading.set(false);
      },
      error: (err) => {
        // Affiche le vrai message d'erreur pour diagnostiquer
        this.error.set(
          err?.error?.message ??
          `HTTP ${err?.status ?? '?'} — ${err?.statusText ?? 'Erreur inconnue'}`
        );
        this.loading.set(false);
      },
    });
  }

  kpis = () => {
    const d = this.data();
    if (!d) return [];
    return [
      { icon: '👥', label: 'Visites totales',        value: d.visitesTotales.toLocaleString('fr'), sub: d.visitesTotales7j,  change: undefined },
      { icon: '🏠', label: 'Annonces actives',        value: d.annoncesActives,                     sub: d.nouvellesAnnonces, change: d.nouvellesAnnonces },
      { icon: '📱', label: 'Contacts WhatsApp',       value: d.contactsWhatsapp.toLocaleString('fr'),sub: d.contactsWhatsapp7j,change: undefined },
      { icon: '🔴', label: 'Signalements en attente', value: d.signalEmentsNonTraites,               sub: undefined,           change: d.signalEmentsNonTraites > 0 ? -d.signalEmentsNonTraites : 0 },
    ];
  };

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