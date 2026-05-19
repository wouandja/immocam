import { Component } from '@angular/core';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [BackButtonComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4">
        <h1 class="text-2xl font-bold text-blue-900 mb-2">Conditions d'utilisation</h1>
        <p class="text-slate-400 text-sm mb-6">Dernière mise à jour : janvier 2026</p>
        <div class="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>En utilisant ImmoCam, vous acceptez les présentes conditions. La plateforme est un service de mise en relation entre propriétaires et locataires. Les annonces sont publiées sous la responsabilité exclusive des propriétaires.</p>
          <p>Limite : 5 annonces actives par compte (configurable). Publication immédiate, sans modération préalable. L'administration se réserve le droit de supprimer toute annonce à tout moment.</p>
          <p>ImmoCam est développé et opéré par MBEMNOVA — Douala, Cameroun.</p>
        </div>
      </div>
    </div>
  `,
})
export class ConditionsComponent {}
