import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
           (click)="cancel()">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <!-- Dialog -->
        <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 slide-up"
             (click)="$event.stopPropagation()">
          <!-- Icon -->
          <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
               [class]="iconBg">
            <svg class="w-6 h-6" [class]="iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-center font-bold text-slate-800 text-lg mb-2">{{ title }}</h3>
          <p class="text-center text-slate-500 text-sm mb-6">{{ message }}</p>
          <div class="flex gap-3">
            <button
              (click)="cancel()"
              class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600
                     font-medium hover:bg-slate-50 transition-colors active:scale-95">
              Annuler
            </button>
            <button
              (click)="confirm()"
              class="flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
              [class]="confirmBtnClass">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirmer l\'action';
  @Input() message = 'Êtes-vous sûr de vouloir effectuer cette action ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get iconBg(): string { return this.danger ? 'bg-red-100' : 'bg-amber-100'; }
  get iconColor(): string { return this.danger ? 'text-red-600' : 'text-amber-600'; }
  get confirmBtnClass(): string {
    return this.danger
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-900 hover:bg-blue-800';
  }
  confirm(): void { this.confirmed.emit(); }
  cancel(): void  { this.cancelled.emit(); }
}
