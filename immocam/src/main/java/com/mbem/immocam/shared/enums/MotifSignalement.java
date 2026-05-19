package com.mbem.immocam.shared.enums;

/**
 * Motifs disponibles lors du signalement d'une annonce.
 * Connexion obligatoire pour signaler.
 */
public enum MotifSignalement {
    ANNONCE_FRAUDULEUSE,
    PHOTOS_NON_CONFORMES,
    PRIX_INCORRECT,
    BIEN_DEJA_LOUE_VENDU,
    CONTENU_INAPPROPRIE,
    /** Autre motif : champ texte libre obligatoire. */
    AUTRE
}
