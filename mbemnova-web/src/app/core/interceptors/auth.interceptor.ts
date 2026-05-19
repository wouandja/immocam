import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '@core/services/storage.service';
import { environment } from '@environments/environment';
import { Router } from '@angular/router'; 
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password',
    '/auth/reset-password', '/auth/refresh'];
  const isPublic = publicRoutes.some(r => req.url.includes(r));
  if (isPublic || !req.url.startsWith(environment.apiUrl)) return next(req);

  const token = inject(StorageService).getAccessToken();
  if (!token) return next(req);  // ← était: navigate + throwError

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
