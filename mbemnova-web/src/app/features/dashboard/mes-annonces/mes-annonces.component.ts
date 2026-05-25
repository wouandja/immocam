import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { selectMesAnnonces, selectActionLoading } from '@store/annonce/annonce.selectors';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AnnonceDashboardResponse } from '@core/services/models';

type ViewMode = 'cards' | 'table';

@Component({
  selector: 'app-mes-annonces',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    FcfaPipe,
    TimeAgoPipe,
  ],
  styles: [`
    :host { display: block; font-family: 'DM Sans', system-ui, sans-serif; }

    /* ── Tokens ── */
    :host {
      --navy:    #0F1E45;
      --brand:   #1A237E;
      --brand2:  #283593;
      --brand3:  #3949AB;
      --brand-l: #E8EAF6;
      --brand-m: #C5CAE9;
      --green:   #00897B;
      --green-l: #E0F2F1;
      --red:     #E53935;
      --red-l:   #FFEBEE;
      --amber:   #F57C00;
      --amber-l: #FFF3E0;
      --sky:     #0288D1;
      --sky-l:   #E1F5FE;
      --text:    #0D1B2A;
      --text2:   #1B2A3B;
      --muted:   #546E7A;
      --faint:   #90A4AE;
      --border:  #E0E7EF;
      --surface: #F5F7FA;
      --card:    #FFFFFF;
      --r-xl:    20px;
      --r-lg:    14px;
      --r-md:    10px;
      --r-sm:    8px;
    }

    /* ══════════════════════════════════
       CONFIRM MODAL — styles inline forcés
       pour garantir visibilité absolue
    ══════════════════════════════════ */
    .modal-overlay {
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      background: rgba(10,20,50,.6) !important;
      backdrop-filter: blur(6px) !important;
      -webkit-backdrop-filter: blur(6px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      animation: overlayIn .18s ease !important;
    }
    @keyframes overlayIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .modal-box {
      background: #ffffff !important;
      border-radius: 20px !important;
      box-shadow: 0 32px 80px rgba(10,20,50,.25), 0 0 0 1px rgba(26,35,126,.08) !important;
      width: 100% !important;
      max-width: 420px !important;
      overflow: hidden !important;
      animation: boxIn .22s cubic-bezier(.34,1.56,.64,1) !important;
    }
    @keyframes boxIn {
      from { transform: scale(.88) translateY(16px); opacity: 0; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 28px 28px 0 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      text-align: center !important;
    }

    .modal-icon-wrap {
      width: 64px !important;
      height: 64px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-bottom: 18px !important;
    }
    .modal-icon-wrap.danger {
      background: #FFEBEE !important;
    }
    .modal-icon-wrap.warn {
      background: #FFF3E0 !important;
    }
    .modal-icon-wrap svg {
      width: 28px !important;
      height: 28px !important;
    }
    .modal-icon-wrap.danger svg { color: #E53935 !important; stroke: #E53935 !important; }
    .modal-icon-wrap.warn svg   { color: #F57C00 !important; stroke: #F57C00 !important; }

    .modal-title {
      font-size: 20px !important;
      font-weight: 800 !important;
      color: #0D1B2A !important;
      letter-spacing: -.4px !important;
      margin: 0 0 8px !important;
      line-height: 1.2 !important;
    }

    .modal-msg {
      font-size: 14px !important;
      color: #546E7A !important;
      line-height: 1.65 !important;
      margin: 0 !important;
    }

    .modal-body {
      padding: 20px 28px 28px !important;
    }

    .modal-actions {
      display: flex !important;
      gap: 10px !important;
    }

    .modal-btn-cancel {
      flex: 1 !important;
      height: 50px !important;
      background: #F5F7FA !important;
      color: #546E7A !important;
      border: 1.5px solid #E0E7EF !important;
      border-radius: 12px !important;
      font: 600 14px/1 'DM Sans', system-ui, sans-serif !important;
      cursor: pointer !important;
      transition: all .15s !important;
    }
    .modal-btn-cancel:hover {
      background: #E8EAF6 !important;
      color: #1A237E !important;
      border-color: #C5CAE9 !important;
    }

    .modal-btn-confirm {
      flex: 1 !important;
      height: 50px !important;
      border: none !important;
      border-radius: 12px !important;
      font: 700 14px/1 'DM Sans', system-ui, sans-serif !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 7px !important;
      transition: all .15s, transform .1s !important;
    }
    .modal-btn-confirm.danger {
      background: #E53935 !important;
      color: #fff !important;
      box-shadow: 0 4px 14px rgba(229,57,53,.3) !important;
    }
    .modal-btn-confirm.danger:hover { background: #C62828 !important; }
    .modal-btn-confirm.warn {
      background: #F57C00 !important;
      color: #fff !important;
      box-shadow: 0 4px 14px rgba(245,124,0,.3) !important;
    }
    .modal-btn-confirm.warn:hover { background: #E65100 !important; }
    .modal-btn-confirm.primary {
      background: #1A237E !important;
      color: #fff !important;
      box-shadow: 0 4px 14px rgba(26,35,126,.3) !important;
    }
    .modal-btn-confirm.primary:hover { background: #283593 !important; }
    .modal-btn-confirm:active { transform: scale(.97) !important; }
    .modal-btn-confirm svg {
      width: 16px !important;
      height: 16px !important;
    }

    /* ══ HEADER ══ */
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    }
    .page-header-left { display: flex; align-items: center; gap: 12px; }
    .page-title {
      font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: -.4px;
    }
    .count-pill {
      font-size: 11px; font-weight: 700; color: var(--brand);
      background: var(--brand-l); border: 1px solid var(--brand-m);
      padding: 3px 10px; border-radius: 20px;
    }

    /* Toggle view */
    .view-toggle {
      display: flex; background: var(--surface);
      border: 1.5px solid var(--border); border-radius: var(--r-sm);
      padding: 2px; gap: 2px;
    }
    .view-btn {
      width: 34px; height: 30px; border-radius: 6px;
      border: none; cursor: pointer; background: none;
      display: flex; align-items: center; justify-content: center;
      color: var(--faint); transition: all .15s;
    }
    .view-btn.active { background: var(--brand); color: #fff; }
    .view-btn svg { width: 15px; height: 15px; }

    .btn-new {
      display: inline-flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 16px;
      background: var(--brand); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 600 13px/1 'DM Sans', system-ui, sans-serif;
      text-decoration: none; cursor: pointer;
      transition: background .15s;
      box-shadow: 0 2px 8px rgba(26,35,126,.2);
    }
    .btn-new:hover { background: var(--brand2); }
    .btn-new svg { width: 15px; height: 15px; }

    /* ══ EMPTY ══ */
    .empty-wrap {
      display: flex; flex-direction: column; align-items: center;
      padding: 72px 24px; text-align: center;
    }
    .empty-ring {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--brand-l);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .empty-ring svg { width: 30px; height: 30px; color: var(--brand); }
    .empty-title { font-size: 17px; font-weight: 800; color: var(--text); margin-bottom: 7px; letter-spacing: -.3px; }
    .empty-sub { font-size: 14px; color: var(--muted); line-height: 1.65; margin-bottom: 28px; }
    .btn-empty {
      display: inline-flex; align-items: center; gap: 8px;
      height: 52px; padding: 0 28px;
      background: var(--brand); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 15px/1 'DM Sans', system-ui, sans-serif;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(26,35,126,.25);
      transition: background .15s;
    }
    .btn-empty:hover { background: var(--brand2); }
    .btn-empty svg { width: 17px; height: 17px; }

    /* ══ CARDS VIEW ══ */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
    }
    @media (max-width: 640px) {
      .cards-grid { grid-template-columns: 1fr; }
    }

    .ann-card {
      background: var(--card);
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(26,35,126,.05);
      transition: box-shadow .2s, border-color .2s, transform .15s;
    }
    .ann-card:hover {
      border-color: var(--brand-m);
      box-shadow: 0 8px 28px rgba(26,35,126,.1);
      transform: translateY(-2px);
    }

    /* Image / header de la carte */
    .ann-card-img {
      height: 130px; position: relative; overflow: hidden;
      background: linear-gradient(135deg, var(--brand-l) 0%, var(--brand-m) 100%);
      display: flex; align-items: center; justify-content: center;
    }
    .ann-card-img img {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .ann-card-img-ph {
      display: flex; flex-direction: column; align-items: center; gap: 7px;
    }
    .ann-card-img-ph svg { width: 26px; height: 26px; color: var(--brand); opacity: .35; }
    .ann-card-img-ph span { font-size: 11px; color: var(--brand); opacity: .4; font-weight: 600; }
    .ann-card-statut {
      position: absolute; top: 10px; right: 10px;
    }

    /* Corps */
    .ann-card-body { padding: 16px; }

    .ann-card-row1 {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 10px; margin-bottom: 4px;
    }
    .ann-card-type {
      font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.3px;
      line-height: 1.2;
    }
    .ann-card-price {
      font-size: 14px; font-weight: 800; color: var(--brand);
      white-space: nowrap;
    }
    .ann-card-loc {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--muted); margin-bottom: 14px;
    }
    .ann-card-loc svg { width: 12px; height: 12px; flex-shrink: 0; }

    /* Stats chips */
    .ann-card-stats {
      display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;
    }
    .stat-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 7px; padding: 4px 10px;
      font-size: 11.5px; color: var(--muted); font-weight: 600;
    }
    .stat-chip svg { width: 12px; height: 12px; }

    /* Actions */
    .ann-card-actions {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }
    .act-btn {
      display: inline-flex; align-items: center; gap: 5px;
      height: 32px; padding: 0 11px;
      font: 600 12px/1 'DM Sans', system-ui, sans-serif;
      border-radius: var(--r-sm); cursor: pointer;
      border: 1.5px solid var(--border);
      background: var(--card); color: var(--text2);
      transition: all .14s;
      white-space: nowrap;
    }
    .act-btn svg { width: 12px; height: 12px; }
    .act-btn:hover { background: var(--surface); border-color: #CDD5E0; }
    .act-btn.edit  { border-color: var(--brand-m); color: var(--brand); background: var(--brand-l); }
    .act-btn.edit:hover { background: var(--brand-m); }
    .act-btn.pause { border-color: #FFE0B2; color: var(--amber); background: var(--amber-l); }
    .act-btn.pause:hover { background: #FFE0B2; }
    .act-btn.resume { border-color: #B2DFDB; color: var(--green); background: var(--green-l); }
    .act-btn.resume:hover { background: #B2DFDB; }
    .act-btn.renew { border-color: #B3E5FC; color: var(--sky); background: var(--sky-l); }
    .act-btn.renew:hover { background: #B3E5FC; }
    .act-btn.archive { border-color: #E0E7EF; color: var(--muted); }
    .act-btn.archive:hover { background: #F0F4F8; }
    .act-btn.danger { border-color: #FFCDD2; color: var(--red); background: var(--red-l); }
    .act-btn.danger:hover { background: #FFCDD2; }

    /* ══ TABLE VIEW ══ */
    .table-wrap {
      background: var(--card);
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(26,35,126,.06);
    }

    table { width: 100%; border-collapse: collapse; }

    thead { border-bottom: 1.5px solid var(--border); }
    th {
      padding: 13px 16px;
      text-align: left;
      font-size: 10.5px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .08em;
      color: var(--faint);
      background: var(--surface);
      white-space: nowrap;
    }
    th.r { text-align: right; }

    tbody tr {
      border-bottom: 1px solid #F0F4F8;
      transition: background .1s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #FAFBFF; }

    td { padding: 14px 16px; vertical-align: middle; }
    td.r { text-align: right; }

    .td-ann { display: flex; align-items: center; gap: 12px; }
    .td-thumb {
      width: 44px; height: 44px; border-radius: var(--r-sm);
      background: var(--brand-l); border: 1.5px solid var(--brand-m);
      overflow: hidden; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .td-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .td-thumb svg { width: 18px; height: 18px; color: var(--brand); opacity: .4; }
    .td-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .td-loc  { font-size: 11px; color: var(--faint); }

    .td-price { font-size: 13px; font-weight: 800; color: var(--brand); white-space: nowrap; }

    .td-stats { font-size: 12px; color: var(--muted); line-height: 2; }
    .td-stats span { display: block; font-size: 11px; }

    .td-exp { font-size: 11px; color: var(--faint); }

    .td-acts {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 5px; flex-wrap: wrap;
    }

    /* ── Responsive table → cards sous 700px ── */
    .table-view-wrap { display: block; }
    @media (max-width: 700px) {
      .table-view-wrap { display: none; }
      .cards-fallback  { display: block !important; }
    }
    .cards-fallback { display: none; }

  `],
  template: `
    <!-- ══════════════ CONFIRM MODAL ══════════════ -->
    @if (confirmOpen()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon-wrap" [class.danger]="confirmDanger()" [class.warn]="!confirmDanger() && confirmWarn()">
              @if (confirmDanger()) {
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              } @else {
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              }
            </div>
            <h2 class="modal-title">{{ confirmTitle() }}</h2>
            <p class="modal-msg">{{ confirmMessage() }}</p>
          </div>
          <div class="modal-body">
            <div class="modal-actions">
              <button type="button" class="modal-btn-cancel" (click)="confirmOpen.set(false)">
                Annuler
              </button>
              <button type="button" class="modal-btn-confirm"
                [class.danger]="confirmDanger()"
                [class.warn]="!confirmDanger() && confirmWarn()"
                [class.primary]="!confirmDanger() && !confirmWarn()"
                (click)="executeAction()">
                @if (confirmDanger()) {
                  <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/>
                  </svg>
                } @else {
                  <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                }
                {{ confirmLabel() }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════ HEADER ══════════════ -->
    @if (mesAnnonces().length > 0) {
      <div class="page-header">
        <div class="page-header-left">
          <span class="page-title">Mes annonces</span>
          <span class="count-pill">{{ mesAnnonces().length }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <!-- Toggle cards / table -->
          <div class="view-toggle">
            <button type="button" class="view-btn" [class.active]="viewMode() === 'cards'" (click)="viewMode.set('cards')" title="Vue cartes">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button type="button" class="view-btn" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')" title="Vue tableau">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </button>
          </div>
          <a routerLink="/annonces/creer" class="btn-new">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nouvelle
          </a>
        </div>
      </div>
    }

    <!-- ══════════════ EMPTY ══════════════ -->
    @if (mesAnnonces().length === 0) {
      <div class="empty-wrap">
        <div class="empty-ring">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </div>
        <p class="empty-title">Aucune annonce publiée</p>
        <p class="empty-sub">Publiez votre première annonce gratuitement<br>en quelques minutes.</p>
        <a routerLink="/annonces/creer" class="btn-empty">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Publier une annonce
        </a>
      </div>

    <!-- ══════════════ CARDS ══════════════ -->
    } @else if (viewMode() === 'cards') {
      <div class="cards-grid">
        @for (a of mesAnnonces(); track a.id) {
          <div class="ann-card">
            <!-- Image -->
            <div class="ann-card-img">
              @if (a.photoUrl) {
                <img [src]="a.photoUrl" [alt]="a.typeBien" loading="lazy"/>
              } @else {
                <div class="ann-card-img-ph">
                  <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Aucune photo</span>
                </div>
              }
              <div class="ann-card-statut">
                <app-status-badge [statut]="a.statut"/>
              </div>
            </div>

            <!-- Body -->
            <div class="ann-card-body">
              <div class="ann-card-row1">
                <span class="ann-card-type">{{ a.typeBien }}</span>
                <span class="ann-card-price">{{ a.prix | fcfa }}</span>
              </div>
              <div class="ann-card-loc">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                {{ a.quartier }}, {{ a.ville }}
              </div>

              <div class="ann-card-stats">
                <span class="stat-chip">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  {{ a.nombreVues }} vues
                </span>
                <span class="stat-chip">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  {{ a.nombreCommentaires }} contacts
                </span>
                <span class="stat-chip">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ a.dateExpiration | timeAgo }}
                </span>
              </div>

              <!-- Actions -->
              <div class="ann-card-actions">
                @for (action of getActions(a); track action.label) {
                  <button type="button" class="act-btn" [class]="'act-btn ' + action.cls" (click)="action.fn()">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="action.icon"/>
                    </svg>
                    {{ action.label }}
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </div>

    <!-- ══════════════ TABLE ══════════════ -->
    } @else {
      <!-- Table desktop -->
      <div class="table-view-wrap">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Annonce</th>
                <th>Prix</th>
                <th>Statut</th>
                <th class="r">Statistiques</th>
                <th class="r">Expiration</th>
                <th class="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (a of mesAnnonces(); track a.id) {
                <tr>
                  <td>
                    <div class="td-ann">
                      <div class="td-thumb">
                        @if (a.photoUrl) {
                          <img [src]="a.photoUrl" [alt]="a.typeBien" loading="lazy"/>
                        } @else {
                          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        }
                      </div>
                      <div>
                        <div class="td-name">{{ a.typeBien }}</div>
                        <div class="td-loc">{{ a.quartier }}, {{ a.ville }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="td-price">{{ a.prix | fcfa }}</span></td>
                  <td><app-status-badge [statut]="a.statut"/></td>
                  <td class="r">
                    <div class="td-stats">
                      <span>{{ a.nombreVues }} vues</span>
                      <span>{{ a.nombreCommentaires }} contacts</span>
                    </div>
                  </td>
                  <td class="r"><span class="td-exp">{{ a.dateExpiration | timeAgo }}</span></td>
                  <td>
                    <div class="td-acts">
                      @for (action of getActions(a); track action.label) {
                        <button type="button" class="act-btn" [class]="'act-btn ' + action.cls" (click)="action.fn()" [title]="action.label">
                          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="action.icon"/>
                          </svg>
                          {{ action.label }}
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Fallback cards sur mobile quand vue table choisie -->
      <div class="cards-fallback">
        <div class="cards-grid">
          @for (a of mesAnnonces(); track a.id) {
            <div class="ann-card">
              <div class="ann-card-img">
                @if (a.photoUrl) {
                  <img [src]="a.photoUrl" [alt]="a.typeBien" loading="lazy"/>
                } @else {
                  <div class="ann-card-img-ph">
                    <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>Aucune photo</span>
                  </div>
                }
                <div class="ann-card-statut">
                  <app-status-badge [statut]="a.statut"/>
                </div>
              </div>
              <div class="ann-card-body">
                <div class="ann-card-row1">
                  <span class="ann-card-type">{{ a.typeBien }}</span>
                  <span class="ann-card-price">{{ a.prix | fcfa }}</span>
                </div>
                <div class="ann-card-loc">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                  {{ a.quartier }}, {{ a.ville }}
                </div>
                <div class="ann-card-stats">
                  <span class="stat-chip">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    {{ a.nombreVues }} vues
                  </span>
                  <span class="stat-chip">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    {{ a.nombreCommentaires }} contacts
                  </span>
                </div>
                <div class="ann-card-actions">
                  @for (action of getActions(a); track action.label) {
                    <button type="button" class="act-btn" [class]="'act-btn ' + action.cls" (click)="action.fn()">
                      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="action.icon"/>
                      </svg>
                      {{ action.label }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class MesAnnoncesComponent implements OnInit {
  private readonly store  = inject(Store);
  private readonly router = inject(Router);

  readonly mesAnnonces   = this.store.selectSignal(selectMesAnnonces);
  readonly actionLoading = this.store.selectSignal(selectActionLoading);

  readonly viewMode = signal<ViewMode>('cards');

  /* ── Confirm modal ── */
  readonly confirmOpen    = signal(false);
  readonly confirmTitle   = signal('');
  readonly confirmMessage = signal('');
  readonly confirmLabel   = signal('Confirmer');
  readonly confirmDanger  = signal(false);
  readonly confirmWarn    = signal(false);
  private pendingAction?: () => void;

  ngOnInit(): void {
    this.store.dispatch(annonceActions.loadMesAnnonces({}));
  }

  /* Fermer le modal en cliquant l'overlay */
  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.confirmOpen.set(false);
    }
  }

  /* ── Actions par annonce ── */
  getActions(a: AnnonceDashboardResponse): Array<{
    label: string; fn: () => void; cls: string; icon: string;
  }> {
    const actions: Array<{ label: string; fn: () => void; cls: string; icon: string; }> = [];
    const s = a.statut;

    const ICONS = {
      edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      pause:   'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
      resume:  'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
      renew:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
      delete:  'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    };

    if (s !== 'SUPPRIMEE' && s !== 'ARCHIVEE') {
      actions.push({
        label: 'Modifier', cls: 'edit', icon: ICONS.edit,
        fn: () => this.router.navigate(['/annonces', a.id, 'modifier']),
      });
    }
    if (s === 'ACTIVE') {
      actions.push({
        label: 'Pause', cls: 'pause', icon: ICONS.pause,
        fn: () => this.confirm(
          'Mettre en pause ?',
          "Votre annonce ne sera plus visible jusqu'à réactivation.",
          'warn',
          'Mettre en pause',
          () => this.store.dispatch(annonceActions.pause({ id: a.id })),
        ),
      });
      actions.push({
        label: 'Renouveler', cls: 'renew', icon: ICONS.renew,
        fn: () => this.store.dispatch(annonceActions.renouveler({ id: a.id })),
      });
    }
    if (s === 'EN_PAUSE') {
      actions.push({
        label: 'Réactiver', cls: 'resume', icon: ICONS.resume,
        fn: () => this.store.dispatch(annonceActions.reactiver({ id: a.id })),
      });
    }
    if (s === 'EXPIREE' || s === 'ACTIVE') {
      actions.push({
        label: 'Archiver', cls: 'archive', icon: ICONS.archive,
        fn: () => this.confirm(
          'Archiver cette annonce ?',
          'Elle ne sera plus visible sur ImmoCam.',
          'warn',
          'Archiver',
          () => this.store.dispatch(annonceActions.archiver({ id: a.id })),
        ),
      });
    }
    actions.push({
      label: 'Supprimer', cls: 'danger', icon: ICONS.delete,
      fn: () => this.confirm(
        'Supprimer définitivement ?',
        'Cette action est irréversible. Toutes les données associées seront perdues.',
        'danger',
        'Supprimer',
        () => this.store.dispatch(annonceActions.supprimer({ id: a.id })),
      ),
    });
    return actions;
  }

  confirm(
    title: string,
    message: string,
    type: 'danger' | 'warn' | 'primary',
    label: string,
    fn: () => void,
  ): void {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.confirmDanger.set(type === 'danger');
    this.confirmWarn.set(type === 'warn');
    this.confirmLabel.set(label);
    this.pendingAction = fn;
    this.confirmOpen.set(true);
  }

  executeAction(): void {
    this.confirmOpen.set(false);
    this.pendingAction?.();
    this.pendingAction = undefined;
    setTimeout(() => {
      this.store.dispatch(annonceActions.loadMesAnnonces({}));
    }, 500);
  }
}