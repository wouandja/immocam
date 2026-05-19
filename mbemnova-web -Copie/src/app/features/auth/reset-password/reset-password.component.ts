import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/auth/auth.selectors';

function matchPwd(c: AbstractControl) {
  const a = c.get('nouveauMotDePasse')?.value;
  const b = c.get('confirmationMotDePasse')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  styles: [`
    :host { display: block; }

    .form-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
      letter-spacing: -.02em;
    }
    .form-sub {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 28px;
    }

    .icon-wrap {
      width: 64px; height: 64px;
      background: #eff6ff;
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .icon-wrap svg { width: 30px; height: 30px; }

    .field { margin-bottom: 12px; }

    .input {
      width: 100%;
      height: 50px;
      padding: 0 16px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 15px;
      color: #111827;
      background: #fff;
      outline: none;
      transition: border-color .15s, box-shadow .15s;
      font-family: inherit;
      box-sizing: border-box;
    }
    .input::placeholder { color: #9ca3af; }
    .input:focus {
      border-color: #1e3a5f;
      box-shadow: 0 0 0 3px rgba(30,58,95,.08);
    }
    .input.is-error { border-color: #dc2626; }
    .input.is-valid { border-color: #059669; }

    .field-hint {
      font-size: 11.5px;
      color: #b91c1c;
      margin-top: 4px;
    }

    .pwd-wrap { position: relative; }
    .input-pwd { padding-right: 48px; }
    .btn-eye {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 4px;
      display: flex; align-items: center; color: #9ca3af; transition: color .15s;
    }
    .btn-eye:hover { color: #374151; }
    .btn-eye svg { width: 18px; height: 18px; }

    .strength-bars { display: flex; gap: 4px; margin-top: 8px; }
    .strength-bar {
      flex: 1; height: 3px; border-radius: 99px;
      background: #e5e7eb;
      transition: background .3s;
    }
    .strength-1 .strength-bar:nth-child(1) { background: #dc2626; }
    .strength-2 .strength-bar:nth-child(-n+2) { background: #f59e0b; }
    .strength-3 .strength-bar:nth-child(-n+3) { background: #10b981; }
    .strength-4 .strength-bar { background: #059669; }

    .error-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #b91c1c;
      margin-bottom: 14px;
      display: flex; align-items: flex-start; gap: 8px; line-height: 1.5;
    }
    .error-box svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }

    .btn-submit {
      width: 100%;
      height: 50px;
      background: #1e3a5f;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background .15s, transform .1s;
      font-family: inherit;
      letter-spacing: .01em;
    }
    .btn-submit:hover   { background: #162d4a; }
    .btn-submit:active  { transform: scale(.99); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    .back-link {
      display: block;
      text-align: center;
      font-size: 13px;
      color: #1e3a5f;
      text-decoration: none;
      font-weight: 600;
      margin-top: 16px;
      transition: opacity .15s;
    }
    .back-link:hover { opacity: .75; }
  `],
  template: `
    <div class="fade-in">

      <div class="icon-wrap">
        <svg fill="none" stroke="#1e3a5f" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
        </svg>
      </div>

      <p class="form-title" style="text-align: center;">Nouveau mot de passe</p>
      <p class="form-sub" style="text-align: center;">Choisissez un mot de passe sécurisé</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <div class="field">
          <div class="pwd-wrap">
            <input
              formControlName="nouveauMotDePasse"
              [type]="showPwd() ? 'text' : 'password'"
              placeholder="Nouveau mot de passe (min. 8 caractères)"
              class="input input-pwd"
              [class.is-error]="isTouched('nouveauMotDePasse') && form.get('nouveauMotDePasse')!.invalid"
              [class.is-valid]="isTouched('nouveauMotDePasse') && form.get('nouveauMotDePasse')!.valid"
              autocomplete="new-password"
              (input)="updateStrength()"/>
            <button type="button" class="btn-eye" (click)="showPwd.update(v => !v)"
                    [attr.aria-label]="showPwd() ? 'Masquer' : 'Afficher'">
              @if (showPwd()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              }
            </button>
          </div>
          <div class="strength-bars" [class]="'strength-' + pwdStrength()">
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
          </div>
          @if (isTouched('nouveauMotDePasse') && form.get('nouveauMotDePasse')!.invalid) {
            <p class="field-hint">Minimum 8 caractères</p>
          }
        </div>

        <div class="field">
          <div class="pwd-wrap">
            <input
              formControlName="confirmationMotDePasse"
              [type]="showPwd() ? 'text' : 'password'"
              placeholder="Confirmez le mot de passe"
              class="input input-pwd"
              [class.is-error]="(form.hasError('mismatch') || form.get('confirmationMotDePasse')!.invalid) && form.get('confirmationMotDePasse')!.touched"
              [class.is-valid]="!form.hasError('mismatch') && form.get('confirmationMotDePasse')!.valid && form.get('confirmationMotDePasse')!.touched"
              autocomplete="new-password"/>
            <button type="button" class="btn-eye" (click)="showPwd.update(v => !v)">
              @if (showPwd()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              }
            </button>
          </div>
          @if (form.hasError('mismatch') && form.get('confirmationMotDePasse')!.touched) {
            <p class="field-hint">Les mots de passe ne correspondent pas</p>
          }
        </div>

        @if (apiError()) {
          <div class="error-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
            </svg>
            <span>{{ apiError() }}</span>
          </div>
        }

        <button class="btn-submit" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Modification…' : 'Modifier le mot de passe' }}
        </button>

      </form>

      <a routerLink="/auth/login" class="back-link">← Retour à la connexion</a>

    </div>
  `,
})
export class ResetPasswordComponent {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly loading = this.store.selectSignal(selectAuthLoading);
  readonly apiError = this.store.selectSignal(selectAuthError);
  readonly showPwd = signal(false);
  readonly pwdStrength = signal(0);

  form = this.fb.group({
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(8)]],
    confirmationMotDePasse: ['', Validators.required],
  }, { validators: matchPwd });

  isTouched(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  updateStrength(): void {
    const v = this.form.get('nouveauMotDePasse')?.value ?? '';
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    this.pwdStrength.set(score);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    const { nouveauMotDePasse, confirmationMotDePasse } = this.form.getRawValue();
    this.store.dispatch(authActions.resetPassword({
      req: {
        token,
        nouveauMotDePasse: nouveauMotDePasse!,
        confirmationMotDePasse: confirmationMotDePasse!,
      }
    }));
  }
}