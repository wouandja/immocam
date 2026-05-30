import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AnnonceListResponse,
  AnnonceDetailResponse,
  AnnonceFilters,
  PageResponse,
  PublierAnnonceRequest,
  AnnonceDashboardResponse,
} from '@core/services/models';

export const annonceActions = createActionGroup({
  source: 'Annonce',
  events: {
    // Liste publique
    'Load Annonces': props<{ filters: AnnonceFilters; append?: boolean }>(),
    'Load Annonces Success': props<{ page: PageResponse<AnnonceListResponse>; append: boolean }>(),
    'Load Annonces Failure': props<{ error: string }>(),

    // Détail
    'Load Detail': props<{ id: number }>(),
    // Dans annonce.actions.ts — ajouter dans les events :
    'Desarchiver': props<{ id: number }>(),
    'Load Detail Success': props<{ annonce: AnnonceDetailResponse }>(),
    'Load Detail Failure': props<{ error: string }>(),

    // Créer
    Create: props<{ req: PublierAnnonceRequest }>(),
    'Create Success': props<{ annonce: AnnonceDashboardResponse }>(),
    'Create Failure': props<{ error: string }>(),

    // Actions cycle de vie
    Pause: props<{ id: number }>(),
    Reactiver: props<{ id: number }>(),
    Renouveler: props<{ id: number }>(),
    Archiver: props<{ id: number }>(),
    Supprimer: props<{ id: number }>(),
    'Action Success': props<{ id: number; action: string }>(),
    'Action Failure': props<{ error: string }>(),

    // Mes annonces
    'Load Mes Annonces': props<{ filters?: AnnonceFilters }>(),
    'Load Mes Annonces Success': props<{ page: PageResponse<AnnonceDashboardResponse > }>(),

    // Filtres
    'Set Filters': props<{ filters: AnnonceFilters }>(),
    'Reset Filters': emptyProps(),

    // Favori toggle local (sans appel API)
    'Toggle Favori Local': props<{ id: number; isFavori: boolean }>(),
  },
});
