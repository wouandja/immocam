import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnnonceState } from './annonce.reducer';

const selectAnnonceState = createFeatureSelector<AnnonceState>('annonce');

export const selectAnnonces       = createSelector(selectAnnonceState, s => s.items);
export const selectAnnonceLoading = createSelector(selectAnnonceState, s => s.loading);
export const selectLoadingMore    = createSelector(selectAnnonceState, s => s.loadingMore);
export const selectAnnonceError   = createSelector(selectAnnonceState, s => s.error);
export const selectAnnonceDetail  = createSelector(selectAnnonceState, s => s.detail);
export const selectDetailLoading  = createSelector(selectAnnonceState, s => s.detailLoading);
export const selectTotalElements  = createSelector(selectAnnonceState, s => s.totalElements);
export const selectTotalPages     = createSelector(selectAnnonceState, s => s.totalPages);
export const selectCurrentPage    = createSelector(selectAnnonceState, s => s.currentPage);

// hasMore : il reste des pages si currentPage (base 0) < totalPages - 1
// Exemple : totalPages=3, pages dispo = 0,1,2 → hasMore tant que currentPage < 2
export const selectHasMore = createSelector(
  selectAnnonceState,
  s => s.totalPages > 0 && s.currentPage < s.totalPages - 1,
);

export const selectFilters        = createSelector(selectAnnonceState, s => s.filters);
export const selectMesAnnonces    = createSelector(selectAnnonceState, s => s.mesAnnonces);
export const selectActionLoading  = createSelector(selectAnnonceState, s => s.actionLoading);