import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { RoleUtilisateur } from '@core/services/models';
import { ToastService } from '@core/services/toast.service';
import { AdminUtilisateurResponse } from '@core/services/models/admin.model';

// cSpell:ignore ACTIF SUSPENDU BANNI

type ViewMode = 'table' | 'card';

/**
 * Normalise un numéro de téléphone camerounais au format +237XXXXXXXXX.
 */
function normaliseTelephone(raw: string): string {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('237')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return '+237' + digits;
}

/**
 * Valide qu'un numéro camerounais est correct.
 */
function telephoneValide(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, '').replace(/^237/, '').replace(/^0/, '');
  return /^[6-9]\d{8}$/.test(digits) || /^[23]\d{8}$/.test(digits);
}

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  styles: [`
    :host { display: block; font-family: 'DM Sans', system-ui, sans-serif; }

    /* ── STATS CARDS ── */
    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 20px; }
    @media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 480px) { .stats-row { grid-template-columns: repeat(2,1fr); } }
    .stat-card {
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px;
      padding: 14px 16px; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 1px 4px rgba(30,58,95,.04);
    }
    .stat-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon svg { width: 18px; height: 18px; }
    .stat-val { font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -.03em; line-height: 1; }
    .stat-lbl { font-size: 11px; color: #6B7280; margin-top: 3px; font-weight: 500; }

    /* ── TOPBAR ── */
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
    }
    .topbar-title { font-size: 17px; font-weight: 800; color: #0F172A; letter-spacing: -.3px; }
    .topbar-sub { font-size: 12px; color: #64748B; margin-top: 2px; }
    .topbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    /* ── BOUTONS TOPBAR ── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 7px;
      height: 38px; padding: 0 16px; background: #1E2875; color: #fff;
      border: none; border-radius: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background .15s; white-space: nowrap;
    }
    .btn-primary:hover { background: #3245D1; }
    .btn-primary svg { width: 14px; height: 14px; }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 14px; background: #fff; color: #374151;
      border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 13px; font-weight: 500;
      cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap;
    }
    .btn-secondary:hover { background: #F8FAFC; border-color: #94A3B8; }
    .btn-secondary svg { width: 14px; height: 14px; }

    /* ── VIEW TOGGLE ── */
    .view-toggle { display: flex; background: #F1F5F9; border-radius: 9px; padding: 3px; gap: 2px; }
    .btn-view {
      height: 32px; padding: 0 12px; border: none; border-radius: 7px;
      font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;
      color: #64748B; background: transparent; transition: all .15s;
      display: flex; align-items: center; gap: 5px;
    }
    .btn-view svg { width: 14px; height: 14px; }
    .btn-view.active { background: #fff; color: #0F172A; box-shadow: 0 1px 3px rgba(0,0,0,.08); }

    /* ── FILTERS BAR ── */
    .filters-bar {
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px;
      padding: 14px 16px; display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 10px; align-items: end; margin-bottom: 16px;
    }
    @media (max-width: 700px) { .filters-bar { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .filters-bar { grid-template-columns: 1fr; } }
    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-lbl { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .07em; }
    .filter-input, .filter-select {
      height: 36px; padding: 0 12px; border: 1.5px solid #E5E7EB;
      border-radius: 8px; background: #F8FAFC; color: #0F172A;
      font-size: 13px; outline: none; font-family: inherit; transition: border-color .15s;
    }
    .filter-input:focus, .filter-select:focus { border-color: #3245D1; box-shadow: 0 0 0 3px rgba(50,69,209,.08); }
    .filter-select { appearance: none; cursor: pointer; }
    .btn-reset {
      height: 36px; padding: 0 14px; border: 1.5px solid #E5E7EB;
      border-radius: 8px; background: #F8FAFC; color: #64748B;
      font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;
      transition: all .12s; white-space: nowrap;
    }
    .btn-reset:hover { background: #F1F5F9; border-color: #94A3B8; color: #0F172A; }

    /* ── RESULTS BAR ── */
    .results-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    .results-count { font-size: 12.5px; color: #64748B; }
    .results-count strong { color: #0F172A; font-weight: 700; }

    /* ── TABLE ── */
    .table-card { background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px; overflow: hidden; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; border-collapse: collapse; min-width: 680px; }
    thead tr { background: #F8FAFC; border-bottom: 1.5px solid #E5E7EB; }
    th {
      padding: 10px 14px; text-align: left;
      font-size: 10px; font-weight: 700; color: #94A3B8;
      text-transform: uppercase; letter-spacing: .07em; white-space: nowrap; user-select: none;
    }
    th.r { text-align: right; }
    tbody tr { border-bottom: 1px solid #F1F5F9; transition: background .1s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #F5F6FF; }
    td { padding: 11px 14px; vertical-align: middle; }
    td.r { text-align: right; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; letter-spacing: .02em;
    }
    .td-name { font-size: 13px; font-weight: 600; color: #0F172A; line-height: 1.2; }
    .td-email { font-size: 11.5px; color: #64748B; margin-top: 1px; }
    .td-phone { font-size: 11px; color: #94A3B8; margin-top: 1px; }
    .td-ville { font-size: 13px; color: #475569; }
    .td-count { font-size: 13px; font-weight: 700; color: #1E2875; }
    .td-date { font-size: 12px; color: #475569; }

    /* ── BADGES ── */
    .role-badge {
      display: inline-flex; align-items: center;
      padding: 2px 9px; border-radius: 20px;
      font-size: 11px; font-weight: 700; letter-spacing: .02em;
    }
    .role-admin { background: #EEF2FF; color: #4F46E5; border: 1px solid #C7D2FE; }
    .role-user  { background: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .s-actif    { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
    .s-actif .status-dot    { background: #22C55E; }
    .s-suspendu { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
    .s-suspendu .status-dot { background: #F59E0B; }
    .s-banni    { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
    .s-banni .status-dot    { background: #EF4444; }
    .s-default  { background: #F8FAFC; color: #64748B; border: 1px solid #E2E8F0; }
    .s-default .status-dot  { background: #94A3B8; }

    /* ── 3-DOTS MENU ── */
    .menu-wrap { position: relative; display: inline-block; }
    .btn-dots {
      width: 30px; height: 30px; border-radius: 7px;
      border: 1.5px solid #E5E7EB; background: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .12s; color: #64748B;
    }
    .btn-dots:hover { background: #F1F5F9; border-color: #94A3B8; color: #0F172A; }
    .btn-dots svg { width: 15px; height: 15px; }
    .dropdown {
      position: absolute; right: 0; top: calc(100% + 4px); z-index: 100;
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.1); min-width: 180px; overflow: hidden;
      animation: dropIn .15s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes dropIn { from { opacity:0; transform: scale(.95) translateY(-4px); } to { opacity:1; transform: scale(1) translateY(0); } }
    .drop-item {
      display: flex; align-items: center; gap: 9px;
      padding: 10px 14px; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: background .1s; border: none;
      background: none; width: 100%; text-align: left; font-family: inherit; color: #374151;
    }
    .drop-item:hover { background: #F8FAFC; }
    .drop-item svg { width: 14px; height: 14px; flex-shrink: 0; }
    .drop-item.danger { color: #DC2626; }
    .drop-item.danger:hover { background: #FEF2F2; }
    .drop-item.success { color: #15803D; }
    .drop-item.success:hover { background: #F0FDF4; }
    .drop-item.info { color: #4F46E5; }
    .drop-item.info:hover { background: #EEF2FF; }
    .drop-sep { height: 1px; background: #F1F5F9; margin: 4px 0; }

    /* ── CARD VIEW ── */
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 12px; }
    @media (max-width: 560px) { .cards-grid { grid-template-columns: 1fr; } }
    .user-card {
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px;
      overflow: hidden; transition: box-shadow .15s, border-color .15s;
    }
    .user-card:hover { border-color: #C7D2FE; box-shadow: 0 4px 16px rgba(50,69,209,.08); }
    .card-top { padding: 14px 14px 10px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .card-avatar {
      width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
    }
    .card-info { flex: 1; min-width: 0; }
    .card-name { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-email { font-size: 12px; color: #64748B; margin: 0 0 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-phone { font-size: 11px; color: #94A3B8; margin: 0; }
    .card-body { padding: 0 14px 10px; border-top: 1px solid #F1F5F9; }
    .card-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #F8FAFC; }
    .card-row:last-child { border-bottom: none; }
    .card-row-lbl { font-size: 11.5px; color: #94A3B8; }
    .card-row-val { font-size: 12px; font-weight: 600; color: #0F172A; }

    /* ── MODAL OVERLAY ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(10,20,50,.6); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
      animation: fadeIn .18s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .modal-box {
      background: #fff; border-radius: 20px; width: 100%; max-width: 520px;
      box-shadow: 0 32px 80px rgba(0,0,0,.22);
      animation: boxIn .22s cubic-bezier(.34,1.56,.64,1);
      overflow: hidden;
    }
    @keyframes boxIn { from{transform:scale(.92) translateY(14px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }

    /* ── MODAL HEADER ── */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 0;
    }
    .modal-title { font-size: 16px; font-weight: 800; color: #0F172A; letter-spacing: -.3px; }
    .modal-close {
      width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid #E5E7EB;
      background: #F8FAFC; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #64748B; transition: all .12s;
    }
    .modal-close:hover { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
    .modal-close svg { width: 14px; height: 14px; }

    /* ── MODAL BODY ── */
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-lbl {
      font-size: 11px; font-weight: 700; color: #64748B;
      text-transform: uppercase; letter-spacing: .07em;
    }
    .form-input, .form-select {
      height: 42px; padding: 0 12px; border: 1.5px solid #E5E7EB;
      border-radius: 10px; background: #F8FAFC; color: #0F172A;
      font-size: 13.5px; outline: none; font-family: inherit; transition: border-color .15s, box-shadow .15s;
      width: 100%;
    }
    .form-input:focus, .form-select:focus {
      border-color: #3245D1; box-shadow: 0 0 0 3px rgba(50,69,209,.1); background: #fff;
    }
    .form-input.err { border-color: #F87171; background: #FFF5F5; }
    .form-input.err:focus { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
    .form-input.ok  { border-color: #86EFAC; background: #F0FDF4; }
    .form-err { font-size: 11px; color: #DC2626; margin-top: 2px; display: flex; align-items: center; gap: 4px; }
    .form-hint { font-size: 11px; color: #94A3B8; margin-top: 2px; }

    /* ── PHONE INPUT ── */
    .phone-wrap { position: relative; }
    .phone-prefix {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      font-size: 13.5px; font-weight: 600; color: #475569; pointer-events: none;
      display: flex; align-items: center; gap: 6px;
    }
    .phone-flag { font-size: 15px; }
    .phone-input-inner {
      height: 42px; padding: 0 12px 0 80px; border: 1.5px solid #E5E7EB;
      border-radius: 10px; background: #F8FAFC; color: #0F172A;
      font-size: 13.5px; outline: none; font-family: inherit; transition: border-color .15s, box-shadow .15s;
      width: 100%;
    }
    .phone-input-inner:focus {
      border-color: #3245D1; box-shadow: 0 0 0 3px rgba(50,69,209,.1); background: #fff;
    }
    .phone-input-inner.err { border-color: #F87171; background: #FFF5F5; }
    .phone-input-inner.ok  { border-color: #86EFAC; background: #F0FDF4; }

    /* ── MODAL FOOTER ── */
    .modal-footer { display: flex; gap: 10px; padding: 0 24px 24px; }
    .btn-cancel {
      height: 46px; padding: 0 20px;
      background: #F1F5F9; color: #475569;
      border: 1.5px solid #E2E8F0; border-radius: 12px;
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: all .15s; white-space: nowrap; flex-shrink: 0;
    }
    .btn-cancel:hover { background: #E2E8F0; border-color: #94A3B8; }

    /* ── BOUTON SOUMETTRE PRINCIPAL ── */
    .btn-submit {
      flex: 1; height: 46px;
      background: linear-gradient(135deg, #1E2875 0%, #3245D1 100%);
      color: #fff; border: none; border-radius: 12px;
      font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
      transition: all .2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 14px rgba(50,69,209,.35);
      letter-spacing: .01em;
    }
    .btn-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, #253294 0%, #3d53e8 100%);
      box-shadow: 0 6px 20px rgba(50,69,209,.45);
      transform: translateY(-1px);
    }
    .btn-submit:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 8px rgba(50,69,209,.3); }
    .btn-submit:disabled {
      opacity: .55; cursor: not-allowed;
      box-shadow: none; transform: none;
    }
    .btn-submit svg { width: 16px; height: 16px; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── CONFIRM MODAL ── */
    .confirm-icon {
      width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .confirm-icon svg { width: 26px; height: 26px; }
    .confirm-title { font-size: 17px; font-weight: 800; color: #0F172A; text-align: center; margin-bottom: 8px; }
    .confirm-msg { font-size: 13px; color: #64748B; text-align: center; line-height: 1.6; margin-bottom: 0; }

    /* ── PAGINATION ── */
    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-top: 1.5px solid #E5E7EB; gap: 12px; flex-wrap: wrap;
    }
    .pg-info { font-size: 12px; color: #94A3B8; flex-shrink: 0; }
    .pg-info strong { color: #475569; }
    .pg-btns { display: flex; align-items: center; gap: 4px; }
    .btn-pg {
      display: flex; align-items: center; justify-content: center;
      min-width: 32px; height: 32px; padding: 0 8px; border-radius: 8px;
      border: 1.5px solid #E5E7EB; background: transparent; color: #475569;
      font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .12s;
    }
    .btn-pg:hover:not(:disabled):not(.active) { background: #F8FAFC; border-color: #94A3B8; }
    .btn-pg.active { background: #1E2875; border-color: #1E2875; color: #fff; }
    .btn-pg:disabled { opacity: .35; cursor: not-allowed; }
    .pg-dots { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; color: #94A3B8; font-size: 13px; }

    /* ── SKELETON ── */
    .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation: shim 1.4s infinite; border-radius: 7px; }
    @keyframes shim { to { background-position: -200% 0; } }

    /* ── EMPTY ── */
    .empty-state { padding: 60px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; }
    .empty-icon { width: 60px; height: 60px; background: #F1F5F9; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
    .empty-icon svg { width: 26px; height: 26px; color: #CBD5E1; }
    .empty-title { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; }
    .empty-sub { font-size: 13px; color: #94A3B8; max-width: 300px; line-height: 1.6; margin: 0; }
  `],
  template: `
    <!-- ══ MODAL CRÉATION UTILISATEUR ══ -->
    @if (modalOpen()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-box" (click)="$event.stopPropagation()">

          <div class="modal-header">
            <span class="modal-title">Nouvel utilisateur</span>
            <button class="modal-close" (click)="closeModal()">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">

            <!-- Prénom / Nom -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-lbl">Prénom *</label>
                <input
                  class="form-input"
                  [class.err]="formErr['prenom']"
                  [(ngModel)]="newPrenom"
                  placeholder="Jean"
                  autocomplete="given-name"
                />
                @if (formErr['prenom']) {
                  <span class="form-err">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ formErr['prenom'] }}
                  </span>
                }
              </div>
              <div class="form-group">
                <label class="form-lbl">Nom *</label>
                <input
                  class="form-input"
                  [class.err]="formErr['nom']"
                  [(ngModel)]="newNom"
                  placeholder="Dupont"
                  autocomplete="family-name"
                />
                @if (formErr['nom']) {
                  <span class="form-err">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ formErr['nom'] }}
                  </span>
                }
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-lbl">Adresse email *</label>
              <input
                class="form-input"
                [class.err]="formErr['email']"
                type="email"
                [(ngModel)]="newEmail"
                placeholder="jean.dupont@example.com"
                autocomplete="email"
              />
              @if (formErr['email']) {
                <span class="form-err">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ formErr['email'] }}
                </span>
              }
            </div>

            <!-- Téléphone -->
            <div class="form-group">
              <label class="form-lbl">Téléphone *</label>
              <div class="phone-wrap">
                <div class="phone-prefix">
                  <span class="phone-flag">🇨🇲</span>
                  <span>+237</span>
                </div>
                <input
                  class="phone-input-inner"
                  [class.err]="formErr['telephone']"
                  [class.ok]="!formErr['telephone'] && newTelephone.length >= 9"
                  [ngModel]="telDisplay"
                  (ngModelChange)="onTelInput($event)"
                  placeholder="6 XX XXX XXX"
                  type="tel"
                  maxlength="13"
                  autocomplete="tel"
                />
              </div>
              @if (formErr['telephone']) {
                <span class="form-err">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ formErr['telephone'] }}
                </span>
              } @else {
                <span class="form-hint">Format attendu : 6 XX XXX XXX (numéro camerounais)</span>
              }
            </div>

            <!-- Ville / Rôle -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-lbl">Ville *</label>
                <input
                  class="form-input"
                  [class.err]="formErr['ville']"
                  [(ngModel)]="newVille"
                  placeholder="Douala"
                />
                @if (formErr['ville']) {
                  <span class="form-err">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ formErr['ville'] }}
                  </span>
                }
              </div>
              <div class="form-group">
                <label class="form-lbl">Rôle</label>
                <select class="form-select" [(ngModel)]="newRole">
                  @for (r of roles; track r) {
                    <option [ngValue]="r">{{ r === 'ADMINISTRATEUR' ? 'Administrateur' : 'Utilisateur' }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Mot de passe -->
            <div class="form-group">
              <label class="form-lbl">Mot de passe *</label>
              <input
                class="form-input"
                [class.err]="formErr['mdp']"
                [class.ok]="!formErr['mdp'] && newMotDePasse.length >= 8"
                type="password"
                [(ngModel)]="newMotDePasse"
                placeholder="Minimum 8 caractères"
                autocomplete="new-password"
              />
              @if (formErr['mdp']) {
                <span class="form-err">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ formErr['mdp'] }}
                </span>
              } @else {
                <span class="form-hint">Le mot de passe doit contenir au moins 8 caractères</span>
              }
            </div>

          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()">Annuler</button>
            <button class="btn-submit" [disabled]="creatingUser()" (click)="submitCreate()">
              @if (creatingUser()) {
                <svg style="animation:spin .65s linear infinite" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Création en cours…
              } @else {
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                Créer l'utilisateur
              }
            </button>
          </div>

        </div>
      </div>
    }

    <!-- ══ MODAL CONFIRMATION ══ -->
    @if (confirmOpen()) {
      <div class="modal-overlay" (click)="confirmOpen.set(false)">
        <div class="modal-box" style="max-width:380px" (click)="$event.stopPropagation()">
          <div class="modal-body" style="padding:28px 24px 20px;align-items:center">
            <div class="confirm-icon" [style.background]="confirmDanger() ? '#FEF2F2' : '#FFFBEB'">
              @if (confirmDanger()) {
                <svg fill="none" stroke="#DC2626" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              } @else {
                <svg fill="none" stroke="#D97706" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              }
            </div>
            <p class="confirm-title">{{ confirmTitle() }}</p>
            <p class="confirm-msg">{{ confirmMsg() }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="confirmOpen.set(false)">Annuler</button>
            <button class="btn-submit"
              [style.background]="confirmDanger() ? 'linear-gradient(135deg,#991B1B,#DC2626)' : 'linear-gradient(135deg,#92400E,#D97706)'"
              (click)="executeAction()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ MODAL MODIFIER RÔLE ══ -->
    @if (roleModalOpen()) {
      <div class="modal-overlay" (click)="roleModalOpen.set(false)">
        <div class="modal-box" style="max-width:380px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-title">Modifier le rôle</span>
            <button class="modal-close" (click)="roleModalOpen.set(false)">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-lbl">Nouveau rôle pour {{ roleTargetName() }}</label>
              <select class="form-select" [(ngModel)]="selectedRole">
                @for (r of roles; track r) {
                  <option [ngValue]="r">{{ r === 'ADMINISTRATEUR' ? 'Administrateur' : 'Utilisateur' }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="roleModalOpen.set(false)">Annuler</button>
            <button class="btn-submit" (click)="submitRole()">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ STATS PAR STATUT ══ -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background:#F0FDF4">
          <svg fill="none" stroke="#22C55E" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <div class="stat-val">{{ statsActifs() }}</div>
          <div class="stat-lbl">Actifs</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FFFBEB">
          <svg fill="none" stroke="#F59E0B" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <div>
          <div class="stat-val">{{ statsSuspendus() }}</div>
          <div class="stat-lbl">Suspendus</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF2F2">
          <svg fill="none" stroke="#EF4444" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
        </div>
        <div>
          <div class="stat-val">{{ statsBannis() }}</div>
          <div class="stat-lbl">Bannis</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#EEF2FF">
          <svg fill="none" stroke="#4F46E5" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div>
          <div class="stat-val">{{ statsAdmins() }}</div>
          <div class="stat-lbl">Administrateurs</div>
        </div>
      </div>
    </div>

    <!-- ══ TOPBAR ══ -->
    <div class="topbar">
      <div>
        <div class="topbar-title">Utilisateurs</div>
        <div class="topbar-sub">
          {{ allUsers().length }} utilisateur(s) au total
          @if (hasActiveFilters()) {
            · <strong style="color:#1E2875">{{ filteredUsers().length }} résultat(s) filtrés</strong>
          }
        </div>
      </div>
      <div class="topbar-right">
        <div class="view-toggle" role="group">
          <button class="btn-view" [class.active]="viewMode()==='table'" (click)="viewMode.set('table')">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            Tableau
          </button>
          <button class="btn-view" [class.active]="viewMode()==='card'" (click)="viewMode.set('card')">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Cartes
          </button>
        </div>
        <button class="btn-secondary" (click)="exportPDF()">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export PDF
        </button>
        <button class="btn-primary" (click)="openModal()">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter
        </button>
      </div>
    </div>

    <!-- ══ FILTRES ══ -->
    <div class="filters-bar">
      <div class="filter-group" style="grid-column:1">
        <label class="filter-lbl">Recherche</label>
        <input class="filter-input" [(ngModel)]="searchTerm"
          (ngModelChange)="onSearchChange()"
          placeholder="Nom, prénom, email, téléphone, ville…"/>
      </div>
      <div class="filter-group">
        <label class="filter-lbl">Statut</label>
        <select class="filter-select" [(ngModel)]="filterStatut" (ngModelChange)="applyFilters()">
          <option value="">Tous</option>
          <option value="ACTIF">Actif</option>
          <option value="SUSPENDU">Suspendu</option>
          <option value="BANNI">Banni</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-lbl">Rôle</label>
        <select class="filter-select" [(ngModel)]="filterRole" (ngModelChange)="applyFilters()">
          <option value="">Tous</option>
          <option value="UTILISATEUR">Utilisateur</option>
          <option value="ADMINISTRATEUR">Admin</option>
        </select>
      </div>
      <button class="btn-reset" (click)="resetFilters()">Réinitialiser</button>
    </div>

    <!-- ══ RÉSULTATS ══ -->
    @if (!loading() && filteredUsers().length > 0) {
      <div class="results-bar">
        <span class="results-count">
          <strong>{{ filteredUsers().length }}</strong> résultat(s)
          @if (hasActiveFilters()) { · filtrés }
        </span>
      </div>
    }

    <!-- ══ VUE TABLEAU ══ -->
    @if (viewMode() === 'table') {
      <div class="table-card">
        @if (loading()) {
          <div class="table-scroll">
            <table>
              <thead><tr>
                <th>Utilisateur</th><th>Ville</th><th>Rôle</th>
                <th>Statut</th><th class="r">Annonces</th><th>Inscrit</th><th></th>
              </tr></thead>
              <tbody>
                @for (i of [1,2,3,4,5,6,7,8]; track i) {
                  <tr>
                    <td><div class="sk" style="height:14px;width:200px"></div></td>
                    <td><div class="sk" style="height:14px;width:80px"></div></td>
                    <td><div class="sk" style="height:14px;width:90px"></div></td>
                    <td><div class="sk" style="height:14px;width:80px"></div></td>
                    <td class="r"><div class="sk" style="height:14px;width:30px;display:inline-block"></div></td>
                    <td><div class="sk" style="height:14px;width:90px"></div></td>
                    <td><div class="sk" style="height:28px;width:30px;border-radius:8px"></div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (pagedUsers().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <p class="empty-title">Aucun utilisateur trouvé</p>
            <p class="empty-sub">
              @if (hasActiveFilters()) {
                Aucun résultat pour les filtres appliqués.
              } @else { Aucun utilisateur enregistré. }
            </p>
          </div>
        } @else {
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Ville</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th class="r">Annonces</th>
                  <th>Inscrit</th>
                  <th class="r">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of pagedUsers(); track u.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="avatar" [style.background]="avatarBg(u)" [style.color]="avatarColor(u)">
                          {{ initials(u) }}
                        </div>
                        <div>
                          <div class="td-name">{{ fullName(u) }}</div>
                          <div class="td-email">{{ u.email }}</div>
                          <div class="td-phone">{{ u.telephoneMasque || '—' }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="td-ville">{{ u.ville || '—' }}</span></td>
                    <td>
                      <span class="role-badge" [ngClass]="u.role === 'ADMINISTRATEUR' ? 'role-admin' : 'role-user'">
                        {{ u.role === 'ADMINISTRATEUR' ? 'Admin' : 'Utilisateur' }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [ngClass]="statusCls(u.statut)">
                        <span class="status-dot"></span>{{ u.statut }}
                      </span>
                    </td>
                    <td class="r">
                      <span class="td-count">{{ u.nombreAnnoncesTotal }}</span>
                    </td>
                    <td><span class="td-date">{{ u.dateInscription | timeAgo }}</span></td>
                    <td class="r">
                      <div class="menu-wrap" (click)="$event.stopPropagation()">
                        <button class="btn-dots" (click)="toggleMenu(u.id)">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h.01M12 12h.01M19 12h.01"/>
                          </svg>
                        </button>
                        @if (openMenuId() === u.id) {
                          <div class="dropdown">
                            <button class="drop-item info" (click)="openRoleModal(u)">
                              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                              </svg>
                              Modifier le rôle
                            </button>
                            @if (u.statut === 'ACTIF') {
                              <div class="drop-sep"></div>
                              <button class="drop-item" style="color:#D97706" (click)="doSuspendre(u)">
                                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Suspendre
                              </button>
                              <button class="drop-item danger" (click)="doBannir(u)">
                                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                                </svg>
                                Bannir
                              </button>
                            }
                            @if (u.statut !== 'ACTIF') {
                              <div class="drop-sep"></div>
                              <button class="drop-item success" (click)="doActiver(u.id)">
                                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Réactiver
                              </button>
                            }
                          </div>
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
                <strong>{{ pageStart() }}–{{ pageEnd() }}</strong> sur <strong>{{ filteredUsers().length }}</strong>
              </span>
              <div class="pg-btns">
                <button class="btn-pg" (click)="goPage(page()-1)" [disabled]="page()===0">←</button>
                @for (p of pageNums(); track p) {
                  @if (p === -1) { <span class="pg-dots">…</span> }
                  @else {
                    <button class="btn-pg" [class.active]="p===page()" (click)="goPage(p)">{{ p+1 }}</button>
                  }
                }
                <button class="btn-pg" (click)="goPage(page()+1)" [disabled]="page()>=totalPages()-1">→</button>
              </div>
            </div>
          }
        }
      </div>
    }

    <!-- ══ VUE CARTES ══ -->
    @if (viewMode() === 'card') {
      @if (loading()) {
        <div class="cards-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="user-card" style="padding:14px">
              <div class="sk" style="height:14px;width:70%;margin-bottom:10px"></div>
              <div class="sk" style="height:12px;width:55%;margin-bottom:8px"></div>
              <div class="sk" style="height:12px;width:45%;margin-bottom:14px"></div>
              <div class="sk" style="height:34px;width:100%;border-radius:9px"></div>
            </div>
          }
        </div>
      } @else if (pagedUsers().length === 0) {
        <div class="table-card">
          <div class="empty-state">
            <div class="empty-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <p class="empty-title">Aucun utilisateur trouvé</p>
            <p class="empty-sub">Aucun résultat pour les filtres appliqués.</p>
          </div>
        </div>
      } @else {
        <div class="cards-grid">
          @for (u of pagedUsers(); track u.id) {
            <div class="user-card">
              <div class="card-top">
                <div class="card-avatar" [style.background]="avatarBg(u)" [style.color]="avatarColor(u)">
                  {{ initials(u) }}
                </div>
                <div class="card-info">
                  <p class="card-name">{{ fullName(u) }}</p>
                  <p class="card-email">{{ u.email }}</p>
                  <p class="card-phone">{{ u.telephoneMasque || '—' }}</p>
                </div>
                <div (click)="$event.stopPropagation()" style="position:relative">
                  <button class="btn-dots" (click)="toggleMenu(u.id)">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h.01M12 12h.01M19 12h.01"/>
                    </svg>
                  </button>
                  @if (openMenuId() === u.id) {
                    <div class="dropdown">
                      <button class="drop-item info" (click)="openRoleModal(u)">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        Modifier le rôle
                      </button>
                      @if (u.statut === 'ACTIF') {
                        <div class="drop-sep"></div>
                        <button class="drop-item" style="color:#D97706" (click)="doSuspendre(u)">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Suspendre
                        </button>
                        <button class="drop-item danger" (click)="doBannir(u)">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636"/>
                          </svg>
                          Bannir
                        </button>
                      }
                      @if (u.statut !== 'ACTIF') {
                        <div class="drop-sep"></div>
                        <button class="drop-item success" (click)="doActiver(u.id)">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Réactiver
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="card-body">
                <div class="card-row">
                  <span class="card-row-lbl">Ville</span>
                  <span class="card-row-val">{{ u.ville || '—' }}</span>
                </div>
                <div class="card-row">
                  <span class="card-row-lbl">Rôle</span>
                  <span class="role-badge" [ngClass]="u.role === 'ADMINISTRATEUR' ? 'role-admin' : 'role-user'">
                    {{ u.role === 'ADMINISTRATEUR' ? 'Admin' : 'Utilisateur' }}
                  </span>
                </div>
                <div class="card-row">
                  <span class="card-row-lbl">Statut</span>
                  <span class="status-badge" [ngClass]="statusCls(u.statut)">
                    <span class="status-dot"></span>{{ u.statut }}
                  </span>
                </div>
                <div class="card-row">
                  <span class="card-row-lbl">Annonces</span>
                  <span class="card-row-val" style="color:#1E2875;font-weight:700">
                    {{ u.nombreAnnoncesTotal }}
                  </span>
                </div>
                <div class="card-row">
                  <span class="card-row-lbl">Inscrit</span>
                  <span class="card-row-val">{{ u.dateInscription | timeAgo }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination" style="background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;margin-top:12px">
            <span class="pg-info">
              <strong>{{ pageStart() }}–{{ pageEnd() }}</strong> sur <strong>{{ filteredUsers().length }}</strong>
            </span>
            <div class="pg-btns">
              <button class="btn-pg" (click)="goPage(page()-1)" [disabled]="page()===0">←</button>
              @for (p of pageNums(); track p) {
                @if (p===-1) { <span class="pg-dots">…</span> }
                @else { <button class="btn-pg" [class.active]="p===page()" (click)="goPage(p)">{{ p+1 }}</button> }
              }
              <button class="btn-pg" (click)="goPage(page()+1)" [disabled]="page()>=totalPages()-1">→</button>
            </div>
          </div>
        }
      }
    }
  `,
})
export class AdminUtilisateursComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast    = inject(ToastService);

  // ── State ─────────────────────────────────────────────────────────────
  /** Tous les utilisateurs chargés depuis l'API (sans filtre) */
  allUsers   = signal<AdminUtilisateurResponse[]>([]);
  loading    = signal(false);
  viewMode   = signal<ViewMode>('table');
  openMenuId = signal<number | null>(null);

  // Filtres (gérés entièrement côté Angular)
  searchTerm   = '';
  filterStatut = '';
  filterRole   = '';

  // Pagination côté client
  page         = signal(0);
  readonly PAGE_SIZE = 10;

  // Modal création
  modalOpen     = signal(false);
  creatingUser  = signal(false);
  newPrenom     = '';
  newNom        = '';
  newEmail      = '';
  newTelephone  = '';
  telDisplay    = '';
  newVille      = '';
  newMotDePasse = '';
  newRole: RoleUtilisateur = RoleUtilisateur.UTILISATEUR;
  formErr: Record<string, string> = {};

  // Modal rôle
  roleModalOpen  = signal(false);
  roleTargetId   = signal<number | null>(null);
  roleTargetName = signal('');
  selectedRole: RoleUtilisateur = RoleUtilisateur.UTILISATEUR;

  // Modal confirmation
  confirmOpen   = signal(false);
  confirmTitle  = signal('');
  confirmMsg    = signal('');
  confirmLabel  = signal('Confirmer');
  confirmDanger = signal(true);
  private pendingFn?: () => void;

  readonly roles = [RoleUtilisateur.UTILISATEUR, RoleUtilisateur.ADMINISTRATEUR];

  // ── Filtrage côté Angular ──────────────────────────────────────────────
  /**
   * Liste filtrée selon les 3 critères : recherche textuelle, statut, rôle.
   * Recalculée automatiquement à chaque changement de signal.
   */
  filteredUsers = computed(() => {
    const list    = this.allUsers();
    const term    = this._searchSignal().trim().toLowerCase();
    const statut  = this._statutSignal();
    const role    = this._roleSignal();

    return list.filter(u => {
      // Filtre statut
      if (statut && u.statut !== statut) return false;

      // Filtre rôle
      if (role && u.role !== role) return false;

      // Filtre recherche textuelle (nom, prénom, email, téléphone, ville)
      if (term) {
        const hay = [
          u.prenom ?? '',
          u.nom ?? '',
          u.email ?? '',
          u.telephoneMasque ?? '',
          u.ville ?? '',
          this.fullName(u),
        ].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }

      return true;
    });
  });

  /** Utilisateurs de la page courante */
  pagedUsers = computed(() => {
    const start = this.page() * this.PAGE_SIZE;
    return this.filteredUsers().slice(start, start + this.PAGE_SIZE);
  });

  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.PAGE_SIZE));
  pageStart  = computed(() => this.page() * this.PAGE_SIZE + 1);
  pageEnd    = computed(() => Math.min((this.page() + 1) * this.PAGE_SIZE, this.filteredUsers().length));

  hasActiveFilters = computed(() =>
    !!this._searchSignal().trim() || !!this._statutSignal() || !!this._roleSignal()
  );

  // Signaux internes pour les filtres (permettent à computed() de réagir)
  private _searchSignal = signal('');
  private _statutSignal = signal('');
  private _roleSignal   = signal('');

  // ── Stats (sur TOUS les utilisateurs chargés) ─────────────────────────
  statsActifs    = computed(() => this.allUsers().filter(u => u.statut === 'ACTIF').length);
  statsSuspendus = computed(() => this.allUsers().filter(u => u.statut === 'SUSPENDU').length);
  statsBannis    = computed(() => this.allUsers().filter(u => u.statut === 'BANNI').length);
  statsAdmins    = computed(() => this.allUsers().filter(u => u.role === 'ADMINISTRATEUR').length);

  // ── Pagination ─────────────────────────────────────────────────────────
  pageNums = computed<number[]>(() => {
    const t = this.totalPages(), c = this.page();
    if (t <= 7) return Array.from({ length: t }, (_, i) => i);
    const pages: number[] = [0];
    if (c > 2) pages.push(-1);
    for (let i = Math.max(1, c - 1); i <= Math.min(t - 2, c + 1); i++) pages.push(i);
    if (c < t - 3) pages.push(-1);
    pages.push(t - 1);
    return pages;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
    document.addEventListener('click', () => this.openMenuId.set(null));
  }

  // ── Chargement SANS filtre (on charge tout, Angular filtre) ────────────
  loadAll(): void {
    this.loading.set(true);
    this.openMenuId.set(null);
    // On charge toujours sans paramètre de filtre pour avoir la liste complète
    this.adminApi.getUtilisateurs({ page: 0, taille: 9999 } as any).subscribe({
      next: r => {
        this.allUsers.set(r.data.contenu);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Gestion des filtres ────────────────────────────────────────────────
  private searchTimeout?: ReturnType<typeof setTimeout>;

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this._searchSignal.set(this.searchTerm);
      this.page.set(0); // retour à la première page
    }, 250);
  }

  applyFilters(): void {
    this._statutSignal.set(this.filterStatut);
    this._roleSignal.set(this.filterRole);
    this.page.set(0); // retour à la première page
  }

  resetFilters(): void {
    this.searchTerm  = '';
    this.filterStatut = '';
    this.filterRole   = '';
    this._searchSignal.set('');
    this._statutSignal.set('');
    this._roleSignal.set('');
    this.page.set(0);
  }

  goPage(p: number): void {
    this.page.set(p);
  }

  // ── Téléphone : formatage en temps réel ────────────────────────────────
  onTelInput(value: string): void {
    const digits = value.replace(/[^\d]/g, '').replace(/^237/, '').replace(/^0/, '');
    this.newTelephone = digits;
    const p1 = digits.slice(0, 1);
    const p2 = digits.slice(1, 3);
    const p3 = digits.slice(3, 6);
    const p4 = digits.slice(6, 9);
    let display = p1;
    if (p2) display += ' ' + p2;
    if (p3) display += ' ' + p3;
    if (p4) display += ' ' + p4;
    this.telDisplay = display;
    if (this.formErr['telephone']) delete this.formErr['telephone'];
  }

  // ── Menu 3 points ──────────────────────────────────────────────────────
  toggleMenu(id: number): void {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  // ── Actions ────────────────────────────────────────────────────────────
  doSuspendre(u: AdminUtilisateurResponse): void {
    this.openMenuId.set(null);
    this.confirmTitle.set('Suspendre le compte ?');
    this.confirmMsg.set(`${this.fullName(u)} ne pourra plus se connecter. Ses annonces seront masquées.`);
    this.confirmLabel.set('Suspendre');
    this.confirmDanger.set(false);
    this.pendingFn = () => this.adminApi.suspendreUtilisateur(u.id, 'Suspension administrative')
      .subscribe({ next: () => { this.toast.success('Compte suspendu'); this.loadAll(); } });
    this.confirmOpen.set(true);
  }

  doBannir(u: AdminUtilisateurResponse): void {
    this.openMenuId.set(null);
    this.confirmTitle.set('Bannir définitivement ?');
    this.confirmMsg.set(`${this.fullName(u)} sera banni. Toutes ses annonces seront supprimées.`);
    this.confirmLabel.set('Bannir');
    this.confirmDanger.set(true);
    this.pendingFn = () => this.adminApi.bannirUtilisateur(u.id, 'Bannissement administratif')
      .subscribe({ next: () => { this.toast.success('Compte banni'); this.loadAll(); } });
    this.confirmOpen.set(true);
  }

  doActiver(id: number): void {
    this.openMenuId.set(null);
    this.adminApi.activerUtilisateur(id).subscribe({
      next: () => { this.toast.success('Compte réactivé'); this.loadAll(); },
    });
  }

  executeAction(): void {
    this.confirmOpen.set(false);
    this.pendingFn?.();
    this.pendingFn = undefined;
  }

  // ── Modal rôle ─────────────────────────────────────────────────────────
  openRoleModal(u: AdminUtilisateurResponse): void {
    this.openMenuId.set(null);
    this.roleTargetId.set(u.id);
    this.roleTargetName.set(this.fullName(u));
    this.selectedRole = u.role as RoleUtilisateur;
    this.roleModalOpen.set(true);
  }

  submitRole(): void {
    const id = this.roleTargetId();
    if (!id) return;
    this.adminApi.modifierRoleUtilisateur(id, this.selectedRole).subscribe({
      next: () => {
        this.toast.success('Rôle modifié');
        this.roleModalOpen.set(false);
        this.loadAll();
      },
    });
  }

  // ── Modal création ─────────────────────────────────────────────────────
  openModal(): void {
    this.formErr     = {};
    this.newPrenom   = ''; this.newNom      = '';
    this.newEmail    = ''; this.newTelephone = '';
    this.telDisplay  = ''; this.newVille    = '';
    this.newMotDePasse = '';
    this.newRole = RoleUtilisateur.UTILISATEUR;
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.closeModal();
  }

  validateForm(): boolean {
    this.formErr = {};
    if (!this.newPrenom.trim())
      this.formErr['prenom'] = 'Le prénom est requis';
    if (!this.newNom.trim())
      this.formErr['nom'] = 'Le nom est requis';
    if (!this.newEmail.trim() || !this.newEmail.includes('@'))
      this.formErr['email'] = 'Adresse email invalide';
    if (!this.newTelephone || !telephoneValide(this.newTelephone))
      this.formErr['telephone'] = 'Numéro invalide — ex : 6 55 123 456';
    if (!this.newVille.trim())
      this.formErr['ville'] = 'La ville est requise';
    if (this.newMotDePasse.length < 8)
      this.formErr['mdp'] = 'Minimum 8 caractères requis';
    return Object.keys(this.formErr).length === 0;
  }

  submitCreate(): void {
    if (!this.validateForm() || this.creatingUser()) return;
    this.creatingUser.set(true);

    const telephoneNormalise = normaliseTelephone(this.newTelephone);

    this.adminApi.creerUtilisateur({
      prenom:     this.newPrenom.trim(),
      nom:        this.newNom.trim(),
      email:      this.newEmail.trim().toLowerCase(),
      telephone:  telephoneNormalise,
      ville:      this.newVille.trim(),
      motDePasse: this.newMotDePasse,
      role:       this.newRole,
    }).subscribe({
      next: () => {
        this.toast.success('Utilisateur créé avec succès');
        this.closeModal();
        this.creatingUser.set(false);
        this.loadAll();
      },
      error: () => this.creatingUser.set(false),
    });
  }

  // ── Export ─────────────────────────────────────────────────────────────
  exportPDF(): void {
    this.adminApi.exportUtilisateursPDF().subscribe(blob => {
      this.telechargerFichier(blob, `immocam-utilisateurs-${new Date().toISOString().slice(0,10)}.pdf`);
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

  // ── Helpers UI ─────────────────────────────────────────────────────────
  fullName(u: AdminUtilisateurResponse): string {
    return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
  }

  initials(u: AdminUtilisateurResponse): string {
    return `${(u.prenom ?? '')[0] ?? ''}${(u.nom ?? '')[0] ?? ''}`.toUpperCase();
  }

  avatarBg(u: AdminUtilisateurResponse): string {
    return u.role === 'ADMINISTRATEUR' ? '#EEF2FF' : '#F1F5F9';
  }

  avatarColor(u: AdminUtilisateurResponse): string {
    return u.role === 'ADMINISTRATEUR' ? '#4F46E5' : '#64748B';
  }

  statusCls(statut: string): string {
    const m: Record<string, string> = { ACTIF: 's-actif', SUSPENDU: 's-suspendu', BANNI: 's-banni' };
    return m[statut] ?? 's-default';
  }
}