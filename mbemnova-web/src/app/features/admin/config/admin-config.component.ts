import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import {
  TypeBienResponse,
} from '@core/services/models';
import { ConfigSystemeResponse } from '@core/services/models/admin.model';

type Section = 'parametres' | 'localisations' | 'typesbiens';

interface VilleAvecId { id: number; ville: string; active?: boolean; }
interface QuartierAvecId { id: number; nom: string; }

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  styles: [`
    :host { display: block; }

    /* ── Layout racine ── */
    .page {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 20px;
      align-items: start;
    }

    /* ── Sidebar nav principale ── */
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
      font-size: 14px; font-weight: 700; color: #0F172A; margin: 0; letter-spacing: -0.2px;
    }
    .sidebar-header p { font-size: 11px; color: #94A3B8; margin: 2px 0 0; }
    .nav-list { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 9px 12px; border-radius: 9px; border: none; background: transparent;
      cursor: pointer; font-family: inherit; text-align: left;
      transition: background .12s, color .12s; color: #64748B;
    }
    .nav-item:hover { background: #F8FAFC; color: #0F172A; }
    .nav-item.active { background: #EEF2FF; color: #1E2875; }
    .nav-icon {
      width: 30px; height: 30px; border-radius: 8px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      background: #F1F5F9; transition: background .12s;
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
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 12px; flex-wrap: wrap;
    }
    .section-head-left h3 { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; letter-spacing: -0.2px; }
    .section-head-left p { font-size: 12px; color: #94A3B8; margin: 3px 0 0; line-height: 1.5; }

    /* ════ PARAMÈTRES ════ */
    .params-view { padding: 0; }
    .params-section-title {
      padding: 18px 24px 10px;
      font-size: 11px; font-weight: 700; color: #94A3B8;
      text-transform: uppercase; letter-spacing: .07em;
      border-bottom: 0.5px solid #F8FAFC;
    }
    .params-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    .param-row {
      padding: 14px 24px;
      border-bottom: 0.5px solid #F8FAFC;
      display: flex; flex-direction: column; gap: 3px;
    }
    .param-row:last-child { border-bottom: none; }
    .param-row.full { grid-column: span 2; }
    .param-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: .05em; }
    .param-value { font-size: 14px; font-weight: 600; color: #0F172A; }
    .param-value.message { font-size: 13px; font-weight: 400; color: #334155; line-height: 1.5; white-space: pre-wrap; }
    .param-hint { font-size: 11px; color: #CBD5E1; }

    /* Edit mode fields */
    .fields-grid {
      padding: 20px 24px;
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .field-full { grid-column: span 2; }
    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-group label {
      font-size: 11px; font-weight: 600; color: #94A3B8;
      text-transform: uppercase; letter-spacing: .06em;
    }
    .field-group input, .field-group textarea {
      height: 38px; padding: 0 12px;
      border: 0.5px solid #CBD5E1; border-radius: 9px;
      background: #F8FAFC; color: #0F172A; font-size: 13px;
      outline: none; transition: border-color .15s, box-shadow .15s;
      font-family: inherit; width: 100%; box-sizing: border-box;
    }
    .field-group textarea {
      height: auto; padding: 10px 12px; resize: vertical; line-height: 1.5;
    }
    .field-group input:focus, .field-group textarea:focus {
      border-color: #3245D1; box-shadow: 0 0 0 3px rgba(50,69,209,.1); background: #fff;
    }
    .field-hint { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .field-hint code, .param-hint code {
      background: #EEF2FF; color: #1E2875; border-radius: 5px;
      padding: 1px 5px; font-size: 11px; margin: 0 2px; font-family: monospace;
    }

    .wa-variables { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .btn-wa-var {
      height: 26px; padding: 0 10px; border-radius: 14px;
      background: #EEF2FF; color: #1E2875; border: 0.5px solid #C7D2FE;
      font-size: 11.5px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background .12s;
    }
    .btn-wa-var:hover { background: #C7D2FE; }

    /* ── Section footer ── */
    .section-footer {
      padding: 14px 24px; border-top: 0.5px solid #F1F5F9;
      background: #FAFBFC; display: flex;
      align-items: center; justify-content: flex-end; gap: 10px;
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 7px;
      height: 38px; padding: 0 20px; background: #1E2875; color: #fff;
      border: none; border-radius: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background .15s, transform .1s;
      white-space: nowrap;
    }
    .btn-primary:hover:not(:disabled) { background: #3245D1; }
    .btn-primary:active:not(:disabled) { transform: scale(.97); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary svg { width: 14px; height: 14px; }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 7px;
      height: 38px; padding: 0 16px; background: #F1F5F9; color: #475569;
      border: 0.5px solid #E2E8F0; border-radius: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background .15s;
    }
    .btn-secondary:hover { background: #E2E8F0; color: #0F172A; }

    .btn-edit {
      display: inline-flex; align-items: center; gap: 5px;
      height: 30px; padding: 0 12px; background: #EEF2FF; color: #1E2875;
      border: 0.5px solid #C7D2FE; border-radius: 7px; font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background .12s;
      white-space: nowrap; flex-shrink: 0;
    }
    .btn-edit:hover { background: #C7D2FE; }
    .btn-edit svg { width: 12px; height: 12px; }

    .btn-add {
      display: inline-flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 16px; background: #1E2875; color: #fff;
      border: none; border-radius: 9px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background .15s;
      white-space: nowrap; flex-shrink: 0;
    }
    .btn-add:hover:not(:disabled) { background: #3245D1; }
    .btn-add:disabled { opacity: .45; cursor: not-allowed; }

    .btn-toggle {
      display: inline-flex; align-items: center; gap: 7px;
      height: 24px; padding: 0; border-radius: 20px;
      font-size: 11px; font-weight: 600; cursor: pointer;
      border: none; font-family: inherit; transition: all .12s; flex-shrink: 0;
      background: transparent; color: #94A3B8;
    }
    .switch-track {
      position: relative; width: 34px; height: 19px; border-radius: 20px;
      background: #E2E8F0; transition: background .15s; flex-shrink: 0;
    }
    .switch-track::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 15px; height: 15px; border-radius: 50%;
      background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25);
      transition: transform .15s;
    }
    .btn-toggle.active .switch-track { background: #10B981; }
    .btn-toggle.active .switch-track::after { transform: translateX(15px); }
    .btn-toggle.inactive .switch-track { background: #CBD5E1; }
    .btn-toggle.active .switch-label { color: #059669; }
    .btn-toggle.inactive .switch-label { color: #94A3B8; }
    .btn-toggle:hover .switch-track { box-shadow: 0 0 0 3px rgba(50,69,209,.08); }

    /* ── Add form row ── */
    .add-row {
      display: flex; gap: 10px; align-items: flex-end;
      padding: 16px 24px; border-bottom: 0.5px solid #F1F5F9; flex-wrap: wrap;
      background: #FAFBFC;
    }
    .add-row .field-group { flex: 1; min-width: 120px; }

    /* ════ LOCALISATIONS ════ */

    /* -- Villes list -- */
    .villes-list { padding: 8px 12px; max-height: 360px; overflow-y: auto; }
    .ville-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-radius: 10px; transition: background .1s; gap: 10px;
    }
    .ville-item:hover { background: #F8FAFC; }
    .ville-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .ville-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .ville-dot.active { background: #10B981; }
    .ville-dot.inactive { background: #F87171; }
    .ville-nom { font-size: 13px; font-weight: 600; color: #0F172A; }
    .ville-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    /* -- Quartiers sidebar layout -- */
    .quartiers-layout {
      display: grid;
      grid-template-columns: 180px 1fr;
      min-height: 280px;
      border-top: 0.5px solid #F1F5F9;
    }
    .quartiers-sidebar {
      border-right: 0.5px solid #F1F5F9;
      padding: 8px;
      display: flex; flex-direction: column; gap: 2px;
      background: #FAFBFC;
      max-height: 340px; overflow-y: auto;
    }
    .quartier-ville-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 8px;
      border: none; background: transparent; cursor: pointer;
      font-family: inherit; text-align: left; font-size: 13px;
      font-weight: 500; color: #475569; transition: all .12s; width: 100%;
    }
    .quartier-ville-tab:hover { background: #F1F5F9; color: #0F172A; }
    .quartier-ville-tab.active { background: #EEF2FF; color: #1E2875; font-weight: 700; }
    .quartier-ville-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .quartier-ville-dot.has { background: #3245D1; }
    .quartier-ville-dot.empty { background: #CBD5E1; }

    .quartiers-content { padding: 16px; min-width: 0; }
    .quartiers-content-title {
      font-size: 12px; font-weight: 700; color: #0F172A;
      margin: 0 0 12px; letter-spacing: -0.1px;
    }
    .quartiers-add-row {
      display: flex; gap: 8px; margin-bottom: 14px;
    }
    .quartiers-add-row input {
      flex: 1; height: 34px; padding: 0 10px;
      border: 0.5px solid #CBD5E1; border-radius: 8px;
      background: #F8FAFC; font-size: 13px; font-family: inherit;
      outline: none; color: #0F172A;
    }
    .quartiers-add-row input:focus {
      border-color: #3245D1; box-shadow: 0 0 0 3px rgba(50,69,209,.08); background: #fff;
    }
    .btn-add-sm {
      height: 34px; padding: 0 12px; background: #1E2875; color: #fff;
      border: none; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: background .12s;
    }
    .btn-add-sm:hover:not(:disabled) { background: #3245D1; }
    .btn-add-sm:disabled { opacity: .45; cursor: not-allowed; }

    .quartiers-chips { display: flex; flex-wrap: wrap; gap: 6px; max-height: 280px; overflow-y: auto; }
    .quartier-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px 5px 12px;
      background: #F8FAFC; border: 0.5px solid #E2E8F0;
      border-radius: 20px; font-size: 12px; color: #334155; font-weight: 500;
      transition: border-color .1s;
    }
    .quartier-chip:hover { border-color: #C7D2FE; background: #EEF2FF; color: #1E2875; }
    .quartier-chip-edit {
      display: flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      border: none; background: transparent; cursor: pointer;
      color: #94A3B8; transition: all .1s; padding: 0;
    }
    .quartier-chip-edit:hover { background: #C7D2FE; color: #1E2875; }
    .quartier-chip-edit svg { width: 10px; height: 10px; }

    .quartiers-empty {
      padding: 24px 0; text-align: center;
      font-size: 13px; color: #94A3B8;
    }
    .quartiers-no-ville {
      display: flex; align-items: center; justify-content: center;
      height: 100%; min-height: 140px;
      font-size: 13px; color: #CBD5E1; text-align: center;
      padding: 24px;
    }

    /* ════ TYPES DE BIENS ════ */
    .types-list { padding: 12px; display: flex; flex-direction: column; gap: 4px; max-height: 360px; overflow-y: auto; }
    .type-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-radius: 10px; transition: background .1s; gap: 10px;
    }
    .type-item:hover { background: #F8FAFC; }
    .type-left { display: flex; align-items: center; gap: 10px; }
    .type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .type-dot.active { background: #10B981; }
    .type-dot.inactive { background: #F87171; }
    .type-libelle { font-size: 13px; font-weight: 600; color: #0F172A; }
    .type-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    /* ── Loading skeleton ── */
    .sk-block {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 8px;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* ── Divider ── */
    .divider {
      height: 0.5px; background: #F1F5F9; margin: 0;
    }
    .section-sub-title {
      padding: 14px 24px 10px;
      font-size: 11px; font-weight: 700; color: #94A3B8;
      text-transform: uppercase; letter-spacing: .07em;
    }

    /* ════ MODAL ════ */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15,23,42,.45);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      background: #fff; border-radius: 16px;
      box-shadow: 0 24px 60px rgba(15,23,42,.18);
      width: 100%; max-width: 420px;
      animation: slideUp .18s ease;
      overflow: hidden;
    }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
    .modal-head {
      padding: 20px 24px 16px;
      border-bottom: 0.5px solid #F1F5F9;
      display: flex; align-items: center; justify-content: space-between;
    }
    .modal-head h4 { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; }
    .modal-close {
      width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: #F1F5F9; cursor: pointer; color: #64748B;
      transition: background .1s, color .1s;
    }
    .modal-close:hover { background: #E2E8F0; color: #0F172A; }
    .modal-close svg { width: 14px; height: 14px; }
    .modal-body { padding: 20px 24px; }
    .modal-footer {
      padding: 14px 24px; border-top: 0.5px solid #F1F5F9;
      background: #FAFBFC; display: flex;
      justify-content: flex-end; gap: 10px;
    }

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
      .params-grid { grid-template-columns: 1fr; }
      .param-row.full { grid-column: span 1; }
      .quartiers-layout { grid-template-columns: 1fr; }
      .quartiers-sidebar { max-height: 120px; flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 0.5px solid #F1F5F9; }
    }
    @media (max-width: 560px) {
      .add-row { flex-direction: column; }
      .add-row .field-group { flex: 1; min-width: 0; width: 100%; }
      .btn-add { width: 100%; justify-content: center; }
    }
  `],
  template: `
    <div class="page">

      <!-- ── Sidebar nav principale ── -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Configuration</h2>
          <p>Paramètres système</p>
        </div>
        <nav class="nav-list">
          <button class="nav-item" [class.active]="activeSection==='parametres'" (click)="activeSection='parametres'">
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

          <button class="nav-item" [class.active]="activeSection==='localisations'" (click)="activeSection='localisations'">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
              </svg>
            </span>
            <span class="nav-label">Localisations</span>
          </button>

          <button class="nav-item" [class.active]="activeSection==='typesbiens'" (click)="activeSection='typesbiens'">
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
              @if (!editingConfig() && config()) {
                <button class="btn-edit" (click)="startEditConfig()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5
                         m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Modifier
                </button>
              }
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
              </div>
            } @else if (!editingConfig()) {
              <!-- Mode lecture -->
              <div class="params-view">
                <div class="params-grid">
                  @for (field of numericFields; track field.key) {
                    <div class="param-row">
                      <span class="param-label">{{ field.label }}</span>
                      <span class="param-value">{{ config()![field.key] }}</span>
                      @if (field.hint) { <span class="param-hint">{{ field.hint }}</span> }
                    </div>
                  }
                  <div class="param-row full">
                    <span class="param-label">Message WhatsApp par défaut</span>
                    <span class="param-value message">{{ config()!.messageWhatsappDefaut }}</span>
                    <span class="param-hint">
                      Variables disponibles :
                      @for (v of whatsappVariables; track v.key) {
                        <code>{{ v.token }}</code>
                      }
                    </span>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Mode édition -->
              <div class="fields-grid">
                @for (field of numericFields; track field.key) {
                  <div class="field-group">
                    <label [for]="'cfg-' + field.key">{{ field.label }}</label>
                    <input
                      [id]="'cfg-' + field.key"
                      type="number"
                      [(ngModel)]="configEdit![field.key]"
                      [min]="field.min ?? 0"
                    />
                    @if (field.hint) { <span class="field-hint">{{ field.hint }}</span> }
                  </div>
                }
                <div class="field-group field-full">
                  <label for="cfg-wa">Message WhatsApp par défaut</label>
                  <div class="wa-variables">
                    @for (v of whatsappVariables; track v.key) {
                      <button type="button" class="btn-wa-var" (click)="insertVariable(v.key, waTextarea)">
                        + {{ v.label }}
                      </button>
                    }
                  </div>
                  <textarea #waTextarea id="cfg-wa" [(ngModel)]="configEdit!.messageWhatsappDefaut" rows="3"></textarea>
                  <span class="field-hint">
                    Cliquez sur une variable ci-dessus pour l'insérer — elle sera automatiquement
                    remplacée par l'information réelle de chaque annonce (ex : &#123;prix&#125; → 50 000 FCFA).
                  </span>
                </div>
              </div>
              <div class="section-footer">
                <button class="btn-secondary" (click)="cancelEditConfig()">Annuler</button>
                <button class="btn-primary" (click)="confirmSaveOpen.set(true)" [disabled]="saving()">
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
                    Enregistrer
                  }
                </button>
              </div>
            }
          </div>
        }

        <!-- ════ SECTION : Localisations ════ -->
        @if (activeSection === 'localisations') {
          <div class="section-card">

            <!-- ── Villes ── -->
            <div class="section-head">
              <div class="section-head-left">
                <h3>Villes</h3>
                <p>Gérez les villes disponibles dans l'application.</p>
              </div>
            </div>

            <!-- Formulaire ajout ville -->
            <div class="add-row">
              <div class="field-group">
                <label for="new-ville">Nouvelle ville</label>
                <input id="new-ville" type="text" [(ngModel)]="newVille" placeholder="ex : Douala" />
              </div>
              <button class="btn-add" (click)="addLocalisation()" [disabled]="!newVille.trim()">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
                </svg>
                Ajouter
              </button>
            </div>

            <!-- Liste des villes -->
            @if (villesAvecId().length === 0) {
              <p style="padding:28px 24px;text-align:center;font-size:13px;color:#94A3B8;">
                Aucune ville enregistrée.
              </p>
            } @else {
              <div class="villes-list">
                @for (v of villesAvecId(); track v.id) {
                  <div class="ville-item">
                    <div class="ville-left">
                      <span class="ville-dot" [class.active]="v.active !== false" [class.inactive]="v.active === false"></span>
                      <span class="ville-nom">{{ v.ville }}</span>
                    </div>
                    <div class="ville-right">
                      <button
                        class="btn-toggle"
                        [class.active]="v.active !== false"
                        [class.inactive]="v.active === false"
                        (click)="toggleVilleActive(v)"
                        [title]="v.active !== false ? 'Cliquer pour désactiver' : 'Cliquer pour activer'"
                      >
                        <span class="switch-track"></span>
                        <span class="switch-label">{{ v.active !== false ? 'Actif' : 'Inactif' }}</span>
                      </button>
                      <button class="btn-edit" (click)="openEditVille(v)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5
                               m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Modifier
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <div class="divider"></div>

            <!-- ── Quartiers ── -->
            <div class="section-sub-title">Quartiers par ville</div>
            <div class="quartiers-layout">
              <!-- Sidebar villes -->
              <div class="quartiers-sidebar">
                @if (villesAvecId().length === 0) {
                  <p style="font-size:12px;color:#CBD5E1;padding:8px;">Aucune ville</p>
                } @else {
                  @for (v of villesAvecId(); track v.id) {
                    <button
                      class="quartier-ville-tab"
                      [class.active]="selectedVilleQuartier === v.ville"
                      (click)="selectVilleQuartier(v.ville)"
                    >
                      <span class="quartier-ville-dot"
                        [class.has]="(quartiersParVille()[v.ville]?.length ?? 0) > 0"
                        [class.empty]="!(quartiersParVille()[v.ville]?.length)"
                      ></span>
                      {{ v.ville }}
                    </button>
                  }
                }
              </div>

              <!-- Contenu quartiers -->
              <div class="quartiers-content">
                @if (!selectedVilleQuartier) {
                  <div class="quartiers-no-ville">
                    Sélectionnez une ville pour voir ses quartiers
                  </div>
                } @else {
                  <div class="quartiers-content-title">
                    Quartiers — {{ selectedVilleQuartier }}
                  </div>
                  <!-- Ajout quartier -->
                  <div class="quartiers-add-row">
                    <input
                      type="text"
                      [(ngModel)]="newQuartier"
                      placeholder="Nouveau quartier..."
                      (keyup.enter)="addQuartier()"
                    />
                    <button class="btn-add-sm" (click)="addQuartier()" [disabled]="!newQuartier.trim()">
                      Ajouter
                    </button>
                  </div>
                  <!-- Chips quartiers -->
                  @if ((quartiersParVille()[selectedVilleQuartier]?.length ?? 0) === 0) {
                    <div class="quartiers-empty">Aucun quartier pour cette ville.</div>
                  } @else {
                    <div class="quartiers-chips">
                      @for (q of quartiersParVille()[selectedVilleQuartier]; track q.id) {
                        <span class="quartier-chip">
                          {{ q.nom }}
                          <button class="quartier-chip-edit" (click)="openEditQuartier(q)" title="Modifier">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round"
                                d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5
                                   m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                        </span>
                      }
                    </div>
                  }
                }
              </div>
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
                <input id="new-type-nom" type="text" [(ngModel)]="newTypeBienNom" placeholder="ex : Duplex" />
              </div>
              <button class="btn-add" (click)="addTypeBien()" [disabled]="!newTypeBienNom.trim()">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
                </svg>
                Ajouter
              </button>
            </div>

            <!-- Liste -->
            @if (typesBiens().length === 0) {
              <p style="padding:28px 24px;text-align:center;font-size:13px;color:#94A3B8;">
                Aucun type de bien enregistré.
              </p>
            } @else {
              <div class="types-list">
                @for (t of typesBiens(); track t.id) {
                  <div class="type-item">
                    <div class="type-left">
                      <span class="type-dot" [class.active]="t.estActif !== false" [class.inactive]="t.estActif === false"></span>
                      <span class="type-libelle">{{ t.libelle }}</span>
                    </div>
                    <div class="type-right">
                      <button
                        class="btn-toggle"
                        [class.active]="t.estActif !== false"
                        [class.inactive]="t.estActif === false"
                        (click)="toggleTypeBienActif(t)"
                        [title]="t.estActif !== false ? 'Cliquer pour désactiver' : 'Cliquer pour activer'"
                      >
                        <span class="switch-track"></span>
                        <span class="switch-label">{{ t.estActif !== false ? 'Actif' : 'Inactif' }}</span>
                      </button>
                      <button class="btn-edit" (click)="openEditTypeBien(t)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5
                               m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Modifier
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>

    <!-- ════ MODAL : Modifier Ville ════ -->
    @if (modalVilleOpen) {
      <div class="modal-overlay" (click)="closeModalVille()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h4>Modifier la ville</h4>
            <button class="modal-close" (click)="closeModalVille()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label for="edit-ville-nom">Nom de la ville</label>
              <input id="edit-ville-nom" type="text" [(ngModel)]="editVilleNom" placeholder="Nom de la ville" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModalVille()">Annuler</button>
            <button class="btn-primary" (click)="saveEditVille()" [disabled]="!editVilleNom.trim() || modalSaving">
              {{ modalSaving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ════ MODAL : Modifier Quartier ════ -->
    @if (modalQuartierOpen) {
      <div class="modal-overlay" (click)="closeModalQuartier()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h4>Modifier le quartier</h4>
            <button class="modal-close" (click)="closeModalQuartier()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label for="edit-quartier-nom">Nom du quartier</label>
              <input id="edit-quartier-nom" type="text" [(ngModel)]="editQuartierNom" placeholder="Nom du quartier" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModalQuartier()">Annuler</button>
            <button class="btn-primary" (click)="saveEditQuartier()" [disabled]="!editQuartierNom.trim() || modalSaving">
              {{ modalSaving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ════ MODAL : Modifier Type de bien ════ -->
    @if (modalTypeBienOpen) {
      <div class="modal-overlay" (click)="closeModalTypeBien()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h4>Modifier le type de bien</h4>
            <button class="modal-close" (click)="closeModalTypeBien()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label for="edit-type-libelle">Libellé</label>
              <input id="edit-type-libelle" type="text" [(ngModel)]="editTypeBienLibelle" placeholder="Nom du type de bien" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModalTypeBien()">Annuler</button>
            <button class="btn-primary" (click)="saveEditTypeBien()" [disabled]="!editTypeBienLibelle.trim() || modalSaving">
              {{ modalSaving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ════ CONFIRMATION : Sauvegarde des paramètres ════ -->
    <app-confirm-dialog
      [open]="confirmSaveOpen()"
      title="Enregistrer ces paramètres ?"
      message="Les nouvelles valeurs s'appliqueront immédiatement à toutes les annonces de la plateforme."
      confirmLabel="Enregistrer"
      (confirmed)="saveConfig()"
      (cancelled)="confirmSaveOpen.set(false)"
    />
  `,
})
export class AdminConfigComponent implements OnInit {
  private readonly adminApi    = inject(AdminApi);
  private readonly locApi      = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly toast       = inject(ToastService);

  // ── State ─────────────────────────────────────────────────────────────
  config            = signal<ConfigSystemeResponse | null>(null);
  typesBiens        = signal<TypeBienResponse[]>([]);
  villesAvecId      = signal<VilleAvecId[]>([]);
  quartiersParVille = signal<Record<string, QuartierAvecId[]>>({});
  saving            = signal(false);
  editingConfig     = signal(false);
  confirmSaveOpen   = signal(false);

  configEdit: ConfigSystemeResponse | null = null;

  activeSection: Section = 'parametres';

  // Ajout
  newVille         = '';
  newQuartier      = '';
  newTypeBienNom   = '';

  // Quartiers sidebar
  selectedVilleQuartier: string | null = null;

  // Modals
  modalVilleOpen    = false;
  modalQuartierOpen = false;
  modalTypeBienOpen = false;
  modalSaving       = false;

  editVilleId: number | null = null;
  editVilleNom    = '';
  editQuartierId: number | null = null;
  editQuartierNom = '';
  editTypeBienId: number | null = null;
  editTypeBienLibelle = '';

  readonly skeletons6 = Array(6).fill(0);

  readonly numericFields: {
    key: keyof ConfigSystemeResponse;
    label: string;
    hint?: string;
    min?: number;
  }[] = [
    { key: 'dureeVieAnnonce',            label: 'Durée de vie annonce (jours)',      hint: 'Nombre de jours avant expiration automatique', min: 1 },
    { key: 'maxAnnoncesParProprietaire', label: 'Max annonces par propriétaire',     min: 1 },
    { key: 'maxPhotosParAnnonce',        label: 'Max photos par annonce',            min: 1 },
    { key: 'joursRappelExpiration',      label: 'Rappel avant expiration (jours)',   hint: 'Envoi de la notification J−X avant expiration', min: 0 },
    { key: 'joursSuppressionDefinitive', label: 'Suppression définitive (jours)',    hint: 'Délai après expiration avant suppression définitive', min: 0 },
  ];

  readonly whatsappVariables: { key: string; label: string; token: string }[] = [
    { key: 'proprietaire', label: 'Propriétaire', token: '{proprietaire}' },
    { key: 'type',         label: 'Type de bien',  token: '{type}' },
    { key: 'quartier',     label: 'Quartier',      token: '{quartier}' },
    { key: 'ville',        label: 'Ville',         token: '{ville}' },
    { key: 'prix',         label: 'Prix',          token: '{prix}' },
  ];

  // ── Cycle de vie ──────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadConfig();
    this.loadVilles();
    this.loadTypesBiens();
    this.loadQuartiersParVille();
  }

  private loadConfig(): void {
    this.adminApi.getConfig().subscribe({ next: (r) => this.config.set(r.data) });
  }

  private loadVilles(): void {
    this.locApi.getVillesAvecId().subscribe({
      next: (r) => {
        // L'API retourne { id, ville } — on enrichit avec active=true par défaut
        // si l'API ne retourne pas le champ active
        this.villesAvecId.set(r.data.map(v => ({ ...v, active: (v as any).active ?? true })));
      },
    });
  }

  private loadTypesBiens(): void {
    this.typeBienApi.getAll().subscribe({ next: (r) => this.typesBiens.set(r.data) });
  }

  private loadQuartiersParVille(): void {
    this.locApi.listerQuartiersAdmin().subscribe({
      next: (r) => {
        const map: Record<string, QuartierAvecId[]> = {};
        for (const q of r.data ?? []) {
          if (!map[q.ville]) map[q.ville] = [];
          map[q.ville].push({ id: q.id, nom: q.nom });
        }
        Object.values(map).forEach(list => list.sort((a, b) => a.nom.localeCompare(b.nom)));
        this.quartiersParVille.set(map);
      },
    });
  }

  // ── Paramètres ────────────────────────────────────────────────────────
  startEditConfig(): void {
    const c = this.config();
    if (!c) return;
    this.configEdit = { ...c };
    this.editingConfig.set(true);
  }

  cancelEditConfig(): void {
    this.editingConfig.set(false);
    this.confirmSaveOpen.set(false);
    this.configEdit = null;
  }

  /** Insère une variable dans le textarea du message WhatsApp, à la position du curseur. */
  insertVariable(key: string, textarea: HTMLTextAreaElement): void {
    if (!this.configEdit) return;
    const valeur = this.configEdit.messageWhatsappDefaut ?? '';
    const debut = textarea.selectionStart ?? valeur.length;
    const fin   = textarea.selectionEnd ?? valeur.length;
    const jeton = `{${key}}`;
    this.configEdit.messageWhatsappDefaut = valeur.slice(0, debut) + jeton + valeur.slice(fin);
    const nouvellePosition = debut + jeton.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nouvellePosition, nouvellePosition);
    });
  }

  saveConfig(): void {
    if (!this.configEdit) return;
    this.confirmSaveOpen.set(false);
    this.saving.set(true);
    const c = this.configEdit;
    const entries: Array<[string, string | number | boolean]> = [
      ['dureeVieAnnonce',            c.dureeVieAnnonce],
      ['joursRappelExpiration',      c.joursRappelExpiration],
      ['joursSuppressionDefinitive', c.joursSuppressionDefinitive],
      ['maxPhotosParAnnonce',        c.maxPhotosParAnnonce],
      ['maxAnnoncesParProprietaire', c.maxAnnoncesParProprietaire],
      ['messageWhatsappDefaut',      c.messageWhatsappDefaut],
    ];
    let pending = entries.length;
    let hasError = false;
    entries.forEach(([cle, valeur]) => {
      this.adminApi.updateConfigByKey(cle, valeur).subscribe({
        next: () => {
          pending--;
          if (pending === 0 && !hasError) {
            this.saving.set(false);
            this.config.set({ ...c });
            this.editingConfig.set(false);
            this.configEdit = null;
            this.toast.success('Configuration sauvegardée');
          }
        },
        error: () => {
          hasError = true;
          this.saving.set(false);
        },
      });
    });
  }

  // ── Localisations — villes ─────────────────────────────────────────────
  addLocalisation(): void {
    const ville = this.newVille.trim();
    if (!ville) return;
    this.adminApi.creerVille(ville).subscribe({
      next: () => {
        this.toast.success('Ville ajoutée');
        this.newVille = '';
        this.loadVilles();
      },
    });
  }

  toggleVilleActive(v: VilleAvecId): void {
    const newActive = !(v.active !== false);
    this.adminApi.basculerVilleActive(v.id, newActive).subscribe({
      next: () => {
        this.villesAvecId.update(list =>
          list.map(item => item.id === v.id ? { ...item, active: newActive } : item)
        );
        this.toast.success(newActive ? 'Ville activée' : 'Ville désactivée');
      },
    });
  }

  openEditVille(v: VilleAvecId): void {
    this.editVilleId  = v.id;
    this.editVilleNom = v.ville;
    this.modalVilleOpen = true;
  }

  closeModalVille(): void {
    this.modalVilleOpen = false;
    this.editVilleId    = null;
    this.editVilleNom   = '';
  }

  saveEditVille(): void {
    if (!this.editVilleId || !this.editVilleNom.trim()) return;
    this.modalSaving = true;
    this.adminApi.modifierVille(this.editVilleId, this.editVilleNom.trim()).subscribe({
      next: () => {
        this.modalSaving = false;
        this.toast.success('Ville modifiée');
        this.closeModalVille();
        this.loadVilles();
      },
      error: () => { this.modalSaving = false; },
    });
  }

  // ── Localisations — quartiers ──────────────────────────────────────────
  selectVilleQuartier(ville: string): void {
    this.selectedVilleQuartier = ville;
    this.newQuartier = '';
  }

  addQuartier(): void {
    const quartier = this.newQuartier.trim();
    const ville    = this.selectedVilleQuartier;
    if (!quartier || !ville) return;
    this.locApi.creerQuartier({ ville, quartier }).subscribe({
      next: (r) => {
        this.toast.success('Quartier ajouté');
        this.newQuartier = '';
        const current = this.quartiersParVille();
        const list = [...(current[ville] ?? []), { id: r.data.id, nom: r.data.nom }]
          .sort((a, b) => a.nom.localeCompare(b.nom));
        this.quartiersParVille.set({ ...current, [ville]: list });
      },
      error: () => { this.toast.error('Impossible d\'ajouter ce quartier'); },
    });
  }

  openEditQuartier(quartier: QuartierAvecId): void {
    this.editQuartierId  = quartier.id;
    this.editQuartierNom = quartier.nom;
    this.modalQuartierOpen = true;
  }

  closeModalQuartier(): void {
    this.modalQuartierOpen = false;
    this.editQuartierId   = null;
    this.editQuartierNom  = '';
  }

  saveEditQuartier(): void {
    const ville = this.selectedVilleQuartier;
    if (!ville || !this.editQuartierId || !this.editQuartierNom.trim()) return;
    this.modalSaving = true;
    const nouveauNom = this.editQuartierNom.trim();
    this.locApi.renommerQuartier(this.editQuartierId, nouveauNom).subscribe({
      next: () => {
        this.modalSaving = false;
        this.toast.success('Quartier renommé — mis à jour sur toutes les annonces concernées');
        const current = this.quartiersParVille();
        const list = (current[ville] ?? [])
          .map(q => q.id === this.editQuartierId ? { ...q, nom: nouveauNom } : q)
          .sort((a, b) => a.nom.localeCompare(b.nom));
        this.quartiersParVille.set({ ...current, [ville]: list });
        this.closeModalQuartier();
      },
      error: (err) => {
        this.modalSaving = false;
        this.toast.error(err?.error?.message ?? 'Impossible de renommer ce quartier');
      },
    });
  }

  // ── Types de biens ────────────────────────────────────────────────────
  addTypeBien(): void {
    const libelle = this.newTypeBienNom.trim();
    if (!libelle) return;
    this.adminApi.ajouterTypeBien({ libelle }).subscribe({
      next: () => {
        this.toast.success('Type de bien ajouté');
        this.newTypeBienNom = '';
        this.loadTypesBiens();
      },
    });
  }

  toggleTypeBienActif(t: TypeBienResponse): void {
    const newActif = !(t.estActif !== false);
    this.adminApi.basculerTypeBienActif(t.id, newActif).subscribe({
      next: () => {
        this.typesBiens.update(list =>
          list.map(item => item.id === t.id ? { ...item, estActif: newActif } : item)
        );
        this.toast.success(newActif ? 'Type activé' : 'Type désactivé');
      },
    });
  }

  openEditTypeBien(t: TypeBienResponse): void {
    this.editTypeBienId      = t.id;
    this.editTypeBienLibelle = t.libelle;
    this.modalTypeBienOpen   = true;
  }

  closeModalTypeBien(): void {
    this.modalTypeBienOpen   = false;
    this.editTypeBienId      = null;
    this.editTypeBienLibelle = '';
  }

  saveEditTypeBien(): void {
    if (!this.editTypeBienId || !this.editTypeBienLibelle.trim()) return;
    this.modalSaving = true;
    this.adminApi.modifierTypeBien(this.editTypeBienId, { libelle: this.editTypeBienLibelle.trim() }).subscribe({
      next: () => {
        this.modalSaving = false;
        this.toast.success('Type de bien modifié');
        this.typesBiens.update(list =>
          list.map(item => item.id === this.editTypeBienId ? { ...item, libelle: this.editTypeBienLibelle.trim() } : item)
        );
        this.closeModalTypeBien();
      },
      error: () => { this.modalSaving = false; },
    });
  }
}