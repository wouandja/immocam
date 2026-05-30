import { createReducer, on } from '@ngrx/store';
import { FavoriResponse } from '@core/services/models';
import { favoriActions } from './favori.actions';

export interface FavoriState {
  items: FavoriResponse[];
  ids: Set<number>;
  loading: boolean;
  error: string | null;
}

const initialState: FavoriState = {
  items: [],
  ids: new Set(),
  loading: false,
  error: null,
};

export const favoriReducer = createReducer(
  initialState,

  on(favoriActions.load, (state) => ({ ...state, loading: true })),

  on(favoriActions.loadSuccess, (state, { favoris }) => ({
    ...state,
    loading: false,
    items: favoris,
    ids: new Set(favoris.map((f) => f.annonceId)),
  })),

  on(favoriActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ✅ Optimiste : mise à jour immédiate AVANT la réponse API
  on(favoriActions.add, (state, { annonceId }) => ({
    ...state,
    ids: new Set([...state.ids, annonceId]),
    items: state.items.some((f) => f.annonceId === annonceId)
      ? state.items
      : [...state.items, { annonceId } as FavoriResponse],
  })),

  on(favoriActions.remove, (state, { annonceId }) => {
    const ids = new Set(state.ids);
    ids.delete(annonceId);
    return {
      ...state,
      ids,
      items: state.items.filter((f) => f.annonceId !== annonceId),
    };
  }),

  // ✅ Confirmation API : ids déjà à jour côté optimiste, rien à faire sur items
  on(favoriActions.addSuccess, (state, { annonceId }) => ({
    ...state,
    ids: new Set([...state.ids, annonceId]), // idempotent si déjà présent
  })),

  on(favoriActions.removeSuccess, (state, { annonceId }) => {
    const ids = new Set(state.ids);
    ids.delete(annonceId);
    return {
      ...state,
      ids,
      items: state.items.filter((f) => f.annonceId !== annonceId), // idempotent
    };
  }),

  on(favoriActions.clear, () => initialState),
);