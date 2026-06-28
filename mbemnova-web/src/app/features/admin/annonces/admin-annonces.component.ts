import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '@core/services/api/admin.api';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AnnonceListResponse } from '@core/services/models';

type ViewMode = 'table' | 'card';

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
  styles: [`
    :host { display: block; }

    /* ── Topbar ── */
    .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .topbar-left h2 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.4px;
      color: #0F172A;
      margin: 0;
    }
    .topbar-left p { font-size: 13px; color: #64748B; margin: 3px 0 0; }
    .topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* ── View toggle ── */
    .view-toggle {
      display: flex;
      background: #F1F5F9;
      border-radius: 10px;
      padding: 3px;
      gap: 2px;
    }
    .btn-view {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 12px;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      color: #64748B;
      background: transparent;
      transition: all .15s;
    }
    .btn-view.active { background: #fff; color: #0F172A; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .btn-view svg { width: 15px; height: 15px; flex-shrink: 0; }

    /* ── Export ── */
    .btn-export {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 16px;
      height: 38px;
      background: #1E2875;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s, transform .1s;
      white-space: nowrap;
      font-family: inherit;
    }
    .btn-export:hover { background: #3245D1; }
    .btn-export:active { transform: scale(.97); }

    /* ── Filter bar ── */
    .filters {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 14px 16px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 2fr auto;
      gap: 10px;
      align-items: end;
      margin-bottom: 20px;
    }
    .filter-group { display: flex; flex-direction: column; gap: 5px; }
    .filter-group label {
      font-size: 11px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .filter-group select,
    .filter-group input {
      height: 36px;
      padding: 0 12px;
      border: 0.5px solid #CBD5E1;
      border-radius: 8px;
      background: #F8FAFC;
      color: #0F172A;
      font-size: 13px;
      outline: none;
      transition: border-color .15s;
      font-family: inherit;
    }
    .filter-group select:focus,
    .filter-group input:focus {
      border-color: #3245D1;
      box-shadow: 0 0 0 3px rgba(50,69,209,.1);
    }
    .btn-reset {
      height: 36px;
      padding: 0 14px;
      border: 0.5px solid #E2E8F0;
      border-radius: 8px;
      background: #F8FAFC;
      color: #64748B;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all .12s;
      white-space: nowrap;
    }
    .btn-reset:hover { background: #F1F5F9; border-color: #94A3B8; color: #0F172A; }

    /* ── Active filter chips ── */
    .active-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .filter-label { font-size: 12px; color: #94A3B8; font-weight: 500; }
    .chip {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px 3px 8px;
      background: #EEF2FF;
      border: 0.5px solid #C7D2FE;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: #4338CA;
    }
    .chip-remove {
      width: 14px; height: 14px;
      display: flex; align-items: center; justify-content: center;
      background: #C7D2FE;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      font-family: inherit;
      flex-shrink: 0;
      line-height: 1;
      padding: 0;
      color: #4338CA;
    }
    .chip-remove:hover { background: #A5B4FC; }

    /* ── Results bar ── */
    .results-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .results-count { font-size: 13px; color: #64748B; }
    .results-count strong { color: #0F172A; font-weight: 700; }

    /* ── TABLE VIEW ── */
    .table-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
    }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; border-collapse: collapse; min-width: 560px; }
    thead tr { background: #F8FAFC; border-bottom: 0.5px solid #E2E8F0; }
    thead th {
      padding: 10px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: .06em;
      white-space: nowrap;
    }
    tbody tr { border-bottom: 0.5px solid #F1F5F9; transition: background .1s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #F5F6FF; }
    td { padding: 12px 16px; vertical-align: middle; }

    /* Skeleton row */
    .skeleton-row td { padding: 12px 16px; }
    .skeleton-cell {
      height: 14px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .skeleton-thumb {
      width: 40px; height: 40px;
      border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      flex-shrink: 0;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    .annonce-cell { display: flex; align-items: center; gap: 12px; }
    .thumb {
      width: 40px; height: 40px;
      border-radius: 8px;
      overflow: hidden;
      background: #F1F5F9;
      flex-shrink: 0;
    }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .annonce-name { font-size: 13px; font-weight: 600; color: #0F172A; line-height: 1.3; }
    .annonce-loc { font-size: 12px; color: #94A3B8; margin-top: 2px; }
    .prix { font-size: 13px; font-weight: 700; color: #1E2875; letter-spacing: -.01em; }
    .vues { font-size: 13px; font-weight: 500; color: #64748B; }
    .date { font-size: 12px; color: #475569; }

    /* ── CARD VIEW ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .annonce-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
      transition: box-shadow .15s, border-color .15s;
    }
    .annonce-card:hover { border-color: #C7D2FE; box-shadow: 0 4px 16px rgba(50,69,209,.08); }

    .card-thumb {
      width: 100%;
      height: 140px;
      background: #F1F5F9;
      overflow: hidden;
      position: relative;
    }
    .card-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .card-thumb img.loaded { opacity: 1; }

    /* Skeleton par-dessus l'image avant chargement */
    .thumb-skeleton {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      pointer-events: none;
    }
    .card-thumb img.loaded ~ .thumb-skeleton { display: none; }

    .card-thumb-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: #CBD5E1;
    }
    .card-badge { position: absolute; top: 10px; right: 10px; }
    .card-body { padding: 14px 16px; }
    .card-title { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 3px; }
    .card-loc { font-size: 12px; color: #94A3B8; margin: 0 0 12px; display: flex; align-items: center; gap: 4px; }
    .card-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .card-prix { font-size: 15px; font-weight: 800; color: #1E2875; letter-spacing: -.02em; }
    .card-vues { font-size: 12px; color: #94A3B8; display: flex; align-items: center; gap: 4px; }
    .card-date { font-size: 11px; color: #94A3B8; margin-bottom: 12px; }
    .card-actions {
      display: flex;
      gap: 6px;
      padding-top: 12px;
      border-top: 0.5px solid #F1F5F9;
    }
    .card-actions .btn-act { flex: 1; justify-content: center; }

    /* Skeleton carte */
    .card-skeleton {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
    }
    .sk-img {
      width: 100%; height: 140px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .sk-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
    .sk-line {
      height: 13px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .sk-line.w60 { width: 60%; }
    .sk-line.w80 { width: 80%; }
    .sk-line.w40 { width: 40%; }

    /* ── Action buttons ── */
    .actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .btn-act {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 30px;
      padding: 0 11px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 0.5px solid;
      transition: all .12s;
      white-space: nowrap;
      font-family: inherit;
      text-decoration: none;
    }
    .btn-act svg { width: 13px; height: 13px; flex-shrink: 0; }
    .btn-act:active { transform: scale(.96); }
    .btn-see   { background: transparent; border-color: #CBD5E1; color: #475569; }
    .btn-see:hover { background: #F1F5F9; border-color: #94A3B8; color: #0F172A; }
    .btn-pause { background: transparent; border-color: #FDE68A; color: #D97706; }
    .btn-pause:hover { background: #FFFBEB; border-color: #F59E0B; }
    .btn-del   { background: transparent; border-color: #FCA5A5; color: #DC2626; }
    .btn-del:hover { background: #FEF2F2; border-color: #F87171; }

    /* ── Empty state ── */
    .empty-state {
      padding: 64px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 12px;
    }
    .empty-icon {
      width: 64px; height: 64px;
      background: #F1F5F9;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .empty-title { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; }
    .empty-sub { font-size: 13px; color: #94A3B8; max-width: 320px; line-height: 1.6; margin: 0; }
    .btn-empty-reset {
      margin-top: 8px;
      padding: 8px 20px;
      background: #1E2875;
      color: #fff;
      border: none;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s;
    }
    .btn-empty-reset:hover { background: #3245D1; }

    /* ── Pagination ── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 0.5px solid #E2E8F0;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pg-info { font-size: 12px; color: #94A3B8; flex-shrink: 0; }
    .pg-info strong { color: #475569; font-weight: 600; }
    .pg-numbers { display: flex; align-items: center; gap: 4px; }
    .btn-pg {
      display: flex; align-items: center; justify-content: center;
      min-width: 32px; height: 32px;
      padding: 0 8px;
      border-radius: 8px;
      border: 0.5px solid #E2E8F0;
      background: transparent;
      color: #475569;
      font-size: 13px; font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all .12s;
    }
    .btn-pg:hover:not(:disabled):not(.active) { background: #F8FAFC; border-color: #94A3B8; color: #0F172A; }
    .btn-pg.active { background: #1E2875; border-color: #1E2875; color: #fff; }
    .btn-pg:active:not(:disabled) { transform: scale(.97); }
    .btn-pg:disabled { opacity: .35; cursor: not-allowed; }
    .pg-ellipsis { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; font-size: 13px; color: #94A3B8; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .filters { grid-template-columns: 1fr 1fr; }
      .filter-group:nth-child(4) { grid-column: span 2; }
      .cards-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 560px) {
      .topbar { flex-direction: column; gap: 10px; }
      .topbar-right { width: 100%; }
      .btn-export { flex: 1; justify-content: center; }
      .filters { grid-template-columns: 1fr; }
      .filter-group:nth-child(3),
      .filter-group:nth-child(4) { grid-column: span 1; }
      .cards-grid { grid-template-columns: 1fr; }
    }
    .admin-pause-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      margin-left: 6px;
      font-size: 10px;
      font-weight: 600;
      color: #B45309;
      background: #FEF3C7;
      border-radius: 6px;
      padding: 2px 6px;
      vertical-align: middle;
    }
  `],
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

    <!-- Topbar -->
    <div class="topbar">
      <div class="topbar-left">
        <h2>Gestion des annonces</h2>
        <p>{{ total() }} annonce(s) au total</p>
      </div>
      <div class="topbar-right">
        <div class="view-toggle" role="group" aria-label="Mode d'affichage">
          <button class="btn-view" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')" aria-label="Vue tableau">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="1" width="14" height="3" rx="1"/>
              <rect x="1" y="6" width="14" height="3" rx="1"/>
              <rect x="1" y="11" width="14" height="3" rx="1"/>
            </svg>
            Tableau
          </button>
          <button class="btn-view" [class.active]="viewMode() === 'card'" (click)="viewMode.set('card')" aria-label="Vue cartes">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="1" width="6" height="6" rx="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5"/>
            </svg>
            Cartes
          </button>
        </div>

        <button class="btn-export" (click)="exportPDF()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 1v8M4 6l3 3 3-3M1 10v1.5A1.5 1.5 0 002.5 13h9A1.5 1.5 0 0013 11.5V10"/>
          </svg>
          Export PDF
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters">
      <div class="filter-group">
        <label for="f-statut">Statut</label>
        <select id="f-statut" [(ngModel)]="filters.statut" (change)="onFilterChange()">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="EN_PAUSE">En pause</option>
          <option value="EXPIREE">Expirée</option>
          <option value="ARCHIVEE">Archivée</option>
          <option value="SUPPRIMEE">Supprimée</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="f-ville">Ville</label>
        <select id="f-ville" [(ngModel)]="filters.ville" (change)="onVilleChange()">
          <option value="">Toutes les villes</option>
          @for (v of villes(); track v) {
            <option [value]="v">{{ v }}</option>
          }
        </select>
      </div>
      <div class="filter-group">
        <label for="f-quartier">Quartier</label>
        <select id="f-quartier" [(ngModel)]="filters.quartier" (change)="onFilterChange()">
          <option value="">Tous les quartiers</option>
          @for (q of quartiers(); track q) {
            <option [value]="q">{{ q }}</option>
          }
        </select>
      </div>
      <div class="filter-group">
        <label for="f-search">Recherche</label>
        <input
          id="f-search"
          [(ngModel)]="searchTerm"
          (keyup.enter)="onFilterChange()"
          (input)="onSearchInput()"
          placeholder="Propriétaire, ville, type de bien…"
        />
      </div>
      <button class="btn-reset" (click)="resetFilters()" [style.opacity]="hasActiveFilters() ? '1' : '.45'">
        Réinitialiser
      </button>
    </div>

    <!-- Chips filtres actifs -->
    @if (hasActiveFilters()) {
      <div class="active-filters">
        <span class="filter-label">Filtres :</span>
        @if (filters.statut) {
          <span class="chip">
            {{ filters.statut }}
            <button class="chip-remove" (click)="removeFilter('statut')" aria-label="Retirer filtre statut">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
              </svg>
            </button>
          </span>
        }
        @if (filters.ville) {
          <span class="chip">
            {{ filters.ville }}
            <button class="chip-remove" (click)="removeFilter('ville')" aria-label="Retirer filtre ville">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
              </svg>
            </button>
          </span>
        }
        @if (filters.quartier) {
          <span class="chip">
            {{ filters.quartier }}
            <button class="chip-remove" (click)="removeFilter('quartier')" aria-label="Retirer filtre quartier">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
              </svg>
            </button>
          </span>
        }
        @if (searchTerm) {
          <span class="chip">
            "{{ searchTerm }}"
            <button class="chip-remove" (click)="removeFilter('search')" aria-label="Retirer recherche">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
              </svg>
            </button>
          </span>
        }
      </div>
    }

    <!-- Results bar -->
    @if (!loading() && total() > 0) {
      <div class="results-bar">
        <span class="results-count">
          <strong>{{ total() }}</strong> annonce(s) trouvée(s)
          @if (hasActiveFilters()) { <span> · filtrée(s)</span> }
        </span>
      </div>
    }

    <!-- ── VUE TABLEAU ── -->
    @if (viewMode() === 'table') {
      <div class="table-card">
        @if (loading()) {
          <!-- Skeleton rows 8 lignes -->
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  @for (h of headers; track h) { <th>{{ h }}</th> }
                </tr>
              </thead>
              <tbody>
                @for (s of skeletonItems; track s) {
                  <tr class="skeleton-row">
                    <td>
                      <div class="annonce-cell">
                        <div class="skeleton-thumb"></div>
                        <div style="display:flex;flex-direction:column;gap:6px;flex:1">
                          <div class="skeleton-cell" style="width:70%"></div>
                          <div class="skeleton-cell" style="width:45%"></div>
                        </div>
                      </div>
                    </td>
                    <td><div class="skeleton-cell" style="width:80px"></div></td>
                    <td><div class="skeleton-cell" style="width:60px"></div></td>
                    <td><div class="skeleton-cell" style="width:70px"></div></td>
                    <td><div class="skeleton-cell" style="width:30px"></div></td>
                    <td><div class="skeleton-cell" style="width:90px"></div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (annonces().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <!-- Search icon -->
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p class="empty-title">Aucune annonce trouvée</p>
            <p class="empty-sub">
              @if (hasActiveFilters()) {
                Aucun résultat ne correspond à vos filtres actuels. Essayez de modifier ou réinitialiser les critères.
              } @else {
                Il n'y a encore aucune annonce dans le système.
              }
            </p>
            @if (hasActiveFilters()) {
              <button class="btn-empty-reset" (click)="resetFilters()">Réinitialiser les filtres</button>
            }
          </div>
        } @else {
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  @for (h of headers; track h) { <th>{{ h }}</th> }
                </tr>
              </thead>
              <tbody>
                @for (a of annonces(); track a.id) {
                  <tr>
                    <td>
                      <div class="annonce-cell">
                        <div class="thumb">
                          <img
                            [src]="a.photoPrincipaleThumb || a.photoPrincipale || ''"
                            [alt]="a.typeBien"
                            loading="lazy"
                            (error)="onThumbError($event)"
                          />
                        </div>
                        <div>
                          <div class="annonce-name">{{ a.typeBien }}</div>
                          <div class="annonce-loc">{{ a.quartier }}, {{ a.ville }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="prix">{{ a.prix | fcfa }}</span></td>
                    <td>
                      <app-status-badge [statut]="a.statut" />
                      @if (a.misEnPauseParAdmin) {
                        <span class="admin-pause-tag" title="Mise en pause par un administrateur">🔒 Admin</span>
                      }
                    </td>
                    <td><span class="date">{{ a.datePublication | timeAgo }}</span></td>
                    <td><span class="vues">{{ a.nombreVues }}</span></td>
                    <td>
                      <div class="actions">
                        <a [routerLink]="['/annonces', a.id]" class="btn-act btn-see">
                          <!-- Eye icon -->
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Voir
                        </a>
                        @if (a.statut === 'ACTIVE') {
                          <button class="btn-act btn-pause" (click)="pauseAnnonce(a.id)">
                            <!-- Pause icon -->
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="6" y="4" width="4" height="16"/>
                              <rect x="14" y="4" width="4" height="16"/>
                            </svg>
                            Pause
                          </button>
                        } @else if (a.statut === 'EN_PAUSE') {
                          <button class="btn-act btn-pause" (click)="reactiverAnnonce(a.id)">
                            <!-- Play icon -->
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polygon points="6 4 20 12 6 20 6 4"/>
                            </svg>
                            Réactiver
                          </button>
                        }
                        <button class="btn-act btn-del" (click)="confirmDelete(a)">
                          <!-- Trash icon -->
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages() > 1) {
            <div class="pagination">
              <span class="pg-info">
                Affichage <strong>{{ pageStart() }}–{{ pageEnd() }}</strong> sur <strong>{{ total() }}</strong>
              </span>
              <div class="pg-numbers" role="navigation" aria-label="Pagination">
                <button class="btn-pg" (click)="prevPage()" [disabled]="currentPage() === 0" aria-label="Page précédente">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
                    <polyline points="8 2 4 6 8 10"/>
                  </svg>
                </button>
                @for (p of pageNumbers(); track p) {
                  @if (p === -1) {
                    <span class="pg-ellipsis">…</span>
                  } @else {
                    <button class="btn-pg" [class.active]="p === currentPage()" (click)="goToPage(p)"
                      [attr.aria-current]="p === currentPage() ? 'page' : null">{{ p + 1 }}</button>
                  }
                }
                <button class="btn-pg" (click)="nextPage()" [disabled]="currentPage() >= totalPages() - 1" aria-label="Page suivante">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
                    <polyline points="4 2 8 6 4 10"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        }
      </div>
    }

    <!-- ── VUE CARTES ── -->
    @if (viewMode() === 'card') {
      @if (loading()) {
        <!-- Skeleton grid 8 cartes -->
        <div class="cards-grid">
          @for (s of skeletonItems; track s) {
            <div class="card-skeleton">
              <div class="sk-img"></div>
              <div class="sk-body">
                <div class="sk-line w80"></div>
                <div class="sk-line w60"></div>
                <div class="sk-line w40"></div>
              </div>
            </div>
          }
        </div>
      } @else if (annonces().length === 0) {
        <div class="table-card">
          <div class="empty-state">
            <div class="empty-icon">
              <!-- Building / house icon -->
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                <polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <p class="empty-title">Aucune annonce trouvée</p>
            <p class="empty-sub">
              @if (hasActiveFilters()) {
                Modifiez vos critères de filtre pour voir plus de résultats.
              } @else {
                Aucune annonce n'est encore disponible dans le système.
              }
            </p>
            @if (hasActiveFilters()) {
              <button class="btn-empty-reset" (click)="resetFilters()">Réinitialiser les filtres</button>
            }
          </div>
        </div>
      } @else {
        <div class="cards-grid">
          @for (a of annonces(); track a.id) {
            <div class="annonce-card">
              <div class="card-thumb">
                @if (a.photoPrincipaleThumb || a.photoPrincipale) {
                  <img
                    [src]="a.photoPrincipaleThumb || a.photoPrincipale"
                    [alt]="a.typeBien"
                    loading="lazy"
                    (load)="onCardImgLoad($event)"
                    (error)="onCardImgError($event)"
                  />
                  <div class="thumb-skeleton"></div>
                } @else {
                  <div class="card-thumb-placeholder">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                }
                <div class="card-badge">
                  <app-status-badge [statut]="a.statut" />
                  @if (a.misEnPauseParAdmin) {
                    <span class="admin-pause-tag" title="Mise en pause par un administrateur">🔒 Admin</span>
                  }
                </div>
              </div>
              <div class="card-body">
                <p class="card-title">{{ a.typeBien }}</p>
                <p class="card-loc">
                  <!-- Pin icon -->
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                  </svg>
                  {{ a.quartier }}, {{ a.ville }}
                </p>
                <div class="card-meta">
                  <span class="card-prix">{{ a.prix | fcfa }}</span>
                  <span class="card-vues">
                    <!-- Eye icon -->
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {{ a.nombreVues }} vues
                  </span>
                </div>
                <p class="card-date">Publiée {{ a.datePublication | timeAgo }}</p>
                <div class="card-actions">
                  <a [routerLink]="['/annonces', a.id]" class="btn-act btn-see">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Voir
                  </a>
                  @if (a.statut === 'ACTIVE') {
                    <button class="btn-act btn-pause" (click)="pauseAnnonce(a.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                      Pause
                    </button>
                  } @else if (a.statut === 'EN_PAUSE') {
                    <button class="btn-act btn-pause" (click)="reactiverAnnonce(a.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="6 4 20 12 6 20 6 4"/>
                      </svg>
                      Réactiver
                    </button>
                  }
                  <button class="btn-act btn-del" (click)="confirmDelete(a)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination" style="background:#fff;border:0.5px solid #E2E8F0;border-radius:14px;margin-top:14px;">
            <span class="pg-info">
              Affichage <strong>{{ pageStart() }}–{{ pageEnd() }}</strong> sur <strong>{{ total() }}</strong>
            </span>
            <div class="pg-numbers" role="navigation" aria-label="Pagination">
              <button class="btn-pg" (click)="prevPage()" [disabled]="currentPage() === 0" aria-label="Page précédente">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
                  <polyline points="8 2 4 6 8 10"/>
                </svg>
              </button>
              @for (p of pageNumbers(); track p) {
                @if (p === -1) {
                  <span class="pg-ellipsis">…</span>
                } @else {
                  <button class="btn-pg" [class.active]="p === currentPage()" (click)="goToPage(p)"
                    [attr.aria-current]="p === currentPage() ? 'page' : null">{{ p + 1 }}</button>
                }
              }
              <button class="btn-pg" (click)="nextPage()" [disabled]="currentPage() >= totalPages() - 1" aria-label="Page suivante">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
                  <polyline points="4 2 8 6 4 10"/>
                </svg>
              </button>
            </div>
          </div>
        }
      }
    }
  `,
})
export class AdminAnnoncesComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly locApi = inject(LocalisationApi);

  // ── Signals ───────────────────────────────────────────────────────────
  annonces      = signal<AnnonceListResponse[]>([]);
  total         = signal(0);
  totalPages    = signal(0);
  currentPage   = signal(0);
  loading       = signal(false);
  confirmOpen   = signal(false);
  confirmTitle  = signal('');
  confirmMsg    = signal('');
  viewMode      = signal<ViewMode>('table');
  villes        = signal<string[]>([]);
  quartiers     = signal<string[]>([]);
  private pendingId?: number;

  // ── État local ────────────────────────────────────────────────────────
  filters    = { statut: '', ville: '', quartier: '' };
  searchTerm = '';

  /** Taille de page : 8 éléments pour un chargement progressif rapide */
  readonly PAGE_SIZE = 8;

  /** Tableau de 8 items pour les squelettes de chargement */
  readonly skeletonItems = Array(this.PAGE_SIZE).fill(0);

  headers = ['Annonce', 'Prix', 'Statut', 'Publiée', 'Vues', 'Actions'];

  // ── Computed ──────────────────────────────────────────────────────────
  hasActiveFilters = computed(() =>
    !!this.filters.statut || !!this.filters.ville || !!this.filters.quartier || !!this.searchTerm
  );

  pageStart = computed(() => this.currentPage() * this.PAGE_SIZE + 1);

  pageEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.PAGE_SIZE, this.total())
  );

  pageNumbers = computed<number[]>(() => {
    const total   = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const pages: number[] = [0];
    if (current > 2) pages.push(-1);
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 3) pages.push(-1);
    pages.push(total - 1);
    return pages;
  });

  // ── Cycle de vie ──────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
    this.locApi.getVilles().subscribe({ next: (r) => this.villes.set(r.data ?? []) });
    this.chargerQuartiers();
  }

  // ── Méthodes ──────────────────────────────────────────────────────────

  load(page = 0): void {
    this.loading.set(true);
    this.adminApi.getAnnonces({
      ...this.filters,
      recherche: this.searchTerm || undefined,
      page,
      size: this.PAGE_SIZE,
    }).subscribe({
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

  onFilterChange(): void { this.load(0); }

  /** Quartiers dépendants de la ville sélectionnée (tous si aucune ville). */
  private chargerQuartiers(): void {
    this.locApi.getQuartiers(this.filters.ville).subscribe({
      next: (r) => this.quartiers.set(r.data ?? []),
    });
  }

  onVilleChange(): void {
    this.filters.quartier = '';
    this.chargerQuartiers();
    this.onFilterChange();
  }

  private searchTimeout?: ReturnType<typeof setTimeout>;
  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(0), 400);
  }

  resetFilters(): void {
    this.filters   = { statut: '', ville: '', quartier: '' };
    this.searchTerm = '';
    this.chargerQuartiers();
    this.load(0);
  }

  removeFilter(key: 'statut' | 'ville' | 'quartier' | 'search'): void {
    if (key === 'search') this.searchTerm = '';
    else if (key === 'ville') { this.filters.ville = ''; this.filters.quartier = ''; this.chargerQuartiers(); }
    else this.filters[key] = '';
    this.load(0);
  }

  // ── Gestion des images ─────────────────────────────────────────────

  /** Affiche l'image de la miniature tableau si erreur */
  onThumbError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.svgPlaceholder();
  }

  /** Révèle l'image de carte une fois chargée (masque le skeleton) */
  onCardImgLoad(event: Event): void {
    (event.target as HTMLImageElement).classList.add('loaded');
  }

  /** Remplace par placeholder SVG si l'image carte échoue */
  onCardImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.svgPlaceholder();
    img.classList.add('loaded');
  }

  private svgPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='140'`
      + ` viewBox='0 0 200 140'%3E%3Crect width='200' height='140' fill='%23f3f4f6'/%3E`
      + `%3Cpath d='M84 56h32v32a4 4 0 0 1-4 4H88a4 4 0 0 1-4-4V56z' fill='%23e5e7eb'/%3E`
      + `%3Cpolyline points='76,100 95,82 116,100' stroke='%23d1d5db' stroke-width='2' fill='none'/%3E`
      + `%3Ccircle cx='93' cy='66' r='5' fill='%23f9fafb'/%3E%3C/svg%3E`;
  }

  // ── Suppression ────────────────────────────────────────────────────

  confirmDelete(a: AnnonceListResponse): void {
    this.pendingId = a.id;
    this.confirmTitle.set('Supprimer cette annonce ?');
    this.confirmMsg.set(
      `"${a.typeBien} à ${a.quartier}" sera supprimée définitivement. Le propriétaire sera notifié.`
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
    this.adminApi.pauseAnnonceAdmin(id).subscribe({
      next: () => this.load(this.currentPage()),
    });
  }

  reactiverAnnonce(id: number): void {
    this.adminApi.reactiverAnnonceAdmin(id).subscribe({
      next: () => this.load(this.currentPage()),
    });
  }

  exportPDF(): void {
    this.adminApi.exportAnnoncesPDF().subscribe((blob) => {
      this.telechargerFichier(blob, `immocam-annonces-${new Date().toISOString().slice(0, 10)}.pdf`);
    });
  }

  private telechargerFichier(blob: Blob, nomFichier: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = nomFichier;
    a.click();
    URL.revokeObjectURL(url);
  }

  goToPage(page: number): void {
    if (page !== this.currentPage()) this.load(page);
  }
  prevPage(): void {
    if (this.currentPage() > 0) this.load(this.currentPage() - 1);
  }
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) this.load(this.currentPage() + 1);
  }
}