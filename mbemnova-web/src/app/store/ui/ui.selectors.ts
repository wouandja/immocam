import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UiState } from './ui.reducer';

const selectUi = createFeatureSelector<UiState>('ui');

export const selectLoading     = createSelector(selectUi, s => s.loading);
export const selectSidebarOpen = createSelector(selectUi, s => s.sidebarOpen);
export const selectIsMobile    = createSelector(selectUi, s => s.isMobile);
export const selectModal       = createSelector(selectUi, s => s.modal);
