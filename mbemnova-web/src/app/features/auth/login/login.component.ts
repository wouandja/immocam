import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-login',
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

    /* Champs */
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

    .pwd-wrap { position: relative; }
    .input-pwd { padding-right: 48px; }
    .btn-eye {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 4px;
      display: flex; align-items: center;
      color: #9ca3af; transition: color .15s;
    }
    .btn-eye:hover { color: #374151; }
    .btn-eye svg { width: 18px; height: 18px; }

    /* Mot de passe oublié */
    .forgot {
      display: block;
      text-align: center;
      font-size: 13px;
      color: #1e3a5f;
      text-decoration: none;
      font-weight: 500;
      margin: 4px 0 20px;
      transition: opacity .15s;
    }
    .forgot:hover { opacity: .75; }

    /* Erreur */
    .error-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #b91c1c;
      margin-bottom: 14px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.5;
    }
    .error-box svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }

    /* Bouton connexion */
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
    .btn-submit:hover { background: #162d4a; }
    .btn-submit:active { transform: scale(.99); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    /* Séparateur */
    .sep {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
    }
    .sep-line { flex: 1; height: 1px; background: #f3f4f6; }
    .sep-text { font-size: 12px; color: #d1d5db; }

    /* Bouton créer compte */
    .btn-register {
      display: block;
      width: 100%;
      height: 50px;
      line-height: 50px;
      text-align: center;
      background: #fff;
      color: #1e3a5f;
      font-size: 14px;
      font-weight: 600;
      border: 1.5px solid #1e3a5f;
      border-radius: 10px;
      text-decoration: none;
      cursor: pointer;
      transition: background .15s;
      font-family: inherit;
      box-sizing: border-box;
    }
    .btn-register:hover { background: #f0f4f8; }
  `],
  template: `
    <div class="fade-in">

      <p class="form-title">Se connecter</p>
      <p class="form-sub">Accédez à votre espace Bailocam</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <div class="field">
          <input
            class="input"
            formControlName="email"
            type="email"
            placeholder="Adresse e-mail"
            autocomplete="email"
          />
        </div>

        <div class="field">
          <div class="pwd-wrap">
            <input
              class="input input-pwd"
              formControlName="motDePasse"
              [type]="showPwd() ? 'text' : 'password'"
              placeholder="Mot de passe"
              autocomplete="current-password"
            />
            <button type="button" class="btn-eye" (click)="showPwd.update(v => !v)"
                    [attr.aria-label]="showPwd() ? 'Masquer' : 'Afficher'">
              @if (showPwd()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                       a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
                       l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59
                       m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
                       a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                       -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              }
            </button>
          </div>
        </div>

        @if (error()) {
          <div class="error-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
            </svg>
            <span>{{ error() }}</span>
          </div>
        }

        <button class="btn-submit" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>

        <a routerLink="/auth/forgot-password" class="forgot">
          Mot de passe oublié ?
        </a>

        <div class="sep">
          <div class="sep-line"></div>
          <span class="sep-text">ou</span>
          <div class="sep-line"></div>
        </div>

        <a routerLink="/auth/register" class="btn-register" queryParamsHandling="preserve">
          Créer un compte
        </a>

      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly store = inject(Store);
  private readonly fb    = inject(FormBuilder);

  readonly loading = this.store.selectSignal(selectAuthLoading);
  readonly error   = this.store.selectSignal(selectAuthError);
  readonly showPwd = signal(false);

  form = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, motDePasse } = this.form.getRawValue();
    this.store.dispatch(authActions.login({ req: { email: email!, motDePasse: motDePasse! } }));
  }
}