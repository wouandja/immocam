import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { selectMesAnnonces, selectActionLoading } from '@store/annonce/annonce.selectors';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AnnonceDashboardResponse } from '@core/services/models';

@Component({
  selector: 'app-mes-annonces',
  standalone: true,
  imports: [CommonModule, RouterLink, FcfaPipe, TimeAgoPipe],
  styles: [`
    :host {
      display: block;
      font-family: 'DM Sans', system-ui, sans-serif;
      --brand: #1A237E; --brand2: #283593; --brand3: #3949AB;
      --brand-l: #E8EAF6; --brand-m: #C5CAE9;
      --green: #00897B; --green-l: #E0F2F1;
      --red: #E53935; --red-l: #FFEBEE;
      --amber: #F57C00; --amber-l: #FFF3E0;
      --sky: #0288D1; --sky-l: #E1F5FE;
      --text: #0D1B2A; --muted: #546E7A; --faint: #90A4AE;
      --border: #E0E7EF; --surface: #F5F7FA; --card: #FFFFFF;
      --r-xl: 20px; --r-lg: 14px; --r-md: 10px; --r-sm: 8px;
    }

    /* ══ HEADER ══ */
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    }
    .page-header-left { display: flex; align-items: center; gap: 10px; }
    .page-title { font-size: 17px; font-weight: 800; color: var(--text); letter-spacing: -.3px; }
    .count-pill {
      font-size: 11px; font-weight: 700; color: var(--brand);
      background: var(--brand-l); border: 1px solid var(--brand-m);
      padding: 3px 10px; border-radius: 20px;
    }
    .view-toggle {
      display: flex; background: var(--surface);
      border: 1.5px solid var(--border); border-radius: var(--r-sm);
      padding: 2px; gap: 2px;
    }
    .view-btn {
      width: 34px; height: 30px; border-radius: 6px; border: none;
      cursor: pointer; background: none;
      display: flex; align-items: center; justify-content: center;
      color: var(--faint); transition: all .15s;
    }
    .view-btn.active { background: var(--brand); color: #fff; }
    .view-btn svg { width: 15px; height: 15px; }

    /* Bouton "Nouvelle annonce" — masqué sur mobile */
    .btn-new {
      display: inline-flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 16px;
      background: var(--brand); color: #fff; border: none;
      border-radius: var(--r-md);
      font: 600 13px/1 'DM Sans', system-ui, sans-serif;
      text-decoration: none; cursor: pointer;
      box-shadow: 0 2px 8px rgba(26,35,126,.2); transition: background .15s;
    }
    .btn-new:hover { background: var(--brand2); }
    .btn-new svg { width: 14px; height: 14px; }
    @media(max-width: 639px) { .btn-new { display: none; } }

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
    .empty-title { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 7px; }
    .empty-sub { font-size: 13px; color: var(--muted); line-height: 1.65; margin-bottom: 24px; }
    .btn-empty {
      display: inline-flex; align-items: center; gap: 8px;
      height: 50px; padding: 0 28px;
      background: var(--brand); color: #fff; border: none;
      border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(26,35,126,.25); transition: background .15s;
    }
    .btn-empty:hover { background: var(--brand2); }
    .btn-empty svg { width: 16px; height: 16px; }

    /* ══ CARDS GRID ══ */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 16px;
    }
    @media(max-width: 600px) { .cards-grid { grid-template-columns: 1fr; } }

    /* ══ CARD ══ */
    .ann-card {
      background: var(--card);
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(26,35,126,.05);
      transition: box-shadow .2s, border-color .2s, transform .18s;
    }
    .ann-card:hover {
      border-color: var(--brand-m);
      box-shadow: 0 10px 32px rgba(26,35,126,.12);
      transform: translateY(-3px);
    }
    .ann-card:hover .card-img img { transform: scale(1.06); }

    /* IMAGE */
    .card-img {
      position: relative; height: 190px; overflow: hidden;
      background: linear-gradient(135deg, #EEF0FB, #C5CAE9);
      display: flex; align-items: center; justify-content: center;
    }
    .card-img img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform .45s cubic-bezier(.22,1,.36,1);
    }
    .img-shimmer {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%; animation: shim 1.4s infinite;
    }
    @keyframes shim { to { background-position: -200% 0; } }
    .img-loaded .img-shimmer { display: none; }

    .no-photo {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px;
    }
    .no-photo svg { width: 34px; height: 34px; color: var(--brand); opacity: .25; }
    .no-photo span { font-size: 11px; color: var(--brand); opacity: .4; font-weight: 600; }

    /* BADGE STATUT — haut gauche */
    .badge-statut {
      position: absolute; top: 10px; left: 10px;
      border-radius: 8px; padding: 4px 10px;
      font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
      line-height: 1;
    }
    .s-active  { background: rgba(255,255,255,.93); color: var(--brand); border: 0.5px solid rgba(26,35,126,.25); }
    .s-pause   { background: var(--amber-l); color: #BF360C; }
    .s-expired { background: var(--red-l); color: #B71C1C; }
    .s-arch    { background: #ECEFF1; color: #37474F; }

    /* PRIX — bas gauche */
    .price-badge {
      position: absolute; bottom: 10px; left: 10px;
      background: rgba(15,30,69,.85); color: #fff;
      padding: 5px 14px; border-radius: 20px;
      font-size: 13px; font-weight: 700; letter-spacing: .3px;
      backdrop-filter: blur(6px);
    }

    /* ══ BOUTON ⋮ — haut droite, FOND BLEU ══ */
    .btn-img-menu {
      position: absolute; top: 10px; right: 10px;
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--brand);          /* fond bleu */
      border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; padding: 0;
      box-shadow: 0 2px 8px rgba(26,35,126,.35);
      transition: transform .15s, background .15s;
      z-index: 2;
    }
    .btn-img-menu:hover { transform: scale(1.1); background: var(--brand2); }
    /* Les trois points : SVG blanc 18px */
    .btn-img-menu svg { width: 18px; height: 18px; color: #fff; display: block; }

    /* BODY */
    .card-body { padding: 13px 14px 0; }
    .card-title {
      font-size: 14.5px; font-weight: 800; color: var(--text);
      letter-spacing: -.3px; margin-bottom: 4px; line-height: 1.25;
    }
    .card-loc {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: var(--muted); margin-bottom: 11px;
    }
    .card-loc svg { width: 13px; height: 13px; flex-shrink: 0; color: var(--brand3); }
    .card-stats { display: flex; gap: 6px; flex-wrap: wrap; padding-bottom: 13px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 7px; padding: 4px 9px;
      font-size: 11px; color: var(--muted); font-weight: 600;
      white-space: nowrap;
    }
    .chip svg { width: 11px; height: 11px; flex-shrink: 0; }

    /* FOOTER */
    .card-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px 13px;
      border-top: 1px solid var(--border);
    }
    .exp-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; color: var(--faint); white-space: nowrap;
    }
    .exp-label svg { width: 12px; height: 12px; flex-shrink: 0; }
    .btn-detail {
      font-size: 11px; font-weight: 700; letter-spacing: .04em;
      color: var(--brand); background: var(--brand-l); border: none;
      border-radius: 20px; padding: 5px 13px;
      cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center; gap: 4px;
      transition: background .15s; white-space: nowrap;
    }
    .btn-detail:hover { background: var(--brand-m); }
    .btn-detail svg { width: 11px; height: 11px; }

    /* ══ TABLE ══ */
    .table-wrap {
      background: var(--card); border: 1.5px solid var(--border);
      border-radius: var(--r-xl); overflow: hidden;
      box-shadow: 0 2px 12px rgba(26,35,126,.05);
    }
    table { width: 100%; border-collapse: collapse; }
    thead { border-bottom: 1.5px solid var(--border); }
    th {
      padding: 12px 16px; text-align: left;
      font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .08em;
      color: var(--faint); background: var(--surface); white-space: nowrap;
    }
    th.r { text-align: right; }
    tbody tr { border-bottom: 1px solid #F0F4F8; transition: background .1s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #FAFBFF; }
    td { padding: 14px 16px; vertical-align: middle; }
    td.r { text-align: right; }

    /* Colonne Annonce */
    .td-ann { display: flex; align-items: center; gap: 11px; }
    .td-thumb {
      width: 48px; height: 48px; border-radius: 10px;
      background: var(--brand-l); border: 1.5px solid var(--brand-m);
      overflow: hidden; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .td-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .td-thumb svg { width: 18px; height: 18px; color: var(--brand); opacity: .4; }
    .td-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px; line-height: 1.2; }
    .td-loc  { font-size: 11px; color: var(--faint); }

    /* Colonne Prix */
    .td-price { font-size: 13px; font-weight: 800; color: var(--brand); white-space: nowrap; }

    /* Colonne Statut — badge inline (pas absolu) */
    .tbl-badge {
      display: inline-flex; align-items: center;
      border-radius: 8px; padding: 4px 10px;
      font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
      white-space: nowrap; line-height: 1;
    }

    /* Colonne Stats — deux lignes espacées */
    .td-stats {
      display: flex; flex-direction: column; gap: 4px;
      align-items: flex-end;
    }
    .td-stat-row {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11.5px; color: var(--muted); white-space: nowrap;
    }
    .td-stat-row svg { width: 12px; height: 12px; flex-shrink: 0; }

    /* Colonne Expiration */
    .td-exp { font-size: 11.5px; color: var(--faint); white-space: nowrap; }

    /* Colonne Actions */
    .td-acts { display: flex; align-items: center; justify-content: flex-end; }
    .tbl-menu {
      width: 34px; height: 34px; border-radius: 8px;
      background: var(--brand); border: none;         /* fond bleu aussi */
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .15s;
      box-shadow: 0 2px 6px rgba(26,35,126,.25);
    }
    .tbl-menu:hover { background: var(--brand2); transform: scale(1.05); }
    .tbl-menu svg { width: 16px; height: 16px; color: #fff; }

    @media(max-width: 700px) {
      .table-view-wrap { display: none; }
      .cards-fallback  { display: block !important; }
    }
    .cards-fallback { display: none; }

    /* ══ SHEET / MODAL ACTIONS ══ */
    .sheet-overlay {
      position: fixed !important; inset: 0 !important; z-index: 9999 !important;
      background: rgba(10,20,50,.55) !important; backdrop-filter: blur(4px) !important;
      display: flex !important; align-items: flex-end !important; justify-content: center !important;
      animation: fadeIn .18s ease !important;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .sheet-box {
      background: #fff !important;
      border-radius: 24px 24px 0 0 !important;
      width: 100% !important; max-width: 540px !important;
      padding: 14px 16px 0 !important;
      padding-bottom: 80px !important;   /* espace navbar mobile */
      animation: slideUp .25s cubic-bezier(.34,1.56,.64,1) !important;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    /* Desktop : modal centré */
    @media(min-width: 640px) {
      .sheet-overlay {
        align-items: center !important;
        justify-content: center !important;
      }
      .sheet-box {
        border-radius: 20px !important;
        max-width: 400px !important;
        padding-bottom: 20px !important;
        box-shadow: 0 32px 80px rgba(10,20,50,.22) !important;
      }
      .sheet-handle { display: none !important; }
    }

    .sheet-handle {
      width: 38px; height: 4px; background: var(--border);
      border-radius: 4px; margin: 0 auto 14px;
    }
    .sheet-ann-info {
      display: flex; align-items: center; gap: 12px;
      padding-bottom: 14px; margin-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }
    .sheet-thumb {
      width: 52px; height: 52px; border-radius: 12px;
      overflow: hidden; flex-shrink: 0;
      background: var(--brand-l);
      display: flex; align-items: center; justify-content: center;
    }
    .sheet-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .sheet-thumb svg { width: 22px; height: 22px; color: var(--brand); opacity: .4; }
    .sheet-ann-name { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .sheet-ann-sub  { font-size: 12px; color: var(--muted); }

    .action-list { display: flex; flex-direction: column; gap: 2px; }
    .action-btn {
      display: flex; align-items: center; gap: 14px;
      padding: 11px 8px; border-radius: 12px;
      background: none; border: none; cursor: pointer;
      text-align: left; width: 100%; transition: background .12s;
    }
    .action-btn:hover { background: var(--surface); }
    .action-icon {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .action-icon svg { width: 18px; height: 18px; }
    .ai-blue  { background: var(--brand-l); color: var(--brand); }
    .ai-amber { background: var(--amber-l); color: var(--amber); }
    .ai-green { background: var(--green-l); color: var(--green); }
    .ai-sky   { background: var(--sky-l);   color: var(--sky);   }
    .ai-red   { background: var(--red-l);   color: var(--red);   }
    .action-label { font-size: 14px; font-weight: 600; color: var(--text); }
    .action-desc  { font-size: 11px; color: var(--muted); margin-top: 1px; }

    .sheet-cancel {
      display: block; width: 100%; padding: 14px; margin-top: 8px;
      border-top: 1px solid var(--border);
      border-left: none; border-right: none; border-bottom: none;
      background: var(--surface);
      font: 600 14px/1 'DM Sans', system-ui, sans-serif;
      color: var(--muted); cursor: pointer; transition: background .15s, color .15s;
    }
    .sheet-cancel:hover { background: var(--brand-l); color: var(--brand); }

    /* ══ CONFIRM MODAL ══ */
    .modal-overlay {
      position: fixed !important; inset: 0 !important; z-index: 10000 !important;
      background: rgba(10,20,50,.6) !important; backdrop-filter: blur(6px) !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
      padding: 20px !important; animation: fadeIn .18s ease !important;
    }
    .modal-box {
      background: #fff !important; border-radius: 20px !important;
      box-shadow: 0 32px 80px rgba(10,20,50,.25) !important;
      width: 100% !important; max-width: 380px !important; overflow: hidden !important;
      animation: boxIn .22s cubic-bezier(.34,1.56,.64,1) !important;
    }
    @keyframes boxIn {
      from { transform: scale(.88) translateY(16px); opacity: 0; }
      to   { transform: scale(1)   translateY(0);    opacity: 1; }
    }
    .modal-header {
      padding: 28px 28px 0;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .modal-icon {
      width: 60px; height: 60px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
    }
    .modal-icon svg { width: 26px; height: 26px; }
    .modal-icon.danger { background: var(--red-l);   color: var(--red);   }
    .modal-icon.warn   { background: var(--amber-l); color: var(--amber); }
    .modal-title { font-size: 19px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
    .modal-msg   { font-size: 13.5px; color: var(--muted); line-height: 1.65; }
    .modal-body  { padding: 20px 28px 28px; }
    .modal-actions { display: flex; gap: 10px; }
    .modal-cancel-btn {
      flex: 1; height: 48px; background: var(--surface); color: var(--muted);
      border: 1.5px solid var(--border); border-radius: 12px;
      font: 600 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer; transition: all .15s;
    }
    .modal-cancel-btn:hover { background: var(--brand-l); color: var(--brand); border-color: var(--brand-m); }
    .modal-confirm {
      flex: 1; height: 48px; border: none; border-radius: 12px;
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px; transition: all .15s;
    }
    .modal-confirm.danger { background: var(--red);   color: #fff; box-shadow: 0 4px 14px rgba(229,57,53,.3); }
    .modal-confirm.danger:hover { background: #C62828; }
    .modal-confirm.warn   { background: var(--amber); color: #fff; box-shadow: 0 4px 14px rgba(245,124,0,.3); }
    .modal-confirm.warn:hover   { background: #E65100; }
    .modal-confirm svg { width: 15px; height: 15px; }
  `],
  template: `

    <!-- ══ SHEET / MODAL ACTIONS ══ -->
    @if (sheetOpen()) {
      <div class="sheet-overlay" (click)="onOverlayClick($event)">
        <div class="sheet-box" (click)="$event.stopPropagation()">
          <div class="sheet-handle"></div>
          @if (sheetAnnonce()) {
            <div class="sheet-ann-info">
              <div class="sheet-thumb">
                @if (sheetAnnonce()!.photoUrl) {
                  <img [src]="sheetAnnonce()!.photoUrl" [alt]="sheetAnnonce()!.typeBien"/>
                } @else {
                  <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                         a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6
                         a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                }
              </div>
              <div>
                <div class="sheet-ann-name">{{ sheetAnnonce()!.typeBien }}</div>
                <div class="sheet-ann-sub">
                  {{ sheetAnnonce()!.quartier }}, {{ sheetAnnonce()!.ville }}
                  &nbsp;·&nbsp;{{ sheetAnnonce()!.prix | fcfa }}
                </div>
              </div>
            </div>
            <div class="action-list">
              @for (action of getActions(sheetAnnonce()!); track action.label) {
                <button type="button" class="action-btn" (click)="action.fn()">
                  <div class="action-icon" [ngClass]="action.iconCls">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="action.icon"/>
                    </svg>
                  </div>
                  <div>
                    <div class="action-label">{{ action.label }}</div>
                    <div class="action-desc">{{ action.desc }}</div>
                  </div>
                </button>
              }
            </div>
          }
          <button type="button" class="sheet-cancel" (click)="sheetOpen.set(false)">Annuler</button>
        </div>
      </div>
    }

    <!-- ══ CONFIRM MODAL ══ -->
    @if (confirmOpen()) {
      <div class="modal-overlay" (click)="onConfirmOverlay($event)">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon" [class.danger]="confirmDanger()" [class.warn]="!confirmDanger()">
              @if (confirmDanger()) {
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                       m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              } @else {
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94
                       a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              }
            </div>
            <h2 class="modal-title">{{ confirmTitle() }}</h2>
            <p class="modal-msg">{{ confirmMessage() }}</p>
          </div>
          <div class="modal-body">
            <div class="modal-actions">
              <button type="button" class="modal-cancel-btn" (click)="confirmOpen.set(false)">Annuler</button>
              <button type="button" class="modal-confirm"
                [class.danger]="confirmDanger()" [class.warn]="!confirmDanger()"
                (click)="executeAction()">
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  @if (confirmDanger()) {
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  }
                </svg>
                {{ confirmLabel() }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══ HEADER ══ -->
    @if (mesAnnonces().length > 0) {
      <div class="page-header">
        <div class="page-header-left">
          <span class="page-title">Mes annonces</span>
          <span class="count-pill">{{ mesAnnonces().length }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="view-toggle">
            <button type="button" class="view-btn"
              [class.active]="viewMode() === 'cards'" (click)="viewMode.set('cards')" title="Cartes">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button type="button" class="view-btn"
              [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')" title="Tableau">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </button>
          </div>
          <a routerLink="/annonces/creer" class="btn-new">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nouvelle annonce
          </a>
        </div>
      </div>
    }

    <!-- ══ EMPTY ══ -->
    @if (mesAnnonces().length === 0) {
      <div class="empty-wrap">
        <div class="empty-ring">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10
                 a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4
                 a1 1 0 001 1m-6 0h6"/>
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

    <!-- ══ CARDS ══ -->
    } @else if (viewMode() === 'cards') {
      <div class="cards-grid">
        @for (a of mesAnnonces(); track a.id) {
          <div class="ann-card">
            <div class="card-img" [class.img-loaded]="imgLoaded[a.id]">
              @if (a.photoUrl) {
                <img [src]="a.photoUrl" [alt]="a.typeBien" loading="lazy"
                  (load)="imgLoaded[a.id] = true" (error)="onImgError($event, a.id)"/>
                <div class="img-shimmer"></div>
              } @else {
                <div class="no-photo">
                  <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                         a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6
                         a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Aucune photo</span>
                </div>
              }
              <span class="badge-statut" [ngClass]="getStatutClass(a.statut)">
                {{ getStatutLabel(a.statut) }}
              </span>
              <div class="price-badge">{{ a.prix | fcfa }}</div>
              <button type="button" class="btn-img-menu"
                (click)="openSheet(a); $event.stopPropagation()" aria-label="Actions">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5"  r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
            </div>

            <div class="card-body">
              <div class="card-title">{{ a.typeBien }}</div>
              <div class="card-loc">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243
                       a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ a.quartier }}, {{ a.ville }}
              </div>
              <div class="card-stats">
                <span class="chip">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {{ a.nombreVues }} vues
                </span>
                <span class="chip">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8
                         a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72
                         C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  {{ a.nombreCommentaires }} contacts
                </span>
              </div>
            </div>

            <div class="card-footer">
              <span class="exp-label">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ a.dateExpirationFormatee || (a.dateExpiration | timeAgo) }}
              </span>
              <a class="btn-detail" [routerLink]="['/annonces', a.id]"
                (click)="$event.stopPropagation()">
                Voir
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        }
      </div>

    <!-- ══ TABLE ══ -->
    } @else {
      <div class="table-view-wrap">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Annonce</th>
                <th>Prix</th>
                <th>Statut</th>
                <th class="r">Stats</th>
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
                            <path stroke-linecap="round" stroke-linejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                                 a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6
                                 a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
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
                  <td>
                    <span class="tbl-badge" [ngClass]="getStatutClass(a.statut)">
                      {{ getStatutLabel(a.statut) }}
                    </span>
                  </td>
                  <td class="r">
                    <div class="td-stats">
                      <span class="td-stat-row">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {{ a.nombreVues }} vues
                      </span>
                      <span class="td-stat-row">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8
                               a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72
                               C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        {{ a.nombreCommentaires }} contacts
                      </span>
                    </div>
                  </td>
                  <td class="r">
                    <span class="td-exp">
                      {{ a.dateExpirationFormatee || (a.dateExpiration | timeAgo) }}
                    </span>
                  </td>
                  <td>
                    <div class="td-acts">
                      <button type="button" class="tbl-menu" (click)="openSheet(a)" aria-label="Actions">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5"  r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Fallback cards mobile -->
      <div class="cards-fallback">
        <div class="cards-grid">
          @for (a of mesAnnonces(); track a.id) {
            <div class="ann-card">
              <div class="card-img">
                @if (a.photoUrl) {
                  <img [src]="a.photoUrl" [alt]="a.typeBien" loading="lazy"/>
                } @else {
                  <div class="no-photo">
                    <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                           a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6
                           a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>Aucune photo</span>
                  </div>
                }
                <span class="badge-statut" [ngClass]="getStatutClass(a.statut)">
                  {{ getStatutLabel(a.statut) }}
                </span>
                <div class="price-badge">{{ a.prix | fcfa }}</div>
                <button type="button" class="btn-img-menu"
                  (click)="openSheet(a); $event.stopPropagation()" aria-label="Actions">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5"  r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
              </div>
              <div class="card-body">
                <div class="card-title">{{ a.typeBien }}</div>
                <div class="card-loc">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243
                         a8 8 0 1111.314 0z"/>
                  </svg>
                  {{ a.quartier }}, {{ a.ville }}
                </div>
                <div class="card-stats">
                  <span class="chip">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {{ a.nombreVues }} vues
                  </span>
                  <span class="chip">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8
                           a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72
                           C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    {{ a.nombreCommentaires }} contacts
                  </span>
                </div>
              </div>
              <div class="card-footer">
                <span class="exp-label">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ a.dateExpirationFormatee || (a.dateExpiration | timeAgo) }}
                </span>
                <a class="btn-detail" [routerLink]="['/annonces', a.id]"
                  (click)="$event.stopPropagation()">
                  Voir
                  <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
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
  readonly viewMode      = signal<'cards' | 'table'>('cards');

  imgLoaded: Record<number, boolean> = {};

  readonly sheetOpen    = signal(false);
  readonly sheetAnnonce = signal<AnnonceDashboardResponse | null>(null);

  readonly confirmOpen    = signal(false);
  readonly confirmTitle   = signal('');
  readonly confirmMessage = signal('');
  readonly confirmLabel   = signal('Confirmer');
  readonly confirmDanger  = signal(false);
  private pendingAction?: () => void;

  ngOnInit(): void {
    this.store.dispatch(annonceActions.loadMesAnnonces({}));
  }

  onImgError(event: Event, id: number): void {
    (event.target as HTMLImageElement).style.display = 'none';
    this.imgLoaded[id] = true;
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      ACTIVE:   's-active',
      EN_PAUSE: 's-pause',
      EXPIREE:  's-expired',
      ARCHIVEE: 's-arch',
    };
    return map[statut] ?? 's-active';
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      ACTIVE:   'Active',
      EN_PAUSE: 'En pause',
      EXPIREE:  'Expirée',
      ARCHIVEE: 'Archivée',
    };
    return map[statut] ?? statut;
  }

  openSheet(a: AnnonceDashboardResponse): void {
    this.sheetAnnonce.set(a);
    this.sheetOpen.set(true);
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('sheet-overlay')) {
      this.sheetOpen.set(false);
    }
  }

  onConfirmOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.confirmOpen.set(false);
    }
  }

  getActions(a: AnnonceDashboardResponse): Array<{
    label: string; desc: string; fn: () => void; iconCls: string; icon: string;
  }> {
    const ICONS = {
      edit:      'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      pause:     'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
      resume:    'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
      renew:     'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      unarchive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
      delete:    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    };
    const actions: Array<{ label: string; desc: string; fn: () => void; iconCls: string; icon: string; }> = [];
    const s = a.statut;

    if (s !== 'SUPPRIMEE' && s !== 'ARCHIVEE') {
      actions.push({
        label: 'Modifier', desc: 'Changer les informations', iconCls: 'ai-blue', icon: ICONS.edit,
        fn: () => { this.sheetOpen.set(false); this.router.navigate(['/annonces', a.id, 'modifier']); },
      });
    }
    if (s === 'ACTIVE') {
      actions.push({
        label: 'Mettre en pause', desc: 'Masquer temporairement', iconCls: 'ai-amber', icon: ICONS.pause,
        fn: () => { this.sheetOpen.set(false); this.confirm('Mettre en pause ?', "Votre annonce ne sera plus visible jusqu'à réactivation.", false, 'Mettre en pause', () => this.store.dispatch(annonceActions.pause({ id: a.id }))); },
      });
      actions.push({
        label: 'Renouveler', desc: 'Prolonger de 30 jours', iconCls: 'ai-sky', icon: ICONS.renew,
        fn: () => { this.sheetOpen.set(false); this.store.dispatch(annonceActions.renouveler({ id: a.id })); },
      });
    }
    if (s === 'EN_PAUSE') {
      actions.push({
        label: 'Réactiver', desc: 'Rendre visible à nouveau', iconCls: 'ai-green', icon: ICONS.resume,
        fn: () => { this.sheetOpen.set(false); this.store.dispatch(annonceActions.reactiver({ id: a.id })); },
      });
    }
    if (s === 'EXPIREE') {
      actions.push({
        label: 'Renouveler', desc: 'Remettre en ligne pour 30j', iconCls: 'ai-sky', icon: ICONS.renew,
        fn: () => { this.sheetOpen.set(false); this.store.dispatch(annonceActions.renouveler({ id: a.id })); },
      });
    }
    if (s === 'ARCHIVEE') {
      actions.push({
        label: 'Désarchiver', desc: 'Remettre en pause', iconCls: 'ai-green', icon: ICONS.unarchive,
        fn: () => { this.sheetOpen.set(false); this.confirm('Désarchiver cette annonce ?', 'Elle sera remise en pause, vous pourrez la réactiver.', false, 'Désarchiver', () => this.store.dispatch(annonceActions.desarchiver({ id: a.id }))); },
      });
    }
    actions.push({
      label: 'Supprimer', desc: 'Action irréversible', iconCls: 'ai-red', icon: ICONS.delete,
      fn: () => { this.sheetOpen.set(false); this.confirm('Supprimer définitivement ?', 'Toutes les données associées seront perdues.', true, 'Supprimer', () => this.store.dispatch(annonceActions.supprimer({ id: a.id }))); },
    });
    return actions;
  }

  confirm(title: string, message: string, danger: boolean, label: string, fn: () => void): void {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.confirmDanger.set(danger);
    this.confirmLabel.set(label);
    this.pendingAction = fn;
    this.confirmOpen.set(true);
  }

  executeAction(): void {
    this.confirmOpen.set(false);
    this.pendingAction?.();
    this.pendingAction = undefined;
    // Pas besoin de recharger ici : annonce.effects.ts (actionSuccess$) recharge
    // déjà mesAnnonces automatiquement après chaque action réussie.
  }
}