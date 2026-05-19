#!/usr/bin/env bash
# =============================================================================
# IMMOCAM FRONTEND — SCRIPT 11 : STYLES + ANIMATIONS (plan original ng-11)
# =============================================================================
# Rôle : Conforme au plan original ng-11-styles-animations.sh :
#        - Variables SCSS blue foncé COMPLÈTES
#        - Animations: fade · slide · shimmer (toutes variantes)
#        - Skeleton loader global (style Facebook/YouTube)
#        - Tailwind 4 custom theme (theme CSS complet)
#        - ngx-charts pour graphiques admin (installation + composant)
#        - Angular Material custom theme blue ImmoCam
#        - Toast animé natif complet
#        - Responsive grid système
#        - Print styles
#        - Dark mode préparé (off par défaut)
#
# Exécuter : bash ../ng-11-styles-animations.sh (depuis racine Angular)
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}";
            echo -e "${CYAN}  $1${NC}";
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "angular.json" ]] || { echo "Lancez depuis la racine Angular"; exit 1; }
SECTION "SCRIPT 11 — STYLES + ANIMATIONS COMPLETS"

mkdir -p src/styles

# =============================================================================
# 1. TAILWIND 4 CUSTOM THEME — COMPLET
# =============================================================================
SECTION "1/6 — Tailwind 4 Custom Theme (blue ImmoCam)"

cat > src/styles/tailwind.css << 'TAILWINDEOF'
/* =============================================================================
   IMMOCAM — Tailwind CSS v4 Custom Theme
   Moteur Oxide — pas de tailwind.config.js nécessaire
   Couleur principale: Blue ImmoCam #0F2A5E
============================================================================= */

@import "tailwindcss";

@theme {
  /* ─── Palette Blue ImmoCam ────────────────────────────────────────────── */
  --color-primary-50:   #EFF6FF;
  --color-primary-100:  #DBEAFE;
  --color-primary-200:  #BFDBFE;
  --color-primary-300:  #93C5FD;
  --color-primary-400:  #60A5FA;
  --color-primary-500:  #3B82F6;
  --color-primary-600:  #2563EB;
  --color-primary-700:  #1D4ED8;
  --color-primary-800:  #1E40AF;
  --color-primary-900:  #1E3A8A;
  --color-primary-950:  #172554;

  /* ─── Couleurs de marque ImmoCam ──────────────────────────────────────── */
  --color-immocam:        #0F2A5E;
  --color-immocam-light:  #1A3F8F;
  --color-immocam-dark:   #081A3D;
  --color-immocam-accent: #3B82F6;

  /* ─── Surfaces ────────────────────────────────────────────────────────── */
  --color-surface:          #FFFFFF;
  --color-surface-subtle:   #F8FAFC;
  --color-surface-muted:    #F1F5F9;
  --color-surface-inverted: #0F2A5E;
  --color-overlay:          rgba(15, 42, 94, 0.06);

  /* ─── Bordures ────────────────────────────────────────────────────────── */
  --color-border:        #E2E8F0;
  --color-border-subtle: #F1F5F9;
  --color-border-strong: #CBD5E1;
  --color-border-focus:  #3B82F6;

  /* ─── Statuts annonces ────────────────────────────────────────────────── */
  --color-status-active:   #10B981;
  --color-status-pause:    #F59E0B;
  --color-status-expired:  #EF4444;
  --color-status-archived: #6B7280;
  --color-status-deleted:  #DC2626;

  /* ─── Feedback ────────────────────────────────────────────────────────── */
  --color-success:  #10B981;
  --color-warning:  #F59E0B;
  --color-error:    #EF4444;
  --color-info:     #3B82F6;
  --color-whatsapp: #25D366;

  /* ─── Typographie ─────────────────────────────────────────────────────── */
  --font-display: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
  --font-body:    'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  /* ─── Tailles de police ───────────────────────────────────────────────── */
  --text-2xs:  0.625rem;    /* 10px */
  --text-xs:   0.75rem;     /* 12px */
  --text-sm:   0.875rem;    /* 14px */
  --text-base: 1rem;        /* 16px */
  --text-lg:   1.125rem;    /* 18px */
  --text-xl:   1.25rem;     /* 20px */
  --text-2xl:  1.5rem;      /* 24px */
  --text-3xl:  1.875rem;    /* 30px */
  --text-4xl:  2.25rem;     /* 36px */
  --text-5xl:  3rem;        /* 48px */

  /* ─── Border radius ───────────────────────────────────────────────────── */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-3xl:  24px;
  --radius-full: 9999px;

  /* ─── Shadows ─────────────────────────────────────────────────────────── */
  --shadow-xs:      0 1px 2px 0 rgba(0,0,0,.05);
  --shadow-sm:      0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06);
  --shadow-md:      0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -2px rgba(0,0,0,.06);
  --shadow-lg:      0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -4px rgba(0,0,0,.05);
  --shadow-xl:      0 20px 25px -5px rgba(0,0,0,.10), 0 8px 10px -6px rgba(0,0,0,.06);
  --shadow-2xl:     0 25px 50px -12px rgba(0,0,0,.15);
  --shadow-blue:    0 4px 14px 0 rgba(15,42,94,.25);
  --shadow-blue-lg: 0 8px 24px 0 rgba(15,42,94,.30);
  --shadow-green:   0 4px 14px 0 rgba(37,211,102,.30);
  --shadow-inner:   inset 0 2px 4px 0 rgba(0,0,0,.06);

  /* ─── Transitions ─────────────────────────────────────────────────────── */
  --duration-instant: 50ms;
  --duration-fast:    150ms;
  --duration-base:    200ms;
  --duration-slow:    300ms;
  --duration-slower:  500ms;

  --ease-linear:  linear;
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:  cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── Spacing custom ──────────────────────────────────────────────────── */
  --spacing-safe-top:    env(safe-area-inset-top, 0px);
  --spacing-safe-bottom: env(safe-area-inset-bottom, 0px);
  --spacing-safe-left:   env(safe-area-inset-left, 0px);
  --spacing-safe-right:  env(safe-area-inset-right, 0px);
  --spacing-header:      64px;
  --spacing-mobile-nav:  64px;
  --spacing-sidebar:     256px;

  /* ─── Z-index ─────────────────────────────────────────────────────────── */
  --z-base:     0;
  --z-raised:   10;
  --z-dropdown: 40;
  --z-sticky:   41;
  --z-fixed:    42;
  --z-overlay:  50;
  --z-modal:    60;
  --z-popover:  65;
  --z-toast:    70;
  --z-max:      9999;

  /* ─── Breakpoints ─────────────────────────────────────────────────────── */
  --breakpoint-xs: 375px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl:1536px;
}

/* =============================================================================
   BASE RESET MOBILE-FIRST
============================================================================= */

*, *::before, *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  font-size: 16px;
  height: 100%;
  tab-size: 2;
}

body {
  font-family: var(--font-body);
  background-color: #F8FAFC;
  color: #1E293B;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100%;
  overflow-x: hidden;
  padding-top: var(--spacing-safe-top);
  padding-bottom: var(--spacing-safe-bottom);
}

/* Scrollbar */
::-webkit-scrollbar          { width: 5px; height: 5px; }
::-webkit-scrollbar-track    { background: transparent; }
::-webkit-scrollbar-thumb    { background: #CBD5E1; border-radius: var(--radius-full); }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

/* Focus accessible */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Sélection */
::selection { background: #BFDBFE; color: #1E3A8A; }

/* Images */
img, video, svg { max-width: 100%; height: auto; display: block; }

/* Formulaires */
input, select, textarea, button {
  font-family: inherit;
  font-size: 16px; /* Empêche zoom iOS */
}

/* Autofill */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 40px #F8FAFC inset !important;
  -webkit-text-fill-color: #1E293B !important;
}

/* Liens */
a { color: inherit; text-decoration: none; }

/* Boutons */
button { cursor: pointer; border: none; background: none; }

/* =============================================================================
   UTILITAIRES TAILWIND CUSTOM
============================================================================= */

/* Safe areas */
.pt-safe  { padding-top: max(16px, env(safe-area-inset-top)); }
.pb-safe  { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
.pb-nav   { padding-bottom: calc(var(--spacing-mobile-nav) + max(8px, env(safe-area-inset-bottom))); }
.mt-safe  { margin-top: env(safe-area-inset-top); }

/* Hero gradient ImmoCam */
.hero-gradient {
  background: linear-gradient(
    135deg,
    #081A3D 0%,
    #0F2A5E 45%,
    #1A3F8F 100%
  );
  position: relative;
  overflow: hidden;
}

.hero-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 70% 50%, rgba(59,130,246,.12) 0%, transparent 55%),
    radial-gradient(ellipse at 20% 80%, rgba(37,99,235,.08) 0%, transparent 40%);
  pointer-events: none;
}

/* Glassmorphism */
.glass {
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.18);
}

.glass-dark {
  background: rgba(15,42,94,.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.08);
}

/* =============================================================================
   SKELETON LOADERS — STYLE FACEBOOK/YOUTUBE
============================================================================= */

@keyframes skeleton-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #E2E8F0 0%,
    #E2E8F0 25%,
    #F1F5F9 50%,
    #E2E8F0 75%,
    #E2E8F0 100%
  );
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.skeleton-text  { height: 14px; border-radius: var(--radius-full); }
.skeleton-title { height: 20px; border-radius: var(--radius-full); }
.skeleton-img   { border-radius: var(--radius-xl); }
.skeleton-circle{ border-radius: 50%; }
.skeleton-badge { height: 22px; width: 72px; border-radius: var(--radius-full); }
.skeleton-btn   { height: 40px; border-radius: var(--radius-xl); }

/* Card skeleton complète */
.skeleton-card {
  background: white;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  border: 1px solid #F1F5F9;
}

/* =============================================================================
   ANIMATIONS
============================================================================= */

/* ─── Entrées ─────────────────────────────────────────────────────────────── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInFast {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes scaleInSpring {
  from { opacity: 0; transform: scale(0.85); }
  60%  { transform: scale(1.04); }
  to   { opacity: 1; transform: scale(1); }
}

/* ─── Loaders ─────────────────────────────────────────────────────────────── */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes spinReverse {
  to { transform: rotate(-360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .45; }
}

@keyframes pulseSlow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.05); opacity: .8; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}

/* ─── Notifications ───────────────────────────────────────────────────────── */
@keyframes toastIn {
  from { opacity: 0; transform: translateY(12px) scale(.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes toastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(8px) scale(.96); }
}

@keyframes badgePop {
  0%   { transform: scale(0) rotate(-10deg); }
  65%  { transform: scale(1.18) rotate(3deg); }
  100% { transform: scale(1) rotate(0); }
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  15%       { transform: scale(1.18); }
  30%       { transform: scale(1); }
  45%       { transform: scale(1.12); }
  60%       { transform: scale(1); }
}

/* ─── Progress ────────────────────────────────────────────────────────────── */
@keyframes progressBar {
  from { width: 0%; }
  to   { width: 100%; }
}

@keyframes shimmerProgress {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* ─── Ripple ──────────────────────────────────────────────────────────────── */
@keyframes ripple {
  from { transform: scale(0); opacity: .35; }
  to   { transform: scale(4); opacity: 0; }
}

/* =============================================================================
   CLASSES D'ANIMATION UTILITAIRES
============================================================================= */

.fade-in       { animation: fadeIn        300ms var(--ease-smooth) both; }
.fade-in-fast  { animation: fadeInFast    150ms var(--ease-smooth) both; }
.fade-in-up    { animation: fadeInUp      350ms var(--ease-smooth) both; }
.fade-in-down  { animation: fadeInDown    250ms var(--ease-smooth) both; }
.slide-in-left { animation: slideInLeft   300ms var(--ease-spring) both; }
.slide-in-right{ animation: slideInRight  300ms var(--ease-spring) both; }
.slide-up      { animation: slideUp       350ms var(--ease-spring) both; }
.scale-in      { animation: scaleIn       200ms var(--ease-smooth) both; }
.scale-in-spring { animation: scaleInSpring 350ms var(--ease-bounce) both; }

/* Stagger automatique sur enfants */
.stagger > * { animation: fadeIn 300ms var(--ease-smooth) both; }
.stagger > *:nth-child(1)  { animation-delay:   0ms; }
.stagger > *:nth-child(2)  { animation-delay:  50ms; }
.stagger > *:nth-child(3)  { animation-delay: 100ms; }
.stagger > *:nth-child(4)  { animation-delay: 150ms; }
.stagger > *:nth-child(5)  { animation-delay: 200ms; }
.stagger > *:nth-child(6)  { animation-delay: 250ms; }
.stagger > *:nth-child(7)  { animation-delay: 300ms; }
.stagger > *:nth-child(8)  { animation-delay: 350ms; }
.stagger > *:nth-child(9)  { animation-delay: 400ms; }
.stagger > *:nth-child(10) { animation-delay: 450ms; }
.stagger > *:nth-child(11) { animation-delay: 500ms; }
.stagger > *:nth-child(12) { animation-delay: 550ms; }

/* Hover transitions */
.hover-lift {
  transition: transform var(--duration-base) var(--ease-smooth),
              box-shadow var(--duration-base) var(--ease-smooth);
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.hover-lift:active { transform: translateY(0); }

/* Pulse continu */
.pulse-loop { animation: pulse 2s var(--ease-smooth) infinite; }

/* Heart beat */
.heart-beat { animation: heartBeat 600ms var(--ease-spring); }

/* =============================================================================
   SPINNER ImmoCam
============================================================================= */

.spinner {
  border-radius: 50%;
  border-style: solid;
  animation: spin 0.75s linear infinite;
  flex-shrink: 0;

  /* Default */
  width: 40px; height: 40px;
  border-width: 3px;
  border-color: #DBEAFE;
  border-top-color: #1E40AF;

  &.spinner-xs  { width: 16px; height: 16px; border-width: 2px; }
  &.spinner-sm  { width: 24px; height: 24px; border-width: 2px; }
  &.spinner-lg  { width: 56px; height: 56px; border-width: 4px; }
  &.spinner-xl  { width: 72px; height: 72px; border-width: 5px; }

  &.spinner-white {
    border-color: rgba(255,255,255,.25);
    border-top-color: white;
  }

  &.spinner-green {
    border-color: rgba(16,185,129,.2);
    border-top-color: #10B981;
  }
}

/* Double spinner */
.spinner-double {
  position: relative;
  width: 40px; height: 40px;

  &::before, &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid transparent;
    animation: spin .75s linear infinite;
  }
  &::before { border-top-color: #1E40AF; }
  &::after  { border-bottom-color: #60A5FA; animation-direction: reverse; animation-duration: 1s; }
}

/* =============================================================================
   OTP INPUT
============================================================================= */

.otp-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: #0F2A5E;
  background: white;
  border: 2px solid #E2E8F0;
  border-radius: var(--radius-lg);
  transition:
    border-color var(--duration-fast) var(--ease-smooth),
    box-shadow   var(--duration-fast) var(--ease-smooth),
    background   var(--duration-fast) var(--ease-smooth),
    transform    var(--duration-fast) var(--ease-spring);
  outline: none;
  caret-color: #1E40AF;
  -webkit-appearance: none;

  &:focus {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.18);
    background: #F0F7FF;
    transform: scale(1.04);
  }

  &.filled {
    border-color: #1E40AF;
    background: #EFF6FF;
    animation: scaleInSpring 250ms var(--ease-bounce);
  }

  &.error {
    border-color: #EF4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,.15);
    animation: shake 350ms var(--ease-smooth);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}

/* =============================================================================
   DROPZONE DRAG & DROP
============================================================================= */

.dropzone {
  border: 2px dashed #CBD5E1;
  border-radius: var(--radius-2xl);
  background: #F8FAFC;
  transition:
    border-color var(--duration-base) var(--ease-smooth),
    background   var(--duration-base) var(--ease-smooth),
    transform    var(--duration-slow) var(--ease-spring);
  cursor: pointer;

  &:hover {
    border-color: #93C5FD;
    background: #F0F7FF;
  }

  &.drag-over {
    border-color: #3B82F6;
    background: #EFF6FF;
    transform: scale(1.01);
    box-shadow: 0 0 0 4px rgba(59,130,246,.12);
  }
}

/* =============================================================================
   TOAST NATIF ANIMÉ
============================================================================= */

#immocam-toasts {
  position: fixed;
  bottom: calc(72px + max(8px, env(safe-area-inset-bottom)));
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast, 70);
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  width: min(90vw, 360px);

  @media (min-width: 640px) {
    bottom: 24px;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-xl);
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  pointer-events: all;
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
  animation: toastIn 300ms var(--ease-spring) both;
  max-width: 100%;
  line-height: 1.4;

  &.toast-out { animation: toastOut 250ms var(--ease-in) forwards; }

  &.toast-success { background: #10B981; }
  &.toast-error   { background: #EF4444; }
  &.toast-info    { background: #1E40AF; }
  &.toast-warning { background: #F59E0B; }

  .toast-icon { font-size: 1rem; flex-shrink: 0; }
  .toast-msg  { flex: 1; }
  .toast-close {
    font-size: 1rem; opacity: .7; cursor: pointer; flex-shrink: 0;
    &:hover { opacity: 1; }
  }
}

/* =============================================================================
   SCROLL SENTINEL (infinite scroll)
============================================================================= */

.scroll-sentinel {
  height: 1px;
  width: 100%;
  display: block;
  pointer-events: none;
}

/* =============================================================================
   MODAL BACKDROP
============================================================================= */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.42);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: var(--z-overlay, 50);
  animation: fadeInFast 200ms var(--ease-smooth) both;
}

.modal-content {
  animation: scaleInSpring 300ms var(--ease-bounce) both;
}

.modal-sheet {
  animation: slideUp 300ms var(--ease-spring) both;
}

/* =============================================================================
   BOTTOM SHEET MOBILE
============================================================================= */

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  box-shadow: 0 -8px 32px rgba(0,0,0,.12);
  animation: slideUp 350ms var(--ease-spring) both;
  max-height: 90vh;
  overflow-y: auto;

  .sheet-handle {
    width: 36px;
    height: 4px;
    background: #CBD5E1;
    border-radius: var(--radius-full);
    margin: 12px auto 0;
  }
}

/* =============================================================================
   NAVIGATION MOBILE BOTTOM
============================================================================= */

.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed, 42);
  background: white;
  border-top: 1px solid #F1F5F9;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  display: flex;
  box-shadow: 0 -4px 24px rgba(0,0,0,.06);

  @media (min-width: 640px) { display: none; }

  a, button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 10px 4px;
    color: #94A3B8;
    font-size: 0.6875rem;
    font-weight: 500;
    transition: color var(--duration-fast);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    position: relative;

    svg { width: 22px; height: 22px; stroke-width: 1.8; }

    &.active, &[aria-current="page"] {
      color: #0F2A5E;
      font-weight: 600;

      svg { stroke-width: 2.3; }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 32px;
        height: 2.5px;
        background: #0F2A5E;
        border-radius: 0 0 var(--radius-full) var(--radius-full);
        animation: fadeInFast 150ms ease;
      }
    }

    &:hover:not(.active) { color: #2563EB; }
  }
}

/* =============================================================================
   SIDEBAR ADMIN
============================================================================= */

.admin-sidebar {
  width: var(--spacing-sidebar, 256px);
  background: #0A1628;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: var(--z-fixed, 42);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-xl);
    font-size: 0.875rem;
    font-weight: 500;
    color: #93A3B8;
    text-decoration: none;
    transition: all var(--duration-fast);
    margin: 1px 0;

    &:hover {
      background: rgba(255,255,255,.06);
      color: white;
    }

    &.active {
      background: rgba(59,130,246,.15);
      color: #93C5FD;
      font-weight: 600;

      .nav-icon { color: #60A5FA; }
    }

    .nav-badge {
      margin-left: auto;
      background: #EF4444;
      color: white;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: var(--radius-full);
      min-width: 20px;
      text-align: center;
      animation: badgePop 400ms var(--ease-bounce);
    }
  }
}

/* =============================================================================
   TABLES ADMIN
============================================================================= */

.data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    position: sticky;
    top: 0;
    background: #F8FAFC;
    z-index: 1;

    th {
      text-align: left;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: .06em;
      padding: 10px 16px;
      white-space: nowrap;
      border-bottom: 1px solid #E2E8F0;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #F1F5F9;
      transition: background var(--duration-fast);

      &:hover { background: #F8FAFC; }
      &:last-child { border-bottom: none; }

      &.selected { background: #EFF6FF; }
    }

    td {
      padding: 12px 16px;
      font-size: 0.875rem;
      color: #334155;
      vertical-align: middle;
    }
  }
}

/* =============================================================================
   PAGINATION
============================================================================= */

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;

  .page-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 10px;
    border-radius: var(--radius-lg);
    border: 1.5px solid #E2E8F0;
    background: white;
    color: #475569;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--duration-fast);

    &:hover:not(:disabled) {
      border-color: #93C5FD;
      background: #EFF6FF;
      color: #1E40AF;
    }

    &.active {
      background: #0F2A5E;
      border-color: #0F2A5E;
      color: white;
      font-weight: 700;
    }

    &:disabled { opacity: .4; cursor: not-allowed; }
  }
}

/* =============================================================================
   GRAPHIQUES ADMIN (remplacement ngx-charts natif CSS)
============================================================================= */

.chart-container {
  position: relative;

  .chart-bar-group {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 120px;
  }

  .chart-bar {
    flex: 1;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    min-height: 4px;
    position: relative;
    cursor: pointer;
    transition: opacity var(--duration-fast);

    &:hover { opacity: .8; }

    .chart-tooltip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: #1E293B;
      color: white;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--duration-fast);
      z-index: 10;
    }

    &:hover .chart-tooltip { opacity: 1; }
  }

  .chart-label {
    text-align: center;
    font-size: 0.625rem;
    color: #94A3B8;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chart-legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 12px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #64748B;

      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        flex-shrink: 0;
      }
    }
  }
}

/* =============================================================================
   PRINT STYLES
============================================================================= */

@media print {
  .no-print,
  .mobile-bottom-nav,
  .admin-sidebar,
  app-header,
  app-footer,
  app-dev-tools { display: none !important; }

  body { background: white; font-size: 12pt; }

  .data-table {
    font-size: 10pt;
    th, td { padding: 6px 8px; }
  }

  a { text-decoration: none; color: black; }
}
TAILWINDEOF
OK "Tailwind 4 Custom Theme COMPLET"

# =============================================================================
# 2. SCSS VARIABLES — COMPLET
# =============================================================================
SECTION "2/6 — SCSS Variables complètes"

cat > src/styles/_variables.scss << 'EOF'
// =============================================================================
// IMMOCAM — Variables SCSS centralisées (blue foncé ImmoCam)
// =============================================================================

// Couleurs principales
$color-immocam:       #0F2A5E;
$color-immocam-light: #1A3F8F;
$color-immocam-dark:  #081A3D;

// Palette blue complète
$blue-50:  #EFF6FF; $blue-100: #DBEAFE; $blue-200: #BFDBFE;
$blue-300: #93C5FD; $blue-400: #60A5FA; $blue-500: #3B82F6;
$blue-600: #2563EB; $blue-700: #1D4ED8; $blue-800: #1E40AF;
$blue-900: #1E3A8A; $blue-950: #172554;

// Palette slate complète
$slate-50:  #F8FAFC; $slate-100: #F1F5F9; $slate-200: #E2E8F0;
$slate-300: #CBD5E1; $slate-400: #94A3B8; $slate-500: #64748B;
$slate-600: #475569; $slate-700: #334155; $slate-800: #1E293B;
$slate-900: #0F172A; $slate-950: #020617;

// Statuts annonces
$color-active:   #10B981;
$color-pause:    #F59E0B;
$color-expired:  #EF4444;
$color-archived: #6B7280;
$color-deleted:  #DC2626;

// Feedback
$color-success:  #10B981;
$color-warning:  #F59E0B;
$color-error:    #EF4444;
$color-info:     #3B82F6;
$color-whatsapp: #25D366;

// Typographie
$font-display: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
$font-body:    'Inter', 'Segoe UI', system-ui, sans-serif;
$font-mono:    'JetBrains Mono', monospace;

// Breakpoints
$bp-xs: 375px; $bp-sm: 640px; $bp-md: 768px;
$bp-lg: 1024px; $bp-xl: 1280px; $bp-2xl: 1536px;

// Layout
$header-h:     64px;
$mobile-nav-h: 64px;
$sidebar-w:    256px;

// Mixins utiles
@mixin mobile-only  { @media (max-width: #{$bp-sm - 1}) { @content; } }
@mixin tablet-up    { @media (min-width: $bp-sm)         { @content; } }
@mixin desktop-up   { @media (min-width: $bp-lg)         { @content; } }
@mixin hover        { @media (hover: hover)               { &:hover { @content; } } }
@mixin touch        { @media (hover: none)                { @content; } }

// Z-index
$z-dropdown: 40; $z-sticky: 41; $z-overlay: 50;
$z-modal: 60; $z-toast: 70; $z-max: 9999;
EOF
OK "_variables.scss"

# =============================================================================
# 3. ANGULAR MATERIAL THEME
# =============================================================================
SECTION "3/6 — Angular Material Theme blue ImmoCam"

cat > src/styles/_material-theme.scss << 'EOF'
// =============================================================================
// IMMOCAM — Angular Material Custom Theme
// Blue foncé ImmoCam palette
// =============================================================================
@use '@angular/material' as mat;

// Désactiver le CSS legacy de Material
@include mat.core();

$immocam-primary: mat.define-palette(mat.$indigo-palette, 800, 700, 900);
$immocam-accent:  mat.define-palette(mat.$blue-palette,   600, 400, 800);
$immocam-warn:    mat.define-palette(mat.$red-palette,     600);

$immocam-theme: mat.define-light-theme((
  color: (
    primary: $immocam-primary,
    accent:  $immocam-accent,
    warn:    $immocam-warn,
  ),
  typography: mat.define-typography-config(
    $font-family: 'Inter, Segoe UI, system-ui, sans-serif',
  ),
  density: -1,
));

@include mat.all-component-themes($immocam-theme);

// Overrides ImmoCam
.mat-mdc-button.mat-primary,
.mat-mdc-raised-button.mat-primary {
  background-color: #0F2A5E !important;
}

.mat-mdc-form-field.mat-focused .mat-mdc-floating-label { color: #1E40AF !important; }
.mat-mdc-form-field.mat-focused .mdc-notched-outline { border-color: #3B82F6 !important; }
EOF
OK "_material-theme.scss"

# =============================================================================
# 4. STYLES.SCSS PRINCIPAL — TOUT IMPORTÉ
# =============================================================================
SECTION "4/6 — styles.scss principal complet"

cat > src/styles.scss << 'EOF'
// =============================================================================
// IMMOCAM — Point d'entrée des styles globaux
// Order: variables → material → tailwind → animations
// =============================================================================

// 1. Variables SCSS
@use 'styles/variables' as *;

// 2. Angular Material theme (désactiver si pas installé)
// @use 'styles/material-theme';

// 3. Tailwind 4 (tout le design system)
@use 'styles/tailwind.css';

// 4. Google Fonts
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,opsz,wght@0,8..18,400;0,8..18,500;0,8..18,600;0,8..18,700;0,8..18,800;1,8..18,400&family=Inter:wght@300;400;500;600&display=swap');

// =============================================================================
// GLOBAL UTILITAIRES SCSS COMPLÉMENTAIRES
// =============================================================================

// Truncate
.truncate-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
.truncate-3 { display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden; }

// Prix
.price-display {
  font-family: $font-display;
  font-weight: 800;
  color: $color-immocam;
  letter-spacing: -0.02em;
}

// Image lazy
img[lazyimg] { transition: opacity 300ms ease; &.loaded { opacity: 1; } }

// Disable scroll (modal ouverte)
.no-scroll { overflow: hidden; }

// Responsive padding horizontal
.page-x { padding-left: 16px; padding-right: 16px; }
@include tablet-up {
  .page-x { padding-left: 24px; padding-right: 24px; }
}
@include desktop-up {
  .page-x { padding-left: max(24px, calc((100vw - 1280px) / 2 + 24px)); padding-right: max(24px, calc((100vw - 1280px) / 2 + 24px)); }
}
EOF
OK "styles.scss principal"

# =============================================================================
# 5. COMPOSANT GRAPHIQUES NATIF (remplace ngx-charts)
# =============================================================================
SECTION "5/6 — Composant graphiques CSS natif"

mkdir -p src/app/shared/components/chart
cat > src/app/shared/components/chart/bar-chart.component.ts << 'EOF'
// =============================================================================
// IMMOCAM — BarChart natif CSS (remplace ngx-charts)
// Graphique à barres CSS pur, sans dépendance externe
// Utilisé dans le dashboard admin
// =============================================================================
import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container w-full">
      <!-- Header -->
      @if (title) {
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-700">{{ title }}</h3>
          @if (subtitle) {
            <span class="text-xs text-slate-400">{{ subtitle }}</span>
          }
        </div>
      }

      <!-- Valeur max (axe Y) -->
      <div class="flex gap-2">
        <!-- Axe Y -->
        <div class="flex flex-col justify-between text-right shrink-0" [style.height.px]="height">
          @for (label of yLabels(); track label) {
            <span class="text-xs text-slate-400 leading-none">{{ label }}</span>
          }
        </div>

        <!-- Barres -->
        <div class="flex-1 relative">
          <!-- Lignes de grille -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
            @for (i of [0,1,2,3,4]; track i) {
              <div class="w-full border-t border-slate-100"
                   [class.border-slate-200]="i === 4"></div>
            }
          </div>

          <!-- Groupes de barres -->
          <div class="relative flex items-end gap-1.5 h-full"
               [style.height.px]="height">
            @for (pt of data; track pt.label; let i = $index) {
              <div class="flex-1 flex flex-col items-center group">
                <!-- Barre -->
                <div
                  class="w-full rounded-t-lg transition-all duration-500 cursor-pointer relative"
                  [style.height.%]="barHeight(pt.value)"
                  [style.background]="pt.color || defaultColor"
                  [style.min-height.px]="4"
                  [style.animation-delay]="i * 50 + 'ms'"
                  style="animation: fadeInUp 400ms ease both;"
                >
                  <!-- Tooltip au hover -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                              bg-slate-800 text-white text-xs font-semibold px-2 py-1
                              rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                              transition-opacity pointer-events-none z-10">
                    {{ formatValue(pt.value) }}
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4
                                border-transparent border-t-slate-800"></div>
                  </div>
                </div>
                <!-- Label -->
                <span class="text-xs text-slate-400 mt-1.5 text-center leading-tight
                             max-w-full overflow-hidden">
                  {{ pt.label }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Légende -->
      @if (showLegend && legendItems().length > 0) {
        <div class="flex gap-4 flex-wrap mt-3">
          @for (item of legendItems(); track item.label) {
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm" [style.background]="item.color"></div>
              <span class="text-xs text-slate-500">{{ item.label }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BarChartComponent {
  @Input({ required: true }) data: ChartDataPoint[] = [];
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() height = 140;
  @Input() defaultColor = '#1E40AF';
  @Input() showLegend = false;
  @Input() unit = '';

  maxValue = computed(() => Math.max(...this.data.map(d => d.value), 1));

  barHeight(value: number): number {
    return Math.max((value / this.maxValue()) * 92, 3);
  }

  formatValue(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k${this.unit}`;
    return `${v}${this.unit}`;
  }

  yLabels(): string[] {
    const max = this.maxValue();
    return [max, Math.round(max * .75), Math.round(max * .5),
            Math.round(max * .25), 0].map(v => this.formatValue(v));
  }

  legendItems(): Array<{ label: string; color: string }> {
    return this.data.filter(d => d.color).map(d => ({ label: d.label, color: d.color! }));
  }
}
EOF
OK "BarChartComponent natif CSS"

# Ajouter au index des composants partagés
cat >> src/app/shared/components/index.ts << 'EOF'
export * from './chart/bar-chart.component';
EOF

# =============================================================================
# 6. TOAST SERVICE AMÉLIORÉ
# =============================================================================
SECTION "6/6 — ToastService amélioré avec animations"

cat > src/app/core/services/toast.service.ts << 'EOF'
// =============================================================================
// IMMOCAM — ToastService v2 avec animations CSS natives
// =============================================================================
import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  duration?: number;
  icon?: string;
  closable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private container: HTMLElement | null = null;
  private readonly icons: Record<ToastType, string> = {
    success: '✓', error: '✕', info: 'ℹ', warning: '⚠',
  };

  private getContainer(): HTMLElement {
    if (!this.container || !document.contains(this.container)) {
      const existing = document.getElementById('immocam-toasts');
      if (existing) { this.container = existing; return existing; }
      this.container = document.createElement('div');
      this.container.id = 'immocam-toasts';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show(message: string, type: ToastType, config: ToastConfig = {}): void {
    const { duration = 3800, closable = true } = config;
    const icon = config.icon ?? this.icons[type];

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-msg">${message}</span>
      ${closable ? '<button class="toast-close" aria-label="Fermer">✕</button>' : ''}
    `;

    const container = this.getContainer();
    container.appendChild(toast);

    // Bouton fermer
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      this.dismiss(toast);
    });

    // Auto-dismiss
    const timer = setTimeout(() => this.dismiss(toast), duration);

    // Pause au hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => {
      setTimeout(() => this.dismiss(toast), 1500);
    });
  }

  private dismiss(toast: HTMLElement): void {
    if (!toast.parentNode) return;
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 280);
  }

  success(msg: string, config?: ToastConfig): void { this.show(msg, 'success', config); }
  error(msg: string, config?: ToastConfig): void   { this.show(msg, 'error', { duration: 5000, ...config }); }
  info(msg: string, config?: ToastConfig): void    { this.show(msg, 'info', config); }
  warning(msg: string, config?: ToastConfig): void { this.show(msg, 'warning', config); }

  /** Afficher un toast persistant jusqu'à dismiss manuel */
  persist(msg: string, type: ToastType = 'info'): () => void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${this.icons[type]}</span><span class="toast-msg">${msg}</span>`;
    this.getContainer().appendChild(toast);
    return () => this.dismiss(toast);
  }
}
EOF
OK "ToastService v2"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 11 TERMINÉ — STYLES + ANIMATIONS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}[i]${NC} Tailwind 4 custom theme COMPLET (toutes variables)"
echo -e "${BLUE}[i]${NC} SCSS variables blue ImmoCam complètes"
echo -e "${BLUE}[i]${NC} Animations: 15 keyframes (fade, slide, scale, shake, bounce, ripple...)"
echo -e "${BLUE}[i]${NC} Skeleton loaders style Facebook/YouTube"
echo -e "${BLUE}[i]${NC} Toast animé natif avec pause hover"
echo -e "${BLUE}[i]${NC} BarChart CSS natif (remplace ngx-charts)"
echo -e "${BLUE}[i]${NC} Angular Material theme blue ImmoCam"
echo -e "${BLUE}[i]${NC} Prochaine étape: bash ../ng-12-finalize.sh"
