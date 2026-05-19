import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">{{ title }}</h1>
      @if (subtitle) {
        <p class="text-slate-500 text-sm mt-1">{{ subtitle }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
