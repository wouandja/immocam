package com.mbem.immocam.shared.enums;

/**
 * Cycle de vie d'une annonce immobiliere ImmoCam.
 *
 * Seul le statut ACTIVE est visible du public.
 *
 * Transitions :
 *   [Formulaire] -> ACTIVE  (publication directe, sans moderation)
 *   ACTIVE       -> EN_PAUSE | EXPIREE(J0) | ARCHIVEE | SUPPRIMEE | SUPPRIMEE_ADMIN
 *   EN_PAUSE     -> ACTIVE (reactivation) | ARCHIVEE
 *   EXPIREE      -> ACTIVE (renouvellement) | SUPPRIMEE_SYSTEME(J+7)
 */
public enum StatutAnnonce {
    /** Legacy — plus jamais attribué par le code (publication directe), mais conservé pour les annonces existantes en base avec ce statut. */
    EN_ATTENTE_VALIDATION,
    ACTIVE,
    EN_PAUSE,
    EXPIREE,
    ARCHIVEE,
    SUPPRIMEE,
    SUPPRIMEE_ADMIN,
    SUPPRIMEE_SYSTEME
}
