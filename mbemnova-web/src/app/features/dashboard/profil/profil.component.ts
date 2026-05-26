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

    /* ── Layout ── */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    .full { grid-column: 1 / -1; }

    /* ── Cards ── */
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
    }
    .card-head {
      padding: 14px 18px;
      border-bottom: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .card-title { font-size: 13px; font-weight: 600; color: #111827; }
    .card-body  { padding: 18px; }

    /* ── Profile Hero ── */
    .profile-hero {
      display: flex; align-items: center; gap: 16px;
      padding: 18px; border-bottom: 1px solid #f3f4f6;
    }
    .avatar {
      width: 54px; height: 54px; border-radius: 50%;
      background: #eff6ff; border: 1px solid #bfdbfe;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 600; color: #1d4ed8;
      flex-shrink: 0;
    }
    .profile-name  { font-size: 15px; font-weight: 600; color: #111827; }
    .profile-email { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .badge-active {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 9px; background: #f0fdf4; color: #15803d;
      border: 1px solid #bbf7d0; border-radius: 20px;
      font-size: 11px; font-weight: 500; margin-top: 5px;
    }

    /* ── Info Rows ── */
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 18px; border-bottom: 1px solid #f3f4f6;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label {
      font-size: 11px; color: #9ca3af; font-weight: 500;
      letter-spacing: .04em; text-transform: uppercase; margin-bottom: 3px;
    }
    .info-value       { font-size: 14px; font-weight: 500; color: #111827; }
    .info-value.muted { color: #9ca3af; font-weight: 400; font-style: italic; }
    .info-icon        { color: #d1d5db; flex-shrink: 0; }

    /* ── Stats ── */
    .stats-row {
      display: grid; grid-template-columns: 1fr 1fr;
      border-top: 1px solid #f3f4f6;
    }
    .stat-item {
      padding: 16px 12px; text-align: center;
      border-right: 1px solid #f3f4f6;
    }
    .stat-item:last-child { border-right: none; }
    .stat-val { font-size: 24px; font-weight: 600; color: #1d4ed8; line-height: 1; }
    .stat-lbl { font-size: 11px; color: #9ca3af; margin-top: 4px; font-weight: 500; }

    /* ── Buttons ── */
    .btn-edit {
      display: inline-flex; align-items: center; gap: 5px;
      height: 34px; padding: 0 13px;
      font-size: 12px; font-weight: 500; color: #374151;
      background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 8px; cursor: pointer; font-family: inherit;
      transition: background .15s, border-color .15s; white-space: nowrap;
    }
    .btn-edit:hover { background: #f3f4f6; border-color: #d1d5db; }

    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 44px; padding: 0 20px;
      font-size: 14px; font-weight: 500; color: #ffffff;
      background: #1d4ed8; border: none;
      border-radius: 10px; cursor: pointer; font-family: inherit;
      transition: background .15s, transform .1s; flex: 1;
    }
    .btn-primary:hover   { background: #1e40af; }
    .btn-primary:active  { transform: scale(.99); }
    .btn-primary:disabled { opacity: .45; cursor: not-allowed; }

    .btn-secondary {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 44px; padding: 0 20px;
      font-size: 14px; font-weight: 500; color: #374151;
      background: #ffffff; border: 1px solid #e5e7eb;
      border-radius: 10px; cursor: pointer; font-family: inherit;
      transition: background .15s; flex: 1;
    }
    .btn-secondary:hover    { background: #f9fafb; }
    .btn-secondary:disabled { opacity: .45; cursor: not-allowed; }

    .btn-block { width: 100%; justify-content: center; flex: unset; }

    .btn-danger-outline {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; height: 44px; padding: 0 20px;
      font-size: 14px; font-weight: 500; color: #b91c1c;
      background: #ffffff; border: 1px solid #fecaca;
      border-radius: 10px; cursor: pointer; font-family: inherit;
      transition: background .15s, border-color .15s;
    }
    .btn-danger-outline:hover { background: #fef2f2; border-color: #fca5a5; }

    /* ── Danger Card ── */
    .danger-card {
      background: #ffffff; border: 1px solid #fecaca;
      border-radius: 16px; overflow: hidden;
    }
    .danger-head {
      padding: 14px 18px; border-bottom: 1px solid #fee2e2;
      display: flex; align-items: center; gap: 10px;
      background: #fff5f5;
    }
    .danger-head-icon {
      width: 30px; height: 30px; border-radius: 8px; background: #fee2e2;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      color: #dc2626;
    }
    .danger-title { font-size: 13px; font-weight: 600; color: #b91c1c; }
    .danger-sub   { font-size: 11px; color: #dc2626; margin-top: 1px; opacity: .8; }
    .danger-body  { padding: 16px 18px; }
    .danger-desc  { font-size: 13px; color: #6b7280; margin-bottom: 14px; line-height: 1.6; }

    /* ── Modal Overlay ── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(17, 24, 39, .5);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal {
      background: #ffffff; border: 1px solid #e5e7eb; border-radius: 20px;
      width: 100%; max-width: 440px; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0, 0, 0, .18);
    }
    .modal-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid #f3f4f6;
    }
    .modal-title { font-size: 15px; font-weight: 600; color: #111827; }
    .modal-close {
      width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid #e5e7eb; background: #f9fafb; cursor: pointer;
      color: #6b7280; transition: background .15s; padding: 0;
    }
    .modal-close:hover { background: #f3f4f6; }
    .modal-body { padding: 22px; display: flex; flex-direction: column; gap: 14px; }
    .modal-foot {
      padding: 14px 22px; border-top: 1px solid #f3f4f6;
      display: flex; gap: 10px;
    }

    /* ── Form Fields ── */
    .field       { display: flex; flex-direction: column; gap: 5px; }
    .field-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field-label { font-size: 12px; font-weight: 500; color: #374151; }

    .input {
      width: 100%; height: 44px; padding: 0 14px;
      border: 1px solid #e5e7eb; border-radius: 10px;
      font-size: 14px; color: #111827; background: #ffffff;
      outline: none; font-family: inherit; box-sizing: border-box;
      transition: border-color .15s, box-shadow .15s;
    }
    .input::placeholder { color: #9ca3af; }
    .input:focus        { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,.1); }
    .input:disabled     { background: #f9fafb; color: #9ca3af; cursor: not-allowed; border-color: #f3f4f6; }
    .input.is-pwd       { padding-right: 46px; }

    .phone-prefix {
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
      height: 44px; display: flex; align-items: center; padding: 0 12px;
      font-size: 13px; font-weight: 600; color: #374151;
      white-space: nowrap; flex-shrink: 0;
    }

    .pwd-wrap { position: relative; }
    .btn-eye {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 4px;
      display: flex; align-items: center; color: #9ca3af; transition: color .15s;
    }
    .btn-eye:hover { color: #374151; }

    /* ── Password Strength ── */
    .strength-bars { display: flex; gap: 4px; margin-top: 5px; }
    .strength-bar  {
      flex: 1; height: 3px; border-radius: 99px;
      background: #e5e7eb; transition: background .3s;
    }
    .strength-1 .strength-bar:nth-child(1)    { background: #ef4444; }
    .strength-2 .strength-bar:nth-child(-n+2) { background: #f59e0b; }
    .strength-3 .strength-bar:nth-child(-n+3) { background: #22c55e; }
    .strength-4 .strength-bar                 { background: #16a34a; }

    .field-hint {
      font-size: 11px; color: #9ca3af;
      display: flex; align-items: center; gap: 4px;
    }
    .field-error {
      font-size: 11px; color: #b91c1c; font-weight: 500;
      display: flex; align-items: center; gap: 4px;
    }

    /* ── Security Rows ── */
    .security-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid #f3f4f6;
    }
    .security-row:last-of-type { border-bottom: none; padding-bottom: 0; }
    .security-ico {
      width: 36px; height: 36px; border-radius: 10px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      color: #1d4ed8;
    }
    .security-lbl { font-size: 13px; font-weight: 500; color: #111827; }
    .security-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }

    /* ── Skeleton ── */
    .skeleton { background: #f3f4f6; border-radius: 8px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
  `],
  template: `
    <!-- Confirm delete dialog -->
    <app-confirm-dialog
      [open]="confirmDelete()"
      title="Supprimer votre compte ?"
      message="Cette action est irréversible. Toutes vos annonces seront désactivées et vos données anonymisées sous 30 jours."
      confirmLabel="Supprimer définitivement"
      [danger]="true"
      (confirmed)="deleteAccount()"
      (cancelled)="confirmDelete.set(false)"
    />

    <!-- ══ Modal : modifier profil ══ -->
    @if (modalProfile()) {
      <div class="modal-overlay" (click)="closeProfileModal()">
        <div class="modal" (click)="$event.stopPropagation()">

          <div class="modal-head">
            <span class="modal-title">Modifier mes informations</span>
            <button class="modal-close" type="button" (click)="closeProfileModal()">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
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
                      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
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
                  @if (profileForm.get('nom')!.touched && profileForm.get('nom')!.invalid) {
                    <div class="field-error">
                      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                      </svg>
                      Minimum 2 caractères
                    </div>
                  }
                </div>
              </div>

              <div class="field">
                <label class="field-label">Téléphone *</label>
                <div style="display:flex; gap:8px">
                  <div class="phone-prefix">🇨🇲 +237</div>
                  <input class="input" style="flex:1" formControlName="telephone"
                         type="tel" placeholder="6XX XX XX XX" autocomplete="tel"/>
                </div>
                @if (profileForm.get('telephone')!.touched && profileForm.get('telephone')!.invalid) {
                  <div class="field-error">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                    </svg>
                    Numéro requis
                  </div>
                } @else {
                  <div class="field-hint">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path stroke-linecap="round" d="M12 16v-4m0-4h.01"/>
                    </svg>
                    Format : 6XX XX XX XX
                  </div>
                }
              </div>

              <div class="field">
                <label class="field-label">E-mail (non modifiable)</label>
                <input class="input" [value]="profil()?.email ?? ''" type="email" disabled/>
              </div>

            </div>
            <div class="modal-foot">
              <button type="button" class="btn-secondary" (click)="closeProfileModal()">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || saving()">
                {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>

        </div>
      </div>
    }

    <!-- ══ Modal : changer mot de passe ══ -->
    @if (modalPwd()) {
      <div class="modal-overlay" (click)="closePwdModal()">
        <div class="modal" (click)="$event.stopPropagation()">

          <div class="modal-head">
            <span class="modal-title">Changer le mot de passe</span>
            <button class="modal-close" type="button" (click)="closePwdModal()">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="pwdForm" (ngSubmit)="changePwd()">
            <div class="modal-body">

              <!-- Ancien mot de passe -->
              <div class="field">
                <label class="field-label">Mot de passe actuel *</label>
                <div class="pwd-wrap">
                  <input class="input is-pwd" formControlName="ancienMotDePasse"
                         [type]="showOld() ? 'text' : 'password'"
                         placeholder="••••••••" autocomplete="current-password"/>
                  <button type="button" class="btn-eye" (click)="showOld.update(v => !v)">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      @if (showOld()) {
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5
                             c4.478 0 8.268 2.943 9.542 7a9.987 9.987 0 01-1.563 3.029m-5.867.908
                             A9.956 9.956 0 0112 19c-4.478 0-8.268-2.943-9.542-7
                             a9.987 9.987 0 012.94-4.568"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
                @if (pwdForm.get('ancienMotDePasse')!.touched && pwdForm.get('ancienMotDePasse')!.invalid) {
                  <div class="field-error">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                    </svg>
                    Champ requis
                  </div>
                }
              </div>

              <!-- Nouveau mot de passe -->
              <div class="field">
                <label class="field-label">Nouveau mot de passe *</label>
                <div class="pwd-wrap">
                  <input class="input is-pwd" formControlName="nouveauMotDePasse"
                         [type]="showNew() ? 'text' : 'password'"
                         placeholder="Minimum 8 caractères" autocomplete="new-password"
                         (input)="updateStrength()"/>
                  <button type="button" class="btn-eye" (click)="showNew.update(v => !v)">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      @if (showNew()) {
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5
                             c4.478 0 8.268 2.943 9.542 7a9.987 9.987 0 01-1.563 3.029m-5.867.908
                             A9.956 9.956 0 0112 19c-4.478 0-8.268-2.943-9.542-7
                             a9.987 9.987 0 012.94-4.568"/>
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
                  <div class="strength-bar"></div>
                  <div class="strength-bar"></div>
                  <div class="strength-bar"></div>
                  <div class="strength-bar"></div>
                </div>
                @if (pwdForm.get('nouveauMotDePasse')!.touched && pwdForm.get('nouveauMotDePasse')!.invalid) {
                  <div class="field-error">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                    </svg>
                    Minimum 8 caractères
                  </div>
                }
              </div>

              <!-- Confirmation -->
              <div class="field">
                <label class="field-label">Confirmer le nouveau mot de passe *</label>
                <div class="pwd-wrap">
                  <input class="input is-pwd" formControlName="confirmationMotDePasse"
                         [type]="showNew() ? 'text' : 'password'"
                         placeholder="••••••••" autocomplete="new-password"/>
                  <button type="button" class="btn-eye" (click)="showNew.update(v => !v)">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      @if (showNew()) {
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5
                             c4.478 0 8.268 2.943 9.542 7a9.987 9.987 0 01-1.563 3.029m-5.867.908
                             A9.956 9.956 0 0112 19c-4.478 0-8.268-2.943-9.542-7
                             a9.987 9.987 0 012.94-4.568"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
                @if (
                  pwdForm.get('confirmationMotDePasse')!.touched &&
                  pwdForm.value.nouveauMotDePasse !== pwdForm.value.confirmationMotDePasse
                ) {
                  <div class="field-error">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                    </svg>
                    Les mots de passe ne correspondent pas
                  </div>
                }
              </div>

            </div>
            <div class="modal-foot">
              <button type="button" class="btn-secondary" (click)="closePwdModal()">Annuler</button>
              <button type="submit" class="btn-primary"
                      [disabled]="pwdForm.invalid || changingPwd()
                        || pwdForm.value.nouveauMotDePasse !== pwdForm.value.confirmationMotDePasse">
                {{ changingPwd() ? 'Modification…' : 'Modifier' }}
              </button>
            </div>
          </form>

        </div>
      </div>
    }

    <!-- ══ Contenu principal ══ -->
    @if (loading()) {
      <div class="grid">
        <div class="card full" style="height: 280px">
          <div style="padding:18px; display:flex; gap:16px; align-items:center; border-bottom:1px solid #f3f4f6">
            <div class="skeleton" style="width:54px; height:54px; border-radius:50%"></div>
            <div style="flex:1; display:flex; flex-direction:column; gap:8px">
              <div class="skeleton" style="height:15px; width:160px"></div>
              <div class="skeleton" style="height:12px; width:210px"></div>
            </div>
          </div>
          <div style="padding:18px; display:flex; flex-direction:column; gap:14px">
            <div class="skeleton" style="height:13px; width:80%"></div>
            <div class="skeleton" style="height:13px; width:60%"></div>
            <div class="skeleton" style="height:13px; width:70%"></div>
          </div>
        </div>
      </div>
    } @else {
      <div class="grid">

        <!-- ─ Carte profil ─ -->
        <div class="card full">
          <div class="profile-hero">
            <div class="avatar">{{ initials() }}</div>
            <div style="flex:1; min-width:0">
              <div class="profile-name">{{ profil()?.prenom }} {{ profil()?.nom }}</div>
              <div class="profile-email">{{ profil()?.email }}</div>
              <div class="badge-active">
                <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Compte actif
              </div>
            </div>
            <button class="btn-edit" type="button" (click)="openProfileModal()">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Modifier
            </button>
          </div>

          <div class="info-row">
            <div>
              <div class="info-label">Téléphone</div>
              <div class="info-value" [class.muted]="!profil()?.telephoneMasque">
                {{ profil()?.telephoneMasque ?? 'Non renseigné' }}
              </div>
            </div>
            <svg class="info-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
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
              <div class="info-label">Ville</div>
              <div class="info-value" [class.muted]="!profil()?.ville">
                {{ profil()?.ville ?? 'Non renseignée' }}
              </div>
            </div>
            <svg class="info-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
          </div>

          <div class="info-row">
            <div>
              <div class="info-label">Membre depuis</div>
              <div class="info-value" [class.muted]="!profil()?.dateInscription">
                {{ formatDate(profil()?.dateInscription) }}
              </div>
            </div>
            <svg class="info-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5
                   A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75
                   m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
            </svg>
          </div>

          <div class="info-row">
            <div>
              <div class="info-label">Rôle</div>
              <div class="info-value">
                {{ profil()?.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Propriétaire' }}
              </div>
            </div>
            <svg class="info-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
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
              <div class="stat-lbl">Statut compte</div>
            </div>
          </div>
        </div>

        <!-- ─ Sécurité ─ -->
        <div class="card">
          <div class="card-head">
            <span class="card-title">Sécurité</span>
          </div>
          <div class="card-body">
            <div class="security-row">
              <div class="security-ico">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25
                       v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75
                       a2.25 2.25 0 002.25 2.25z"/>
                </svg>
              </div>
              <div style="flex:1">
                <div class="security-lbl">Mot de passe</div>
                <div class="security-sub">Dernière modif. : {{ formatDate(profil()?.dernierLogin) }}</div>
              </div>
            </div>
            <div class="security-row">
              <div class="security-ico">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6
                       9 9 0 003 9.749c0 5.592 3.824 10.29 9 11.623
                       5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751
                       h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
              </div>
              <div style="flex:1">
                <div class="security-lbl">Authentification</div>
                <div class="security-sub">Email — {{ profil()?.email }}</div>
              </div>
            </div>
            <div style="margin-top: 16px">
              <button class="btn-secondary btn-block" type="button" (click)="openPwdModal()">
                Changer le mot de passe
              </button>
            </div>
          </div>
        </div>

        <!-- ─ Zone dangereuse ─ -->
        <div class="danger-card">
          <div class="danger-head">
            <div class="danger-head-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
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
            <p class="danger-desc">
              La suppression entraîne la désactivation de toutes vos annonces.
              Vos données seront anonymisées sous 30 jours conformément à notre politique de confidentialité.
            </p>
            <button class="btn-danger-outline" type="button" (click)="confirmDelete.set(true)">
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
  // Ajouter ce signal avec les autres
readonly telephoneReel = signal<string>('');

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
    next: res => {
      this.profil.set(res.data);
      this.loading.set(false);
    },
    error: () => this.loading.set(false),
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
      // ✅ Numéro brut du backend, on retire juste le +237
      telephone: (p.telephone ?? '').replace(/^\+237/, ''),
    });
  }
  this.profileForm.markAsUntouched();
  this.modalProfile.set(true);
}
  closeProfileModal(): void { this.modalProfile.set(false); }

  openPwdModal(): void  { this.modalPwd.set(true); }
  closePwdModal(): void {
    this.modalPwd.set(false);
    this.pwdForm.reset();
    this.pwdForm.markAsUntouched();
    this.pwdStrength.set(0);
    this.showOld.set(false);
    this.showNew.set(false);
  }

saveProfile(): void {
  if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
  this.saving.set(true);
  const v = this.profileForm.getRawValue();
  const telSaisi = (v.telephone ?? '').replace(/\D/g, '');

  this.api.modifierProfil({
    prenom:    v.prenom!,
    nom:       v.nom!,
    // ✅ Envoyer seulement si saisi, sinon backend garde l'ancien
    ...(telSaisi ? { telephone: '+237' + telSaisi } : {}),
  }).subscribe({
    next: res => {
      this.saving.set(false);
      this.profil.set(res.data);  // ← profil.telephone() mis à jour automatiquement
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