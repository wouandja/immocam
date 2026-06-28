import { Component, signal, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { NotificationApi } from '@core/services/api/notification.api';
import { NotificationResponse } from '@core/services/models/notification.model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule, TimeAgoPipe],
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
      top: 6px; right: 6px;
      min-width: 14px; height: 14px;
      background: #e11d48;
      border-radius: 50%;
      border: 1.5px solid #fff;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 2px;
      line-height: 1;
    }

    .notif-wrap { position: relative; }
    .notif-panel {
      position: absolute;
      top: 44px; right: 0;
      width: 340px;
      max-height: 420px;
      overflow-y: auto;
      background: #fff;
      border: 0.5px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(15,23,42,.12);
      z-index: 40;
    }
    .notif-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 0.5px solid #f1f5f9;
      font-size: 13px; font-weight: 700; color: #0f172a;
    }
    .notif-panel-header button {
      background: none; border: none; color: #3245d1;
      font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
      padding: 0;
    }
    .notif-panel-item {
      display: flex; gap: 10px; align-items: flex-start;
      padding: 10px 14px;
      border-bottom: 0.5px solid #f8fafc;
      cursor: pointer;
      transition: background .12s;
    }
    .notif-panel-item:hover { background: #f8fafc; }
    .notif-panel-item.unread { background: #f5f6ff; }
    .notif-panel-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
    .notif-panel-title { font-size: 12.5px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
    .notif-panel-msg { font-size: 12px; color: #64748b; margin: 0; line-height: 1.35; }
    .notif-panel-time { font-size: 10.5px; color: #94a3b8; margin-top: 3px; }
    .notif-panel-empty { padding: 28px 14px; text-align: center; font-size: 12.5px; color: #94a3b8; }
    .notif-panel-footer {
      padding: 10px 14px;
      text-align: center;
      border-top: 0.5px solid #f1f5f9;
    }
    .notif-panel-footer a {
      font-size: 12.5px; font-weight: 600; color: #3245d1; text-decoration: none;
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
            <div class="notif-wrap">
              <button class="icon-btn" aria-label="Notifications" (click)="toggleNotifPanel()">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                @if (nonLuesCount() > 0) {
                  <span class="notif-dot">{{ nonLuesCount() > 9 ? '9+' : nonLuesCount() }}</span>
                }
              </button>

              @if (notifPanelOpen()) {
                <div class="notif-panel">
                  <div class="notif-panel-header">
                    <span>Notifications</span>
                    @if (nonLuesCount() > 0) {
                      <button (click)="marquerToutesCommeLues()">Tout marquer lu</button>
                    }
                  </div>
                  @if (recentNotifications().length === 0) {
                    <div class="notif-panel-empty">Aucune notification</div>
                  } @else {
                    @for (n of recentNotifications(); track n.id) {
                      <div class="notif-panel-item" [class.unread]="!n.lu" (click)="ouvrirNotification(n)">
                        <span class="notif-panel-icon">{{ n.type === 'SIGNALEMENT' ? '🚩' : '👤' }}</span>
                        <div>
                          <p class="notif-panel-title">{{ n.titre }}</p>
                          <p class="notif-panel-msg">{{ n.message }}</p>
                          <p class="notif-panel-time">{{ n.dateCreation | timeAgo }}</p>
                        </div>
                      </div>
                    }
                  }
                  <div class="notif-panel-footer">
                    <a (click)="voirToutesNotifications()">Voir toutes les notifications</a>
                  </div>
                </div>
              }
            </div>
          </div>
        </header>
 
        <div class="content">
          <router-outlet/>
        </div>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private readonly notificationApi = inject(NotificationApi);
  private readonly router = inject(Router);

  collapsed   = signal(false);
  mobileOpen  = signal(false);
  isMobile    = signal(false);
  currentPage = signal('Dashboard');

  notifPanelOpen       = signal(false);
  nonLuesCount         = signal(0);
  recentNotifications  = signal<NotificationResponse[]>([]);
  private pollHandle?: ReturnType<typeof setInterval>;

  @HostListener('window:resize')
  onResize(): void { this.isMobile.set(window.innerWidth <= 768); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.notifPanelOpen() && !(event.target as HTMLElement).closest('.notif-wrap')) {
      this.notifPanelOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.isMobile.set(window.innerWidth <= 768);
    this.chargerCompteur();
    this.pollHandle = setInterval(() => this.chargerCompteur(), 60000);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
  }

  toggleCollapse(): void { this.collapsed.update(v => !v); }
  openMobile():    void  { this.mobileOpen.set(true);       }
  closeMobile():   void  { this.mobileOpen.set(false);      }

  private chargerCompteur(): void {
    this.notificationApi.compterNonLues().subscribe({ next: (r) => this.nonLuesCount.set(r.data ?? 0) });
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen.update(v => !v);
    if (this.notifPanelOpen()) {
      this.notificationApi.lister(0, 8).subscribe({ next: (r) => this.recentNotifications.set(r.data.contenu) });
    }
  }

  ouvrirNotification(n: NotificationResponse): void {
    this.notifPanelOpen.set(false);
    if (!n.lu) {
      this.notificationApi.marquerCommeLue(n.id).subscribe(() => {
        this.chargerCompteur();
      });
    }
    if (n.lien) this.router.navigateByUrl(n.lien);
  }

  voirToutesNotifications(): void {
    this.notifPanelOpen.set(false);
    this.router.navigate(['/admin/notifications']);
  }

  marquerToutesCommeLues(): void {
    this.notificationApi.marquerToutesCommeLues().subscribe(() => {
      this.recentNotifications.update(list => list.map(n => ({ ...n, lu: true })));
      this.nonLuesCount.set(0);
    });
  }
}
 
 
