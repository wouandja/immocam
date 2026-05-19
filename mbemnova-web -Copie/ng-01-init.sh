#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 01 : INITIALISATION PROJET ANGULAR 21
# =============================================================================
# Rôle     : Crée le projet Angular 21 complet avec :
#            - Angular CLI 21 + configuration stricte TypeScript
#            - Tailwind CSS 4 (nouveau moteur Oxide, pas de config JS)
#            - NgRx 18 (Store + Effects + DevTools + Signals)
#            - Angular Material 18 (theme blue foncé ImmoCam)
#            - ESLint + Prettier
#            - Structure de dossiers feature-first complète
#            - Environments dev/prod avec toggle mock/api
#            - package.json avec toutes les dépendances
#
# Prérequis : Node 20+, npm 10+, @angular/cli 21 installé globalement
#             npm install -g @angular/cli@21
#
# Exécuter  : bash ng-01-init.sh
#             Depuis le répertoire parent du projet
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

PROJECT_NAME="immocam-frontend"
SECTION "SCRIPT 01 — INITIALISATION PROJET ANGULAR 21"

# =============================================================================
# VÉRIFICATIONS PRÉALABLES
# =============================================================================
SECTION "0/6 — Vérifications"

command -v node >/dev/null 2>&1 || ERROR "Node.js non installé. Installez Node 20+"
command -v npm >/dev/null 2>&1  || ERROR "npm non installé"
command -v ng >/dev/null 2>&1   || ERROR "Angular CLI non installé. Lancez: npm install -g @angular/cli@21"

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[[ "$NODE_VER" -ge 20 ]] || ERROR "Node 20+ requis. Version actuelle: $(node -v)"

NG_VER=$(ng version 2>/dev/null | grep "Angular CLI" | awk '{print $3}' | cut -d'.' -f1)
[[ "$NG_VER" -ge 18 ]] || WARN "Angular CLI < 18 détecté. Recommandé: npm install -g @angular/cli@21"

OK "Node $(node -v), npm $(npm -v), ng v$(ng version 2>/dev/null | grep 'Angular CLI' | awk '{print $3}')"

if [[ -d "$PROJECT_NAME" ]]; then
  WARN "Le dossier $PROJECT_NAME existe déjà."
  read -p "Supprimer et recréer ? (o/N) " choice
  [[ "$choice" == "o" || "$choice" == "O" ]] && rm -rf "$PROJECT_NAME" || ERROR "Abandon"
fi

# =============================================================================
# CRÉATION PROJET ANGULAR
# =============================================================================
SECTION "1/6 — Création projet Angular 21"

ng new "$PROJECT_NAME" \
  --routing=true \
  --style=scss \
  --strict=true \
  --standalone=true \
  --ssr=false \
  --skip-git=false \
  --skip-tests=false \
  --package-manager=npm \
  --no-interactive

OK "Projet Angular créé"
cd "$PROJECT_NAME"

# =============================================================================
# PACKAGE.JSON COMPLET
# =============================================================================
SECTION "2/6 — package.json avec toutes les dépendances"

cat > package.json << 'EOF'
{
  "name": "immocam-frontend",
  "version": "1.0.0",
  "description": "ImmoCam - Plateforme immobilière camerounaise par MBEMNOVA",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 0.0.0.0 --port 4200",
    "start:mock": "USE_MOCK=true ng serve",
    "start:api": "USE_MOCK=false ng serve",
    "build": "ng build --configuration production",
    "build:mock": "USE_MOCK=true ng build --configuration production",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "test:ci": "ng test --watch=false --browsers=ChromeHeadless",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "format": "prettier --write \"src/**/*.{ts,html,scss}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss}\"",
    "analyze": "ng build --configuration production --stats-json && npx webpack-bundle-analyzer dist/immocam-frontend/browser/stats.json"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^21.0.0",
    "@angular/cdk": "^21.0.0",
    "@angular/common": "^21.0.0",
    "@angular/compiler": "^21.0.0",
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0",
    "@angular/material": "^21.0.0",
    "@angular/platform-browser": "^21.0.0",
    "@angular/platform-browser-dynamic": "^21.0.0",
    "@angular/router": "^21.0.0",
    "@ngrx/store": "^18.0.0",
    "@ngrx/effects": "^18.0.0",
    "@ngrx/router-store": "^18.0.0",
    "@ngrx/signals": "^18.0.0",
    "@ngrx/operators": "^18.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0",
    "ngx-toastr": "^19.0.0",
    "ngx-infinite-scroll": "^18.0.0",
    "date-fns": "^3.6.0",
    "date-fns-tz": "^3.1.3",
    "@faker-js/faker": "^9.0.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^21.0.0",
    "@angular/cli": "^21.0.0",
    "@angular/compiler-cli": "^21.0.0",
    "@ngrx/store-devtools": "^18.0.0",
    "@ngrx/eslint-plugin": "^18.0.0",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^22.0.0",
    "jasmine-core": "~5.4.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.7.0",
    "prettier": "^3.3.3",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-import": "^2.29.1",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47"
  }
}
EOF
OK "package.json généré"

# =============================================================================
# TSCONFIG STRICT
# =============================================================================
SECTION "3/6 — TypeScript configuration stricte"

cat > tsconfig.json << 'EOF'
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"],
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@store/*": ["src/app/store/*"],
      "@features/*": ["src/app/features/*"],
      "@layout/*": ["src/app/layout/*"],
      "@environments/*": ["src/environments/*"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
EOF

cat > tsconfig.app.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}
EOF

OK "tsconfig.json configuré"

# =============================================================================
# PRETTIER
# =============================================================================
cat > .prettierrc << 'EOF'
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "htmlWhitespaceSensitivity": "css",
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "html",
        "printWidth": 120
      }
    }
  ]
}
EOF
OK ".prettierrc configuré"

cat > .prettierignore << 'EOF'
dist/
node_modules/
coverage/
.angular/
EOF

# =============================================================================
# ENVIRONMENTS
# =============================================================================
SECTION "4/6 — Environments (dev/prod + mock toggle)"

mkdir -p src/environments

cat > src/environments/environment.ts << 'EOF'
// =============================================================================
// IMMOCAM — Environment Développement
// Pour activer le mode mock: USE_MOCK=true ng serve
// Pour connecter l'API réelle: USE_MOCK=false ng serve
// =============================================================================
export const environment = {
  production: false,

  // API Spring Boot — changer selon votre déploiement
  apiUrl: 'http://localhost:8080/api',

  // =========================================================================
  // TOGGLE MOCK ← LE SEUL ENDROIT À MODIFIER
  // true  = données simulées (présentation, démo, dev sans backend)
  // false = appels API réels vers Spring Boot
  // =========================================================================
  useMock: true, // ← Mettre false pour connecter l'API réelle

  // Délai simulé en ms (pour les données mock)
  mockDelay: 800,

  // JWT config (durée de vie token en secondes)
  jwtRefreshBuffer: 60,

  // Pagination
  defaultPageSize: 12,

  // WhatsApp
  whatsappBaseUrl: 'https://wa.me/',

  // Limites (doit correspondre à la config backend)
  maxPhotosPerAnnonce: 4,
  maxAnnoncesActives: 5,
  maxCommentLength: 500,
  minCommentLength: 5,

  // Timeouts
  requestTimeout: 30000,

  // Logging
  enableLogging: true,
};
EOF

cat > src/environments/environment.prod.ts << 'EOF'
// =============================================================================
// IMMOCAM — Environment Production
// =============================================================================
export const environment = {
  production: true,
  apiUrl: 'https://api.immocam.cm/api', // ← Votre domaine de production
  useMock: false,
  mockDelay: 0,
  jwtRefreshBuffer: 60,
  defaultPageSize: 12,
  whatsappBaseUrl: 'https://wa.me/',
  maxPhotosPerAnnonce: 4,
  maxAnnoncesActives: 5,
  maxCommentLength: 500,
  minCommentLength: 5,
  requestTimeout: 30000,
  enableLogging: false,
};
EOF

OK "environments générés"

# =============================================================================
# ARBORESCENCE FEATURE-FIRST
# =============================================================================
SECTION "5/6 — Arborescence complète"

mkd() { mkdir -p "$1"; }

# Core
mkd src/app/core/guards
mkd src/app/core/interceptors
mkd src/app/core/services/api
mkd src/app/core/models

# Store NgRx
mkd src/app/store/auth
mkd src/app/store/annonce
mkd src/app/store/favori
mkd src/app/store/ui
mkd src/app/store/admin

# Shared
mkd src/app/shared/components/annonce-card
mkd src/app/shared/components/annonce-card-skeleton
mkd src/app/shared/components/photo-gallery
mkd src/app/shared/components/price-display
mkd src/app/shared/components/status-badge
mkd src/app/shared/components/empty-state
mkd src/app/shared/components/confirm-dialog
mkd src/app/shared/components/loading-spinner
mkd src/app/shared/components/infinite-scroll
mkd src/app/shared/components/otp-input
mkd src/app/shared/components/phone-input
mkd src/app/shared/components/image-upload
mkd src/app/shared/components/filter-bar
mkd src/app/shared/components/back-button
mkd src/app/shared/components/page-header
mkd src/app/shared/pipes
mkd src/app/shared/directives

# Layout
mkd src/app/layout/main-layout/header/user-menu
mkd src/app/layout/main-layout/footer
mkd src/app/layout/auth-layout
mkd src/app/layout/admin-layout/sidebar

# Features
mkd src/app/features/home
mkd src/app/features/annonce/list
mkd src/app/features/annonce/detail
mkd src/app/features/annonce/create
mkd src/app/features/annonce/edit
mkd src/app/features/auth/register
mkd src/app/features/auth/verify-email
mkd src/app/features/auth/login
mkd src/app/features/auth/forgot-password
mkd src/app/features/auth/reset-password
mkd src/app/features/dashboard/overview
mkd src/app/features/dashboard/mes-annonces
mkd src/app/features/dashboard/mes-favoris
mkd src/app/features/dashboard/mes-contacts
mkd src/app/features/dashboard/profil
mkd src/app/features/admin/dashboard
mkd src/app/features/admin/annonces
mkd src/app/features/admin/utilisateurs
mkd src/app/features/admin/signalements
mkd src/app/features/admin/commentaires
mkd src/app/features/admin/config
mkd src/app/features/politique-confidentialite
mkd src/app/features/conditions-utilisation
mkd src/app/features/mentions-legales
mkd src/app/features/contact
mkd src/app/features/not-found

# Assets
mkd src/assets/icons
mkd src/assets/images
mkd src/assets/i18n

# Styles
mkd src/styles

OK "Arborescence créée"

# =============================================================================
# ANGULAR.JSON — configuration tailwind 4 + paths
# =============================================================================
SECTION "6/6 — angular.json + Tailwind 4"

# Tailwind 4 n'utilise plus tailwind.config.js — configuration via CSS
cat > src/styles/tailwind.css << 'EOF'
/* Tailwind CSS v4 — Import via plugin CSS natif */
@import "tailwindcss";

/* =============================================================================
   IMMOCAM — Theme Tailwind 4 Custom
   Blue foncé marine : couleur principale de la plateforme
============================================================================= */

@theme {
  /* Palette principale — Blue ImmoCam */
  --color-primary-50:  #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;
  --color-primary-950: #172554;

  /* Blue foncé ImmoCam — Couleur de marque */
  --color-immocam:       #0F2A5E;
  --color-immocam-light: #1A3F8F;
  --color-immocam-dark:  #081A3D;

  /* Surfaces */
  --color-surface:         #FFFFFF;
  --color-surface-subtle:  #F8FAFC;
  --color-surface-muted:   #F1F5F9;
  --color-surface-overlay: rgba(15, 42, 94, 0.05);

  /* Bordures */
  --color-border:        #E2E8F0;
  --color-border-subtle: #F1F5F9;
  --color-border-strong: #CBD5E1;

  /* Statuts annonces */
  --color-active:   #10B981;
  --color-pause:    #F59E0B;
  --color-expired:  #EF4444;
  --color-archived: #6B7280;
  --color-deleted:  #DC2626;

  /* Typography */
  --font-display: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
  --font-body:    'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Font sizes mobiles-first */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;

  /* Spacing */
  --spacing-safe-top:    env(safe-area-inset-top, 0px);
  --spacing-safe-bottom: env(safe-area-inset-bottom, 0px);

  /* Border radius */
  --radius-sm:   0.375rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06);
  --shadow-elevated: 0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -2px rgba(0,0,0,.06);
  --shadow-modal: 0 20px 25px -5px rgba(0,0,0,.12), 0 8px 10px -6px rgba(0,0,0,.08);

  /* Transitions */
  --duration-fast:   150ms;
  --duration-base:   200ms;
  --duration-slow:   300ms;
  --ease-spring:     cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-smooth:     cubic-bezier(0.4, 0, 0.2, 1);
}

/* =============================================================================
   RESET & BASE MOBILE-FIRST
============================================================================= */

*, *::before, *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  font-size: 16px;
}

body {
  font-family: var(--font-body);
  background-color: #F8FAFC;
  color: #1E293B;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  padding-top: var(--spacing-safe-top);
  padding-bottom: var(--spacing-safe-bottom);
}

/* Scrollbar personnalisée */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

/* Focus visible amélioré */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Images responsive */
img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Liens */
a { color: inherit; text-decoration: none; }
a:hover { text-decoration: none; }

/* Boutons */
button { cursor: pointer; font-family: inherit; }

/* =============================================================================
   COMPOSANTS UTILITAIRES GLOBAUX
============================================================================= */

/* Skeleton loader shimmer */
.skeleton {
  background: linear-gradient(90deg,
    #E2E8F0 25%,
    #F1F5F9 50%,
    #E2E8F0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Fade in */
.fade-in {
  animation: fadeIn var(--duration-slow) var(--ease-smooth) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide up */
.slide-up {
  animation: slideUp var(--duration-slow) var(--ease-spring) both;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Stagger animations */
.stagger > * { animation-delay: calc(var(--index, 0) * 60ms); }

/* Card hover */
.card-hover {
  transition: transform var(--duration-base) var(--ease-smooth),
              box-shadow var(--duration-base) var(--ease-smooth);
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}

/* Badge statut */
.badge-active   { background: #DCFCE7; color: #15803D; }
.badge-pause    { background: #FEF9C3; color: #A16207; }
.badge-expired  { background: #FEE2E2; color: #B91C1C; }
.badge-archived { background: #F3F4F6; color: #374151; }
.badge-deleted  { background: #FEE2E2; color: #991B1B; }

/* Input mobile */
input, select, textarea {
  font-family: var(--font-body);
  font-size: 16px; /* Évite zoom sur iOS */
}

/* Safe area padding pour mobiles */
.safe-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
.safe-top    { padding-top: max(1rem, env(safe-area-inset-top)); }

/* =============================================================================
   LOADING SPINNER GLOBAL
============================================================================= */

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-primary-200);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =============================================================================
   OTP INPUT SPÉCIAL
============================================================================= */

.otp-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
  background: white;
  color: var(--color-immocam);
}

.otp-input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.otp-input.filled {
  border-color: var(--color-primary-600);
  background: var(--color-primary-50);
}

/* =============================================================================
   PHOTO UPLOAD DRAG & DROP
============================================================================= */

.dropzone {
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-xl);
  transition: all var(--duration-base) var(--ease-smooth);
  background: var(--color-surface-subtle);
}

.dropzone.dragover {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
  transform: scale(1.01);
}

/* =============================================================================
   INFINITE SCROLL SENTINEL
============================================================================= */

.scroll-sentinel {
  height: 1px;
  width: 100%;
}

/* =============================================================================
   HERO SECTION (HOME)
============================================================================= */

.hero-gradient {
  background: linear-gradient(
    135deg,
    var(--color-immocam-dark) 0%,
    var(--color-immocam) 40%,
    var(--color-immocam-light) 100%
  );
}

/* =============================================================================
   NAVIGATION MOBILE
============================================================================= */

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: white;
  border-top: 1px solid var(--color-border);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* =============================================================================
   MEDIA QUERIES (mobile-first breakpoints Tailwind 4)
============================================================================= */

/* xs: 375px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px */

@media (max-width: 639px) {
  .hide-mobile { display: none !important; }
}

@media (min-width: 640px) {
  .hide-desktop { display: none !important; }
}
EOF

OK "Tailwind 4 CSS configuré"

# Ajout au styles.scss principal
cat > src/styles.scss << 'EOF'
// =============================================================================
// IMMOCAM — Styles globaux
// =============================================================================

// Import Tailwind 4
@use 'styles/tailwind.css';

// Google Fonts (Plus Jakarta Sans + Inter)
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

// Variables SCSS
$blue-immocam:       #0F2A5E;
$blue-immocam-light: #1A3F8F;
$blue-immocam-dark:  #081A3D;

// Angular Material custom theme sera chargé via ng-02-core.sh
EOF

OK "styles.scss configuré"

# =============================================================================
# ANGULAR.JSON — mise à jour
# =============================================================================
# angular.json est déjà créé par ng new, on le patche
node -e "
const fs = require('fs');
const aj = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
const build = aj.projects['$PROJECT_NAME'].architect.build;

// Ajouter les paths imports
build.options.stylePreprocessorOptions = {
  includePaths: ['src']
};

// Assets
build.options.assets = [
  { glob: '**/*', input: 'public' },
  { glob: '**/*', input: 'src/assets', output: 'assets' }
];

// Styles
build.options.styles = [
  'src/styles.scss'
];

fs.writeFileSync('angular.json', JSON.stringify(aj, null, 2));
console.log('angular.json mis à jour');
"

OK "angular.json mis à jour"

# =============================================================================
# FICHIER i18n (textes français centralisés)
# =============================================================================
cat > src/assets/i18n/fr.json << 'EOF'
{
  "app": {
    "name": "ImmoCam",
    "tagline": "L'immobilier camerounais simplifié",
    "description": "Trouvez votre logement idéal au Cameroun"
  },
  "nav": {
    "home": "Accueil",
    "login": "Se connecter",
    "register": "S'inscrire",
    "publish": "Publier une annonce",
    "dashboard": "Mon espace",
    "admin": "Administration",
    "logout": "Se déconnecter"
  },
  "annonce": {
    "statuses": {
      "ACTIVE": "Active",
      "EN_PAUSE": "En pause",
      "EXPIREE": "Expirée",
      "ARCHIVEE": "Archivée",
      "SUPPRIMEE": "Supprimée"
    },
    "actions": {
      "pause": "Mettre en pause",
      "reactivate": "Réactiver",
      "renew": "Renouveler",
      "archive": "Archiver",
      "delete": "Supprimer",
      "edit": "Modifier",
      "contact": "Contacter via WhatsApp",
      "favorite": "Ajouter aux favoris",
      "unfavorite": "Retirer des favoris",
      "report": "Signaler"
    },
    "empty": "Aucune annonce disponible pour le moment",
    "loading": "Chargement des annonces...",
    "noMore": "Vous avez vu toutes les annonces disponibles"
  },
  "auth": {
    "loginTitle": "Connexion à ImmoCam",
    "registerTitle": "Créer un compte ImmoCam",
    "emailLabel": "Adresse email",
    "passwordLabel": "Mot de passe",
    "forgotPassword": "Mot de passe oublié ?",
    "noAccount": "Pas encore de compte ?",
    "hasAccount": "Déjà un compte ?",
    "policyRequired": "Vous devez accepter la politique de confidentialité pour créer un compte.",
    "policyText": "J'ai lu et j'accepte la Politique de confidentialité et les Conditions d'utilisation d'ImmoCam."
  },
  "errors": {
    "network": "Impossible de charger les données. Vérifiez votre connexion.",
    "server": "Une erreur serveur s'est produite. Réessayez plus tard.",
    "unauthorized": "Votre session a expiré. Veuillez vous reconnecter.",
    "notFound": "La ressource demandée n'existe pas.",
    "rateLimit": "Trop de requêtes. Veuillez patienter quelques instants.",
    "offline": "Vous êtes hors connexion. ImmoCam nécessite une connexion internet."
  },
  "whatsapp": {
    "defaultMessage": "Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : {type} à {quartier}, {ville} — {prix} FCFA. Est-il toujours disponible ?"
  },
  "cities": [
    "Yaoundé", "Douala", "Maroua", "Garoua", "Ngaoundéré",
    "Bertoua", "Mbalmayo", "Bafia", "Nkongsamba", "Edéa",
    "Bafoussam", "Dschang", "Foumban", "Bamenda", "Buea",
    "Kumba", "Limbé", "Ebolowa", "Kribi", "Sangmélima"
  ],
  "propertyTypes": [
    "Appartement", "Studio", "Villa", "Maison", "Bureau",
    "Boutique", "Entrepôt", "Terrain", "Chambre"
  ]
}
EOF

OK "i18n/fr.json généré"

# =============================================================================
# SVG ASSETS DE BASE
# =============================================================================
cat > src/assets/images/empty-state.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="80" fill="#EFF6FF"/>
  <rect x="60" y="70" width="80" height="90" rx="8" fill="#BFDBFE"/>
  <rect x="70" y="85" width="60" height="8" rx="4" fill="#93C5FD"/>
  <rect x="70" y="100" width="45" height="6" rx="3" fill="#BFDBFE"/>
  <rect x="70" y="113" width="50" height="6" rx="3" fill="#BFDBFE"/>
  <circle cx="140" cy="60" r="20" fill="#1E40AF"/>
  <text x="140" y="66" text-anchor="middle" fill="white" font-size="18" font-family="Arial">?</text>
</svg>
EOF

cat > src/assets/images/no-photo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" fill="none">
  <rect width="300" height="200" rx="12" fill="#F1F5F9"/>
  <circle cx="150" cy="90" r="30" fill="#E2E8F0"/>
  <path d="M135 90 L150 70 L165 90 Z" fill="#CBD5E1"/>
  <rect x="130" y="85" width="40" height="25" rx="4" fill="#CBD5E1"/>
  <circle cx="160" cy="92" r="6" fill="#94A3B8"/>
  <text x="150" y="145" text-anchor="middle" fill="#94A3B8" font-size="13" font-family="Arial">Aucune photo</text>
</svg>
EOF

OK "Assets SVG de base créés"

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 01 TERMINÉ — FONDATIONS CRÉÉES${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Projet créé : $(pwd)"
INFO "Angular 21 + Tailwind 4 + NgRx 18"
INFO "Mode mock : SRC/environments/environment.ts → useMock: true"
INFO "Changer useMock: false pour utiliser l'API Spring Boot"
echo ""
WARN "Étape suivante :"
WARN "  cd $PROJECT_NAME (si pas déjà dedans)"
WARN "  npm install"
WARN "  bash ../ng-02-core.sh"
