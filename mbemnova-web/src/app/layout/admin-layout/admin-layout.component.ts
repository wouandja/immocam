import { Component, signal, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  styles: [`
    :host { display: block; }
 
    .layout {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
      font-family: 'DM Sans', sans-serif;
    }
 
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 42, 94, 0.4);
      z-index: 29;
    }
    .overlay.visible { display: block; }
 
    .main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      transition: margin-left .25s cubic-bezier(.4, 0, .2, 1);
    }
    .main.expanded  { margin-left: 232px; }
    .main.collapsed { margin-left: 60px;  }
    .main.mobile    { margin-left: 0;     }
 
    .topbar {
      height: 56px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .topbar-left  { display: flex; align-items: center; gap: 12px; }
    .topbar-right { display: flex; align-items: center; gap: 8px;  }
 
    .breadcrumb { font-size: 13px; color: #94a3b8; font-family: 'DM Sans', sans-serif; }
    .breadcrumb strong { color: #1e3a5f; font-weight: 600; }
 
    .menu-btn {
      display: none;
      width: 36px; height: 36px;
      border-radius: 8px;
      background: transparent;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: background .15s, border-color .15s;
    }
    .menu-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
 
    .icon-btn {
      width: 36px; height: 36px;
      border-radius: 8px;
      background: transparent;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background .15s, border-color .15s;
    }
    .icon-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .icon-btn svg   { width: 16px; height: 16px; stroke: #64748b; }
 
    .notif-dot {
      position: absolute;
      top: 8px; right: 8px;
      width: 6px; height: 6px;
      background: #e11d48;
      border-radius: 50%;
      border: 1.5px solid #fff;
    }
 
    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
 
    @media (max-width: 768px) {
      .menu-btn { display: flex; }
      .main.expanded,
      .main.collapsed { margin-left: 0; }
    }
  `],
  template: `
    <div class="layout">
      <div class="overlay" [class.visible]="mobileOpen()" (click)="closeMobile()"></div>
 
      <app-admin-sidebar
        [collapsed]="collapsed()"
        [mobileOpen]="mobileOpen()"
        (collapseToggled)="toggleCollapse()"
        (mobileClosed)="closeMobile()"
        (pageChanged)="currentPage.set($any($event))"
      />
 
      <div
        class="main"
        [class.expanded]="!collapsed() && !isMobile()"
        [class.collapsed]="collapsed() && !isMobile()"
        [class.mobile]="isMobile()"
      >
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-btn" (click)="openMobile()" aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span class="breadcrumb">Admin / <strong>{{ currentPage() }}</strong></span>
          </div>
          <div class="topbar-right">
            <button class="icon-btn" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span class="notif-dot"></span>
            </button>
          </div>
        </header>
 
        <div class="content">
          <router-outlet/>
        </div>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  collapsed   = signal(false);
  mobileOpen  = signal(false);
  isMobile    = signal(false);
  currentPage = signal('Dashboard');
 
  @HostListener('window:resize')
  onResize(): void { this.isMobile.set(window.innerWidth <= 768); }
 
  ngOnInit(): void { this.isMobile.set(window.innerWidth <= 768); }
 
  toggleCollapse(): void { this.collapsed.update(v => !v); }
  openMobile():    void  { this.mobileOpen.set(true);       }
  closeMobile():   void  { this.mobileOpen.set(false);      }
}
 
 
