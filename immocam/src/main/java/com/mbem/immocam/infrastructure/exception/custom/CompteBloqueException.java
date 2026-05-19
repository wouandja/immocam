package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Compte temporairement bloqué suite à des tentatives échouées (403).
 * Blocage de 30 minutes après 5 tentatives incorrectes en 15 min.
 *
 * @author MBEMNOVA
 */
public class CompteBloqueException extends RuntimeException {
    public CompteBloqueException(String message) {
        super(message);
    }
}
