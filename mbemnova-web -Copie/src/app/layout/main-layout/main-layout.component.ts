import { Component, inject, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';
import { selectLoading } from '@store/ui/ui.selectors';
import { uiActions } from '@store/ui/ui.actions';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LoadingSpinnerComponent, MobileNavComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <app-header/>

      @if (loading()) {
        <app-loading-spinner [overlay]="true" message="Chargement..."/>
      }

      <main class="flex-1 w-full pb-nav sm:pb-0">
        <router-outlet/>
      </main>

      <app-footer/>

      <!-- Navigation bottom mobile -->
      <app-mobile-nav/>
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  private readonly store = inject(Store);
  readonly loading = this.store.selectSignal(selectLoading);

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window === 'undefined') return;
    this.store.dispatch(uiActions.setMobile({ isMobile: window.innerWidth < 640 }));
  }

  ngOnInit(): void {
    this.onResize();
  }
}
