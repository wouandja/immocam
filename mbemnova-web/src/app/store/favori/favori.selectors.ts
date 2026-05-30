import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FavoriState } from './favori.reducer';

const selectFavoriState = createFeatureSelector<FavoriState>('favori');

export const selectFavoris       = createSelector(selectFavoriState, s => s.items);
export const selectFavoriLoading = createSelector(selectFavoriState, s => s.loading);

// Set<number> des ids en favori — source de vérité pour le cœur sur les cards
export const selectFavoriIds = createSelector(
  selectFavoriState,
  s => new Set<number>(s.items.map(f => f.annonceId)),
);

// Selector factory : isFavori(42) → Observable<boolean>
export const isFavori = (annonceId: number) =>
  createSelector(selectFavoriIds, ids => ids.has(annonceId));