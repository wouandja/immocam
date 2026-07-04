// =============================================================================
// IMMOCAM — Routes complètes (lazy-loaded, feature-first)
// 3 layouts : MainLayout | AuthLayout | AdminLayout
// Guards : authGuard | guestGuard | roleAdminGuard | verifiedGuard
// =============================================================================
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleAdminGuard } from './core/guards/role.guard';
import { verifiedGuard } from './core/guards/verified.guard';

export const routes: Routes = [
  // ══════════════════════════════════════════════════════════════════════════
  // LAYOUT PRINCIPAL — header + footer + mobile nav
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      // ── Page d'accueil ──────────────────────────────────────────────────
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
        title: 'Bailocam — Immobilier camerounais',
        data: { animation: 'home' },
      },

      // ── Annonces publiques ───────────────────────────────────────────────
      {
        path: 'annonces',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/annonce/list/annonce-list.component').then(
                (m) => m.AnnonceListComponent,
              ),
            title: 'Annonces immobilières — Bailocam',
          },
          {
            path: 'creer',
            loadComponent: () =>
              import('./features/annonce/create/annonce-create.component').then(
                (m) => m.AnnonceCreateComponent,
              ),
            canActivate: [authGuard, verifiedGuard],
            title: 'Publier une annonce — Bailocam',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/annonce/detail/annonce-detail.component').then(
                (m) => m.AnnonceDetailComponent,
              ),
            title: 'Détail annonce — Bailocam',
          },
          {
            path: ':id/modifier',
            loadComponent: () =>
              import('./features/annonce/edit/annonce-edit.component').then(
                (m) => m.AnnonceEditComponent,
              ),
            canActivate: [authGuard, verifiedGuard],
            title: "Modifier l'annonce — Bailocam",
          },
        ],
      },

      // ── Dashboard propriétaire ───────────────────────────────────────────
      {
        path: 'dashboard',
        canActivate: [authGuard, verifiedGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard-shell.component').then(
            (m) => m.DashboardShellComponent,
          ),
        title: 'Mon espace — Bailocam',
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full',
          },
          {
            path: 'overview',
            loadComponent: () =>
              import('./features/dashboard/overview/overview.component').then(
                (m) => m.DashboardOverviewComponent,
              ),
            title: 'Tableau de bord — Bailocam',
          },
          {
            path: 'mes-annonces',
            loadComponent: () =>
              import('./features/dashboard/mes-annonces/mes-annonces.component').then(
                (m) => m.MesAnnoncesComponent,
              ),
            title: 'Mes annonces — Bailocam',
          },
          {
            path: 'mes-favoris',
            loadComponent: () =>
              import('./features/dashboard/mes-favoris/mes-favoris.component').then(
                (m) => m.MesFavorisComponent,
              ),
            title: 'Mes favoris — Bailocam',
          },
          {
            path: 'mes-contacts',
            loadComponent: () =>
              import('./features/dashboard/mes-contacts/mes-contacts.component').then(
                (m) => m.MesContactsComponent,
              ),
            title: 'Mes contacts — Bailocam',
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./features/dashboard/notifications/notifications.component').then(
                (m) => m.DashboardNotificationsComponent,
              ),
            title: 'Notifications — Bailocam',
          },
          {
            path: 'profil',
            loadComponent: () =>
              import('./features/dashboard/profil/profil.component').then((m) => m.ProfilComponent),
            title: 'Mon profil — Bailocam',
          },
        ],
      },

      // ── Pages légales ────────────────────────────────────────────────────
      {
        path: 'politique-confidentialite',
        loadComponent: () =>
          import('./features/politique-confidentialite/politique.component').then(
            (m) => m.PolitiqueComponent,
          ),
        title: 'Politique de confidentialité — Bailocam',
      },
      {
        path: 'conditions-utilisation',
        loadComponent: () =>
          import('./features/conditions-utilisation/conditions.component').then(
            (m) => m.ConditionsComponent,
          ),
        title: "Conditions d'utilisation — Bailocam",
      },
      {
        path: 'mentions-legales',
        loadComponent: () =>
          import('../../mentions-legales/mentions.component').then((m) => m.MentionsComponent),
        title: 'Mentions légales — Bailocam',
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then((m) => m.ContactComponent),
        title: 'Contact — Bailocam',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH LAYOUT — centré, sans navigation
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: 'auth',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
        canActivate: [guestGuard],
        title: 'Connexion — Bailocam',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
        canActivate: [guestGuard],
        title: 'Inscription — Bailocam',
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent,
          ),
        title: 'Vérification email — Bailocam',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
        canActivate: [guestGuard],
        title: 'Mot de passe oublié — Bailocam',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
        title: 'Réinitialiser le mot de passe — Bailocam',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN LAYOUT — sidebar blue foncé, ADMINISTRATEUR only
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: 'admin',
    canActivate: [roleAdminGuard],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    title: 'Administration — Bailocam',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
        title: 'Dashboard Admin — Bailocam',
      },
      {
        path: 'annonces',
        loadComponent: () =>
          import('./features/admin/annonces/admin-annonces.component').then(
            (m) => m.AdminAnnoncesComponent,
          ),
        title: 'Gestion annonces — Bailocam',
      },
      {
        path: 'utilisateurs',
        loadComponent: () =>
          import('./features/admin/utilisateurs/admin-utilisateurs.component').then(
            (m) => m.AdminUtilisateursComponent,
          ),
        title: 'Gestion utilisateurs — Bailocam',
      },
      {
        path: 'signalements',
        loadComponent: () =>
          import('./features/admin/signalements/admin-signalements.component').then(
            (m) => m.AdminSignalementsComponent,
          ),
        title: 'Signalements — Bailocam',
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./features/admin/config/admin-config.component').then(
            (m) => m.AdminConfigComponent,
          ),
        title: 'Configuration — Bailocam',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/admin/notifications/admin-notifications.component').then(
            (m) => m.AdminNotificationsComponent,
          ),
        title: 'Notifications — Bailocam',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 404 — Page introuvable
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Page introuvable — Bailocam',
  },
];
