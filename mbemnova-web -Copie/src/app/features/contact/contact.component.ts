import { Component } from '@angular/core';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [BackButtonComponent],
  template: `
    <div class="max-w-lg mx-auto px-4 py-8">
      <app-back-button/>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4 text-center">
        <div class="text-4xl mb-4">👋</div>
        <h1 class="text-xl font-bold text-blue-900 mb-2">Contacter MBEMNOVA</h1>
        <p class="text-slate-500 text-sm mb-6">Support disponible du lundi au samedi, 8h-18h</p>
        <div class="space-y-3">
          <a href="https://wa.me/237697847396" target="_blank"
             class="flex items-center justify-center gap-3 w-full py-3.5 bg-green-500
                    text-white font-semibold rounded-2xl hover:bg-green-600 transition-all">
            📱 WhatsApp: +237 697 847 396
          </a>
          <a href="mailto:mbemnova25@gmail.com"
             class="flex items-center justify-center gap-3 w-full py-3.5 border border-slate-200
                    text-slate-700 font-medium rounded-2xl hover:bg-slate-50 transition-all">
            ✉️ mbemnova25@gmail.com
          </a>
          <a href="https://mbemnova.com" target="_blank"
             class="flex items-center justify-center gap-3 w-full py-3.5 border border-blue-200
                    text-blue-700 font-medium rounded-2xl hover:bg-blue-50 transition-all">
            🌐 mbemnova.com
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ContactComponent {}
