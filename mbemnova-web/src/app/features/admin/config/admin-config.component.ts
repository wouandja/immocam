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

type Section = 'parametres' | 'localisations' | 'typesbiens';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { display: block; }

    /* ── Layout racine ── */
    .page {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 20px;
      align-items: start;
    }

    /* ── Sidebar nav ── */
    .sidebar {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
      position: sticky;
      top: 24px;
    }
    .sidebar-header {
      padding: 16px 18px 12px;
      border-bottom: 0.5px solid #F1F5F9;
    }
    .sidebar-header h2 {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .sidebar-header p {
      font-size: 11px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
    .nav-list {
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      border-radius: 9px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      transition: background .12s, color .12s;
      color: #64748B;
    }
    .nav-item:hover { background: #F8FAFC; color: #0F172A; }
    .nav-item.active { background: #EEF2FF; color: #1E2875; }
    .nav-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #F1F5F9;
      transition: background .12s;
    }
    .nav-item.active .nav-icon { background: #C7D2FE; }
    .nav-icon svg { width: 15px; height: 15px; }
    .nav-label { font-size: 13px; font-weight: 500; }
    .nav-item.active .nav-label { font-weight: 600; }

    /* ── Contenu principal ── */
    .content { min-width: 0; }

    /* ── Section card ── */
    .section-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
    }
    .section-head {
      padding: 20px 24px 16px;
      border-bottom: 0.5px solid #F1F5F9;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .section-head-left h3 {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .section-head-left p {
      font-size: 12px;
      color: #94A3B8;
      margin: 3px 0 0;
      line-height: 1.5;
    }

    /* ── Config fields grid ── */
    .fields-grid {
      padding: 20px 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .field-full { grid-column: span 2; }

    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-group label {
      font-size: 11px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .field-group input,
    .field-group textarea {
      height: 38px;
      padding: 0 12px;
      border: 0.5px solid #CBD5E1;
      border-radius: 9px;
      background: #F8FAFC;
      color: #0F172A;
      font-size: 13px;
      outline: none;
      transition: border-color .15s, box-shadow .15s;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    .field-group textarea {
      height: auto;
      padding: 10px 12px;
      resize: vertical;
      line-height: 1.5;
    }
    .field-group input:focus,
    .field-group textarea:focus {
      border-color: #3245D1;
      box-shadow: 0 0 0 3px rgba(50,69,209,.1);
      background: #fff;
    }
    .field-hint { font-size: 11px; color: #94A3B8; margin-top: 2px; }

    /* ── Section footer ── */
    .section-footer {
      padding: 14px 24px;
      border-top: 0.5px solid #F1F5F9;
      background: #FAFBFC;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 38px;
      padding: 0 20px;
      background: #1E2875;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s, transform .1s;
      white-space: nowrap;
    }
    .btn-primary:hover:not(:disabled) { background: #3245D1; }
    .btn-primary:active:not(:disabled) { transform: scale(.97); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary svg { width: 14px; height: 14px; }

    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 38px;
      padding: 0 16px;
      background: #1E2875;
      color: #fff;
      border: none;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .btn-add:hover:not(:disabled) { background: #3245D1; }
    .btn-add:disabled { opacity: .45; cursor: not-allowed; }

    /* ── Add form row ── */
    .add-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      padding: 20px 24px;
      border-bottom: 0.5px solid #F1F5F9;
      flex-wrap: wrap;
    }
    .add-row .field-group { flex: 1; min-width: 120px; }
    .add-row .field-group.narrow { flex: 0 0 100px; }

    /* ── Liste localisations ── */
    .loc-list {
      max-height: 340px;
      overflow-y: auto;
      padding: 8px 12px;
    }
    .loc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-radius: 9px;
      transition: background .1s;
    }
    .loc-item:hover { background: #F8FAFC; }
    .loc-name { font-size: 13px; color: #0F172A; font-weight: 500; }
    .loc-sep { color: #CBD5E1; margin: 0 6px; font-size: 12px; }
    .loc-quartier { font-size: 13px; color: #64748B; }

    .badge-active   { background: #ECFDF5; color: #059669; border: 0.5px solid #A7F3D0; }
    .badge-inactive { background: #FEF2F2; color: #DC2626; border: 0.5px solid #FECACA; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .loc-empty {
      padding: 32px 24px;
      text-align: center;
      font-size: 13px;
      color: #94A3B8;
    }

    /* ── Types de biens ── */
    .types-grid {
      padding: 20px 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .type-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #F8FAFC;
      border: 0.5px solid #E2E8F0;
      border-radius: 20px;
      font-size: 13px;
      color: #0F172A;
      font-weight: 500;
      transition: border-color .12s;
    }
    .type-chip:hover { border-color: #C7D2FE; background: #EEF2FF; color: #1E2875; }
    .type-icone { font-size: 14px; }

    .types-empty {
      padding: 32px 24px;
      text-align: center;
      font-size: 13px;
      color: #94A3B8;
    }

    /* ── Loading skeleton ── */
    .sk-block {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 8px;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* ── Responsive ── */
    @media (max-width: 820px) {
      .page { grid-template-columns: 1fr; }
      .sidebar { position: static; }
      .nav-list { flex-direction: row; padding: 6px; }
      .nav-item { flex: 1; justify-content: center; flex-direction: column; gap: 4px; padding: 8px 6px; }
      .nav-icon { width: 26px; height: 26px; }
      .nav-label { font-size: 11px; }
      .fields-grid { grid-template-columns: 1fr; }
      .field-full { grid-column: span 1; }
    }
    @media (max-width: 560px) {
      .add-row { flex-direction: column; }
      .add-row .field-group,
      .add-row .field-group.narrow { flex: 1; min-width: 0; width: 100%; }
      .btn-add { width: 100%; justify-content: center; }
    }
  `],
  template: `
    <div class="page">

      <!-- ── Sidebar ── -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Configuration</h2>
          <p>Paramètres système</p>
        </div>
        <nav class="nav-list">

          <button
            class="nav-item"
            [class.active]="activeSection === 'parametres'"
            (click)="activeSection = 'parametres'"
          >
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0
                  1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0
                  0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65
                  1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65
                  1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1
                  0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2
                  2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0
                  0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65
                  0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0
                  0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65
                  1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            <span class="nav-label">Paramètres</span>
          </button>

          <button
            class="nav-item"
            [class.active]="activeSection === 'localisations'"
            (click)="activeSection = 'localisations'"
          >
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
              </svg>
            </span>
            <span class="nav-label">Localisations</span>
          </button>

          <button
            class="nav-item"
            [class.active]="activeSection === 'typesbiens'"
            (click)="activeSection = 'typesbiens'"
          >
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                <polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span class="nav-label">Types de biens</span>
          </button>

        </nav>
      </aside>

      <!-- ── Contenu ── -->
      <div class="content">

        <!-- ════ SECTION : Paramètres ════ -->
        @if (activeSection === 'parametres') {
          <div class="section-card">
            <div class="section-head">
              <div class="section-head-left">
                <h3>Paramètres des annonces</h3>
                <p>Durées, limites et messages système appliqués à toutes les annonces.</p>
              </div>
            </div>

            @if (!config()) {
              <!-- Skeleton -->
              <div class="fields-grid">
                @for (i of skeletons6; track i) {
                  <div class="field-group">
                    <div class="sk-block" style="height:12px;width:50%;margin-bottom:8px"></div>
                    <div class="sk-block" style="height:38px"></div>
                  </div>
                }
                <div class="field-group field-full">
                  <div class="sk-block" style="height:12px;width:40%;margin-bottom:8px"></div>
                  <div class="sk-block" style="height:72px"></div>
                </div>
              </div>
            } @else {
              <div class="fields-grid">
                @for (field of numericFields; track field.key) {
                  <div class="field-group">
                    <label [for]="'cfg-' + field.key">{{ field.label }}</label>
                    <input
                      [id]="'cfg-' + field.key"
                      type="number"
                      [(ngModel)]="config()![field.key]"
                      [min]="field.min ?? 0"
                    />
                    @if (field.hint) {
                      <span class="field-hint">{{ field.hint }}</span>
                    }
                  </div>
                }
                <div class="field-group field-full">
                  <label for="cfg-wa">Message WhatsApp par défaut</label>
                  <textarea
                    id="cfg-wa"
                    [(ngModel)]="config()!.messageWhatsappDefaut"
                    rows="3"
                  ></textarea>
                  <span class="field-hint">Variables disponibles : &#123;type&#125; &#123;quartier&#125; &#123;ville&#125; &#123;prix&#125;</span>
                </div>
              </div>

              <div class="section-footer">
                <button class="btn-primary" (click)="saveConfig()" [disabled]="saving()">
                  @if (saving()) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
                               M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Enregistrement...
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline stroke-linecap="round" stroke-linejoin="round" points="17 21 17 13 7 13 7 21"/>
                      <polyline stroke-linecap="round" stroke-linejoin="round" points="7 3 7 8 15 8"/>
                    </svg>
                    Enregistrer les modifications
                  }
                </button>
              </div>
            }
          </div>
        }

        <!-- ════ SECTION : Localisations ════ -->
        @if (activeSection === 'localisations') {
          <div class="section-card">
            <div class="section-head">
              <div class="section-head-left">
                <h3>Localisations</h3>
                <p>Villes et quartiers disponibles lors de la création d'une annonce.</p>
              </div>
            </div>

            <!-- Formulaire ajout -->
            <div class="add-row">
              <div class="field-group">
                <label for="new-ville">Ville</label>
                <input
                  id="new-ville"
                  type="text"
                  [(ngModel)]="newVille"
                  placeholder="ex : Douala"
                />
              </div>
              <div class="field-group">
                <label for="new-quartier">Quartier</label>
                <input
                  id="new-quartier"
                  type="text"
                  [(ngModel)]="newQuartier"
                  placeholder="ex : Bonamoussadi"
                />
              </div>
              <button
                class="btn-add"
                (click)="addLocalisation()"
                [disabled]="!newVille.trim()"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
                </svg>
                Ajouter
              </button>
            </div>

            <!-- Liste -->
            @if (localisations().length === 0) {
              <p class="loc-empty">Aucune localisation enregistrée.</p>
            } @else {
              <div class="loc-list">
                @for (l of localisations(); track l.id) {
                  <div class="loc-item">
                    <span>
                      <span class="loc-name">{{ l.ville }}</span>
                      <span class="loc-sep">—</span>
                      <span class="loc-quartier">{{ l.quartier }}</span>
                    </span>
                    <span
                      class="status-badge"
                      [class.badge-active]="l.active"
                      [class.badge-inactive]="!l.active"
                    >
                      {{ l.active ? 'Actif' : 'Inactif' }}
                    </span>
                  </div>
                }
              </div>
            }
            <div style="padding:16px 24px;border-top:0.5px solid #F1F5F9;">
              <p style="font-size:12px;color:#64748B;margin:0 0 10px;">Quartiers detectes dans les annonces (groupes par ville)</p>
              @if (cityKeys().length === 0) {
                <p class="loc-empty" style="padding:8px 0 0;text-align:left;">Aucun quartier detecte.</p>
              } @else {
                @for (ville of cityKeys(); track ville) {
                  <div style="margin-bottom:10px;">
                    <div style="font-size:12px;font-weight:700;color:#0F172A;">{{ ville }}</div>
                    <div style="font-size:12px;color:#64748B;line-height:1.6;">{{ quartiersParVille()[ville].join(', ') }}</div>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- ════ SECTION : Types de biens ════ -->
        @if (activeSection === 'typesbiens') {
          <div class="section-card">
            <div class="section-head">
              <div class="section-head-left">
                <h3>Types de biens</h3>
                <p>Catégories disponibles lors de la publication d'une annonce.</p>
              </div>
            </div>

            <!-- Formulaire ajout -->
            <div class="add-row">
              <div class="field-group">
                <label for="new-type-nom">Nom du type</label>
                <input
                  id="new-type-nom"
                  type="text"
                  [(ngModel)]="newTypeBienNom"
                  placeholder="ex : Duplex"
                />
              </div>
              <div class="field-group narrow">
                <label for="new-type-icone">Icone</label>
                <input
                  id="new-type-icone"
                  type="text"
                  [(ngModel)]="newTypeBienIcone"
                  placeholder="ex : 🏠"
                />
              </div>
              <button
                class="btn-add"
                (click)="addTypeBien()"
                [disabled]="!newTypeBienNom.trim()"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
                </svg>
                Ajouter
              </button>
            </div>

            <!-- Chips -->
            @if (typesBiens().length === 0) {
              <p class="types-empty">Aucun type de bien enregistré.</p>
            } @else {
              <div class="types-grid">
                @for (t of typesBiens(); track t.id) {
                  <span class="type-chip">
                    @if (t.icone) {
                      <span class="type-icone">{{ t.icone }}</span>
                    }
                    {{ t.libelle }}
                  </span>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
})
export class AdminConfigComponent implements OnInit {
  private readonly adminApi    = inject(AdminApi);
  private readonly locApi      = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly toast       = inject(ToastService);

  // ── State ─────────────────────────────────────────────────────────────
  config       = signal<ConfigSystemeResponse | null>(null);
  localisations = signal<LocalisationResponse[]>([]);
  typesBiens    = signal<TypeBienResponse[]>([]);
  quartiersParVille = signal<Record<string, string[]>>({});
  saving        = signal(false);

  activeSection: Section = 'parametres';

  newVille        = '';
  newQuartier     = '';
  newTypeBienNom  = '';
  newTypeBienIcone = '';

  readonly skeletons6 = Array(6).fill(0);

  // ── Champs numériques (sans le textarea WhatsApp) ─────────────────────
  readonly numericFields: {
    key: keyof ConfigSystemeResponse;
    label: string;
    hint?: string;
    min?: number;
  }[] = [
    {
      key: 'dureeVieAnnonce',
      label: 'Durée de vie annonce (jours)',
      hint: 'Nombre de jours avant expiration automatique',
      min: 1,
    },
    {
      key: 'maxAnnoncesParProprietaire',
      label: 'Max annonces par propriétaire',
      min: 1,
    },
    {
      key: 'maxPhotosParAnnonce',
      label: 'Max photos par annonce',
      min: 1,
    },
    {
      key: 'joursRappelExpiration',
      label: 'Rappel avant expiration (jours)',
      hint: 'Envoi de la notification J−X avant expiration',
      min: 0,
    },
    {
      key: 'joursSuppressionDefinitive',
      label: 'Suppression définitive (jours)',
      hint: 'Délai après expiration avant suppression définitive',
      min: 0,
    },
    {
      key: 'rateLimit',
      label: 'Rate limit (requêtes / minute)',
      min: 1,
    },
  ];

  // ── Cycle de vie ──────────────────────────────────────────────────────
  ngOnInit(): void {
    this.adminApi.getConfig().subscribe({ next: (r) => this.config.set(r.data) });
    this.locApi.getAll(false).subscribe({ next: (r) => this.localisations.set(r.data) });
    this.typeBienApi.getAll().subscribe({ next: (r) => this.typesBiens.set(r.data) });
    this.adminApi.getAnnonces({ page: 0, size: 500 }).subscribe({
      next: (r) => {
        const map: Record<string, Set<string>> = {};
        for (const a of r.data.contenu ?? []) {
          if (!a.ville || !a.quartier) continue;
          if (!map[a.ville]) map[a.ville] = new Set<string>();
          map[a.ville].add(a.quartier);
        }
        const out: Record<string, string[]> = {};
        Object.keys(map).sort().forEach((ville) => {
          out[ville] = Array.from(map[ville]).sort((x, y) => x.localeCompare(y));
        });
        this.quartiersParVille.set(out);
      },
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────
  saveConfig(): void {
    if (!this.config()) return;
    this.saving.set(true);
    const c = this.config()!;
    const entries: Array<[string, string | number | boolean]> = [
      ['dureeVieAnnonce', c.dureeVieAnnonce],
      ['joursRappelExpiration', c.joursRappelExpiration],
      ['joursSuppressionDefinitive', c.joursSuppressionDefinitive],
      ['maxPhotosParAnnonce', c.maxPhotosParAnnonce],
      ['maxAnnoncesParProprietaire', c.maxAnnoncesParProprietaire],
      ['rateLimit', c.rateLimit],
      ['messageWhatsappDefaut', c.messageWhatsappDefaut],
    ];
    let pending = entries.length;
    entries.forEach(([cle, valeur]) => {
      this.adminApi.updateConfigByKey(cle, valeur).subscribe({
        next: () => {
          pending--;
          if (pending === 0) {
            this.saving.set(false);
            this.toast.success('Configuration sauvegardee');
          }
        },
        error: () => this.saving.set(false),
      });
    });
  }

  addLocalisation(): void {
    const ville    = this.newVille.trim();
    if (!ville) return;
    this.adminApi.creerVille(ville).subscribe({
      next: () => {
        this.toast.success('Localisation ajoutée');
        this.newVille    = '';
        this.newQuartier = '';
        this.locApi.getAll(false).subscribe({ next: (r) => this.localisations.set(r.data) });
      },
    });
  }

  addTypeBien(): void {
    const libelle = this.newTypeBienNom.trim();
    if (!libelle) return;
    this.adminApi
      .ajouterTypeBien({ libelle })
      .subscribe({
        next: () => {
          this.toast.success('Type de bien ajouté');
          this.newTypeBienNom   = '';
          this.newTypeBienIcone = '';
          this.typeBienApi.getAll().subscribe({ next: (r) => this.typesBiens.set(r.data) });
        },
      });
  }

  cityKeys(): string[] {
    return Object.keys(this.quartiersParVille());
  }
}
