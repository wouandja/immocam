import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, takeUntil, forkJoin } from 'rxjs';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { PhotoApi } from '@core/services/api/photo.api';
import { ToastService } from '@core/services/toast.service';
import {
  LocalisationResponse,
  TypeBienResponse,
  PhotoResponse,
  AnnonceDashboardResponse,
} from '@core/services/models';

/** Photo déjà uploadée côté serveur */
interface ExistingPhoto {
  kind: 'existing';
  id: number;
  url: string;
  urlThumb: string;
  ordre: number;
  principale: boolean;
  markedForDelete: boolean;
}

/** Nouvelle photo sélectionnée localement */
interface NewPhoto {
  kind: 'new';
  localId: string;
  file: File;
  previewUrl: string;
}

type Photo = ExistingPhoto | NewPhoto;

@Component({
  selector: 'app-annonce-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [
    `
      :host { display: block; }

      /* ── Page ── */
      .page-bg {
        min-height: 100vh;
        background: #f9fafb;
        padding: 0 0 60px;
      }

      /* ── Top bar ── */
      .top-bar {
        position: sticky; top: 0; z-index: 40;
        background: #fff;
        border-bottom: 1px solid #f3f4f6;
        height: 60px;
        display: flex; align-items: center;
        padding: 0 24px;
        margin-bottom: 28px;
      }
      .top-bar-center {
        flex: 1; text-align: center;
        font-size: 16px; font-weight: 700; color: #111827;
        letter-spacing: -0.01em;
      }
      .top-bar-side { width: 80px; }
      .btn-ghost {
        display: inline-flex; align-items: center; gap: 6px;
        background: none; border: none; cursor: pointer;
        font-size: 13px; font-weight: 600; color: #6b7280;
        font-family: inherit; padding: 0;
        transition: color 0.15s;
      }
      .btn-ghost:hover { color: #111827; }
      .btn-ghost svg { width: 16px; height: 16px; }

      /* ── Stepper ── */
      .stepper-wrap {
        max-width: 460px; margin: 0 auto 24px;
        padding: 0 24px;
        display: flex; align-items: center;
      }
      .step-node { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
      .step-bubble {
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 600;
        transition: all 0.25s;
      }
      .step-bubble.done  { background: #059669; color: #fff; }
      .step-bubble.active{ background: #1e3a5f; color: #fff; }
      .step-bubble.idle  { background: #f3f4f6; color: #9ca3af; border: 1.5px solid #e5e7eb; }
      .step-bubble svg   { width: 15px; height: 15px; }
      .step-lbl { font-size: 11px; font-weight: 600; letter-spacing: 0.01em; white-space: nowrap; }
      .step-lbl.done   { color: #059669; }
      .step-lbl.active { color: #1e3a5f; }
      .step-lbl.idle   { color: #9ca3af; }
      .step-line {
        flex: 1; height: 2px; margin: 0 8px 16px;
        border-radius: 99px; transition: background 0.3s;
      }
      .step-line.done { background: #059669; }
      .step-line.idle { background: #e5e7eb; }

      /* ── Carte ── */
      .card {
        max-width: 460px; margin: 0 auto;
        background: #fff; border-radius: 20px;
        box-shadow: 0 8px 40px rgba(30,58,95,0.1);
        overflow: visible; padding: 0 0 4px;
      }

      /* ── Step header ── */
      .step-header { padding: 24px 24px 0; margin-bottom: 20px; }
      .step-title  { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin-bottom: 4px; }
      .step-sub    { font-size: 14px; color: #6b7280; }

      /* ── Sections ── */
      .section { padding: 0 24px; margin-bottom: 20px; }
      .section-label {
        display: flex; align-items: center; gap: 8px;
        font-size: 12px; font-weight: 700; color: #374151;
        text-transform: uppercase; letter-spacing: 0.06em;
        margin-bottom: 12px;
      }
      .section-label svg { width: 14px; height: 14px; color: #9ca3af; }

      /* ── Type tiles ── */
      .type-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
      @media(max-width:420px) { .type-grid { grid-template-columns: repeat(3,1fr); } }
      .type-tile {
        position: relative; cursor: pointer;
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        padding: 14px 6px 10px;
        border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fff;
        transition: border-color 0.15s, background 0.15s;
        user-select: none; outline: none;
      }
      .type-tile:hover  { border-color: #9ca3af; background: #f9fafb; }
      .type-tile:focus-visible { box-shadow: 0 0 0 3px rgba(30,58,95,0.12); }
      .type-tile.sel    { border-color: #1e3a5f !important; background: #f0f4f8; }
      .type-tile-icon   { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; transition: background 0.15s; }
      .type-tile-icon svg { width: 18px; height: 18px; color: #6b7280; transition: color 0.15s; }
      .type-tile.sel .type-tile-icon { background: #1e3a5f; }
      .type-tile.sel .type-tile-icon svg { color: #fff; }
      .type-tile-name   { font-size: 10px; font-weight: 600; text-align: center; color: #6b7280; line-height: 1.3; }
      .type-tile.sel .type-tile-name { color: #1e3a5f; }
      .type-check { position: absolute; top: 5px; right: 5px; width: 16px; height: 16px; border-radius: 50%; background: #059669; display: flex; align-items: center; justify-content: center; }
      .type-check svg { width: 9px; height: 9px; color: #fff; }

      /* ── Fields ── */
      .field { margin-bottom: 12px; }
      .field:last-child { margin-bottom: 0; }
      .field-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
      .input {
        width: 100%; height: 50px; padding: 0 16px;
        border: 1.5px solid #e5e7eb; border-radius: 10px;
        font-size: 15px; color: #111827; background: #fff;
        outline: none; font-family: inherit; box-sizing: border-box;
        transition: border-color 0.15s, box-shadow 0.15s;
        appearance: none;
      }
      .input::placeholder { color: #9ca3af; }
      .input:focus  { border-color: #1e3a5f; box-shadow: 0 0 0 3px rgba(30,58,95,0.08); }
      .input:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
      .input.is-valid { border-color: #059669; }
      .input.is-error { border-color: #dc2626; }
      .input.has-icon-l { padding-left: 44px; }
      .input.has-sfx    { padding-right: 56px; }
      .input.wa-pad     { padding-left: 90px; }
      select.input { cursor: pointer; }
      .input-wrap { position: relative; }
      .ico-l { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; pointer-events: none; }
      .ico-l svg { width: 17px; height: 17px; color: #9ca3af; }
      .ico-r { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); display: flex; pointer-events: none; }
      .ico-r svg { width: 15px; height: 15px; color: #9ca3af; }
      .sfx-label { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; color: #9ca3af; pointer-events: none; }
      .wa-prefix {
        position: absolute; left: 0; top: 0; bottom: 0;
        display: flex; align-items: center; gap: 5px; padding: 0 12px;
        font-size: 12px; font-weight: 700; color: #374151;
        border-right: 1.5px solid #e5e7eb; pointer-events: none;
      }
      .wa-prefix svg { width: 15px; height: 15px; }
      textarea.input { height: auto; padding: 14px 16px; resize: none; line-height: 1.6; }
      .textarea-wrap { position: relative; }
      .char-count { position: absolute; bottom: 10px; right: 14px; font-size: 11px; color: #9ca3af; pointer-events: none; }
      .char-count.warn { color: #f59e0b; font-weight: 600; }

      /* ── Hints ── */
      .field-hint  { font-size: 11.5px; color: #6b7280; margin-top: 5px; display: flex; align-items: center; gap: 5px; }
      .field-hint svg  { width: 13px; height: 13px; flex-shrink: 0; }
      .field-error { font-size: 11.5px; color: #b91c1c; font-weight: 500; margin-top: 5px; display: flex; align-items: center; gap: 5px; }
      .field-error svg { width: 13px; height: 13px; flex-shrink: 0; }
      .price-ok { font-size: 15px; font-weight: 600; color: #059669; margin-top: 7px; display: flex; align-items: center; gap: 6px; }
      .price-ok svg { width: 15px; height: 15px; }

      /* ── Autocomplete ── */
      .ac-wrap { position: relative; }
      .ac-dropdown {
        position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 60;
        background: #fff; border: 1.5px solid #e5e7eb; border-radius: 12px;
        overflow: hidden; max-height: 220px; overflow-y: auto;
        box-shadow: 0 8px 24px rgba(30,58,95,0.1);
      }
      .ac-item {
        display: flex; align-items: center; gap: 9px;
        padding: 11px 16px; font-size: 14px; color: #111827;
        background: none; border: none; border-bottom: 1px solid #f3f4f6;
        width: 100%; text-align: left; cursor: pointer; font-family: inherit;
        transition: background 0.1s;
      }
      .ac-item:last-child { border-bottom: none; }
      .ac-item:hover { background: #f9fafb; }
      .ac-item svg { width: 15px; height: 15px; color: #9ca3af; flex-shrink: 0; }

      /* ── Photos ── */
      .dropzone {
        border: 1.5px dashed #e5e7eb; border-radius: 12px;
        padding: 28px 20px; text-align: center; cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .dropzone:hover, .dropzone.drag { border-color: #1e3a5f; background: #f0f4f8; }
      .dropzone-icon { font-size: 28px; display: block; margin-bottom: 8px; }
      .dropzone-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 3px; }
      .dropzone-sub { font-size: 12px; color: #9ca3af; }

      .photo-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .photo-tip   { font-size: 12px; color: #9ca3af; }
      .photo-count { font-size: 12px; font-weight: 600; color: #374151; }

      .photo-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 12px; }
      @media(max-width:420px) { .photo-grid { grid-template-columns: repeat(3,1fr); } }

      .photo-cell {
        position: relative; aspect-ratio: 1;
        border-radius: 10px; overflow: hidden;
        border: 1.5px solid #e5e7eb;
      }
      .photo-cell.to-delete { opacity: 0.35; }
      .photo-cell.to-delete::after {
        content: '🗑'; position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; background: rgba(220,38,38,0.12);
      }
      .photo-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .photo-main-badge {
        position: absolute; bottom: 5px; left: 5px;
        font-size: 9px; font-weight: 700; letter-spacing: 0.4px;
        text-transform: uppercase; padding: 2px 7px; border-radius: 5px;
        background: #1e3a5f; color: #fff;
      }
      .photo-new-badge {
        position: absolute; top: 5px; left: 5px;
        font-size: 9px; font-weight: 700;
        text-transform: uppercase; padding: 2px 7px; border-radius: 5px;
        background: #059669; color: #fff;
      }
      .photo-del {
        position: absolute; top: 4px; right: 4px;
        width: 22px; height: 22px; border-radius: 50%;
        background: rgba(0,0,0,0.55); border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.15s; color: #fff;
      }
      .photo-del svg { width: 11px; height: 11px; }
      .photo-cell:hover .photo-del { opacity: 1; }
      .photo-restore {
        position: absolute; bottom: 5px; right: 5px;
        font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
        background: #f59e0b; color: #fff; border: none; cursor: pointer;
        font-family: inherit;
      }

      /* ── Récap ── */
      .recap-box { background: #f8fafc; border: 1.5px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
      .recap-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
      .recap-row:last-child { border-bottom: none; }
      .recap-ico { width: 32px; height: 32px; border-radius: 8px; background: #fff; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .recap-ico svg { width: 15px; height: 15px; color: #6b7280; }
      .recap-lbl { font-size: 11px; color: #9ca3af; margin-bottom: 1px; }
      .recap-val { font-size: 13px; font-weight: 600; color: #111827; }

      /* ── Error box ── */
      .error-box {
        background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px;
        padding: 12px 16px; margin: 0 24px 16px;
        display: flex; align-items: flex-start; gap: 10px;
        font-size: 13px; font-weight: 500; color: #b91c1c; line-height: 1.5;
      }
      .error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

      /* ── Divider ── */
      .divider { height: 1px; background: #f3f4f6; margin: 4px 0; }

      /* ── Footer buttons ── */
      .card-foot { padding: 16px 24px; display: flex; gap: 10px; border-top: 1px solid #f3f4f6; margin-top: 8px; }
      .btn-back {
        height: 50px; padding: 0 18px;
        background: #fff; color: #1e3a5f;
        border: 1.5px solid #e5e7eb; border-radius: 10px;
        font-size: 14px; font-weight: 600; cursor: pointer;
        font-family: inherit; flex-shrink: 0;
        display: flex; align-items: center; gap: 6px;
        transition: background 0.15s;
      }
      .btn-back:hover { background: #f3f4f6; }
      .btn-back svg { width: 16px; height: 16px; }
      .btn-next {
        flex: 1; height: 50px; background: #1e3a5f; color: #fff;
        border: none; border-radius: 10px;
        font-size: 15px; font-weight: 600; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        font-family: inherit;
        transition: background 0.15s, transform 0.1s;
      }
      .btn-next:hover { background: #162d4a; }
      .btn-next:active { transform: scale(0.99); }
      .btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
      .btn-next svg { width: 17px; height: 17px; }
      .btn-save {
        flex: 1; height: 50px; background: #059669; color: #fff;
        border: none; border-radius: 10px;
        font-size: 15px; font-weight: 600; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        font-family: inherit;
        transition: background 0.15s, transform 0.1s;
      }
      .btn-save:hover { background: #047857; }
      .btn-save:active { transform: scale(0.99); }
      .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
      .btn-save svg { width: 17px; height: 17px; }

      /* ── Succès ── */
      .success-wrap { display: flex; flex-direction: column; align-items: center; padding: 52px 32px; text-align: center; }
      .success-ring { width: 72px; height: 72px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
      .success-ring svg { width: 34px; height: 34px; color: #059669; }
      .success-title { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin-bottom: 6px; }
      .success-sub { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 28px; }
      .btn-view {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 0 28px; height: 50px;
        background: #1e3a5f; color: #fff; border: none; border-radius: 10px;
        font-size: 15px; font-weight: 600; cursor: pointer;
        font-family: inherit; transition: background 0.15s;
      }
      .btn-view:hover { background: #162d4a; }
      .btn-view svg { width: 17px; height: 17px; }

      /* ── Loading ── */
      .loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; gap: 16px; }
      .spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #1e3a5f; border-radius: 50%; animation: spin 0.7s linear infinite; }
      .loading-txt { font-size: 14px; color: #6b7280; font-weight: 500; }

      @keyframes spin { to { transform: rotate(360deg); } }

      .fade-in { animation: fadeUp 0.3s ease forwards; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    `,
  ],
  template: `
    <div class="page-bg">
      <!-- Top bar -->
      <header class="top-bar">
        <div class="top-bar-side">
          <button type="button" class="btn-ghost" (click)="goBack()">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Retour
          </button>
        </div>
        <span class="top-bar-center">Modifier l'annonce</span>
        <div class="top-bar-side"></div>
      </header>

      <!-- Stepper -->
      <nav class="stepper-wrap" aria-label="Étapes">
        @for (s of steps; track s.n; let i = $index) {
          <div class="step-node">
            <div class="step-bubble"
              [class.done]="currentStep() > s.n"
              [class.active]="currentStep() === s.n"
              [class.idle]="currentStep() < s.n">
              @if (currentStep() > s.n) {
                <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              } @else { {{ s.n }} }
            </div>
            <span class="step-lbl"
              [class.done]="currentStep() > s.n"
              [class.active]="currentStep() === s.n"
              [class.idle]="currentStep() < s.n">{{ s.label }}</span>
          </div>
          @if (i < steps.length - 1) {
            <div class="step-line"
              [class.done]="currentStep() > s.n"
              [class.idle]="currentStep() <= s.n"></div>
          }
        }
      </nav>

      <!-- Carte -->
      <main>
        @if (saved()) {
          <!-- Succès -->
          <div class="card">
            <div class="success-wrap fade-in">
              <div class="success-ring">
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p class="success-title">Annonce mise à jour !</p>
              <p class="success-sub">Vos modifications sont en ligne.</p>
              <button type="button" class="btn-view" (click)="goToAnnonce()">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                Voir l'annonce
              </button>
            </div>
          </div>
        } @else {
          <div class="card">
            @if (loading()) {
              <div class="loading-wrap">
                <div class="spinner"></div>
                <span class="loading-txt">Chargement de l'annonce…</span>
              </div>
            } @else {
              <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

                <!-- ══ ÉTAPE 1 — Bien & localisation ══ -->
                @if (currentStep() === 1) {
                  <div class="fade-in">
                    <div class="step-header">
                      <p class="step-title">Votre bien</p>
                      <p class="step-sub">Type de logement et localisation</p>
                    </div>

                    <!-- Type de bien -->
                    <div class="section">
                      <div class="section-label">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        </svg>
                        Type de bien
                      </div>
                      <div class="type-grid" role="radiogroup">
                        @for (t of typesBiens(); track t.id) {
                          <div class="type-tile" [class.sel]="form.value.typeBienId === t.id"
                            (click)="selectType(t.id)"
                            (keydown.enter)="selectType(t.id)"
                            (keydown.space)="selectType(t.id)"
                            role="radio" [attr.aria-checked]="form.value.typeBienId === t.id" tabindex="0">
                            <div class="type-tile-icon">
                              <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                  [attr.d]="getTypeIcon(t.libelle) || 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'"/>
                              </svg>
                            </div>
                            <span class="type-tile-name">{{ t.libelle }}</span>
                            @if (form.value.typeBienId === t.id) {
                              <span class="type-check">
                                <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </span>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Ville -->
                    <div class="section" style="margin-top:20px">
                      <div class="section-label">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        Localisation
                      </div>
                      <div class="field">
                        <label class="field-label">Ville *</label>
                        <div class="input-wrap">
                          <span class="ico-l">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                          </span>
                          <select class="input has-icon-l" formControlName="ville" (change)="onVilleChange($event)">
                            <option value="">Choisir une ville…</option>
                            @for (v of villes(); track v) {
                              <option [value]="v">{{ v }}</option>
                            }
                          </select>
                          <span class="ico-r">
                            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                          </span>
                        </div>
                      </div>

                      <!-- Quartier -->
                      <div class="field">
                        <label class="field-label">Quartier *</label>
                        <div class="ac-wrap">
                          <div class="input-wrap">
                            <span class="ico-l">
                              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              </svg>
                            </span>
                            <input type="text" class="input has-icon-l" formControlName="quartier"
                              placeholder="Ex : Akwa" (input)="onQuartierInput()"
                              (focus)="showSuggestions.set(true)" autocomplete="off"/>
                          </div>
                          @if (showSuggestions() && filteredQuartiers().length > 0) {
                            <div class="ac-dropdown">
                              @for (q of filteredQuartiers(); track q) {
                                <button type="button" class="ac-item" (mousedown)="selectQuartier(q)">
                                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                  </svg>
                                  {{ q }}
                                </button>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    </div>

                    <div class="card-foot">
                      <button type="button" class="btn-next"
                        [disabled]="!form.value.typeBienId || !form.value.quartier"
                        (click)="nextStep()">
                        Continuer
                        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                }

                <!-- ══ ÉTAPE 2 — Description, prix, contact ══ -->
                @if (currentStep() === 2) {
                  <div class="fade-in">
                    <div class="step-header">
                      <p class="step-title">Les détails</p>
                      <p class="step-sub">Description, loyer et contact</p>
                    </div>

                    <div class="section">
                      <div class="section-label">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                        </svg>
                        Description
                      </div>
                      <div class="field">
                        <div class="textarea-wrap">
                          <textarea class="input" formControlName="description"
                            rows="5" maxlength="1000"
                            [class.is-error]="isFieldError('description')"
                            placeholder="Superficie, état général, équipements, accès, disponibilité…">
                          </textarea>
                          <span class="char-count" [class.warn]="descLen() > 900">{{ descLen() }}/1000</span>
                        </div>
                        @if (descLen() > 0 && descLen() < 30) {
                          <div class="field-error">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
                            Encore {{ 30 - descLen() }} caractère(s) requis
                          </div>
                        }
                      </div>
                    </div>

                    <div class="divider"></div>

                    <div class="section" style="margin-top:20px">
                      <div class="section-label">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        Loyer mensuel
                      </div>
                      <div class="field">
                        <label class="field-label">Prix en FCFA / mois *</label>
                        <div class="input-wrap">
                          <span class="ico-l">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </span>
                          <input type="number" class="input has-icon-l has-sfx" formControlName="prix"
                            min="1000"
                            [class.is-error]="isFieldError('prix')"
                            [class.is-valid]="(form.value.prix ?? 0) >= 1000"
                            placeholder="Ex : 75 000"/>
                          <span class="sfx-label">FCFA</span>
                        </div>
                        @if (prixPreview()) {
                          <div class="price-ok">
                            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            {{ prixPreview() }} / mois
                          </div>
                        }
                      </div>
                    </div>

                    <div class="divider"></div>

                    <div class="section" style="margin-top:20px">
                      <div class="section-label">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        Contact WhatsApp
                      </div>
                      <div class="field">
                        <label class="field-label">Numéro WhatsApp *</label>
                        <div class="input-wrap">
                          <span class="wa-prefix">
                            <svg viewBox="0 0 24 24" fill="currentColor" style="color:#25D366;width:15px;height:15px">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.04l5.36-1.406A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.213-3.181.835.849-3.101-.234-.378A9.818 9.818 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
                            </svg>
                            +237
                          </span>
                          <input type="tel" class="input wa-pad" formControlName="whatsappRaw"
                            [class.is-error]="isFieldError('whatsappRaw')"
                            placeholder="6 XX XX XX XX"/>
                        </div>
                        <div class="field-hint">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          </svg>
                          Votre numéro n'est jamais affiché en clair
                        </div>
                      </div>
                    </div>

                    <div class="card-foot">
                      <button type="button" class="btn-back" (click)="prevStep()">
                        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                        </svg>
                        Retour
                      </button>
                      <button type="button" class="btn-next" [disabled]="step2Invalid()" (click)="nextStep()">
                        Continuer
                        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                }

                <!-- ══ ÉTAPE 3 — Photos + récap + sauvegarder ══ -->
                @if (currentStep() === 3) {
                  <div class="fade-in">
                    <div class="step-header">
                      <p class="step-title">Photos</p>
                      <p class="step-sub">Gérez les photos de votre annonce</p>
                    </div>

                    <div class="section">
                      <div class="section-label">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Photos
                      </div>

                      <div class="photo-meta">
                        <span class="photo-tip">Cliquez sur 🗑 pour supprimer une photo existante</span>
                        <span class="photo-count">{{ activePhotoCount() }} / 4</span>
                      </div>

                      @if (activePhotoCount() < 4) {
                        <div class="dropzone" [class.drag]="isDragging()"
                          (click)="fileInputRef.nativeElement.click()"
                          (keydown.enter)="fileInputRef.nativeElement.click()"
                          (dragover)="onDragOver($event)"
                          (dragleave)="isDragging.set(false)"
                          (drop)="onDrop($event)"
                          role="button" tabindex="0">
                          <span class="dropzone-icon">📷</span>
                          <div class="dropzone-title">Glisser-déposer ou cliquer</div>
                          <div class="dropzone-sub">JPG, PNG, WebP — max 4 Mo par photo</div>
                        </div>
                      }

                      <input #fileInput type="file" style="display:none"
                        accept="image/jpeg,image/png,image/webp" multiple
                        (change)="onFilesSelected($event)"/>

                      @if (allPhotos().length > 0) {
                        <div class="photo-grid">
                          @for (p of allPhotos(); track photoKey(p); let i = $index) {
                            <div class="photo-cell" [class.to-delete]="p.kind === 'existing' && p.markedForDelete">
                              <img [src]="p.kind === 'existing' ? p.urlThumb || p.url : p.previewUrl"
                                [alt]="'Photo ' + (i + 1)" loading="lazy"/>
                              @if (i === 0 && !(p.kind === 'existing' && p.markedForDelete)) {
                                <span class="photo-main-badge">Principale</span>
                              }
                              @if (p.kind === 'new') {
                                <span class="photo-new-badge">Nouveau</span>
                              }
                              @if (p.kind === 'existing' && p.markedForDelete) {
                                <button type="button" class="photo-restore" (click)="restorePhoto(p.id)">Annuler</button>
                              } @else {
                                <button type="button" class="photo-del" (click)="removePhoto(p)">
                                  <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                  </svg>
                                </button>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <div class="divider"></div>

                    <!-- Récap -->
                    <div class="section" style="margin-top:20px">
                      <div class="section-label">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        Récapitulatif
                      </div>
                      <div class="recap-box">
                        @if (recapTypeBien()) {
                          <div class="recap-row">
                            <div class="recap-ico">
                              <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                              </svg>
                            </div>
                            <div>
                              <div class="recap-lbl">Type de bien</div>
                              <div class="recap-val">{{ recapTypeBien() }}</div>
                            </div>
                          </div>
                        }
                        @if (recapLieu()) {
                          <div class="recap-row">
                            <div class="recap-ico">
                              <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              </svg>
                            </div>
                            <div>
                              <div class="recap-lbl">Localisation</div>
                              <div class="recap-val">{{ recapLieu() }}</div>
                            </div>
                          </div>
                        }
                        @if (prixPreview()) {
                          <div class="recap-row">
                            <div class="recap-ico">
                              <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                            <div>
                              <div class="recap-lbl">Loyer mensuel</div>
                              <div class="recap-val">{{ prixPreview() }}</div>
                            </div>
                          </div>
                        }
                        <div class="recap-row">
                          <div class="recap-ico">
                            <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                            </svg>
                          </div>
                          <div>
                            <div class="recap-lbl">Photos</div>
                            <div class="recap-val">
                              {{ activePhotoCount() }} photo{{ activePhotoCount() !== 1 ? 's' : '' }}
                              @if (photosToDelete().length > 0) { ({{ photosToDelete().length }} à supprimer) }
                              @if (newPhotos().length > 0) { ({{ newPhotos().length }} nouveau{{ newPhotos().length > 1 ? 'x' : '' }}) }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    @if (submitError()) {
                      <div class="error-box">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                        </svg>
                        {{ submitError() }}
                      </div>
                    }

                    <div class="card-foot">
                      <button type="button" class="btn-back" (click)="prevStep()">
                        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                        </svg>
                        Retour
                      </button>
                      <button type="submit" class="btn-save" [disabled]="submitting()">
                        @if (submitting()) {
                          <svg class="spin" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="animation:spin 0.8s linear infinite">
                            <path stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10"/>
                          </svg>
                          Enregistrement…
                        } @else {
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Sauvegarder
                        }
                      </button>
                    </div>
                  </div>
                }

              </form>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class AnnonceEditComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  private readonly annonceApi  = inject(AnnonceApi);
  private readonly locApi      = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly photoApi    = inject(PhotoApi);
  private readonly toast       = inject(ToastService);
  private readonly destroy$    = new Subject<void>();

  private annonceId!: number;

  /* ── State ── */
  readonly currentStep  = signal(1);
  readonly loading      = signal(true);
  readonly submitting   = signal(false);
  readonly submitError  = signal<string | null>(null);
  readonly saved        = signal(false);
  readonly typesBiens   = signal<TypeBienResponse[]>([]);
  readonly villesAvecId = signal<{ id: number; ville: string }[]>([]);
  readonly allQuartiers = signal<string[]>([]);
  readonly showSuggestions = signal(false);
  readonly isDragging   = signal(false);

  /** Toutes les photos (existantes + nouvelles) */
  readonly allPhotos = signal<Photo[]>([]);

  readonly steps = [
    { n: 1, label: 'Bien & lieu' },
    { n: 2, label: 'Détails' },
    { n: 3, label: 'Photos' },
  ];

  /* ── Form ── */
  readonly form = this.fb.group({
    typeBienId:     [null as number | null, Validators.required],
    ville:          [''],
    localisationId: [null as number | null, Validators.required],
    quartier:       ['', Validators.required],
    description:    ['', [Validators.required, Validators.minLength(30), Validators.maxLength(1000)]],
    prix:           [null as number | null, [Validators.required, Validators.min(1000)]],
    whatsappRaw:    ['', Validators.required],
  });

  readonly formValue = signal(this.form.getRawValue());

  /* ── Computed ── */
  readonly villes = computed(() => this.villesAvecId().map(v => v.ville));

  readonly descLen = computed(() => this.form.value.description?.length ?? 0);

  readonly prixPreview = computed(() => {
    const p = this.form.value.prix;
    if (!p || p < 1000) return null;
    return new Intl.NumberFormat('fr-CM').format(p) + ' FCFA';
  });

  readonly filteredQuartiers = computed(() => {
    const s = (this.form.value.quartier ?? '').toLowerCase().trim();
    const all = this.allQuartiers();
    return (s ? all.filter(q => q.toLowerCase().includes(s)) : all).slice(0, 10);
  });

  readonly recapTypeBien = computed(
    () => this.typesBiens().find(t => t.id === this.form.value.typeBienId)?.libelle ?? ''
  );

  readonly recapLieu = computed(() => {
    const ville    = this.form.value.ville ?? '';
    const quartier = this.form.value.quartier ?? '';
    return quartier && ville ? `${quartier}, ${ville}` : ville || '';
  });

  readonly step2Invalid = computed(() => {
    const v = this.formValue();
    return (
      !v.description || (v.description?.length ?? 0) < 30 ||
      !v.prix || v.prix < 1000 ||
      !v.whatsappRaw || v.whatsappRaw.replace(/\D/g, '').length < 9
    );
  });

  /** Photos existantes marquées pour suppression */
  readonly photosToDelete = computed(() =>
    this.allPhotos().filter((p): p is ExistingPhoto => p.kind === 'existing' && p.markedForDelete)
  );

  /** Nouvelles photos à uploader */
  readonly newPhotos = computed(() =>
    this.allPhotos().filter((p): p is NewPhoto => p.kind === 'new')
  );

  /** Nombre de photos actives (existantes non supprimées + nouvelles) */
  readonly activePhotoCount = computed(() =>
    this.allPhotos().filter(p =>
      p.kind === 'new' || (p.kind === 'existing' && !p.markedForDelete)
    ).length
  );

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.annonceId = +this.route.snapshot.paramMap.get('id')!;

    // Charger types + villes en parallèle
    forkJoin({
      types: this.typeBienApi.getAll(),
      villes: this.locApi.getVillesAvecId(),
      annonce: this.annonceApi.getAnnonce(this.annonceId),
    }).subscribe({
      next: ({ types, villes, annonce }) => {
        // Types de bien
        this.typesBiens.set(
          (types.data ?? []).filter((t: TypeBienResponse) => t.estActif !== false)
        );

        // Villes
        this.villesAvecId.set(villes.data ?? []);

        // Pré-remplir le formulaire
        const a = annonce.data;
        const villeNom = a.ville ?? '';

        // Trouver le localisationId depuis la ville
        const foundVille = (villes.data ?? []).find((v: { id: number; ville: string }) => v.ville === villeNom);

        this.form.patchValue({
          typeBienId:     this.findTypeBienId(a.typeBien, types.data ?? []),
          ville:          villeNom,
          localisationId: foundVille?.id ?? null,
          quartier:       a.quartier ?? '',
          description:    a.description ?? '',
          prix:           a.prix ?? null,
          whatsappRaw:    '',  // sécurité : ne pas pré-remplir le numéro
        });

        // Charger les quartiers de la ville
        if (villeNom) {
          this.locApi.getQuartiers(villeNom).subscribe(
            r => this.allQuartiers.set(r.data ?? [])
          );
        }

        // Charger les photos existantes
        if (a.photos && a.photos.length > 0) {
          this.allPhotos.set(
            (a.photos as PhotoResponse[]).map(p => ({
              kind: 'existing' as const,
              id: p.id,
              url: p.url,
              urlThumb: p.urlThumb,
              ordre: p.ordre,
              principale: p.principale,
              markedForDelete: false,
            }))
          );
        }

        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger l\'annonce');
        this.loading.set(false);
        this.router.navigate(['/dashboard/mes-annonces']);
      },
    });

    // Sync formValue signal
    this.form.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$)).subscribe(() => {
      this.formValue.set(this.form.getRawValue());
    });

    document.addEventListener('click', this.onDocClick);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocClick);
    // Libérer les object URLs des nouvelles photos
    this.newPhotos().forEach(p => URL.revokeObjectURL(p.previewUrl));
  }

  @HostListener('document:click')
  private readonly onDocClick = () => this.showSuggestions.set(false);

  /* ── Helpers privés ── */

  private findTypeBienId(libelle: string, types: TypeBienResponse[]): number | null {
    return types.find(t => t.libelle === libelle)?.id ?? null;
  }

  photoKey(p: Photo): string {
    return p.kind === 'existing' ? `e-${p.id}` : `n-${p.localId}`;
  }

  /* ── Localisation ── */
  onVilleChange(event?: Event): void {
    const villeNom = event
      ? (event.target as HTMLSelectElement).value
      : this.form.value.ville ?? '';

    this.form.patchValue({ localisationId: null, quartier: '' });
    this.allQuartiers.set([]);
    this.showSuggestions.set(false);

    if (villeNom) {
      const found = this.villesAvecId().find(v => v.ville === villeNom);
      if (found) this.form.patchValue({ localisationId: found.id });
      this.locApi.getQuartiers(villeNom).subscribe(r => this.allQuartiers.set(r.data ?? []));
    }
  }

  onQuartierInput(): void { this.showSuggestions.set(true); }

  selectQuartier(q: string): void {
    this.form.patchValue({ quartier: q });
    this.showSuggestions.set(false);
  }

  selectType(id: number): void { this.form.patchValue({ typeBienId: id }); }

  /* ── Photos ── */
  onFilesSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging.set(true); }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    this.addFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  private addFiles(files: File[]): void {
    const remaining = 4 - this.activePhotoCount();
    if (remaining <= 0) { this.toast.info('Maximum 4 photos'); return; }

    const valid = files
      .filter(f => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
          this.toast.error(`${f.name} : format non supporté`); return false;
        }
        if (f.size > 4 * 1024 * 1024) {
          this.toast.error(`${f.name} : trop lourd (max 4 Mo)`); return false;
        }
        return true;
      })
      .slice(0, remaining);

    this.allPhotos.update(list => [
      ...list,
      ...valid.map(f => ({
        kind: 'new' as const,
        localId: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      })),
    ]);
  }

  removePhoto(p: Photo): void {
    if (p.kind === 'existing') {
      // Marquer pour suppression côté serveur
      this.allPhotos.update(list =>
        list.map(x => x.kind === 'existing' && x.id === p.id ? { ...x, markedForDelete: true } : x)
      );
    } else {
      // Supprimer directement (pas encore uploadée)
      URL.revokeObjectURL(p.previewUrl);
      this.allPhotos.update(list => list.filter(x => !(x.kind === 'new' && x.localId === p.localId)));
    }
  }

  restorePhoto(photoId: number): void {
    this.allPhotos.update(list =>
      list.map(x => x.kind === 'existing' && x.id === photoId ? { ...x, markedForDelete: false } : x)
    );
  }

  /* ── Navigation ── */
  nextStep(): void { if (this.currentStep() < 3) this.currentStep.update(v => v + 1); }
  prevStep(): void { if (this.currentStep() > 1) this.currentStep.update(v => v - 1); }
  goBack():  void { window.history.back(); }
  goToAnnonce(): void { this.router.navigate(['/annonces', this.annonceId]); }

  isFieldError(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c?.invalid && c?.touched);
  }

  /* ── Icônes ── */
  getTypeIcon(nom: string): string {
    const n = nom.toLowerCase();
    if (n.includes('appartement')) return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
    if (n.includes('studio'))     return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
    if (n.includes('villa'))      return 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z';
    if (n.includes('maison'))     return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
    if (n.includes('bureau'))     return 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
    if (n.includes('boutique'))   return 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z';
    if (n.includes('chambre'))    return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
    if (n.includes('terrain'))    return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
    return 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z';
  }

  /* ── Soumission ── */
  onSubmit(): void {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    this.submitError.set(null);
    this.submitting.set(true);

    const v = this.form.getRawValue();
    const digits = (v.whatsappRaw ?? '').replace(/\D/g, '');
    const whatsApp = digits.startsWith('237') ? `+${digits}` : `+237${digits}`;

    // 1. Modifier les champs texte
    this.annonceApi.modifier(this.annonceId, {
      typeBienId:     v.typeBienId!,
      localisationId: v.localisationId!,
      quartier:       (v.quartier ?? '').trim(),
      description:    v.description!,
      prix:           v.prix!,
      ...(digits.length >= 9 ? { numeroWhatsApp: whatsApp } : {}),
    }).subscribe({
      next: () => this.handlePhotos(),
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'Erreur lors de la modification.');
      },
    });
  }

  private handlePhotos(): void {
    const toDelete = this.photosToDelete();
    const toUpload = this.newPhotos();

    if (toDelete.length === 0 && toUpload.length === 0) {
      this.finalize();
      return;
    }

    // Supprimer les photos marquées
    const deleteOps$ = toDelete.map(p =>
      this.photoApi.supprimerPhoto(this.annonceId, p.id)
    );

    // Uploader les nouvelles
    const uploadOp$ = toUpload.length > 0
      ? [this.photoApi.uploadPhotos(this.annonceId, toUpload.map(p => p.file))]
      : [];

    const allOps$ = [...deleteOps$, ...uploadOp$];

    forkJoin(allOps$).subscribe({
      next: () => this.finalize(),
      error: () => {
        // Les modifications texte ont réussi, photos partiellement
        this.toast.info('Annonce modifiée. Certaines photos n\'ont pas pu être traitées.');
        this.finalize();
      },
    });
  }

  private finalize(): void {
    // Libérer les object URLs
    this.newPhotos().forEach(p => URL.revokeObjectURL(p.previewUrl));
    this.submitting.set(false);
    this.toast.success('Annonce mise à jour avec succès !');
    this.saved.set(true);
  }
}