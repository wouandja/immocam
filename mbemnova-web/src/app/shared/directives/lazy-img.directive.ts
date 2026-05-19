import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({ selector: 'img[lazyImg]', standalone: true })
export class LazyImgDirective implements OnInit {
  @Input('lazyImg') src!: string;
  @Input() placeholder = '/assets/images/no-photo.svg';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    const img = this.el.nativeElement;
    img.src = this.placeholder;
    img.classList.add('opacity-0', 'transition-opacity', 'duration-300');

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const realImg = new Image();
        realImg.onload = () => {
          img.src = this.src;
          img.classList.remove('opacity-0');
          img.classList.add('opacity-100');
        };
        realImg.src = this.src;
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(img);
  }
}
