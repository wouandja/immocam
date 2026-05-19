// =============================================================================
// ImmoCam — Environnement PRODUCTION
//
// SANS NOM DE DOMAINE : l'API est accessible via IP:PORT du VPS
//
// ╔══════════════════════════════════════════════════════════════╗
// ║  QUAND VOUS AUREZ UN NOM DE DOMAINE :                        ║
// ║  1. Remplacez l'IP par votre domaine dans apiUrl             ║
// ║  2. Passez http → https                                      ║
// ║  3. Supprimez le commentaire "TODO: domaine"                 ║
// ║  Exemple: apiUrl: 'https://immocam.cm/api'                   ║
// ╚══════════════════════════════════════════════════════════════╝
//
// TODO: domaine — remplacer par https://VOTRE_DOMAINE/api
// =============================================================================

export const environment = {
  production: true,

  // ── Remplacez VPS_IP_ADDRESS par l'IP réelle de votre VPS ──
  // Le frontend tourne sur le port 4202, le backend sur 1011
  // Le nginx interne du frontend proxifie /api → backend:1010
  // MAIS depuis le navigateur client, l'appel va vers le VPS directement
  // Donc apiUrl pointe vers l'IP publique du VPS + port backend exposé
  apiUrl: 'http://62.169.29.140:1011/api',

  // TODO domaine : apiUrl: 'https://VOTRE_DOMAINE/api',
};
