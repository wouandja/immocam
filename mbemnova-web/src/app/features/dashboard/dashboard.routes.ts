import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { DashboardShellComponent } from './dashboard-shell.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '', component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',      loadComponent: () => import('./overview/overview.component').then(m => m.DashboardOverviewComponent) },
      { path: 'mes-annonces',  loadComponent: () => import('./mes-annonces/mes-annonces.component').then(m => m.MesAnnoncesComponent) },
      { path: 'mes-favoris',   loadComponent: () => import('./mes-favoris/mes-favoris.component').then(m => m.MesFavorisComponent) },
      { path: 'mes-contacts',  loadComponent: () => import('./mes-contacts/mes-contacts.component').then(m => m.MesContactsComponent) },
      { path: 'profil',        loadComponent: () => import('./profil/profil.component').then(m => m.ProfilComponent) },
    ]
  }
];
