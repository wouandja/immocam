import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div class="text-8xl mb-6">🏚️</div>
      <h1 class="text-4xl font-bold text-blue-900 mb-3">404</h1>
      <p class="text-slate-600 text-lg mb-2">Cette page n'existe pas</p>
      <p class="text-slate-400 text-sm mb-8">Le bien que vous cherchez a peut-être expiré ou été supprimé.</p>
      <a routerLink="/"
         class="px-8 py-3.5 bg-blue-900 text-white font-bold rounded-2xl
                hover:bg-blue-800 transition-all active:scale-95 shadow-lg">
        Retour à l'accueil
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
