import { Pipe, PipeTransform } from '@angular/core';

/** Transforme 150000 → "150 000 FCFA" */
@Pipe({ name: 'fcfa', standalone: true })
export class FcfaPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showCurrency = true): string {
    if (value === null || value === undefined || value === '') return showCurrency ? '— FCFA' : '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return showCurrency ? '— FCFA' : '—';
    const formatted = new Intl.NumberFormat('fr-CM', { maximumFractionDigits: 0 }).format(num);
    return showCurrency ? `${formatted} FCFA` : formatted;
  }
}
