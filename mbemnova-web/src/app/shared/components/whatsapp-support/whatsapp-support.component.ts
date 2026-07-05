import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const WA_NUMBER = '237691877527';

const SUJETS = [
  'Question générale',
  'Problème avec une annonce',
  'Problème de connexion / compte',
  'Signaler un contenu inapproprié',
  'Demande de partenariat',
  'Autre',
];

@Component({
  selector: 'app-whatsapp-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    /* ── Bouton flottant ── */
    .wa-fab {
      position: fixed;
      right: 20px;
      bottom: 80px;          /* au-dessus de la nav mobile */
      z-index: 1000;
      width: 52px;
      height: 52px;
      background: #25D366;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(37,211,102,.45);
      transition: transform .2s, box-shadow .2s;
    }
    @media (min-width: 640px) {
      .wa-fab { bottom: 28px; }
    }
    .wa-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(37,211,102,.55);
    }
    .wa-fab svg { width: 28px; height: 28px; fill: #fff; }

    /* Pastille "pulse" discrète */
    .wa-pulse {
      position: absolute;
      top: 0; right: 0;
      width: 13px; height: 13px;
      background: #fff;
      border-radius: 50%;
      border: 2px solid #25D366;
    }
    .wa-pulse::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: rgba(37,211,102,.35);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%   { transform: scale(1); opacity: 1; }
      70%  { transform: scale(1.9); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }

    /* ── Popup formulaire ── */
    .wa-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: transparent;
    }
    .wa-popup {
      position: fixed;
      right: 16px;
      bottom: 148px;
      z-index: 1001;
      width: 320px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      overflow: hidden;
      animation: slideUp .25s cubic-bezier(.22,1,.36,1);
    }
    @media (min-width: 640px) {
      .wa-popup { bottom: 96px; }
    }
    @media (max-width: 360px) {
      .wa-popup { right: 8px; left: 8px; width: auto; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px) scale(.97); }
      to   { opacity: 1; transform: none; }
    }

    /* En-tête vert */
    .wa-header {
      background: #25D366;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .wa-header-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .wa-header-icon svg { width: 20px; height: 20px; fill: #fff; }
    .wa-header-text { flex: 1; }
    .wa-header-text strong {
      display: block;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      font-family: sans-serif;
    }
    .wa-header-text span {
      color: rgba(255,255,255,.85);
      font-size: 11.5px;
      font-family: sans-serif;
    }
    .wa-close {
      background: none;
      border: none;
      color: rgba(255,255,255,.8);
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      transition: background .15s;
    }
    .wa-close:hover { background: rgba(255,255,255,.2); color: #fff; }
    .wa-close svg { width: 18px; height: 18px; stroke: currentColor; fill: none; }

    /* Corps du formulaire */
    .wa-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }

    .wa-field { display: flex; flex-direction: column; gap: 4px; }
    .wa-label {
      font-size: 11px; font-weight: 600;
      color: #6b7280; text-transform: uppercase;
      letter-spacing: .04em; font-family: sans-serif;
    }
    .wa-input, .wa-select, .wa-textarea {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      font-family: sans-serif;
      color: #111827;
      background: #f9fafb;
      outline: none;
      transition: border-color .15s;
      appearance: none; -webkit-appearance: none;
    }
    .wa-input:focus, .wa-select:focus, .wa-textarea:focus {
      border-color: #25D366;
      background: #fff;
    }
    .wa-input.invalid, .wa-select.invalid, .wa-textarea.invalid {
      border-color: #ef4444;
    }
    .wa-textarea { resize: none; height: 72px; line-height: 1.5; }
    .wa-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 14px; padding-right: 28px; }

    /* Bouton envoyer */
    .wa-submit {
      width: 100%;
      background: #25D366;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px;
      font-size: 13.5px;
      font-weight: 700;
      font-family: sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: background .15s, transform .1s;
    }
    .wa-submit:hover { background: #1ebe5a; }
    .wa-submit:active { transform: scale(.98); }
    .wa-submit svg { width: 16px; height: 16px; fill: #fff; }

    /* Note bas */
    .wa-note {
      text-align: center;
      font-size: 10.5px;
      color: #9ca3af;
      font-family: sans-serif;
      padding: 0 16px 12px;
      line-height: 1.4;
    }
  `],
  template: `
    <!-- Backdrop transparent pour fermer en cliquant ailleurs -->
    @if (ouvert()) {
      <div class="wa-backdrop" (click)="fermer()"></div>
    }

    <!-- Popup formulaire -->
    @if (ouvert()) {
      <div class="wa-popup" (click)="$event.stopPropagation()">

        <!-- En-tête -->
        <div class="wa-header">
          <div class="wa-header-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L0 24l6.306-1.504A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.827 9.827 0 01-5.017-1.374l-.36-.214-3.733.891.923-3.633-.235-.373A9.818 9.818 0 012.182 12C2.182 6.566 6.566 2.182 12 2.182S21.818 6.566 21.818 12 17.434 21.818 12 21.818z"/>
            </svg>
          </div>
          <div class="wa-header-text">
            <strong>Support Bailocam</strong>
            <span>Réponse rapide par WhatsApp</span>
          </div>
          <button class="wa-close" (click)="fermer()" aria-label="Fermer">
            <svg viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Formulaire -->
        <div class="wa-body">
          <!-- Nom -->
          <div class="wa-field">
            <label class="wa-label">Votre nom *</label>
            <input
              class="wa-input"
              [class.invalid]="soumis && !nom.trim()"
              type="text"
              placeholder="Ex : Franck Kamga"
              [(ngModel)]="nom"
              maxlength="60"
            />
          </div>

          <!-- Sujet -->
          <div class="wa-field">
            <label class="wa-label">Sujet *</label>
            <select
              class="wa-select"
              [class.invalid]="soumis && !sujet"
              [(ngModel)]="sujet"
            >
              <option value="">-- Choisir un sujet --</option>
              @for (s of sujets; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </div>

          <!-- Message -->
          <div class="wa-field">
            <label class="wa-label">Message *</label>
            <textarea
              class="wa-textarea"
              [class.invalid]="soumis && !message.trim()"
              placeholder="Décrivez votre demande..."
              [(ngModel)]="message"
              maxlength="500"
            ></textarea>
          </div>

          <!-- Bouton -->
          <button class="wa-submit" (click)="envoyer()">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L0 24l6.306-1.504A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.827 9.827 0 01-5.017-1.374l-.36-.214-3.733.891.923-3.633-.235-.373A9.818 9.818 0 012.182 12C2.182 6.566 6.566 2.182 12 2.182S21.818 6.566 21.818 12 17.434 21.818 12 21.818z"/>
            </svg>
            Envoyer sur WhatsApp
          </button>
        </div>

        <p class="wa-note">
          Votre message sera envoyé directement à notre équipe support.
        </p>
      </div>
    }

    <!-- Bouton FAB WhatsApp -->
    <button
      class="wa-fab"
      (click)="basculer()"
      aria-label="Contacter le support Bailocam via WhatsApp"
      [attr.aria-expanded]="ouvert()"
    >
      @if (!ouvert()) {
        <!-- Icône WhatsApp -->
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L0 24l6.306-1.504A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.827 9.827 0 01-5.017-1.374l-.36-.214-3.733.891.923-3.633-.235-.373A9.818 9.818 0 012.182 12C2.182 6.566 6.566 2.182 12 2.182S21.818 6.566 21.818 12 17.434 21.818 12 21.818z"/>
        </svg>
        <span class="wa-pulse"></span>
      } @else {
        <!-- Icône croix quand popup ouvert -->
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" style="width:22px;height:22px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      }
    </button>
  `,
})
export class WhatsappSupportComponent {
  readonly sujets = SUJETS;

  ouvert  = signal(false);
  soumis  = false;
  nom     = '';
  sujet   = '';
  message = '';

  basculer(): void {
    this.ouvert.update(v => !v);
    if (!this.ouvert()) this.reset();
  }

  fermer(): void {
    this.ouvert.set(false);
    this.reset();
  }

  envoyer(): void {
    this.soumis = true;
    if (!this.nom.trim() || !this.sujet || !this.message.trim()) return;

    const texte = this.formaterMessage();
    const url   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(texte)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    this.fermer();
  }

  private formaterMessage(): string {
    const date = new Intl.DateTimeFormat('fr-CM', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date());

    return [
      '🏠 *Support Bailocam*',
      '',
      '─────────────────────',
      `👤 *Nom :* ${this.nom.trim()}`,
      `📌 *Sujet :* ${this.sujet}`,
      '─────────────────────',
      '💬 *Message :*',
      this.message.trim(),
      '─────────────────────',
      `📅 ${date}`,
      '_Envoyé depuis bailocam.com_',
    ].join('\n');
  }

  private reset(): void {
    this.soumis  = false;
    this.nom     = '';
    this.sujet   = '';
    this.message = '';
  }
}
