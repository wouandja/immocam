// =====================================================================
// sidebar.component.ts
// =====================================================================
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
 
interface NavItem {
  label:  string;
  route:  string;
  badge?: number;
  icon:   'dashboard' | 'annonces' | 'utilisateurs' | 'signalements' | 'config';
}
 
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [`
    :host { display: block; }
 
    aside {
      width: 232px;
      background: #1e3a5f;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 30;
      transition: width .25s cubic-bezier(.4, 0, .2, 1),
                  transform .25s cubic-bezier(.4, 0, .2, 1);
      overflow: hidden;
    }
 
    aside.collapsed      { width: 60px; }
    aside.mobile-hidden  { transform: translateX(-100%); width: 232px; }
    aside.mobile-visible { transform: translateX(0);     width: 232px; }
 
    /* ── Logo ── */
    .logo {
      padding: 16px 14px;
      display: flex;
      align-items: center;
      gap: 11px;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, #3245D1, #16A34A) 1;
      min-height: 60px;
      flex-shrink: 0;
      position: relative;
    }
    .logo-mark {
      width: 38px; height: 38px;
      border-radius: 9px;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }
    .logo-mark img { width: 100%; height: 100%; object-fit: cover; }
    .logo-text { overflow: hidden; white-space: nowrap; flex: 1; }
    .logo-text strong { display: block; font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -.2px; }
    .logo-text span   { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px; }
 
    .toggle-btn {
      position: absolute;
      top: 50%; right: -11px;
      transform: translateY(-50%);
      width: 22px; height: 22px;
      border-radius: 50%;
      background: #1e3a5f;
      border: 1px solid rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: background .15s;
    }
    .toggle-btn:hover { background: #16304e; }
    .toggle-btn svg   { width: 10px; height: 10px; stroke: rgba(255,255,255,0.7); }
 
    /* ── Nav ── */
    nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    nav::-webkit-scrollbar { width: 0; }
 
    .section-label {
      font-size: 10px;
      font-weight: 600;
      color: rgba(255,255,255,0.35);
      letter-spacing: .1em;
      text-transform: uppercase;
      padding: 10px 10px 4px;
      white-space: nowrap;
    }
 
    .nav-item {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 0 10px;
      height: 38px;
      border-radius: 8px;
      cursor: pointer;
      transition: background .15s;
      position: relative;
      text-decoration: none;
      overflow: hidden;
      white-space: nowrap;
    }
    .nav-item svg   { width: 17px; height: 17px; stroke: rgba(255,255,255,0.45); flex-shrink: 0; transition: stroke .15s; }
    .nav-item .lbl  { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.55); flex: 1; transition: color .15s; font-family: 'DM Sans', sans-serif; }
    .nav-item:hover { background: rgba(255,255,255,0.08); }
    .nav-item:hover svg { stroke: rgba(255,255,255,0.85); }
    .nav-item:hover .lbl { color: rgba(255,255,255,0.9); }
 
    .nav-item.active-link               { background: rgba(255,255,255,0.12); }
    .nav-item.active-link svg           { stroke: #fff; }
    .nav-item.active-link .lbl          { color: #fff; font-weight: 600; }
    .nav-item.active-link::before {
      content: '';
      position: absolute;
      left: 0; top: 7px; bottom: 7px;
      width: 3px;
      background: #93c5fd;
      border-radius: 0 3px 3px 0;
    }
 
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px;
      padding: 0 5px;
      background: #e11d48;
      border-radius: 9px;
      font-size: 10px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
 
    .tooltip {
      position: absolute;
      left: 52px;
      background: #1e3a5f;
      color: #e2e8f0;
      font-size: 12px; font-weight: 500;
      padding: 5px 10px;
      border-radius: 7px;
      border: 1px solid rgba(255,255,255,0.15);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity .1s;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .nav-item:hover .tooltip { opacity: 1; }
 
    aside.collapsed .lbl,
    aside.collapsed .badge,
    aside.collapsed .section-label,
    aside.collapsed .logo-text { opacity: 0; pointer-events: none; }
 
    /* ── Bottom ── */
    .sidebar-bottom {
      padding: 10px 8px 14px;
      border-top: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    .user-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px;
      overflow: hidden;
    }
    .avatar {
      width: 30px; height: 30px; border-radius: 8px;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
    .user-info            { overflow: hidden; white-space: nowrap; }
    .user-info strong     { display: block; font-size: 12px; font-weight: 600; color: #fff; }
    .user-info span       { display: block; font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 1px; }
    aside.collapsed .user-info { opacity: 0; }
 
    .logout-btn {
      display: flex; align-items: center; gap: 11px;
      padding: 0 10px; height: 36px;
      border-radius: 8px; cursor: pointer;
      background: transparent; border: none; width: 100%;
      font-family: 'DM Sans', sans-serif;
      overflow: hidden; white-space: nowrap;
      transition: background .15s; margin-top: 4px;
    }
    .logout-btn svg  { width: 16px; height: 16px; stroke: rgba(255,255,255,0.4); flex-shrink: 0; transition: stroke .15s; }
    .logout-btn span { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 500; transition: color .15s; }
    .logout-btn:hover        { background: rgba(239,68,68,0.15); }
    .logout-btn:hover svg    { stroke: #fca5a5; }
    .logout-btn:hover span   { color: #fca5a5; }
    aside.collapsed .logout-btn span { opacity: 0; }
 
    .site-link {
      display: flex; align-items: center; gap: 11px;
      padding: 0 10px; height: 36px;
      border-radius: 8px; cursor: pointer;
      text-decoration: none;
      overflow: hidden; white-space: nowrap;
      transition: background .15s; margin-bottom: 4px;
    }
    .site-link svg  { width: 16px; height: 16px; stroke: rgba(255,255,255,0.35); flex-shrink: 0; }
    .site-link span { font-size: 13px; color: rgba(255,255,255,0.35); font-family: 'DM Sans', sans-serif; }
    .site-link:hover { background: rgba(255,255,255,0.06); }
    .site-link:hover svg  { stroke: rgba(255,255,255,0.7); }
    .site-link:hover span { color: rgba(255,255,255,0.7); }
    aside.collapsed .site-link span { opacity: 0; }
  `],
  template: `
    <aside
      [class.collapsed]="collapsed && !isMobileBreakpoint"
      [class.mobile-hidden]="isMobileBreakpoint && !mobileOpen"
      [class.mobile-visible]="isMobileBreakpoint && mobileOpen"
    >
      <!-- Logo -->
      <div class="logo">
        <div class="logo-mark">
          <img src="/logo.jpeg?v=2" alt="Bailocam" />
        </div>
        <div class="logo-text">
          <strong>Administration</strong>
        </div>
        <button class="toggle-btn" (click)="collapseToggled.emit()" [title]="collapsed ? 'Développer' : 'Réduire'">
          <svg viewBox="0 0 10 10" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               [style.transform]="collapsed ? 'rotate(180deg)' : 'none'">
            <polyline points="6,2 3,5 6,8"/>
          </svg>
        </button>
      </div>
 
      <!-- Navigation -->
      <nav>
        <div class="section-label">Principal</div>
        @for (item of mainNav; track item.route) {
          <a class="nav-item" [routerLink]="item.route" routerLinkActive="active-link" (click)="onNavClick(item)">
            <ng-container [ngTemplateOutlet]="iconTpl" [ngTemplateOutletContext]="{ icon: item.icon }"/>
            <span class="lbl">{{ item.label }}</span>
            @if (item.badge) { <span class="badge">{{ item.badge }}</span> }
            <span class="tooltip">{{ item.label }}{{ item.badge ? ' · ' + item.badge : '' }}</span>
          </a>
        }
 
        <div class="section-label">Modération</div>
        @for (item of moderationNav; track item.route) {
          <a class="nav-item" [routerLink]="item.route" routerLinkActive="active-link" (click)="onNavClick(item)">
            <ng-container [ngTemplateOutlet]="iconTpl" [ngTemplateOutletContext]="{ icon: item.icon }"/>
            <span class="lbl">{{ item.label }}</span>
            @if (item.badge) { <span class="badge">{{ item.badge }}</span> }
            <span class="tooltip">{{ item.label }}{{ item.badge ? ' · ' + item.badge : '' }}</span>
          </a>
        }
 
        <div class="section-label">Système</div>
        @for (item of systemNav; track item.route) {
          <a class="nav-item" [routerLink]="item.route" routerLinkActive="active-link" (click)="onNavClick(item)">
            <ng-container [ngTemplateOutlet]="iconTpl" [ngTemplateOutletContext]="{ icon: item.icon }"/>
            <span class="lbl">{{ item.label }}</span>
            <span class="tooltip">{{ item.label }}</span>
          </a>
        }
      </nav>
 
      <!-- Bottom -->
      <div class="sidebar-bottom">
        <a class="site-link" routerLink="/">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
          </svg>
          <span>Voir le site</span>
        </a>
 
        <div class="user-row">
          <div class="avatar">AD</div>
          <div class="user-info">
            <strong>Admin</strong>
            <span>Super-admin</span>
          </div>
        </div>
 
        <button class="logout-btn" (click)="logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
 
    <ng-template #iconTpl let-icon="icon">
      @switch (icon) {
        @case ('dashboard') {
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        }
        @case ('annonces') {
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12L12 3L21 12V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1z"/>
          </svg>
        }
        @case ('utilisateurs') {
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="7" r="4"/>
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
            <path d="M21 21v-2a4 4 0 00-3-3.87"/>
          </svg>
        }
        @case ('signalements') {
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        }
        @case ('config') {
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        }
      }
    </ng-template>
  `,
})
export class SidebarComponent {
  @Input()  collapsed  = false;
  @Input()  mobileOpen = false;
  @Output() collapseToggled = new EventEmitter<void>();
  @Output() mobileClosed    = new EventEmitter<void>();
  @Output() pageChanged     = new EventEmitter<string>();
 
  private readonly store = inject(Store);
 
  get isMobileBreakpoint(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }
 
  mainNav: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',    route: '/admin/dashboard'    },
    { label: 'Annonces',     icon: 'annonces',     route: '/admin/annonces'     },
    { label: 'Utilisateurs', icon: 'utilisateurs', route: '/admin/utilisateurs' },
  ];
 
  moderationNav: NavItem[] = [
    { label: 'Signalements', icon: 'signalements', route: '/admin/signalements' },
  ];
 
  systemNav: NavItem[] = [
    { label: 'Configuration', icon: 'config', route: '/admin/config' },
  ];
 
  onNavClick(item: NavItem): void {
    this.pageChanged.emit(item.label);
    if (this.isMobileBreakpoint) this.mobileClosed.emit();
  }
 
  logout(): void {
    this.store.dispatch(authActions.logout());
  }
}
 