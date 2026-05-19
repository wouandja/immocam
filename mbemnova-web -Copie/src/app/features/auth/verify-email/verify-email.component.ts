import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/auth/auth.selectors';
import { OtpInputComponent } from '@shared/components/otp-input/otp-input.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, OtpInputComponent],
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
      margin-bottom: 4px;
    }
    .email-highlight {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 28px;
    }

    .icon-wrap {
      width: 64px; height: 64px;
      background: #eff6ff;
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .icon-wrap svg { width: 30px; height: 30px; color: #1e3a5f; }

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
      margin-bottom: 20px;
    }
    .btn-submit:hover   { background: #162d4a; }
    .btn-submit:active  { transform: scale(.99); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    .resend-section { text-align: center; }
    .resend-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .btn-resend {
      background: none; border: none; cursor: pointer;
      font-size: 14px; font-weight: 600; color: #1e3a5f;
      font-family: inherit; padding: 0;
      display: inline-flex; align-items: center; gap: 6px;
      transition: opacity .15s;
    }
    .btn-resend:hover    { opacity: .75; }
    .btn-resend:disabled { opacity: .4; cursor: not-allowed; }
    .btn-resend svg { width: 15px; height: 15px; }

    .countdown {
      font-size: 13px;
      color: #9ca3af;
    }
    .countdown strong { color: #374151; }

    .support-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 12px 14px;
      margin-top: 16px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    }
    .support-box a {
      color: #78350f;
      font-weight: 700;
      text-decoration: none;
    }
    .support-box a:hover { text-decoration: underline; }

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
  `],
  template: `
    <div class="fade-in" style="text-align: center;">
      <!-- Icône -->
      <div class="icon-wrap">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>

      <p class="form-title">Vérifiez votre e-mail</p>
      <p class="form-sub">Un code à 6 chiffres a été envoyé à</p>
      <p class="email-highlight">{{ email() }}</p>

      <!-- OTP -->
      <div style="margin-bottom: 20px;">
        <app-otp-input
          [length]="6"
          [error]="otpError()"
          (completed)="onCodeComplete($event)"
          (changed)="onCodeChanged($event)"
        />
      </div>

      @if (storeError()) {
        <div class="error-box" style="text-align: left;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
          </svg>
          <span>{{ storeError() }}</span>
        </div>
      }

      <button class="btn-submit"
        (click)="verify()"
        [disabled]="code.length < 6 || loading()">
        {{ loading() ? 'Vérification…' : 'Valider le code' }}
      </button>

      <!-- Renvoi -->
      <div class="resend-section">
        <p class="resend-label">Vous n'avez pas reçu le code ?</p>

        @if (canResend()) {
          <button class="btn-resend" (click)="resend()" [disabled]="resending()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ resending() ? 'Envoi en cours…' : 'Renvoyer le code' }}
          </button>
        } @else {
          <p class="countdown">
            Renvoyer dans <strong>{{ countdown() }}s</strong>
            &nbsp;·&nbsp;
            {{ 3 - resendCount() }} envoi{{ (3 - resendCount()) > 1 ? 's' : '' }} restant{{ (3 - resendCount()) > 1 ? 's' : '' }}
          </p>
        }
      </div>

      @if (resendCount() >= 3) {
        <div class="support-box">
          Limite d'envois atteinte.
          <a href="https://wa.me/237697847396" target="_blank">Contacter le support WhatsApp →</a>
        </div>
      }
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  readonly loading = this.store.selectSignal(selectAuthLoading);
  readonly storeError = this.store.selectSignal(selectAuthError);

  email = signal('');
  code = '';
  otpError = signal<string | undefined>(undefined);
  resending = signal(false);
  resendCount = signal(0);
  canResend = signal(false);
  countdown = signal(60);

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const queryEmail = this.route.snapshot.queryParamMap.get('email');
    this.email.set(queryEmail ?? '');
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  startCountdown(): void {
    this.canResend.set(false);
    this.countdown.set(60);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown.update(v => v - 1);
      if (this.countdown() <= 0) {
        clearInterval(this.timer);
        this.canResend.set(true);
      }
    }, 1000);
  }

  onCodeChanged(code: string): void {
    this.code = code;
    this.otpError.set(undefined);
  }

  onCodeComplete(code: string): void {
    this.code = code;
    this.verify();
  }

  verify(): void {
    if (this.code.length < 6) return;
    this.otpError.set(undefined);
    this.store.dispatch(authActions.verifyEmail({
      req: { email: this.email(), code: this.code }
    }));
  }

  resend(): void {
    if (this.resendCount() >= 3) return;
    this.resending.set(true);
    this.store.dispatch(authActions.resendCode({
      req: { email: this.email(), typeCode: 'EMAIL_VALIDATION' }
    }));
    this.resendCount.update(v => v + 1);
    this.startCountdown();
    this.resending.set(false);
  }
}