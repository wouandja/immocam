import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError } from 'rxjs';
import { ToastService } from '@core/services/toast.service';

const recentErrors = new Map<string, number>();
const ERROR_DEBOUNCE_MS = 3000;

function shouldShowError(key: string): boolean {
  const lastTime = recentErrors.get(key);
  const now = Date.now();
  if (!lastTime || now - lastTime > ERROR_DEBOUNCE_MS) {
    recentErrors.set(key, now);
    return true;
  }
  return false;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse & { refreshFailed?: boolean }) => {

      // Ne pas traiter les erreurs du refresh lui-même
      if (req.url.includes('/auth/refresh') || err.refreshFailed) {
        return throwError(() => err);
      }

      let msg = "Une erreur s'est produite";

      if (!navigator.onLine) {
        msg = 'Vous êtes hors connexion.';
      } else {
        switch (err.status) {
          case 0:   msg = 'Impossible de contacter le serveur.'; break;
          case 400: msg = err.error?.message || 'Données invalides'; break;
          case 401: return throwError(() => err); // géré par refreshInterceptor
          case 403: return throwError(() => err); // accès refusé → pas de toast, pas de logout
          case 404: msg = 'Ressource introuvable'; break;
          case 429: msg = 'Trop de requêtes. Attendez quelques instants.'; break;
          case 500: msg = 'Erreur serveur. Réessayez plus tard.'; break;
          default:  msg = err.error?.message || msg;
        }
      }

      const errorKey = `${err.status}:${msg}`;
      if (req.headers.has('X-Silent') || !shouldShowError(errorKey)) {
        return throwError(() => err);
      }

      toast.error(msg);
      return throwError(() => err);
    }),
  );
};