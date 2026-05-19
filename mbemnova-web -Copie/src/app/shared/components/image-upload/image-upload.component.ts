import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="dropzone p-6 text-center transition-all"
      [class.dragover]="isDragging"
      (dragover)="onDragOver($event)"
      (dragleave)="isDragging = false"
      (drop)="onDrop($event)"
    >
      <input
        #fileInput type="file" accept="image/jpeg,image/png,image/webp"
        [multiple]="multiple" class="hidden"
        (change)="onFileSelect($event)"
      />
      @if (files.length === 0) {
        <div class="flex flex-col items-center gap-3">
          <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
            <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p class="text-slate-600 font-medium text-sm">
              Glissez vos photos ici
            </p>
            <p class="text-slate-400 text-xs mt-1">ou</p>
          </div>
          <button type="button" (click)="fileInput.click()"
            class="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-xl
                   hover:bg-blue-800 transition-colors active:scale-95">
            Choisir des photos
          </button>
          <p class="text-xs text-slate-400">JPG, PNG, WebP — max {{ maxSizeMb }}Mo par photo — max {{ maxFiles }} photos</p>
        </div>
      } @else {
        <div class="space-y-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            @for (f of files; track f.id; let i = $index) {
              <div class="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img [src]="f.preview" [alt]="'Photo ' + (i+1)"
                     class="w-full h-full object-cover"/>
                @if (i === 0) {
                  <span class="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-900 text-white text-xs rounded-lg">
                    Principale
                  </span>
                }
                <button type="button" (click)="removeFile(f.id)"
                  class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full
                         flex items-center justify-center opacity-0 group-hover:opacity-100
                         transition-opacity text-xs font-bold hover:bg-red-600">
                  ×
                </button>
              </div>
            }
            @if (files.length < maxFiles) {
              <button type="button" (click)="fileInput.click()"
                class="aspect-square rounded-xl border-2 border-dashed border-slate-300
                       flex items-center justify-center text-slate-400 hover:border-blue-400
                       hover:text-blue-400 transition-colors text-2xl">
                +
              </button>
            }
          </div>
          <p class="text-xs text-slate-500">{{ files.length }}/{{ maxFiles }} photos — La première est la photo principale</p>
        </div>
      }
      @for (error of errors; track error) {
        <p class="text-red-500 text-xs mt-2">{{ error }}</p>
      }
    </div>
  `,
})
export class ImageUploadComponent {
  @Input() maxFiles = 4;
  @Input() maxSizeMb = 4;
  @Input() multiple = true;
  @Output() filesChanged = new EventEmitter<File[]>();

  files: UploadedFile[] = [];
  errors: string[] = [];
  isDragging = false;

  onDragOver(e: DragEvent): void {
    e.preventDefault(); this.isDragging = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragging = false;
    const dt = e.dataTransfer?.files;
    if (dt) this.processFiles(Array.from(dt));
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.processFiles(Array.from(input.files));
    input.value = '';
  }

  private processFiles(newFiles: File[]): void {
    this.errors = [];
    for (const file of newFiles) {
      if (this.files.length >= this.maxFiles) {
        this.errors.push(`Maximum ${this.maxFiles} photos autorisées`); break;
      }
      if (file.size > this.maxSizeMb * 1024 * 1024) {
        this.errors.push(`${file.name}: dépasse ${this.maxSizeMb}Mo`); continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.errors.push(`${file.name}: format non supporté`); continue;
      }
      const reader = new FileReader();
      reader.onload = e => {
        this.files.push({ file, preview: e.target?.result as string, id: crypto.randomUUID() });
        this.emit();
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(id: string): void {
    this.files = this.files.filter(f => f.id !== id);
    this.emit();
  }

  private emit(): void {
    this.filesChanged.emit(this.files.map(f => f.file));
  }
}
