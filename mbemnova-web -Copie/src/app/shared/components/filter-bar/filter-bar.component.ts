import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnonceFilters, LocalisationResponse, TypeBienResponse } from '@core/services/models';
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
          <select
            [(ngModel)]="filters.ville"
            (change)="onVilleChange()"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                   focus:ring-blue-100 focus:bg-white transition-all outline-none"
          >
            <option value="">📍 Toutes les villes</option>
            @for (v of villes; track v) {
              <option [value]="v">{{ v }}</option>
            }
          </select>
        </div>
        <!-- Quartier -->
        <div class="col-span-2 sm:col-span-1">
          <select
            [(ngModel)]="filters.localisationId"
            [disabled]="!filters.ville || loadingQuartiers"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 disabled:opacity-50 focus:border-blue-500
                   focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          >
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
          <select
            [(ngModel)]="filters.typeBienId"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                   focus:ring-blue-100 transition-all outline-none"
          >
            <option [value]="undefined">🏠 Tous les types</option>
            @for (t of typesBiens; track t.id) {
              <option [value]="t.id">{{ t.nom }}</option>
            }
          </select>
        </div>
        <!-- Prix max -->
        <div>
          <input
            type="number"
            [(ngModel)]="filters.prixMax"
            placeholder="Prix max (FCFA)"
            class="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50
                   text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                   focus:ring-blue-100 transition-all outline-none"
            min="0"
            step="5000"
          />
        </div>
      </div>
      <!-- Mot-clé + Boutons -->
      <div class="flex gap-3 mt-3">
        <input
          type="text"
          [(ngModel)]="filters.motCle"
          placeholder="🔍 Mot-clé..."
          class="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50
                 text-sm text-slate-700 focus:border-blue-500 focus:ring-2
                 focus:ring-blue-100 transition-all outline-none"
          (keyup.enter)="search()"
        />
        <button
          (click)="search()"
          class="px-6 h-11 bg-blue-900 text-white text-sm font-semibold rounded-xl
                 hover:bg-blue-800 transition-colors active:scale-95 whitespace-nowrap"
        >
          Rechercher
        </button>
        @if (hasActiveFilters) {
          <button
            (click)="reset()"
            class="px-4 h-11 border border-slate-200 text-slate-500 text-sm rounded-xl
                   hover:bg-slate-50 transition-colors"
          >
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
  @Output() filtersReset = new EventEmitter<void>();

  private readonly locApi = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);

  filters: AnnonceFilters = {};
  villes: string[] = [];
  quartiers: LocalisationResponse[] = [];
  typesBiens: TypeBienResponse[] = [];
  loadingQuartiers = false;

  ngOnInit(): void {
    this.filters = { ...this.initialFilters };
    this.locApi.getVilles().subscribe((r) => (this.villes = r.data));
    this.typeBienApi.getAll().subscribe((r) => (this.typesBiens = r.data));
  }

  onVilleChange(): void {
    this.filters.localisationId = undefined;
    this.quartiers = [];
    if (!this.filters.ville) return;
    // this.loadingQuartiers = true;
    // // this.locApi.getQuartiers(this.filters.ville).subscribe(r => {
    // //   this.quartiers = r.data;
    //   this.loadingQuartiers = false;
    // });
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filters.ville ||
      this.filters.typeBienId ||
      this.filters.prixMax ||
      this.filters.motCle
    );
  }

  search(): void {
    this.filtersChanged.emit({ ...this.filters, page: 0 });
  }
  reset(): void {
    this.filters = {};
    this.quartiers = [];
    this.filtersReset.emit();
  }
}
