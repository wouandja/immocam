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
  on(favoriActions.load, (s) => ({ ...s, loading: true })),
 // favori.reducer.ts — loadSuccess
on(favoriActions.loadSuccess, (s, { favoris }) => ({
  ...s,
  loading: false,
  items: favoris,
  ids: new Set(favoris.map((f) => f.annonceId)), // annonceId, pas id
})),
  on(favoriActions.loadFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(favoriActions.addSuccess, (s, { annonceId }) => ({
    ...s,
    ids: new Set([...s.ids, annonceId]),
  })),
  on(favoriActions.removeSuccess, (s, { annonceId }) => {
    const ids = new Set(s.ids);
    ids.delete(annonceId);
    return { ...s, ids, items: s.items.filter((f) => f.annonceId !== annonceId) };
  }),
  on(favoriActions.clear, () => initialState),
);
