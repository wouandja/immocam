// =============================================================================
// IMMOCAM — Environment Développement
// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE MOCK/API : modifier useMock ci-dessous
//   useMock: true  → données simulées (présentation, démo, dev offline)
//   useMock: false → appels API réels vers Spring Boot
// =============================================================================
export const environment = {
  production: false,

  // ← CHANGER ICI pour basculer entre mock et API réelle
  useMock: false,

  // URL du backend Spring Boot (port 1010)
  apiUrl: 'http://localhost:1010/api',

  // Délai simulé en ms (mode mock uniquement)
  mockDelay: 700,

  // JWT
  jwtRefreshBuffer: 60,       // secondes avant expiration pour refresh

  // Pagination
  defaultPageSize: 12,

  // WhatsApp
  whatsappBaseUrl: 'https://wa.me/',

  // Limites (doit correspondre à la config Spring Boot)
  maxPhotosPerAnnonce:   4,
  maxAnnoncesActives:    5,
  maxCommentLength:    500,
  minCommentLength:      5,
  maxDescriptionLength:1000,
  minDescriptionLength:  30,
  minPrix:            1000,

  // Timeouts
  requestTimeout: 30000,

  // Logging
  enableLogging: true,
  logApiCalls: true as boolean,  // ← Typage explicite

  // Versions
  version: '1.0.0',
  buildDate: new Date().toISOString(),
} as const;
