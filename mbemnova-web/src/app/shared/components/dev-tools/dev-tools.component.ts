import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '@environments/environment';
import { MockStateService } from '@core/mock/mock-state.service';

@Component({
  selector: 'app-dev-tools',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!environment.production) {
      <!-- Badge flottant -->
      <div
        (click)="toggleExpanded()"
        class="fixed bottom-20 right-3 z-50 sm:bottom-4 cursor-pointer select-none"
        [attr.title]="'Cliquer pour détails dev'"
      >
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg
                    transition-all"
             [class]="environment.useMock
               ? 'bg-amber-400 text-amber-900'
               : 'bg-emerald-500 text-white'">
          <span class="w-2 h-2 rounded-full animate-pulse"
                [class]="environment.useMock ? 'bg-amber-600' : 'bg-white'"></span>
          {{ environment.useMock ? 'MOCK' : 'API' }}
        </div>
      </div>

      <!-- Panel étendu -->
      @if (expanded()) {
        <div class="fixed bottom-32 right-3 sm:bottom-14 z-50 w-64 bg-slate-900 text-white
                    rounded-2xl shadow-2xl p-4 text-xs fade-in">
          <div class="flex items-center justify-between mb-3">
            <span class="font-bold text-slate-200">🛠 ImmoCam DevTools</span>
            <button (click)="toggleExpanded()" class="text-slate-400 hover:text-white">✕</button>
          </div>

          <div class="space-y-2">
            <!-- Mode -->
            <div class="flex items-center justify-between py-1.5 border-b border-slate-700">
              <span class="text-slate-400">Mode</span>
              <span class="font-semibold" [class]="environment.useMock ? 'text-amber-400' : 'text-emerald-400'">
                {{ environment.useMock ? '🎭 Mock' : '🔌 API réelle' }}
              </span>
            </div>
            <!-- API URL -->
            <div class="flex items-center justify-between py-1.5 border-b border-slate-700">
              <span class="text-slate-400">API URL</span>
              <span class="text-slate-300 truncate max-w-32">{{ environment.apiUrl }}</span>
            </div>
            <!-- Délai mock -->
            @if (environment.useMock) {
              <div class="flex items-center justify-between py-1.5 border-b border-slate-700">
                <span class="text-slate-400">Délai mock</span>
                <span class="text-slate-300">{{ environment.mockDelay }}ms</span>
              </div>
              <!-- Session mock -->
              <div class="py-1.5 border-b border-slate-700">
                <span class="text-slate-400">Session mock</span>
                @if (mockSession()) {
                  <p class="text-emerald-400 font-medium mt-0.5">
                    ✅ {{ mockSession()?.prenom }} ({{ mockSession()?.role }})
                  </p>
                } @else {
                  <p class="text-slate-500 mt-0.5">Non connecté</p>
                }
              </div>
            }
            <!-- Comptes test -->
            <div class="pt-1">
              <p class="text-slate-500 mb-1">Comptes de test :</p>
              <p class="text-slate-400">user@test.cm → Utilisateur</p>
              <p class="text-slate-400">admin@test.cm → Admin</p>
              <p class="text-slate-500 mt-1">Code OTP universel: <span class="text-amber-400 font-mono">123456</span></p>
            </div>
          </div>

          <!-- Lien basculement -->
          <div class="mt-3 pt-3 border-t border-slate-700">
            <p class="text-slate-500 text-center text-xs leading-relaxed">
              Pour basculer mock/api:<br/>
              <code class="text-amber-400">environment.ts → useMock</code>
            </p>
          </div>
        </div>
      }
    }
  `,
})
export class DevToolsComponent {
  private readonly mockState = inject(MockStateService);
  readonly environment = environment;
  expanded = signal(false);

  toggleExpanded(): void { this.expanded.update(v => !v); }

  mockSession() {
    return this.mockState.getSession().user;
  }
}
