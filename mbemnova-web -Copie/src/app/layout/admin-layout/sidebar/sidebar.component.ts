import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';

interface NavItem {
  label: string; icon: string; route: string; badge?: number;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-blue-950 text-blue-200 min-h-screen flex flex-col fixed left-0 top-0 z-30">
      <!-- Logo -->
      <div class="px-6 py-5 border-b border-blue-900">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
            <span class="text-blue-900 font-bold text-xs">IC</span>
          </div>
          <div>
            <p class="text-white font-bold text-sm">ImmoCam</p>
            <p class="text-blue-400 text-xs">Administration</p>
          </div>
        </div>
      </div>
      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route" routerLinkActive="bg-blue-800 text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    hover:bg-blue-900 hover:text-white transition-all">
            <span class="text-lg leading-none">{{ item.icon }}</span>
            <span class="flex-1">{{ item.label }}</span>
            @if (item.badge) {
              <span class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {{ item.badge }}
              </span>
            }
          </a>
        }
      </nav>
      <!-- Bottom -->
      <div class="px-3 py-4 border-t border-blue-900 space-y-1">
        <a routerLink="/" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                                  hover:bg-blue-900 hover:text-white transition-all">
          🌐 Voir le site
        </a>
        <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
               text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all">
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly store = inject(Store);

  navItems: NavItem[] = [
    { label: 'Dashboard',      icon: '📊', route: '/admin/dashboard' },
    { label: 'Annonces',       icon: '🏠', route: '/admin/annonces' },
    { label: 'Utilisateurs',   icon: '👥', route: '/admin/utilisateurs' },
    { label: 'Signalements',   icon: '🚨', route: '/admin/signalements', badge: 3 },
    { label: 'Commentaires',   icon: '💬', route: '/admin/commentaires' },
    { label: 'Configuration',  icon: '⚙️', route: '/admin/config' },
  ];

  logout(): void { this.store.dispatch(authActions.logout()); }
}
