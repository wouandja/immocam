import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of, map, switchMap, catchError, tap } from 'rxjs';
import { annonceActions } from './annonce.actions';
import { AnnonceApi } from '@core/services/api/annonce.api';
import { ToastService } from '@core/services/toast.service';

@Injectable()
export class AnnonceEffects {
  private readonly actions$   = inject(Actions);
  private readonly annonceApi = inject(AnnonceApi);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);

  loadAnnonces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.loadAnnonces),
      switchMap(({ filters, append }) =>
        this.annonceApi.getAnnonces(filters).pipe(
          map(res => annonceActions.loadAnnoncesSuccess({
            page: res.data, append: !!append
          })),
          catchError(err => of(annonceActions.loadAnnoncesFailure({
            error: err.error?.message ?? 'Erreur de chargement'
          })))
        )
      )
    )
  );

  

  loadDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.loadDetail),
      switchMap(({ id }) =>
        this.annonceApi.getAnnonce(id).pipe(
          map(res => annonceActions.loadDetailSuccess({ annonce: res.data })),
          catchError(err => of(annonceActions.loadDetailFailure({
            error: err.error?.message ?? 'Annonce introuvable'
          })))
        )
      )
    )
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.create),
      switchMap(({ req }) =>
        this.annonceApi.publier(req).pipe(
          map(res => annonceActions.createSuccess({ annonce: res.data })),
          catchError(err => of(annonceActions.createFailure({
            error: err.error?.message ?? 'Erreur lors de la publication'
          })))
        )
      )
    )
  );

  createSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.createSuccess),
      tap(({ annonce }) => {
        this.toast.success('Annonce publiée avec succès !');
        this.router.navigate(['/annonces', annonce.id]);
      })
    ), { dispatch: false }
  );

  pause$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.pause),
      switchMap(({ id }) =>
        this.annonceApi.mettreEnPause(id).pipe(
          map(() => annonceActions.actionSuccess({ id, action: 'pause' })),
          catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  reactiver$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.reactiver),
      switchMap(({ id }) =>
        this.annonceApi.reactiver(id).pipe(
          map(() => annonceActions.actionSuccess({ id, action: 'reactiver' })),
          catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  renouveler$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.renouveler),
      switchMap(({ id }) =>
        this.annonceApi.renouveler(id).pipe(
          map(() => annonceActions.actionSuccess({ id, action: 'renouveler' })),
          catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
        )
      )
    )
  );

  // Dans annonce.effects.ts — ajouter :
desarchiver$ = createEffect(() =>
  this.actions$.pipe(
    ofType(annonceActions.desarchiver),
    switchMap(({ id }) =>
      this.annonceApi.desarchiver(id).pipe(
        map(() => annonceActions.actionSuccess({ id, action: 'desarchiver' })),
        catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
      )
    )
  )
);

  // actionSuccess$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(annonceActions.actionSuccess),
  //     tap(({ action }) => {
  //       const messages: Record<string, string> = {
  //         pause:      'Annonce mise en pause',
  //         reactiver:  'Annonce réactivée',
  //         renouveler: 'Annonce renouvelée pour 30 jours',
  //         archiver:   'Annonce archivée',
  //         supprimer:  'Annonce supprimée',
  //       };
  //       this.toast.success(messages[action] ?? 'Action effectuée');
  //     })
  //   ), { dispatch: false }
  // );

  loadMesAnnonces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(annonceActions.loadMesAnnonces),
      switchMap(({ filters }) =>
        this.annonceApi.getMesAnnonces(filters).pipe(
          map(res => annonceActions.loadMesAnnoncesSuccess({ page: res.data })),
          catchError(err => of(annonceActions.loadAnnoncesFailure({ error: err.error?.message })))
        )
      )
    )
  );

  archiver$ = createEffect(() =>
  this.actions$.pipe(
    ofType(annonceActions.archiver),
    switchMap(({ id }) =>
      this.annonceApi.archiver(id).pipe(
        map(() => annonceActions.actionSuccess({ id, action: 'archiver' })),
        catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
      )
    )
  )
);

supprimer$ = createEffect(() =>
  this.actions$.pipe(
    ofType(annonceActions.supprimer),
    switchMap(({ id }) =>
      this.annonceApi.supprimer(id).pipe(
        map(() => annonceActions.actionSuccess({ id, action: 'supprimer' })),
        catchError(err => of(annonceActions.actionFailure({ error: err.error?.message })))
      )
    )
  )
);

// Modifier actionSuccess$ pour recharger la liste
actionSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(annonceActions.actionSuccess),
    tap(({ action }) => {
      const messages: Record<string, string> = {
        pause:      'Annonce mise en pause',
        reactiver:  'Annonce réactivée',
        renouveler: 'Annonce renouvelée pour 30 jours',
        archiver:   'Annonce archivée',
        supprimer:  'Annonce supprimée',
      };
      this.toast.success(messages[action] ?? 'Action effectuée');
    }),
    map(() => annonceActions.loadMesAnnonces({}))  // ← recharge automatiquement
  )
);
}
