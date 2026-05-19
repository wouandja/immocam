import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { authActions } from '@store/auth/auth.actions';
import { AuthService } from '@core/services/auth.service';
import { StorageService } from '@core/services/storage.service';
import { ToastService } from '@core/services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const store   = inject(Store);
  const router  = inject(Router);
  const toast   = inject(ToastService);
  const auth    = inject(AuthService);
  const storage = inject(StorageService);

  return store.select(selectCurrentUser).pipe(
    take(1),
    map(user => {
      if (!user) {
        toast.info('Connectez-vous pour accéder à cette page');
        return router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      const token = storage.getAccessToken();

      // Token absent mais user dans le store → session corrompue
      if (!token) {
        storage.clear();
        store.dispatch(authActions.logout()); // ← nettoie le store
        toast.info('Votre session a expiré, reconnectez-vous');
        return router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      // Token expiré
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp && payload.exp * 1000 < Date.now();
        if (isExpired) {
          storage.clear();
          store.dispatch(authActions.logout()); // ← nettoie le store
          toast.info('Votre session a expiré, reconnectez-vous');
          return router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
        }
      } catch {
        storage.clear();
        store.dispatch(authActions.logout()); // ← nettoie le store
        return router.createUrlTree(['/auth/login']);
      }

      return true;
    })
  );
};