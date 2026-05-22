import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '@core/services/api/admin.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { SignalementResponse } from '@core/services/models';
import { ToastService } from '@core/services/toast.service';
import { MOTIF_SIGNALEMENT_LABELS } from '@core/services/models';

@Component({
  selector: 'app-admin-signalements',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
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

    /* ── Tabs ── */
    .tabs {
      display: flex;
      background: #F1F5F9;
      border-radius: 12px;
      padding: 3px;
      gap: 2px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 14px;
      border: none;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      color: #64748B;
      background: transparent;
      transition: all .15s;
      white-space: nowrap;
    }
    .tab-btn.active {
      background: #fff;
      color: #0F172A;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
    }
    .tab-btn.active .tab-count.danger { background: #FEE2E2; color: #DC2626; }
    .tab-btn .tab-count.danger { background: #f1f5f9; color: #94A3B8; }
    .tab-btn.active .tab-count.neutral { background: #E2E8F0; color: #475569; }
    .tab-btn .tab-count.neutral { background: #f1f5f9; color: #94A3B8; }

    /* ── Stats strip ── */
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon.red    { background: #FEF2F2; }
    .stat-icon.amber  { background: #FFFBEB; }
    .stat-icon.green  { background: #F0FDF4; }
    .stat-icon.slate  { background: #F8FAFC; }
    .stat-value { font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; line-height: 1; }
    .stat-label { font-size: 11px; color: #94A3B8; margin-top: 2px; font-weight: 500; }

    /* ── List ── */
    .list { display: flex; flex-direction: column; gap: 10px; }

    /* ── Card ── */
    .sig-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      overflow: hidden;
      transition: box-shadow .15s, border-color .15s;
    }
    .sig-card:hover { border-color: #C7D2FE; box-shadow: 0 4px 16px rgba(50,69,209,.06); }
    .sig-card.urgent { border-left: 3px solid #EF4444; }
    .sig-card.traite  { border-left: 3px solid #10B981; }
    .sig-card.ignore  { border-left: 3px solid #94A3B8; }

    .sig-body { padding: 16px; display: flex; gap: 14px; align-items: flex-start; }

    /* Severity dot */
    .sev-dot {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sev-dot.red    { background: #FEF2F2; }
    .sev-dot.slate  { background: #F8FAFC; }
    .sev-dot svg { width: 18px; height: 18px; }

    .sig-content { flex: 1; min-width: 0; }

    .sig-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .sig-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .01em;
    }
    .badge-motif-fraud    { background: #FEE2E2; color: #B91C1C; }
    .badge-motif-content  { background: #F3E8FF; color: #7C3AED; }
    .badge-motif-other    { background: #FEF9C3; color: #A16207; }
    .badge-status-pending { background: #FEF2F2; color: #DC2626; border: 0.5px solid #FECACA; }
    .badge-status-done    { background: #ECFDF5; color: #059669; border: 0.5px solid #A7F3D0; }
    .badge-status-ignore  { background: #F8FAFC; color: #94A3B8; border: 0.5px solid #E2E8F0; }

    .sig-time { font-size: 11px; color: #94A3B8; white-space: nowrap; }

    .sig-annonce {
      font-size: 13px;
      font-weight: 600;
      color: #0F172A;
      margin: 0 0 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sig-annonce span { color: #1E2875; }

    .sig-author { font-size: 12px; color: #64748B; margin: 0; }
    .sig-author strong { color: #0F172A; font-weight: 600; }

    .sig-description {
      margin-top: 8px;
      padding: 8px 12px;
      background: #F8FAFC;
      border-radius: 8px;
      border-left: 2px solid #E2E8F0;
      font-size: 12px;
      color: #475569;
      font-style: italic;
      line-height: 1.5;
    }

    /* ── Actions footer ── */
    .sig-footer {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 12px 16px;
      background: #FAFBFC;
      border-top: 0.5px solid #F1F5F9;
    }
    .footer-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: .06em; margin-right: 4px; }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 30px;
      padding: 0 12px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 0.5px solid;
      transition: all .12s;
      white-space: nowrap;
      font-family: inherit;
    }
    .btn-action svg { width: 13px; height: 13px; flex-shrink: 0; }
    .btn-action:active { transform: scale(.96); }

    .btn-ignore  { background: transparent; border-color: #CBD5E1; color: #64748B; }
    .btn-ignore:hover  { background: #F8FAFC; border-color: #94A3B8; color: #0F172A; }

    .btn-delete  { background: transparent; border-color: #FDE68A; color: #D97706; }
    .btn-delete:hover  { background: #FFFBEB; border-color: #F59E0B; }

    .btn-suspend { background: transparent; border-color: #FCA5A5; color: #DC2626; }
    .btn-suspend:hover { background: #FEF2F2; border-color: #F87171; }

    .btn-ban     { background: #DC2626; border-color: #DC2626; color: #fff; }
    .btn-ban:hover     { background: #B91C1C; border-color: #B91C1C; }

    /* ── Loading skeleton ── */
    .skeleton-list { display: flex; flex-direction: column; gap: 10px; }
    .sk-card {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      gap: 14px;
    }
    .sk-dot {
      width: 36px; height: 36px;
      border-radius: 10px;
      flex-shrink: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 2px; }
    .sk-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .sk-line.w30 { width: 30%; }
    .sk-line.w55 { width: 55%; }
    .sk-line.w75 { width: 75%; }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* ── Empty state ── */
    .empty-state {
      background: #fff;
      border: 0.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 64px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }
    .empty-icon {
      width: 64px; height: 64px;
      background: #F0FDF4;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .empty-title { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; }
    .empty-sub   { font-size: 13px; color: #94A3B8; max-width: 280px; line-height: 1.6; margin: 0; }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .stats-strip { grid-template-columns: 1fr 1fr; }
      .stats-strip .stat-card:last-child { grid-column: span 2; }
      .topbar { flex-direction: column; }
      .tabs { align-self: stretch; }
    }
    @media (max-width: 400px) {
      .stats-strip { grid-template-columns: 1fr; }
      .stats-strip .stat-card:last-child { grid-column: span 1; }
    }
  `],
  template: `
    <!-- Topbar -->
    <div class="topbar">
      <div class="topbar-left">
        <h2>Gestion des signalements</h2>
        <p>{{ countPending() }} en attente de traitement</p>
      </div>

      <!-- Tabs filtre statut -->
      <div class="tabs" role="tablist">
        <button
          class="tab-btn"
          [class.active]="filterStatut === 'EN_ATTENTE'"
          (click)="setFilter('EN_ATTENTE')"
          role="tab"
        >
          En attente
          <span class="tab-count danger">{{ countPending() }}</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="filterStatut === 'TRAITE'"
          (click)="setFilter('TRAITE')"
          role="tab"
        >
          Traités
          <span class="tab-count neutral">{{ countTraite() }}</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="filterStatut === 'IGNORE'"
          (click)="setFilter('IGNORE')"
          role="tab"
        >
          Ignorés
          <span class="tab-count neutral">{{ countIgnore() }}</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="filterStatut === ''"
          (click)="setFilter('')"
          role="tab"
        >
          Tous
        </button>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="stats-strip">
      <div class="stat-card">
        <div class="stat-icon red">
          <!-- Alert triangle -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="stat-value">{{ countPending() }}</div>
          <div class="stat-label">En attente</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <!-- Check circle -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline stroke-linecap="round" stroke-linejoin="round" points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <div class="stat-value">{{ countTraite() }}</div>
          <div class="stat-label">Traités</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon slate">
          <!-- Minus circle -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <div>
          <div class="stat-value">{{ countIgnore() }}</div>
          <div class="stat-label">Ignorés</div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="skeleton-list">
        @for (s of skeletonItems; track s) {
          <div class="sk-card">
            <div class="sk-dot"></div>
            <div class="sk-lines">
              <div class="sk-line w30"></div>
              <div class="sk-line w75"></div>
              <div class="sk-line w55"></div>
            </div>
          </div>
        }
      </div>
    } @else if (signalements().length === 0) {
      <!-- Empty state -->
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="empty-title">
          @if (filterStatut === 'EN_ATTENTE') { Aucun signalement en attente }
          @else if (filterStatut === 'TRAITE') { Aucun signalement traité }
          @else if (filterStatut === 'IGNORE') { Aucun signalement ignoré }
          @else { Aucun signalement }
        </p>
        <p class="empty-sub">
          @if (filterStatut === 'EN_ATTENTE') { La plateforme est propre, aucun contenu à modérer pour l'instant. }
          @else { Aucun signalement dans cette catégorie. }
        </p>
      </div>
    } @else {
      <!-- List -->
      <div class="list">
        @for (s of signalements(); track s.id) {
          <div
            class="sig-card"
            [class.urgent]="s.statut === 'EN_ATTENTE'"
            [class.traite]="s.statut === 'TRAITE'"
            [class.ignore]="s.statut === 'IGNORE'"
          >
            <div class="sig-body">
              <!-- Severity icon -->
              <div class="sev-dot" [class.red]="s.statut === 'EN_ATTENTE'" [class.slate]="s.statut !== 'EN_ATTENTE'">
                @if (s.statut === 'EN_ATTENTE') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                } @else if (s.statut === 'TRAITE') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                }
              </div>

              <div class="sig-content">
                <div class="sig-header">
                  <div class="sig-badges">
                    <!-- Motif badge -->
                    <span class="badge" [class]="motifBadgeClass(s.motif)">
                      {{ motifLabel(s.motif) }}
                    </span>
                    <!-- Statut badge -->
                    <span class="badge" [class]="statutBadgeClass(s.statut)">
                      @if (s.statut === 'EN_ATTENTE') { En attente }
                      @else if (s.statut === 'TRAITE') { Traité }
                      @else { Ignoré }
                    </span>
                  </div>
                  <span class="sig-time">{{ s.dateSignalement | timeAgo }}</span>
                </div>

                <p class="sig-annonce">
                  Annonce : <span>{{ s.annonceTitre }}</span>
                </p>
                <p class="sig-author">
                  Signalé par <strong>{{ s.auteurPrenom }}</strong>
                  <span style="color:#CBD5E1"> · </span>
                  {{ s.auteurEmail }}
                </p>

                @if (s.description) {
                  <div class="sig-description">"{{ s.description }}"</div>
                }
              </div>
            </div>

            <!-- Action footer — uniquement pour EN_ATTENTE -->
            @if (s.statut === 'EN_ATTENTE') {
              <div class="sig-footer">
                <span class="footer-label">Action</span>

                <!-- Ignorer -->
                <button class="btn-action btn-ignore" (click)="traiter(s.id, 'IGNORE', 'IGNORER')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  Ignorer
                </button>

                <!-- Supprimer annonce -->
                <button class="btn-action btn-delete" (click)="traiter(s.id, 'TRAITE', 'SUPPRIMER_ANNONCE')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Supprimer l'annonce
                </button>

                <!-- Suspendre -->
                <button class="btn-action btn-suspend" (click)="traiter(s.id, 'TRAITE', 'SUSPENDRE_PROPRIETAIRE')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                  Suspendre le propriétaire
                </button>

                <!-- Bannir -->
                <button class="btn-action btn-ban" (click)="traiter(s.id, 'TRAITE', 'BANNIR_PROPRIETAIRE')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  Bannir
                </button>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class AdminSignalementsComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast    = inject(ToastService);

  // ── Signals ──────────────────────────────────────────────────────────
  signalements = signal<SignalementResponse[]>([]);
  loading      = signal(false);
  filterStatut = 'EN_ATTENTE';

  readonly skeletonItems = Array(5).fill(0);

  // ── Computed counts ───────────────────────────────────────────────────
  countPending = computed(() => this.signalements().filter(s => s.statut === 'EN_ATTENTE').length);
  countTraite  = computed(() => this.signalements().filter(s => s.statut === 'TRAITE').length);
  countIgnore  = computed(() => this.signalements().filter(s => s.statut === 'IGNORE').length);

  // ── Cycle de vie ──────────────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  // ── Méthodes ──────────────────────────────────────────────────────────
  setFilter(statut: string): void {
    this.filterStatut = statut;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminApi.getSignalements(this.filterStatut || undefined).subscribe({
      next: (r) => {
        this.signalements.set(r.data.contenu);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  traiter(id: number, statut: any, action: any): void {
    this.adminApi.traiterSignalement(id, { statut, action }).subscribe({
      next: () => {
        this.toast.success('Signalement traité');
        this.load();
      },
    });
  }

  // ── Helpers badge ─────────────────────────────────────────────────────
  motifLabel(m: string): string {
    return (MOTIF_SIGNALEMENT_LABELS as any)[m] ?? m;
  }

  motifBadgeClass(m: string): string {
    if (m === 'ANNONCE_FRAUDULEUSE') return 'badge-motif-fraud';
    if (m === 'CONTENU_INAPPROPRIE')  return 'badge-motif-content';
    return 'badge-motif-other';
  }

  statutBadgeClass(s: string): string {
    if (s === 'EN_ATTENTE') return 'badge-status-pending';
    if (s === 'TRAITE')     return 'badge-status-done';
    return 'badge-status-ignore';
  }
}