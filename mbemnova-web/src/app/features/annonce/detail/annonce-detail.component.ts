import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { annonceActions } from '@store/annonce/annonce.actions';
import { favoriActions } from '@store/favori/favori.actions';
import { selectAnnonceDetail, selectDetailLoading } from '@store/annonce/annonce.selectors';
import { selectIsLoggedIn, selectCurrentUser } from '@store/auth/auth.selectors';
import { isFavori } from '@store/favori/favori.selectors';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { FcfaPipe } from '@shared/pipes/fcfa.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { StatutAnnonce, CommentaireRequest } from '@core/services/models';
import { ContactApi } from '@core/services/api/contact.api';
import { CommentaireApi } from '@core/services/api/commentaire.api';
import { SignalementApi } from '@core/services/api/signalement.api';
import { ToastService } from '@core/services/toast.service';
import { MOTIF_SIGNALEMENT_LABELS, MotifSignalement } from '@core/services/models';
import { StorageService } from '@core/services/storage.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-annonce-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    BackButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    FcfaPipe,
    TimeAgoPipe,
  ],
  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');

      /* ── Layout ── */
      .detail-wrap {
        max-width: 960px;
        margin: 64px auto 0 auto;
        padding: 20px 16px 64px;
      }

      /* ── Galerie ── */
      .gallery {
        border-radius: 16px;
        overflow: hidden;
        background: #f3f4f6;
        margin: 16px 0 28px;
      }
      .gallery-main {
        position: relative;
        aspect-ratio: 16/9;
      }
      .gallery-main img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .gallery-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 36px;
        height: 36px;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(4px);
        border: none;
        border-radius: 50%;
        color: #fff;
        font-size: 18px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s;
      }
      .gallery-nav:hover {
        background: rgba(0, 0, 0, 0.65);
      }
      .gallery-nav.prev {
        left: 12px;
      }
      .gallery-nav.next {
        right: 12px;
      }

      .gallery-dots {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 6px;
      }
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        border: none;
        cursor: pointer;
        padding: 0;
        transition:
          background 0.15s,
          transform 0.15s;
      }
      .dot.active {
        background: #fff;
        transform: scale(1.3);
      }

      .gallery-thumbs {
        display: flex;
        gap: 8px;
        padding: 8px;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .gallery-thumbs::-webkit-scrollbar {
        display: none;
      }
      .thumb {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        border: 1.5px solid transparent;
        cursor: pointer;
        transition:
          border-color 0.15s,
          opacity 0.15s;
        opacity: 0.55;
      }
      .thumb.active {
        border-color: #1e3a5f;
        opacity: 1;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* ── Grid ── */
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 24px;
        align-items: start;
      }
      @media (max-width: 768px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
        .col-aside {
          order: -1;
        }
      }

      /* ── Cards ── */
      .card {
        background: #fff;
        border: 0.5px solid rgba(0, 0, 0, 0.08);
        border-radius: 14px;
        padding: 20px;
      }
      .card + .card {
        margin-top: 16px;
      }

      /* ── Prix (aside) ── */
      .prix-label {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 26px;
        font-weight: 600;
        color: #0f172a;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }
      .prix-meta {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
      }

      /* ── Titre ── */
      .annonce-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 22px;
        font-weight: 500;
        color: #0f172a;
        letter-spacing: -0.01em;
        margin: 0 0 6px;
      }
      .annonce-loc {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        color: #6b7280;
      }
      .annonce-loc svg {
        width: 13px;
        height: 13px;
        flex-shrink: 0;
      }

      /* ── Section title ── */
      .section-title {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 14px;
      }

      /* ── Description ── */
      .desc-text {
        font-size: 14px;
        color: #374151;
        line-height: 1.75;
        white-space: pre-line;
      }

      /* ── Stats ── */
      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .stat-box {
        background: #f8fafc;
        border: 0.5px solid rgba(0, 0, 0, 0.06);
        border-radius: 10px;
        padding: 14px 10px;
        text-align: center;
      }
      .stat-val {
        font-size: 20px;
        font-weight: 600;
        color: #0f172a;
      }
      .stat-lbl {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 3px;
      }

      /* ── CTA WhatsApp ── */
      .btn-whatsapp {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px;
        background: #22c55e;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition:
          background 0.15s,
          transform 0.1s;
      }
      .btn-whatsapp:hover {
        background: #16a34a;
      }
      .btn-whatsapp:active {
        transform: scale(0.98);
      }
      .btn-whatsapp:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-whatsapp svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      /* ── Btn favori ── */
      .btn-favori {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 11px;
        background: #fff;
        font-size: 13px;
        font-weight: 500;
        border: 0.5px solid rgba(0, 0, 0, 0.12);
        border-radius: 12px;
        cursor: pointer;
        transition:
          background 0.15s,
          border-color 0.15s;
        margin-top: 10px;
      }
      .btn-favori:hover {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #dc2626;
      }
      .btn-favori.active {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #dc2626;
      }
      .btn-favori svg {
        width: 16px;
        height: 16px;
      }

      /* ── Btn signaler ── */
      .btn-signaler {
        width: 100%;
        padding: 10px;
        background: none;
        border: none;
        font-size: 12px;
        color: #94a3b8;
        cursor: pointer;
        transition: color 0.15s;
        margin-top: 6px;
      }
      .btn-signaler:hover {
        color: #ef4444;
      }

      /* ── Btn partager ── */
      .btn-share {
        width: 36px;
        height: 36px;
        background: #f8fafc;
        border: 0.5px solid rgba(0, 0, 0, 0.08);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      .btn-share:hover {
        background: #f1f5f9;
      }
      .btn-share svg {
        width: 16px;
        height: 16px;
        color: #64748b;
      }

      /* ── Commentaires ── */
      .comment-bubble {
        background: #f8fafc;
        border: 0.5px solid rgba(0, 0, 0, 0.06);
        border-radius: 12px;
        border-top-left-radius: 3px;
        padding: 10px 13px;
      }
      .comment-author {
        font-size: 12px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 4px;
      }
      .comment-text {
        font-size: 13px;
        color: #475569;
        line-height: 1.6;
      }
      .comment-time {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 5px;
        padding-left: 2px;
      }

      .reply-bubble {
        background: #eff6ff;
        border: 0.5px solid rgba(37, 99, 235, 0.12);
        border-radius: 12px;
        border-top-left-radius: 3px;
        padding: 10px 13px;
        margin-top: 8px;
        margin-left: 16px;
      }
      .reply-author {
        font-size: 12px;
        font-weight: 600;
        color: #1E3A8A;
        margin-bottom: 4px;
      }
      .reply-text {
        font-size: 13px;
        color: #1E3A8A;
        line-height: 1.6;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        flex-shrink: 0;
      }
      .avatar-blue {
        background: #dbeafe;
        color: #1E3A8A;
      }
      .avatar-dark {
        background: #1E3A8A;
        color: #fff;
      }

      /* ── Textarea ── */
      .comment-input {
        width: 100%;
        padding: 11px 14px;
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        background: #f8fafc;
        font-size: 13px;
        color: #111827;
        resize: none;
        outline: none;
        transition:
          border-color 0.15s,
          background 0.15s;
        font-family: inherit;
      }
      .comment-input:focus {
        border-color: rgba(0, 0, 0, 0.2);
        background: #fff;
      }

      .btn-post {
        padding: 8px 18px;
        background: #1E3A8A;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .btn-post:hover {
        background: #1E3A8A;
        opacity: 0.88;
      }
      .btn-post:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .char-count {
        font-size: 11px;
        color: #9ca3af;
      }

      /* ── Modal ── */
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.4);
      }
      @media (min-width: 640px) {
        .modal-overlay {
          align-items: center;
        }
      }
      .modal-box {
        position: relative;
        width: 100%;
        max-width: 400px;
        background: #fff;
        border-radius: 20px;
        padding: 24px;
      }
      .modal-title {
        font-size: 15px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 16px;
      }
      .motif-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.12s;
      }
      .motif-row:hover {
        background: #f8fafc;
      }
      .motif-row label {
        font-size: 13px;
        color: #374151;
        cursor: pointer;
      }
      .modal-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
      }
      .btn-cancel {
        flex: 1;
        padding: 12px;
        background: #f8fafc;
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        font-size: 13px;
        color: #374151;
        cursor: pointer;
      }
      .btn-report {
        flex: 1;
        padding: 12px;
        background: #ef4444;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: background 0.15s;
      }
      .btn-report:hover {
        background: #dc2626;
      }
      .btn-report:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* ── Not found ── */
      .not-found {
        text-align: center;
        padding: 80px 16px;
      }
      .not-found p {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 20px;
      }
      .btn-back-list {
        display: inline-block;
        padding: 11px 24px;
        background: #1e3a5f;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        border-radius: 12px;
        text-decoration: none;
        transition: opacity 0.15s;
      }
      .btn-back-list:hover {
        opacity: 0.88;
      }

      /* ── Login prompt ── */
      .login-prompt {
        text-align: center;
        padding: 20px 0 8px;
        border-top: 0.5px solid rgba(0, 0, 0, 0.07);
        margin-top: 16px;
      }
      .login-prompt p {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 12px;
      }
      .btn-login {
        display: inline-block;
        padding: 9px 22px;
        background: #1E3A8A;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        border-radius: 10px;
        text-decoration: none;
      }



      /* ── Fix responsive texte ── */
.col-main {
  min-width: 0;
  overflow: hidden;
}

.card {
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 20px;
  overflow: hidden;        /* ← ajouter */
  word-break: break-word;  /* ← ajouter */
}

.desc-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.75;
  white-space: pre-line;
  word-break: break-word;      /* ← ajouter */
  overflow-wrap: break-word;   /* ← ajouter */
  max-width: 100%;             /* ← ajouter */
}

.comment-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
  word-break: break-word;      /* ← ajouter */
  overflow-wrap: break-word;   /* ← ajouter */
}

.comment-bubble {
  background: #f8fafc;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  border-top-left-radius: 3px;
  padding: 10px 13px;
  overflow: hidden;            /* ← ajouter */
}
    `,
  ],
  template: `
    <div class="detail-wrap">
      <app-back-button />

      @if (loading()) {
        <app-loading-spinner />
      } @else if (annonce()) {
        <!-- ── Galerie ── -->
        <div class="gallery">
          <div class="gallery-main">
            <img [src]="currentPhoto()" [alt]="annonce()!.typeBien" (error)="onImgError($event)" />

            @if (annonce()!.photos.length > 1) {
              <button class="gallery-nav prev" (click)="prevPhoto()">‹</button>
              <button class="gallery-nav next" (click)="nextPhoto()">›</button>

              <div class="gallery-dots">
                @for (p of annonce()!.photos; track p.id; let i = $index) {
                  <button
                    class="dot"
                    [class.active]="i === photoIndex()"
                    (click)="photoIndex.set(i)"
                  ></button>
                }
              </div>
            }
          </div>

          @if (annonce()!.photos.length > 1) {
            <div class="gallery-thumbs">
              @for (p of annonce()!.photos; track p.id; let i = $index) {
                <button
                  class="thumb"
                  [class.active]="i === photoIndex()"
                  (click)="photoIndex.set(i)"
                >
                  <img [src]="p.urlThumb" alt="" />
                </button>
              }
            </div>
          }
        </div>

        <!-- ── Grid ── -->
       <!-- ── Grid ── -->
<div class="detail-grid">
  <!-- Colonne principale -->
  <div class="col-main" style="margin-top:16px; min-width:0; width:100%;">
    <!-- En-tête annonce -->
    <div class="card" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="margin-bottom:8px;">
          <app-status-badge [statut]="annonce()!.statut" />
        </div>
        <h1 class="annonce-title" style="word-break:break-word;">{{ annonce()!.typeBien }}</h1>
        <div class="annonce-loc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;width:14px;height:14px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span style="word-break:break-word;">{{ annonce()!.quartier }}, {{ annonce()!.ville }}</span>
        </div>
      </div>
      <button class="btn-share" (click)="share()" aria-label="Partager" style="flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
        </svg>
      </button>
    </div>

    <!-- Description -->
    <div class="card" style="margin-top:16px;">
      <p class="section-title">Description</p>
      <p class="desc-text" style="word-break:break-word;overflow-wrap:break-word;white-space:pre-wrap;">
        {{ annonce()!.description }}
      </p>
    </div>

    <!-- Stats -->
    <div class="card" style="margin-top:16px;">
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
    <div class="card" style="margin-top:16px;">
      <p class="section-title">Commentaires ({{ annonce()!.commentaires.length }})</p>

      @if (annonce()!.commentaires.length > 0) {
        <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:20px;">
          @for (c of annonce()!.commentaires; track c.id) {
            <div style="display:flex;gap:10px;min-width:0;">
              <div class="avatar avatar-blue" style="flex-shrink:0;">{{ c.auteurPrenom[0] }}</div>
              <div style="flex:1;min-width:0;overflow:hidden;">
                <div class="comment-bubble">
                  <div class="comment-author" style="word-break:break-word;">
                    {{ c.auteurPrenom }}
                    @if (c.estProprietaire) {
                      <span style="color:#1E3A8A;font-weight:400;"> · Propriétaire</span>
                    }
                  </div>
                  <p class="comment-text" style="word-break:break-word;overflow-wrap:break-word;">
                    {{ c.contenu }}
                  </p>
                </div>
                <p class="comment-time">{{ c.dateCreation | timeAgo }}</p>

                @if (c.reponse) {
                  <div class="reply-bubble">
                    <div class="reply-author">Propriétaire</div>
                    <p class="reply-text" style="word-break:break-word;overflow-wrap:break-word;">
                      {{ c.reponse.contenu }}
                    </p>
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

      <!-- Formulaire -->
      @if (isLoggedIn()) {
        <div style="display:flex;gap:10px;padding-top:16px;border-top:0.5px solid rgba(0,0,0,.07);min-width:0;">
          <div class="avatar avatar-dark" style="flex-shrink:0;">{{ userInitial() }}</div>
          <div style="flex:1;min-width:0;overflow:hidden;">
            <textarea
              class="comment-input"
              [(ngModel)]="newComment"
              placeholder="Poser une question sur cette annonce…"
              rows="2"
              maxlength="500"
              style="width:100%;box-sizing:border-box;"
            ></textarea>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
              <span class="char-count">{{ newComment.length }}/500</span>
              <button
                class="btn-post"
                (click)="postComment()"
                [disabled]="newComment.trim().length < 5 || postingComment()"
              >
                {{ postingComment() ? 'Envoi…' : 'Commenter' }}
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="login-prompt">
          <p>Connectez-vous pour laisser un commentaire</p>
          <a routerLink="/auth/login" class="btn-login">Se connecter</a>
        </div>
      }
    </div>
  </div>

  <!-- ── Aside ── -->
  <div class="col-aside">
    <div style="position:sticky;top:80px;">
      <!-- Prix -->
      <div class="card">
        <div class="prix-label">{{ annonce()!.prix | fcfa }}</div>
        <p class="prix-meta">Publié {{ annonce()!.datePublication | timeAgo }}</p>
        <p class="prix-meta">Expire le {{ formatExpiry(annonce()!.dateExpiration) }}</p>
      </div>

      <!-- Actions -->
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
            <a routerLink="/auth/login" class="btn-whatsapp" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">
              🔒 Se connecter pour contacter
            </a>
          }
        }

        @if (isLoggedIn()) {
          <button class="btn-favori" [class.active]="isFavori()" (click)="toggleFavori()">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="flex-shrink:0;" [attr.fill]="isFavori() ? '#dc2626' : 'none'">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            {{ isFavori() ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
          </button>

          <button class="btn-signaler" (click)="openSignalement()">
            ⚑ Signaler cette annonce
          </button>
        }
      </div>
    </div>
  </div>
</div>

        <!-- ── Modal signalement ── -->
        @if (showSignalement()) {
          <div class="modal-overlay" (click)="showSignalement.set(false)">
            <div class="modal-box" (click)="$event.stopPropagation()">
              <p class="modal-title">Signaler cette annonce</p>
              <div>
                @for (motif of motifs; track motif.value) {
                  <div class="motif-row">
                    <input
                      type="radio"
                      name="motif"
                      [value]="motif.value"
                      [(ngModel)]="selectedMotif"
                      style="accent-color:#1e3a5f;"
                    />
                    <label>{{ motif.label }}</label>
                  </div>
                }
              </div>
              @if (selectedMotif === 'AUTRE') {
                <textarea
                  class="comment-input"
                  [(ngModel)]="signalementDesc"
                  placeholder="Précisez le motif…"
                  rows="3"
                  style="margin-top:12px;"
                ></textarea>
              }
              <div class="modal-actions">
                <button class="btn-cancel" (click)="showSignalement.set(false)">Annuler</button>
                <button
                  class="btn-report"
                  [disabled]="!selectedMotif"
                  (click)="submitSignalement()"
                >
                  Signaler
                </button>
              </div>
            </div>
          </div>
        }
      } @else if (!loading()) {
        <div class="not-found">
          <p>Cette annonce n'est plus disponible.</p>
          <a routerLink="/annonces" class="btn-back-list">Voir des annonces similaires</a>
        </div>
      }
    </div>
  `,
})
export class AnnonceDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly contactApi = inject(ContactApi);
  private readonly commentApi = inject(CommentaireApi);
  private readonly signalApi = inject(SignalementApi);
  private readonly toast = inject(ToastService);
private readonly auth = inject(AuthService); // déjà injecté ?
  readonly annonce = this.store.selectSignal(selectAnnonceDetail);
  readonly loading = this.store.selectSignal(selectDetailLoading);
  
  // readonly user = this.store.selectSignal(selectCurrentUser);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router); // ajouter si absent

readonly isLoggedIn = this.auth.isLoggedIn;        // ← signal computed
readonly user = this.auth.currentUser;   

  photoIndex = signal(0);
  contactLoading = signal(false);
  postingComment = signal(false);
  showSignalement = signal(false);
  newComment = '';
  selectedMotif = '';
  signalementDesc = '';

  readonly motifs = Object.entries(MOTIF_SIGNALEMENT_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

readonly userInitial = computed(() =>
  this.auth.currentUser()?.prenom?.[0]?.toUpperCase() ?? 'U'
);

  readonly isFavori = computed(() => this.annonce()?.isFavori ?? false);

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(annonceActions.loadDetail({ id }));
    if (this.isLoggedIn()) this.store.dispatch(favoriActions.load());
  }

  currentPhoto(): string {
    const a = this.annonce();
    if (!a) return '/assets/images/no-photo.svg';
    if (a.photos?.length > 0) return a.photos[this.photoIndex()].url;
    return a.photoPrincipale ?? '/assets/images/no-photo.svg';
  }

  prevPhoto(): void {
    const len = this.annonce()!.photos?.length ?? 0;
    this.photoIndex.update((i) => (i - 1 + len) % len);
  }
  nextPhoto(): void {
    const len = this.annonce()!.photos?.length ?? 0;
    this.photoIndex.update((i) => (i + 1) % len);
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = '/assets/images/no-photo.svg';
  }

  formatExpiry(date: string): string {
    return new Date(date).toLocaleDateString('fr-CM', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }


// annonce-detail.component.ts
contactWhatsApp(): void {
  if (!this.isLoggedIn()) {
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: `/annonces/${this.annonce()?.id}` }
    });
    return;
  }
  const a = this.annonce();
  if (!a) return;
  this.contactLoading.set(true);
  this.contactApi.enregistrer(a.id).subscribe({
    next: (res) => {
      this.contactLoading.set(false);
      // ❌ était : res.data.whatsappUrl
      // ✅ devient : res.data.lienWhatsApp
      const url = res.data.lienWhatsApp;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    error: () => this.contactLoading.set(false),
  });
}

toggleFavori(): void {
  // ✅ Vérifier AVANT
  if (!this.isLoggedIn()) {
    this.router.navigate(['/auth/login'],{
      queryParams: { returnUrl: `/annonces/${this.annonce()?.id}` }
    });
    return;
  }
  const a = this.annonce();
  if (!a) return;
  if (a.isFavori) {
    this.store.dispatch(favoriActions.remove({ annonceId: a.id }));
  } else {
    this.store.dispatch(favoriActions.add({ annonceId: a.id }));
  }
}

postComment(): void {
  // ✅ Vérifier AVANT
  if (!this.isLoggedIn()) {
    this.router.navigate(['/auth/login']);
    return;
  }
  const a = this.annonce();
  if (!a || this.newComment.trim().length < 5) return;
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
    this.showSignalement.set(true);
  }

  submitSignalement(): void {
    const a = this.annonce();
    if (!a || !this.selectedMotif) return;
    this.signalApi
      .signaler({
        annonceId: a.id,
        motif: this.selectedMotif,
        details: this.signalementDesc || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Signalement envoyé. Merci !');
          this.showSignalement.set(false);
          this.selectedMotif = '';
          this.signalementDesc = '';
        },
      });
  }

  share(): void {
    if (navigator.share) {
      navigator
        .share({ title: this.annonce()?.typeBien, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      this.toast.success('Lien copié !');
    }
  }
}
