import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex gap-2 justify-center" role="group" [attr.aria-label]="'Code à ' + length + ' chiffres'">
      @for (i of indices; track i) {
        <input
          #otpInput
          type="text"
          inputmode="numeric"
          maxlength="1"
          pattern="[0-9]*"
          [value]="values[i]"
          (input)="onInput($event, i)"
          (keydown)="onKeydown($event, i)"
          (paste)="onPaste($event)"
          (focus)="onFocus($event)"
          class="otp-input"
          [class.filled]="values[i]"
          [attr.aria-label]="'Chiffre ' + (i + 1)"
          autocomplete="one-time-code"
        />
      }
    </div>
    @if (error) {
      <p class="text-center text-red-500 text-sm mt-3 animate-bounce">{{ error }}</p>
    }
  `,
})
export class OtpInputComponent implements OnInit {
  @Input() length = 6;
  @Input() error?: string;
  @Output() completed = new EventEmitter<string>();
  @Output() changed = new EventEmitter<string>();

  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  values: string[] = [];
  indices: number[] = [];

  ngOnInit(): void {
    this.indices = Array.from({ length: this.length }, (_, i) => i);
    this.values = new Array(this.length).fill('');
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.values[index] = val;
    if (val && index < this.length - 1) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
    this.emit();
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.values[index] && index > 0) {
      this.values[index - 1] = '';
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
    if (event.key === 'ArrowRight' && index < this.length - 1) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text').replace(/\D/g, '') ?? '';
    paste.split('').slice(0, this.length).forEach((char, i) => {
      this.values[i] = char;
    });
    const lastIndex = Math.min(paste.length - 1, this.length - 1);
    setTimeout(() => {
      this.inputs.toArray()[lastIndex]?.nativeElement.focus();
    });
    this.emit();
  }

  onFocus(event: Event): void {
    (event.target as HTMLInputElement).select();
  }

  private emit(): void {
    const code = this.values.join('');
    this.changed.emit(code);
    if (code.length === this.length) this.completed.emit(code);
  }

  reset(): void {
    this.values = new Array(this.length).fill('');
    this.inputs.first?.nativeElement.focus();
  }
}
