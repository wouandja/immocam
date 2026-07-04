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
        <p class="text-slate-400 text-sm mb-6">Dernière mise à jour : juin 2026</p>

        <div class="space-y-5 text-sm text-slate-600 leading-relaxed">
          <div>
            <h2 class="font-bold text-slate-800 mb-2">1. Objet</h2>
            <p>
              Bailocam est une plateforme camerounaise de mise en relation directe entre
              propriétaires et locataires. En créant un compte ou en utilisant le site, vous
              acceptez sans réserve les présentes conditions d'utilisation.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">2. Compte utilisateur</h2>
            <p>
              La création d'un compte nécessite une adresse email valide et un numéro de téléphone.
              Vous êtes responsable de la confidentialité de vos identifiants et de toute activité
              effectuée depuis votre compte.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">3. Publication d'annonces</h2>
            <p>
              Les annonces sont publiées sous la responsabilité exclusive du propriétaire, qui
              garantit l'exactitude des informations fournies (prix, localisation, photos,
              disponibilité réelle du bien). La publication est immédiate, sans modération préalable
              systématique. Chaque compte est limité à un nombre d'annonces actives simultanées
              défini par l'administration.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">4. Contenus interdits</h2>
            <p>
              Sont strictement interdits : les annonces frauduleuses, les biens inexistants ou déjà
              loués/vendus, les contenus inappropriés ou trompeurs, ainsi que toute usurpation
              d'identité. Tout manquement peut entraîner la suppression de l'annonce, la suspension
              ou le bannissement définitif du compte concerné.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">5. Modération</h2>
            <p>
              L'administration se réserve le droit de retirer, mettre en pause ou archiver toute
              annonce à tout moment, notamment suite à un signalement justifié, sans préavis ni
              indemnité.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">6. Gratuité du service</h2>
            <p>
              L'utilisation d'Bailocam (consultation, publication, mise en relation) est gratuite.
              Bailocam n'intervient à aucun moment dans les transactions financières entre
              propriétaires et locataires.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">7. Limitation de responsabilité</h2>
            <p>
              Bailocam agit uniquement comme intermédiaire technique de mise en relation. Bailocam ne
              peut être tenu responsable des litiges, désaccords ou préjudices résultant des
              échanges ou transactions entre utilisateurs.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">8. Modification des conditions</h2>
            <p>
              Bailocam peut modifier les présentes conditions à tout moment. Les utilisateurs seront
              informés de tout changement substantiel. La poursuite de l'utilisation du service vaut
              acceptation des conditions mises à jour.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">9. Droit applicable</h2>
            <p>Les présentes conditions sont soumises au droit camerounais.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConditionsComponent {}
