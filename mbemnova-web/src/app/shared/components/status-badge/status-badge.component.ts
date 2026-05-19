import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatutAnnonce, STATUT_ANNONCE_LABELS } from '@core/services/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      [class]="cssClass"
    >
      <span class="w-1.5 h-1.5 rounded-full" [class]="dotClass"></span>
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) statut!: StatutAnnonce;

  get label(): string {
    return STATUT_ANNONCE_LABELS[this.statut] ?? this.statut;
  }
  get cssClass(): string {
    const map: Record<StatutAnnonce, string> = {
      [StatutAnnonce.ACTIVE]: 'bg-emerald-50 text-emerald-700',
      [StatutAnnonce.EN_PAUSE]: 'bg-amber-50 text-amber-700',
      [StatutAnnonce.EXPIREE]: 'bg-red-50 text-red-700',
      [StatutAnnonce.ARCHIVEE]: 'bg-slate-100 text-slate-600',
      [StatutAnnonce.SUPPRIMEE]: 'bg-red-100 text-red-800',
      [StatutAnnonce.EN_ATTENTE]: 'bg-green-100 text-green-800',
    };
    return map[this.statut] ?? 'bg-slate-100 text-slate-600';
  }
  get dotClass(): string {
    const map: Record<StatutAnnonce, string> = {
      [StatutAnnonce.ACTIVE]: 'bg-emerald-500',
      [StatutAnnonce.EN_PAUSE]: 'bg-amber-500',
      [StatutAnnonce.EXPIREE]: 'bg-red-500',
      [StatutAnnonce.ARCHIVEE]: 'bg-slate-400',
      [StatutAnnonce.SUPPRIMEE]: 'bg-red-700',
      [StatutAnnonce.EN_ATTENTE]: 'bg-green-500',
    };
    return map[this.statut] ?? 'bg-slate-400';
  }
}
