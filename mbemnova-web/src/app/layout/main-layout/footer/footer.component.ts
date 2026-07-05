import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-blue-950 text-blue-200 mt-16">
      <div class="max-w-6xl mx-auto px-4 py-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <!-- Marque -->
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src="/logo.jpeg?v=2" alt="Bailocam" class="w-full h-full object-cover" />
              </div>
              <span class="text-white font-bold text-lg">Bailocam</span>
            </div>
            <p class="text-sm text-blue-300 leading-relaxed mb-4">
              Connecter pour mieux louer. La plateforme qui met en relation locataires
              et bailleurs partout au Cameroun, sans intermédiaire.
            </p>
            <a href="mailto:contact@bailocam.cm"
               class="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              contact@bailocam.cm
            </a>
          </div>
          <!-- Navigation -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Navigation</h4>
            <nav class="space-y-2">
              <a routerLink="/" class="block text-sm hover:text-white transition-colors">Accueil</a>
              <a routerLink="/annonces" class="block text-sm hover:text-white transition-colors">Toutes les annonces</a>
              <a routerLink="/annonces/creer" class="block text-sm hover:text-white transition-colors">Publier une annonce</a>
              <a routerLink="/contact" class="block text-sm hover:text-white transition-colors">Nous contacter</a>
            </nav>
          </div>
          <!-- Villes populaires -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Villes populaires</h4>
            <nav class="space-y-2">
              <a routerLink="/annonces" [queryParams]="{ ville: 'Douala' }" class="block text-sm hover:text-white transition-colors">Douala</a>
              <a routerLink="/annonces" [queryParams]="{ ville: 'Yaounde' }" class="block text-sm hover:text-white transition-colors">Yaoundé</a>
              <a routerLink="/annonces" [queryParams]="{ ville: 'Bafoussam' }" class="block text-sm hover:text-white transition-colors">Bafoussam</a>
              <a routerLink="/annonces" [queryParams]="{ ville: 'Bamenda' }" class="block text-sm hover:text-white transition-colors">Bamenda</a>
            </nav>
          </div>
          <!-- Légal -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Légal</h4>
            <nav class="space-y-2">
              <a routerLink="/politique-confidentialite" class="block text-sm hover:text-white transition-colors">Politique de confidentialité</a>
              <a routerLink="/conditions-utilisation" class="block text-sm hover:text-white transition-colors">Conditions d'utilisation</a>
              <a routerLink="/mentions-legales" class="block text-sm hover:text-white transition-colors">Mentions légales</a>
            </nav>
          </div>
        </div>
        <!-- Bas de page -->
        <div class="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p class="text-xs text-blue-400">© 2026 Bailocam. Tous droits réservés.</p>
          <p class="text-xs text-blue-400 text-center">Les annonces sont publiées directement par les propriétaires.</p>
          <a href="https://mbemnova.com" target="_blank" rel="noopener"
             class="text-xs text-blue-500 hover:text-blue-300 transition-colors whitespace-nowrap">
            Conçu par MBEMNOVA
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
