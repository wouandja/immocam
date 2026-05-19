import { Directive, HostListener } from '@angular/core';

@Directive({ selector: '[clickStop]', standalone: true })
export class ClickStopDirective {
  @HostListener('click', ['$event'])
  onClick(event: Event): void { event.stopPropagation(); }
}
