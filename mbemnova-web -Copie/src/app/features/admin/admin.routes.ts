import { Routes } from '@angular/router';
import { roleAdminGuard } from '@core/guards/role.guard';
import { AdminLayoutComponent } from '@layout/admin-layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [roleAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'annonces',     loadComponent: () => import('./annonces/admin-annonces.component').then(m => m.AdminAnnoncesComponent) },
      { path: 'utilisateurs', loadComponent: () => import('./utilisateurs/admin-utilisateurs.component').then(m => m.AdminUtilisateursComponent) },
      { path: 'signalements', loadComponent: () => import('./signalements/admin-signalements.component').then(m => m.AdminSignalementsComponent) },
      { path: 'commentaires', loadComponent: () => import('./commentaires/admin-commentaires.component').then(m => m.AdminCommentairesComponent) },
      { path: 'config',       loadComponent: () => import('./config/admin-config.component').then(m => m.AdminConfigComponent) },
    ]
  }
];
