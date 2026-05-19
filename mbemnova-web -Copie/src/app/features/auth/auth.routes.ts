import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  { path: 'login',           loadComponent: () => import('./login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register',        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'verify-email',    loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },
  { path: 'reset-password',  loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
];
