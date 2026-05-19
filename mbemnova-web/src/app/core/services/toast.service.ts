// =============================================================================
// IMMOCAM — ToastService v2 avec animations CSS natives
// =============================================================================
import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  duration?: number;
  icon?: string;
  closable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private container: HTMLElement | null = null;
  private readonly hasDom =
    typeof document !== 'undefined' && typeof window !== 'undefined';
  private readonly icons: Record<ToastType, string> = {
    success: '✓', error: '✕', info: 'ℹ', warning: '⚠',
  };

  private getContainer(): HTMLElement {
    if (!this.hasDom) {
      throw new Error('DOM not available');
    }
    if (!this.container || !document.contains(this.container)) {
      const existing = document.getElementById('immocam-toasts');
      if (existing) { this.container = existing; return existing; }
      this.container = document.createElement('div');
      this.container.id = 'immocam-toasts';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show(message: string, type: ToastType, config: ToastConfig = {}): void {
    if (!this.hasDom) return;
    const { duration = 3800, closable = true } = config;
    const icon = config.icon ?? this.icons[type];

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-msg">${message}</span>
      ${closable ? '<button class="toast-close" aria-label="Fermer">✕</button>' : ''}
    `;

    const container = this.getContainer();
    container.appendChild(toast);

    // Bouton fermer
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      this.dismiss(toast);
    });

    // Auto-dismiss
    const timer = setTimeout(() => this.dismiss(toast), duration);

    // Pause au hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => {
      setTimeout(() => this.dismiss(toast), 1500);
    });
  }

  private dismiss(toast: HTMLElement): void {
    if (!toast.parentNode) return;
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 280);
  }

  success(msg: string, config?: ToastConfig): void { this.show(msg, 'success', config); }
  error(msg: string, config?: ToastConfig): void   { this.show(msg, 'error', { duration: 5000, ...config }); }
  info(msg: string, config?: ToastConfig): void    { this.show(msg, 'info', config); }
  warning(msg: string, config?: ToastConfig): void { this.show(msg, 'warning', config); }

  /** Afficher un toast persistant jusqu'à dismiss manuel */
  persist(msg: string, type: ToastType = 'info'): () => void {
    if (!this.hasDom) return () => {};
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${this.icons[type]}</span><span class="toast-msg">${msg}</span>`;
    this.getContainer().appendChild(toast);
    return () => this.dismiss(toast);
  }
}
