package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Ressource introuvable (404).
 * Ex : annonce inexistante, utilisateur non trouvé.
 *
 * @author MBEMNOVA
 */
public class RessourceNotFoundException extends RuntimeException {
    public RessourceNotFoundException(String message) {
        super(message);
    }
    public RessourceNotFoundException(String ressource, Long id) {
        super(ressource + " introuvable avec l'id : " + id);
    }
}
