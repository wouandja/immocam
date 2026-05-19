// =============================================================================
// IMMOCAM — BarChart natif CSS (remplace ngx-charts)
// Graphique à barres CSS pur, sans dépendance externe
// Utilisé dans le dashboard admin
// =============================================================================
import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container w-full">
      <!-- Header -->
      @if (title) {
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-700">{{ title }}</h3>
          @if (subtitle) {
            <span class="text-xs text-slate-400">{{ subtitle }}</span>
          }
        </div>
      }

      <!-- Valeur max (axe Y) -->
      <div class="flex gap-2">
        <!-- Axe Y -->
        <div class="flex flex-col justify-between text-right shrink-0" [style.height.px]="height">
          @for (label of yLabels(); track label) {
            <span class="text-xs text-slate-400 leading-none">{{ label }}</span>
          }
        </div>

        <!-- Barres -->
        <div class="flex-1 relative">
          <!-- Lignes de grille -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
            @for (i of [0,1,2,3,4]; track i) {
              <div class="w-full border-t border-slate-100"
                   [class.border-slate-200]="i === 4"></div>
            }
          </div>

          <!-- Groupes de barres -->
          <div class="relative flex items-end gap-1.5 h-full"
               [style.height.px]="height">
            @for (pt of data; track pt.label; let i = $index) {
              <div class="flex-1 flex flex-col items-center group">
                <!-- Barre -->
                <div
                  class="w-full rounded-t-lg transition-all duration-500 cursor-pointer relative"
                  [style.height.%]="barHeight(pt.value)"
                  [style.background]="pt.color || defaultColor"
                  [style.min-height.px]="4"
                  [style.animation-delay]="i * 50 + 'ms'"
                  style="animation: fadeInUp 400ms ease both;"
                >
                  <!-- Tooltip au hover -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                              bg-slate-800 text-white text-xs font-semibold px-2 py-1
                              rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                              transition-opacity pointer-events-none z-10">
                    {{ formatValue(pt.value) }}
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4
                                border-transparent border-t-slate-800"></div>
                  </div>
                </div>
                <!-- Label -->
                <span class="text-xs text-slate-400 mt-1.5 text-center leading-tight
                             max-w-full overflow-hidden">
                  {{ pt.label }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Légende -->
      @if (showLegend && legendItems().length > 0) {
        <div class="flex gap-4 flex-wrap mt-3">
          @for (item of legendItems(); track item.label) {
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm" [style.background]="item.color"></div>
              <span class="text-xs text-slate-500">{{ item.label }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BarChartComponent {
  @Input({ required: true }) data: ChartDataPoint[] = [];
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() height = 140;
  @Input() defaultColor = '#1E40AF';
  @Input() showLegend = false;
  @Input() unit = '';

  maxValue = computed(() => Math.max(...this.data.map(d => d.value), 1));

  barHeight(value: number): number {
    return Math.max((value / this.maxValue()) * 92, 3);
  }

  formatValue(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k${this.unit}`;
    return `${v}${this.unit}`;
  }

  yLabels(): string[] {
    const max = this.maxValue();
    return [max, Math.round(max * .75), Math.round(max * .5),
            Math.round(max * .25), 0].map(v => this.formatValue(v));
  }

  legendItems(): Array<{ label: string; color: string }> {
    return this.data.filter(d => d.color).map(d => ({ label: d.label, color: d.color! }));
  }
}
