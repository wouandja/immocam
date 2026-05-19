import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { Store } from '@ngrx/store';
import { uiActions } from '@store/ui/ui.actions';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/refresh') || req.reportProgress) return next(req);
  const store = inject(Store);
  activeRequests++;
  if (activeRequests === 1) store.dispatch(uiActions.setLoading({ loading: true }));
  return next(req).pipe(
    finalize(() => {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) store.dispatch(uiActions.setLoading({ loading: false }));
    })
  );
};
