import { Pipe, PipeTransform } from '@angular/core';

/** Masque: "+237 691 *** ***" */
@Pipe({ name: 'phoneMask', standalone: true })
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (clean.startsWith('237') && clean.length >= 11) {
      return `+237 ${clean.slice(3, 6)} *** ***`;
    }
    if (clean.length >= 9) {
      return `+237 ${clean.slice(0, 3)} *** ***`;
    }
    return value;
  }
}
