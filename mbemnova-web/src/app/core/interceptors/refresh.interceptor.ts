import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, BehaviorSubject, catchError, filter, take, switchMap } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { StorageService } from '@core/services/storage.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const storage     = inject(StorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {

      // 403 = accès refusé (rôle insuffisant) → NE JAMAIS logout, laisser passer
      // Seulement 401 = token expiré → tenter refresh
      if (
        err.status !== 401 ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/login')
      ) {
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }))
          ),
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          const newToken = storage.getAccessToken();
          if (newToken) {
            refreshSubject.next(newToken);
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
          }
          return throwError(() => new Error('No access token after refresh'));
        }),
        catchError((e) => {
          isRefreshing = false;
          // Refresh échoué → déconnexion propre
          authService.logout();
          const error = e as HttpErrorResponse & { refreshFailed?: boolean };
          error.refreshFailed = true;
          return throwError(() => error);
        }),
      );
    }),
  );
};