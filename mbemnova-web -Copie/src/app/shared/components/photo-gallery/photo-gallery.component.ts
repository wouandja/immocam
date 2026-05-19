import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoResponse } from '@core/services/models';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="photo-gallery">
      <!-- Photo principale -->
      <div class="relative" style="aspect-ratio: 16/10;">
        <img
          [src]="currentPhoto()"
          [alt]="'Photo ' + (photoIndex() + 1)"
          class="w-full h-full object-cover transition-opacity duration-200"
          (error)="onError($event)"
        />

        <!-- Compteur -->
        @if (photos.length > 1) {
          <span class="photo-count">{{ photoIndex() + 1 }} / {{ photos.length }}</span>
        }

        <!-- Navigation -->
        @if (photos.length > 1) {
          <button (click)="prev()" class="photo-nav-btn prev" aria-label="Photo précédente">
            ‹
          </button>
          <button (click)="next()" class="photo-nav-btn next" aria-label="Photo suivante">›</button>

          <!-- Dots -->
          <div class="photo-dots">
            @for (p of photos; track p.id; let i = $index) {
              <button
                (click)="photoIndex.set(i)"
                [class.active]="i === photoIndex()"
                [attr.aria-label]="'Aller à la photo ' + (i + 1)"
              ></button>
            }
          </div>
        }

        <!-- Badge "Principale" -->
        <span
          class="absolute top-3 left-3 px-2.5 py-1 bg-blue-900/80 text-white text-xs
                     font-semibold rounded-lg backdrop-blur-sm"
        >
          Photo principale
        </span>
      </div>

      <!-- Miniatures -->
      @if (photos.length > 1) {
        <div class="photo-thumbs">
          @for (p of photos; track p.id; let i = $index) {
            <button
              (click)="photoIndex.set(i)"
              [class.active]="i === photoIndex()"
              class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2
                           transition-all focus:outline-none focus:border-blue-500"
              [class]="
                i === photoIndex()
                  ? 'border-blue-900 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-85'
              "
              [attr.aria-label]="'Miniature photo ' + (i + 1)"
            >
              <img
                [src]="p.urlThumb || p.url"
                [alt]="'Miniature ' + (i + 1)"
                class="w-full h-full object-cover"
              />
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class PhotoGalleryComponent {
  @Input({ required: true }) photos: PhotoResponse[] = [];
  @Input() fallback = '/assets/images/no-photo.svg';

  photoIndex = signal(0);

  currentPhoto = computed(() => {
    if (!this.photos.length) return this.fallback;
    return this.photos[this.photoIndex()]?.url ?? this.fallback;
  });

  prev(): void {
    this.photoIndex.update((i) => (i - 1 + this.photos.length) % this.photos.length);
  }
  next(): void {
    this.photoIndex.update((i) => (i + 1) % this.photos.length);
  }
  onError(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallback;
  }
}
