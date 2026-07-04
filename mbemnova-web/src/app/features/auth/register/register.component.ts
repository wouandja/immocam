import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/auth/auth.selectors';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';

/** Clé localStorage pour la sauvegarde du brouillon */
const DRAFT_KEY = 'immocam_register_draft';

function passwordMatch(ctrl: AbstractControl) {
  const p = ctrl.get('motDePasse')?.value;
  const c = ctrl.get('confirmationMotDePasse')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

type StepId = 'identity' | 'contact' | 'password' | 'confirm';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PhoneInputComponent],
  styles: [`
    :host { display: block; }

    /* ── Progress ── */
    .progress-bar {
      height: 4px;
      background: #f3f4f6;
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .progress-fill {
      height: 100%;
      background: #1e3a5f;
      border-radius: 99px;
      transition: width .5s cubic-bezier(.4,0,.2,1);
    }

    /* ── Step header ── */
    .step-label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      letter-spacing: .07em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .step-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -.02em;
      margin-bottom: 4px;
    }
    .step-sub {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 22px;
    }

    /* ── Saved badge ── */
    .saved-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .saved-badge svg { width: 13px; height: 13px; }

    /* ── Fields ── */
    .field { margin-bottom: 13px; }
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }

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
    .input.is-valid  { border-color: #059669; }
    .input.is-error  { border-color: #dc2626; }

    .field-hint {
      font-size: 11.5px;
      color: #b91c1c;
      margin-top: 4px;
    }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    /* ── Phone ── */
    .phone-prefix {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 50px;
      padding: 0 12px;
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Password ── */
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

    /* ── Recap ── */
    .recap-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .recap-title {
      font-size: 11px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-bottom: 8px;
    }
    .recap-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 3px 0;
    }
    .recap-row span:first-child { color: #6b7280; }
    .recap-row span:last-child  { color: #111827; font-weight: 600; }

    /* ── Checkbox ── */
    .checkbox-wrap {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
    }
    .checkbox-row {
      display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
    }
    .checkbox-row input[type=checkbox] {
      width: 18px; height: 18px;
      accent-color: #1e3a5f;
      margin-top: 1px; flex-shrink: 0; cursor: pointer;
    }
    .checkbox-text {
      font-size: 12.5px; color: #4b5563; line-height: 1.6;
    }
    .checkbox-text a { color: #1e3a5f; font-weight: 600; }

    /* ── Error box ── */
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

    /* ── Buttons ── */
    .btn-actions { display: flex; gap: 10px; margin-top: 20px; }

    .btn-back {
      height: 50px; padding: 0 18px;
      background: #fff; color: #1e3a5f;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      display: flex; align-items: center; gap: 6px;
      transition: background .15s;
    }
    .btn-back:hover { background: #f3f4f6; }
    .btn-back svg { width: 16px; height: 16px; }

    .btn-next {
      flex: 1; height: 50px;
      background: #1e3a5f; color: #fff;
      font-size: 15px; font-weight: 600;
      border: none; border-radius: 10px;
      cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .15s, transform .1s;
    }
    .btn-next:hover  { background: #162d4a; }
    .btn-next:active { transform: scale(.99); }
    .btn-next:disabled { opacity: .45; cursor: not-allowed; }
    .btn-next svg { width: 17px; height: 17px; }

    /* ── Dots ── */
    .dots {
      display: flex; justify-content: center; gap: 6px; margin-top: 20px;
    }
    .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #e5e7eb;
      transition: background .3s, transform .3s;
    }
    .dot.active { background: #1e3a5f; transform: scale(1.3); }
    .dot.done   { background: #93c5fd; }

    /* ── Login link ── */
    .login-link {
      text-align: center; font-size: 13px; color: #6b7280; margin-top: 14px;
    }
    .login-link a { color: #1e3a5f; font-weight: 600; text-decoration: none; }

    /* ── Step animation ── */
    .step-wrap {
      animation: fadeUp .3s ease forwards;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div>
      <!-- Header + Progress -->
      <div style="margin-bottom: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span class="step-label">Étape {{ currentStep() + 1 }} sur {{ totalSteps }}</span>
          @if (savedVisible()) {
            <span class="saved-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
              Sauvegardé
            </span>
          }
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPct()"></div>
        </div>
      </div>

      <!-- STEP 1 — Identité -->
      @if (currentStep() === 0) {
        <div class="step-wrap">
          <p class="step-title">Bienvenue !</p>
          <p class="step-sub">Comment vous appelez-vous ?</p>
          <form [formGroup]="identityForm">
            <div class="grid-2">
              <div class="field">
                <label class="field-label">Prénom *</label>
                <input formControlName="prenom" type="text" placeholder="Jean"
                  class="input"
                  [class.is-valid]="isTouched(identityForm, 'prenom') && identityForm.get('prenom')!.valid"
                  [class.is-error]="isTouched(identityForm, 'prenom') && identityForm.get('prenom')!.invalid"
                  autocomplete="given-name"/>
                @if (isTouched(identityForm, 'prenom') && identityForm.get('prenom')!.invalid) {
                  <p class="field-hint">Minimum 2 caractères</p>
                }
              </div>
              <div class="field">
                <label class="field-label">Nom *</label>
                <input formControlName="nom" type="text" placeholder="Kamga"
                  class="input"
                  [class.is-valid]="isTouched(identityForm, 'nom') && identityForm.get('nom')!.valid"
                  [class.is-error]="isTouched(identityForm, 'nom') && identityForm.get('nom')!.invalid"
                  autocomplete="family-name"/>
                @if (isTouched(identityForm, 'nom') && identityForm.get('nom')!.invalid) {
                  <p class="field-hint">Minimum 2 caractères</p>
                }
              </div>
            </div>
            <div class="field">
              <label class="field-label">Ville *</label>
              <select formControlName="ville" class="input"
                style="background: #fff; cursor: pointer;"
                [class.is-error]="isTouched(identityForm, 'ville') && identityForm.get('ville')!.invalid">
                <option value="">Sélectionnez votre ville</option>
                @for (v of villes; track v) { <option [value]="v">{{ v }}</option> }
              </select>
              @if (isTouched(identityForm, 'ville') && identityForm.get('ville')!.invalid) {
                <p class="field-hint">Sélectionnez une ville</p>
              }
            </div>
          </form>
        </div>
      }

      <!-- STEP 2 — Contact -->
      @if (currentStep() === 1) {
        <div class="step-wrap">
          <p class="step-title">Parfait, {{ identityForm.value.prenom }} !</p>
          <p class="step-sub">Comment vous contacter ?</p>
          <form [formGroup]="contactForm">
            <div class="field">
              <label class="field-label">Adresse e-mail *</label>
              <input formControlName="email" type="email" placeholder="jean@exemple.cm"
                class="input"
                [class.is-valid]="isTouched(contactForm, 'email') && contactForm.get('email')!.valid"
                [class.is-error]="isTouched(contactForm, 'email') && contactForm.get('email')!.invalid"
                autocomplete="email"/>
              @if (isTouched(contactForm, 'email') && contactForm.get('email')!.invalid) {
                <p class="field-hint">Adresse e-mail invalide</p>
              }
            </div>
            <div class="field">
              <label class="field-label">Téléphone *</label>
              <div style="display: flex; gap: 8px;">
                <div class="phone-prefix">🇨🇲 +237</div>
                <input formControlName="telephone" type="tel" placeholder="6XX XX XX XX"
                  class="input" style="flex: 1;"
                  [class.is-valid]="isTouched(contactForm, 'telephone') && contactForm.get('telephone')!.valid"
                  [class.is-error]="isTouched(contactForm, 'telephone') && contactForm.get('telephone')!.invalid"
                  autocomplete="tel"/>
              </div>
              @if (isTouched(contactForm, 'telephone') && contactForm.get('telephone')!.invalid) {
                <p class="field-hint">Format : 6XX XX XX XX (9 chiffres)</p>
              }
            </div>
          </form>
        </div>
      }

      <!-- STEP 3 — Mot de passe -->
      @if (currentStep() === 2) {
        <div class="step-wrap">
          <p class="step-title">Sécurisez votre compte</p>
          <p class="step-sub">Choisissez un mot de passe fort</p>
          <form [formGroup]="passwordForm">
            <div formGroupName="passwords">
              <div class="field">
                <label class="field-label">Mot de passe *</label>
                <div class="pwd-wrap">
                  <input formControlName="motDePasse"
                    [type]="showPwd() ? 'text' : 'password'"
                    placeholder="Minimum 8 caractères"
                    class="input input-pwd"
                    autocomplete="new-password"
                    (input)="updateStrength()"/>
                  <button type="button" class="btn-eye" (click)="showPwd.update(v => !v)">
                    @if (showPwd()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </button>
                </div>
                <!-- Barre de force -->
                <div class="strength-bars" [class]="'strength-' + pwdStrength()">
                  <div class="strength-bar"></div>
                  <div class="strength-bar"></div>
                  <div class="strength-bar"></div>
                  <div class="strength-bar"></div>
                </div>
                @if (passwordForm.get('passwords.motDePasse')!.invalid && passwordForm.get('passwords.motDePasse')!.touched) {
                  <p class="field-hint">Minimum 8 caractères</p>
                }
              </div>
              <div class="field">
                <label class="field-label">Confirmation *</label>
                <div class="pwd-wrap">
                  <input formControlName="confirmationMotDePasse"
                    [type]="showPwd() ? 'text' : 'password'"
                    placeholder="Répétez le mot de passe"
                    class="input input-pwd"
                    [class.is-error]="passwordForm.get('passwords')!.hasError('mismatch') && passwordForm.get('passwords.confirmationMotDePasse')!.touched"
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
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (passwordForm.get('passwords')!.hasError('mismatch') && passwordForm.get('passwords.confirmationMotDePasse')!.touched) {
                  <p class="field-hint">Les mots de passe ne correspondent pas</p>
                }
              </div>
            </div>
          </form>
        </div>
      }

      <!-- STEP 4 — Confirmation -->
      @if (currentStep() === 3) {
        <div class="step-wrap">
          <p class="step-title">Presque prêt !</p>
          <p class="step-sub">Vérifiez vos informations et validez</p>

          <div class="recap-box">
            <div class="recap-title">Récapitulatif</div>
            <div class="recap-row">
              <span>Nom complet</span>
              <span>{{ identityForm.value.prenom }} {{ identityForm.value.nom }}</span>
            </div>
            <div class="recap-row">
              <span>Ville</span>
              <span>{{ identityForm.value.ville }}</span>
            </div>
            <div class="recap-row">
              <span>Email</span>
              <span>{{ contactForm.value.email }}</span>
            </div>
            <div class="recap-row">
              <span>Téléphone</span>
              <span>+237 {{ contactForm.value.telephone }}</span>
            </div>
          </div>

          <form [formGroup]="confirmForm">
            <div class="checkbox-wrap">
              <label class="checkbox-row">
                <input formControlName="politiqueAcceptee" type="checkbox"/>
                <span class="checkbox-text">
                  J'ai lu et j'accepte la
                  <a routerLink="/politique-confidentialite" target="_blank">Politique de confidentialité</a>
                  et les
                  <a routerLink="/conditions-utilisation" target="_blank">Conditions d'utilisation</a>
                  de Bailocam.
                </span>
              </label>
            </div>
            @if (confirmForm.get('politiqueAcceptee')!.touched && !confirmForm.get('politiqueAcceptee')!.value) {
              <p class="field-hint" style="margin-top: 6px;">Vous devez accepter les conditions pour continuer</p>
            }
          </form>

          @if (error()) {
            <div class="error-box" style="margin-top: 12px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
              </svg>
              <span>{{ error() }}</span>
            </div>
          }
        </div>
      }

      <!-- Navigation -->
      <div class="btn-actions">
        @if (currentStep() > 0) {
          <button class="btn-back" type="button" (click)="prev()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Retour
          </button>
        }
        <button class="btn-next" type="button"
          [disabled]="loading() && currentStep() === totalSteps - 1"
          (click)="next()">
          @if (currentStep() < totalSteps - 1) {
            Continuer
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          } @else if (loading()) {
            Création du compte…
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Créer mon compte
          }
        </button>
      </div>

      <!-- Dots -->
      <div class="dots">
        @for (i of stepsArray; track i) {
          <div class="dot"
            [class.active]="i === currentStep()"
            [class.done]="i < currentStep()">
          </div>
        }
      </div>

      @if (currentStep() === 0) {
        <p class="login-link">
          Déjà un compte ?
          <a routerLink="/auth/login" queryParamsHandling="preserve">Se connecter</a>
        </p>
      }
    </div>
  `,
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly fb    = inject(FormBuilder);

  readonly loading     = this.store.selectSignal(selectAuthLoading);
  readonly error       = this.store.selectSignal(selectAuthError);
  readonly showPwd     = signal(false);
  readonly currentStep = signal(0);
  readonly pwdStrength = signal(0);
  readonly savedVisible = signal(false);

  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly totalSteps = 4;
  readonly stepsArray = Array.from({ length: this.totalSteps }, (_, i) => i);

  readonly progressPct = computed(() =>
    Math.round(((this.currentStep() + 1) / this.totalSteps) * 100)
  );

  readonly villes = [
    'Yaoundé','Douala','Maroua','Garoua','Ngaoundéré','Bertoua',
    'Mbalmayo','Bafia','Nkongsamba','Edéa','Bafoussam','Dschang',
    'Foumban','Bamenda','Buea','Kumba','Limbé','Ebolowa','Kribi','Sangmélima',
  ];

  // ── Forms par étape ──────────────────────────────────────────────────────
  identityForm = this.fb.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom:    ['', [Validators.required, Validators.minLength(2)]],
    ville:  ['', Validators.required],
  });

  contactForm = this.fb.group({
    email:     ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
  });

  passwordForm = this.fb.group({
    passwords: this.fb.group({
      motDePasse:             ['', [Validators.required, Validators.minLength(8)]],
      confirmationMotDePasse: ['', Validators.required],
    }, { validators: passwordMatch }),
  });

  confirmForm = this.fb.group({
    politiqueAcceptee: [false, Validators.requiredTrue],
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDraft();
  }

  ngOnDestroy(): void {
    if (this.savedTimer) clearTimeout(this.savedTimer);
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  next(): void {
    if (!this.validateCurrentStep()) return;

    if (this.currentStep() < this.totalSteps - 1) {
      this.saveDraft();
      this.currentStep.update(s => s + 1);
    } else {
      this.confirmForm.get('politiqueAcceptee')!.markAsTouched();
      if (this.confirmForm.invalid) return;
      this.submit();
    }
  }

  prev(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  // ── Validation par étape ─────────────────────────────────────────────────
  private validateCurrentStep(): boolean {
    switch (this.currentStep()) {
      case 0:
        this.identityForm.markAllAsTouched();
        return this.identityForm.valid;
      case 1:
        this.contactForm.markAllAsTouched();
        return this.contactForm.valid;
      case 2:
        this.passwordForm.markAllAsTouched();
        return this.passwordForm.valid;
      case 3:
        this.confirmForm.markAllAsTouched();
        return this.confirmForm.valid;
      default:
        return true;
    }
  }

  // ── Force du mot de passe ────────────────────────────────────────────────
  updateStrength(): void {
    const v = this.passwordForm.get('passwords.motDePasse')?.value ?? '';
    let score = 0;
    if (v.length >= 8)          score++;
    if (/[A-Z]/.test(v))        score++;
    if (/[0-9]/.test(v))        score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    this.pwdStrength.set(score);
  }

  // ── Helpers template ─────────────────────────────────────────────────────
  isTouched(form: ReturnType<typeof this.fb.group>, field: string): boolean {
    return !!form.get(field)?.touched;
  }

  // ── Draft localStorage ───────────────────────────────────────────────────
  private saveDraft(): void {
    try {
      const draft = {
        step: this.currentStep(),
        identity: this.identityForm.getRawValue(),
        contact:  this.contactForm.getRawValue(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      this.savedVisible.set(true);
      if (this.savedTimer) clearTimeout(this.savedTimer);
      this.savedTimer = setTimeout(() => this.savedVisible.set(false), 2200);
    } catch { /* private window */ }
  }

  private loadDraft(): void {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.identity) this.identityForm.patchValue(draft.identity);
      if (draft.contact)  this.contactForm.patchValue(draft.contact);
      if (typeof draft.step === 'number' && draft.step <= this.totalSteps - 1) {
        this.currentStep.set(draft.step);
      }
    } catch { /* données corrompues, on ignore */ }
  }

  // ── Soumission finale ────────────────────────────────────────────────────
  private submit(): void {
    const id  = this.identityForm.getRawValue();
    const co  = this.contactForm.getRawValue();
    const pwd = this.passwordForm.getRawValue().passwords;

    this.store.dispatch(authActions.register({
      req: {
        prenom:                 id.prenom!,
        nom:                    id.nom!,
        ville:                  id.ville!,
        email:                  co.email!,
        telephone:              '+237' + co.telephone!,
        motDePasse:             pwd.motDePasse!,
        confirmationMotDePasse: pwd.confirmationMotDePasse!,
        politiqueAcceptee:      true,
      },
    }));

    localStorage.removeItem(DRAFT_KEY);
  }
}