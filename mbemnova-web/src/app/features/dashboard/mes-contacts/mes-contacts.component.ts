import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactApi } from '@core/services/api/contact.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { ContactResponse } from '@core/services/models';

@Component({
  selector: 'app-mes-contacts',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  styles: [`
    :host { display: block; }

    .card {
      background: #fff;
      border: 1.5px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(30,58,95,0.05);
    }

    .card-head {
      padding: 18px 20px;
      border-bottom: 1px solid #f3f4f6;
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 12px;
    }
    .card-title { font-size: 14px; font-weight: 700; color: #111827; letter-spacing: -.01em; }
    .card-sub   { font-size: 12px; color: #9ca3af; margin-top: 3px; line-height: 1.5; }
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 28px; height: 28px; padding: 0 8px;
      background: #f0f4f8; border: 1.5px solid #e5e7eb;
      border-radius: 8px; font-size: 12px; font-weight: 700;
      color: #1e3a5f; flex-shrink: 0;
    }

    .empty-wrap {
      display: flex; flex-direction: column; align-items: center;
      padding: 52px 24px; text-align: center;
    }
    .empty-icon {
      width: 56px; height: 56px; border-radius: 16px; background: #f0f4f8;
      display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
    }
    .empty-icon svg { width: 26px; height: 26px; color: #9ca3af; }
    .empty-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .empty-sub   { font-size: 13px; color: #6b7280; line-height: 1.6; }

    .contact-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px; border-bottom: 1px solid #f3f4f6;
      transition: background 0.1s;
    }
    .contact-row:last-child { border-bottom: none; }
    .contact-row:hover      { background: #fafafa; }

    .avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: #f0f4f8; border: 1.5px solid #e5e7eb;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 15px; font-weight: 700; color: #1e3a5f;
    }

    .contact-info { flex: 1; min-width: 0; }
    .contact-name {
      font-size: 14px; font-weight: 700; color: #111827;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      letter-spacing: -.01em;
    }
    .contact-phone {
      font-size: 12px; color: #6b7280; margin-top: 2px;
      display: flex; align-items: center; gap: 5px;
    }
    .contact-phone svg { width: 12px; height: 12px; flex-shrink: 0; }

    .contact-annonce {
      display: inline-flex; align-items: center; gap: 5px; margin-top: 5px;
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 2px 8px; font-size: 11px; font-weight: 600; color: #374151;
      max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .contact-annonce svg { width: 11px; height: 11px; color: #9ca3af; flex-shrink: 0; }

    .contact-right {
      display: flex; flex-direction: column;
      align-items: flex-end; gap: 7px; flex-shrink: 0;
    }
    .contact-time { font-size: 11px; color: #9ca3af; font-weight: 500; }

    .btn-reply {
      display: inline-flex; align-items: center; gap: 6px;
      height: 34px; padding: 0 14px;
      background: #25d366; color: #fff;
      border-radius: 9px; border: none; cursor: pointer;
      font-size: 12px; font-weight: 700; font-family: inherit;
      text-decoration: none; white-space: nowrap;
      transition: background 0.15s, transform 0.1s;
    }
    .btn-reply:hover  { background: #1ebe5d; }
    .btn-reply:active { transform: scale(0.98); }
    .btn-reply svg    { width: 14px; height: 14px; flex-shrink: 0; }
  `],
  template: `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Contacts reçus</div>
          <div class="card-sub">Personnes ayant cliqué sur votre bouton de contact WhatsApp</div>
        </div>
        @if (contacts().length > 0) {
          <span class="count-badge">{{ contacts().length }}</span>
        }
      </div>

      @if (contacts().length === 0) {
        <div class="empty-wrap">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8
                   a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12
                   c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <p class="empty-title">Aucun contact reçu</p>
          <p class="empty-sub">Les personnes qui vous contactent via WhatsApp<br/>apparaîtront ici.</p>
        </div>

      } @else {
        @for (c of contacts(); track c.id) {
          <div class="contact-row">

            <div class="avatar">{{ (c.utilisateurPrenom?.[0] ?? '?').toUpperCase() }}</div>

            <div class="contact-info">
              <div class="contact-name">{{ c.utilisateurPrenom ?? 'Inconnu' }}</div>
              <div class="contact-phone">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372
                       c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293
                       c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21
                       l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5
                       A2.25 2.25 0 002.25 4.5v2.25z"/>
                </svg>
                {{ c.telephoneMasque }}
              </div>
              @if (c.annonceTitre) {
                <div class="contact-annonce">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2
                         m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2
                         a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  {{ c.annonceTitre }}
                </div>
              }
            </div>

            <div class="contact-right">
              <span class="contact-time">{{ c.dateContact | timeAgo }}</span>
              <a [href]="c.lienWhatsApp" target="_blank" rel="noopener noreferrer" class="btn-reply">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
                           -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463
                           -2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606
                           .134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371
                           -.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
                           -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016
                           -1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487
                           .709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719
                           2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.04l5.36-1.406
                           A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818
                           a9.818 9.818 0 01-5.007-1.374l-.36-.213-3.181.835.849-3.101-.234-.378
                           A9.818 9.818 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578
                           21.818 12 17.422 21.818 12 21.818z"/>
                </svg>
                Répondre
              </a>
            </div>

          </div>
        }
      }
    </div>
  `,
})
export class MesContactsComponent implements OnInit {
  private readonly contactApi = inject(ContactApi);
  contacts = signal<ContactResponse[]>([]);

  ngOnInit(): void {
    this.contactApi.getMesContacts().subscribe({
      next: res => this.contacts.set(res.data.contenu ?? []),
    });
  }
}