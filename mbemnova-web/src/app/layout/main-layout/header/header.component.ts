import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Store }                       from '@ngrx/store';
import { selectIsLoggedIn, selectCurrentUser, selectIsAdmin } from '@store/auth/auth.selectors';
import { authActions }                 from '@store/auth/auth.actions';

interface SuggestionItem {
  value: string;
  label: string;
  highlighted: string;
  category: string;
  params: Record<string, string>;
}

interface SuggestionGroup {
  label: string;
  items: SuggestionItem[];
}

const SEARCH_DATA: SuggestionItem[] = [
  { value: 'douala',      label: 'Douala',            category: 'Ville',    params: { ville: 'douala' },      highlighted: 'Douala' },
  { value: 'yaounde',     label: 'Yaoundé',           category: 'Ville',    params: { ville: 'yaounde' },     highlighted: 'Yaoundé' },
  { value: 'bafoussam',   label: 'Bafoussam',         category: 'Ville',    params: { ville: 'bafoussam' },   highlighted: 'Bafoussam' },
  { value: 'garoua',      label: 'Garoua',            category: 'Ville',    params: { ville: 'garoua' },      highlighted: 'Garoua' },
  { value: 'buea',        label: 'Buea',              category: 'Ville',    params: { ville: 'buea' },        highlighted: 'Buea' },
  { value: 'akwa',        label: 'Akwa – Douala',     category: 'Quartier', params: { quartier: 'akwa' },     highlighted: 'Akwa – Douala' },
  { value: 'bonanjo',     label: 'Bonanjo – Douala',  category: 'Quartier', params: { quartier: 'bonanjo' },  highlighted: 'Bonanjo – Douala' },
  { value: 'bastos',      label: 'Bastos – Yaoundé',  category: 'Quartier', params: { quartier: 'bastos' },   highlighted: 'Bastos – Yaoundé' },
  { value: 'mvog-mbi',    label: 'Mvog-Mbi – Yaoundé',category: 'Quartier', params: { quartier: 'mvog-mbi' }, highlighted: 'Mvog-Mbi – Yaoundé' },
  { value: 'appartement', label: 'Appartements',      category: 'Type',     params: { type: 'appartement' },  highlighted: 'Appartements' },
  { value: 'maison',      label: 'Maisons',           category: 'Type',     params: { type: 'maison' },       highlighted: 'Maisons' },
  { value: 'studio',      label: 'Studios',           category: 'Type',     params: { type: 'studio' },       highlighted: 'Studios' },
  { value: 'villa',       label: 'Villas',            category: 'Type',     params: { type: 'villa' },        highlighted: 'Villas' },
  { value: 'bureau',      label: 'Bureaux',           category: 'Type',     params: { type: 'bureau' },       highlighted: 'Bureaux' },
];

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  private readonly store   = inject(Store);
  private readonly router  = inject(Router);
  private readonly elRef   = inject(ElementRef);

  // ── Sélecteurs NgRx ────────────────────────────────────────────────────────
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly isAdmin    = this.store.selectSignal(selectIsAdmin);
  readonly user       = this.store.selectSignal(selectCurrentUser);

  // ── État local ─────────────────────────────────────────────────────────────
  mobileSearchOpen = signal(false);
  /** Contrôle l'ouverture du dropdown avatar — piloté au clic, fonctionne touch + desktop */
  dropdownOpen     = signal(false);

  searchFocused    = false;
  searchQuery      = '';
  showSuggestions  = false;
  suggestions: SuggestionItem[] = [];
  searchLoading    = false;

  // ── Fermeture au clic extérieur ────────────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Si le clic est en dehors du composant entier, on ferme le dropdown
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.dropdownOpen.set(false);
    }
  }

  // ── Toggle dropdown ────────────────────────────────────────────────────────
  toggleDropdown(event: MouseEvent): void {
    // stopPropagation pour éviter que onDocumentClick ne ferme immédiatement
    event.stopPropagation();
    this.dropdownOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  // ── Getters utilisateur ────────────────────────────────────────────────────
  get userInitial(): string {
    return this.user()?.prenom?.[0]?.toUpperCase() ?? 'U';
  }

  get userName(): string {
    const u = this.user();
    if (!u) return '';
    return u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.nom ?? u.prenom ?? '';
  }

  get userEmail(): string {
    return this.user()?.email ?? '';
  }

  // ── Groupes de suggestions ─────────────────────────────────────────────────
  get suggestionGroups(): SuggestionGroup[] {
    const groups: Record<string, SuggestionItem[]> = {};
    for (const item of this.suggestions) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }

  // ── Recherche ──────────────────────────────────────────────────────────────
  onSearchFocus(): void {
    this.searchFocused = true;
    if (this.searchQuery.length > 0) this.showSuggestions = true;
  }

  onSearchBlur(): void {
    this.searchFocused = false;
    setTimeout(() => { this.showSuggestions = false; }, 150);
  }

  onSearchInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchQuery = val;
    if (val.trim().length === 0) {
      this.suggestions     = [];
      this.showSuggestions = false;
      return;
    }
    const q = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    this.suggestions = SEARCH_DATA
      .filter(s =>
        s.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      )
      .slice(0, 8)
      .map(s => ({ ...s, highlighted: this.highlight(s.label, val) }));
    this.showSuggestions = this.suggestions.length > 0;
  }

  private highlight(text: string, query: string): string {
    if (!query) return text;
    const re = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'
    );
    return text.replace(re, '<strong class="text-blue-900 font-semibold">$1</strong>');
  }

  selectSuggestion(item: SuggestionItem): void {
    this.searchQuery     = item.label;
    this.showSuggestions = false;
    this.router.navigate(['/annonces'], { queryParams: item.params });
  }

  clearSearch(): void {
    this.searchQuery     = '';
    this.suggestions     = [];
    this.showSuggestions = false;
  }

  closeSearch(): void {
    this.showSuggestions = false;
  }

  onSearch(e: Event | null): void {
    const val = e
      ? (e.target as HTMLInputElement).value.trim()
      : this.searchQuery.trim();
    if (val) {
      this.router.navigate(['/annonces'], { queryParams: { motCle: val } });
    }
  }

  // ── Mobile search ──────────────────────────────────────────────────────────
  toggleMobileSearch(): void {
    this.mobileSearchOpen.update(open => !open);
    if (this.mobileSearchOpen()) {
      setTimeout(() => {
        (document.querySelector('input[name="q"]') as HTMLInputElement)?.focus();
      }, 50);
    }
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  logout(): void {
    this.closeDropdown();
    this.store.dispatch(authActions.logout());
  }
}