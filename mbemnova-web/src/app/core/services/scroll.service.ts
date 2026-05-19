import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  observeElement(element: Element, threshold = 0.1): Observable<void> {
    return new Observable(subscriber => {
      const observer = new IntersectionObserver(
        entries => { if (entries[0].isIntersecting) subscriber.next(); },
        { threshold, rootMargin: '200px' }
      );
      observer.observe(element);
      return () => observer.disconnect();
    });
  }
  scrollToTop(smooth = true): void {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
  }
  scrollToElement(el: Element, offset = 80): void {
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}
