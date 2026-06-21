// admin-signalements.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApi } from '@core/services/api/admin.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { ToastService } from '@core/services/toast.service';
import { MOTIF_SIGNALEMENT_LABELS } from '@core/services/models';
import { SignalementResponse } from '@core/services/models/admin.model';

// cSpell:ignore TRAITE BANNISSEMENT

type DecisionStatut =
  | 'IGNORE'
  | 'TRAITE_INFO'
  | 'TRAITE_PAUSE'
  | 'TRAITE_SUPPRESSION'
  | 'TRAITE_SUSPENSION'
  | 'TRAITE_BANNISSEMENT';

// ✅ Tabs avec les valeurs exactes envoyées au backend
// Java côté backend : si statut null → EN_ATTENTE, sinon la valeur exacte
// Pour "Traités" on charge sans filtre statut et on filtre côté front
// car le backend ne supporte pas de filtre "TRAITE_*" générique
type TabKey = 'EN_ATTENTE' | 'TRAITE' | 'IGNORE' | 'TOUS';

interface PageStats {
  enAttente: number;
  traites: number;
  ignores: number;
}

@Component({
  selector: 'app-admin-signalements',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe, FcfaPipe],
  styles: [`
    :host { display: block; font-family: 'DM Sans', system-ui, sans-serif; }

    .topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .topbar-title { font-size: 17px; font-weight: 800; color: #0F172A; letter-spacing: -.3px; margin: 0; }
    .topbar-sub { font-size: 12px; color: #64748B; margin-top: 3px; }

    .tabs { display: flex; background: #F1F5F9; border-radius: 10px; padding: 3px; gap: 2px; flex-wrap: wrap; }
    .tab-btn {
      display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 13px;
      border: none; border-radius: 8px; font-size: 12px; font-weight: 500;
      cursor: pointer; font-family: inherit; color: #64748B; background: transparent;
      transition: all .15s; white-space: nowrap;
    }
    .tab-btn.active { background: #fff; color: #0F172A; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .tab-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: 20px; font-size: 10px; font-weight: 700;
    }
    .tc-red   { background: #FEE2E2; color: #DC2626; }
    .tc-green { background: #DCFCE7; color: #15803D; }
    .tc-slate { background: #E2E8F0; color: #64748B; }
    .tc-blue  { background: #DBEAFE; color: #1D4ED8; }

    .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 18px; }
    @media (max-width: 600px) { .stats-row { grid-template-columns: 1fr 1fr; } }
    .stat-card {
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 12px;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
    }
    .stat-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon svg { width: 16px; height: 16px; }
    .stat-val { font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -.04em; line-height: 1; }
    .stat-lbl { font-size: 11px; color: #94A3B8; margin-top: 2px; }

    .modal-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(10,20,50,.55); backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
      animation: fadeIn .18s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .modal-box {
      background: #fff; border-radius: 18px; width: 100%; max-width: 420px;
      box-shadow: 0 32px 80px rgba(0,0,0,.2);
      animation: boxIn .2s cubic-bezier(.34,1.56,.64,1); overflow: hidden;
    }
    @keyframes boxIn { from{transform:scale(.9);opacity:0} to{transform:scale(1);opacity:1} }
    .modal-header { padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; }
    .modal-title { font-size: 15px; font-weight: 800; color: #0F172A; }
    .modal-close {
      width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid #E5E7EB;
      background: #F8FAFC; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #64748B;
    }
    .modal-close svg { width: 13px; height: 13px; }
    .modal-body { padding: 16px 20px; }
    .confirm-icon { width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; }
    .confirm-icon svg { width: 22px; height: 22px; }
    .confirm-title { font-size: 16px; font-weight: 800; color: #0F172A; text-align: center; margin-bottom: 7px; }
    .confirm-msg { font-size: 13px; color: #64748B; text-align: center; line-height: 1.6; }
    .modal-footer { display: flex; gap: 8px; padding: 0 20px 20px; }
    .btn-cancel {
      flex: 1; height: 42px; background: #F1F5F9; color: #64748B;
      border: 1.5px solid #E5E7EB; border-radius: 10px;
      font: 600 13px/1 'DM Sans',system-ui,sans-serif; cursor: pointer;
    }
    .btn-cancel:hover { background: #E2E8F0; }
    .btn-confirm {
      flex: 2; height: 42px; border: none; border-radius: 10px;
      font: 700 13px/1 'DM Sans',system-ui,sans-serif; cursor: pointer; color: #fff;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: filter .15s;
    }
    .btn-confirm:hover { filter: brightness(.9); }

    .list { display: flex; flex-direction: column; gap: 10px; }

    .sig-card {
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px;
      overflow: hidden; transition: box-shadow .15s;
    }
    .sig-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }
    .sig-card.pending { border-left: 3px solid #EF4444; }
    .sig-card.done    { border-left: 3px solid #10B981; }
    .sig-card.ignored { border-left: 3px solid #94A3B8; }

    .ann-preview {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px 12px; background: #F8FAFC;
      border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background .1s;
    }
    .ann-preview:hover { background: #F0F7FF; }
    .ann-thumb {
      width: 46px; height: 46px; border-radius: 10px; overflow: hidden; flex-shrink: 0;
      background: #EEF2FF; border: 1px solid #E0E7FF;
      display: flex; align-items: center; justify-content: center;
    }
    .ann-thumb svg { width: 18px; height: 18px; color: #A5B4FC; }
    .ann-info { flex: 1; min-width: 0; }
    .ann-title { font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 2px; }
    .ann-price { font-size: 13px; font-weight: 700; color: #1E2875; white-space: nowrap; }
    .ann-status { font-size: 10.5px; padding: 2px 8px; border-radius: 20px; font-weight: 600; margin-left: 6px; }
    .ann-link { font-size: 11px; color: #3B82F6; display: flex; align-items: center; gap: 3px; margin-top: 2px; }
    .ann-link svg { width: 11px; height: 11px; }

    .sig-body { padding: 12px 16px; }
    .badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .b-fraud   { background: #FEE2E2; color: #B91C1C; }
    .b-content { background: #F3E8FF; color: #7C3AED; }
    .b-other   { background: #FEF9C3; color: #A16207; }
    .b-pending { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
    .b-done    { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
    .b-ignored { background: #F8FAFC; color: #94A3B8; border: 1px solid #E2E8F0; }

    .auteur-row { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: #F8FAFC; border-radius: 9px; margin-bottom: 10px; }
    .auteur-avatar { width: 28px; height: 28px; border-radius: 50%; background: #E0E7FF; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #4F46E5; flex-shrink: 0; }
    .auteur-name { font-size: 12px; font-weight: 600; color: #0F172A; }
    .auteur-sub  { font-size: 11px; color: #64748B; }

    .sig-desc { font-size: 12px; color: #475569; font-style: italic; background: #F8FAFC; border-left: 2px solid #CBD5E1; padding: 8px 11px; border-radius: 0 8px 8px 0; line-height: 1.55; }

    .sig-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; background: #FAFBFC; border-top: 1px solid #F1F5F9;
      flex-wrap: wrap; gap: 8px;
    }
    .footer-meta { font-size: 11px; color: #94A3B8; }
    .footer-actions { display: flex; align-items: center; gap: 6px; }

    /* ✅ CORRIGÉ : fond bleu pour les 3 points */
    .btn-dots {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: #2563EB; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #fff; transition: all .12s;
    }
    .btn-dots:hover { background: #1D4ED8; }
    .btn-dots svg { width: 15px; height: 15px; }

    .drop-wrap { position: relative; }
    .dropdown {
      position: absolute; right: 0; bottom: calc(100% + 4px); z-index: 50;
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.1); min-width: 220px; overflow: hidden;
      animation: dropIn .15s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes dropIn { from{opacity:0;transform:scale(.95) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
    .drop-item {
      display: flex; align-items: center; gap: 9px;
      padding: 10px 14px; font-size: 13px; font-weight: 500;
      cursor: pointer; background: none; border: none; width: 100%;
      text-align: left; font-family: inherit; color: #374151; transition: background .1s;
    }
    .drop-item:hover { background: #F8FAFC; }
    .drop-item svg { width: 14px; height: 14px; flex-shrink: 0; }
    .drop-item.slate { color: #64748B; }
    .drop-item.blue  { color: #2563EB; }
    .drop-item.blue:hover  { background: #EFF6FF; }
    .drop-item.amber { color: #D97706; }
    .drop-item.amber:hover { background: #FFFBEB; }
    .drop-item.red   { color: #DC2626; }
    .drop-item.red:hover   { background: #FEF2F2; }
    .drop-item.dark  { color: #7F1D1D; }
    .drop-item.dark:hover  { background: #FEF2F2; }
    .drop-sep { height: 1px; background: #F1F5F9; margin: 3px 0; }

    .sk-list { display: flex; flex-direction: column; gap: 10px; }
    .sk-card { background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px; padding: 16px; display: flex; gap: 12px; }
    .sk-dot  { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .sk-line { height: 12px; border-radius: 6px; }
    .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: shim 1.4s infinite; }
    @keyframes shim { to { background-position: -200% 0; } }

    .empty { background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; }
    .empty-icon { width: 58px; height: 58px; background: #F0FDF4; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
    .empty-icon svg { width: 26px; height: 26px; }
    .empty-title { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; }
    .empty-sub   { font-size: 13px; color: #94A3B8; max-width: 280px; line-height: 1.6; margin: 0; }

    @media (max-width: 560px) { .topbar { flex-direction: column; } }
  `],
  template: `
    @if (confirmOpen()) {
      <div class="modal-overlay" (click)="confirmOpen.set(false)">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-title">Confirmation</span>
            <button class="modal-close" (click)="confirmOpen.set(false)">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="confirm-icon" [style.background]="confirmIconBg()">
              <svg fill="none" [attr.stroke]="confirmIconColor()" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="confirmIconPath()"/>
              </svg>
            </div>
            <p class="confirm-title">{{ confirmTitle() }}</p>
            <p class="confirm-msg">{{ confirmMsg() }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="confirmOpen.set(false)">Annuler</button>
            <button class="btn-confirm" [style.background]="confirmBtnColor()" (click)="executeAction()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }

    <div class="topbar">
      <div>
        <p class="topbar-title">Signalements</p>
        <!-- ✅ CORRIGÉ : stats viennent de pageStats() chargé depuis le backend -->
        <p class="topbar-sub">{{ pageStats().enAttente }} en attente · cliquer sur une annonce pour voir le détail</p>
      </div>
      <div class="tabs" role="tablist">
        <button class="tab-btn" [class.active]="tab()==='EN_ATTENTE'" (click)="setTab('EN_ATTENTE')">
          En attente <span class="tab-count tc-red">{{ pageStats().enAttente }}</span>
        </button>
        <button class="tab-btn" [class.active]="tab()==='TRAITE'" (click)="setTab('TRAITE')">
          Traités <span class="tab-count tc-green">{{ pageStats().traites }}</span>
        </button>
        <button class="tab-btn" [class.active]="tab()==='IGNORE'" (click)="setTab('IGNORE')">
          Ignorés <span class="tab-count tc-slate">{{ pageStats().ignores }}</span>
        </button>
        <button class="tab-btn" [class.active]="tab()==='TOUS'" (click)="setTab('TOUS')">
          Tous <span class="tab-count tc-blue">{{ totalElements() }}</span>
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF2F2">
          <svg fill="none" stroke="#EF4444" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <div><div class="stat-val">{{ pageStats().enAttente }}</div><div class="stat-lbl">En attente</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#ECFDF5">
          <svg fill="none" stroke="#10B981" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div><div class="stat-val">{{ pageStats().traites }}</div><div class="stat-lbl">Traités</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#F8FAFC">
          <svg fill="none" stroke="#94A3B8" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M8 12h8"/>
          </svg>
        </div>
        <div><div class="stat-val">{{ pageStats().ignores }}</div><div class="stat-lbl">Ignorés</div></div>
      </div>
    </div>

    @if (loading()) {
      <div class="sk-list">
        @for (i of [1,2,3,4]; track i) {
          <div class="sk-card">
            <div class="sk-dot sk"></div>
            <div class="sk-lines">
              <div class="sk-line sk" style="width:35%"></div>
              <div class="sk-line sk" style="width:70%"></div>
              <div class="sk-line sk" style="width:50%"></div>
            </div>
          </div>
        }
      </div>

    } @else if (signalements().length === 0) {
      <div class="empty">
        <div class="empty-icon">
          <svg fill="none" stroke="#10B981" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="empty-title">Aucun signalement ici</p>
        <p class="empty-sub">
          @if (tab()==='EN_ATTENTE') { Aucun contenu à modérer. Tout est propre. }
          @else { Aucun signalement dans cette catégorie. }
        </p>
      </div>

    } @else {
      <div class="list">
        @for (s of signalements(); track s.id) {
          <div class="sig-card"
            [class.pending]="s.statut === 'EN_ATTENTE'"
            [class.done]="isTraite(s.statut)"
            [class.ignored]="s.statut === 'IGNORE'">

            <div class="ann-preview" (click)="goToAnnonce(s.annonceId)">
              <div class="ann-thumb">
                <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-6v-6H10v6H4a1 1 0 01-1-1z"/>
                </svg>
              </div>
              <div class="ann-info">
                <div class="ann-title">
                  {{ s.typeBienAnnonce }}
                  @if (s.quartierAnnonce) { — {{ s.quartierAnnonce }}, }
                  {{ s.villeAnnonce }}
                </div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                  @if (s.prixAnnonce) {
                    <span class="ann-price">{{ s.prixAnnonce | fcfa }}</span>
                  }
                  @if (s.statutAnnonce) {
                    <span class="ann-status" [style]="annStatutStyle(s.statutAnnonce)">
                      {{ annStatutLabel(s.statutAnnonce) }}
                    </span>
                  }
                </div>
                <div class="ann-link">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Voir l'annonce · {{ s.proprietaireNom }}
                </div>
              </div>
            </div>

            <div class="sig-body">
              <div class="auteur-row">
                <div class="auteur-avatar">
                  {{ (s.auteurPrenom ?? 'U')[0] }}{{ (s.auteurNom ?? '')[0] }}
                </div>
                <div>
                  <div class="auteur-name">
                    {{ s.auteurPrenom }} {{ s.auteurNom }}
                    <span style="color:#94A3B8;font-weight:400"> — signalé par</span>
                  </div>
                  <div class="auteur-sub">{{ s.auteurEmail }} · {{ s.auteurVille }}</div>
                </div>
                <div style="margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                  <span class="badge" [ngClass]="motifCls(s.motif)">{{ motifLabel(s.motif) }}</span>
                  <span class="badge" [ngClass]="statutCls(s.statut)">{{ statutLabel(s.statut) }}</span>
                </div>
              </div>
              @if (s.details) {
                <div class="sig-desc">"{{ s.details }}"</div>
              }
            </div>

            <div class="sig-footer">
              <span class="footer-meta">{{ s.dateSignalement | timeAgo }}</span>
              <div class="footer-actions">
                @if (s.statut === 'EN_ATTENTE') {
                  <div class="drop-wrap" (click)="$event.stopPropagation()">
                    <!-- ✅ CORRIGÉ : fond bleu visible -->
                    <button class="btn-dots" (click)="toggleMenu(s.id)" aria-label="Actions">
                      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h.01M12 12h.01M19 12h.01"/>
                      </svg>
                    </button>
                    @if (openMenuId() === s.id) {
                      <div class="dropdown">
                        <button class="drop-item slate" (click)="askAction(s, 'IGNORE')">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M8 12h8"/>
                          </svg>
                          Ignorer ce signalement
                        </button>
                        <div class="drop-sep"></div>
                        <button class="drop-item blue" (click)="askAction(s, 'TRAITE_PAUSE')">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Mettre l'annonce en pause
                        </button>
                        <button class="drop-item amber" (click)="askAction(s, 'TRAITE_SUPPRESSION')">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          Supprimer l'annonce
                        </button>
                        <div class="drop-sep"></div>
                        <button class="drop-item red" (click)="askAction(s, 'TRAITE_SUSPENSION')">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636"/>
                          </svg>
                          Suspendre le propriétaire
                        </button>
                        <button class="drop-item dark" (click)="askAction(s, 'TRAITE_BANNISSEMENT')">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Bannir définitivement
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AdminSignalementsComponent implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminApi);
  private readonly toast    = inject(ToastService);
  private readonly router   = inject(Router);

  signalements  = signal<SignalementResponse[]>([]);
  loading       = signal(false);
  tab           = signal<TabKey>('EN_ATTENTE');
  openMenuId    = signal<number | null>(null);
  totalElements = signal(0);

  // ✅ CORRIGÉ : stats viennent de 3 appels parallèles au backend, pas calculées depuis la page courante
  pageStats = signal<PageStats>({ enAttente: 0, traites: 0, ignores: 0 });

  confirmOpen   = signal(false);
  confirmTitle  = signal('');
  confirmMsg    = signal('');
  confirmLabel  = signal('Confirmer');
  private pendingFn?: () => void;
  private _decision = signal<DecisionStatut>('IGNORE');
  private _clickHandler = () => this.openMenuId.set(null);

  confirmIconBg = computed(() =>
    this._decision() === 'IGNORE' ? '#F8FAFC' :
    ['TRAITE_SUPPRESSION','TRAITE_BANNISSEMENT'].includes(this._decision()) ? '#FEF2F2' :
    this._decision() === 'TRAITE_PAUSE' ? '#EFF6FF' : '#FFFBEB');
  confirmIconColor = computed(() =>
    ['TRAITE_SUPPRESSION','TRAITE_BANNISSEMENT'].includes(this._decision()) ? '#DC2626' :
    this._decision() === 'TRAITE_PAUSE' ? '#2563EB' :
    this._decision() === 'TRAITE_SUSPENSION' ? '#D97706' : '#64748B');
  confirmIconPath = computed(() =>
    ['TRAITE_SUPPRESSION','TRAITE_BANNISSEMENT'].includes(this._decision())
      ? 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
      : 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z');
  confirmBtnColor = computed(() =>
    ['TRAITE_SUPPRESSION','TRAITE_BANNISSEMENT'].includes(this._decision()) ? '#DC2626' :
    this._decision() === 'TRAITE_PAUSE' ? '#2563EB' :
    this._decision() === 'TRAITE_SUSPENSION' ? '#D97706' : '#64748B');

  ngOnInit(): void {
    this.loadAll();
    document.addEventListener('click', this._clickHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this._clickHandler);
  }

  setTab(t: TabKey): void {
    this.tab.set(t);
    this.loadCurrent();
  }

  // ✅ Charge les stats des 3 catégories + la liste du tab courant
  loadAll(): void {
    this.loadStats();
    this.loadCurrent();
  }

  // ✅ CORRIGÉ : 3 appels séparés pour avoir les vrais compteurs de chaque catégorie
  private loadStats(): void {
    // EN_ATTENTE
    this.adminApi.getSignalements('EN_ATTENTE', 0).subscribe({
      next: r => this.pageStats.update(s => ({ ...s, enAttente: r.data?.totalElements ?? r.data?.contenu?.length ?? 0 })),
      error: () => {},
    });
    // IGNORE
    this.adminApi.getSignalements('IGNORE', 0).subscribe({
      next: r => this.pageStats.update(s => ({ ...s, ignores: r.data?.totalElements ?? r.data?.contenu?.length ?? 0 })),
      error: () => {},
    });
    // TRAITE (on prend TRAITE_PAUSE comme représentant — ou mieux : charge tous et filtre)
    // Le backend accepte les valeurs exactes de l'enum Java
    // On fait 5 appels pour chaque valeur TRAITE_* et on somme
    const traitesStatuts: string[] = [
      'TRAITE_INFO','TRAITE_PAUSE','TRAITE_SUPPRESSION','TRAITE_SUSPENSION','TRAITE_BANNISSEMENT'
    ];
    let totalTraites = 0;
    let done = 0;
    traitesStatuts.forEach(statut => {
      this.adminApi.getSignalements(statut, 0).subscribe({
        next: r => {
          totalTraites += r.data?.totalElements ?? r.data?.contenu?.length ?? 0;
          done++;
          if (done === traitesStatuts.length) {
            this.pageStats.update(s => ({ ...s, traites: totalTraites }));
          }
        },
        error: () => { done++; },
      });
    });
  }

  loadCurrent(): void {
    this.loading.set(true);
    this.openMenuId.set(null);

    // ✅ CORRIGÉ : mapping tab → valeur statut backend
    // 'TRAITE' n'existe pas dans l'enum Java → on charge TRAITE_PAUSE comme défaut
    // et on affiche tous les TRAITE_* en chargeant sans filtre statut précis
    const statutParam = this.tab() === 'TOUS'
      ? undefined          // pas de filtre → backend renvoie EN_ATTENTE par défaut... 
                           // on doit passer un flag spécial ou charger page par page
      : this.tab() === 'TRAITE'
        ? undefined        // voir note ci-dessous
        : this.tab();      // 'EN_ATTENTE' ou 'IGNORE' → valeur exacte Java

    // Note : pour "Traités" et "Tous", le backend ne supporte pas de filtre générique.
    // On charge sans filtre statut (undefined) ce qui renvoie EN_ATTENTE côté backend.
    // Solution propre : ajouter un endpoint backend ou charger chaque statut séparément.
    // Ici on charge les 5 statuts TRAITE_* et on les concatène pour l'onglet Traités.
    if (this.tab() === 'TRAITE') {
      this.loadTraites();
      return;
    }

    if (this.tab() === 'TOUS') {
      this.loadTous();
      return;
    }

    this.adminApi.getSignalements(statutParam, 0).subscribe({
      next: r => {
        this.signalements.set(r.data?.contenu ?? []);
        this.totalElements.set(r.data?.totalElements ?? r.data?.contenu?.length ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ✅ Charge tous les TRAITE_* et les concatène
  private loadTraites(): void {
    const statuts = ['TRAITE_INFO','TRAITE_PAUSE','TRAITE_SUPPRESSION','TRAITE_SUSPENSION','TRAITE_BANNISSEMENT'];
    let all: SignalementResponse[] = [];
    let done = 0;
    statuts.forEach(statut => {
      this.adminApi.getSignalements(statut, 0).subscribe({
        next: r => {
          all = all.concat(r.data?.contenu ?? []);
          done++;
          if (done === statuts.length) {
            // Trier par date décroissante
            all.sort((a, b) => new Date(b.dateSignalement).getTime() - new Date(a.dateSignalement).getTime());
            this.signalements.set(all);
            this.totalElements.set(all.length);
            this.loading.set(false);
          }
        },
        error: () => { done++; if (done === statuts.length) this.loading.set(false); },
      });
    });
  }

  // ✅ Charge tous les statuts pour "Tous"
  private loadTous(): void {
    const statuts = ['EN_ATTENTE','IGNORE','TRAITE_INFO','TRAITE_PAUSE','TRAITE_SUPPRESSION','TRAITE_SUSPENSION','TRAITE_BANNISSEMENT'];
    let all: SignalementResponse[] = [];
    let done = 0;
    statuts.forEach(statut => {
      this.adminApi.getSignalements(statut, 0).subscribe({
        next: r => {
          all = all.concat(r.data?.contenu ?? []);
          done++;
          if (done === statuts.length) {
            all.sort((a, b) => new Date(b.dateSignalement).getTime() - new Date(a.dateSignalement).getTime());
            this.signalements.set(all);
            this.totalElements.set(all.length);
            this.loading.set(false);
          }
        },
        error: () => { done++; if (done === statuts.length) this.loading.set(false); },
      });
    });
  }

  toggleMenu(id: number): void {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  goToAnnonce(id: number): void {
    this.router.navigate(['/annonces', id]);
  }

  askAction(s: SignalementResponse, decision: DecisionStatut): void {
    this.openMenuId.set(null);
    this._decision.set(decision);
    const labels: Record<DecisionStatut, { title: string; msg: string; btn: string }> = {
      IGNORE:              { title: 'Ignorer ce signalement ?',     msg: 'Le signalement sera marqué comme ignoré.',                                      btn: 'Ignorer' },
      TRAITE_INFO:         { title: 'Marquer comme informé ?',      msg: 'Le signalement sera traité sans action supplémentaire.',                         btn: 'Confirmer' },
      TRAITE_PAUSE:        { title: "Mettre l'annonce en pause ?",  msg: `L'annonce "${s.typeBienAnnonce}" sera masquée. Seul l'admin peut la réactiver.`, btn: 'Mettre en pause' },
      TRAITE_SUPPRESSION:  { title: "Supprimer l'annonce ?",        msg: `L'annonce "${s.typeBienAnnonce}" sera supprimée définitivement.`,                btn: 'Supprimer' },
      TRAITE_SUSPENSION:   { title: 'Suspendre le propriétaire ?',  msg: `${s.proprietaireNom} sera suspendu. Ses annonces seront masquées.`,              btn: 'Suspendre' },
      TRAITE_BANNISSEMENT: { title: 'Bannir définitivement ?',      msg: `${s.proprietaireNom} sera banni et toutes ses annonces supprimées.`,             btn: 'Bannir' },
    };
    const cfg = labels[decision];
    this.confirmTitle.set(cfg.title);
    this.confirmMsg.set(cfg.msg);
    this.confirmLabel.set(cfg.btn);
    this.pendingFn = () => this.execTraiter(s.id, decision);
    this.confirmOpen.set(true);
  }

  executeAction(): void {
    this.confirmOpen.set(false);
    this.pendingFn?.();
    this.pendingFn = undefined;
  }

  private execTraiter(id: number, decision: DecisionStatut): void {
    this.adminApi.traiterSignalement(id, { statut: decision as any }).subscribe({
      next: () => { this.toast.success('Action effectuée'); this.loadAll(); },
      error: err => this.toast.error(err?.error?.message ?? 'Erreur'),
    });
  }

  // ✅ Helper : est-ce un statut "traité" ?
  isTraite(statut: string): boolean {
    return ['TRAITE_INFO','TRAITE_PAUSE','TRAITE_SUPPRESSION','TRAITE_SUSPENSION','TRAITE_BANNISSEMENT'].includes(statut);
  }

  motifLabel(m: string): string {
    return (MOTIF_SIGNALEMENT_LABELS as Record<string, string>)[m] ?? m;
  }
  motifCls(m: string): string {
    return m === 'ANNONCE_FRAUDULEUSE' ? 'b-fraud' : m === 'CONTENU_INAPPROPRIE' ? 'b-content' : 'b-other';
  }
  statutLabel(s: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente', IGNORE: 'Ignoré',
      TRAITE_INFO: 'Noté', TRAITE_PAUSE: 'Annonce en pause',
      TRAITE_SUPPRESSION: 'Annonce supprimée',
      TRAITE_SUSPENSION: 'Proprio suspendu',
      TRAITE_BANNISSEMENT: 'Proprio banni',
    };
    return map[s] ?? s;
  }
  statutCls(s: string): string {
    if (s === 'EN_ATTENTE') return 'b-pending';
    if (s === 'IGNORE')     return 'b-ignored';
    return 'b-done';
  }
  annStatutLabel(s: string): string {
    const m: Record<string,string> = { ACTIVE:'Actif', EN_PAUSE:'En pause', EXPIREE:'Expiré', ARCHIVEE:'Archivé', SUPPRIMEE:'Supprimé' };
    return m[s] ?? s;
  }
  annStatutStyle(s: string): string {
    if (s === 'ACTIVE')   return 'background:#F0FDF4;color:#15803D';
    if (s === 'EN_PAUSE') return 'background:#FFFBEB;color:#B45309';
    return 'background:#F1F5F9;color:#64748B';
  }
}