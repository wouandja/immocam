import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { LocalisationApi } from '@core/services/api/localisation.api';
import { TypeBienApi } from '@core/services/api/typebien.api';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { PhotoApi } from '@core/services/api/photo.api';
import { StorageService } from '@core/services/storage.service';
import { ToastService } from '@core/services/toast.service';
import {
  LocalisationResponse,
  TypeBienResponse,
  AnnonceDashboardResponse,
} from '@core/services/models';

interface PhotoPreview {
  file: File;
  url: string;
  id: string;
}

@Component({
  selector: 'app-annonce-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; }

    /* ── Tokens ── */
    :host {
      --bg:         #F4F5F7;
      --card:       #FFFFFF;
      --border:     #E8EAF0;
      --brand:      #0F172A;
      --brand2:     #1E293B;
      --accent:     #F97316;
      --accent2:    #EA580C;
      --green:      #16A34A;
      --green2:     #15803D;
      --text:       #0F172A;
      --muted:      #64748B;
      --faint:      #94A3B8;
      --error:      #DC2626;
      --r-xl:       20px;
      --r-lg:       14px;
      --r-md:       10px;
      --r-sm:       8px;
      --shadow:     0 1px 3px rgba(0,0,0,.06), 0 0 0 .5px rgba(0,0,0,.05);
      --shadow-lg:  0 8px 32px rgba(0,0,0,.10), 0 0 0 .5px rgba(0,0,0,.04);
    }

    /* ── Layout ── */
    .shell {
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      font-family: 'DM Sans', system-ui, sans-serif;
    }

    /* ── Topbar ── */
    .topbar {
      position: sticky; top: 0; z-index: 50;
      height: 58px;
      background: rgba(255,255,255,.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 18px; gap: 12px;
    }
    .topbar-btn {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer;
      font: 600 13px/1 inherit;
      color: var(--muted); padding: 0;
      transition: color .15s; width: 70px;
    }
    .topbar-btn:hover { color: var(--text); }
    .topbar-btn svg { width: 17px; height: 17px; flex-shrink: 0; }
    .topbar-title {
      font-size: 15px; font-weight: 700;
      color: var(--text); letter-spacing: -.3px;
    }

    /* ── Progress bar ── */
    .progress-wrap {
      padding: 18px 20px 4px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .steps-row {
      display: flex; align-items: center; gap: 0; width: 100%; max-width: 480px;
    }
    .step-item {
      display: flex; flex-direction: column; align-items: center; flex: 1;
    }
    .step-dot {
      width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      transition: all .25s cubic-bezier(.34,1.56,.64,1);
      position: relative; z-index: 1;
    }
    .step-dot.done   { background: var(--green); color: #fff; }
    .step-dot.active {
      background: var(--accent); color: #fff;
      box-shadow: 0 0 0 5px rgba(249,115,22,.18);
      transform: scale(1.08);
    }
    .step-dot.idle   { background: #E2E8F0; color: var(--faint); }
    .step-dot svg    { width: 13px; height: 13px; }
    .step-label {
      font-size: 10px; font-weight: 600; margin-top: 5px;
      color: var(--faint); text-transform: uppercase; letter-spacing: .06em;
      transition: color .2s;
    }
    .step-label.active { color: var(--accent); }
    .step-label.done   { color: var(--green); }
    .step-connector {
      flex: 1; height: 2px; border-radius: 2px;
      margin-bottom: 18px; transition: background .3s;
      background: #E2E8F0;
    }
    .step-connector.done { background: var(--green); }

    /* ── Card ── */
    .card-wrap {
      flex: 1; padding: 8px 14px 40px;
      display: flex; flex-direction: column; align-items: center;
    }
    .card {
      width: 100%; max-width: 480px;
      background: var(--card);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    /* ── Step body ── */
    .step-body {
      padding: 24px 22px 4px;
      animation: fadeUp .22s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .step-eyebrow {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10px; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase;
      color: var(--accent);
      background: rgba(249,115,22,.09);
      padding: 4px 10px; border-radius: 20px;
      margin-bottom: 10px;
    }
    .step-h1 {
      font-size: 22px; font-weight: 800;
      color: var(--text); letter-spacing: -.5px;
      margin-bottom: 4px; line-height: 1.15;
    }
    .step-sub {
      font-size: 13px; color: var(--muted); margin-bottom: 22px;
    }

    /* ── Type grid ── */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px; margin-bottom: 22px;
    }
    .type-tile {
      position: relative;
      display: flex; flex-direction: column; align-items: center;
      gap: 7px; padding: 14px 8px 12px;
      border: 1.5px solid var(--border);
      border-radius: var(--r-lg);
      background: #FAFBFC;
      cursor: pointer;
      transition: all .18s;
      user-select: none; outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .type-tile:hover { border-color: #CBD5E1; background: #F8FAFC; transform: translateY(-1px); }
    .type-tile:active { transform: scale(.96); }
    .type-tile.sel {
      border-color: var(--accent);
      background: rgba(249,115,22,.05);
      transform: translateY(-1px);
    }
    .type-ico {
      width: 38px; height: 38px; border-radius: 11px;
      background: #F1F5F9;
      display: flex; align-items: center; justify-content: center;
      transition: background .18s;
    }
    .type-ico svg { width: 19px; height: 19px; color: var(--muted); transition: color .18s; }
    .type-tile.sel .type-ico { background: var(--accent); }
    .type-tile.sel .type-ico svg { color: #fff; }
    .type-name {
      font-size: 10.5px; font-weight: 600;
      color: var(--muted); text-align: center;
      line-height: 1.3; transition: color .18s;
    }
    .type-tile.sel .type-name { color: var(--accent2); }
    .type-check {
      position: absolute; top: 5px; right: 5px;
      width: 16px; height: 16px; border-radius: 50%;
      background: var(--green);
      display: flex; align-items: center; justify-content: center;
    }
    .type-check svg { width: 9px; height: 9px; color: #fff; }

    /* ── Fields ── */
    .field { margin-bottom: 15px; }
    .field:last-child { margin-bottom: 0; }
    .field-label {
      display: block; font-size: 12px; font-weight: 700;
      color: var(--brand2); margin-bottom: 6px; letter-spacing: -.01em;
    }
    .field-label .opt { font-weight: 400; color: var(--faint); }
    .input-wrap { position: relative; }

    .input {
      display: block; width: 100%; height: 50px;
      padding: 0 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--r-md);
      background: #FAFBFD;
      color: var(--text);
      font: 14px/1 'DM Sans', system-ui, sans-serif;
      outline: none; box-sizing: border-box;
      transition: border-color .15s, box-shadow .15s, background .15s;
      appearance: none; -webkit-appearance: none;
    }
    .input::placeholder { color: var(--faint); }
    .input:focus {
      border-color: var(--accent);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(249,115,22,.12);
    }
    .input.err { border-color: var(--error); box-shadow: 0 0 0 3px rgba(220,38,38,.08); }
    .input.ok  { border-color: var(--green); }
    .input.with-l  { padding-left: 44px; }
    .input.with-r  { padding-right: 60px; }
    .input.with-wa { padding-left: 90px; }

    .ico-l {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      display: flex; pointer-events: none;
    }
    .ico-l svg { width: 17px; height: 17px; color: var(--faint); }
    .ico-r-txt {
      position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
      font-size: 11px; font-weight: 700; color: var(--faint);
      pointer-events: none;
    }
    .wa-pfx {
      position: absolute; left: 0; top: 0; bottom: 0;
      display: flex; align-items: center; gap: 5px;
      padding: 0 12px 0 13px;
      border-right: 1.5px solid var(--border);
      font-size: 12px; font-weight: 700; color: var(--text);
      pointer-events: none; white-space: nowrap;
    }
    .wa-pfx svg { width: 14px; height: 14px; }

    textarea.input {
      height: auto; padding: 13px 14px;
      resize: none; line-height: 1.6;
    }
    .char-count {
      position: absolute; bottom: 10px; right: 12px;
      font-size: 11px; color: var(--faint); pointer-events: none;
    }
    .char-count.warn { color: #F59E0B; font-weight: 700; }
    .field-msg {
      display: flex; align-items: center; gap: 5px;
      font-size: 11.5px; margin-top: 5px; line-height: 1.4;
    }
    .field-msg svg { width: 13px; height: 13px; flex-shrink: 0; }
    .field-msg.err  { color: var(--error); }
    .field-msg.hint { color: var(--muted); }

    .price-display {
      display: flex; align-items: center; gap: 6px;
      font-size: 18px; font-weight: 800; color: var(--text);
      margin-top: 8px; letter-spacing: -.3px;
    }
    .price-display .unit {
      font-size: 12px; font-weight: 600; color: var(--muted); margin-top: 2px;
    }

    /* ── Separator ── */
    .sep {
      display: flex; align-items: center; gap: 8px;
      font-size: 10px; font-weight: 700;
      color: var(--faint); text-transform: uppercase; letter-spacing: .08em;
      margin: 18px 0 14px;
    }
    .sep::before, .sep::after {
      content: ''; flex: 1; height: 1px; background: var(--border);
    }

    /* ── Autocomplete ── */
    .ac-wrap { position: relative; }
    .ac-drop {
      position: absolute; top: calc(100% + 5px); left: 0; right: 0;
      z-index: 60; background: #fff;
      border: 1.5px solid var(--border);
      border-radius: var(--r-lg);
      box-shadow: 0 10px 28px rgba(0,0,0,.12);
      overflow: hidden; max-height: 220px; overflow-y: auto;
    }
    .ac-item {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 12px 14px;
      background: none; border: none; border-bottom: 1px solid #F1F5F9;
      font: 13px/1 'DM Sans', system-ui, sans-serif; color: var(--text);
      text-align: left; cursor: pointer; transition: background .1s;
    }
    .ac-item:last-child { border-bottom: none; }
    .ac-item:hover { background: #F8FAFC; }
    .ac-item svg { width: 14px; height: 14px; color: var(--faint); flex-shrink: 0; }

    /* ── Photos ── */
    .photo-upload-label {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px;
      border: 2px dashed #CBD5E1;
      border-radius: var(--r-lg);
      padding: 28px 16px;
      cursor: pointer;
      transition: border-color .18s, background .18s;
      text-align: center;
      -webkit-tap-highlight-color: transparent;
    }
    .photo-upload-label:hover { border-color: var(--accent); background: rgba(249,115,22,.03); }
    .photo-file-input {
      position: absolute; width: 1px; height: 1px;
      opacity: 0; overflow: hidden; clip: rect(0 0 0 0);
      white-space: nowrap; pointer-events: none;
    }
    .upload-icon {
      width: 52px; height: 52px; background: rgba(249,115,22,.1);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .upload-icon svg { width: 24px; height: 24px; color: var(--accent); }
    .upload-title { font-size: 14px; font-weight: 700; color: var(--text); }
    .upload-sub   { font-size: 12px; color: var(--faint); }

    .photo-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .photo-count-pill {
      font-size: 11px; font-weight: 700; color: #fff;
      background: var(--accent); padding: 3px 9px; border-radius: 20px;
    }

    .photo-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 8px; margin-top: 12px;
    }
    .photo-cell {
      position: relative; aspect-ratio: 1;
      border-radius: var(--r-md); overflow: hidden; background: #F1F5F9;
    }
    .photo-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-badge {
      position: absolute; bottom: 4px; left: 4px;
      font-size: 8.5px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase;
      background: var(--accent); color: #fff;
      padding: 2px 6px; border-radius: 5px;
    }
    .photo-del {
      position: absolute; top: 4px; right: 4px;
      width: 22px; height: 22px; border-radius: 50%;
      background: rgba(0,0,0,.6); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; opacity: 0; transition: opacity .15s;
    }
    .photo-del svg { width: 11px; height: 11px; }
    .photo-cell:hover .photo-del { opacity: 1; }

    /* ── Recap ── */
    .recap {
      border: 1.5px solid var(--border);
      border-radius: var(--r-lg); overflow: hidden;
    }
    .recap-row {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 14px;
      border-bottom: 1px solid #F1F5F9;
    }
    .recap-row:last-child { border-bottom: none; }
    .recap-ico {
      width: 34px; height: 34px; border-radius: 9px;
      background: #F8FAFC; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .recap-ico svg { width: 15px; height: 15px; color: var(--muted); }
    .recap-lbl { font-size: 11px; color: var(--faint); margin-bottom: 2px; }
    .recap-val { font-size: 13px; font-weight: 700; color: var(--text); }

    /* ── Error banner ── */
    .err-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: #FEF2F2; border: 1px solid #FCA5A5;
      border-radius: var(--r-sm); padding: 12px 14px;
      margin: 16px 0 0;
      font-size: 13px; color: #B91C1C; font-weight: 500; line-height: 1.5;
    }
    .err-banner svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    /* ── Footer ── */
    .card-foot {
      display: flex; gap: 10px;
      padding: 16px 22px;
      border-top: 1px solid #F1F5F9;
      margin-top: 22px;
    }
    .btn-back {
      height: 50px; padding: 0 16px;
      background: #F8FAFC; color: var(--muted);
      border: 1.5px solid var(--border); border-radius: var(--r-md);
      font: 600 13px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      flex-shrink: 0; transition: all .15s;
    }
    .btn-back:hover { background: #F1F5F9; color: var(--text); border-color: #CBD5E1; }
    .btn-back svg { width: 15px; height: 15px; }

    .btn-next {
      flex: 1; height: 50px;
      background: var(--text); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .15s, transform .1s;
      letter-spacing: -.1px;
    }
    .btn-next:hover:not(:disabled) { background: var(--brand2); }
    .btn-next:active:not(:disabled) { transform: scale(.99); }
    .btn-next:disabled { opacity: .35; cursor: not-allowed; }
    .btn-next svg { width: 16px; height: 16px; }

    .btn-publish {
      flex: 1; height: 50px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
      color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity .15s, transform .1s;
      box-shadow: 0 4px 14px rgba(249,115,22,.3);
    }
    .btn-publish:hover:not(:disabled) { opacity: .92; }
    .btn-publish:active:not(:disabled) { transform: scale(.99); }
    .btn-publish:disabled { opacity: .4; cursor: not-allowed; }
    .btn-publish svg { width: 16px; height: 16px; }

    /* ── Success ── */
    .success-wrap {
      display: flex; flex-direction: column; align-items: center;
      padding: 0 22px 0;
      animation: fadeUp .35s ease;
    }

    /* Hero image area */
    .success-hero {
      width: 100%; position: relative;
      background: linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%);
      padding: 52px 0 40px;
      display: flex; flex-direction: column; align-items: center; gap: 0;
      margin: 0 -22px; width: calc(100% + 44px);
    }
    .success-orbit {
      position: relative;
      width: 100px; height: 100px;
      margin-bottom: 24px;
    }
    .success-ring-outer {
      position: absolute; inset: 0;
      border-radius: 50%;
      border: 2px dashed rgba(249,115,22,.3);
      animation: rotateRing 8s linear infinite;
    }
    @keyframes rotateRing {
      to { transform: rotate(360deg); }
    }
    .success-ring-inner {
      position: absolute; inset: 14px;
      border-radius: 50%;
      background: rgba(249,115,22,.12);
    }
    .success-icon-circle {
      position: absolute; inset: 22px;
      border-radius: 50%;
      background: var(--accent);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(249,115,22,.4);
      animation: popIn .5s cubic-bezier(.34,1.56,.64,1) .1s both;
    }
    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .success-icon-circle svg { width: 26px; height: 26px; color: #fff; }

    /* Floating dots */
    .dot-1, .dot-2, .dot-3 {
      position: absolute;
      border-radius: 50%;
      background: rgba(249,115,22,.25);
    }
    .dot-1 { width: 8px; height: 8px; top: 28px; left: 30%; animation: floatDot 3s ease-in-out infinite; }
    .dot-2 { width: 6px; height: 6px; top: 56px; right: 22%; animation: floatDot 3.5s ease-in-out .4s infinite; }
    .dot-3 { width: 5px; height: 5px; bottom: 32px; left: 18%; animation: floatDot 4s ease-in-out .8s infinite; }
    @keyframes floatDot {
      0%, 100% { transform: translateY(0); opacity: .5; }
      50% { transform: translateY(-8px); opacity: 1; }
    }

    .success-headline {
      font-size: 11px; font-weight: 700;
      letter-spacing: .12em; text-transform: uppercase;
      color: var(--accent); margin-bottom: 8px;
    }
    .success-title {
      font-size: 28px; font-weight: 900;
      color: var(--text); letter-spacing: -.6px;
      line-height: 1.1; margin-bottom: 0; text-align: center;
    }

    /* Content below hero */
    .success-content {
      padding: 28px 0 0; width: 100%;
      display: flex; flex-direction: column; align-items: center; gap: 0;
    }
    .success-body {
      font-size: 14px; color: var(--muted);
      line-height: 1.65; text-align: center; margin-bottom: 28px;
    }

    /* Preview card */
    .preview-card {
      width: 100%;
      border: 1.5px solid var(--border);
      border-radius: var(--r-lg);
      overflow: hidden;
      margin-bottom: 28px;
    }
    .preview-img-row {
      height: 140px;
      background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .preview-img-row img {
      width: 100%; height: 100%; object-fit: cover;
      display: block;
    }
    .preview-img-placeholder {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .preview-img-placeholder svg { width: 32px; height: 32px; color: var(--faint); }
    .preview-img-placeholder span { font-size: 12px; color: var(--faint); }
    .preview-badge {
      position: absolute; top: 10px; left: 10px;
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
      background: var(--green); color: #fff;
      padding: 3px 9px; border-radius: 20px;
    }
    .preview-body {
      padding: 14px 16px;
    }
    .preview-type {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: var(--accent); margin-bottom: 4px;
    }
    .preview-titre {
      font-size: 16px; font-weight: 800; color: var(--text);
      letter-spacing: -.3px; margin-bottom: 4px;
    }
    .preview-lieu {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--muted); margin-bottom: 10px;
    }
    .preview-lieu svg { width: 12px; height: 12px; }
    .preview-prix {
      font-size: 18px; font-weight: 900; color: var(--text); letter-spacing: -.4px;
    }
    .preview-prix .fcfa { font-size: 12px; font-weight: 600; color: var(--muted); margin-left: 3px; }

    /* Action buttons */
    .success-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; padding-bottom: 36px; }
    .btn-see-primary {
      width: 100%; height: 52px;
      background: var(--accent); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 15px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all .15s;
      box-shadow: 0 4px 14px rgba(249,115,22,.3);
    }
    .btn-see-primary:hover { background: var(--accent2); }
    .btn-see-primary svg { width: 17px; height: 17px; }
    .btn-see-secondary {
      width: 100%; height: 44px;
      background: none; color: var(--muted);
      border: 1.5px solid var(--border); border-radius: var(--r-md);
      font: 600 13px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all .15s;
    }
    .btn-see-secondary:hover { border-color: #CBD5E1; color: var(--text); background: #F8FAFC; }
    .btn-see-secondary svg { width: 15px; height: 15px; }

    /* ── Spin ── */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin .7s linear infinite; display: inline-flex; }

    /* ── Responsive ── */
    @media (max-width: 400px) {
      .step-h1 { font-size: 20px; }
      .photo-grid { grid-template-columns: repeat(3, 1fr); }
      .step-body { padding: 20px 16px 4px; }
      .card-foot { padding: 14px 16px; }
      .success-wrap { padding: 0 16px 0; }
      .success-hero { margin: 0 -16px; width: calc(100% + 32px); }
    }
  `],
  template: `
    <div class="shell">

      <!-- ── Topbar ── -->
      <header class="topbar">
        <button type="button" class="topbar-btn" (click)="goBack()">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Retour
        </button>
        <span class="topbar-title">Nouvelle annonce</span>
        <div style="width:70px"></div>
      </header>

      <!-- ── Progress stepper ── -->
      @if (!published()) {
        <nav class="progress-wrap" aria-label="Étapes">
          <div class="steps-row">
            @for (s of steps; track s.n; let i = $index) {
              <div class="step-item">
                <div
                  class="step-dot"
                  [class.done]="currentStep() > s.n"
                  [class.active]="currentStep() === s.n"
                  [class.idle]="currentStep() < s.n"
                >
                  @if (currentStep() > s.n) {
                    <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  } @else { {{ s.n }} }
                </div>
                <span
                  class="step-label"
                  [class.active]="currentStep() === s.n"
                  [class.done]="currentStep() > s.n"
                >{{ s.label }}</span>
              </div>
              @if (i < steps.length - 1) {
                <div class="step-connector" [class.done]="currentStep() > s.n"></div>
              }
            }
          </div>
        </nav>
      }

      <!-- ── Card ── -->
      <div class="card-wrap">

        <!-- SUCCESS STATE -->
        @if (published()) {
          <div class="card">
            <div class="success-wrap">

              <!-- Hero -->
              <div class="success-hero">
                <div class="dot-1"></div>
                <div class="dot-2"></div>
                <div class="dot-3"></div>
                <div class="success-orbit">
                  <div class="success-ring-outer"></div>
                  <div class="success-ring-inner"></div>
                  <div class="success-icon-circle">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
                <p class="success-headline">Publication réussie</p>
                <p class="success-title">Votre annonce<br>est en ligne !</p>
              </div>

              <!-- Content -->
              <div class="success-content">
                <p class="success-body">
                  Elle est désormais visible par des milliers de personnes. Vous pouvez la consulter et la gérer depuis votre tableau de bord.
                </p>

                <!-- Mini preview de l'annonce -->
                <div class="preview-card">
                  <div class="preview-img-row">
                    @if (successFirstPhotoUrl()) {
                      <img [src]="successFirstPhotoUrl()" alt="Photo principale"/>
                    } @else {
                      <div class="preview-img-placeholder">
                        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span>Aucune photo ajoutée</span>
                      </div>
                    }
                    <span class="preview-badge">En ligne</span>
                  </div>
                  <div class="preview-body">
                    <div class="preview-type">{{ recapTypeBien() }}</div>
                    <div class="preview-titre">{{ recapLieu() }}</div>
                    <div class="preview-lieu">
                      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      </svg>
                      {{ recapLieu() }}
                    </div>
                    @if (prixPreview()) {
                      <div class="preview-prix">
                        {{ prixPreview() }}<span class="fcfa">/ mois</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="success-actions">
                  <button type="button" class="btn-see-primary" (click)="goToAnnonce()">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    Voir mon annonce
                  </button>
                  <button type="button" class="btn-see-secondary" (click)="goBack()">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                    </svg>
                    Retour aux annonces
                  </button>
                </div>
              </div>

            </div>
          </div>

        } @else {

          <!-- FORM STEPS -->
          <div class="card">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

              <!-- ════ ÉTAPE 1 ════ -->
              @if (currentStep() === 1) {
                <div class="step-body">
                  <span class="step-eyebrow">Étape 1 sur 3</span>
                  <p class="step-h1">Quel bien<br>proposez-vous ?</p>
                  <p class="step-sub">Type de bien et localisation</p>

                  <div class="type-grid" role="radiogroup" aria-label="Type de bien">
                    @for (t of typesBiens(); track t.id) {
                      <div
                        class="type-tile"
                        [class.sel]="form.value.typeBienId === t.id"
                        (click)="selectType(t.id)"
                        (keydown.enter)="$event.preventDefault(); selectType(t.id)"
                        (keydown.space)="$event.preventDefault(); selectType(t.id)"
                        role="radio"
                        [attr.aria-checked]="form.value.typeBienId === t.id"
                        tabindex="0"
                      >
                        <div class="type-ico">
                          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="getTypeIcon(t.libelle)"/>
                          </svg>
                        </div>
                        <span class="type-name">{{ t.libelle }}</span>
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

                  <div class="sep">Localisation</div>

                  <!-- Ville -->
                  <div class="field">
                    <label class="field-label" for="f-ville">Ville</label>
                    <div class="input-wrap">
                      <span class="ico-l">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                      </span>
                      <select id="f-ville" class="input with-l" formControlName="ville" (change)="onVilleChange($event)">
                        <option value="">Sélectionner une ville…</option>
                        @for (v of villes(); track v) {
                          <option [value]="v">{{ v }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <!-- Quartier avec autocomplete -->
                  <div class="field">
                    <label class="field-label" for="f-quartier">Quartier</label>
                    <div class="ac-wrap">
                      <div class="input-wrap">
                        <span class="ico-l">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                        </span>
                        <input
                          id="f-quartier"
                          type="text"
                          class="input with-l"
                          formControlName="quartier"
                          placeholder="Ex : Akwa, Bonanjo, Makepe…"
                          autocomplete="off"
                          (input)="onQuartierInput()"
                          (focus)="showSuggestions.set(true)"
                          (blur)="onQuartierBlur()"
                        />
                      </div>
                      @if (showSuggestions() && filteredQuartiers().length > 0) {
                        <div class="ac-drop">
                          @for (q of filteredQuartiers(); track q) {
                            <button type="button" class="ac-item" (mousedown)="selectQuartier(q)">
                              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
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
                  <button
                    type="button"
                    class="btn-next"
                    [disabled]="!form.value.typeBienId || !form.value.quartier"
                    (click)="nextStep()"
                  >
                    Continuer
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              }

              <!-- ════ ÉTAPE 2 ════ -->
              @if (currentStep() === 2) {
                <div class="step-body">
                  <span class="step-eyebrow">Étape 2 sur 3</span>
                  <p class="step-h1">Décrivez<br>votre bien</p>
                  <p class="step-sub">Prix, description et contact</p>

                  <!-- Prix avec formatage -->
                  <div class="field">
                    <label class="field-label" for="f-prix">Loyer mensuel</label>
                    <div class="input-wrap">
                      <span class="ico-l">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </span>
                      <input
                        id="f-prix"
                        type="text"
                        inputmode="numeric"
                        class="input with-l with-r"
                        [class.ok]="prixValide()"
                        [class.err]="isErr('prix')"
                        [value]="prixDisplay()"
                        placeholder="75 000"
                        (input)="onPrixInput($event)"
                        (blur)="form.get('prix')!.markAsTouched()"
                      />
                      <span class="ico-r-txt">FCFA</span>
                    </div>
                    @if (prixValide()) {
                      <div class="price-display">
                        {{ prixPreview() }}
                        <span class="unit">par mois</span>
                      </div>
                    }
                    @if (isErr('prix')) {
                      <div class="field-msg err">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                        </svg>
                        Minimum 1 000 FCFA requis
                      </div>
                    }
                  </div>

                  <!-- Description -->
                  <div class="field">
                    <label class="field-label" for="f-desc">Description</label>
                    <div class="input-wrap">
                      <textarea
                        id="f-desc"
                        class="input"
                        [class.err]="isErr('description')"
                        formControlName="description"
                        rows="5"
                        maxlength="1000"
                        placeholder="Superficie, équipements, état du bien, disponibilité, charges incluses…"
                      ></textarea>
                      <span class="char-count" [class.warn]="descLen() > 900">{{ descLen() }}/1000</span>
                    </div>
                    @if (descLen() > 0 && descLen() < 30) {
                      <div class="field-msg err">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                        </svg>
                        Encore {{ 30 - descLen() }} caractère(s)
                      </div>
                    } @else {
                      <div class="field-msg hint">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <path stroke-linecap="round" d="M12 16v-4m0-4h.01"/>
                        </svg>
                        Minimum 30 caractères
                      </div>
                    }
                  </div>

                  <!-- WhatsApp avec formatage -->
                  <div class="field">
                    <label class="field-label" for="f-wa">
                      WhatsApp <span class="opt">(optionnel)</span>
                    </label>
                    <div class="input-wrap">
                      <span class="wa-pfx">
                        <svg viewBox="0 0 24 24" fill="#25D366" width="14" height="14">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        </svg>
                        +237
                      </span>
                      <input
                        id="f-wa"
                        type="tel"
                        inputmode="numeric"
                        class="input with-wa"
                        [class.err]="isErr('whatsappRaw')"
                        [value]="waDisplay()"
                        placeholder="6XX XX XX XX"
                        (input)="onWaInput($event)"
                        (blur)="form.get('whatsappRaw')!.markAsTouched()"
                      />
                    </div>
                    <div class="field-msg hint">
                      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      Jamais affiché en clair — format : 6XX XX XX XX
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
                  <button
                    type="button"
                    class="btn-next"
                    [disabled]="step2Invalid()"
                    (click)="nextStep()"
                  >
                    Continuer
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              }

              <!-- ════ ÉTAPE 3 ════ -->
              @if (currentStep() === 3) {
                <div class="step-body">
                  <span class="step-eyebrow">Étape 3 sur 3</span>
                  <p class="step-h1">Photos &<br>confirmation</p>
                  <p class="step-sub">Vérifiez avant de publier</p>

                  <!-- Upload photos -->
                  <div class="photo-header">
                    <span style="font-size:12px;font-weight:700;color:var(--text)">Photos</span>
                    <span class="photo-count-pill">{{ photos().length }} / 4</span>
                  </div>

                  @if (photos().length < 4) {
                    <label class="photo-upload-label" for="photo-input">
                      <div class="upload-icon">
                        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <span class="upload-title">Ajouter des photos</span>
                      <span class="upload-sub">JPG, PNG, WebP · max 4 Mo chacune</span>
                    </label>
                    <input
                      id="photo-input"
                      type="file"
                      class="photo-file-input"
                      accept="image/jpeg,image/png,image/webp,image/*"
                      multiple
                      (change)="onFilesSelected($event)"
                    />
                  }

                  @if (photos().length > 0) {
                    <div class="photo-grid">
                      @for (p of photos(); track p.id; let i = $index) {
                        <div class="photo-cell">
                          <img [src]="p.url" [alt]="'Photo ' + (i+1)" loading="lazy"/>
                          @if (i === 0) { <span class="photo-badge">Principale</span> }
                          <button type="button" class="photo-del" (click)="removePhoto(p.id)" [attr.aria-label]="'Supprimer photo ' + (i+1)">
                            <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  }

                  <div class="sep" style="margin-top:22px">Récapitulatif</div>

                  <div class="recap">
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
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
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
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1"/>
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
                          {{ photos().length === 0 ? 'Aucune — à ajouter plus tard' : photos().length + ' photo' + (photos().length > 1 ? 's' : '') + ' ajoutée' + (photos().length > 1 ? 's' : '') }}
                        </div>
                      </div>
                    </div>
                  </div>

                  @if (submitError()) {
                    <div class="err-banner">
                      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                      </svg>
                      {{ submitError() }}
                    </div>
                  }
                </div>

                <div class="card-foot">
                  <button type="button" class="btn-back" (click)="prevStep()">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Retour
                  </button>
                  <button type="submit" class="btn-publish" [disabled]="submitting()">
                    @if (submitting()) {
                      <span class="spin">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10"/>
                        </svg>
                      </span>
                      Publication…
                    } @else {
                      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                      </svg>
                      Publier maintenant
                    }
                  </button>
                </div>
              }

            </form>
          </div>
        }

      </div>
    </div>
  `,
})
export class AnnonceCreateComponent implements OnInit, OnDestroy {

  /* ── Services ── */
  private readonly locApi      = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly annonceApi  = inject(AnnonceApi);
  private readonly photoApi    = inject(PhotoApi);
  private readonly storage     = inject(StorageService);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  private readonly destroy$    = new Subject<void>();

  private readonly DRAFT_KEY = 'draft_annonce_v5';

  /* ── State ── */
  readonly currentStep     = signal(1);
  readonly submitting      = signal(false);
  readonly submitError     = signal<string | null>(null);
  readonly published       = signal(false);
  readonly publishedId     = signal<number | null>(null);
  readonly typesBiens      = signal<TypeBienResponse[]>([]);
  readonly villesAvecId    = signal<{ id: number; ville: string }[]>([]);
  readonly villes          = computed(() => this.villesAvecId().map(v => v.ville));
  readonly allQuartiers    = signal<string[]>([]);
  readonly photos          = signal<PhotoPreview[]>([]);
  readonly showSuggestions = signal(false);
  readonly formValue       = signal<any>({});

  /* Affichage formaté des champs contrôlés manuellement */
  readonly prixDisplay = signal('');
  readonly waDisplay   = signal('');
  /* Valeur numérique brute du prix */
  private prixRaw = signal<number | null>(null);

  readonly steps = [
    { n: 1, label: 'Bien & lieu' },
    { n: 2, label: 'Détails' },
    { n: 3, label: 'Photos' },
  ];

  /* ── Formulaire ── */
  readonly form = this.fb.group({
    typeBienId:     [null as number | null, Validators.required],
    ville:          [''],
    localisationId: [null as number | null, Validators.required],
    quartier:       ['', Validators.required],
    description:    ['', [Validators.required, Validators.minLength(30), Validators.maxLength(1000)]],
    prix:           [null as number | null, [Validators.required, Validators.min(1000)]],
    whatsappRaw:    [''],
  });

  /* ── Computed ── */
  readonly descLen = computed(() => (this.formValue()?.description ?? '').length);

  readonly prixValide = computed(() => {
    const p = this.formValue()?.prix;
    return p != null && p >= 1000;
  });

  readonly prixPreview = computed(() => {
    const p = this.formValue()?.prix;
    if (!p || p < 1000) return null;
    /* Séparateur d'espaces (pas de virgule) */
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(p) + ' FCFA';
  });

  readonly filteredQuartiers = computed(() => {
    const s = (this.formValue()?.quartier ?? '').toLowerCase().trim();
    const all = this.allQuartiers();
    return (s ? all.filter(q => q.toLowerCase().includes(s)) : all).slice(0, 8);
  });

  readonly recapTypeBien = computed(
    () => this.typesBiens().find(t => t.id === this.formValue()?.typeBienId)?.libelle ?? ''
  );

  readonly recapLieu = computed(() => {
    const q = this.formValue()?.quartier ?? '';
    const v = this.formValue()?.ville ?? '';
    return q && v ? `${q}, ${v}` : v || q || '';
  });

  readonly step2Invalid = computed(() => {
    const v = this.formValue();
    if (!v) return true;
    const descOk = v.description && v.description.length >= 30;
    const prixOk = v.prix && v.prix >= 1000;
    return !descOk || !prixOk;
  });

  /** URL de la première photo pour la preview succès */
  readonly successFirstPhotoUrl = signal<string | null>(null);

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.typeBienApi.getAll().subscribe(r => {
      const types = (r.data ?? []).filter((t: TypeBienResponse) => t.estActif !== false);
      this.typesBiens.set(types);
    });

    this.locApi.getVillesAvecId().subscribe(r => {
      this.villesAvecId.set(r.data ?? []);
      this.restoreDraft();
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.formValue.set(this.form.getRawValue());
    });

    this.form.valueChanges.pipe(debounceTime(600), takeUntil(this.destroy$)).subscribe(() => {
      this.saveDraft();
    });

    this.formValue.set(this.form.getRawValue());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.photos().forEach(p => URL.revokeObjectURL(p.url));
  }

  /* ─────────────────────────────────────────
     PRIX — formatage en temps réel
     Séparateur d'espaces (jamais virgule) :
       75000   →  "75 000"
       1500000 →  "1 500 000"
     Chiffres seulement acceptés.
  ───────────────────────────────────────── */
  onPrixInput(event: Event): void {
    const el  = event.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, '');   // chiffres seulement
    const num = raw ? parseInt(raw, 10) : null;

    /* Formatage avec espace comme séparateur de milliers */
    const formatted = num != null
      ? new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
      : '';

    /* Mettre à jour l'affichage sans décaler le curseur */
    el.value = formatted;
    this.prixDisplay.set(formatted);

    /* Mettre à jour le FormControl avec la valeur numérique */
    this.form.patchValue({ prix: num });
    this.form.get('prix')!.markAsDirty();
  }

  /* ─────────────────────────────────────────
     WHATSAPP — formatage XXX XX XX XX
     Chiffres seulement, format camerounais.
     Ex: 699123456 → "699 12 34 56"
         6 12 34 56 → affiché au fur et à mesure
  ───────────────────────────────────────── */
  onWaInput(event: Event): void {
    const el     = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 9); // max 9 chiffres cameroun

    /* Formatage progressif : XXX XX XX XX */
    let formatted = '';
    if (digits.length <= 3) {
      formatted = digits;
    } else if (digits.length <= 5) {
      formatted = digits.slice(0, 3) + ' ' + digits.slice(3);
    } else if (digits.length <= 7) {
      formatted = digits.slice(0, 3) + ' ' + digits.slice(3, 5) + ' ' + digits.slice(5);
    } else {
      formatted = digits.slice(0, 3) + ' ' + digits.slice(3, 5) + ' ' + digits.slice(5, 7) + ' ' + digits.slice(7);
    }

    el.value = formatted;
    this.waDisplay.set(formatted);
    this.form.patchValue({ whatsappRaw: digits });
    this.form.get('whatsappRaw')!.markAsDirty();
  }

  /* ── Draft persistance ── */
  private saveDraft(): void {
    try {
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(this.form.getRawValue()));
    } catch { /* ignore */ }
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(this.DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      this.form.patchValue(draft);
      if (draft.prix) {
        const formatted = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(draft.prix);
        this.prixDisplay.set(formatted);
      }
      if (draft.whatsappRaw) {
        const d = (draft.whatsappRaw as string).replace(/\D/g, '').slice(0, 9);
        let f = '';
        if (d.length <= 3) f = d;
        else if (d.length <= 5) f = d.slice(0, 3) + ' ' + d.slice(3);
        else if (d.length <= 7) f = d.slice(0, 3) + ' ' + d.slice(3, 5) + ' ' + d.slice(5);
        else f = d.slice(0, 3) + ' ' + d.slice(3, 5) + ' ' + d.slice(5, 7) + ' ' + d.slice(7);
        this.waDisplay.set(f);
      }
      if (draft.ville) {
        const found = this.villesAvecId().find(v => v.ville === draft.ville);
        if (found) this.form.patchValue({ localisationId: found.id });
        this.loadQuartiers(draft.ville);
      }
      this.formValue.set(this.form.getRawValue());
    } catch { /* ignore */ }
  }

  private clearDraft(): void {
    try { localStorage.removeItem(this.DRAFT_KEY); } catch { /* ignore */ }
  }

  /* ── Localisation ── */
  onVilleChange(event: Event): void {
    const villeNom = (event.target as HTMLSelectElement).value;
    this.form.patchValue({ localisationId: null, quartier: '' });
    this.allQuartiers.set([]);
    this.showSuggestions.set(false);
    if (villeNom) {
      const found = this.villesAvecId().find(v => v.ville === villeNom);
      if (found) this.form.patchValue({ localisationId: found.id });
      this.loadQuartiers(villeNom);
    }
  }

  private loadQuartiers(ville: string): void {
    this.locApi.getQuartiers(ville).subscribe(r => this.allQuartiers.set(r.data ?? []));
  }

  onQuartierInput(): void  { this.showSuggestions.set(true); }
  onQuartierBlur(): void   { setTimeout(() => this.showSuggestions.set(false), 150); }
  selectQuartier(q: string): void {
    this.form.patchValue({ quartier: q });
    this.showSuggestions.set(false);
  }
  selectType(id: number): void { this.form.patchValue({ typeBienId: id }); }

  /* ── Photos ── */
  onFilesSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
    }
    input.value = '';
  }

  private addFiles(files: File[]): void {
    const remaining = 4 - this.photos().length;
    if (remaining <= 0) { this.toast.info('Maximum 4 photos'); return; }
    const valid = files.filter(f => {
      const okType = ['image/jpeg','image/png','image/webp'].includes(f.type) || f.type.startsWith('image/');
      if (!okType) { this.toast.error(`${f.name} : format non supporté`); return false; }
      if (f.size > 4 * 1024 * 1024) { this.toast.error(`${f.name} : max 4 Mo`); return false; }
      return true;
    }).slice(0, remaining);

    this.photos.update(p => [
      ...p,
      ...valid.map(f => ({ file: f, url: URL.createObjectURL(f), id: crypto.randomUUID() })),
    ]);
  }

  removePhoto(id: string): void {
    const p = this.photos().find(x => x.id === id);
    if (p) URL.revokeObjectURL(p.url);
    this.photos.update(list => list.filter(x => x.id !== id));
  }

  /* ── Navigation ── */
  nextStep(): void { if (this.currentStep() < 3) this.currentStep.update(v => v + 1); }
  prevStep(): void { if (this.currentStep() > 1)  this.currentStep.update(v => v - 1); }
  goBack(): void   { this.router.navigate(['/annonces']); }
  goToAnnonce(): void {
    this.router.navigate(this.publishedId() ? ['/annonces', this.publishedId()] : ['/annonces']);
  }

  isErr(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c?.invalid && c?.touched);
  }

  getTypeIcon(nom: string): string {
    const n = (nom ?? '').toLowerCase();
    if (n.includes('appartement'))
      return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
    if (n.includes('studio'))
      return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
    if (n.includes('villa'))
      return 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z';
    if (n.includes('maison') || n.includes('duplex'))
      return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
    if (n.includes('bureau'))
      return 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
    if (n.includes('boutique') || n.includes('commerce'))
      return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5';
    if (n.includes('chambre'))
      return 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
    if (n.includes('terrain'))
      return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
    return 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z';
  }

  /* ── Soumission ── */
  onSubmit(): void {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    this.submitError.set(null);
    this.submitting.set(true);

    const v       = this.form.getRawValue();
    const digits  = (v.whatsappRaw ?? '').replace(/\D/g, '');
    const whatsApp = digits.length >= 9
      ? (digits.startsWith('237') ? `+${digits}` : `+237${digits}`)
      : undefined;

    /* Sauvegarder la première photo pour la preview succès */
    if (this.photos().length > 0) {
      this.successFirstPhotoUrl.set(this.photos()[0].url);
    }

    this.annonceApi.publier({
      typeBienId:     v.typeBienId!,
      localisationId: v.localisationId!,
      quartier:       (v.quartier ?? '').trim(),
      description:    v.description!,
      prix:           v.prix!,
      ...(whatsApp ? { numeroWhatsApp: whatsApp } : {}),
    }).subscribe({
      next: (res) => {
        const id = (res.data as AnnonceDashboardResponse).id;
        const finish = () => {
          this.submitting.set(false);
          this.clearDraft();
          this.publishedId.set(id);
          this.published.set(true);
          this.toast.success('Annonce publiée avec succès !');
        };
        if (this.photos().length > 0) {
          this.photoApi.uploadPhotos(id, this.photos().map(p => p.file))
            .subscribe({ next: finish, error: finish });
        } else {
          finish();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      },
    });
  }
}