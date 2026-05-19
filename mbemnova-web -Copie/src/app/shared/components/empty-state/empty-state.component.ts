import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div class="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
        @if (icon === 'search') {
          <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        } @else if (icon === 'heart') {
          <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        } @else {
          <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        }
      </div>
      <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ title }}</h3>
      <p class="text-slate-500 text-sm max-w-xs">{{ subtitle }}</p>
      @if (actionLabel) {
        <ng-content></ng-content>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon: 'search' | 'heart' | 'box' = 'box';
  @Input() title = 'Aucun résultat';
  @Input() subtitle = 'Il n\'y a rien à afficher ici pour le moment.';
  @Input() actionLabel?: string;
}
