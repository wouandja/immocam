import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: contents; }

    .overlay {
      position: fixed; inset: 0; z-index: 2000;
      display: flex; align-items: flex-end; justify-content: center;
      padding: 0;
      animation: fadeIn .15s ease;
    }
    @media (min-width: 640px) {
      .overlay { align-items: center; padding: 16px; }
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

    .backdrop {
      position: absolute; inset: 0;
      background: rgba(0, 0, 0, .45);
      backdrop-filter: blur(4px);
    }

    .dialog {
      position: relative;
      width: 100%;
      /* ✅ Sur mobile : marge en bas pour dépasser la navbar (60-80px selon l'OS) */
      margin-bottom: env(safe-area-inset-bottom, 0px);
      padding-bottom: calc(16px + env(safe-area-inset-bottom, 70px));

      background: #ffffff;
      border-radius: 24px 24px 0 0;
      box-shadow: 0 -8px 40px rgba(0, 0, 0, .18);
      padding: 24px 20px calc(80px + env(safe-area-inset-bottom, 0px));
      animation: slideUp .22s ease;
    }

    /* Sur desktop : dialog centré, arrondi partout, taille limitée */
    @media (min-width: 640px) {
      .dialog {
        max-width: 380px;
        border-radius: 24px;
        padding: 28px 24px 24px;
        box-shadow: 0 25px 60px rgba(0,0,0,.2);
      }
    }

    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    /* ── Poignée mobile ── */
    .handle {
      width: 36px; height: 4px; border-radius: 99px;
      background: #e2e8f0; margin: 0 auto 20px;
    }
    @media (min-width: 640px) { .handle { display: none; } }

    /* ── Icône ── */
    .icon-wrap {
      width: 48px; height: 48px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 14px;
    }
    .icon-wrap.danger  { background: #fee2e2; color: #dc2626; }
    .icon-wrap.warning { background: #fef3c7; color: #d97706; }

    /* ── Textes ── */
    .dialog-title {
      text-align: center; font-size: 16px; font-weight: 700;
      color: #0f172a; margin: 0 0 8px;
    }
    .dialog-message {
      text-align: center; font-size: 13px; color: #64748b;
      line-height: 1.55; margin: 0 0 20px;
    }

    /* ── Actions ── */
    .actions { display: flex; gap: 10px; }

    .btn {
      flex: 1; height: 46px; padding: 0 12px;
      font-size: 14px; font-weight: 600; font-family: inherit;
      border-radius: 12px; cursor: pointer; border: none;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background .15s, transform .1s;
      /* ✅ Empêche le texte de déborder */
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      min-width: 0;
    }
    .btn:active { transform: scale(.97); }

    .btn-cancel {
      background: #ffffff; color: #475569;
      border: 1.5px solid #e2e8f0;
      /* Le bouton Annuler prend moins de place */
      flex: 0 0 auto; padding: 0 20px;
    }
    .btn-cancel:hover { background: #f8fafc; }

    .btn-confirm-danger   { background: #dc2626; color: #ffffff; }
    .btn-confirm-danger:hover  { background: #b91c1c; }

    .btn-confirm-default  { background: #1e3a8a; color: #ffffff; }
    .btn-confirm-default:hover { background: #1e40af; }
  `],
  template: `
    @if (open) {
      <div class="overlay" (click)="cancel()">
        <div class="backdrop"></div>

        <div class="dialog" (click)="$event.stopPropagation()">
          <!-- Poignée visuelle sur mobile -->
          <div class="handle"></div>

          <!-- Icône -->
          <div class="icon-wrap" [class.danger]="danger" [class.warning]="!danger">
            <svg width="22" height="22" fill="none" stroke="currentColor"
                 stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                   1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34
                   16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>

          <!-- Textes -->
          <h3 class="dialog-title">{{ title }}</h3>
          <p class="dialog-message">{{ message }}</p>

          <!-- Boutons -->
          <div class="actions">
            <button class="btn btn-cancel" type="button" (click)="cancel()">
              Annuler
            </button>
            <button
              class="btn"
              [class.btn-confirm-danger]="danger"
              [class.btn-confirm-default]="!danger"
              type="button"
              (click)="confirm()">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() open         = false;
  @Input() title        = "Confirmer l'action";
  @Input() message      = 'Êtes-vous sûr de vouloir effectuer cette action ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() danger       = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  confirm(): void { this.confirmed.emit(); }
  cancel(): void  { this.cancelled.emit(); }
}