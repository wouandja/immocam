import { createReducer, on } from '@ngrx/store';
import { AnnonceListResponse, AnnonceDetailResponse, AnnonceFilters, AnnonceDashboardResponse } from '@core/services/models';
import { annonceActions } from './annonce.actions';

export interface AnnonceState {
  items: AnnonceListResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  detail: AnnonceDetailResponse | null;
  detailLoading: boolean;
  filters: AnnonceFilters;
  mesAnnonces: AnnonceDashboardResponse[];
  mesAnnoncesTotal: number;
  actionLoading: boolean;
}

const initialState: AnnonceState = {
  items: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  loadingMore: false,
  error: null,
  detail: null,
  detailLoading: false,
  filters: { page: 0, size: 12 },
  mesAnnonces: [],
  mesAnnoncesTotal: 0,
  actionLoading: false,
};

export const annonceReducer = createReducer(
  initialState,

  // Liste
  on(annonceActions.loadAnnonces, (s, { filters, append }) => ({
    ...s,
    loading: !append,
    loadingMore: !!append,
    error: null,
    // On mémorise la page demandée dès le dispatch
    // pour ne pas dépendre de ce que renvoie l'API
    currentPage: filters?.page ?? s.currentPage,
  })),
  on(annonceActions.loadAnnoncesSuccess, (s, { page, append }) => ({
    ...s,
    loading: false,
    loadingMore: false,
    items: append ? [...s.items, ...page.contenu] : page.contenu,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    // currentPage est déjà bon (posé au dispatch) — on le confirme
    // avec page.page si l'API le renvoie correctement, sinon on garde
    currentPage: page.page ?? s.currentPage,
  })),
  on(annonceActions.loadAnnoncesFailure, (s, { error }) => ({
    ...s,
    loading: false,
    loadingMore: false,
    error,
  })),

  // Détail
  on(annonceActions.loadDetail, (s) => ({ ...s, detailLoading: true, error: null })),
  on(annonceActions.loadDetailSuccess, (s, { annonce }) => ({
    ...s,
    detailLoading: false,
    detail: annonce,
  })),
  on(annonceActions.loadDetailFailure, (s, { error }) => ({
    ...s,
    detailLoading: false,
    error,
  })),

  // Actions cycle de vie
  on(
    annonceActions.pause,
    annonceActions.reactiver,
    annonceActions.renouveler,
    annonceActions.archiver,
    annonceActions.supprimer,
    (s) => ({ ...s, actionLoading: true }),
  ),
  on(annonceActions.actionSuccess, (s, { id, action }) => {
    const statutMap: Record<string, string> = {
      pause:      'EN_PAUSE',
      reactiver:  'ACTIVE',
      renouveler: 'ACTIVE',
      archiver:   'ARCHIVEE',
      supprimer:  'SUPPRIMEE',
    };
    const newStatut = statutMap[action];
    return {
      ...s,
      actionLoading: false,
      mesAnnonces: newStatut
        ? s.mesAnnonces
            .filter(a => action === 'supprimer' ? a.id !== id : true)
            .map(a => a.id === id ? { ...a, statut: newStatut as any } : a)
        : s.mesAnnonces,
    };
  }),
  on(annonceActions.actionFailure, (s, { error }) => ({ ...s, actionLoading: false, error })),

  // Mes annonces
  on(annonceActions.loadMesAnnoncesSuccess, (s, { page }) => ({
    ...s,
    mesAnnonces: page.contenu,
    mesAnnoncesTotal: page.totalElements,
  })),

  // Filtres
  on(annonceActions.setFilters, (s, { filters }) => ({
    ...s,
    filters: { ...s.filters, ...filters },
  })),
  on(annonceActions.resetFilters, (s) => ({ ...s, filters: { page: 0, size: 12 }, items: [] })),

  // Favori local
  on(annonceActions.toggleFavoriLocal, (s, { id, isFavori }) => ({
    ...s,
    items: s.items.map((a) => (a.id === id ? { ...a, isFavori } : a)),
    detail: s.detail?.id === id ? { ...s.detail, isFavori } : s.detail,
  })),
);