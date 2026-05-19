import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FavoriState } from './favori.reducer';

const selectFavoriState = createFeatureSelector<FavoriState>('favori');

export const selectFavoris        = createSelector(selectFavoriState, s => s.items);
export const selectFavoriIds      = createSelector(selectFavoriState, s => s.ids);
export const selectFavoriLoading  = createSelector(selectFavoriState, s => s.loading);
export const isFavori = (annonceId: number) =>
  createSelector(selectFavoriIds, ids => ids.has(annonceId));
