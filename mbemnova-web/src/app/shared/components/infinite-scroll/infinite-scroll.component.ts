import { Component, Output, EventEmitter, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-infinite-scroll',
  standalone: true,
  template: `<div class="scroll-sentinel" aria-hidden="true"></div>`,
})
export class InfiniteScrollComponent implements OnInit, OnDestroy {
  @Input() disabled = false;
  @Output() scrolled = new EventEmitter<void>();

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !this.disabled) {
          this.scrolled.emit();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    this.observer.observe(this.el.nativeElement.querySelector('.scroll-sentinel')!);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
