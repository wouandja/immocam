import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FavoriResponse } from '@core/services/models';

export const favoriActions = createActionGroup({
  source: 'Favori',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ favoris: FavoriResponse[] }>(),
    'Load Failure': props<{ error: string }>(),
    Add: props<{ annonceId: number }>(),
    'Add Success': props<{ annonceId: number }>(),
    Remove: props<{ annonceId: number }>(),
    'Remove Success': props<{ annonceId: number }>(),
    'Action Failure': props<{ error: string }>(),
    Clear: emptyProps(),
  },
});
