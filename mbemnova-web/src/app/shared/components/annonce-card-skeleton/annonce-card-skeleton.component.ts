import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-annonce-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
      <!-- Image skeleton -->
      <div class="skeleton h-48 w-full bg-slate-200"></div>
      <!-- Content -->
      <div class="p-4 space-y-3">
        <div class="skeleton h-4 w-2/3 rounded-full bg-slate-200"></div>
        <div class="skeleton h-3 w-1/2 rounded-full bg-slate-200"></div>
        <div class="flex items-center justify-between pt-1">
          <div class="skeleton h-6 w-1/3 rounded-full bg-slate-200"></div>
          <div class="skeleton h-8 w-8 rounded-full bg-slate-200"></div>
        </div>
        <div class="skeleton h-3 w-1/4 rounded-full bg-slate-200"></div>
      </div>
    </div>
  `,
})
export class AnnonceCardSkeletonComponent {
  @Input() count = 1;
}
