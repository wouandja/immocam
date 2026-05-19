import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { selectMesAnnonces, selectActionLoading } from '@store/annonce/annonce.selectors';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AnnonceDashboardResponse, AnnonceListResponse } from '@core/services/models';

@Component({
  selector: 'app-mes-annonces',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    FcfaPipe,
    TimeAgoPipe,
  ],
  styles: [
    `
      :host {
        display: block;
      }

      /* ── État vide ── */
      .empty-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 24px;
        text-align: center;
      }
      .empty-icon {
        width: 56px;
        height: 56px;
        background: #f0f4f8;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }
      .empty-icon svg {
        width: 24px;
        height: 24px;
        color: #9ca3af;
      }
      .empty-title {
        font-size: 16px;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.01em;
        margin-bottom: 6px;
      }
      .empty-sub {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
        line-height: 1.6;
      }
      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 50px;
        padding: 0 24px;
        background: #1e3a5f;
        color: #fff;
        border-radius: 10px;
        border: none;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
        font-family: inherit;
        transition: background 0.15s;
      }
      .btn-primary:hover {
        background: #162d4a;
      }
      .btn-primary svg {
        width: 17px;
        height: 17px;
      }

      /* ── En-tête liste ── */
      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .list-count {
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }
      .btn-new {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 40px;
        padding: 0 16px;
        background: #1e3a5f;
        color: #fff;
        border-radius: 10px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        font-family: inherit;
        transition: background 0.15s;
      }
      .btn-new:hover {
        background: #162d4a;
      }
      .btn-new svg {
        width: 15px;
        height: 15px;
      }

      /* ── Cartes mobile ── */
      .mobile-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      @media (min-width: 680px) {
        .mobile-list {
          display: none;
        }
      }

      .m-card {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px;
        box-shadow: 0 1px 4px rgba(30, 58, 95, 0.04);
        transition:
          box-shadow 0.15s,
          border-color 0.15s;
      }
      .m-card:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 12px rgba(30, 58, 95, 0.08);
      }

      .m-card-top {
        display: flex;
        gap: 12px;
        margin-bottom: 14px;
      }

      .m-thumb {
        width: 52px;
        height: 52px;
        border-radius: 10px;
        background: #f3f4f6;
        border: 1.5px solid #e5e7eb;
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .m-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .m-thumb svg {
        width: 22px;
        height: 22px;
        color: #d1d5db;
      }

      .m-info {
        flex: 1;
        min-width: 0;
      }
      .m-type {
        font-size: 14px;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.01em;
        margin-bottom: 2px;
      }
      .m-loc {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      .m-price {
        font-size: 14px;
        font-weight: 600;
        color: #1e3a5f;
      }

      .m-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      .m-meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 3px 9px;
        font-size: 11px;
        color: #6b7280;
        font-weight: 500;
      }
      .m-meta-chip svg {
        width: 12px;
        height: 12px;
      }

      .m-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      /* ── Table desktop ── */
      .desktop-table {
        display: none;
      }
      @media (min-width: 680px) {
        .desktop-table {
          display: block;
        }
      }

      .table-card {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(30, 58, 95, 0.05);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead {
        border-bottom: 1.5px solid #f3f4f6;
      }
      th {
        padding: 12px 16px;
        text-align: left;
        font-size: 11px;
        font-weight: 700;
        color: #9ca3af;
        background: #f9fafb;
        white-space: nowrap;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      th.right {
        text-align: right;
      }

      tbody tr {
        border-bottom: 1px solid #f3f4f6;
        transition: background 0.1s;
      }
      tbody tr:last-child {
        border-bottom: none;
      }
      tbody tr:hover {
        background: #fafafa;
      }

      td {
        padding: 14px 16px;
        vertical-align: middle;
      }
      td.right {
        text-align: right;
      }

      .td-annonce {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .td-thumb {
        width: 40px;
        height: 40px;
        border-radius: 9px;
        background: #f3f4f6;
        border: 1.5px solid #e5e7eb;
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .td-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .td-thumb svg {
        width: 18px;
        height: 18px;
        color: #d1d5db;
      }

      .td-name {
        font-size: 13px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 2px;
      }
      .td-loc {
        font-size: 11px;
        color: #9ca3af;
      }

      .td-price {
        font-size: 13px;
        font-weight: 700;
        color: #1e3a5f;
        white-space: nowrap;
      }

      .td-stat {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.9;
      }
      .td-stat span {
        display: block;
        font-size: 11px;
      }

      .td-expire {
        font-size: 11px;
        color: #9ca3af;
      }

      /* ── Boutons d'action ── */
      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 32px;
        padding: 0 12px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 8px;
        border: 1.5px solid #e5e7eb;
        color: #374151;
        background: #fff;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
        transition:
          background 0.1s,
          border-color 0.1s;
      }
      .action-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }
      .action-btn.danger {
        border-color: #fecaca;
        color: #b91c1c;
      }
      .action-btn.danger:hover {
        background: #fef2f2;
        border-color: #fca5a5;
      }
      .action-btn svg {
        width: 12px;
        height: 12px;
      }

      .actions-row {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 5px;
        flex-wrap: wrap;
      }

      /* ── Séparateur vertical ── */
      .sep {
        width: 1px;
        height: 18px;
        background: #e5e7eb;
        flex-shrink: 0;
      }
    `,
  ],
  template: `
    <app-confirm-dialog
      [open]="confirmOpen()"
      [title]="confirmTitle()"
      [message]="confirmMessage()"
      [confirmLabel]="confirmLabel()"
      [danger]="confirmDanger()"
      (confirmed)="executeAction()"
      (cancelled)="confirmOpen.set(false)"
    />

    @if (mesAnnonces().length === 0) {
      <!-- ── État vide ── -->
      <div class="empty-wrap">
        <div class="empty-icon">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <p class="empty-title">Aucune annonce publiée</p>
        <p class="empty-sub">
          Publiez votre première annonce gratuitement<br />en quelques minutes.
        </p>
        <a routerLink="/annonces/creer" class="btn-primary">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Publier une annonce
        </a>
      </div>
    } @else {
      <!-- ── En-tête ── -->
      <div class="list-header">
        <span class="list-count">
          {{ mesAnnonces().length }} annonce{{ mesAnnonces().length > 1 ? 's' : '' }}
        </span>
        <a routerLink="/annonces/creer" class="btn-new">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle annonce
        </a>
      </div>

      <!-- ══ MOBILE — Cartes ══ -->
      <div class="mobile-list">
        @for (a of mesAnnonces(); track a.id) {
          <div class="m-card">
            <div class="m-card-top">
              <div class="m-thumb">
                @if (a.photoUrl) {
                 <img [src]="a.photoUrl" [alt]="a.typeBien" />
                } @else {
                  <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              </div>
              <div class="m-info">
                <div class="m-type">{{ a.typeBien }}</div>
                <div class="m-loc">{{ a.quartier }}, {{ a.ville }}</div>
                <div class="m-price">{{ a.prix | fcfa }}</div>
              </div>
              <app-status-badge [statut]="a.statut" />
            </div>

            <!-- Stats rapides -->
            <div class="m-meta">
              <span class="m-meta-chip">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                       -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {{ a.nombreVues }} vues
              </span>
              <span class="m-meta-chip">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8
                       a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12
                       c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {{ a.nombreCommentaires }} contacts
              </span>
              <span class="m-meta-chip">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{ a.dateExpiration | timeAgo }}
              </span>
            </div>

            <div class="m-actions">
              @for (action of getActions(a); track action.label) {
                <button class="action-btn" [class.danger]="action.danger" (click)="action.fn()">
                  {{ action.label }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- ══ DESKTOP — Table ══ -->
      <div class="desktop-table">
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Annonce</th>
                <th>Prix</th>
                <th>Statut</th>
                <th class="right">Vues / Contacts</th>
                <th class="right">Expiration</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (a of mesAnnonces(); track a.id) {
                <tr>
                  <!-- Annonce -->
                  <td>
                    <div class="td-annonce">
                      <div class="td-thumb">
                        @if (a.photoUrl) {
                           <img [src]="a.photoUrl" [alt]="a.typeBien" />
                        } @else {
                          <svg
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        }
                      </div>
                      <div>
                        <div class="td-name">{{ a.typeBien }}</div>
                        <div class="td-loc">{{ a.quartier }}, {{ a.ville }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Prix -->
                  <td>
                    <span class="td-price">{{ a.prix | fcfa }}</span>
                  </td>

                  <!-- Statut -->
                  <td>
                    <app-status-badge [statut]="a.statut" />
                  </td>

                  <!-- Stats -->
                  <td class="right">
                    <div class="td-stat">
                      <span>{{ a.nombreVues }} vues</span>
                      <span>{{ a.nombreCommentaires }} contacts</span>
                    </div>
                  </td>

                  <!-- Expiration -->
                  <td class="right">
                    <span class="td-expire">{{ a.dateExpiration | timeAgo }}</span>
                  </td>

                  <!-- Actions -->
                  <td>
                    <div class="actions-row">
                      @for (action of getActions(a); track action.label; let last = $last) {
                        <button
                          class="action-btn"
                          [class.danger]="action.danger"
                          (click)="action.fn()"
                        >
                          {{ action.label }}
                        </button>
                        @if (!last && action.danger) {
                          <span class="sep"></span>
                        }
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class MesAnnoncesComponent implements OnInit {
  private readonly store = inject(Store);
  readonly mesAnnonces = this.store.selectSignal(selectMesAnnonces);
  readonly actionLoading = this.store.selectSignal(selectActionLoading);

  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmLabel = signal('Confirmer');
  confirmDanger = signal(false);
  private pendingAction?: () => void;
  // En haut du composant, injecter Router
private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.dispatch(annonceActions.loadMesAnnonces({}));
  }

 getActions(a: AnnonceDashboardResponse): Array<{ label: string; fn: () => void; danger?: boolean }> {
  const actions: Array<{ label: string; fn: () => void; danger?: boolean }> = [];
  const s = a.statut;

  if (s !== 'SUPPRIMEE' && s !== 'ARCHIVEE') {
    actions.push({ 
      label: 'Modifier', 
      fn: () => this.router.navigate(['/annonces', a.id, 'modifier']) 
    });
  }
  if (s === 'ACTIVE') {
    actions.push({
      label: 'Pause',
      fn: () => this.confirm(
        'Mettre en pause ?',
        "Votre annonce ne sera plus visible jusqu'à réactivation.",
        () => this.store.dispatch(annonceActions.pause({ id: a.id })),
      ),
    });
    actions.push({
      label: 'Renouveler',
      fn: () => this.store.dispatch(annonceActions.renouveler({ id: a.id })),
    });
  }
  if (s === 'EN_PAUSE') {
    actions.push({
      label: 'Réactiver',
      fn: () => this.store.dispatch(annonceActions.reactiver({ id: a.id })),
    });
  }
  if (s === 'EXPIREE' || s === 'ACTIVE') {
    actions.push({
      label: 'Archiver',
      fn: () => this.confirm(
        'Archiver cette annonce ?',
        'Elle ne sera plus visible sur ImmoCam.',
        () => this.store.dispatch(annonceActions.archiver({ id: a.id })),
      ),
    });
  }
  actions.push({
    label: 'Supprimer',
    danger: true,
    fn: () => this.confirm(
      'Supprimer définitivement ?',
      'Cette action est irréversible. Toutes les données seront perdues.',
      () => this.store.dispatch(annonceActions.supprimer({ id: a.id })),
      true,
    ),
  });
  return actions;
}

  confirm(title: string, message: string, fn: () => void, danger = false): void {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.confirmDanger.set(danger);
    this.confirmLabel.set(danger ? 'Supprimer' : 'Confirmer');
    this.pendingAction = fn;
    this.confirmOpen.set(true);
  }

  executeAction(): void {
  this.confirmOpen.set(false);
  this.pendingAction?.();
  this.pendingAction = undefined;
  // Recharger après un court délai pour laisser l'API traiter
  setTimeout(() => {
    this.store.dispatch(annonceActions.loadMesAnnonces({}));
  }, 500);
}
}
