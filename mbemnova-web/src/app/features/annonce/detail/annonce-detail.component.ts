import {
  Component, OnInit, inject, signal, computed, effect, HostListener, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { favoriActions } from '@store/favori/favori.actions';
import { selectAnnonceDetail, selectDetailLoading } from '@store/annonce/annonce.selectors';
import { selectFavoriIds } from '@store/favori/favori.selectors';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { ContactApi } from '@core/services/api/contact.api';
import { CommentaireApi } from '@core/services/api/commentaire.api';
import { SignalementApi } from '@core/services/api/signalement.api';
import { ToastService } from '@core/services/toast.service';
import { MOTIF_SIGNALEMENT_LABELS } from '@core/services/models';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-annonce-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    BackButtonComponent, LoadingSpinnerComponent,
    FcfaPipe, TimeAgoPipe,
  ],
  styles: [`
    * { box-sizing: border-box; }

    /* ══ LAYOUT ══ */
    .detail-wrap {
      max-width: 960px; margin: 0 auto;
      padding: 16px 16px 80px;
    }

    /* ══ GALERIE ══ */
    .gallery {
      border-radius: 18px; overflow: hidden;
      background: #eef0fb; margin: 14px 0 24px;
      box-shadow: 0 4px 20px rgba(26,35,126,.08);
    }
    .gallery-main {
      position: relative; aspect-ratio: 16/9;
      overflow: hidden; cursor: grab; user-select: none;
      background: #eef0fb;
    }
    .gallery-main:active { cursor: grabbing; }

    /* Skeleton shimmer */
    .gallery-main::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg,#eef0fb 25%,#dde1f5 50%,#eef0fb 75%);
      background-size: 200% 100%;
      animation: shim 1.6s infinite; z-index: 0;
    }
    @keyframes shim { to { background-position: -200% 0; } }
    .gallery-main.loaded::before { display: none; }

    .gallery-slides {
      position: relative; display: flex;
      width: 100%; height: 100%;
      transition: transform .35s cubic-bezier(.4,0,.2,1);
      will-change: transform; z-index: 1;
    }
    .gallery-slides.no-transition { transition: none; }
    .gallery-slide { flex-shrink: 0; width: 100%; height: 100%; }
    .gallery-slide img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      pointer-events: none; -webkit-user-drag: none;
      transition: opacity .3s;
    }

    .gallery-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 38px; height: 38px;
      background: rgba(255,255,255,.92); backdrop-filter: blur(8px);
      border: none; border-radius: 50%; color: #1A237E;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,.15);
      transition: background .15s, transform .15s, box-shadow .15s; z-index: 3;
    }
    .gallery-nav:hover {
      background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.2);
      transform: translateY(-50%) scale(1.06);
    }
    .gallery-nav.prev { left: 12px; }
    .gallery-nav.next { right: 12px; }
    .gallery-nav svg { width: 18px; height: 18px; }

    .gallery-counter {
      position: absolute; bottom: 14px; right: 14px;
      background: rgba(0,0,0,.55); backdrop-filter: blur(6px);
      color: #fff; font-size: 12px; font-weight: 600;
      padding: 4px 10px; border-radius: 20px; z-index: 3;
    }
    .gallery-dots {
      position: absolute; bottom: 14px; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 6px; z-index: 3;
    }
    .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,.5); border: none;
      cursor: pointer; padding: 0;
      transition: background .2s, transform .2s, width .2s;
    }
    .dot.active { background: #fff; transform: scale(1.3); width: 18px; border-radius: 3px; }

    .gallery-thumbs {
      display: flex; gap: 8px; padding: 8px;
      overflow-x: auto; scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .gallery-thumbs::-webkit-scrollbar { display: none; }
    .thumb {
      flex-shrink: 0; width: 64px; height: 64px;
      border-radius: 10px; overflow: hidden;
      border: 2px solid transparent; cursor: pointer;
      transition: border-color .2s, opacity .2s, transform .15s;
      opacity: .5; position: relative; background: #dde1f5;
    }
    .thumb::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg,#dde1f5 25%,#c5cbe8 50%,#dde1f5 75%);
      background-size: 200% 100%; animation: shim 1.6s infinite;
    }
    .thumb.loaded::after { display: none; }
    .thumb:hover { opacity: .82; transform: scale(1.05); }
    .thumb.active { border-color: #1A237E; opacity: 1; transform: scale(1.05); }
    .thumb img {
      width: 100%; height: 100%; object-fit: cover;
      display: block; pointer-events: none; position: relative; z-index: 1;
    }

    /* ══ GRID ══ */
    .detail-grid {
      display: grid; grid-template-columns: 1fr 300px;
      gap: 20px; align-items: start;
    }
    @media(max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .col-aside { order: -1; }
    }
    .col-main { min-width: 0; overflow: hidden; }

    /* ══ CARDS ══ */
    .card {
      background: #fff; border: 0.5px solid rgba(0,0,0,.08);
      border-radius: 16px; padding: 20px;
      overflow: hidden; word-break: break-word;
    }
    .card + .card { margin-top: 14px; }

    /* ══ BADGE STATUT ══ */
    .badge-statut {
      display: inline-flex; align-items: center;
      border-radius: 8px; padding: 4px 10px;
      font-size: 10.5px; font-weight: 700;
      letter-spacing: .04em; line-height: 1; margin-bottom: 10px;
    }
    .s-active  { background: #E8EAF6; color: #1A237E; border: 0.5px solid rgba(26,35,126,.25); }
    .s-pause   { background: #FFF3E0; color: #BF360C; }
    .s-expired { background: #FFEBEE; color: #B71C1C; }
    .s-arch    { background: #ECEFF1; color: #37474F; }

    /* ══ PRIX ══ */
    .prix-label {
      font-size: 26px; font-weight: 700; color: #0f172a;
      letter-spacing: -.02em; line-height: 1.2;
    }
    .prix-meta { font-size: 11px; color: #9ca3af; margin-top: 5px; }

    /* ══ TITRE ══ */
    .annonce-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px; font-weight: 500; color: #0f172a;
      letter-spacing: -.01em; margin: 0 0 6px; word-break: break-word;
    }
    .annonce-loc {
      display: flex; align-items: center; gap: 5px;
      font-size: 13px; color: #6b7280;
    }
    .annonce-loc svg { width: 13px; height: 13px; flex-shrink: 0; }

    .section-title {
      font-size: 12px; font-weight: 600;
      letter-spacing: .05em; text-transform: uppercase;
      color: #94a3b8; margin-bottom: 14px;
    }

    .desc-text {
      font-size: 14px; color: #374151; line-height: 1.75;
      white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word;
    }

    /* ══ STATS ══ */
    .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
    .stat-box {
      background: #f8fafc; border: 0.5px solid rgba(0,0,0,.06);
      border-radius: 12px; padding: 14px 10px; text-align: center;
    }
    .stat-val { font-size: 22px; font-weight: 700; color: #0f172a; }
    .stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 3px; }

    /* ══ BTN WHATSAPP ══ */
    .btn-whatsapp {
      width: 100%; display: flex; align-items: center;
      justify-content: center; gap: 10px; padding: 14px;
      background: #22c55e; color: #fff; font-size: 14px; font-weight: 600;
      border: none; border-radius: 12px; cursor: pointer;
      box-shadow: 0 2px 8px rgba(34,197,94,.3);
      transition: background .15s, transform .1s; text-decoration: none;
    }
    .btn-whatsapp:hover { background: #16a34a; }
    .btn-whatsapp:active { transform: scale(.98); }
    .btn-whatsapp:disabled { opacity: .6; cursor: not-allowed; }
    .btn-whatsapp svg { width: 20px; height: 20px; flex-shrink: 0; }

    /* ══ BTN FAVORI ══ */
    .btn-favori {
      width: 100%; display: flex; align-items: center;
      justify-content: center; gap: 8px; padding: 11px;
      background: #fff; font-size: 13px; font-weight: 500;
      border: 0.5px solid rgba(0,0,0,.12); border-radius: 12px;
      cursor: pointer; margin-top: 10px; color: #374151;
      transition: background .15s, border-color .15s, color .15s;
    }
    .btn-favori:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
    .btn-favori.active { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
    .btn-favori svg { width: 16px; height: 16px; }

    /* ══ BTN SIGNALER ══ */
    .btn-signaler {
      width: 100%; padding: 10px; background: none; border: none;
      font-size: 12px; color: #94a3b8; cursor: pointer; margin-top: 6px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: color .15s; border-radius: 8px;
    }
    .btn-signaler:hover { color: #ef4444; }
    .btn-signaler.already-reported {
      color: #F57C00 !important; cursor: default; pointer-events: none;
    }

    /* ══ BTN PARTAGER ══ */
    .btn-share {
      width: 38px; height: 38px; background: #f8fafc;
      border: 0.5px solid rgba(0,0,0,.1); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; transition: background .15s, transform .15s;
    }
    .btn-share:hover { background: #e2e8f0; transform: scale(1.06); }
    .btn-share svg { width: 16px; height: 16px; color: #64748b; }

    /* ══ SHARE SHEET ══ */
    .share-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
      display: flex; align-items: flex-end; justify-content: center;
      animation: fadeIn .18s ease;
    }
    @media(min-width: 640px) {
      .share-overlay { align-items: center; }
      .share-box { border-radius: 20px !important; max-width: 380px !important; }
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideUp {
      from { transform: translateY(60px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .share-box {
      width: 100%; max-width: 520px; background: #fff;
      border-radius: 20px 20px 0 0; padding: 8px 20px 32px;
      animation: slideUp .22s cubic-bezier(.4,0,.2,1);
    }
    .share-handle {
      width: 36px; height: 4px; background: #e2e8f0;
      border-radius: 2px; margin: 12px auto 20px;
    }
    .share-title {
      font-size: 15px; font-weight: 600; color: #111827;
      margin-bottom: 20px; text-align: center;
    }
    .share-grid {
      display: grid; grid-template-columns: repeat(4,1fr);
      gap: 12px; margin-bottom: 20px;
    }
    .share-item {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      cursor: pointer; border: none; background: none;
      padding: 12px 6px; border-radius: 12px;
      transition: background .15s, transform .15s;
    }
    .share-item:hover { background: #f8fafc; transform: translateY(-2px); }
    .share-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .share-icon svg { width: 26px; height: 26px; }
    .share-icon-wa   { background: #dcfce7; color: #16a34a; }
    .share-icon-fb   { background: #dbeafe; color: #1d4ed8; }
    .share-icon-tw   { background: #f1f5f9; color: #0f172a; }
    .share-icon-copy { background: #f1f5f9; color: #475569; }
    .share-label { font-size: 11px; font-weight: 500; color: #374151; text-align: center; }
    .share-divider { height: .5px; background: rgba(0,0,0,.07); margin-bottom: 16px; }
    .share-url-row {
      display: flex; gap: 10px; align-items: center;
      background: #f8fafc; border: .5px solid rgba(0,0,0,.09);
      border-radius: 10px; padding: 10px 14px;
    }
    .share-url-text {
      flex: 1; font-size: 12px; color: #6b7280;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .share-copy-btn {
      flex-shrink: 0; padding: 6px 14px; background: #1A237E; color: #fff;
      font-size: 12px; font-weight: 600; border: none; border-radius: 8px;
      cursor: pointer; transition: opacity .15s;
    }
    .share-copy-btn:hover { opacity: .88; }
    .share-copy-btn.copied { background: #22c55e; }

    /* ══ COMMENTAIRES ══ */
    .comment-bubble {
      background: #f8fafc; border: .5px solid rgba(0,0,0,.06);
      border-radius: 12px; border-top-left-radius: 3px;
      padding: 10px 13px; word-break: break-word;
    }
    .comment-author { font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 4px; }
    .comment-text {
      font-size: 13px; color: #475569; line-height: 1.6;
      word-break: break-word; overflow-wrap: break-word;
    }
    .comment-time { font-size: 11px; color: #94a3b8; margin-top: 5px; padding-left: 2px; }
    .reply-bubble {
      background: #eff6ff; border: .5px solid rgba(37,99,235,.12);
      border-radius: 12px; border-top-left-radius: 3px;
      padding: 10px 13px; margin-top: 8px; margin-left: 16px;
      word-break: break-word;
    }
    .reply-author { font-size: 12px; font-weight: 600; color: #1E3A8A; margin-bottom: 4px; }
    .reply-text { font-size: 13px; color: #1E3A8A; line-height: 1.6; word-break: break-word; }

    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; flex-shrink: 0;
    }
    .avatar-blue { background: #dbeafe; color: #1E3A8A; }
    .avatar-dark { background: #1E3A8A; color: #fff; }

    .comment-input {
      width: 100%; padding: 11px 14px;
      border: .5px solid rgba(0,0,0,.1); border-radius: 12px;
      background: #f8fafc; font-size: 13px; color: #111827;
      resize: none; outline: none;
      transition: border-color .15s, background .15s;
      font-family: inherit;
    }
    .comment-input:focus { border-color: rgba(0,0,0,.2); background: #fff; }
    .btn-post {
      padding: 8px 18px; background: #1E3A8A; color: #fff;
      font-size: 12px; font-weight: 600; border: none;
      border-radius: 20px; cursor: pointer; transition: opacity .15s;
    }
    .btn-post:hover { opacity: .88; }
    .btn-post:disabled { opacity: .45; cursor: not-allowed; }
    .char-count { font-size: 11px; color: #9ca3af; }

    /* ══ MODAL SIGNALEMENT ══ */
    .sig-overlay {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: flex-end; justify-content: center;
      background: rgba(10,20,50,.5); backdrop-filter: blur(5px);
      animation: fadeIn .18s ease;
    }
    @media(min-width: 640px) {
      .sig-overlay { align-items: center; padding: 20px; }
      .sig-box {
        border-radius: 20px !important;
        max-width: 420px !important;
        padding-bottom: 28px !important;
        box-shadow: 0 32px 80px rgba(10,20,50,.2) !important;
      }
      .sig-handle { display: none !important; }
    }
    .sig-box {
      width: 100%; max-width: 520px; background: #fff;
      border-radius: 24px 24px 0 0;
      padding: 10px 18px 72px;
      animation: slideUp .25s cubic-bezier(.34,1.56,.64,1);
    }
    .sig-handle {
      width: 38px; height: 4px; background: #E0E7EF;
      border-radius: 4px; margin: 0 auto 18px;
    }
    .sig-title {
      font-size: 16px; font-weight: 800; color: #0D1B2A;
      text-align: center; margin-bottom: 4px;
    }
    .sig-sub {
      font-size: 12px; color: #90A4AE;
      text-align: center; margin-bottom: 18px;
    }

    /* Ligne motif — TOUTE cliquable */
    .motif-row {
      display: flex; align-items: center; gap: 13px;
      padding: 12px 14px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid transparent; margin-bottom: 6px;
      transition: background .12s, border-color .12s;
      user-select: none; -webkit-tap-highlight-color: transparent;
    }
    .motif-row:hover { background: #F5F7FA; }
    .motif-row:active { background: #EEF0FB; }
    .motif-row.sel {
      background: #E8EAF6; border-color: #C5CAE9;
    }

    /* Cercle checkbox custom */
    .motif-radio {
      width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid #D1D5DB; background: #fff;
      display: flex; align-items: center; justify-content: center;
      transition: border-color .15s, background .15s;
    }
    .motif-row.sel .motif-radio {
      border-color: #1A237E; background: #1A237E;
    }
    .motif-radio-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #fff; opacity: 0;
      transform: scale(.4);
      transition: opacity .15s, transform .15s;
    }
    .motif-row.sel .motif-radio-dot { opacity: 1; transform: scale(1); }

    .motif-text {
      font-size: 14px; color: #374151; flex: 1; line-height: 1.3;
    }
    .motif-row.sel .motif-text { color: #1A237E; font-weight: 600; }

    /* Zone textarea AUTRE */
    .sig-autre {
      margin-top: 8px; margin-bottom: 2px;
      animation: fadeIn .15s ease;
    }

    /* Actions */
    .sig-actions { display: flex; gap: 10px; margin-top: 18px; }
    .sig-cancel {
      flex: 1; height: 50px; background: #F5F7FA;
      border: 1.5px solid #E0E7EF; border-radius: 14px;
      font: 600 14px/1 'DM Sans', system-ui, sans-serif;
      color: #546E7A; cursor: pointer; transition: background .15s;
    }
    .sig-cancel:hover { background: #E8EAF6; color: #1A237E; border-color: #C5CAE9; }

    .sig-submit {
      flex: 2; height: 50px; border: none; border-radius: 14px;
      font: 700 14px/1 'DM Sans', system-ui, sans-serif;
      color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #E53935;
      box-shadow: 0 4px 14px rgba(229,57,53,.3);
      transition: background .15s, opacity .15s, transform .1s;
    }
    .sig-submit:hover:not(:disabled) { background: #C62828; }
    .sig-submit:active:not(:disabled) { transform: scale(.98); }
    .sig-submit:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
    .sig-submit svg { width: 16px; height: 16px; flex-shrink: 0; }

    /* Spinner */
    .spinner {
      width: 18px; height: 18px; border-radius: 50; flex-shrink: 0;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: #fff;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ══ NOT FOUND ══ */
    .not-found { text-align: center; padding: 80px 16px; }
    .not-found p { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
    .btn-back-list {
      display: inline-block; padding: 11px 24px; background: #1A237E; color: #fff;
      font-size: 13px; font-weight: 600; border-radius: 12px;
      text-decoration: none; transition: opacity .15s;
    }
    .btn-back-list:hover { opacity: .88; }

    /* ══ LOGIN PROMPT ══ */
    .login-prompt {
      text-align: center; padding: 20px 0 8px;
      border-top: .5px solid rgba(0,0,0,.07); margin-top: 16px;
    }
    .login-prompt p { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
    .btn-login {
      display: inline-block; padding: 9px 22px; background: #1E3A8A; color: #fff;
      font-size: 13px; font-weight: 600; border-radius: 10px;
      text-decoration: none; transition: opacity .15s;
    }
    .btn-login:hover { opacity: .88; }

    /* ══ NO PHOTO ══ */
    .no-photo-ph {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 10px;
      background: linear-gradient(135deg,#EEF0FB,#C5CAE9);
    }
    .no-photo-ph svg { width: 48px; height: 48px; color: #1A237E; opacity: .25; }
    .no-photo-ph span { font-size: 13px; color: #1A237E; opacity: .4; font-weight: 600; }
  `],
  template: `
    <div class="detail-wrap">
      <app-back-button />

      @if (loading()) {
        <app-loading-spinner />
      } @else if (annonce()) {

        <!-- ══ GALERIE ══ -->
        <div class="gallery">
          <div class="gallery-main" [class.loaded]="mainImgLoaded()"
            (mousedown)="onDragStart($event)" (mousemove)="onDragMove($event)"
            (mouseup)="onDragEnd($event)"   (mouseleave)="onDragEnd($event)"
            (touchstart)="onTouchStart($event)" (touchmove)="onTouchMove($event)"
            (touchend)="onTouchEnd($event)">

            <div class="gallery-slides"
              [class.no-transition]="isDragging()"
              [style.transform]="slidesTransform()">

              @if (photos().length > 0) {
                @for (p of photos(); track p.id; let i = $index) {
                  <div class="gallery-slide">
                    <img [src]="p.url" [alt]="annonce()!.typeBien"
                      [loading]="i === 0 ? 'eager' : 'lazy'"
                      [attr.fetchpriority]="i === 0 ? 'high' : 'low'"
                      (load)="onMainImgLoad(i)" (error)="onImgError($event)"/>
                  </div>
                }
              } @else {
                <div class="gallery-slide">
                  <div class="no-photo-ph">
                    <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                           a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6
                           a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>Aucune photo disponible</span>
                  </div>
                </div>
              }
            </div>

            @if (photos().length > 1) {
              <button class="gallery-nav prev" (click)="prevPhoto()" aria-label="Photo précédente">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button class="gallery-nav next" (click)="nextPhoto()" aria-label="Photo suivante">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <div class="gallery-counter">{{ photoIndex() + 1 }} / {{ photos().length }}</div>
              <div class="gallery-dots">
                @for (p of photos(); track p.id; let i = $index) {
                  <button class="dot" [class.active]="i === photoIndex()"
                    (click)="photoIndex.set(i)" [attr.aria-label]="'Photo ' + (i+1)">
                  </button>
                }
              </div>
            }
          </div>

          @if (photos().length > 1) {
            <div class="gallery-thumbs">
              @for (p of photos(); track p.id; let i = $index) {
                <button class="thumb" [class.active]="i === photoIndex()"
                  (click)="photoIndex.set(i)" [attr.aria-label]="'Vignette ' + (i+1)">
                  <img [src]="p.urlThumb" alt="" loading="lazy"
                    (load)="onThumbLoad($event)" (error)="onImgError($event)"/>
                </button>
              }
            </div>
          }
        </div>

        <!-- ══ GRID ══ -->
        <div class="detail-grid">

          <!-- Colonne principale -->
          <div class="col-main">
            <!-- En-tête -->
            <div class="card" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
              <div style="flex:1;min-width:0;overflow:hidden;">
                <span class="badge-statut" [ngClass]="getStatutClass(annonce()!.statut)">
                  {{ getStatutLabel(annonce()!.statut) }}
                </span>
                <h1 class="annonce-title">{{ annonce()!.typeBien }}</h1>
                <div class="annonce-loc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span style="word-break:break-word;">{{ annonce()!.quartier }}, {{ annonce()!.ville }}</span>
                </div>
              </div>
              <button class="btn-share" (click)="openShare()" aria-label="Partager">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342
                       m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316
                       m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316
                       a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              </button>
            </div>

            <!-- Description -->
            <div class="card">
              <p class="section-title">Description</p>
              <p class="desc-text">{{ annonce()!.description }}</p>
            </div>

            <!-- Stats -->
            <div class="card">
              <div class="stats-row">
                <div class="stat-box">
                  <div class="stat-val">{{ annonce()!.nombreVues }}</div>
                  <div class="stat-lbl">Vues</div>
                </div>
                <div class="stat-box">
                  <div class="stat-val">{{ annonce()!.nombreContacts }}</div>
                  <div class="stat-lbl">Contacts</div>
                </div>
                <div class="stat-box">
                  <div class="stat-val">{{ annonce()!.nombreCommentaires }}</div>
                  <div class="stat-lbl">Commentaires</div>
                </div>
              </div>
            </div>

            <!-- Commentaires -->
            <div class="card">
              <p class="section-title">Commentaires ({{ annonce()!.commentaires.length }})</p>

              @if (annonce()!.commentaires.length > 0) {
                <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:20px;">
                  @for (c of annonce()!.commentaires; track c.id) {
                    <div style="display:flex;gap:10px;min-width:0;">
                      <div class="avatar avatar-blue" style="flex-shrink:0;">{{ c.auteurPrenom[0] }}</div>
                      <div style="flex:1;min-width:0;overflow:hidden;">
                        <div class="comment-bubble">
                          <div class="comment-author">
                            {{ c.auteurPrenom }}
                            @if (c.estProprietaire) {
                              <span style="color:#1E3A8A;font-weight:400;"> · Propriétaire</span>
                            }
                          </div>
                          <p class="comment-text">{{ c.contenu }}</p>
                        </div>
                        <p class="comment-time">{{ c.dateCreation | timeAgo }}</p>
                        @if (c.reponse) {
                          <div class="reply-bubble">
                            <div class="reply-author">Propriétaire</div>
                            <p class="reply-text">{{ c.reponse.contenu }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p style="font-size:13px;color:#9ca3af;text-align:center;padding:16px 0;margin-bottom:16px;">
                  Aucun commentaire. Soyez le premier à poser une question !
                </p>
              }

              @if (isLoggedIn()) {
                <div style="display:flex;gap:10px;padding-top:16px;border-top:.5px solid rgba(0,0,0,.07);min-width:0;">
                  <div class="avatar avatar-dark" style="flex-shrink:0;">{{ userInitial() }}</div>
                  <div style="flex:1;min-width:0;overflow:hidden;">
                    <textarea class="comment-input" [(ngModel)]="newComment"
                      placeholder="Poser une question sur cette annonce…"
                      rows="2" maxlength="500"></textarea>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
                      <span class="char-count">{{ newComment.length }}/500</span>
                      <button class="btn-post" (click)="postComment()"
                        [disabled]="newComment.trim().length < 1 || postingComment()">
                        {{ postingComment() ? 'Envoi…' : 'Commenter' }}
                      </button>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="login-prompt">
                  <p>Connectez-vous pour laisser un commentaire</p>
                  <a routerLink="/auth/login" class="btn-login"
                    [queryParams]="{returnUrl: '/annonces/' + annonce()!.id}">Se connecter</a>
                </div>
              }
            </div>
          </div>

          <!-- ══ ASIDE ══ -->
          <div class="col-aside">
            <div style="position:sticky;top:80px;">
              <div class="card">
                <div class="prix-label">{{ annonce()!.prix | fcfa }}</div>
                <p class="prix-meta">Publié {{ annonce()!.datePublication | timeAgo }}</p>
                <p class="prix-meta">Expire le {{ formatExpiry(annonce()!.dateExpiration) }}</p>
              </div>

              <div style="margin-top:12px;">
                @if (annonce()!.statut === 'ACTIVE') {
                  @if (isLoggedIn()) {
                    <button class="btn-whatsapp" (click)="contactWhatsApp()" [disabled]="contactLoading()">
                      <svg viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      {{ contactLoading() ? 'Ouverture…' : 'Contacter via WhatsApp' }}
                    </button>
                  } @else {
                    <a routerLink="/auth/login" class="btn-whatsapp"
                      [queryParams]="{returnUrl: '/annonces/' + annonce()!.id}"
                      style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:10px;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      Se connecter pour contacter
                    </a>
                  }
                }

                @if (isLoggedIn()) {
                  <button class="btn-favori" [class.active]="isFavori()" (click)="toggleFavori()">
                    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                      [attr.fill]="isFavori() ? '#dc2626' : 'none'">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682
                           a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318
                           a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    {{ isFavori() ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
                  </button>

                  <!-- Bouton signaler — masqué si c'est l'annonce du user -->
                  @if (!annonce()!.estMienne) {
                    <button class="btn-signaler"
                      [class.already-reported]="alreadyReported()"
                      (click)="!alreadyReported() && openSignalement()">
                      @if (alreadyReported()) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        Signalement envoyé
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5
                               a2 2 0 00-2 2zm9-13.5V9"/>
                        </svg>
                        Signaler cette annonce
                      }
                    </button>
                  }
                }
              </div>
            </div>
          </div>
        </div>

        <!-- ══ MODAL SIGNALEMENT ══ -->
        @if (showSignalement()) {
          <div class="sig-overlay" (click)="showSignalement.set(false)">
            <div class="sig-box" (click)="$event.stopPropagation()">
              <div class="sig-handle"></div>
              <p class="sig-title">Signaler cette annonce</p>
              <p class="sig-sub">Quel problème avez-vous constaté ?</p>

              <!-- Motifs — toute la ligne est cliquable -->
              @for (motif of motifs; track motif.value) {
                <div class="motif-row"
                  [class.sel]="selectedMotif === motif.value"
                  (click)="selectedMotif = motif.value">
                  <div class="motif-radio">
                    <div class="motif-radio-dot"></div>
                  </div>
                  <span class="motif-text">{{ motif.label }}</span>
                </div>
              }

              <!-- Textarea si AUTRE -->
              @if (selectedMotif === 'AUTRE') {
                <div class="sig-autre">
                  <textarea class="comment-input" [(ngModel)]="signalementDesc"
                    placeholder="Précisez le motif…" rows="3">
                  </textarea>
                </div>
              }

              <div class="sig-actions">
                <button class="sig-cancel" (click)="showSignalement.set(false)">
                  Annuler
                </button>
                <button class="sig-submit"
                  [disabled]="!selectedMotif || submittingReport()"
                  (click)="submitSignalement()">
                  @if (submittingReport()) {
                    <div class="spinner"></div>
                    Envoi en cours…
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5
                           a2 2 0 00-2 2zm9-13.5V9"/>
                    </svg>
                    Envoyer le signalement
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ══ SHARE SHEET ══ -->
        @if (showShare()) {
          <div class="share-overlay" (click)="closeShare()">
            <div class="share-box" (click)="$event.stopPropagation()">
              <div class="share-handle"></div>
              <p class="share-title">Partager cette annonce</p>
              <div class="share-grid">
                <button class="share-item" (click)="shareVia('whatsapp')">
                  <div class="share-icon share-icon-wa">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span class="share-label">WhatsApp</span>
                </button>
                <button class="share-item" (click)="shareVia('facebook')">
                  <div class="share-icon share-icon-fb">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span class="share-label">Facebook</span>
                </button>
                <button class="share-item" (click)="shareVia('twitter')">
                  <div class="share-icon share-icon-tw">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span class="share-label">X (Twitter)</span>
                </button>
                <button class="share-item" (click)="shareVia('copy')">
                  <div class="share-icon share-icon-copy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </div>
                  <span class="share-label">{{ linkCopied() ? 'Copié !' : 'Copier' }}</span>
                </button>
              </div>
              <div class="share-divider"></div>
              <div class="share-url-row">
                <span class="share-url-text">{{ currentUrl() }}</span>
                <button class="share-copy-btn" [class.copied]="linkCopied()" (click)="copyLink()">
                  {{ linkCopied() ? 'Copié ✓' : 'Copier' }}
                </button>
              </div>
            </div>
          </div>
        }

      } @else {
        <div class="not-found">
          <p>Cette annonce n'est plus disponible.</p>
          <a routerLink="/annonces" class="btn-back-list">Voir des annonces similaires</a>
        </div>
      }
    </div>
  `,
})
export class AnnonceDetailComponent implements OnInit {
  private readonly store      = inject(Store);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly contactApi = inject(ContactApi);
  private readonly commentApi = inject(CommentaireApi);
  private readonly signalApi  = inject(SignalementApi);
  private readonly toast      = inject(ToastService);
  private readonly auth       = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly annonce    = this.store.selectSignal(selectAnnonceDetail);
  readonly loading    = this.store.selectSignal(selectDetailLoading);
  readonly isLoggedIn = this.auth.isLoggedIn;

  // Photos avec fallback
  readonly photos = computed(() => {
    const a = this.annonce();
    if (!a) return [];
    if (a.photos?.length > 0) return a.photos;
    if (a.photoPrincipale) return [{
      id: 0, url: a.photoPrincipale,
      urlThumb: a.photoPrincipaleThumb ?? a.photoPrincipale,
      ordre: 0, principale: true,
    }];
    return [];
  });

  // Galerie
  photoIndex    = signal(0);
  isDragging    = signal(false);
  mainImgLoaded = signal(false);

  private dragStartX    = 0;
  private dragCurrentX  = 0;
  private dragOffset    = 0;
  private touchStartX   = 0;
  private touchCurrentX = 0;

  readonly slidesTransform = computed(() => {
    const base   = -(this.photoIndex() * 100);
    const offset = this.isDragging() ? this.dragOffset : 0;
    return `translateX(calc(${base}% + ${offset}px))`;
  });

  // État UI
  contactLoading   = signal(false);
  postingComment   = signal(false);
  showSignalement  = signal(false);
  showShare        = signal(false);
  linkCopied       = signal(false);
  alreadyReported  = signal(false);
  submittingReport = signal(false);

  /** Synchronise l'état "déjà signalée" depuis le serveur (source de vérité), pas le sessionStorage. */
  private readonly syncAlreadyReported = effect(() => {
    const a = this.annonce();
    if (a) this.alreadyReported.set(a.dejaSignalee);
  });

  newComment      = '';
  selectedMotif   = '';
  signalementDesc = '';

  readonly motifs = Object.entries(MOTIF_SIGNALEMENT_LABELS)
    .map(([value, label]) => ({ value, label }));

  readonly userInitial = computed(() =>
    this.auth.currentUser()?.prenom?.[0]?.toUpperCase() ?? 'U'
  );

  private readonly favoriIds = this.store.selectSignal(selectFavoriIds);
  private readonly annonceId = computed(() => this.annonce()?.id ?? 0);
  readonly isFavori = computed(() => this.favoriIds().has(this.annonceId()));

  readonly currentUrl = computed(() =>
    typeof window !== 'undefined' ? window.location.href : ''
  );

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.store.dispatch(favoriActions.load());
    }
    // Abonnement (et non snapshot unique) — Angular réutilise ce composant
    // si seul l'id change sur la même route (/annonces/5 → /annonces/8),
    // sans redéclencher ngOnInit. Il faut donc réagir à chaque changement d'id.
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.loadAnnonce(+params.get('id')!));
  }

  private loadAnnonce(id: number): void {
    // Repart de zéro pour éviter d'afficher un état (galerie, commentaire en cours,
    // signalement déjà fait) qui appartient à l'annonce précédemment consultée
    this.photoIndex.set(0);
    this.mainImgLoaded.set(false);
    this.newComment = '';
    this.store.dispatch(annonceActions.loadDetail({ id }));
  }

  getStatutClass(s: string): string {
    return { ACTIVE: 's-active', EN_PAUSE: 's-pause', EXPIREE: 's-expired', ARCHIVEE: 's-arch' }[s] ?? 's-active';
  }
  getStatutLabel(s: string): string {
    return { ACTIVE: 'Active', EN_PAUSE: 'En pause', EXPIREE: 'Expirée', ARCHIVEE: 'Archivée' }[s] ?? s;
  }

  onMainImgLoad(index: number): void {
    if (index === 0) this.mainImgLoaded.set(true);
  }
  onThumbLoad(e: Event): void {
    (e.target as HTMLElement).closest('.thumb')?.classList.add('loaded');
  }
  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = '/assets/images/no-photo.svg';
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (this.showShare() || this.showSignalement()) return;
    if (this.photos().length <= 1) return;
    if (e.key === 'ArrowLeft')  this.prevPhoto();
    if (e.key === 'ArrowRight') this.nextPhoto();
  }

  prevPhoto(): void {
    const len = this.photos().length;
    this.photoIndex.update(i => (i - 1 + len) % len);
  }
  nextPhoto(): void {
    const len = this.photos().length;
    this.photoIndex.update(i => (i + 1) % len);
  }

  onDragStart(e: MouseEvent): void {
    if (this.photos().length <= 1) return;
    this.isDragging.set(true);
    this.dragStartX = this.dragCurrentX = e.clientX;
    this.dragOffset = 0;
  }
  onDragMove(e: MouseEvent): void {
    if (!this.isDragging()) return;
    this.dragCurrentX = e.clientX;
    this.dragOffset   = this.dragCurrentX - this.dragStartX;
  }
  onDragEnd(e: MouseEvent): void {
    if (!this.isDragging()) return;
    const diff = this.dragCurrentX - this.dragStartX;
    this.isDragging.set(false); this.dragOffset = 0;
    if (Math.abs(diff) > 60) diff < 0 ? this.nextPhoto() : this.prevPhoto();
  }
  onTouchStart(e: TouchEvent): void {
    if (this.photos().length <= 1) return;
    this.touchStartX = this.touchCurrentX = e.touches[0].clientX;
    this.isDragging.set(true); this.dragOffset = 0;
  }
  onTouchMove(e: TouchEvent): void {
    if (!this.isDragging()) return;
    this.touchCurrentX = e.touches[0].clientX;
    this.dragOffset = this.touchCurrentX - this.touchStartX;
  }
  onTouchEnd(e: TouchEvent): void {
    if (!this.isDragging()) return;
    const diff = this.touchCurrentX - this.touchStartX;
    this.isDragging.set(false); this.dragOffset = 0;
    if (Math.abs(diff) > 50) diff < 0 ? this.nextPhoto() : this.prevPhoto();
  }

  formatExpiry(date: string): string {
    return new Date(date).toLocaleDateString('fr-CM', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  openShare(): void {
    if (navigator.share) {
      navigator.share({
        title: this.annonce()?.typeBien,
        text:  `${this.annonce()?.typeBien} — ${this.annonce()?.quartier}, ${this.annonce()?.ville}`,
        url:   window.location.href,
      }).catch(() => this.showShare.set(true));
    } else {
      this.showShare.set(true);
    }
  }
  closeShare(): void {
    this.showShare.set(false);
    this.linkCopied.set(false);
  }
  shareVia(p: 'whatsapp' | 'facebook' | 'twitter' | 'copy'): void {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${this.annonce()?.typeBien} — ${this.annonce()?.quartier}, ${this.annonce()?.ville}`);
    if (p === 'copy') { this.copyLink(); return; }
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${title}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter:  `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    };
    window.open(links[p], '_blank', 'noopener,noreferrer,width=600,height=500');
    this.closeShare();
  }
  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.linkCopied.set(true);
      this.toast.success('Lien copié !');
      setTimeout(() => this.linkCopied.set(false), 2500);
    });
  }

  contactWhatsApp(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/annonces/${this.annonce()?.id}` } });
      return;
    }
    const a = this.annonce(); if (!a) return;
    this.contactLoading.set(true);
    this.contactApi.enregistrer(a.id).subscribe({
      next: (res) => {
        this.contactLoading.set(false);
        const url = res.data.lienWhatsApp;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      },
      error: () => this.contactLoading.set(false),
    });
  }

  toggleFavori(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/annonces/${this.annonce()?.id}` } });
      return;
    }
    const a = this.annonce(); if (!a) return;
    this.isFavori()
      ? this.store.dispatch(favoriActions.remove({ annonceId: a.id }))
      : this.store.dispatch(favoriActions.add({ annonceId: a.id }));
  }

  postComment(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/annonces/${this.annonce()?.id}` } });
      return;
    }
    const a = this.annonce();
    if (!a || this.newComment.trim().length < 1) return;
    this.postingComment.set(true);
    this.commentApi.poster({ contenu: this.newComment.trim(), annonceId: a.id }).subscribe({
      next: () => {
        this.toast.success('Commentaire publié !');
        this.newComment = '';
        this.postingComment.set(false);
        this.store.dispatch(annonceActions.loadDetail({ id: a.id }));
      },
      error: () => this.postingComment.set(false),
    });
  }

  openSignalement(): void {
    if (this.alreadyReported()) return;
    this.selectedMotif   = '';
    this.signalementDesc = '';
    this.showSignalement.set(true);
  }

  submitSignalement(): void {
    const a = this.annonce();
    if (!a || !this.selectedMotif || this.submittingReport()) return;
    this.submittingReport.set(true);
    this.signalApi.signaler({
      annonceId: a.id,
      motif: this.selectedMotif,
      details: this.signalementDesc || undefined,
    }).subscribe({
      next: () => {
        this.submittingReport.set(false);
        this.toast.success('Signalement envoyé. Merci !');
        this.alreadyReported.set(true);
        this.showSignalement.set(false);
        this.selectedMotif   = '';
        this.signalementDesc = '';
      },
      error: (err) => {
        this.submittingReport.set(false);
        this.toast.error(err?.error?.message ?? 'Erreur lors du signalement. Réessayez.');
      },
    });
  }
}