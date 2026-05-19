import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, map, switchMap, catchError, tap } from 'rxjs';
import { favoriActions } from './favori.actions';
import { annonceActions } from '@store/annonce/annonce.actions';
import { FavoriApi } from '@core/services/api/favori.api';
import { ToastService } from '@core/services/toast.service';

@Injectable()
export class FavoriEffects {
  private readonly actions$  = inject(Actions);
  private readonly favoriApi = inject(FavoriApi);
  private readonly toast     = inject(ToastService);

 // favori.effects.ts
load$ = createEffect(() =>
  this.actions$.pipe(
    ofType(favoriActions.load),
    switchMap(() =>
      this.favoriApi.getMesFavoris().pipe(
        map(res => favoriActions.loadSuccess({ 
          favoris: res.data.contenu ?? []  // ← extraire le tableau
        })),
        catchError(err => of(favoriActions.loadFailure({ error: err.error?.message })))
      )
    )
  )
);

  add$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.add),
      switchMap(({ annonceId }) =>
        this.favoriApi.ajouter(annonceId).pipe(
          map(() => favoriActions.addSuccess({ annonceId })),
          catchError(err => of(favoriActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  addSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.addSuccess),
      tap(({ annonceId }) => {
        this.toast.success('Ajouté aux favoris');
      }),
      map(({ annonceId }) => annonceActions.toggleFavoriLocal({ id: annonceId, isFavori: true }))
    )
  );

  remove$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.remove),
      switchMap(({ annonceId }) =>
        this.favoriApi.retirer(annonceId).pipe(
          map(() => favoriActions.removeSuccess({ annonceId })),
          catchError(err => of(favoriActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  removeSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(favoriActions.removeSuccess),
      tap(() => this.toast.info('Retiré des favoris')),
      map(({ annonceId }) => annonceActions.toggleFavoriLocal({ id: annonceId, isFavori: false }))
    )
  );
}
