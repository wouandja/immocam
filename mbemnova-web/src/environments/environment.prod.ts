// =============================================================================
// Bailocam — Environnement PRODUCTION
// Domaine : https://bailocam.com
// =============================================================================

export const environment = {
  production: true,

  apiUrl: 'https://bailocam.com/api',

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
   useMock: false,

  // Logging
  enableLogging: true,
  logApiCalls: true as boolean,  // ← Typage explicite

  // Versions
  version: '1.0.0',
  buildDate: new Date().toISOString(),
} as const;