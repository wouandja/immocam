import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PhoneInputComponent),
    multi: true,
  }],
  template: `
    <div class="relative flex items-center">
      <span class="absolute left-3 flex items-center gap-1.5 text-sm font-medium text-slate-500 select-none">
        🇨🇲 +237
      </span>
      <input
        type="tel"
        inputmode="numeric"
        [placeholder]="placeholder"
        [value]="displayValue"
        [disabled]="isDisabled"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="w-full h-12 pl-24 pr-4 rounded-xl border border-slate-200 bg-slate-50
               text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100
               focus:bg-white transition-all outline-none disabled:opacity-50"
      />
    </div>
  `,
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() placeholder = '6 XX XX XX XX';

  displayValue = '';
  isDisabled = false;
  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 9);
    this.displayValue = val;
    this.onChange(`+237${val}`);
  }

  writeValue(val: string): void {
    this.displayValue = (val ?? '').replace(/^\+?237/, '');
  }
  registerOnChange(fn: any): void   { this.onChange = fn; }
  registerOnTouched(fn: any): void  { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }
}
