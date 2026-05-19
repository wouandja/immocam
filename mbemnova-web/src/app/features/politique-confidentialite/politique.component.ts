import { Component } from '@angular/core';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
@Component({
  selector: 'app-politique',
  standalone: true,
  imports: [BackButtonComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4 prose prose-slate max-w-none">
        <h1 class="text-2xl font-bold text-blue-900 mb-2">Politique de confidentialité</h1>
        <p class="text-slate-400 text-sm mb-6">En vigueur depuis le 1er janvier 2026 — par MBEMNOVA</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">1. Données collectées</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">ImmoCam collecte : prénom, nom, email, numéro de téléphone, ville. Ces données sont utilisées pour la création et gestion du compte, ainsi que pour le contact entre utilisateurs.</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">2. Protection de vos données</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">ImmoCam ne vend jamais vos données à des tiers. Le numéro WhatsApp des propriétaires n'est jamais affiché en clair — il est uniquement intégré dans le lien de contact. Vos données personnelles ne sont pas partagées avec des partenaires commerciaux.</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">3. Durée de conservation</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">Données du compte : conservées tant que le compte est actif. Après suppression : données anonymisées sous 30 jours. Logs de sécurité : conservés 12 mois.</p>
        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">4. Vos droits</h2>
        <p class="text-slate-600 text-sm leading-relaxed">Vous avez le droit d'accès, de modification et de suppression de vos données à tout moment depuis votre profil.</p>
      </div>
    </div>
  `,
})
export class PolitiqueComponent {}
