import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-mentions',
  standalone: true,
  imports: [BackButtonComponent, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4">
        <h1 class="text-2xl font-bold text-blue-900 mb-2">Mentions légales</h1>
        <p class="text-slate-400 text-sm mb-6">Dernière mise à jour : juin 2026</p>

        <div class="space-y-5 text-sm text-slate-600 leading-relaxed">
          <div>
            <h2 class="font-bold text-slate-800 mb-2">1. Éditeur du site</h2>
            <p>
              Le site et l'application ImmoCam sont édités par <strong>ImmoCam</strong>,
              plateforme de mise en relation immobilière opérant au Cameroun.<br/>
              Contact : <a href="mailto:contact@immocam.cm" class="text-blue-700 hover:underline">contact@immocam.cm</a>
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">2. Hébergement</h2>
            <p>Le site est hébergé sur une infrastructure cloud sécurisée (VPS / serveurs dédiés).</p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">3. Activité du site</h2>
            <p>
              ImmoCam est une plateforme de mise en relation entre propriétaires et locataires au
              Cameroun. Les annonces sont publiées directement par les propriétaires, sans
              intermédiaire ni modération préalable systématique. ImmoCam n'est ni agence
              immobilière, ni partie aux transactions ou baux conclus entre utilisateurs.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">4. Responsabilité</h2>
            <p>
              Les annonces publiées sur ImmoCam sont sous la responsabilité exclusive de leurs
              auteurs. ImmoCam ne saurait être tenu responsable de l'exactitude, de la disponibilité
              réelle des biens, ou des échanges entre utilisateurs. Tout contenu signalé comme
              frauduleux ou inapproprié peut être retiré à tout moment, voir nos
              <a routerLink="/conditions-utilisation" class="text-blue-700 hover:underline">conditions d'utilisation</a>.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">5. Propriété intellectuelle</h2>
            <p>
              Le nom ImmoCam, son logo et l'ensemble des éléments graphiques et fonctionnels de
              l'interface sont la propriété exclusive d'ImmoCam. Toute reproduction, totale ou
              partielle, sans autorisation préalable est interdite.
            </p>
          </div>

          <div>
            <h2 class="font-bold text-slate-800 mb-2">6. Données personnelles</h2>
            <p>
              La gestion des données personnelles est détaillée dans notre
              <a routerLink="/politique-confidentialite" class="text-blue-700 hover:underline">politique de confidentialité</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MentionsComponent {}
