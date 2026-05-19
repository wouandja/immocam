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
          <!-- Brand -->
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                <span class="text-blue-900 font-bold text-sm">IC</span>
              </div>
              <span class="text-white font-bold text-lg">ImmoCam</span>
            </div>
            <p class="text-sm text-blue-300 leading-relaxed">
              La plateforme immobilière camerounaise par MBEMNOVA.
            </p>
          </div>
          <!-- Navigation -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Navigation</h4>
            <nav class="space-y-2">
              <a routerLink="/" class="block text-sm hover:text-white transition-colors">Accueil</a>
              <a routerLink="/annonces" class="block text-sm hover:text-white transition-colors">Annonces</a>
              <a routerLink="/annonces/creer" class="block text-sm hover:text-white transition-colors">Publier</a>
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
          <!-- Contact -->
          <div>
            <h4 class="text-white font-semibold mb-3 text-sm">Contact</h4>
            <nav class="space-y-2">
              <a routerLink="/contact" class="block text-sm hover:text-white transition-colors">Nous contacter</a>
              <a href="https://mbemnova.com" target="_blank" class="block text-sm hover:text-white transition-colors">mbemnova.com</a>
            </nav>
          </div>
        </div>
        <!-- Bottom -->
        <div class="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-xs text-blue-400">© 2026 ImmoCam — Développé par MBEMNOVA. Tous droits réservés.</p>
          <p class="text-xs text-blue-400">Les annonces sont publiées directement par les propriétaires.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
