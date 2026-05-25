import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
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
  TypeBienResponse,
  PhotoResponse,
  AnnonceDashboardResponse,
} from '@core/services/models';

interface ExistingPhoto {
  kind: 'existing';
  id: number;
  url: string;
  urlThumb: string;
  ordre: number;
  principale: boolean;
  markedForDelete: boolean;
}

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
  styles: [`
    :host { display: block; }

    /* ── Tokens ── */
    :host {
      --navy:      #0A1628;
      --brand:     #1A237E;
      --brand2:    #283593;
      --brand3:    #3949AB;
      --brand-l:   #E8EAF6;
      --brand-m:   #C5CAE9;
      --green:     #00897B;
      --green-l:   #E0F2F1;
      --green-d:   #00695C;
      --red:       #E53935;
      --red-l:     #FFEBEE;
      --amber:     #F57F17;
      --text:      #0D1B2A;
      --text2:     #1B2A3B;
      --muted:     #546E7A;
      --faint:     #90A4AE;
      --border:    #E0E7EF;
      --surface:   #F5F7FA;
      --card:      #FFFFFF;
      --r-xl:      24px;
      --r-lg:      16px;
      --r-md:      12px;
      --r-sm:      8px;
    }

    /* ── Shell ── */
    .shell {
      min-height: 100dvh;
      background: #F0F4FF;
      background-image:
        radial-gradient(ellipse at 0% 0%, rgba(26,35,126,.07) 0%, transparent 60%),
        radial-gradient(ellipse at 100% 100%, rgba(41,53,147,.05) 0%, transparent 55%);
      display: flex;
      flex-direction: column;
      font-family: 'DM Sans', system-ui, sans-serif;
    }

    /* ── Topbar ── */
    .topbar {
      position: sticky; top: 0; z-index: 50;
      height: 60px;
      background: rgba(255,255,255,.95);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-bottom: 1px solid rgba(26,35,126,.07);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; gap: 12px;
    }
    .topbar-btn {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer;
      font: 600 13px/1 inherit; color: var(--muted);
      padding: 8px 12px; border-radius: 10px;
      transition: all .15s; min-width: 80px;
    }
    .topbar-btn:hover { background: var(--brand-l); color: var(--brand); }
    .topbar-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
    .topbar-title {
      font-size: 15px; font-weight: 800;
      color: var(--text); letter-spacing: -.4px;
    }

    /* ── Stepper ── */
    .stepper {
      padding: 18px 20px 0;
      display: flex; justify-content: center;
    }
    .steps-row {
      display: flex; align-items: flex-start;
      width: 100%; max-width: 420px;
    }
    .step-item {
      display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0;
    }
    .step-node {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800;
      transition: all .3s cubic-bezier(.34,1.56,.64,1);
      position: relative; z-index: 1;
    }
    .step-node.done {
      background: var(--green); color: #fff;
      box-shadow: 0 4px 12px rgba(0,137,123,.3);
    }
    .step-node.active {
      background: var(--brand); color: #fff;
      box-shadow: 0 0 0 6px rgba(26,35,126,.1), 0 4px 14px rgba(26,35,126,.3);
      transform: scale(1.12);
    }
    .step-node.idle { background: #DDE3F0; color: var(--faint); }
    .step-node svg { width: 14px; height: 14px; }
    .step-lbl {
      font-size: 10px; font-weight: 600; margin-top: 7px;
      color: var(--faint); text-transform: uppercase; letter-spacing: .07em;
      text-align: center; line-height: 1.2;
      transition: color .2s;
    }
    .step-lbl.active { color: var(--brand); }
    .step-lbl.done   { color: var(--green); }
    .step-line {
      flex: 1; height: 2px; border-radius: 2px;
      margin-top: 17px; transition: background .4s;
      background: #DDE3F0;
    }
    .step-line.done { background: var(--green); }

    /* ── Card wrap ── */
    .card-wrap {
      flex: 1; padding: 14px 14px 56px;
      display: flex; flex-direction: column; align-items: center;
    }
    .card {
      width: 100%; max-width: 480px;
      background: var(--card);
      border-radius: var(--r-xl);
      box-shadow:
        0 0 0 1px rgba(26,35,126,.06),
        0 4px 6px rgba(26,35,126,.04),
        0 24px 64px rgba(26,35,126,.10);
      overflow: hidden;
    }

    /* ── Step header band ── */
    .step-band {
      background: linear-gradient(140deg, var(--brand) 0%, var(--brand3) 100%);
      padding: 24px 24px 22px;
      position: relative; overflow: hidden;
    }
    .step-band::before {
      content: '';
      position: absolute; right: -24px; top: -24px;
      width: 130px; height: 130px; border-radius: 50%;
      background: rgba(255,255,255,.06);
    }
    .step-band::after {
      content: '';
      position: absolute; right: 36px; bottom: -32px;
      width: 90px; height: 90px; border-radius: 50%;
      background: rgba(255,255,255,.04);
    }
    .step-eyebrow {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
      color: rgba(255,255,255,.55); margin-bottom: 8px;
    }
    .edit-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 20px; padding: 3px 9px;
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: rgba(255,255,255,.85);
      margin-bottom: 10px;
    }
    .edit-badge svg { width: 11px; height: 11px; }
    .step-h1 {
      font-size: 26px; font-weight: 900;
      color: #fff; letter-spacing: -.6px;
      line-height: 1.1; margin: 0 0 5px;
    }
    .step-sub {
      font-size: 13px; color: rgba(255,255,255,.55); margin: 0;
    }

    /* ── Step body ── */
    .step-body {
      padding: 24px 24px 8px;
      animation: fadeSlide .22s ease;
    }
    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Section label ── */
    .section-label {
      font-size: 10.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .1em; color: var(--brand);
      margin: 0 0 14px; display: flex; align-items: center; gap: 8px;
    }
    .section-label::after { content: ''; flex: 1; height: 1px; background: var(--brand-m); opacity: .4; }

    /* ── Type grid ── */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px; margin-bottom: 22px;
    }
    @media (max-width: 400px) {
      .type-grid { grid-template-columns: repeat(3, 1fr); }
    }
    .type-tile {
      position: relative;
      display: flex; flex-direction: column; align-items: center;
      gap: 7px; padding: 14px 6px 12px;
      border: 1.5px solid var(--border);
      border-radius: var(--r-md);
      background: var(--surface);
      cursor: pointer; outline: none;
      transition: all .2s; user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .type-tile:hover { border-color: var(--brand-m); background: var(--brand-l); }
    .type-tile:active { transform: scale(.93); }
    .type-tile.sel {
      border-color: var(--brand);
      background: var(--brand-l);
      box-shadow: 0 0 0 3px rgba(26,35,126,.1);
    }
    .type-ico {
      width: 38px; height: 38px; border-radius: 11px;
      background: #EDF0F7;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .type-ico svg { width: 18px; height: 18px; color: var(--muted); transition: color .2s; }
    .type-tile.sel .type-ico { background: var(--brand); }
    .type-tile.sel .type-ico svg { color: #fff; }
    .type-name {
      font-size: 10px; font-weight: 600; color: var(--muted);
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

    /* ── Fields ── */
    .field { margin-bottom: 16px; }
    .field:last-child { margin-bottom: 0; }
    .field-label {
      display: block; font-size: 12px; font-weight: 700;
      color: var(--text2); margin-bottom: 7px; letter-spacing: -.01em;
    }
    .input-wrap { position: relative; }

    .input {
      display: block; width: 100%; height: 50px;
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
      box-shadow: 0 0 0 3px rgba(26,35,126,.1);
    }
    .input.err { border-color: var(--red); box-shadow: 0 0 0 3px rgba(229,57,53,.07); }
    .input.ok  { border-color: var(--green); box-shadow: 0 0 0 3px rgba(0,137,123,.07); }
    .input.with-l  { padding-left: 44px; }
    .input.with-r  { padding-right: 62px; }

    .ico-l {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      display: flex; pointer-events: none; color: var(--faint);
    }
    .ico-l svg { width: 17px; height: 17px; }
    .ico-r-txt {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      font-size: 11px; font-weight: 700; color: var(--faint); pointer-events: none;
    }

    textarea.input {
      height: auto; padding: 14px;
      resize: none; line-height: 1.65;
    }
    .char-count {
      position: absolute; bottom: 11px; right: 14px;
      font-size: 11px; color: var(--faint); pointer-events: none;
    }
    .char-count.warn { color: var(--amber); font-weight: 700; }

    .field-msg {
      display: flex; align-items: flex-start; gap: 5px;
      font-size: 11.5px; margin-top: 5px; line-height: 1.4;
    }
    .field-msg svg { width: 13px; height: 13px; flex-shrink: 0; margin-top: 1px; }
    .field-msg.err  { color: var(--red); }
    .field-msg.hint { color: var(--muted); }
    .field-msg.ok   { color: var(--green); }

    .price-display {
      display: flex; align-items: baseline; gap: 5px;
      font-size: 20px; font-weight: 900; color: var(--brand);
      margin-top: 8px; letter-spacing: -.4px;
    }
    .price-display .unit { font-size: 12px; font-weight: 600; color: var(--muted); }

    /* ── Autocomplete ── */
    .ac-wrap { position: relative; }
    .ac-drop {
      position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 60;
      background: #fff; border: 1.5px solid var(--border);
      border-radius: var(--r-lg);
      box-shadow: 0 16px 40px rgba(26,35,126,.13);
      overflow: hidden; max-height: 210px; overflow-y: auto;
    }
    .ac-item {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 12px 16px;
      background: none; border: none; border-bottom: 1px solid #F5F7FA;
      font: 13px/1 'DM Sans', system-ui, sans-serif; color: var(--text);
      text-align: left; cursor: pointer; transition: background .1s;
    }
    .ac-item:last-child { border-bottom: none; }
    .ac-item:hover { background: var(--brand-l); color: var(--brand); }
    .ac-item svg { width: 14px; height: 14px; color: var(--faint); flex-shrink: 0; }

    /* ── WhatsApp block ── */
    .wa-field-wrap { display: flex; flex-direction: column; gap: 0; }

    /* Bloc numéro actuel */
    .wa-current-card {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; padding: 14px 16px;
      background: var(--green-l);
      border: 1.5px solid #B2DFDB;
      border-radius: var(--r-md);
      margin-bottom: 10px;
    }
    .wa-current-left {
      display: flex; align-items: center; gap: 12px; min-width: 0;
    }
    .wa-current-icon {
      width: 38px; height: 38px; border-radius: 11px;
      background: var(--green); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .wa-current-icon svg { width: 18px; height: 18px; color: #fff; }
    .wa-current-texts { min-width: 0; }
    .wa-current-texts strong {
      display: block; font-size: 12px; font-weight: 800; color: #004D40;
    }
    .wa-current-number {
      font-size: 15px; font-weight: 700; color: #00695C;
      letter-spacing: .5px; margin-top: 1px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wa-edit-btn {
      flex-shrink: 0;
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 700; color: var(--brand);
      background: var(--brand-l); border: 1px solid var(--brand-m);
      border-radius: 8px; padding: 6px 11px; cursor: pointer;
      font-family: inherit; transition: all .12s; white-space: nowrap;
    }
    .wa-edit-btn:hover { background: var(--brand-m); }
    .wa-edit-btn svg { width: 13px; height: 13px; }

    /* Bloc saisie nouveau numéro */
    .wa-input-card {
      border: 1.5px solid var(--border);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .wa-input-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .wa-input-header-left {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 700; color: var(--text2);
    }
    .wa-input-header-left svg { width: 14px; height: 14px; color: #25D366; }
    .wa-cancel-btn {
      font-size: 11px; font-weight: 600; color: var(--muted);
      background: none; border: none; cursor: pointer;
      font-family: inherit; padding: 0; transition: color .1s;
      display: flex; align-items: center; gap: 4px;
    }
    .wa-cancel-btn:hover { color: var(--text); }
    .wa-cancel-btn svg { width: 12px; height: 12px; }
    .wa-input-body { padding: 12px 14px; }
    .wa-pfx-wrap { position: relative; }
    .wa-pfx {
      position: absolute; left: 0; top: 0; bottom: 0;
      display: flex; align-items: center; gap: 5px;
      padding: 0 12px 0 13px;
      border-right: 1.5px solid var(--border);
      font-size: 12px; font-weight: 700; color: var(--text);
      pointer-events: none; white-space: nowrap;
    }
    .wa-pfx svg { width: 13px; height: 13px; }
    .input.with-wa { padding-left: 90px; }
    .wa-input-hint {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; color: var(--muted); margin-top: 8px;
    }
    .wa-input-hint svg { width: 12px; height: 12px; flex-shrink: 0; }

    /* ── Photos ── */
    .photos-section { }

    .photo-upload-zone {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 28px 20px;
      border: 2px dashed var(--brand-m);
      border-radius: var(--r-lg);
      background: var(--brand-l);
      cursor: pointer; text-align: center;
      transition: all .18s; position: relative;
      -webkit-tap-highlight-color: transparent;
    }
    .photo-upload-zone:hover, .photo-upload-zone.drag {
      border-color: var(--brand);
      background: #DDE5F5;
    }
    .photo-upload-zone:active { background: #D0DBF5; }
    .upload-icon-wrap {
      width: 52px; height: 52px; background: var(--brand);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .upload-icon-wrap svg { width: 24px; height: 24px; color: #fff; }
    .upload-title { font-size: 14px; font-weight: 700; color: var(--brand); }
    .upload-sub   { font-size: 12px; color: var(--muted); }
    .photo-file-input {
      position: absolute; inset: 0; opacity: 0;
      cursor: pointer; width: 100%; height: 100%;
    }

    .photo-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .photo-label-txt { font-size: 13px; font-weight: 700; color: var(--text); }
    .photo-count-pill {
      font-size: 11px; font-weight: 800; color: #fff;
      background: var(--brand); padding: 4px 10px; border-radius: 20px;
      letter-spacing: .03em;
    }

    /* Grid de photos */
    .photo-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 8px; margin-top: 12px;
    }
    @media (max-width: 380px) {
      .photo-grid { grid-template-columns: repeat(3, 1fr); }
    }
    .photo-cell {
      position: relative; aspect-ratio: 1;
      border-radius: var(--r-md); overflow: hidden;
      border: 1.5px solid var(--border);
      background: var(--surface);
      /* Les boutons d'action sont toujours visibles sur mobile */
    }
    .photo-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* Overlay de suppression — toujours visible sur touch */
    .photo-actions {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: flex-end; justify-content: flex-start;
      padding: 5px;
      background: transparent;
      transition: background .15s;
    }
    .photo-cell:hover .photo-actions { background: rgba(0,0,0,.12); }

    .photo-del-btn {
      width: 26px; height: 26px; border-radius: 50%;
      background: rgba(0,0,0,.6); border: 1.5px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #fff;
      /* Toujours visible sur mobile */
      opacity: 1;
      transition: background .15s, transform .1s;
      -webkit-tap-highlight-color: transparent;
    }
    .photo-del-btn:hover { background: var(--red); }
    .photo-del-btn:active { transform: scale(.88); }
    .photo-del-btn svg { width: 12px; height: 12px; }

    /* Sur desktop, le bouton s'affiche au hover uniquement */
    @media (hover: hover) {
      .photo-del-btn { opacity: 0; }
      .photo-cell:hover .photo-del-btn { opacity: 1; }
    }

    .photo-badge {
      position: absolute; bottom: 5px; left: 5px;
      font-size: 8.5px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase;
      background: var(--brand); color: #fff;
      padding: 2px 7px; border-radius: 5px;
    }
    .photo-badge-new {
      position: absolute; bottom: 5px; left: 5px;
      font-size: 8.5px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase;
      background: var(--green); color: #fff;
      padding: 2px 7px; border-radius: 5px;
    }

    /* Photo marquée pour suppression */
    .photo-cell.to-delete { opacity: .3; }
    .photo-cell.to-delete::after {
      content: '🗑';
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      background: rgba(229,57,53,.12);
      border-radius: inherit;
    }
    .restore-btn {
      position: absolute; bottom: 5px; right: 5px;
      font-size: 9px; font-weight: 800; color: #fff;
      background: var(--amber); border: none; border-radius: 5px;
      padding: 3px 7px; cursor: pointer; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }

    /* ── Récap ── */
    .recap {
      border: 1.5px solid var(--border); border-radius: var(--r-lg); overflow: hidden;
    }
    .recap-row {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 16px; border-bottom: 1px solid var(--surface);
    }
    .recap-row:last-child { border-bottom: none; }
    .recap-ico {
      width: 36px; height: 36px; border-radius: 10px;
      background: var(--brand-l); border: 1px solid var(--brand-m);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .recap-ico svg { width: 16px; height: 16px; color: var(--brand); }
    .recap-lbl { font-size: 11px; color: var(--faint); margin-bottom: 2px; }
    .recap-val { font-size: 13px; font-weight: 700; color: var(--text); }

    /* ── Error banner ── */
    .err-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: var(--red-l); border: 1px solid #FFCDD2;
      border-radius: var(--r-sm); padding: 13px 16px; margin: 18px 0 0;
      font-size: 13px; color: #C62828; font-weight: 500; line-height: 1.5;
    }
    .err-banner svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    /* ── Footer ── */
    .card-foot {
      display: flex; gap: 10px;
      padding: 18px 24px; border-top: 1px solid #F0F4F8;
      margin-top: 20px;
    }
    .btn-back {
      height: 50px; padding: 0 18px;
      background: var(--surface); color: var(--muted);
      border: 1.5px solid var(--border); border-radius: var(--r-md);
      font: 600 13px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
      transition: all .15s;
    }
    .btn-back:hover { background: var(--brand-l); color: var(--brand); border-color: var(--brand-m); }
    .btn-back svg { width: 16px; height: 16px; }

    .btn-next {
      flex: 1; height: 50px;
      background: var(--brand); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .15s, transform .1s;
      box-shadow: 0 4px 16px rgba(26,35,126,.25);
    }
    .btn-next:hover:not(:disabled) { background: var(--brand2); }
    .btn-next:active:not(:disabled) { transform: scale(.98); }
    .btn-next:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
    .btn-next svg { width: 16px; height: 16px; }

    .btn-save {
      flex: 1; height: 50px;
      background: linear-gradient(135deg, var(--green-d) 0%, var(--green) 100%);
      color: #fff; border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity .15s, transform .1s;
      box-shadow: 0 4px 18px rgba(0,137,123,.3);
    }
    .btn-save:hover:not(:disabled) { opacity: .9; }
    .btn-save:active:not(:disabled) { transform: scale(.98); }
    .btn-save:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
    .btn-save svg { width: 16px; height: 16px; }

    /* ── Loading ── */
    .loading-card {
      display: flex; flex-direction: column; align-items: center;
      padding: 64px 24px; gap: 18px;
    }
    .spinner {
      width: 42px; height: 42px;
      border: 3px solid var(--brand-m);
      border-top-color: var(--brand);
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    .loading-txt { font-size: 14px; color: var(--muted); font-weight: 500; }

    /* ── Success ── */
    .success-wrap {
      display: flex; flex-direction: column; align-items: center;
      animation: fadeSlide .35s ease;
    }
    .success-hero {
      width: 100%;
      background: linear-gradient(145deg, var(--green-d) 0%, var(--green) 100%);
      padding: 52px 24px 40px;
      display: flex; flex-direction: column; align-items: center;
      position: relative; overflow: hidden;
    }
    .success-hero::before {
      content: ''; position: absolute;
      width: 220px; height: 220px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,.08);
      top: -70px; right: -70px;
    }
    .success-orbit { position: relative; width: 100px; height: 100px; margin-bottom: 22px; }
    .success-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 1.5px dashed rgba(255,255,255,.22);
      animation: rotateRing 12s linear infinite;
    }
    @keyframes rotateRing { to { transform: rotate(360deg); } }
    .success-ring-inner {
      position: absolute; inset: 18px; border-radius: 50%;
      background: rgba(255,255,255,.1);
    }
    .success-check {
      position: absolute; inset: 26px; border-radius: 50%;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
      animation: popIn .5s cubic-bezier(.34,1.56,.64,1) .15s both;
    }
    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .success-check svg { width: 24px; height: 24px; color: var(--green); }
    .success-headline {
      font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
      color: rgba(255,255,255,.6); margin-bottom: 6px;
    }
    .success-title {
      font-size: 28px; font-weight: 900; color: #fff;
      letter-spacing: -.6px; line-height: 1.1; text-align: center;
    }

    .success-content { padding: 28px 24px 0; width: 100%; }
    .success-body {
      font-size: 14px; color: var(--muted);
      line-height: 1.65; text-align: center; margin-bottom: 28px;
    }
    .success-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; padding-bottom: 36px; }
    .btn-see-primary {
      width: 100%; height: 52px;
      background: var(--brand); color: #fff;
      border: none; border-radius: var(--r-md);
      font: 700 14px/1 'DM Sans', system-ui, sans-serif; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all .15s;
      box-shadow: 0 4px 14px rgba(26,35,126,.25);
    }
    .btn-see-primary:hover { background: var(--brand2); }
    .btn-see-primary svg { width: 16px; height: 16px; }
    .btn-see-secondary {
      width: 100%; height: 44px;
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
      .step-h1 { font-size: 22px; }
      .step-body { padding: 18px 18px 6px; }
      .card-foot { padding: 14px 18px; }
      .success-content { padding: 22px 18px 0; }
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
        <span class="topbar-title">Modifier l'annonce</span>
        <div style="min-width:80px"></div>
      </header>

      <!-- Stepper -->
      @if (!saved()) {
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
        <div class="card">

          <!-- ── SUCCESS ── -->
          @if (saved()) {
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
                <p class="success-headline">Modifications enregistrées</p>
                <p class="success-title">Annonce<br>mise à jour !</p>
              </div>
              <div class="success-content">
                <p class="success-body">
                  Toutes vos modifications sont désormais en ligne et visibles par les utilisateurs.
                </p>
                <div class="success-actions">
                  <button type="button" class="btn-see-primary" (click)="goToAnnonce()">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    Voir l'annonce
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

          <!-- ── LOADING ── -->
          } @else if (loading()) {
            <div class="loading-card">
              <div class="spinner"></div>
              <span class="loading-txt">Chargement de l'annonce…</span>
            </div>

          <!-- ── FORM ── -->
          } @else {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

              <!-- ════ ÉTAPE 1 ════ -->
              @if (currentStep() === 1) {
                <div class="step-band">
                  <span class="edit-badge">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Modification
                  </span>
                  <p class="step-h1">Bien &<br>localisation</p>
                  <p class="step-sub">Type de bien et adresse</p>
                </div>
                <div class="step-body">

                  <p class="section-label">Type de bien</p>
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
                    <label class="field-label" for="e-ville">Ville</label>
                    <div class="input-wrap">
                      <span class="ico-l">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                      </span>
                      <select id="e-ville" class="input with-l" formControlName="ville" (change)="onVilleChange($event)">
                        <option value="">Sélectionner une ville…</option>
                        @for (v of villes(); track v) {
                          <option [value]="v">{{ v }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="field">
                    <label class="field-label" for="e-quartier">Quartier</label>
                    <div class="ac-wrap">
                      <div class="input-wrap">
                        <span class="ico-l">
                          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                        </span>
                        <input id="e-quartier" type="text" class="input with-l"
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
                  <span class="edit-badge">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Modification
                  </span>
                  <p class="step-h1">Détails<br>de l'annonce</p>
                  <p class="step-sub">Prix, description et contact</p>
                </div>
                <div class="step-body">

                  <div class="field">
                    <label class="field-label" for="e-prix">Loyer mensuel</label>
                    <div class="input-wrap">
                      <span class="ico-l">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </span>
                      <input id="e-prix" type="text" inputmode="numeric"
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
                    <label class="field-label" for="e-desc">Description</label>
                    <div class="input-wrap">
                      <textarea id="e-desc" class="input"
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
                        Encore {{ 30 - descLen() }} caractère(s) requis
                      </div>
                    } @else if (descLen() === 0) {
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
                    <div class="wa-field-wrap">

                      @if (!editingWa()) {
                        <!-- Affichage du numéro actuel (chargé depuis le compte) -->
                        <div class="wa-current-card">
                          <div class="wa-current-left">
                            <div class="wa-current-icon">
                              <svg viewBox="0 0 24 24" fill="#fff" width="18" height="18">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              </svg>
                            </div>
                            <div class="wa-current-texts">
                              <strong>Numéro WhatsApp actuel</strong>
                              <div class="wa-current-number">{{ currentWaDisplay() }}</div>
                            </div>
                          </div>
                          <button type="button" class="wa-edit-btn" (click)="startEditWa()">
                            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Modifier
                          </button>
                        </div>
                      } @else {
                        <!-- Saisie d'un nouveau numéro -->
                        <div class="wa-input-card">
                          <div class="wa-input-header">
                            <div class="wa-input-header-left">
                              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              </svg>
                              Nouveau numéro
                            </div>
                            <button type="button" class="wa-cancel-btn" (click)="cancelEditWa()">
                              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                              </svg>
                              Annuler
                            </button>
                          </div>
                          <div class="wa-input-body">
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
                                [value]="waInputDisplay()"
                                placeholder="6XX XX XX XX"
                                (input)="onWaInput($event)"
                                (blur)="form.get('whatsappRaw')!.markAsTouched()" />
                            </div>
                            <div class="wa-input-hint">
                              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                              </svg>
                              Votre numéro n'est jamais affiché en clair
                            </div>
                          </div>
                        </div>
                      }
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
                  <span class="edit-badge">
                    <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Modification
                  </span>
                  <p class="step-h1">Photos &<br>confirmation</p>
                  <p class="step-sub">Gérez les photos et validez</p>
                </div>
                <div class="step-body">

                  <!-- Photos -->
                  <div class="photos-section">
                    <div class="photo-header">
                      <span class="photo-label-txt">Photos</span>
                      <span class="photo-count-pill">{{ activePhotoCount() }} / 4</span>
                    </div>

                    @if (activePhotoCount() < 4) {
                      <div class="photo-upload-zone"
                        [class.drag]="isDragging()"
                        (dragover)="onDragOver($event)"
                        (dragleave)="isDragging.set(false)"
                        (drop)="onDrop($event)">
                        <div class="upload-icon-wrap">
                          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                        <span class="upload-title">Ajouter des photos</span>
                        <span class="upload-sub">JPG, PNG, WebP · max 4 Mo · tap ou glisser</span>
                        <input #fileInput type="file" class="photo-file-input"
                          accept="image/jpeg,image/png,image/webp,image/*"
                          multiple (change)="onFilesSelected($event)" />
                      </div>
                    }

                    @if (allPhotos().length > 0) {
                      <div class="photo-grid">
                        @for (p of allPhotos(); track photoKey(p); let i = $index) {
                          <div class="photo-cell"
                            [class.to-delete]="p.kind === 'existing' && p.markedForDelete">
                            <img
                              [src]="p.kind === 'existing' ? (p.urlThumb || p.url) : p.previewUrl"
                              [alt]="'Photo ' + (i + 1)"
                              loading="lazy" />

                            @if (!(p.kind === 'existing' && p.markedForDelete)) {
                              <div class="photo-actions">
                                <button type="button" class="photo-del-btn"
                                  (click)="removePhoto(p)"
                                  [attr.aria-label]="'Supprimer la photo ' + (i + 1)">
                                  <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                  </svg>
                                </button>
                              </div>
                              @if (i === 0) {
                                <span class="photo-badge">Principale</span>
                              }
                              @if (p.kind === 'new') {
                                <span class="photo-badge-new">Nouveau</span>
                              }
                            } @else {
                              <button type="button" class="restore-btn" (click)="restorePhoto((p).id)">
                                Annuler
                              </button>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Récap -->
                  <p class="section-label" style="margin-top:24px">Récapitulatif</p>
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
                          {{ activePhotoCount() === 0 ? 'Aucune photo' : activePhotoCount() + ' photo' + (activePhotoCount() > 1 ? 's' : '') }}
                          @if (photosToDelete().length > 0) {
                            <span style="color:var(--red);font-size:11px;margin-left:5px">
                              ({{ photosToDelete().length }} à supprimer)
                            </span>
                          }
                          @if (newPhotos().length > 0) {
                            <span style="color:var(--green);font-size:11px;margin-left:5px">
                              (+{{ newPhotos().length }} nouveau{{ newPhotos().length > 1 ? 'x' : '' }})
                            </span>
                          }
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
                        <div class="recap-val">
                          {{ editingWa() ? 'Nouveau numéro saisi' : currentWaDisplay() }}
                        </div>
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
                  <button type="submit" class="btn-save" [disabled]="submitting()">
                    @if (submitting()) {
                      <span class="spin">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" d="M12 2a10 10 0 010 10"/>
                        </svg>
                      </span>
                      Enregistrement…
                    } @else {
                      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Sauvegarder
                    }
                  </button>
                </div>
              }

            </form>
          }
        </div>
      </div>
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
  readonly currentStep     = signal(1);
  readonly loading         = signal(true);
  readonly submitting      = signal(false);
  readonly submitError     = signal<string | null>(null);
  readonly saved           = signal(false);
  readonly typesBiens      = signal<TypeBienResponse[]>([]);
  readonly villesAvecId    = signal<{ id: number; ville: string }[]>([]);
  readonly allQuartiers    = signal<string[]>([]);
  readonly showSuggestions = signal(false);
  readonly isDragging      = signal(false);
  readonly allPhotos       = signal<Photo[]>([]);

  /** Numéro WhatsApp actuel (chargé depuis le backend, formaté pour affichage) */
  readonly currentWaDisplay  = signal<string>('Chargement…');
  /** Numéro brut stocké côté serveur (digits uniquement, avec indicatif) */
  readonly currentWaRaw      = signal<string>('');
  /** true = l'utilisateur veut saisir un nouveau numéro */
  readonly editingWa         = signal(false);
  /** Affichage formaté du champ de saisie nouveau numéro */
  readonly waInputDisplay    = signal('');
  /** Valeur formatée du prix dans l'input */
  readonly prixDisplay       = signal('');

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
    /**
     * whatsappRaw est utilisé SEULEMENT quand editingWa() = true.
     * Sinon on envoie currentWaRaw() tel quel.
     */
    whatsappRaw:    [''],
  });

  readonly formValue = signal(this.form.getRawValue());

  /* ── Computed ── */
  readonly villes = computed(() => this.villesAvecId().map(v => v.ville));

  readonly descLen = computed(() => (this.formValue()?.description ?? '').length);

  readonly prixValide = computed(() => {
    const p = this.formValue()?.prix;
    return p != null && p >= 1000;
  });

  readonly prixPreview = computed(() => {
    const p = this.formValue()?.prix;
    if (!p || p < 1000) return null;
    return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';
  });

  readonly filteredQuartiers = computed(() => {
    const s = (this.formValue()?.quartier ?? '').toLowerCase().trim();
    const all = this.allQuartiers();
    return (s ? all.filter(q => q.toLowerCase().includes(s)) : all).slice(0, 10);
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
    const descOk = (v.description?.length ?? 0) >= 30;
    const prixOk = v.prix != null && v.prix >= 1000;
    // Si on édite le WA, il faut un numéro valide
    const waOk = !this.editingWa() ||
      (v.whatsappRaw ?? '').replace(/\D/g, '').length >= 9;
    return !descOk || !prixOk || !waOk;
  });

  readonly photosToDelete = computed(() =>
    this.allPhotos().filter((p): p is ExistingPhoto => p.kind === 'existing' && p.markedForDelete)
  );
  readonly newPhotos = computed(() =>
    this.allPhotos().filter((p): p is NewPhoto => p.kind === 'new')
  );
  readonly activePhotoCount = computed(() =>
    this.allPhotos().filter(p =>
      p.kind === 'new' || (p.kind === 'existing' && !p.markedForDelete)
    ).length
  );

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.annonceId = +this.route.snapshot.paramMap.get('id')!;

    forkJoin({
      types:   this.typeBienApi.getAll(),
      villes:  this.locApi.getVillesAvecId(),
      annonce: this.annonceApi.getAnnonce(this.annonceId),
    }).subscribe({
      next: ({ types, villes, annonce }) => {
        this.typesBiens.set(
          (types.data ?? []).filter((t: TypeBienResponse) => t.estActif !== false)
        );
        this.villesAvecId.set(villes.data ?? []);

        const a = annonce.data;
        const villeNom = a.ville ?? '';
        const foundVille = (villes.data ?? []).find((v: { id: number; ville: string }) => v.ville === villeNom);

        this.form.patchValue({
          typeBienId:     this.findTypeBienId(a.typeBien, types.data ?? []),
          ville:          villeNom,
          localisationId: foundVille?.id ?? null,
          quartier:       a.quartier ?? '',
          description:    a.description ?? '',
          prix:           a.prix ?? null,
        });

        // Format prix pour affichage
        if (a.prix) {
          this.prixDisplay.set(
            new Intl.NumberFormat('fr-FR').format(a.prix)
          );
        }

        // Pré-charger le numéro WhatsApp depuis les données du compte
        // lienWhatsApp est du type "https://wa.me/237XXXXXXXXX" ou "+237XXXXXXXXX"
        if (a.lienWhatsApp) {
          const raw = a.lienWhatsApp
            .replace('https://wa.me/', '')
            .replace('wa.me/', '')
            .replace(/\D/g, '');
          this.currentWaRaw.set(raw);
          this.currentWaDisplay.set(this.formatWaForDisplay(raw));
        } else {
          // Fallback : numéro du compte utilisateur
          this.currentWaDisplay.set('Numéro de votre compte');
          this.currentWaRaw.set('');
        }

        if (villeNom) {
          this.locApi.getQuartiers(villeNom).subscribe(
            r => this.allQuartiers.set(r.data ?? [])
          );
        }

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

        this.formValue.set(this.form.getRawValue());
        this.loading.set(false);
      },
      error: () => {
        this.toast.error("Impossible de charger l'annonce");
        this.loading.set(false);
        this.router.navigate(['/dashboard/mes-annonces']);
      },
    });

    this.form.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$)).subscribe(() => {
      this.formValue.set(this.form.getRawValue());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.newPhotos().forEach(p => URL.revokeObjectURL(p.previewUrl));
  }

  /* ── WhatsApp ── */
  startEditWa(): void {
    this.editingWa.set(true);
    this.waInputDisplay.set('');
    this.form.patchValue({ whatsappRaw: '' });
  }

  cancelEditWa(): void {
    this.editingWa.set(false);
    this.waInputDisplay.set('');
    this.form.patchValue({ whatsappRaw: '' });
  }

  onWaInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 9);
    const f = this.formatWaDigits(digits);
    el.value = f;
    this.waInputDisplay.set(f);
    this.form.patchValue({ whatsappRaw: digits });
    this.form.get('whatsappRaw')!.markAsDirty();
  }

  private formatWaDigits(digits: string): string {
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return digits.slice(0,3) + ' ' + digits.slice(3);
    if (digits.length <= 7) return digits.slice(0,3) + ' ' + digits.slice(3,5) + ' ' + digits.slice(5);
    return digits.slice(0,3) + ' ' + digits.slice(3,5) + ' ' + digits.slice(5,7) + ' ' + digits.slice(7);
  }

  private formatWaForDisplay(raw: string): string {
    // raw = "237XXXXXXXXX" ou "XXXXXXXXX"
    const local = raw.startsWith('237') ? raw.slice(3) : raw;
    return '+237 ' + this.formatWaDigits(local.slice(0, 9));
  }

  /* ── Prix ── */
  onPrixInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : null;
    const formatted = num != null
      ? new Intl.NumberFormat('fr-FR').format(num)
      : '';
    el.value = formatted;
    this.prixDisplay.set(formatted);
    this.form.patchValue({ prix: num });
    this.form.get('prix')!.markAsDirty();
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
      this.locApi.getQuartiers(villeNom).subscribe(r => this.allQuartiers.set(r.data ?? []));
    }
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

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging.set(true); }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    this.addFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  private addFiles(files: File[]): void {
    const remaining = 4 - this.activePhotoCount();
    if (remaining <= 0) { this.toast.info('Maximum 4 photos'); return; }
    const valid = files.filter(f => {
      const okType = ['image/jpeg','image/png','image/webp'].includes(f.type) || f.type.startsWith('image/');
      if (!okType) { this.toast.error(`${f.name} : format non supporté`); return false; }
      if (f.size > 4 * 1024 * 1024) { this.toast.error(`${f.name} : max 4 Mo`); return false; }
      return true;
    }).slice(0, remaining);
    this.allPhotos.update(list => [
      ...list,
      ...valid.map(f => ({
        kind: 'new' as const,
        localId: this.generateId(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      })),
    ]);
  }

  removePhoto(p: Photo): void {
    if (p.kind === 'existing') {
      this.allPhotos.update(list =>
        list.map(x => x.kind === 'existing' && x.id === p.id ? { ...x, markedForDelete: true } : x)
      );
    } else {
      URL.revokeObjectURL(p.previewUrl);
      this.allPhotos.update(list =>
        list.filter(x => !(x.kind === 'new' && x.localId === p.localId))
      );
    }
  }

  restorePhoto(photoId: number): void {
    this.allPhotos.update(list =>
      list.map(x => x.kind === 'existing' && x.id === photoId ? { ...x, markedForDelete: false } : x)
    );
  }

  photoKey(p: Photo): string {
    return p.kind === 'existing' ? `e-${p.id}` : `n-${p.localId}`;
  }

  /* ── Navigation ── */
  nextStep(): void { if (this.currentStep() < 3) this.currentStep.update(v => v + 1); }
  prevStep(): void { if (this.currentStep() > 1)  this.currentStep.update(v => v - 1); }
  goBack(): void   { window.history.back(); }
  goToAnnonce(): void { this.router.navigate(['/annonces', this.annonceId]); }

  isErr(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c?.invalid && c?.touched);
  }

  /* ── Submit ── */
  onSubmit(): void {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    this.submitError.set(null);
    this.submitting.set(true);

    const v = this.form.getRawValue();

    // Construire le numéro WhatsApp à envoyer
    let whatsApp: string | undefined;
    if (this.editingWa()) {
      const digits = (v.whatsappRaw ?? '').replace(/\D/g, '');
      if (digits.length >= 9) {
        whatsApp = digits.startsWith('237') ? `+${digits}` : `+237${digits}`;
      }
    } else {
      // Conserver l'existant
      const raw = this.currentWaRaw();
      if (raw) {
        whatsApp = raw.startsWith('237') ? `+${raw}` : `+237${raw}`;
      }
    }

    this.annonceApi.modifier(this.annonceId, {
      typeBienId:     v.typeBienId!,
      localisationId: v.localisationId!,
      quartier:       (v.quartier ?? '').trim(),
      description:    v.description!,
      prix:           v.prix!,
      ...(whatsApp ? { numeroWhatsApp: whatsApp } : {}),
    }).subscribe({
      next: () => this.handlePhotos(),
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
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

    const ops$ = [
      ...toDelete.map(p => this.photoApi.supprimerPhoto(this.annonceId, p.id)),
      ...(toUpload.length > 0
        ? [this.photoApi.uploadPhotos(this.annonceId, toUpload.map(p => p.file))]
        : []),
    ];

    forkJoin(ops$).subscribe({
      next:  () => this.finalize(),
      error: () => {
        this.toast.info("Annonce modifiée. Certaines photos n'ont pas pu être traitées.");
        this.finalize();
      },
    });
  }

  private finalize(): void {
    this.newPhotos().forEach(p => URL.revokeObjectURL(p.previewUrl));
    this.submitting.set(false);
    this.toast.success('Annonce mise à jour avec succès !');
    this.saved.set(true);
  }

  /* ── Helpers ── */
  private findTypeBienId(libelle: string, types: TypeBienResponse[]): number | null {
    return types.find(t => t.libelle === libelle)?.id ?? null;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
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
}