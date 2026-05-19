import { Component, Input } from '@angular/core';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [FcfaPipe],
  template: `
    <span [class]="sizeClass + ' font-bold text-blue-900'">
      {{ prix | fcfa }}
    </span>
  `,
})
export class PriceDisplayComponent {
  @Input({ required: true }) prix!: number;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get sizeClass(): string {
    return { sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-2xl' }[this.size];
  }
}
