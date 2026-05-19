package com.mbem.immocam.shared.enums;

/**
 * Statuts possibles d'un compte utilisateur.
 */
public enum StatutCompte {
    /** Email non encore valide apres inscription. */
    NON_VERIFIE,
    /** Compte actif et operationnel. */
    ACTIF,
    /** Suspendu temporairement par l'admin. Annonces masquees. Reversible. */
    SUSPENDU,
    /** Banni definitivement. Annonces supprimees. Irreversible via l'API. */
    BANNI
}
