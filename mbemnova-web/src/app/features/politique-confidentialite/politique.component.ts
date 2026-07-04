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
        <p class="text-slate-400 text-sm mb-6">En vigueur depuis juin 2026 — Bailocam</p>

        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">1. Responsable du traitement</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">
          Bailocam est responsable du traitement des données personnelles collectées sur la
          plateforme. Pour toute question relative à vos données, contactez-nous à
          <a href="mailto:contact@bailocam.cm" class="text-blue-700 hover:underline">contact@bailocam.cm</a>.
        </p>

        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">2. Données collectées</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">
          Bailocam collecte : prénom, nom, email, numéro de téléphone, ville. Ces données sont
          utilisées pour la création et la gestion de votre compte, ainsi que pour permettre le
          contact entre utilisateurs (locataires et propriétaires).
        </p>

        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">3. Protection de vos données</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">
          Bailocam ne vend jamais vos données à des tiers et ne les partage pas avec des partenaires
          commerciaux. Le numéro WhatsApp des propriétaires n'est jamais affiché en clair dans
          l'application — il est uniquement intégré dans un lien de contact direct généré côté
          serveur.
        </p>

        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">4. Cookies et données techniques</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">
          Bailocam utilise uniquement les cookies strictement nécessaires au fonctionnement du
          service (maintien de session, préférences d'affichage). Aucun cookie publicitaire ou de
          traçage tiers n'est utilisé.
        </p>

        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">5. Durée de conservation</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">
          Données du compte : conservées tant que le compte est actif. Après suppression : données
          anonymisées sous 30 jours. Journaux de sécurité (connexions, actions sensibles) :
          conservés 12 mois maximum.
        </p>

        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">6. Vos droits</h2>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">
          Vous disposez d'un droit d'accès, de rectification et de suppression de vos données à
          tout moment depuis votre profil, ou en nous contactant directement à
          <a href="mailto:contact@bailocam.cm" class="text-blue-700 hover:underline">contact@bailocam.cm</a>.
        </p>

        <h2 class="text-lg font-bold text-slate-800 mt-6 mb-3">7. Sécurité</h2>
        <p class="text-slate-600 text-sm leading-relaxed">
          Les mots de passe sont stockés de façon chiffrée (hachage). L'accès aux données est
          limité au strict nécessaire et toute tentative de connexion suspecte entraîne un blocage
          temporaire du compte concerné.
        </p>
      </div>
    </div>
  `,
})
export class PolitiqueComponent {}
