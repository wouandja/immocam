import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { authActions } from '@store/auth/auth.actions';
import { StorageService } from '@core/services/storage.service';
import { ToastService } from '@core/services/toast.service';

export const roleAdminGuard: CanActivateFn = (route, state) => {
  const store   = inject(Store);
  const router  = inject(Router);
  const toast   = inject(ToastService);
  const storage = inject(StorageService);

  return store.select(selectCurrentUser).pipe(
    take(1),
    map(user => {
      if (!user) {
        return router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      const token = storage.getAccessToken();

      if (!token) {
        storage.clear();
        store.dispatch(authActions.logout());
        return router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp && payload.exp * 1000 < Date.now();
        if (isExpired) {
          storage.clear();
          store.dispatch(authActions.logout());
          return router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
        }
      } catch {
        storage.clear();
        store.dispatch(authActions.logout());
        return router.createUrlTree(['/auth/login']);
      }

      if (user.role === 'ADMINISTRATEUR') return true;

      toast.error('Accès réservé aux administrateurs');
      return router.createUrlTree(['/']);
    })
  );
};