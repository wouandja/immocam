package com.mbem.immocam.shared.enums;

/**
 * Statuts possibles d'un signalement.
 *
 * EN_ATTENTE          → nouveau, à traiter
 * IGNORE              → admin a décidé de ne pas agir
 * TRAITE_INFO         → admin a pris note sans action (ex: avertissement)
 * TRAITE_PAUSE        → admin a mis l'annonce en pause
 * TRAITE_SUPPRESSION  → admin a supprimé l'annonce
 * TRAITE_SUSPENSION   → admin a suspendu le propriétaire
 * TRAITE_BANNISSEMENT → admin a banni le propriétaire
 */
public enum StatutSignalement {
    EN_ATTENTE,
    IGNORE,
    TRAITE_INFO,
    TRAITE_PAUSE,
    TRAITE_SUPPRESSION,
    TRAITE_SUSPENSION,
    TRAITE_BANNISSEMENT
}