import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { ToastService } from '@core/services/toast.service';
import {
  ConfigSystemeResponse,
  LocalisationResponse,
  TypeBienResponse,
} from '@core/services/models';

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
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{
                  field.label
                }}</label>
                @if (field.type === 'textarea') {
                  <textarea
                    [(ngModel)]="config()![field.key]"
                    rows="3"
                    class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  >
                  </textarea>
                } @else {
                  <input
                    [type]="field.type"
                    [(ngModel)]="config()![field.key]"
                    class="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                }
                @if (field.hint) {
                  <p class="text-xs text-slate-400 mt-1">{{ field.hint }}</p>
                }
              </div>
            }
          </div>
          <button
            (click)="saveConfig()"
            [disabled]="saving()"
            class="mt-5 px-6 py-2.5 bg-blue-900 text-white font-semibold text-sm rounded-xl
                   hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-95"
          >
            {{ saving() ? 'Enregistrement...' : '💾 Enregistrer' }}
          </button>
        </div>

        <!-- Villes & Quartiers -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="font-semibold text-slate-800 mb-4">📍 Ajouter une localisation</h3>
          <div class="flex gap-3">
            <input
              [(ngModel)]="newVille"
              placeholder="Ville"
              type="text"
              class="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"
            />
            <input
              [(ngModel)]="newQuartier"
              placeholder="Quartier"
              type="text"
              class="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"
            />
            <button
              (click)="addLocalisation()"
              [disabled]="!newVille || !newQuartier"
              class="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl
                     hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              + Ajouter
            </button>
          </div>
          <div class="mt-4 space-y-1 max-h-40 overflow-y-auto">
            @for (l of localisations(); track l.id) {
              <div
                class="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm"
              >
                <span class="text-slate-700">{{ l.ville }} — {{ l.quartier }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  [class]="l.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'"
                >
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
            <input
              [(ngModel)]="newTypeBienNom"
              placeholder="Nom (ex: Duplex)"
              type="text"
              class="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"
            />
            <input
              [(ngModel)]="newTypeBienIcone"
              placeholder="Icône (ex: 🏠)"
              type="text"
              class="w-24 h-10 px-3 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 outline-none"
            />
            <button
              (click)="addTypeBien()"
              [disabled]="!newTypeBienNom"
              class="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-xl
                     hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              + Ajouter
            </button>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            @for (t of typesBiens(); track t.id) {
              <span
                class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-700"
              >
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
  private readonly adminApi = inject(AdminApi);
  private readonly locApi = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly toast = inject(ToastService);

  config = signal<ConfigSystemeResponse | null>(null);
  localisations = signal<LocalisationResponse[]>([]);
  typesBiens = signal<TypeBienResponse[]>([]);
  saving = signal(false);
  newVille = '';
  newQuartier = '';
  newTypeBienNom = '';
  newTypeBienIcone = '';

  configFields = [
    {
      key: 'dureeVieAnnonce',
      label: 'Durée de vie annonce (jours)',
      type: 'number',
      hint: 'Affiché publiquement',
    },
    {
      key: 'maxAnnoncesParProprietaire',
      label: 'Max annonces par propriétaire',
      type: 'number',
      hint: '',
    },
    { key: 'maxPhotosParAnnonce', label: 'Max photos par annonce', type: 'number', hint: '' },
    {
      key: 'joursRappelExpiration',
      label: 'Rappel avant expiration (jours)',
      type: 'number',
      hint: 'J-X',
    },
    {
      key: 'joursSuppressionDefinitive',
      label: 'Suppression définitive (jours après expiration)',
      type: 'number',
      hint: 'J+X',
    },
    { key: 'rateLimit', label: 'Rate limit (req/min)', type: 'number', hint: '' },
    {
      key: 'messageWhatsappDefaut',
      label: 'Message WhatsApp par défaut',
      type: 'textarea',
      hint: 'Variables: {type} {quartier} {ville} {prix}',
    },
  ] as const;

  ngOnInit(): void {
    this.adminApi.getConfig().subscribe({ next: (r) => this.config.set(r.data) });
    this.locApi.getAll(false).subscribe({ next: (r) => this.localisations.set(r.data) });
    this.typeBienApi.getAll().subscribe({ next: (r) => this.typesBiens.set(r.data) });
  }

  saveConfig(): void {
    if (!this.config()) return;
    this.saving.set(true);
    this.adminApi.updateConfig(this.config()!).subscribe({
      next: (r) => {
        this.config.set(r.data);
        this.saving.set(false);
        this.toast.success('Configuration sauvegardée !');
      },
      error: () => this.saving.set(false),
    });
  }

  addLocalisation(): void {
    if (!this.newVille || !this.newQuartier) return;
    this.adminApi
      .ajouterLocalisation({ ville: this.newVille, quartier: this.newQuartier })
      .subscribe({
        next: () => {
          this.toast.success('Localisation ajoutée');
          this.newVille = '';
          this.newQuartier = '';
          this.locApi.getAll(false).subscribe({ next: (r) => this.localisations.set(r.data) });
        },
      });
  }

  addTypeBien(): void {
    if (!this.newTypeBienNom) return;
    this.adminApi
      .ajouterTypeBien({ nom: this.newTypeBienNom, icone: this.newTypeBienIcone || undefined })
      .subscribe({
        next: () => {
          this.toast.success('Type de bien ajouté');
          this.newTypeBienNom = '';
          this.newTypeBienIcone = '';
          this.typeBienApi.getAll().subscribe({ next: (r) => this.typesBiens.set(r.data) });
        },
      });
  }
}
