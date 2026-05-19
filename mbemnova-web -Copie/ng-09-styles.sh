#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 09 : STYLES AVANCÉS + MATERIAL THEME
# =============================================================================
# Rôle     : Complète le design system :
#            - Thème Angular Material bleu ImmoCam
#            - Animations SCSS avancées (stagger, pulse, ripple)
#            - Composants UI manquants (PhotoGallery améliorée, MobileNav)
#            - Variables CSS globales cohérentes
#            - Toasts CSS natifs animés
#            - Styles spécifiques admin (charts, tables)
#            - PWA meta tags + manifest
#            - Icônes SVG inline réutilisables
#
# Exécuter : bash ../ng-09-styles.sh (depuis la racine du projet)
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || { echo "Lancez depuis la racine Angular"; exit 1; }
SECTION "SCRIPT 09 — STYLES AVANCÉS + MATERIAL THEME"

# =============================================================================
# 1. SCSS VARIABLES & ANIMATIONS COMPLÈTES
# =============================================================================
SECTION "1/5 — SCSS Variables et animations"

mkdir -p src/styles

cat > src/styles/_variables.scss << 'EOF'
// =============================================================================
// IMMOCAM — Variables SCSS centralisées
// =============================================================================

// Palette Blue ImmoCam
$blue-950:  #0A1628;
$blue-900:  #0F2A5E;  // ← Couleur principale ImmoCam
$blue-800:  #1A3F8F;
$blue-700:  #1D4ED8;
$blue-600:  #2563EB;
$blue-500:  #3B82F6;
$blue-400:  #60A5FA;
$blue-300:  #93C5FD;
$blue-200:  #BFDBFE;
$blue-100:  #DBEAFE;
$blue-50:   #EFF6FF;

// Statuts
$color-active:   #10B981;
$color-pause:    #F59E0B;
$color-expired:  #EF4444;
$color-archived: #6B7280;
$color-deleted:  #DC2626;

// Neutres
$slate-900: #0F172A;
$slate-800: #1E293B;
$slate-700: #334155;
$slate-600: #475569;
$slate-500: #64748B;
$slate-400: #94A3B8;
$slate-300: #CBD5E1;
$slate-200: #E2E8F0;
$slate-100: #F1F5F9;
$slate-50:  #F8FAFC;

// Typographie
$font-display: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
$font-body:    'Inter', 'Segoe UI', system-ui, sans-serif;

// Breakpoints (mobile-first)
$bp-xs: 375px;
$bp-sm: 640px;
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;

// Spacing
$header-height:     64px;
$mobile-nav-height: 64px;
$sidebar-width:     256px;

// Z-index
$z-dropdown:  40;
$z-sticky:    41;
$z-overlay:   50;
$z-modal:     60;
$z-toast:     70;

// Transitions
$transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-base:   200ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-slow:   300ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-spring: 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);

// Border radius
$radius-sm:   6px;
$radius-md:   8px;
$radius-lg:   12px;
$radius-xl:   16px;
$radius-2xl:  24px;
$radius-full: 9999px;

// Shadows
$shadow-card:     0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06);
$shadow-elevated: 0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -2px rgba(0,0,0,.06);
$shadow-modal:    0 20px 25px -5px rgba(0,0,0,.12), 0 8px 10px -6px rgba(0,0,0,.08);
$shadow-blue:     0 4px 14px 0 rgba(15,42,94,.25);
EOF
OK "_variables.scss"

cat > src/styles/_typography.scss << 'EOF'
// =============================================================================
// IMMOCAM — Typographie
// =============================================================================

@import 'variables';

// Échelle typographique
.text-display-lg { font-family: $font-display; font-size: 2.5rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; }
.text-display-md { font-family: $font-display; font-size: 2rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
.text-display-sm { font-family: $font-display; font-size: 1.5rem; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em; }

.text-heading-lg { font-size: 1.25rem; font-weight: 700; line-height: 1.4; }
.text-heading-md { font-size: 1.125rem; font-weight: 600; line-height: 1.5; }
.text-heading-sm { font-size: 1rem; font-weight: 600; line-height: 1.5; }

.text-body-lg    { font-size: 1rem; line-height: 1.7; }
.text-body-md    { font-size: 0.875rem; line-height: 1.6; }
.text-body-sm    { font-size: 0.75rem; line-height: 1.5; }

.text-label      { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
.text-caption    { font-size: 0.6875rem; line-height: 1.4; color: #64748B; }

// Prix ImmoCam
.text-price      {
  font-family: $font-display;
  font-weight: 800;
  color: $blue-900;
  letter-spacing: -0.02em;
}

// Tronquer
.truncate-1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.truncate-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
EOF
OK "_typography.scss"

cat > src/styles/_animations.scss << 'EOF'
// =============================================================================
// IMMOCAM — Animations et transitions
// =============================================================================

// ─── Entrées ─────────────────────────────────────────────────────────────────

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}

// ─── Loaders ─────────────────────────────────────────────────────────────────

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes skeletonShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .5; }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14%       { transform: scale(1.15); }
  28%       { transform: scale(1); }
  42%       { transform: scale(1.12); }
  70%       { transform: scale(1); }
}

// ─── Notifications ────────────────────────────────────────────────────────────

@keyframes toastIn {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes toastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(8px) scale(0.95); }
}

@keyframes badgePop {
  0%   { transform: scale(0); }
  60%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

// ─── Ripple effet touch ───────────────────────────────────────────────────────

@keyframes ripple {
  from { transform: scale(0); opacity: 0.3; }
  to   { transform: scale(4); opacity: 0; }
}

// ─── Classes utilitaires ─────────────────────────────────────────────────────

.fade-in     { animation: fadeIn 300ms ease both; }
.fade-in-up  { animation: fadeInUp 350ms ease both; }
.fade-in-down{ animation: fadeInDown 250ms ease both; }
.slide-up    { animation: slideUp 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
.scale-in    { animation: scaleIn 200ms ease both; }

// Stagger enfants
.stagger-children > * {
  animation: fadeIn 300ms ease both;
  @for $i from 1 through 12 {
    &:nth-child(#{$i}) { animation-delay: #{($i - 1) * 50}ms; }
  }
}

// Skeleton amélioré
.skeleton {
  background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
  &.rounded-full { border-radius: 9999px; }
}

// Spinner ImmoCam
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #DBEAFE;
  border-top-color: #1E40AF;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;

  &.spinner-sm { width: 20px; height: 20px; border-width: 2px; }
  &.spinner-lg { width: 56px; height: 56px; border-width: 4px; }
  &.spinner-white { border-color: rgba(255,255,255,.3); border-top-color: white; }
}

// Toast natif
#immocam-toasts {
  @keyframes toastIn { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
  @keyframes toastOut { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(6px) scale(.97); } }
}

// Ripple button
.btn-ripple {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(255,255,255,.3) 10%, transparent 60%);
    transform: scale(0);
    opacity: 0;
    transition: none;
    border-radius: inherit;
  }

  &:active::after {
    animation: ripple 400ms ease-out;
  }
}

// Transition hover carte
.card-hover {
  transition: transform 200ms ease, box-shadow 200ms ease;
  will-change: transform;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(15,42,94,.12);
  }

  &:active { transform: translateY(0); }
}

// Favori heartbeat
.heart-beat {
  animation: heartbeat 800ms ease;
}
EOF
OK "_animations.scss"

# styles.scss principal COMPLET
cat > src/styles.scss << 'EOF'
// =============================================================================
// IMMOCAM — Styles globaux v2.0
// =============================================================================

// Tailwind 4
@use 'styles/tailwind.css';

// SCSS partials
@use 'styles/variables' as *;
@use 'styles/typography';
@use 'styles/animations';

// Google Fonts
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600&display=swap');

// =============================================================================
// RESET GLOBAL
// =============================================================================

*, *::before, *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  font-size: 16px;
  height: 100%;
}

body {
  font-family: $font-body;
  background-color: #F8FAFC;
  color: $slate-800;
  line-height: 1.6;
  min-height: 100%;
  overflow-x: hidden;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

// Scrollbar personnalisée
::-webkit-scrollbar          { width: 5px; height: 5px; }
::-webkit-scrollbar-track    { background: transparent; }
::-webkit-scrollbar-thumb    { background: $slate-300; border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: $slate-400; }

// Focus
:focus-visible {
  outline: 2px solid $blue-500;
  outline-offset: 2px;
  border-radius: 4px;
}

// Images
img, video { max-width: 100%; height: auto; display: block; }

// Sélection de texte
::selection { background: $blue-200; color: $blue-900; }

// =============================================================================
// FORMULAIRES GLOBAUX
// =============================================================================

input, select, textarea, button {
  font-family: inherit;
  font-size: 16px; // Évite le zoom automatique iOS
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px #F8FAFC inset;
  -webkit-text-fill-color: $slate-800;
}

// Classe input standard ImmoCam
.immocam-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-radius: $radius-xl;
  border: 1.5px solid $slate-200;
  background: #F8FAFC;
  font-size: 0.9375rem;
  color: $slate-800;
  transition: border-color $transition-fast, box-shadow $transition-fast, background $transition-fast;
  outline: none;

  &::placeholder { color: $slate-400; }

  &:hover:not(:disabled) { border-color: $slate-300; background: white; }

  &:focus {
    border-color: $blue-500;
    box-shadow: 0 0 0 3px rgba($blue-500, .12);
    background: white;
  }

  &.error {
    border-color: #EF4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, .1);
  }

  &:disabled { opacity: .5; cursor: not-allowed; }
}

// =============================================================================
// BOUTONS GLOBAUX
// =============================================================================

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: $font-body;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: $radius-xl;
  border: none;
  cursor: pointer;
  transition: all $transition-base;
  white-space: nowrap;
  position: relative;
  overflow: hidden;

  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: .5; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid $blue-500; outline-offset: 2px; }

  // Tailles
  &.btn-sm  { height: 36px; padding: 0 14px; font-size: 0.875rem; }
  &.btn-md  { height: 44px; padding: 0 20px; }
  &.btn-lg  { height: 52px; padding: 0 28px; font-size: 1rem; }
  &.btn-xl  { height: 58px; padding: 0 32px; font-size: 1.0625rem; border-radius: $radius-2xl; }
  &.btn-full{ width: 100%; }

  // Variantes
  &.btn-primary {
    background: $blue-900;
    color: white;
    box-shadow: 0 2px 8px rgba($blue-900, .25);
    &:hover:not(:disabled) { background: $blue-800; box-shadow: 0 4px 12px rgba($blue-900, .3); }
  }

  &.btn-secondary {
    background: white;
    color: $blue-900;
    border: 1.5px solid $slate-200;
    &:hover:not(:disabled) { background: $slate-50; border-color: $slate-300; }
  }

  &.btn-ghost {
    background: transparent;
    color: $slate-600;
    &:hover:not(:disabled) { background: $slate-100; color: $blue-900; }
  }

  &.btn-danger {
    background: #EF4444;
    color: white;
    &:hover:not(:disabled) { background: #DC2626; }
  }

  &.btn-whatsapp {
    background: #25D366;
    color: white;
    box-shadow: 0 2px 8px rgba(37,211,102,.3);
    &:hover:not(:disabled) { background: #22C55E; }
  }
}

// =============================================================================
// CARDS
// =============================================================================

.card {
  background: white;
  border-radius: $radius-2xl;
  border: 1px solid $slate-100;
  box-shadow: $shadow-card;
  overflow: hidden;
}

.card-body  { padding: 20px; }
.card-hover { transition: transform 200ms ease, box-shadow 200ms ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: $shadow-elevated; }

// =============================================================================
// BADGES STATUTS ANNONCES
// =============================================================================

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: $radius-full;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: .02em;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &.badge-active   { background: #DCFCE7; color: #166534; &::before { background: #22C55E; } }
  &.badge-pause    { background: #FEF9C3; color: #854D0E; &::before { background: #EAB308; } }
  &.badge-expired  { background: #FEE2E2; color: #991B1B; &::before { background: #EF4444; } }
  &.badge-archived { background: #F3F4F6; color: #374151; &::before { background: #9CA3AF; } }
  &.badge-deleted  { background: #FEE2E2; color: #7F1D1D; &::before { background: #DC2626; } }
}

// =============================================================================
// NAVIGATION MOBILE (bottom nav)
// =============================================================================

.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: $z-sticky;
  background: white;
  border-top: 1px solid $slate-100;
  display: flex;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 20px rgba(0,0,0,.05);

  a, button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 10px 4px;
    color: $slate-400;
    font-size: 0.6875rem;
    font-weight: 500;
    transition: color $transition-fast;
    text-decoration: none;
    border: none;
    background: none;
    cursor: pointer;

    svg { width: 22px; height: 22px; }

    &.active, &[class*='active'] {
      color: $blue-900;
      svg { stroke-width: 2.5; }
    }

    &:hover:not(.active) { color: $blue-600; }
  }
}

// =============================================================================
// TABLE ADMIN
// =============================================================================

.admin-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $slate-50;
    border-bottom: 1px solid $slate-100;

    th {
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: $slate-500;
      padding: 10px 16px;
      white-space: nowrap;
      letter-spacing: .03em;
      text-transform: uppercase;
    }
  }

  tbody tr {
    border-bottom: 1px solid $slate-50;
    transition: background $transition-fast;

    &:hover { background: $slate-50; }
    &:last-child { border-bottom: none; }
  }

  td { padding: 12px 16px; }
}

// =============================================================================
// HERO GRADIENT
// =============================================================================

.hero-gradient {
  background: linear-gradient(135deg, #081A3D 0%, #0F2A5E 45%, #1A3F8F 100%);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(37,99,235,.15) 0%, transparent 60%);
    pointer-events: none;
  }
}

// =============================================================================
// SAFE AREAS
// =============================================================================

.safe-top    { padding-top:    max(16px, env(safe-area-inset-top)); }
.safe-bottom { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
.pb-nav      { padding-bottom: calc(64px + max(16px, env(safe-area-inset-bottom))); }

// =============================================================================
// PHOTO GALERIE AMÉLIORÉE
// =============================================================================

.photo-gallery {
  position: relative;
  border-radius: $radius-2xl;
  overflow: hidden;
  background: $slate-100;
  aspect-ratio: 16/10;

  .photo-main {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 200ms ease;
  }

  .photo-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0,0,0,.45);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: bold;
    transition: background $transition-fast, transform $transition-base;
    backdrop-filter: blur(4px);
    z-index: 2;

    &:hover { background: rgba(0,0,0,.65); }
    &:active { transform: translateY(-50%) scale(0.9); }
    &.prev { left: 12px; }
    &.next { right: 12px; }
  }

  .photo-dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
    z-index: 2;

    button {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,.5);
      cursor: pointer;
      transition: all $transition-fast;
      padding: 0;

      &.active {
        background: white;
        transform: scale(1.3);
      }
    }
  }

  .photo-thumbs {
    display: flex;
    gap: 6px;
    padding: 6px;
    background: $slate-50;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }

    button {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      border-radius: $radius-md;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      transition: border-color $transition-fast, opacity $transition-fast;
      padding: 0;

      img { width: 100%; height: 100%; object-fit: cover; }

      &.active { border-color: $blue-900; }
      &:not(.active) { opacity: .65; }
      &:hover:not(.active) { opacity: .85; }
    }
  }

  .photo-count {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(0,0,0,.5);
    color: white;
    font-size: 0.6875rem;
    padding: 3px 8px;
    border-radius: $radius-full;
    backdrop-filter: blur(4px);
    z-index: 2;
  }
}

// =============================================================================
// FILTER BAR AMÉLIORÉE
// =============================================================================

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: $radius-full;
  background: $blue-50;
  color: $blue-700;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1.5px solid $blue-200;
  transition: all $transition-fast;
  cursor: pointer;

  &:hover { background: $blue-100; border-color: $blue-300; }

  &.active {
    background: $blue-900;
    color: white;
    border-color: $blue-900;
  }

  .chip-close {
    width: 14px;
    height: 14px;
    background: rgba(255,255,255,.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    transition: background $transition-fast;

    &:hover { background: rgba(255,255,255,.5); }
  }
}

// =============================================================================
// EMPTY STATE AMÉLIORÉ
// =============================================================================

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;

  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: $blue-50;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    animation: pulse 2s ease-in-out infinite;
  }

  h3 { font-size: 1.125rem; font-weight: 700; color: $slate-700; margin-bottom: 8px; }
  p  { font-size: 0.875rem; color: $slate-400; max-width: 280px; line-height: 1.6; }
}

// =============================================================================
// LOADING STATES
// =============================================================================

.page-loading {
  position: fixed;
  inset: 0;
  z-index: $z-overlay;
  background: rgba(248, 250, 252, .85);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;

  p { font-size: 0.875rem; color: $slate-500; animation: pulse 1.5s ease infinite; }
}

// =============================================================================
// PRINT STYLES (pour export)
// =============================================================================

@media print {
  .no-print       { display: none !important; }
  .mobile-bottom-nav { display: none !important; }
  body            { background: white; }
}
EOF
OK "styles.scss complet"

# =============================================================================
# 2. MOBILE NAV COMPONENT
# =============================================================================
SECTION "2/5 — Mobile Navigation (bottom nav)"

mkdir -p src/app/layout/mobile-nav
cat > src/app/layout/mobile-nav/mobile-nav.component.ts << 'EOF'
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn, selectIsAdmin } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Nav mobile visible uniquement sur sm et moins -->
    <nav class="mobile-bottom-nav sm:hidden">
      <a routerLink="/" routerLinkActive="text-blue-900" [routerLinkActiveOptions]="{ exact: true }"
         class="flex flex-col items-center gap-1 flex-1 py-2 text-slate-400 hover:text-blue-700
                transition-colors text-xs font-medium no-underline">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <span>Accueil</span>
      </a>

      <a routerLink="/annonces" routerLinkActive="text-blue-900"
         class="flex flex-col items-center gap-1 flex-1 py-2 text-slate-400 hover:text-blue-700
                transition-colors text-xs font-medium no-underline">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span>Annonces</span>
      </a>

      <!-- Bouton publier central -->
      <a routerLink="/annonces/creer"
         class="flex flex-col items-center gap-1 flex-1 py-2 no-underline">
        <div class="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center
                    shadow-lg shadow-blue-900/30 -mt-5 transition-transform active:scale-95">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <span class="text-xs font-medium text-blue-900">Publier</span>
      </a>

      @if (isLoggedIn()) {
        <a routerLink="/dashboard/mes-favoris" routerLinkActive="text-blue-900"
           class="flex flex-col items-center gap-1 flex-1 py-2 text-slate-400 hover:text-blue-700
                  transition-colors text-xs font-medium no-underline">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span>Favoris</span>
        </a>

        <a routerLink="/dashboard" routerLinkActive="text-blue-900"
           class="flex flex-col items-center gap-1 flex-1 py-2 text-slate-400 hover:text-blue-700
                  transition-colors text-xs font-medium no-underline">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>Moi</span>
        </a>
      } @else {
        <a routerLink="/auth/login" routerLinkActive="text-blue-900"
           class="flex flex-col items-center gap-1 flex-1 py-2 text-slate-400 hover:text-blue-700
                  transition-colors text-xs font-medium no-underline">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
          </svg>
          <span>Connexion</span>
        </a>
      }
    </nav>
  `,
})
export class MobileNavComponent {
  private readonly store = inject(Store);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly isAdmin    = this.store.selectSignal(selectIsAdmin);
}
EOF
OK "MobileNavComponent"

# Mettre à jour MainLayout avec la nav mobile
cat > src/app/layout/main-layout/main-layout.component.ts << 'EOF'
import { Component, inject, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';
import { selectLoading } from '@store/ui/ui.selectors';
import { uiActions } from '@store/ui/ui.actions';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LoadingSpinnerComponent, MobileNavComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <app-header/>

      @if (loading()) {
        <app-loading-spinner [overlay]="true" message="Chargement..."/>
      }

      <main class="flex-1 w-full pb-nav sm:pb-0">
        <router-outlet/>
      </main>

      <app-footer/>

      <!-- Navigation bottom mobile -->
      <app-mobile-nav/>
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  private readonly store = inject(Store);
  readonly loading = this.store.selectSignal(selectLoading);

  @HostListener('window:resize')
  onResize(): void {
    this.store.dispatch(uiActions.setMobile({ isMobile: window.innerWidth < 640 }));
  }

  ngOnInit(): void {
    this.onResize();
  }
}
EOF
OK "MainLayout avec MobileNav"

# =============================================================================
# 3. PHOTO GALLERY COMPONENT AMÉLIORÉE
# =============================================================================
SECTION "3/5 — PhotoGallery component"

cat > src/app/shared/components/photo-gallery/photo-gallery.component.ts << 'EOF'
import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoResponse } from '@core/models';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="photo-gallery">
      <!-- Photo principale -->
      <div class="relative" style="aspect-ratio: 16/10;">
        <img
          [src]="currentPhoto()"
          [alt]="'Photo ' + (photoIndex() + 1)"
          class="w-full h-full object-cover transition-opacity duration-200"
          (error)="onError($event)"
        />

        <!-- Compteur -->
        @if (photos.length > 1) {
          <span class="photo-count">{{ photoIndex() + 1 }} / {{ photos.length }}</span>
        }

        <!-- Navigation -->
        @if (photos.length > 1) {
          <button (click)="prev()" class="photo-nav-btn prev" aria-label="Photo précédente">‹</button>
          <button (click)="next()" class="photo-nav-btn next" aria-label="Photo suivante">›</button>

          <!-- Dots -->
          <div class="photo-dots">
            @for (p of photos; track p.id; let i = $index) {
              <button (click)="photoIndex.set(i)" [class.active]="i === photoIndex()"
                      [attr.aria-label]="'Aller à la photo ' + (i + 1)"></button>
            }
          </div>
        }

        <!-- Badge "Principale" -->
        <span class="absolute top-3 left-3 px-2.5 py-1 bg-blue-900/80 text-white text-xs
                     font-semibold rounded-lg backdrop-blur-sm">
          Photo principale
        </span>
      </div>

      <!-- Miniatures -->
      @if (photos.length > 1) {
        <div class="photo-thumbs">
          @for (p of photos; track p.id; let i = $index) {
            <button (click)="photoIndex.set(i)"
                    [class.active]="i === photoIndex()"
                    class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2
                           transition-all focus:outline-none focus:border-blue-500"
                    [class]="i === photoIndex()
                      ? 'border-blue-900 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-85'"
                    [attr.aria-label]="'Miniature photo ' + (i + 1)">
              <img [src]="p.urlThumb || p.url" [alt]="'Miniature ' + (i + 1)"
                   class="w-full h-full object-cover"/>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class PhotoGalleryComponent {
  @Input({ required: true }) photos: PhotoResponse[] = [];
  @Input() fallback = '/assets/images/no-photo.svg';

  photoIndex = signal(0);

  currentPhoto = computed(() => {
    if (!this.photos.length) return this.fallback;
    return this.photos[this.photoIndex()]?.url ?? this.fallback;
  });

  prev(): void {
    this.photoIndex.update(i => (i - 1 + this.photos.length) % this.photos.length);
  }
  next(): void {
    this.photoIndex.update(i => (i + 1) % this.photos.length);
  }
  onError(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallback;
  }
}
EOF
OK "PhotoGallery"

# =============================================================================
# 4. PWA MANIFEST + META TAGS
# =============================================================================
SECTION "4/5 — PWA Manifest + Meta tags"

mkdir -p public
cat > public/manifest.json << 'EOF'
{
  "name": "ImmoCam — Immobilier Cameroun",
  "short_name": "ImmoCam",
  "description": "Trouvez votre bien immobilier au Cameroun",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F2A5E",
  "theme_color": "#0F2A5E",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "categories": ["business", "utilities"],
  "lang": "fr"
}
EOF
OK "manifest.json"

cat > src/index.html << 'EOF'
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>ImmoCam — Immobilier camerounais</title>
  <base href="/"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>

  <!-- SEO -->
  <meta name="description" content="Trouvez votre logement, bureau ou boutique au Cameroun. Annonces immobilières de Douala, Yaoundé et 18 autres villes."/>
  <meta name="keywords" content="immobilier cameroun, logement douala, appartement yaoundé, maison cameroun"/>
  <meta name="author" content="MBEMNOVA"/>
  <meta name="robots" content="index, follow"/>

  <!-- Open Graph -->
  <meta property="og:title" content="ImmoCam — Immobilier camerounais"/>
  <meta property="og:description" content="Trouvez votre bien immobilier au Cameroun"/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="https://immocam.cm"/>
  <meta property="og:image" content="/assets/images/og-image.png"/>
  <meta property="og:locale" content="fr_CM"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="ImmoCam — Immobilier camerounais"/>
  <meta name="twitter:description" content="Trouvez votre bien immobilier au Cameroun"/>

  <!-- PWA -->
  <meta name="theme-color" content="#0F2A5E"/>
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <meta name="apple-mobile-web-app-title" content="ImmoCam"/>
  <link rel="manifest" href="/manifest.json"/>

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="favicon.ico"/>

  <!-- Preconnect fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>

  <!-- Toast CSS inline -->
  <style>
    @keyframes toastIn  { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: none; } }
    @keyframes toastOut { from { opacity: 1; } to { opacity: 0; transform: translateY(6px) scale(.97); } }
    body { margin: 0; }
  </style>
</head>
<body>
  <app-root>
    <!-- Splash screen pendant le chargement Angular -->
    <div style="position:fixed;inset:0;background:#0F2A5E;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:16px;z-index:9999;"
         id="app-splash">
      <div style="width:56px;height:56px;background:white;border-radius:16px;display:flex;
                  align-items:center;justify-content:center;font-weight:800;font-size:18px;
                  color:#0F2A5E;font-family:sans-serif;">IC</div>
      <p style="color:#93C5FD;font-size:14px;font-family:sans-serif;margin:0;">Chargement...</p>
      <div style="width:32px;height:32px;border:3px solid rgba(255,255,255,.2);
                  border-top-color:white;border-radius:50%;animation:spin .8s linear infinite;"></div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  </app-root>
  <script>
    // Cacher le splash dès qu'Angular est prêt
    document.addEventListener('DOMContentLoaded', function() {
      const observer = new MutationObserver(function() {
        const splash = document.getElementById('app-splash');
        if (document.querySelector('app-root > *:not(#app-splash)') && splash) {
          splash.style.transition = 'opacity 300ms ease';
          splash.style.opacity = '0';
          setTimeout(() => splash.remove(), 300);
          observer.disconnect();
        }
      });
      observer.observe(document.querySelector('app-root'), { childList: true });
    });
  </script>
</body>
</html>
EOF
OK "index.html avec splash screen + SEO"

# =============================================================================
# 5. ICÔNES SVG INLINE RÉUTILISABLES
# =============================================================================
SECTION "5/5 — Icônes SVG ImmoCam"

cat > src/app/shared/components/icon/icon.component.ts << 'EOF'
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'home' | 'search' | 'heart' | 'heart-filled' | 'whatsapp'
  | 'user' | 'bell' | 'settings' | 'location' | 'camera'
  | 'trash' | 'edit' | 'eye' | 'share' | 'chevron-right'
  | 'chevron-left' | 'chevron-down' | 'close' | 'check'
  | 'plus' | 'filter' | 'star' | 'phone' | 'mail' | 'flag'
  | 'dashboard' | 'logout' | 'refresh' | 'download' | 'arrow-up';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [class]="'w-' + size + ' h-' + size + ' ' + extraClass"
         fill="none" stroke="currentColor" viewBox="0 0 24 24"
         [attr.aria-hidden]="true"
         [style.stroke-width]="strokeWidth">
      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="path"/>
    </svg>
  `,
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 5;
  @Input() strokeWidth = 1.8;
  @Input() extraClass = '';

  get path(): string {
    const paths: Record<IconName, string> = {
      'home':          'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      'search':        'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      'heart':         'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      'heart-filled':  'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      'whatsapp':      'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347',
      'user':          'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'bell':          'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      'settings':      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'location':      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      'camera':        'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
      'trash':         'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      'edit':          'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      'eye':           'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      'share':         'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
      'chevron-right': 'M9 5l7 7-7 7',
      'chevron-left':  'M15 19l-7-7 7-7',
      'chevron-down':  'M19 9l-7 7-7-7',
      'close':         'M6 18L18 6M6 6l12 12',
      'check':         'M5 13l4 4L19 7',
      'plus':          'M12 4v16m8-8H4',
      'filter':        'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
      'star':          'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      'phone':         'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
      'mail':          'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      'flag':          'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
      'dashboard':     'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
      'logout':        'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      'refresh':       'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      'download':      'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      'arrow-up':      'M5 10l7-7m0 0l7 7m-7-7v18',
    };
    return paths[this.name] ?? '';
  }
}
EOF
OK "IconComponent (30 icônes SVG inline)"

mkdir -p src/app/shared/components/icon
echo "" >> src/app/shared/components/index.ts 2>/dev/null || true
echo "export * from './icon/icon.component';" >> src/app/shared/components/index.ts

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 09 TERMINÉ — STYLES AVANCÉS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}[i]${NC} Ajouts: SCSS variables+animations, MobileNav, PhotoGallery, IconComponent, PWA manifest, index.html avec splash screen"
echo -e "${BLUE}[i]${NC} Prochaine étape: bash ../ng-10-mock-scenarios.sh"
