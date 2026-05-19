package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Accès non autorisé (403).
 * Ex : tentative de modifier l'annonce d'un autre propriétaire.
 *
 * @author MBEMNOVA
 */
public class AccesRefuseException extends RuntimeException {
    public AccesRefuseException(String message) {
        super(message);
    }
}
