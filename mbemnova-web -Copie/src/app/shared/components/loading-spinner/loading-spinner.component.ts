import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (overlay) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3">
          <div class="spinner"></div>
          @if (message) {
            <p class="text-sm text-slate-500 animate-pulse">{{ message }}</p>
          }
        </div>
      </div>
    } @else {
      <div class="flex items-center justify-center p-8">
        <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      </div>
    }
  `,
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() message?: string;
  @Input() size = 40;
}
