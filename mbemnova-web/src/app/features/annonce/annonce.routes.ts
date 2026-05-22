import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { verifiedGuard } from '@core/guards/verified.guard';

export const ANNONCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/annonce-list.component').then((m) => m.AnnonceListComponent),
  },
  {
    path: 'creer',
    loadComponent: () =>
      import('./create/annonce-create.component').then((m) => m.AnnonceCreateComponent),
    canActivate: [authGuard, verifiedGuard],
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('./edit/annonce-edit.component').then((m) => m.AnnonceEditComponent),
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/annonce-detail.component').then((m) => m.AnnonceDetailComponent),
  },
];
