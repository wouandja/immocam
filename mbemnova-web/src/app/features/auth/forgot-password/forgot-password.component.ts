import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading } from '@store/auth/auth.selectors';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, BackButtonComponent],
  template: `
    <div class="bg-white rounded-3xl shadow-2xl shadow-blue-950/20 p-7 fade-in">
      <app-back-button/>
      <div class="text-center mb-6">
        <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          🔑
        </div>
        <h1 class="text-xl font-bold text-slate-800">Mot de passe oublié ?</h1>
        <p class="text-slate-500 text-sm mt-1">
          Entrez votre email pour recevoir un lien de réinitialisation (valable 30 min).
        </p>
      </div>

      @if (!sent()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
            <input formControlName="email" type="email" placeholder="votre@email.cm"
              class="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
          </div>
          <button type="submit" [disabled]="form.invalid || loading()"
            class="w-full py-3.5 bg-blue-900 text-white font-bold rounded-2xl
                   hover:bg-blue-800 disabled:opacity-50 transition-all">
            {{ loading() ? 'Envoi...' : 'Envoyer le lien' }}
          </button>
          <p class="text-center">
            <a routerLink="/auth/login" class="text-sm text-blue-700 hover:text-blue-900 font-medium">
              ← Retour à la connexion
            </a>
          </p>
        </form>
      } @else {
        <div class="text-center space-y-4">
          <div class="text-4xl">📬</div>
          <p class="text-slate-700 font-medium">Email envoyé !</p>
          <p class="text-slate-500 text-sm">
            Vérifiez votre boîte mail (et les spams). Le lien est valable 30 minutes.
          </p>
          <a routerLink="/auth/login"
             class="inline-block px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl
                    hover:bg-blue-800 transition-all">
            Retour à la connexion
          </a>
        </div>
      }
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly store = inject(Store);
  private readonly fb    = inject(FormBuilder);

  readonly loading = this.store.selectSignal(selectAuthLoading);
  sent = signal(false);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.sent.set(true);
    this.store.dispatch(authActions.forgotPassword({
      req: { email: this.form.value.email! }
    }));
  }
}
