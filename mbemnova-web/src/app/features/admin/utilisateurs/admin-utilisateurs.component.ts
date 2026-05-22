import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AdminUtilisateurResponse, RoleUtilisateur } from '@core/services/models';
import { ToastService } from '@core/services/toast.service';

type ViewMode = 'table' | 'card';

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, TimeAgoPipe],
  styles: [`
    /* ── Reset ─────────────────────────────────────────────── */
    :host { display: block; }

    /* ── Topbar ─────────────────────────────────────────────── */
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
    .topbar-left p {
      font-size: 13px;
      color: #64748B;
      margin: 3px 0 0;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* ── View toggle ────────────────────────────────────────── */
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
    .btn-view.active {
      background: #fff;
      color: #0F172A;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .btn-view svg { width: 15px; height: 15px; flex-shrink: 0; }

    /* ── Export button ──────────────────────────────────────── */
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

    /* ── Filter bar ─────────────────────────────────────────── */
    .filters {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 14px 16px;
      display: grid;
      grid-template-columns: 2fr auto;
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
    .filter-group input:hover { border-color: #94A3B8; }
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

    /* ── Active filters chips ───────────────────────────────── */
    .active-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
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
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #C7D2FE;
      border-radius: 50%;
      cursor: pointer;
      font-size: 10px;
      color: #4338CA;
      border: none;
      font-family: inherit;
      flex-shrink: 0;
      line-height: 1;
    }
    .chip-remove:hover { background: #A5B4FC; }

    /* ── Results bar ────────────────────────────────────────── */
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

    /* ── TABLE VIEW ─────────────────────────────────────────── */
    .table-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
    }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; border-collapse: collapse; min-width: 600px; }
    thead tr {
      background: #F8FAFC;
      border-bottom: 0.5px solid #E2E8F0;
    }
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
    thead th.th-right { text-align: right; }
    tbody tr {
      border-bottom: 0.5px solid #F1F5F9;
      transition: background .1s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #F5F6FF; }
    td { padding: 12px 16px; vertical-align: middle; }
    td.td-right { text-align: right; }

    /* ── Avatar + user cell ─────────────────────────────────── */
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #EEF2FF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #3245D1;
      flex-shrink: 0;
      letter-spacing: .02em;
    }
    .user-name { font-size: 13px; font-weight: 600; color: #0F172A; line-height: 1.3; }
    .user-email { font-size: 12px; color: #64748B; margin-top: 1px; }
    .user-phone { font-size: 11px; color: #94A3B8; margin-top: 1px; }
    .ville-text { font-size: 13px; color: #475569; }
    .annonces-count { font-size: 13px; font-weight: 700; color: #1E2875; }
    .date-text { font-size: 12px; color: #475569; }

    /* ── Status badge ───────────────────────────────────────── */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .02em;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-actif { background: #F0FDF4; color: #15803D; border: 0.5px solid #BBF7D0; }
    .status-actif .status-dot { background: #22C55E; }
    .status-suspendu { background: #FFFBEB; color: #B45309; border: 0.5px solid #FDE68A; }
    .status-suspendu .status-dot { background: #F59E0B; }
    .status-banni { background: #FEF2F2; color: #B91C1C; border: 0.5px solid #FECACA; }
    .status-banni .status-dot { background: #EF4444; }
    .status-default { background: #F8FAFC; color: #64748B; border: 0.5px solid #E2E8F0; }
    .status-default .status-dot { background: #94A3B8; }

    /* ── Action buttons ─────────────────────────────────────── */
    .actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-wrap: wrap; }
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
    }
    .btn-act:active { transform: scale(.96); }
    .btn-suspend { background: transparent; border-color: #FDE68A; color: #D97706; }
    .btn-suspend:hover { background: #FFFBEB; border-color: #F59E0B; }
    .btn-ban { background: transparent; border-color: #FCA5A5; color: #DC2626; }
    .btn-ban:hover { background: #FEF2F2; border-color: #F87171; }
    .btn-activate { background: transparent; border-color: #BBF7D0; color: #15803D; }
    .btn-activate:hover { background: #F0FDF4; border-color: #86EFAC; }

    /* ── CARD VIEW ──────────────────────────────────────────── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    .user-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
      transition: box-shadow .15s, border-color .15s;
    }
    .user-card:hover {
      border-color: #C7D2FE;
      box-shadow: 0 4px 16px rgba(50,69,209,.08);
    }
    .card-header {
      padding: 16px 16px 12px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .card-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #EEF2FF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #3245D1;
      flex-shrink: 0;
      letter-spacing: .02em;
    }
    .card-user-info { flex: 1; min-width: 0; }
    .card-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-email {
      font-size: 12px;
      color: #64748B;
      margin: 0 0 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-phone { font-size: 11px; color: #94A3B8; margin: 0; }
    .card-body {
      padding: 0 16px 14px;
      border-top: 0.5px solid #F1F5F9;
    }
    .card-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 0.5px solid #F8FAFC;
    }
    .card-meta-row:last-of-type { border-bottom: none; }
    .card-meta-label { font-size: 12px; color: #94A3B8; }
    .card-meta-val { font-size: 12px; font-weight: 600; color: #0F172A; }
    .card-meta-val.annonces { color: #1E2875; }
    .card-actions {
      display: flex;
      gap: 6px;
      padding: 12px 16px 14px;
      border-top: 0.5px solid #F1F5F9;
    }
    .card-actions .btn-act { flex: 1; justify-content: center; }

    /* ── Empty state ────────────────────────────────────────── */
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
      width: 64px;
      height: 64px;
      background: #F1F5F9;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .empty-icon svg { width: 28px; height: 28px; color: #CBD5E1; }
    .empty-title { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; }
    .empty-sub {
      font-size: 13px;
      color: #94A3B8;
      max-width: 320px;
      line-height: 1.6;
      margin: 0;
    }
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

    /* ── Pagination ─────────────────────────────────────────── */
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
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border-radius: 8px;
      border: 0.5px solid #E2E8F0;
      background: transparent;
      color: #475569;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all .12s;
    }
    .btn-pg:hover:not(:disabled):not(.active) {
      background: #F8FAFC;
      border-color: #94A3B8;
      color: #0F172A;
    }
    .btn-pg.active { background: #1E2875; border-color: #1E2875; color: #fff; }
    .btn-pg:active:not(:disabled) { transform: scale(.97); }
    .btn-pg:disabled { opacity: .35; cursor: not-allowed; }
    .pg-ellipsis {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 13px;
      color: #94A3B8;
    }

    /* ── Loading ────────────────────────────────────────────── */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 14px;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2.5px solid #E2E8F0;
      border-top-color: #3245D1;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; color: #94A3B8; }
    .sk-block {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 768px) {
      .cards-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 560px) {
      .topbar { flex-direction: column; gap: 10px; }
      .topbar-right { width: 100%; }
      .btn-export { flex: 1; justify-content: center; }
      .filters { grid-template-columns: 1fr; }
      .cards-grid { grid-template-columns: 1fr; }
      .pg-numbers { gap: 2px; }
    }
  `],
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

    <!-- ── Topbar ────────────────────────────────────────── -->
    <div class="topbar">
      <div class="topbar-left">
        <h2>Gestion des utilisateurs</h2>
        <p>{{ total() }} utilisateur(s) au total</p>
      </div>
      <div class="topbar-right">
        <div class="view-toggle" role="group" aria-label="Mode d'affichage">
          <button
            class="btn-view"
            [class.active]="viewMode() === 'table'"
            (click)="viewMode.set('table')"
            aria-label="Vue tableau"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="1" width="14" height="3" rx="1"/>
              <rect x="1" y="6" width="14" height="3" rx="1"/>
              <rect x="1" y="11" width="14" height="3" rx="1"/>
            </svg>
            Tableau
          </button>
          <button
            class="btn-view"
            [class.active]="viewMode() === 'card'"
            (click)="viewMode.set('card')"
            aria-label="Vue cartes"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="1" width="6" height="6" rx="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5"/>
            </svg>
            Cartes
          </button>
        </div>

        <button class="btn-export" (click)="exportCSV()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 1v8M4 6l3 3 3-3M1 10v1.5A1.5 1.5 0 002.5 13h9A1.5 1.5 0 0013 11.5V10"/>
          </svg>
          Export CSV
        </button>
      </div>
    </div>

    <!-- ── Filtre recherche ───────────────────────────────── -->
    <div class="filters">
      <div class="filter-group">
        <label for="f-search">Recherche</label>
        <input
          id="f-search"
          [(ngModel)]="searchTerm"
          (keyup.enter)="onFilterChange()"
          (input)="onSearchInput()"
          placeholder="Nom, email, téléphone..."
        />
      </div>
      <button
        class="btn-reset"
        (click)="resetFilters()"
        [style.opacity]="searchTerm ? '1' : '.45'"
      >
        Réinitialiser
      </button>
    </div>

    
    <div class="filters" style="grid-template-columns:repeat(4,minmax(0,1fr));">
      <div class="filter-group"><label>Prenom</label><input [(ngModel)]="newPrenom" placeholder="Jean"/></div>
      <div class="filter-group"><label>Nom</label><input [(ngModel)]="newNom" placeholder="Dupont"/></div>
      <div class="filter-group"><label>Email</label><input [(ngModel)]="newEmail" placeholder="email@site.com"/></div>
      <div class="filter-group"><label>Telephone</label><input [(ngModel)]="newTelephone" placeholder="+237..."/></div>
      <div class="filter-group"><label>Ville</label><input [(ngModel)]="newVille" placeholder="Douala"/></div>
      <div class="filter-group"><label>Mot de passe</label><input type="password" [(ngModel)]="newMotDePasse" placeholder="********"/></div>
      <div class="filter-group">
        <label>Role</label>
        <select class="btn-reset" style="height:36px;background:#F8FAFC;" [(ngModel)]="newRole">
          @for (r of roles; track r) {
            <option [ngValue]="r">{{ r }}</option>
          }
        </select>
      </div>
      <button class="btn-export" (click)="createUser()" [disabled]="creatingUser() || !canCreateUser()">
        {{ creatingUser() ? 'Creation...' : 'Creer utilisateur' }}
      </button>
    </div><!-- ── Chip filtre actif ──────────────────────────────── -->
    @if (searchTerm) {
      <div class="active-filters">
        <span class="filter-label">Filtres :</span>
        <span class="chip">
          "{{ searchTerm }}"
          <button class="chip-remove" (click)="resetFilters()" aria-label="Retirer la recherche">&#x2715;</button>
        </span>
      </div>
    }

    <!-- ── Résultats bar ──────────────────────────────────── -->
    @if (!loading() && total() > 0) {
      <div class="results-bar">
        <span class="results-count">
          <strong>{{ total() }}</strong> utilisateur(s) trouvé(s)
          @if (searchTerm) { <span>· filtré(s)</span> }
        </span>
      </div>
    }

    <!-- ─────────────────────────────────────────────────────── -->
    <!--  VUE TABLEAU                                             -->
    <!-- ─────────────────────────────────────────────────────── -->
    @if (viewMode() === 'table') {
      <div class="table-card">
        @if (loading()) {
          <div class="table-scroll">
            <table>
              <thead><tr><th>Utilisateur</th><th>Ville</th><th>Statut</th><th class="th-right">Annonces</th><th>Inscrit</th><th class="th-right">Actions</th></tr></thead>
              <tbody>
                @for (i of [1,2,3,4,5,6]; track i) {
                  <tr>
                    <td><div class="sk-block" style="height:16px;width:220px;border-radius:8px"></div></td>
                    <td><div class="sk-block" style="height:16px;width:90px;border-radius:8px"></div></td>
                    <td><div class="sk-block" style="height:16px;width:80px;border-radius:8px"></div></td>
                    <td class="td-right"><div class="sk-block" style="height:16px;width:40px;border-radius:8px;display:inline-block"></div></td>
                    <td><div class="sk-block" style="height:16px;width:100px;border-radius:8px"></div></td>
                    <td class="td-right"><div class="sk-block" style="height:16px;width:110px;border-radius:8px;display:inline-block"></div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (users().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p class="empty-title">Aucun utilisateur trouvé</p>
            <p class="empty-sub">
              @if (searchTerm) {
                Aucun résultat pour "{{ searchTerm }}". Vérifiez l'orthographe ou essayez un autre terme.
              } @else {
                Aucun utilisateur n'est encore enregistré dans le système.
              }
            </p>
            @if (searchTerm) {
              <button class="btn-empty-reset" (click)="resetFilters()">Effacer la recherche</button>
            }
          </div>
        } @else {
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Ville</th>
                  <th>Statut</th>
                  <th class="th-right">Annonces</th>
                  <th>Inscrit</th>
                  <th class="th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="avatar">{{ u.prenom[0] }}{{ u.nom[0] }}</div>
                        <div>
                          <div class="user-name">{{ fullName(u) }}</div>
                          <div class="user-email">{{ u.email }}</div>
                          <div class="user-phone">{{ u.telephoneMasque || u.telephone || '-' }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="ville-text">{{ u.ville }}</span></td>
                    <td>
                      <span class="status-badge" [ngClass]="statusBadgeClass(u.statut)">
                        <span class="status-dot"></span>
                        {{ u.statut }}
                      </span>
                    </td>
                    <td class="td-right">
                      <span class="annonces-count">{{ u.nombreAnnoncesTotal ?? u.nombreAnnoncesActives ?? u.nombreAnnonces ?? 0 }}</span>
                    </td>
                    <td><span class="date-text">{{ u.dateInscription | timeAgo }}</span></td>
                    <td>
                      <div class="actions">
                        @if (u.statut === 'ACTIF') {
                          <button class="btn-act btn-suspend" (click)="doSuspendre(u)">Suspendre</button>
                          <button class="btn-act btn-ban" (click)="doBannir(u)">Bannir</button>
                        }
                        @if (u.statut !== 'ACTIF') {
                          <button class="btn-act btn-activate" (click)="doActiver(u.id)">Activer</button>
                        }
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
                <button class="btn-pg" (click)="load(page() - 1)" [disabled]="page() === 0" aria-label="Page précédente">←</button>
                @for (p of pageNumbers(); track p) {
                  @if (p === -1) {
                    <span class="pg-ellipsis">…</span>
                  } @else {
                    <button
                      class="btn-pg"
                      [class.active]="p === page()"
                      (click)="load(p)"
                      [attr.aria-current]="p === page() ? 'page' : null"
                    >{{ p + 1 }}</button>
                  }
                }
                <button class="btn-pg" (click)="load(page() + 1)" [disabled]="page() >= totalPages() - 1" aria-label="Page suivante">→</button>
              </div>
            </div>
          }
        }
      </div>
    }

    <!-- ─────────────────────────────────────────────────────── -->
    <!--  VUE CARTES                                              -->
    <!-- ─────────────────────────────────────────────────────── -->
    @if (viewMode() === 'card') {
      @if (loading()) {
        <div class="table-card">
          <div class="cards-grid" style="padding:14px">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="user-card" style="padding:16px">
                <div class="sk-block" style="height:16px;width:70%;border-radius:8px;margin-bottom:10px"></div>
                <div class="sk-block" style="height:14px;width:55%;border-radius:8px;margin-bottom:8px"></div>
                <div class="sk-block" style="height:14px;width:45%;border-radius:8px;margin-bottom:14px"></div>
                <div class="sk-block" style="height:36px;width:100%;border-radius:10px"></div>
              </div>
            }
          </div>
        </div>
      } @else if (users().length === 0) {
        <div class="table-card">
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p class="empty-title">Aucun utilisateur trouvé</p>
            <p class="empty-sub">
              @if (searchTerm) {
                Aucun résultat pour "{{ searchTerm }}". Essayez un autre terme de recherche.
              } @else {
                Aucun utilisateur n'est encore enregistré dans le système.
              }
            </p>
            @if (searchTerm) {
              <button class="btn-empty-reset" (click)="resetFilters()">Effacer la recherche</button>
            }
          </div>
        </div>
      } @else {
        <div class="cards-grid">
          @for (u of users(); track u.id) {
            <div class="user-card">
              <div class="card-header">
                <div class="card-avatar">{{ u.prenom[0] }}{{ u.nom[0] }}</div>
                <div class="card-user-info">
                  <p class="card-name">{{ fullName(u) }}</p>
                  <p class="card-email">{{ u.email }}</p>
                  <p class="card-phone">{{ u.telephoneMasque || u.telephone || '-' }}</p>
                </div>
                <span class="status-badge" [ngClass]="statusBadgeClass(u.statut)">
                  <span class="status-dot"></span>
                  {{ u.statut }}
                </span>
              </div>
              <div class="card-body">
                <div class="card-meta-row">
                  <span class="card-meta-label">Ville</span>
                  <span class="card-meta-val">{{ u.ville }}</span>
                </div>
                <div class="card-meta-row">
                  <span class="card-meta-label">Annonces</span>
                  <span class="card-meta-val annonces">{{ u.nombreAnnoncesTotal ?? u.nombreAnnoncesActives ?? u.nombreAnnonces ?? 0 }}</span>
                </div>
                <div class="card-meta-row">
                  <span class="card-meta-label">Inscrit</span>
                  <span class="card-meta-val">{{ u.dateInscription | timeAgo }}</span>
                </div>
              </div>
              <div class="card-actions">
                @if (u.statut === 'ACTIF') {
                  <button class="btn-act btn-suspend" (click)="doSuspendre(u)">Suspendre</button>
                  <button class="btn-act btn-ban" (click)="doBannir(u)">Bannir</button>
                }
                @if (u.statut !== 'ACTIF') {
                  <button class="btn-act btn-activate" (click)="doActiver(u.id)">Activer</button>
                }
              </div>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination" style="background:#fff; border:0.5px solid #E2E8F0; border-radius:14px; margin-top:14px;">
            <span class="pg-info">
              Affichage <strong>{{ pageStart() }}–{{ pageEnd() }}</strong> sur <strong>{{ total() }}</strong>
            </span>
            <div class="pg-numbers" role="navigation" aria-label="Pagination">
              <button class="btn-pg" (click)="load(page() - 1)" [disabled]="page() === 0" aria-label="Page précédente">←</button>
              @for (p of pageNumbers(); track p) {
                @if (p === -1) {
                  <span class="pg-ellipsis">…</span>
                } @else {
                  <button
                    class="btn-pg"
                    [class.active]="p === page()"
                    (click)="load(p)"
                    [attr.aria-current]="p === page() ? 'page' : null"
                  >{{ p + 1 }}</button>
                }
              }
              <button class="btn-pg" (click)="load(page() + 1)" [disabled]="page() >= totalPages() - 1" aria-label="Page suivante">→</button>
            </div>
          </div>
        }
      }
    }
  `,
})
export class AdminUtilisateursComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(ToastService);

  // ── Signals ───────────────────────────────────────────────────────────
  users = signal<AdminUtilisateurResponse[]>([]);
  total = signal(0);
  totalPages = signal(0);
  page = signal(0);
  loading = signal(false);
  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMsg = signal('');
  confirmLabel = signal('Confirmer');
  viewMode = signal<ViewMode>('table');
  creatingUser = signal(false);

  searchTerm = '';
  newPrenom = '';
  newNom = '';
  newEmail = '';
  newTelephone = '';
  newVille = '';
  newMotDePasse = '';
  newRole: RoleUtilisateur = RoleUtilisateur.UTILISATEUR;
  private pendingFn?: () => void;
  readonly PAGE_SIZE = 10;
  readonly roles = [RoleUtilisateur.UTILISATEUR, RoleUtilisateur.ADMINISTRATEUR];

  // ── Computed ──────────────────────────────────────────────────────────
  pageStart = computed(() => this.page() * this.PAGE_SIZE + 1);
  pageEnd   = computed(() => Math.min((this.page() + 1) * this.PAGE_SIZE, this.total()));

  pageNumbers = computed<number[]>(() => {
    const total   = this.totalPages();
    const current = this.page();
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
  }

  // ── Méthodes ──────────────────────────────────────────────────────────

  load(p = 0): void {
    this.loading.set(true);
    const filters = this.searchTerm ? { terme: this.searchTerm, page: p, taille: this.PAGE_SIZE } : { page: p, taille: this.PAGE_SIZE };
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

  onFilterChange(): void {
    this.load(0);
  }

  private searchTimeout?: ReturnType<typeof setTimeout>;
  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(0), 400);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.load(0);
  }

  doSuspendre(u: AdminUtilisateurResponse): void {
    this.confirmTitle.set('Suspendre le compte ?');
    this.confirmMsg.set(
      `${this.fullName(u)} ne pourra plus se connecter. Ses annonces seront masquees.`,
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
      `${this.fullName(u)} sera banni definitivement. Toutes ses annonces seront supprimees.`,
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

  statusBadgeClass(statut: string): string {
    return (
      {
        ACTIF:     'status-actif',
        SUSPENDU:  'status-suspendu',
        BANNI:     'status-banni',
      }[statut] ?? 'status-default'
    );
  }

  fullName(u: AdminUtilisateurResponse): string {
    return u.nomComplet || `${u.prenom} ${u.nom}`.trim();
  }

  canCreateUser(): boolean {
    return !!(
      this.newPrenom.trim() &&
      this.newNom.trim() &&
      this.newEmail.trim() &&
      this.newTelephone.trim() &&
      this.newVille.trim() &&
      this.newMotDePasse.trim().length >= 8
    );
  }

  createUser(): void {
    if (!this.canCreateUser() || this.creatingUser()) return;
    this.creatingUser.set(true);
    this.adminApi
      .creerUtilisateur({
        prenom: this.newPrenom.trim(),
        nom: this.newNom.trim(),
        email: this.newEmail.trim(),
        telephone: this.newTelephone.trim(),
        ville: this.newVille.trim(),
        motDePasse: this.newMotDePasse,
        role: this.newRole,
      })
      .subscribe({
        next: () => {
          this.toast.success('Utilisateur cree');
          this.newPrenom = '';
          this.newNom = '';
          this.newEmail = '';
          this.newTelephone = '';
          this.newVille = '';
          this.newMotDePasse = '';
          this.newRole = RoleUtilisateur.UTILISATEUR;
          this.creatingUser.set(false);
          this.load(0);
        },
        error: () => this.creatingUser.set(false),
      });
  }
}

