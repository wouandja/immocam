import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
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
      --navy:      #0F1E45;
      --brand:     #1E2875;
      --brand2:    #3245D1;
      --brand-l:   #EEF2FF;
      --brand-m:   #C7D2FE;
      --green:     #059669;
      --green-l:   #ECFDF5;
      --red:       #DC2626;
      --red-l:     #FEF2F2;
      --amber:     #D97706;
      --text:      #0F172A;
      --text2:     #1E293B;
      --muted:     #64748B;
      --faint:     #94A3B8;
      --border:    #E2E8F0;
      --surface:   #F8FAFC;
      --card:      #FFFFFF;
      --r-xl:      22px;
      --r-lg:      14px;
      --r-md:      10px;
      --r-sm:      8px;
    }

    /* ── Shell ── */
    .shell {
      min-height: 100dvh;
      background: linear-gradient(160deg, #EEF2FF 0%, #F0F4FF 40%, #F8FAFC 100%);
      display: flex;
      flex-direction: column;
      font-family: 'DM Sans', system-ui, sans-serif;
    }

    /* ── Topbar ── */
    .topbar {
      position: sticky; top: 0; z-index: 50;
      height: 56px;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(30,40,117,.08);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; gap: 12px;
    }
    .topbar-btn {
      display: flex; align-items: center; gap: 5px;
      background: none; border: none; cursor: pointer;
      font: 600 13px/1 inherit; color: var(--muted);
      padding: 7px 10px; border-radius: 9px;
      transition: all .15s; width: 80px;
    }
    .topbar-btn:hover { background: var(--brand-l); color: var(--brand); }
    .topbar-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
    .topbar-title {
      font-size: 15px; font-weight: 800;
      color: var(--text); letter-spacing: -.4px;
    }

    /* ── Stepper ── */
    .stepper {
      padding: 16px 20px 0;
      display: flex; justify-content: center;
    }
    .steps-row {
      display: flex; align-items: center;
      width: 100%; max-width: 400px;
    }
    .step-item {
      display: flex; flex-direction: column; align-items: center; flex: 1;
    }
    .step-node {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800;
      transition: all .3s cubic-bezier(.34,1.56,.64,1);
      position: relative; z-index: 1;
    }
    .step-node.done {
      background: var(--green); color: #fff;
      box-shadow: 0 3px 10px rgba(5,150,105,.3);
    }
    .step-node.active {
      background: var(--brand); color: #fff;
      box-shadow: 0 0 0 6px rgba(30,40,117,.12), 0 4px 12px rgba(30,40,117,.3);
      transform: scale(1.1);
    }
    .step-node.idle { background: #E2E8F0; color: var(--faint); }
    .step-node svg { width: 13px; height: 13px; }
    .step-lbl {
      font-size: 10px; font-weight: 600; margin-top: 6px;
      color: var(--faint); text-transform: uppercase; letter-spacing: .07em;
      transition: color .2s;
    }
    .step-lbl.active { color: var(--brand); }
    .step-lbl.done   { color: var(--green); }
    .step-line {
      flex: 1; height: 2px; border-radius: 2px;
      margin-bottom: 20px; transition: background .4s;
      background: #E2E8F0;
    }
    .step-line.done { background: var(--green); }

    /* ── Card wrap ── */
    .card-wrap {
      flex: 1; padding: 12px 14px 48px;
      display: flex; flex-direction: column; align-items: center;
    }
    .card {
      width: 100%; max-width: 460px;
      background: var(--card);
      border-radius: var(--r-xl);
      box-shadow: 0 0 0 1px rgba(30,40,117,.07), 0 20px 60px rgba(30,40,117,.1);
      overflow: hidden;
    }

    /* ── Step header band ── */
    .step-band {
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%);
      padding: 22px 22px 20px;
      position: relative; overflow: hidden;
    }
    .step-band::after {
      content: '';
      position: absolute; right: -20px; top: -20px;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,.06);
    }
    .step-band::before {
      content: '';
      position: absolute; right: 30px; bottom: -30px;
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,.04);
    }
    .step-eyebrow {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
      color: rgba(255,255,255,.65); margin-bottom: 6px;
    }
    .step-h1 {
      font-size: 24px; font-weight: 900;
      color: #fff; letter-spacing: -.5px;
      line-height: 1.1; margin: 0 0 4px;
    }
    .step-sub {
      font-size: 13px; color: rgba(255,255,255,.6);
      margin: 0;
    }

    /* ── Step body ── */
    .step-body {
      padding: 22px 22px 6px;
      animation: fadeUp .2s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Type grid ── */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px; margin-bottom: 20px;
    }
    .type-tile {
      position: relative;
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 14px 8px 12px;
      border: 1.5px solid var(--border);
      border-radius: var(--r-lg);
      background: var(--surface);
      cursor: pointer; outline: none;
      transition: all .2s; user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .type-tile:hover { border-color: var(--brand-m); background: var(--brand-l); transform: translateY(-1px); }
    .type-tile:active { transform: scale(.95); }
    .type-tile.sel {
      border-color: var(--brand);
      background: var(--brand-l);
      box-shadow: 0 0 0 3px rgba(30,40,117,.1);
    }
    .type-ico {
      width: 38px; height: 38px; border-radius: 11px;
      background: #F1F5F9;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .type-ico svg { width: 18px; height: 18px; color: var(--muted); transition: color .2s; }
    .type-tile.sel .type-ico { background: var(--brand); }
    .type-tile.sel .type-ico svg { color: #fff; }
    .type-name {
      font-size: 10.5px; font-weight: 600; color: var(--muted);
      text-align: center; line-height: 1.3; transition: color .2s;
    }
    .type-tile.sel .type-name { color: var(--brand); font-weight: 700; }
    .type-check {
      position: absolute; top: 5px; right: 5px;
      width: 16px; height: 16px; border-radius: 50%;
      background: var(--green);
      display: flex; align-items: center; justify-content: center;
    }
    .type-check svg { width: 9px; height: 9px; color: #fff; }

    /* ── Section label ── */
    .section-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .09em; color: var(--brand);
      margin: 0 0 12px; display: flex; align-items: center; gap: 7px;
    }
    .section-label::after { content: ''; flex: 1; height: 1px; background: var(--brand-m); opacity: .5; }

    /* ── Fields ── */
    .field { margin-bottom: 14px; }
    .field:last-child { margin-bottom: 0; }
    .field-label {
      display: block; font-size: 12px; font-weight: 700;
      color: var(--text2); margin-bottom: 6px; letter-spacing: -.01em;
    }
    .field-label .opt { font-weight: 400; color: var(--faint); }
    .input-wrap { position: relative; }

    .input {
      display: block; width: 100%; height: 48px;
      padding: 0 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--r-md);
      background: var(--surface);
      color: var(--text);
      font: 14px/1 'DM Sans', system-ui, sans-serif;
      outline: none; box-sizing: border-box;
      transition: border-color .15s, box-shadow .15s, background .15s;
      appearance: none; -webkit-appearance: none;
    }
    .input::placeholder { color: var(--faint); }
    .input:focus {
      border-color: var(--brand);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(30,40,117,.1);
    }
    .input.err { border-color: var(--red); box-shadow: 0 0 0 3px rgba(220,38,38,.07); }
    .input.ok  { border-color: var(--green); }
    .input.with-l  { padding-left: 42px; }
    .input.with-r  { padding-right: 58px; }

    .ico-l {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      display: flex; pointer-events: none; color: var(--faint);
    }
    .ico-l svg { width: 16px; height: 16px; }
    .ico-r-txt {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      font-size: 11px; font-weight: 700; color: var(--faint); pointer-events: none;
    }

    textarea.input {
      height: auto; padding: 13px 14px;
      resize: none; line-height: 1.6;
    }
    .char-count {
      position: absolute; bottom: 10px; right: 12px;
      font-size: 11px; color: var(--faint); pointer-events: none;
    }
    .char-count.warn { color: var(--amber); font-weight: 700; }

    .field-msg {
      display: flex; align-items: center; gap: 5px;
      font-size: 11.5px; margin-top: 5px; line-height: 1.4;
    }
    .field-msg svg { width: 13px; height: 13px; flex-shrink: 0; }
    .field-msg.err  { color: var(--red); }
    .field-msg.hint { color: var(--muted); }

    .price-display {
      display: flex; align-items: baseline; gap: 5px;
      font-size: 19px; font-weight: 900; color: var(--brand);
      margin-top: 7px; letter-spacing: -.4px;
    }
    .price-display .unit { font-size: 12px; font-weight: 600; color: var(--muted); }

    /* ── Autocomplete ── */
    .ac-wrap { position: relative; }
    .ac-drop {
      position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 60;
      background: #fff; border: 1.5px solid var(--border);
      border-radius: var(--r-lg);
      box-shadow: 0 12px 32px rgba(30,40,117,.12);
      overflow: hidden; max-height: 200px; overflow-y: auto;
    }
    .ac-item {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 11px 14px;
      background: none; border: none; border-bottom: 1px solid #F8FAFC;
      font: 13px/1 'DM Sans', system-ui, sans-serif; color: var(--text);
      text-align: left; cursor: pointer; transition: background .1s;
    }
    .ac-item:last-child { border-bottom: none; }
    .ac-item:hover { background: var(--brand-l); color: var(--brand); }
    .ac-item svg { width: 13px; height: 13px; color: var(--faint); flex-shrink: 0; }

    /* ── WhatsApp block ── */
    .wa-default-block {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      background: var(--green-l);
      border: 1.5px solid #A7F3D0;
      border-radius: var(--r-md);
    }
    .wa-default-left {
      display: flex; align-items: center; gap: 10px;
    }
    .wa-default-icon {
      width: 34px; height: 34px; border-radius: 9px;
      background: var(--green); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .wa-default-icon svg { width: 17px; height: 17px; }
    .wa-default-texts strong {
      display: block; font-size: 12px; font-weight: 700; color: #065F46;
    }
    .wa-default-texts span {
      font-size: 11px; color: #047857;
    }
    .btn-wa-change {
      flex-shrink: 0; font-size: 11px; font-weight: 700; color: var(--brand);
      background: var(--brand-l); border: 1px solid var(--brand-m);
      border-radius: 7px; padding: 5px 10px; cursor: pointer;
      font-family: inherit; transition: all .12s; white-space: nowrap;
    }
    .btn-wa-change:hover { background: var(--brand-m); }

    .wa-custom-block { display: flex; flex-direction: column; gap: 8px; }
    .wa-pfx-wrap { position: relative; }
    .wa-pfx {
      position: absolute; left: 0; top: 0; bottom: 0;
      display: flex; align-items: center; gap: 5px;
      padding: 0 11px 0 12px;
      border-right: 1.5px solid var(--border);
      font-size: 12px; font-weight: 700; color: var(--text);
      pointer-events: none; white-space: nowrap;
    }
    .wa-pfx svg { width: 13px; height: 13px; }
    .input.with-wa { padding-left: 88px; }
    .btn-wa-reset {
      font-size: 11px; font-weight: 600; color: var(--muted);
      background: none; border: none; cursor: pointer;
      font-family: inherit; text-decoration: underline;
      text-underline-offset: 2px; padding: 0; align-self: flex-start;
    }
    .btn-wa-reset:hover { color: var(--text); }

    /* ── Photos ── */
    .photo-upload-label {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; border: 2px dashed var(--brand-m);
      border-radius: var(--r-lg); padding: 26px 16px;
      cursor: pointer; transition: all .18s; text-align: center;
      background: var(--brand-l);
      -webkit-tap-highlight-color: transparent;
    }
    .photo-upload-label:hover { border-color: var(--brand); background: #E8ECFF; }
    .photo-file-input {
      position: absolute; width: 1px; height: 1px;
      opacity: 0; overflow: hidden; clip: rect(0 0 0 0);
      white-space: nowrap; pointer-events: none;
    }
    .upload-icon {
      width: 48px; height: 48px; background: var(--brand);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .upload-icon svg { width: 22px; height: 22px; color: #fff; }
    .upload-title { font-size: 14px; font-weight: 700; color: var(--brand); }
    .upload-sub   { font-size: 12px; color: var(--muted); }

    .photo-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
    }
    .photo-count-pill {
      font-size: 11px; font-weight: 700; color: #fff;
      background: var(--brand); padding: 3px 9px; border-radius: 20px;
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
      background: var(--brand); color: #fff;
      padding: 2px 6px; border-radius: 5px;
    }
    .photo-del {
      position: absolute; top: 4px; right: 4px;
      width: 22px; height: 22px; border-radius: 50%;
      background: rgba(0,0,0,.55); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; opacity: 0; transition: opacity .15s;
    }
    .photo-del svg { width: 11px; height: 11px; }
    .photo-cell:hover .photo-del { opacity: 1; }

    /* ── Recap ── */
    .recap {
      border: 1.5px solid var(--border); border-radius: var(--r-lg); overflow: hidden;
    }
    .recap-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-bottom: 1px solid #F8FAFC;
    }
    .recap-row:last-child { border-bottom: none; }
    .recap-ico {
      width: 34px; height: 34px; border-radius: 9px;
      background: var(--brand-l); border: 1px solid var(--brand-m);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .recap-ico svg { width: 15px; height: 15px; color: var(--brand); }
    .recap-lbl { font-size: 11px; color: var(--faint); margin-bottom: 2px; }
    .recap-val { font-size: 13px; font-weight: 700; color: var(--text); }

    /* ── Error banner ── */
    .err-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: var(--red-l); border: 1px solid #FCA5A5;
      border-radius: var(--r-sm); padding: 12px 14px; margin: 16px 0 0;
      font-size: 13px; color: #B91C1C; font-weight: 500; line-height: 1.5;
    }
    .err-banner svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    /* ── Footer ── */
    .card-foot {
      display: flex; gap: 10px;
      padding: 16px 22px; border-top: 1px solid #F1F5F9;
      margin-top: 22px;
    }
    .btn-back {
      height: 48px; padding: 0 16px;
      background: var(--surface); color: var(--muted);
      border: 1.5px solid var(--border); border-radius: var(--r-md);
      font: 600 13px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
      transition: all .15s;
    }
    .btn-back:hover { background: var(--brand-l); color: var(--brand); border-color: var(--brand-m); }
    .btn-back svg { width: 15px; height: 15px; }

    .btn-next {
      flex: 1; height: 48px;
      background: var(--brand); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .15s, transform .1s;
      box-shadow: 0 4px 14px rgba(30,40,117,.25);
    }
    .btn-next:hover:not(:disabled) { background: var(--brand2); }
    .btn-next:active:not(:disabled) { transform: scale(.98); }
    .btn-next:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
    .btn-next svg { width: 16px; height: 16px; }

    .btn-publish {
      flex: 1; height: 48px;
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%);
      color: #fff; border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity .15s, transform .1s;
      box-shadow: 0 4px 18px rgba(30,40,117,.3);
    }
    .btn-publish:hover:not(:disabled) { opacity: .9; }
    .btn-publish:active:not(:disabled) { transform: scale(.98); }
    .btn-publish:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
    .btn-publish svg { width: 16px; height: 16px; }

    /* ── Success ── */
    .success-wrap {
      display: flex; flex-direction: column; align-items: center;
      animation: fadeUp .35s ease;
    }
    .success-hero {
      width: 100%; position: relative;
      background: linear-gradient(145deg, var(--brand) 0%, var(--brand2) 100%);
      padding: 48px 22px 36px;
      display: flex; flex-direction: column; align-items: center;
      overflow: hidden;
    }
    .success-hero::before {
      content: ''; position: absolute;
      width: 200px; height: 200px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,.08);
      top: -60px; right: -60px;
    }
    .success-hero::after {
      content: ''; position: absolute;
      width: 140px; height: 140px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,.06);
      bottom: -50px; left: -30px;
    }
    .success-orbit {
      position: relative; width: 96px; height: 96px; margin-bottom: 20px;
    }
    .success-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 1.5px dashed rgba(255,255,255,.25);
      animation: rotateRing 10s linear infinite;
    }
    @keyframes rotateRing { to { transform: rotate(360deg); } }
    .success-ring-inner {
      position: absolute; inset: 16px; border-radius: 50%;
      background: rgba(255,255,255,.1);
    }
    .success-check {
      position: absolute; inset: 24px; border-radius: 50%;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
      animation: popIn .5s cubic-bezier(.34,1.56,.64,1) .15s both;
    }
    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .success-check svg { width: 22px; height: 22px; color: var(--brand); }
    .success-headline {
      font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
      color: rgba(255,255,255,.6); margin-bottom: 6px;
    }
    .success-title {
      font-size: 26px; font-weight: 900; color: #fff;
      letter-spacing: -.5px; line-height: 1.1; text-align: center;
    }

    .success-content { padding: 26px 22px 0; width: 100%; }
    .success-body {
      font-size: 14px; color: var(--muted);
      line-height: 1.65; text-align: center; margin-bottom: 24px;
    }

    .preview-card {
      width: 100%; border: 1.5px solid var(--border);
      border-radius: var(--r-lg); overflow: hidden; margin-bottom: 24px;
    }
    .preview-img-row {
      height: 130px;
      background: linear-gradient(135deg, var(--brand-l) 0%, var(--brand-m) 100%);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .preview-img-row img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .preview-img-placeholder {
      display: flex; flex-direction: column; align-items: center; gap: 7px;
    }
    .preview-img-placeholder svg { width: 28px; height: 28px; color: var(--brand); opacity: .4; }
    .preview-img-placeholder span { font-size: 12px; color: var(--brand); opacity: .5; }
    .preview-badge {
      position: absolute; top: 10px; left: 10px;
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
      background: var(--green); color: #fff;
      padding: 3px 9px; border-radius: 20px;
    }
    .preview-body { padding: 13px 16px; }
    .preview-type {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: var(--brand); margin-bottom: 3px;
    }
    .preview-titre { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.3px; margin-bottom: 4px; }
    .preview-lieu {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--muted); margin-bottom: 9px;
    }
    .preview-lieu svg { width: 12px; height: 12px; }
    .preview-prix { font-size: 18px; font-weight: 900; color: var(--brand); letter-spacing: -.4px; }
    .preview-prix .fcfa { font-size: 12px; font-weight: 600; color: var(--muted); margin-left: 3px; }

    .success-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; padding-bottom: 32px; }
    .btn-see-primary {
      width: 100%; height: 50px;
      background: var(--brand); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all .15s;
      box-shadow: 0 4px 14px rgba(30,40,117,.25);
    }
    .btn-see-primary:hover { background: var(--brand2); }
    .btn-see-primary svg { width: 16px; height: 16px; }
    .btn-see-secondary {
      width: 100%; height: 42px;
      background: none; color: var(--muted);
      border: 1.5px solid var(--border); border-radius: var(--r-md);
      font: 600 13px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all .15s;
    }
    .btn-see-secondary:hover { border-color: var(--brand-m); color: var(--brand); background: var(--brand-l); }
    .btn-see-secondary svg { width: 14px; height: 14px; }

    /* ── Spin ── */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin .7s linear infinite; display: inline-flex; }

    /* ── Responsive ── */
    @media (max-width: 400px) {
      .step-h1 { font-size: 21px; }
      .photo-grid { grid-template-columns: repeat(3, 1fr); }
      .step-body { padding: 18px 16px 4px; }
      .card-foot { padding: 14px 16px; }
      .success-content { padding: 22px 16px 0; }
    }
  `],
  template: `
    <div class="shell">

      <!-- Topbar -->
      <header class="topbar">
        <button type="button" class="topbar-btn" (click)="goBack()">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Retour
        </button>
        <span class="topbar-title">Nouvelle annonce</span>
        <div style="width:80px"></div>
      </header>

      <!-- Stepper -->
      @if (!published()) {
        <nav class="stepper" aria-label="Étapes">
          <div class="steps-row">
            @for (s of steps; track s.n; let i = $index) {
              <div class="step-item">
                <div class="step-node"
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
                  [class.active]="currentStep() === s.n"
                  [class.done]="currentStep() > s.n">{{ s.label }}</span>
              </div>
              @if (i < steps.length - 1) {
                <div class="step-line" [class.done]="currentStep() > s.n"></div>
              }
            }
          </div>
        </nav>
      }

      <!-- Card -->
      <div class="card-wrap">

        <!-- SUCCESS -->
        @if (published()) {
          <div class="card">
            <div class="success-wrap">
              <div class="success-hero">
                <div class="success-orbit">
                  <div class="success-ring"></div>
                  <div class="success-ring-inner"></div>
                  <div class="success-check">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
                <p class="success-headline">Publication réussie</p>
                <p class="success-title">Votre annonce<br>est en ligne !</p>
              </div>

              <div class="success-content">
                <p class="success-body">
                  Elle est désormais visible par des milliers de personnes. Gérez-la depuis votre tableau de bord.
                </p>

                <div class="preview-card">
                  <div class="preview-img-row">
                    @if (successFirstPhotoUrl()) {
                      <img [src]="successFirstPhotoUrl()" alt="Photo principale"/>
                    } @else {
                      <div class="preview-img-placeholder">
                        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span>Aucune photo</span>
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
                      <div class="preview-prix">{{ prixPreview() }}<span class="fcfa">/ mois</span></div>
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

          <!-- FORM -->
          <div class="card">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

              <!-- ════ ÉTAPE 1 ════ -->
              @if (currentStep() === 1) {
                <div class="step-band">
                  <p class="step-eyebrow">Étape 1 sur 3</p>
                  <p class="step-h1">Quel bien<br>proposez-vous ?</p>
                  <p class="step-sub">Type de bien et localisation</p>
                </div>
                <div class="step-body">

                  <div class="type-grid" role="radiogroup">
                    @for (t of typesBiens(); track t.id) {
                      <div class="type-tile"
                        [class.sel]="form.value.typeBienId === t.id"
                        (click)="selectType(t.id)"
                        (keydown.enter)="$event.preventDefault(); selectType(t.id)"
                        (keydown.space)="$event.preventDefault(); selectType(t.id)"
                        role="radio" [attr.aria-checked]="form.value.typeBienId === t.id" tabindex="0">
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

                  <p class="section-label">Localisation</p>

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

                  <div class="field">
                    <label class="field-label" for="f-quartier">Quartier</label>
                    <div class="ac-wrap">
                      <div class="input-wrap">
                        <span class="ico-l">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                        </span>
                        <input id="f-quartier" type="text" class="input with-l"
                          formControlName="quartier"
                          placeholder="Ex : Akwa, Bonanjo, Makepe…"
                          autocomplete="off"
                          (input)="onQuartierInput()"
                          (focus)="showSuggestions.set(true)"
                          (blur)="onQuartierBlur()" />
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
                  <button type="button" class="btn-next"
                    [disabled]="!form.value.typeBienId || !form.value.quartier"
                    (click)="nextStep()">
                    Continuer
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              }

              <!-- ════ ÉTAPE 2 ════ -->
              @if (currentStep() === 2) {
                <div class="step-band">
                  <p class="step-eyebrow">Étape 2 sur 3</p>
                  <p class="step-h1">Décrivez<br>votre bien</p>
                  <p class="step-sub">Prix, description et contact</p>
                </div>
                <div class="step-body">

                  <div class="field">
                    <label class="field-label" for="f-prix">Loyer mensuel</label>
                    <div class="input-wrap">
                      <span class="ico-l">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </span>
                      <input id="f-prix" type="text" inputmode="numeric"
                        class="input with-l with-r"
                        [class.ok]="prixValide()"
                        [class.err]="isErr('prix')"
                        [value]="prixDisplay()"
                        placeholder="75 000"
                        (input)="onPrixInput($event)"
                        (blur)="form.get('prix')!.markAsTouched()" />
                      <span class="ico-r-txt">FCFA</span>
                    </div>
                    @if (prixValide()) {
                      <div class="price-display">
                        {{ prixPreview() }}<span class="unit">par mois</span>
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

                  <div class="field">
                    <label class="field-label" for="f-desc">Description</label>
                    <div class="input-wrap">
                      <textarea id="f-desc" class="input"
                        [class.err]="isErr('description')"
                        formControlName="description"
                        rows="5" maxlength="1000"
                        placeholder="Superficie, équipements, état du bien, disponibilité…"></textarea>
                      <span class="char-count" [class.warn]="descLen() > 900">{{ descLen() }}/1000</span>
                    </div>
                    @if (descLen() > 0 && descLen() < 30) {
                      <div class="field-msg err">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                        </svg>
                        Encore {{ 30 - descLen() }} caractère(s)
                      </div>
                    } @else {
                      <div class="field-msg hint">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 16v-4m0-4h.01"/>
                        </svg>
                        Minimum 30 caractères
                      </div>
                    }
                  </div>

                  <!-- WhatsApp -->
                  <div class="field">
                    <label class="field-label">Contact WhatsApp</label>

                    @if (!useCustomWa()) {
                      <!-- Mode par défaut : numéro du compte -->
                      <div class="wa-default-block">
                        <div class="wa-default-left">
                          <div class="wa-default-icon">
                            <svg viewBox="0 0 24 24" fill="#fff" width="17" height="17">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            </svg>
                          </div>
                          <div class="wa-default-texts">
                            <strong>Numéro de votre compte</strong>
                            <span>Les acheteurs vous contacteront sur ce numéro</span>
                          </div>
                        </div>
                        <button type="button" class="btn-wa-change" (click)="useCustomWa.set(true)">
                          Changer
                        </button>
                      </div>
                    } @else {
                      <!-- Mode personnalisé -->
                      <div class="wa-custom-block">
                        <div class="wa-pfx-wrap">
                          <span class="wa-pfx">
                            <svg viewBox="0 0 24 24" fill="#25D366" width="13" height="13">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            </svg>
                            +237
                          </span>
                          <input type="tel" inputmode="numeric"
                            class="input with-wa"
                            [class.err]="isErr('whatsappRaw')"
                            [value]="waDisplay()"
                            placeholder="6XX XX XX XX"
                            (input)="onWaInput($event)"
                            (blur)="form.get('whatsappRaw')!.markAsTouched()" />
                        </div>
                        <button type="button" class="btn-wa-reset" (click)="resetWa()">
                          ← Utiliser le numéro de mon compte
                        </button>
                      </div>
                    }
                  </div>

                </div>

                <div class="card-foot">
                  <button type="button" class="btn-back" (click)="prevStep()">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Retour
                  </button>
                  <button type="button" class="btn-next"
                    [disabled]="step2Invalid()" (click)="nextStep()">
                    Continuer
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              }

              <!-- ════ ÉTAPE 3 ════ -->
              @if (currentStep() === 3) {
                <div class="step-band">
                  <p class="step-eyebrow">Étape 3 sur 3</p>
                  <p class="step-h1">Photos &<br>confirmation</p>
                  <p class="step-sub">Vérifiez avant de publier</p>
                </div>
                <div class="step-body">

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
                    <input id="photo-input" type="file" class="photo-file-input"
                      accept="image/jpeg,image/png,image/webp,image/*"
                      multiple (change)="onFilesSelected($event)" />
                  }

                  @if (photos().length > 0) {
                    <div class="photo-grid">
                      @for (p of photos(); track p.id; let i = $index) {
                        <div class="photo-cell">
                          <img [src]="p.url" [alt]="'Photo ' + (i+1)" loading="lazy"/>
                          @if (i === 0) { <span class="photo-badge">Principale</span> }
                          <button type="button" class="photo-del" (click)="removePhoto(p.id)">
                            <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  }

                  <p class="section-label" style="margin-top:22px">Récapitulatif</p>

                  <div class="recap">
                    @if (recapTypeBien()) {
                      <div class="recap-row">
                        <div class="recap-ico">
                          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                          </svg>
                        </div>
                        <div><div class="recap-lbl">Type de bien</div><div class="recap-val">{{ recapTypeBien() }}</div></div>
                      </div>
                    }
                    @if (recapLieu()) {
                      <div class="recap-row">
                        <div class="recap-ico">
                          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          </svg>
                        </div>
                        <div><div class="recap-lbl">Localisation</div><div class="recap-val">{{ recapLieu() }}</div></div>
                      </div>
                    }
                    @if (prixPreview()) {
                      <div class="recap-row">
                        <div class="recap-ico">
                          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1"/>
                          </svg>
                        </div>
                        <div><div class="recap-lbl">Loyer mensuel</div><div class="recap-val">{{ prixPreview() }}</div></div>
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
                          {{ photos().length === 0 ? 'Aucune — à ajouter plus tard' : photos().length + ' photo' + (photos().length > 1 ? 's' : '') }}
                        </div>
                      </div>
                    </div>
                    <div class="recap-row">
                      <div class="recap-ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015 12.84 19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="recap-lbl">Contact WhatsApp</div>
                        <div class="recap-val">{{ useCustomWa() ? 'Numéro personnalisé' : 'Numéro du compte' }}</div>
                      </div>
                    </div>
                  </div>

                  @if (submitError()) {
                    <div class="err-banner">
                      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
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
                          <path stroke-linecap="round" d="M12 2a10 10 0 010 10"/>
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

  private readonly locApi      = inject(LocalisationApi);
  private readonly typeBienApi = inject(TypeBienApi);
  private readonly annonceApi  = inject(AnnonceApi);
  private readonly photoApi    = inject(PhotoApi);
  private readonly storage     = inject(StorageService);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  private readonly destroy$    = new Subject<void>();
  private readonly DRAFT_KEY   = 'draft_annonce_v5';

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
  readonly prixDisplay     = signal('');
  readonly waDisplay       = signal('');
  /** true = l'utilisateur veut un numéro différent de celui du compte */
  readonly useCustomWa     = signal(false);
  readonly successFirstPhotoUrl = signal<string | null>(null);

  readonly steps = [
    { n: 1, label: 'Bien & lieu' },
    { n: 2, label: 'Détails' },
    { n: 3, label: 'Photos' },
  ];

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
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p) + ' FCFA';
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
    return !(v.description && v.description.length >= 30) || !(v.prix && v.prix >= 1000);
  });

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.typeBienApi.getAll().subscribe(r => {
      this.typesBiens.set((r.data ?? []).filter((t: TypeBienResponse) => t.estActif !== false));
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

  /* ── Prix ── */
  onPrixInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : null;
    const formatted = num != null
      ? new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
      : '';
    el.value = formatted;
    this.prixDisplay.set(formatted);
    this.form.patchValue({ prix: num });
    this.form.get('prix')!.markAsDirty();
  }

  /* ── WhatsApp ── */
  onWaInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 9);
    let f = '';
    if (digits.length <= 3) f = digits;
    else if (digits.length <= 5) f = digits.slice(0,3) + ' ' + digits.slice(3);
    else if (digits.length <= 7) f = digits.slice(0,3) + ' ' + digits.slice(3,5) + ' ' + digits.slice(5);
    else f = digits.slice(0,3) + ' ' + digits.slice(3,5) + ' ' + digits.slice(5,7) + ' ' + digits.slice(7);
    el.value = f;
    this.waDisplay.set(f);
    this.form.patchValue({ whatsappRaw: digits });
    this.form.get('whatsappRaw')!.markAsDirty();
  }

  resetWa(): void {
    this.useCustomWa.set(false);
    this.waDisplay.set('');
    this.form.patchValue({ whatsappRaw: '' });
  }

  /* ── Draft ── */
  private saveDraft(): void {
    try { localStorage.setItem(this.DRAFT_KEY, JSON.stringify(this.form.getRawValue())); } catch { /**/ }
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(this.DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      this.form.patchValue(draft);
      if (draft.prix) {
        this.prixDisplay.set(
          new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(draft.prix)
        );
      }
      if (draft.whatsappRaw) {
        const d = (draft.whatsappRaw as string).replace(/\D/g, '').slice(0, 9);
        let f = '';
        if (d.length <= 3) f = d;
        else if (d.length <= 5) f = d.slice(0,3) + ' ' + d.slice(3);
        else if (d.length <= 7) f = d.slice(0,3) + ' ' + d.slice(3,5) + ' ' + d.slice(5);
        else f = d.slice(0,3) + ' ' + d.slice(3,5) + ' ' + d.slice(5,7) + ' ' + d.slice(7);
        this.waDisplay.set(f);
        if (d.length > 0) this.useCustomWa.set(true);
      }
      if (draft.ville) {
        const found = this.villesAvecId().find(v => v.ville === draft.ville);
        if (found) this.form.patchValue({ localisationId: found.id });
        this.loadQuartiers(draft.ville);
      }
      this.formValue.set(this.form.getRawValue());
    } catch { /**/ }
  }

  private clearDraft(): void {
    try { localStorage.removeItem(this.DRAFT_KEY); } catch { /**/ }
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
  selectQuartier(q: string): void { this.form.patchValue({ quartier: q }); this.showSuggestions.set(false); }
  selectType(id: number): void { this.form.patchValue({ typeBienId: id }); }

  /* ── Photos ── */
  onFilesSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.addFiles(Array.from(input.files));
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
    
...valid.map(f => ({ file: f, url: URL.createObjectURL(f), id: this.generateId() })),
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

    const v = this.form.getRawValue();

    /* WhatsApp : seulement si l'utilisateur a choisi un numéro personnalisé */
    let whatsApp: string | undefined;
    if (this.useCustomWa()) {
      const digits = (v.whatsappRaw ?? '').replace(/\D/g, '');
      if (digits.length >= 9) {
        whatsApp = digits.startsWith('237') ? `+${digits}` : `+237${digits}`;
      }
    }
    /* Si useCustomWa = false → on n'envoie pas numeroWhatsApp,
       le backend utilisera le numéro du compte de l'utilisateur */

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

  private generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback pour HTTP / anciens navigateurs
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
}