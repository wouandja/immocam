import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationApi } from '@core/services/api/notification.api';
import { NotificationResponse } from '@core/services/models/notification.model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  styles: [`
    :host { display: block; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    }
    .topbar h2 { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0; letter-spacing: -.4px; }
    .topbar p { font-size: 13px; color: #64748B; margin: 3px 0 0; }
    .btn-mark-all {
      height: 36px; padding: 0 14px;
      background: #1E2875; color: #fff; border: none; border-radius: 9px;
      font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background .15s;
    }
    .btn-mark-all:hover { background: #3245D1; }
    .btn-mark-all:disabled { opacity: .5; cursor: not-allowed; }

    .list { display: flex; flex-direction: column; gap: 8px; }
    .item {
      display: flex; align-items: flex-start; gap: 12px;
      background: #fff; border: 0.5px solid #E2E8F0; border-radius: 12px;
      padding: 14px 16px; cursor: pointer; transition: border-color .12s, background .12s;
    }
    .item:hover { border-color: #C7D2FE; background: #F8FAFF; }
    .item.unread { background: #F5F6FF; border-color: #C7D2FE; }
    .item-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .item-icon.SIGNALEMENT { background: #FEF3C7; }
    .item-icon.INSCRIPTION { background: #DBEAFE; }
    .item-body { flex: 1; min-width: 0; }
    .item-title { font-size: 13.5px; font-weight: 700; color: #0F172A; margin: 0 0 3px; }
    .item-msg { font-size: 13px; color: #475569; margin: 0; line-height: 1.4; }
    .item-time { font-size: 11.5px; color: #94A3B8; margin-top: 4px; }
    .unread-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #3245D1;
      flex-shrink: 0; margin-top: 6px;
    }

    .empty-state {
      padding: 64px 24px; display: flex; flex-direction: column;
      align-items: center; text-align: center; gap: 10px;
      background: #fff; border: 0.5px solid #E2E8F0; border-radius: 14px;
    }
    .empty-state p { font-size: 13px; color: #94A3B8; margin: 0; }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      margin-top: 16px;
    }
    .btn-pg {
      height: 32px; padding: 0 14px; border-radius: 8px;
      border: 0.5px solid #E2E8F0; background: #fff; color: #475569;
      font-size: 13px; cursor: pointer; font-family: inherit;
    }
    .btn-pg:disabled { opacity: .4; cursor: not-allowed; }
  `],
  template: `
    <div class="topbar">
      <div>
        <h2>Notifications</h2>
        <p>{{ total() }} notification(s)</p>
      </div>
      <button class="btn-mark-all" (click)="marquerToutesCommeLues()" [disabled]="nonLuesCount() === 0">
        Tout marquer comme lu
      </button>
    </div>

    @if (notifications().length === 0) {
      <div class="empty-state">
        <p>Aucune notification pour le moment.</p>
      </div>
    } @else {
      <div class="list">
        @for (n of notifications(); track n.id) {
          <div class="item" [class.unread]="!n.lu" (click)="ouvrir(n)">
            <div class="item-icon" [class]="n.type">
              {{ n.type === 'SIGNALEMENT' ? '🚩' : '👤' }}
            </div>
            <div class="item-body">
              <p class="item-title">{{ n.titre }}</p>
              <p class="item-msg">{{ n.message }}</p>
              <p class="item-time">{{ n.dateCreation | timeAgo }}</p>
            </div>
            @if (!n.lu) { <span class="unread-dot"></span> }
          </div>
        }
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="btn-pg" (click)="changerPage(page() - 1)" [disabled]="page() === 0">Précédent</button>
          <span style="font-size:13px;color:#64748B;">Page {{ page() + 1 }} / {{ totalPages() }}</span>
          <button class="btn-pg" (click)="changerPage(page() + 1)" [disabled]="page() >= totalPages() - 1">Suivant</button>
        </div>
      }
    }
  `,
})
export class AdminNotificationsComponent implements OnInit {
  private readonly api = inject(NotificationApi);
  private readonly router = inject(Router);

  notifications = signal<NotificationResponse[]>([]);
  total         = signal(0);
  totalPages    = signal(0);
  page          = signal(0);
  nonLuesCount  = signal(0);

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.api.lister(this.page()).subscribe({
      next: (r) => {
        this.notifications.set(r.data.contenu);
        this.total.set(r.data.totalElements);
        this.totalPages.set(r.data.totalPages);
        this.nonLuesCount.set(r.data.contenu.filter(n => !n.lu).length);
      },
    });
  }

  changerPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.charger();
  }

  ouvrir(n: NotificationResponse): void {
    if (!n.lu) {
      this.api.marquerCommeLue(n.id).subscribe(() => {
        n.lu = true;
        this.notifications.update(list => [...list]);
      });
    }
    if (n.lien) this.router.navigateByUrl(n.lien);
  }

  marquerToutesCommeLues(): void {
    this.api.marquerToutesCommeLues().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, lu: true })));
      this.nonLuesCount.set(0);
    });
  }
}
