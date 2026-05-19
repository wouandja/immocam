import { Component } from '@angular/core';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
@Component({
  selector: 'app-mentions',
  standalone: true,
  imports: [BackButtonComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4">
        <h1 class="text-2xl font-bold text-blue-900 mb-2">Mentions légales</h1>
        <p class="text-slate-400 text-sm mb-6">Dernière mise à jour : janvier 2026</p>
        <div class="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div>
            <h2 class="font-bold text-slate-800 mb-2">Éditeur</h2>
            <p>ImmoCam est développé et édité par <strong>MBEMNOVA</strong>,<br/>
            Douala, Cameroun — Bilongue carrefour carnaval<br/>
            Email : mbemnova25@gmail.com<br/>
            Téléphone : +237 697 847 396</p>
          </div>
          <div>
            <h2 class="font-bold text-slate-800 mb-2">Hébergement</h2>
            <p>Le site est hébergé sur infrastructure VPS / AWS EC2.</p>
          </div>
          <div>
            <h2 class="font-bold text-slate-800 mb-2">Responsabilité</h2>
            <p>Les annonces publiées sur ImmoCam sont sous la responsabilité exclusive de leurs auteurs.
            MBEMNOVA ne saurait être tenu responsable des informations publiées par les propriétaires.</p>
          </div>
          <div>
            <h2 class="font-bold text-slate-800 mb-2">Propriété intellectuelle</h2>
            <p>Le nom ImmoCam, le logo et l'interface sont la propriété de MBEMNOVA.
            Toute reproduction sans autorisation est interdite.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MentionsComponent {}
