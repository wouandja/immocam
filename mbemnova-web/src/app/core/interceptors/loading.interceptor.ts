import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { Store } from '@ngrx/store';
import { uiActions } from '@store/ui/ui.actions';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};