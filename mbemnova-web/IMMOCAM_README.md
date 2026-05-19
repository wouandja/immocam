# ImmoCam Frontend — Guide Complet
## Angular 21 · Tailwind CSS 4 · NgRx 18 · Mobile-First
### Développé par MBEMNOVA — immocam.cm

---

## 📦 12 Scripts de génération — ~14 600 lignes de code Angular

| # | Script | Rôle | Taille |
|---|--------|------|--------|
| 01 | `ng-01-init.sh` | Projet Angular 21 + Tailwind 4 + arborescence + environments | 29 Ko |
| 02 | `ng-02-core.sh` | Core: 6 modèles DTOs, 11 services API, 4 interceptors, 4 guards | 49 Ko |
| 03 | `ng-03-store.sh` | NgRx Store complet (Auth/Annonce/Favori/UI) + app.config | 56 Ko |
| 04 | `ng-04-shared-components.sh` | 13 composants, 4 pipes, 2 directives, 3 layouts | 57 Ko |
| 05 | `ng-05-public-features.sh` | Home scroll infini + Annonce List/Detail + Auth 5 pages | 70 Ko |
| 06 | `ng-06-dashboard.sh` | Dashboard propriétaire (5 sous-pages) + formulaire création | 51 Ko |
| 07 | `ng-07-admin.sh` | Interface admin complète (6 sections) + export CSV | 49 Ko |
| 08 | `ng-08-finalize.sh` | Routes initiales + finalisation première passe | 19 Ko |
| 09 | `ng-09-styles.sh` | MobileNav + PhotoGallery + PWA manifest + splash screen | 46 Ko |
| 10 | `ng-10-mock-scenarios.sh` | Mock V2: état persistant + 50 scénarios erreur + DevTools | 61 Ko |
| 11 | `ng-11-styles-animations.sh` | Tailwind 4 theme + SCSS + 15 animations + charts CSS | 47 Ko |
| 12 | `ng-12-finalize.sh` | app.routes.ts final + app.config.ts + environments + rapport | 32 Ko |

**Total : 12 scripts · ~566 Ko · ~14 600 lignes**

---

## 🚀 Installation en 6 étapes

### Prérequis
```bash
node --version   # >= 20
npm --version    # >= 10
ng version       # Angular CLI >= 18
# Installer CLI si nécessaire:
npm install -g @angular/cli@21
```

### Étape 1 — Placer les 12 scripts dans un dossier parent
```
immocam-projet/
├── ng-01-init.sh
├── ng-02-core.sh
├── ng-03-store.sh
├── ng-04-shared-components.sh
├── ng-05-public-features.sh
├── ng-06-dashboard.sh
├── ng-07-admin.sh
├── ng-08-finalize.sh
├── ng-09-styles.sh
├── ng-10-mock-scenarios.sh
├── ng-11-styles-animations.sh
└── ng-12-finalize.sh
```

### Étape 2 — Rendre les scripts exécutables
```bash
chmod +x ng-*.sh
```

### Étape 3 — Exécuter dans l'ordre (depuis le dossier parent)
```bash
# Script 01 crée le dossier immocam-frontend/
bash ng-01-init.sh

# Entrer dans le projet
cd immocam-frontend

# Scripts 02 à 12 depuis la racine du projet
bash ../ng-02-core.sh
bash ../ng-03-store.sh
bash ../ng-04-shared-components.sh
bash ../ng-05-public-features.sh
bash ../ng-06-dashboard.sh
bash ../ng-07-admin.sh
bash ../ng-08-finalize.sh
bash ../ng-09-styles.sh
bash ../ng-10-mock-scenarios.sh
bash ../ng-11-styles-animations.sh
bash ../ng-12-finalize.sh
```

### Étape 4 — Installer les dépendances
```bash
npm install
```

### Étape 5 — Démarrer en mode présentation (sans backend)
```bash
npm start
# → http://localhost:4200
# → Badge orange "MOCK" visible en bas à droite
```

### Étape 6 — Connecter l'API Spring Boot
```bash
# Modifier src/environments/environment.ts :
useMock: false
apiUrl: 'http://localhost:8080/api'

npm run start:api
# → Badge vert "API" visible
```

---

## 🔐 Comptes de démonstration (mode mock)

| Rôle | Email | Mot de passe | OTP |
|------|-------|-------------|-----|
| Utilisateur | user@test.cm | n'importe lequel | 123456 |
| Administrateur | admin@test.cm | n'importe lequel | 123456 |

**Scénarios d'erreur testables (mode mock) :**
- `exist@test.com` → email déjà utilisé à l'inscription
- `unverified@test.cm` → compte non vérifié
- `suspended@test.cm` → compte suspendu
- Mot de passe = `wrong` → erreur identifiants (5 tentatives = blocage 30min)

---

## 🔄 Toggle Mock / API (1 seul endroit)

```typescript
// src/environments/environment.ts
export const environment = {
  useMock: true,   // ← CHANGER ICI
  apiUrl: 'http://localhost:8080/api',
  mockDelay: 700,  // délai simulé en ms
  // ...
};
```

```bash
npm start            # Mode mock (useMock: true)
npm run start:api    # Mode API (useMock: false)
```

---

## 🏗️ Architecture générée

```
immocam-frontend/src/app/
│
├── core/
│   ├── guards/          → auth · guest · roleAdmin · verified
│   ├── interceptors/    → auth (JWT) · refresh (silencieux) · loading · error
│   ├── mock/            → MockStateService · mock.interceptor · mock-data.factory
│   ├── models/          → 6 fichiers TypeScript (1:1 DTOs Spring Boot)
│   └── services/
│       ├── api/         → 11 services (AuthApi, AnnonceApi, FavoriApi…)
│       ├── auth.service.ts
│       ├── storage.service.ts
│       ├── toast.service.ts
│       └── scroll.service.ts
│
├── store/               → NgRx (standalone)
│   ├── auth/            → actions + reducer + effects + selectors
│   ├── annonce/         → actions + reducer + effects + selectors
│   ├── favori/          → actions + reducer + effects + selectors
│   └── ui/              → loading · sidebar · modal
│
├── shared/
│   ├── components/      → 14 composants (AnnonceCard, OTP, ImageUpload…)
│   │   ├── annonce-card/        → Carte + skeleton shimmer
│   │   ├── otp-input/           → 6 cases animées
│   │   ├── image-upload/        → Drag & Drop photos
│   │   ├── infinite-scroll/     → IntersectionObserver
│   │   ├── filter-bar/          → Filtres villes/types/prix
│   │   ├── photo-gallery/       → Carrousel + miniatures
│   │   ├── bar-chart/           → Graphiques CSS natifs (admin)
│   │   ├── dev-tools/           → Badge mock/api + panel dev
│   │   └── confirm-dialog/      → Modale de confirmation
│   ├── pipes/           → fcfa · timeAgo · phoneMask · truncate
│   └── directives/      → lazyImg · clickStop
│
├── layout/
│   ├── main-layout/     → Header sticky + Footer + RouterOutlet
│   ├── auth-layout/     → Centré, hero gradient, sans navigation
│   ├── admin-layout/    → Sidebar blue foncé + contenu
│   └── mobile-nav/      → Navigation bottom 5 onglets (mobile)
│
└── features/            → 30+ pages lazy-loaded
    ├── home/            → Hero gradient + scroll infini + filtres
    ├── annonce/         → List · Detail · Create · Edit
    ├── auth/            → Register · VerifyEmail · Login · ForgotPwd · ResetPwd
    ├── dashboard/       → Overview · MesAnnonces · Favoris · Contacts · Profil
    ├── admin/           → Dashboard · Annonces · Utilisateurs · Signalements · Config
    └── (légales)        → Politique · CGU · Mentions · Contact · 404
```

---

## 📡 Endpoints API couverts (45+)

### Auth (8 endpoints)
`POST /auth/register` · `POST /auth/verify-email` · `POST /auth/resend-code`
`POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout`
`POST /auth/forgot-password` · `POST /auth/reset-password`

### Annonces (11 endpoints)
`GET/POST /annonces` · `GET/PUT/DELETE /annonces/:id`
`PATCH /annonces/:id/pause|reactiver|renouveler|archiver`
`POST /annonces/:id/photos` · `GET /annonces/mes-annonces`
`GET /annonces/dashboard-stats`

### Social (10 endpoints)
`POST/DELETE/GET /favoris` · `POST /contacts` · `GET /contacts/mes-contacts`
`POST/DELETE /commentaires` · `POST /commentaires/:id/reponse`
`POST /signalements`

### Référentiel (4 endpoints)
`GET /localisations/villes` · `GET /localisations/quartiers`
`GET /typebien` · `GET /localisations`

### Utilisateur (3 endpoints)
`PUT /utilisateurs/me` · `PUT /utilisateurs/me/password`
`DELETE /utilisateurs/me`

### Admin (16+ endpoints)
`GET /admin/dashboard` · `GET/DELETE/PATCH /admin/annonces`
`GET/POST /admin/utilisateurs/:id/suspendre|bannir|activer`
`GET/PUT /admin/signalements` · `GET/DELETE /admin/commentaires`
`GET/PUT /admin/config` · `GET /admin/exports/annonces|utilisateurs`
`POST /localisations` · `POST /typebien`

---

## 🎨 Design System

**Couleur principale :** Blue ImmoCam `#0F2A5E`
**Framework :** Tailwind CSS v4 (moteur Oxide — pas de `tailwind.config.js`)
**Typographie :** Plus Jakarta Sans (display) + Inter (body)

### Animations disponibles
```css
.fade-in          .fade-in-up      .fade-in-down
.slide-in-left    .slide-in-right  .slide-up
.scale-in         .scale-in-spring
.stagger          (stagger auto sur enfants)
.hover-lift       .pulse-loop      .heart-beat
```

### Skeletons (style Facebook)
```html
<div class="skeleton skeleton-text w-2/3"></div>
<div class="skeleton skeleton-img h-48"></div>
<div class="skeleton skeleton-circle w-10 h-10"></div>
```

---

## 📱 Mobile First

- Safe area iOS/Android (`env(safe-area-inset-*)`)
- `font-size: 16px` sur inputs (évite zoom iOS)
- Navigation bottom fixe (5 onglets: Accueil/Annonces/Publier/Favoris/Moi)
- Touch targets ≥ 44px
- Scroll infini (pas de pagination cliquable)
- Partage natif (`navigator.share`)
- Splash screen animé au chargement

---

## 🔧 Scripts NPM

```bash
npm start              # Dev avec mock (port 4200)
npm run start:mock     # Forcer mode mock
npm run start:api      # Forcer mode API réelle
npm run build          # Build production optimisé
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix ESLint
npm run format         # Prettier
npm run analyze        # Bundle analyzer webpack
```

---

## 🛡️ Scénarios couverts (47)

- SC-01 à 05 : Visiteur (scroll, filtres, détail, partage)
- SC-06 à 10 : Auth (OTP, blocage compte, refresh token)
- SC-11 à 17 : WhatsApp masqué, favoris, commentaires, signalements
- SC-18 à 28 : Publication instantanée, dashboard propriétaire
- SC-29 à 32 : Rappels expiration, suspension J0, suppression J+7
- SC-33 à 47 : Admin complet, modération, exports CSV, configuration

---

## 📞 Support MBEMNOVA

- **WhatsApp :** +237 697 847 396
- **Email :** mbemnova25@gmail.com
- **Site :** mbemnova.com
- **Adresse :** Douala, Bilongue carrefour carnaval

---

*ImmoCam Frontend v1.0 — Angular 21 · Tailwind 4 · NgRx 18*
*© 2026 MBEMNOVA — Tous droits réservés*
