import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { UtilisateurApi } from '@core/services/api/utilisateur.api';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { UtilisateurProfil } from '@core/services/models';
 

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
  styles: [`
    :host { display: block; }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    .full { grid-column: 1 / -1; }

    .card {
      background: #fff;
      border: 1.5px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(30,58,95,.05);
    }
    .card-head {
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .card-title { font-size: 13px; font-weight: 700; color: #111827; letter-spacing: -.01em; }
    .card-body  { padding: 20px; }

    .profile-hero {
      display: flex; align-items: center; gap: 16px;
      padding: 20px; border-bottom: 1px solid #f3f4f6;
    }
    .avatar {
      width: 58px; height: 58px; border-radius: 50%;
      background: #f0f4f8; border: 1.5px solid #e5e7eb;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: #1e3a5f;
      flex-shrink: 0; letter-spacing: -.5px;
    }
    .profile-name  { font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -.01em; }
    .profile-email { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .badge-verified {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 9px; background: #ecfdf5; color: #059669;
      border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 5px;
    }
    .badge-verified svg { width: 11px; height: 11px; }

    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 20px; border-bottom: 1px solid #f3f4f6;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 11px; color: #9ca3af; font-weight: 600; letter-spacing: .03em; margin-bottom: 3px; }
    .info-value { font-size: 14px; font-weight: 600; color: #111827; }
    .info-value.muted { color: #9ca3af; font-weight: 400; }

    .stats-row {
      display: grid; grid-template-columns: repeat(2, 1fr);
      border-top: 1px solid #f3f4f6;
    }
    .stat-item {
      padding: 16px 12px; text-align: center;
      border-right: 1px solid #f3f4f6;
    }
    .stat-item:last-child { border-right: none; }
    .stat-val { font-size: 22px; font-weight: 700; color: #1e3a5f; line-height: 1; letter-spacing: -.02em; }
    .stat-lbl { font-size: 11px; color: #9ca3af; margin-top: 4px; font-weight: 500; }

    .btn-edit {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 14px;
      font-size: 12px; font-weight: 600; color: #1e3a5f;
      background: #f0f4f8; border: 1.5px solid #e5e7eb;
      border-radius: 9px; cursor: pointer; font-family: inherit;
      transition: background .15s, border-color .15s;
    }
    .btn-edit:hover { background: #e8eef5; border-color: #d1d5db; }
    .btn-edit svg { width: 13px; height: 13px; }

    .btn-main {
      width: 100%; height: 50px;
      background: #1e3a5f; color: #fff;
      border: none; border-radius: 10px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background .15s, transform .1s;
    }
    .btn-main:hover   { background: #162d4a; }
    .btn-main:active  { transform: scale(.99); }
    .btn-main:disabled { opacity: .45; cursor: not-allowed; }

    .btn-outline {
      width: 100%; height: 50px;
      background: #fff; color: #1e3a5f;
      border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background .15s;
    }
    .btn-outline:hover    { background: #f9fafb; }
    .btn-outline:disabled { opacity: .45; cursor: not-allowed; }

    .btn-danger {
      width: 100%; height: 50px;
      background: #fff; color: #b91c1c;
      border: 1.5px solid #fecaca; border-radius: 10px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background .15s, border-color .15s;
    }
    .btn-danger:hover { background: #fef2f2; border-color: #fca5a5; }

    .danger-card {
      background: #fff; border: 1.5px solid #fecaca;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(185,28,28,.04);
    }
    .danger-head {
      padding: 16px 20px; border-bottom: 1px solid #fef2f2;
      display: flex; align-items: center; gap: 10px;
    }
    .danger-head-icon {
      width: 32px; height: 32px; border-radius: 8px; background: #fef2f2;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .danger-head-icon svg { width: 15px; height: 15px; color: #dc2626; }
    .danger-title { font-size: 13px; font-weight: 700; color: #b91c1c; }
    .danger-sub   { font-size: 11px; color: #dc2626; margin-top: 1px; }
    .danger-body  { padding: 16px 20px; }

    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(17,24,39,.4); backdrop-filter: blur(2px);
      z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal {
      background: #fff; border: 1.5px solid #e5e7eb; border-radius: 20px;
      width: 100%; max-width: 440px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(30,58,95,.18);
    }
    .modal-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #f3f4f6;
    }
    .modal-title { font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -.01em; }
    .modal-close {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer;
      color: #6b7280; transition: background .15s;
    }
    .modal-close:hover { background: #f3f4f6; }
    .modal-close svg { width: 14px; height: 14px; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 14px; }
    .modal-foot {
      padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; gap: 10px;
    }
    .modal-foot .btn-main,
    .modal-foot .btn-outline { width: auto; flex: 1; }

    .field       { display: flex; flex-direction: column; gap: 6px; }
    .field-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field-label { font-size: 12px; font-weight: 600; color: #374151; }
    .input {
      width: 100%; height: 50px; padding: 0 16px;
      border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 15px; color: #111827; background: #fff;
      outline: none; font-family: inherit; box-sizing: border-box;
      transition: border-color .15s, box-shadow .15s;
    }
    .input::placeholder { color: #9ca3af; }
    .input:focus { border-color: #1e3a5f; box-shadow: 0 0 0 3px rgba(30,58,95,.08); }
    .input:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; border-color: #f3f4f6; }
    .input.is-pwd { padding-right: 48px; }

    .pwd-wrap { position: relative; }
    .btn-eye {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 4px;
      display: flex; align-items: center; color: #9ca3af; transition: color .15s;
    }
    .btn-eye:hover { color: #374151; }
    .btn-eye svg { width: 18px; height: 18px; }

    .strength-bars { display: flex; gap: 4px; margin-top: 6px; }
    .strength-bar  { flex: 1; height: 3px; border-radius: 99px; background: #e5e7eb; transition: background .3s; }
    .strength-1 .strength-bar:nth-child(1)    { background: #dc2626; }
    .strength-2 .strength-bar:nth-child(-n+2) { background: #f59e0b; }
    .strength-3 .strength-bar:nth-child(-n+3) { background: #10b981; }
    .strength-4 .strength-bar                 { background: #059669; }

    .field-hint {
      font-size: 11.5px; color: #6b7280; display: flex; align-items: center; gap: 5px;
    }
    .field-hint svg { width: 12px; height: 12px; flex-shrink: 0; }
    .field-error {
      font-size: 11.5px; color: #b91c1c; font-weight: 500;
      display: flex; align-items: center; gap: 5px;
    }
    .field-error svg { width: 12px; height: 12px; flex-shrink: 0; }

    .security-row {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 0; border-bottom: 1px solid #f3f4f6;
    }
    .security-row:last-child { border-bottom: none; }
    .security-ico {
      width: 36px; height: 36px; border-radius: 10px; background: #f0f4f8;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .security-ico svg { width: 17px; height: 17px; color: #1e3a5f; }
    .security-lbl { font-size: 13px; font-weight: 600; color: #111827; }
    .security-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }

    .skeleton { background: #f3f4f6; border-radius: 8px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
  `],
  template: `
    <app-confirm-dialog
      [open]="confirmDelete()"
      title="Supprimer votre compte ?"
      message="Cette action est irréversible. Toutes vos annonces seront désactivées et vos données anonymisées sous 30 jours."
      confirmLabel="Supprimer mon compte"
      [danger]="true"
      (confirmed)="deleteAccount()"
      (cancelled)="confirmDelete.set(false)"
    />

    <!-- Modal : modifier profil -->
    @if (modalProfile()) {
      <div class="modal-overlay" (click)="closeProfileModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <span class="modal-title">Modifier mes informations</span>
            <button class="modal-close" (click)="closeProfileModal()">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="modal-body">
              <div class="field-row">
                <div class="field">
                  <label class="field-label">Prénom *</label>
                  <input class="input" formControlName="prenom" type="text"
                         placeholder="Votre prénom" autocomplete="given-name"/>
                  @if (profileForm.get('prenom')!.touched && profileForm.get('prenom')!.invalid) {
                    <div class="field-error">
                      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                      </svg>
                      Minimum 2 caractères
                    </div>
                  }
                </div>
                <div class="field">
                  <label class="field-label">Nom *</label>
                  <input class="input" formControlName="nom" type="text"
                         placeholder="Votre nom" autocomplete="family-name"/>
                </div>
              </div>
              <div class="field">
                <label class="field-label">Téléphone *</label>
                <div style="display:flex;gap:8px">
                  <div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;height:50px;
                              display:flex;align-items:center;padding:0 12px;font-size:14px;font-weight:700;
                              color:#374151;white-space:nowrap;flex-shrink:0">
                    🇨🇲 +237
                  </div>
                  <input class="input" style="flex:1" formControlName="telephone"
                         type="tel" placeholder="6XX XX XX XX" autocomplete="tel"/>
                </div>
                <div class="field-hint">
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path stroke-linecap="round" d="M12 16v-4m0-4h.01"/>
                  </svg>
                  Format : 6XX XX XX XX
                </div>
              </div>
              <div class="field">
                <label class="field-label">E-mail (non modifiable)</label>
                <input class="input" [value]="profil()?.email ?? ''" type="email" disabled/>
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn-outline" (click)="closeProfileModal()">Annuler</button>
              <button type="submit" class="btn-main" [disabled]="profileForm.invalid || saving()">
                {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal : changer mot de passe -->
    @if (modalPwd()) {
      <div class="modal-overlay" (click)="closePwdModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <span class="modal-title">Changer le mot de passe</span>
            <button class="modal-close" (click)="closePwdModal()">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form [formGroup]="pwdForm" (ngSubmit)="changePwd()">
            <div class="modal-body">
              <div class="field">
                <label class="field-label">Mot de passe actuel *</label>
                <div class="pwd-wrap">
                  <input class="input is-pwd" formControlName="ancienMotDePasse"
                         [type]="showOld() ? 'text' : 'password'"
                         placeholder="••••••••" autocomplete="current-password"/>
                  <button type="button" class="btn-eye" (click)="showOld.update(v => !v)">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      @if (showOld()) {
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                             a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
                             l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59
                             m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
                             a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
              </div>
              <div class="field">
                <label class="field-label">Nouveau mot de passe *</label>
                <div class="pwd-wrap">
                  <input class="input is-pwd" formControlName="nouveauMotDePasse"
                         [type]="showNew() ? 'text' : 'password'"
                         placeholder="Minimum 8 caractères" autocomplete="new-password"
                         (input)="updateStrength()"/>
                  <button type="button" class="btn-eye" (click)="showNew.update(v => !v)">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      @if (showNew()) {
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                             a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
                             l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59
                             m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
                             a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
                <div class="strength-bars" [class]="'strength-' + pwdStrength()">
                  <div class="strength-bar"></div><div class="strength-bar"></div>
                  <div class="strength-bar"></div><div class="strength-bar"></div>
                </div>
              </div>
              <div class="field">
                <label class="field-label">Confirmer le nouveau mot de passe *</label>
                <div class="pwd-wrap">
                  <input class="input is-pwd" formControlName="confirmationMotDePasse"
                         [type]="showNew() ? 'text' : 'password'"
                         placeholder="••••••••" autocomplete="new-password"/>
                  <button type="button" class="btn-eye" (click)="showNew.update(v => !v)">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      @if (showNew()) {
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                             a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
                             l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59
                             m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
                             a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
                @if (pwdForm.get('confirmationMotDePasse')!.touched
                  && pwdForm.value.nouveauMotDePasse !== pwdForm.value.confirmationMotDePasse) {
                  <div class="field-error">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                    </svg>
                    Les mots de passe ne correspondent pas
                  </div>
                }
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn-outline" (click)="closePwdModal()">Annuler</button>
              <button type="submit" class="btn-main"
                      [disabled]="pwdForm.invalid || changingPwd()
                        || pwdForm.value.nouveauMotDePasse !== pwdForm.value.confirmationMotDePasse">
                {{ changingPwd() ? 'Modification…' : 'Modifier' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Contenu -->
    @if (loading()) {
      <div class="grid">
        <div class="card full" style="height:280px">
          <div style="padding:20px;display:flex;gap:16px;align-items:center;border-bottom:1px solid #f3f4f6">
            <div class="skeleton" style="width:58px;height:58px;border-radius:50%"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px">
              <div class="skeleton" style="height:16px;width:160px"></div>
              <div class="skeleton" style="height:13px;width:200px"></div>
            </div>
          </div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:14px">
            <div class="skeleton" style="height:14px;width:80%"></div>
            <div class="skeleton" style="height:14px;width:60%"></div>
            <div class="skeleton" style="height:14px;width:70%"></div>
          </div>
        </div>
      </div>
    } @else {
      <div class="grid">

        <!-- Carte profil -->
        <div class="card full">
          <div class="profile-hero">
            <div class="avatar">{{ initials() }}</div>
            <div style="flex:1;min-width:0">
              <div class="profile-name">{{ profil()?.prenom }} {{ profil()?.nom }}</div>
              <div class="profile-email">{{ profil()?.email }}</div>
              <div class="badge-verified">
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Compte actif
              </div>
            </div>
            <button class="btn-edit" (click)="openProfileModal()">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Modifier
            </button>
          </div>

          <div class="info-row">
            <div>
              <div class="info-label">TÉLÉPHONE</div>
              <div class="info-value" [class.muted]="!profil()?.telephoneMasque">
                {{ profil()?.telephoneMasque ?? 'Non renseigné' }}
              </div>
            </div>
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                 style="width:16px;height:16px;color:#d1d5db;flex-shrink:0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372
                   c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293
                   c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21
                   l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5
                   A2.25 2.25 0 002.25 4.5v2.25z"/>
            </svg>
          </div>

          <div class="info-row">
            <div>
              <div class="info-label">VILLE</div>
              <div class="info-value" [class.muted]="!profil()?.ville">
                {{ profil()?.ville ?? 'Non renseignée' }}
              </div>
            </div>
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                 style="width:16px;height:16px;color:#d1d5db;flex-shrink:0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
          </div>

          <div class="info-row">
            <div>
              <div class="info-label">MEMBRE DEPUIS</div>
              <div class="info-value" [class.muted]="!profil()?.dateInscription">
                {{ formatDate(profil()?.dateInscription) }}
              </div>
            </div>
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                 style="width:16px;height:16px;color:#d1d5db;flex-shrink:0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5
                   A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75
                   m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
            </svg>
          </div>

          <div class="info-row">
            <div>
              <div class="info-label">RÔLE</div>
              <div class="info-value">
                {{ profil()?.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Propriétaire' }}
              </div>
            </div>
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                 style="width:16px;height:16px;color:#d1d5db;flex-shrink:0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975
                   m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21
                   a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-val">{{ profil()?.nombreAnnoncesActives ?? 0 }}</div>
              <div class="stat-lbl">Annonces actives</div>
            </div>
            <div class="stat-item">
              <div class="stat-val">{{ profil()?.statut === 'ACTIF' ? '✓' : '—' }}</div>
              <div class="stat-lbl">Compte actif</div>
            </div>
          </div>
        </div>

        <!-- Sécurité -->
        <div class="card">
          <div class="card-head">
            <span class="card-title">Sécurité</span>
          </div>
          <div class="card-body">
            <div class="security-row">
              <div class="security-ico">
                <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25
                       v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75
                       a2.25 2.25 0 002.25 2.25z"/>
                </svg>
              </div>
              <div style="flex:1">
                <div class="security-lbl">Mot de passe</div>
                <div class="security-sub">
                  Dernière modif. : {{ formatDate(profil()?.dernierLogin) }}
                </div>
              </div>
            </div>
            <div class="security-row" style="margin-bottom:16px">
              <div class="security-ico">
                <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6
                       9 9 0 003 9.749c0 5.592 3.824 10.29 9 11.623
                       5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751
                       h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
              </div>
              <div style="flex:1">
                <div class="security-lbl">Authentification</div>
                <div class="security-sub">Email {{ profil()?.email }}</div>
              </div>
            </div>
            <button class="btn-outline" (click)="openPwdModal()">
              Changer le mot de passe
            </button>
          </div>
        </div>

        <!-- Zone dangereuse -->
        <div class="danger-card">
          <div class="danger-head">
            <div class="danger-head-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71
                     c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0
                     L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <div>
              <div class="danger-title">Zone dangereuse</div>
              <div class="danger-sub">Actions irréversibles sur votre compte</div>
            </div>
          </div>
          <div class="danger-body">
            <p style="font-size:13px;color:#6b7280;margin-bottom:16px;line-height:1.6">
              La suppression entraîne la désactivation de toutes vos annonces.
              Vos données seront anonymisées sous 30 jours conformément à notre politique de confidentialité.
            </p>
            <button class="btn-danger" (click)="confirmDelete.set(true)">
              Supprimer mon compte
            </button>
          </div>
        </div>

      </div>
    }
  `,
})
export class ProfilComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly api   = inject(UtilisateurApi);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  readonly profil  = signal<UtilisateurProfil | null>(null);
  readonly loading = signal(true);

  saving        = signal(false);
  changingPwd   = signal(false);
  confirmDelete = signal(false);
  modalProfile  = signal(false);
  modalPwd      = signal(false);
  showOld       = signal(false);
  showNew       = signal(false);
  pwdStrength   = signal(0);

  profileForm = this.fb.group({
    prenom:    ['', [Validators.required, Validators.minLength(2)]],
    nom:       ['', [Validators.required, Validators.minLength(2)]],
    telephone: ['', Validators.required],
  });

  pwdForm = this.fb.group({
    ancienMotDePasse:       ['', Validators.required],
    nouveauMotDePasse:      ['', [Validators.required, Validators.minLength(8)]],
    confirmationMotDePasse: ['', Validators.required],
  });

  ngOnInit(): void {
    this.api.getMonProfil().subscribe({
      next: res => { this.profil.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  initials(): string {
    const p = this.profil();
    if (!p) return '?';
    return ((p.prenom?.[0] ?? '') + (p.nom?.[0] ?? '')).toUpperCase() || '?';
  }

  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  updateStrength(): void {
    const v = this.pwdForm.get('nouveauMotDePasse')?.value ?? '';
    let s = 0;
    if (v.length >= 8)          s++;
    if (/[A-Z]/.test(v))        s++;
    if (/[0-9]/.test(v))        s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    this.pwdStrength.set(s);
  }

  openProfileModal(): void {
    const p = this.profil();
    if (p) {
      this.profileForm.patchValue({
        prenom:    p.prenom ?? '',
        nom:       p.nom    ?? '',
        telephone: '',   // telephoneMasque est masqué → laisser vide pour re-saisie
      });
    }
    this.modalProfile.set(true);
  }
  closeProfileModal(): void { this.modalProfile.set(false); }

  openPwdModal(): void  { this.modalPwd.set(true); }
  closePwdModal(): void { this.modalPwd.set(false); this.pwdForm.reset(); this.pwdStrength.set(0); }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.profileForm.getRawValue();
    this.api.modifierProfil({
      prenom:    v.prenom!,
      nom:       v.nom!,
      telephone: '+237' + (v.telephone ?? '').replace(/\D/g, ''),
    }).subscribe({
      next: res => {
        this.saving.set(false);
        this.profil.set(res.data);
        this.store.dispatch(authActions.updateUser({ user: res.data as any }));
        this.toast.success('Profil mis à jour');
        this.closeProfileModal();
      },
      error: () => this.saving.set(false),
    });
  }

  changePwd(): void {
    if (this.pwdForm.invalid) { this.pwdForm.markAllAsTouched(); return; }
    const v = this.pwdForm.getRawValue();
    if (v.nouveauMotDePasse !== v.confirmationMotDePasse) return;
    this.changingPwd.set(true);
    this.api.modifierMotDePasse(v as any).subscribe({
      next: () => {
        this.changingPwd.set(false);
        this.toast.success('Mot de passe modifié avec succès');
        this.closePwdModal();
      },
      error: () => this.changingPwd.set(false),
    });
  }

  deleteAccount(): void {
    this.api.supprimerCompte().subscribe({
      next: () => {
        this.toast.info('Compte supprimé. À bientôt !');
        this.store.dispatch(authActions.logout());
      },
    });
  }
}