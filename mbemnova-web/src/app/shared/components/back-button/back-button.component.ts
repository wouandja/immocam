import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button (click)="go()"
      class="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-900
             hover:bg-blue-50 rounded-xl transition-all text-sm font-medium active:scale-95">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Retour
    </button>
  `,
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  go(): void { this.location.back(); }
}
